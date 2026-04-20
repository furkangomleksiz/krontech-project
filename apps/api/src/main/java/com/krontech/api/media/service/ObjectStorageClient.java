package com.krontech.api.media.service;

import java.io.InputStream;

/**
 * Abstraction over S3-compatible object storage.
 *
 * The single production implementation ({@link S3CompatibleObjectStorageClient}) targets
 * MinIO in local dev and AWS S3 in production via the AWS SDK v2.  Alternative
 * implementations (Azure Blob, GCS, local filesystem) can be substituted without changing
 * callers.
 *
 * <p>Thread-safety: all implementations must be thread-safe; Spring registers them as singletons.
 */
public interface ObjectStorageClient {

    /**
     * Returns the public (browser-accessible) URL for an object.
     * Does not verify that the object exists.
     *
     * @param objectKey Storage key within the configured bucket (e.g. {@code uploads/2026/04/uuid.jpg}).
     * @return Fully-qualified URL that any HTTP client can GET without credentials.
     */
    String buildPublicUrl(String objectKey);

    /**
     * Uploads an object to storage.
     *
     * <p>The caller must ensure {@code data} is fully readable (not already consumed)
     * and is responsible for closing the stream after this method returns or throws.
     *
     * @param objectKey     Destination key within the configured bucket.
     * @param data          Payload stream.
     * @param contentType   MIME type (e.g. {@code "image/jpeg"}).
     * @param contentLength Exact byte length of the payload; required by most S3 implementations
     *                      to avoid buffering the entire stream in memory.
     * @throws RuntimeException if the upload fails for any reason.
     */
    void upload(String objectKey, InputStream data, String contentType, long contentLength);

    /**
     * Deletes an object from storage.
     * Silently succeeds if the object does not exist (idempotent).
     *
     * @param objectKey Key of the object to delete.
     * @throws RuntimeException if the storage call itself fails (e.g. network error).
     */
    void delete(String objectKey);

    /**
     * Downloads an object in full. Intended for small-to-medium blobs (e.g. PDFs for thumbnail generation).
     *
     * @throws RuntimeException if the object is missing or the request fails.
     */
    byte[] getObjectAsBytes(String objectKey);
}
