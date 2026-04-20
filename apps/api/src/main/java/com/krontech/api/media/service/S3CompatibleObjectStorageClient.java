package com.krontech.api.media.service;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.net.URI;
import software.amazon.awssdk.core.ResponseInputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.PutBucketPolicyRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

/**
 * S3-compatible object storage client backed by the AWS SDK v2.
 *
 * <p><strong>Local development:</strong> points at MinIO (docker-compose).
 * Path-style access is enabled by default ({@code S3_FORCE_PATH_STYLE=true}) because
 * MinIO requires it and AWS SDK v2's virtual-hosted style does not apply to MinIO.
 *
 * <p><strong>Production (AWS S3):</strong> set the following env vars:
 * <pre>
 *   S3_ENDPOINT=https://s3.amazonaws.com   # or omit to use SDK default
 *   S3_REGION=eu-central-1
 *   S3_ACCESS_KEY=AKIA...
 *   S3_SECRET_KEY=...
 *   S3_BUCKET=krontech-media
 *   S3_FORCE_PATH_STYLE=false              # virtual-hosted style for real S3
 *   S3_PUBLIC_ENDPOINT=https://cdn.krontech.com.tr  # CDN or bucket URL
 * </pre>
 *
 * <p><strong>Bucket initialization:</strong> on startup, this client calls HeadBucket to check
 * whether the configured bucket exists.  If it does not, it is created and a public-read bucket
 * policy is applied so uploaded objects are accessible without credentials.  If the S3 endpoint
 * is unreachable at startup, a warning is logged and the application starts normally — upload
 * requests will fail at runtime until storage is available.
 */
@Component
public class S3CompatibleObjectStorageClient implements ObjectStorageClient {

    private static final Logger log = LoggerFactory.getLogger(S3CompatibleObjectStorageClient.class);

    private final S3Client s3Client;
    private final String bucket;
    private final String publicEndpoint;

    public S3CompatibleObjectStorageClient(
            @Value("${app.storage.endpoint:http://localhost:9000}") String endpoint,
            @Value("${app.storage.bucket:media}") String bucket,
            @Value("${app.storage.access-key:minio}") String accessKey,
            @Value("${app.storage.secret-key:minio123}") String secretKey,
            @Value("${app.storage.region:us-east-1}") String region,
            @Value("${app.storage.force-path-style:true}") boolean forcePathStyle,
            // Public endpoint defaults to the same as the internal endpoint.
            // Override with a CDN URL in production (e.g. https://cdn.krontech.com.tr).
            @Value("${app.storage.public-endpoint:}") String publicEndpointOverride
    ) {
        this.bucket = bucket;
        this.publicEndpoint = publicEndpointOverride.isBlank() ? endpoint : publicEndpointOverride;

        this.s3Client = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)
                ))
                .region(Region.of(region))
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(forcePathStyle)
                        .build())
                .build();
    }

    /**
     * Ensures the storage bucket exists, creating it if necessary.
     * Failures are non-fatal — the app will start even if MinIO is temporarily down.
     */
    @PostConstruct
    void ensureBucketExists() {
        try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
            log.info("Object storage bucket '{}' is ready.", bucket);
        } catch (NoSuchBucketException e) {
            log.info("Bucket '{}' not found — creating it.", bucket);
            s3Client.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
            applyPublicReadPolicy();
            log.info("Bucket '{}' created with public-read policy.", bucket);
        } catch (Exception e) {
            // Storage unreachable (MinIO not started yet, wrong credentials, etc.).
            // Log a warning and continue — uploads will fail at request time with a clear error.
            log.warn(
                    "Object storage check failed for bucket '{}': {}. "
                    + "Make sure MinIO is running (docker compose up -d). "
                    + "Upload endpoints will return 503 until storage is reachable.",
                    bucket, e.getMessage()
            );
        }
    }

    @Override
    public String buildPublicUrl(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) {
            return null;
        }
        // Keys occasionally arrive with leading/trailing spaces from forms; a leading space
        // breaks the URL path (e.g. ".../media/ uploads/..." instead of ".../media/uploads/...").
        String key = objectKey.strip();
        if (key.isEmpty()) {
            return null;
        }
        return publicEndpoint.stripTrailing() + "/" + bucket + "/" + key;
    }

    @Override
    public void upload(String objectKey, InputStream data, String contentType, long contentLength) {
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(objectKey)
                .contentType(contentType != null ? contentType : "application/octet-stream")
                .contentLength(contentLength)
                .build();
        s3Client.putObject(request, RequestBody.fromInputStream(data, contentLength));
        log.debug("Uploaded object '{}' ({} bytes) to bucket '{}'.", objectKey, contentLength, bucket);
    }

    @Override
    public void delete(String objectKey) {
        s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(objectKey).build());
        log.debug("Deleted object '{}' from bucket '{}'.", objectKey, bucket);
    }

    @Override
    public byte[] getObjectAsBytes(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) {
            throw new IllegalArgumentException("objectKey is required");
        }
        String key = objectKey.strip();
        try (ResponseInputStream<GetObjectResponse> in = s3Client.getObject(
                GetObjectRequest.builder().bucket(bucket).key(key).build())) {
            return in.readAllBytes();
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to read object '" + key + "'", e);
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /** Applies a bucket policy granting anonymous GET access to all objects. */
    private void applyPublicReadPolicy() {
        String policy = """
                {
                  "Version": "2012-10-17",
                  "Statement": [
                    {
                      "Effect": "Allow",
                      "Principal": {"AWS": ["*"]},
                      "Action": ["s3:GetObject"],
                      "Resource": ["arn:aws:s3:::%s/*"]
                    }
                  ]
                }
                """.formatted(bucket).stripIndent().strip();

        s3Client.putBucketPolicy(PutBucketPolicyRequest.builder()
                .bucket(bucket)
                .policy(policy)
                .build());
    }
}
