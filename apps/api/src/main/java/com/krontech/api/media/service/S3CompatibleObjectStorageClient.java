package com.krontech.api.media.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class S3CompatibleObjectStorageClient implements ObjectStorageClient {

    private final String endpoint;
    private final String bucket;

    public S3CompatibleObjectStorageClient(
            @Value("${S3_ENDPOINT:http://localhost:9000}") String endpoint,
            @Value("${S3_BUCKET:media}") String bucket
    ) {
        this.endpoint = endpoint;
        this.bucket = bucket;
    }

    @Override
    public String buildPublicUrl(String objectKey) {
        return "%s/%s/%s".formatted(endpoint, bucket, objectKey);
    }
}
