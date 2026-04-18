package com.krontech.api.media.service;

import com.krontech.api.media.dto.MediaAdminResponse;
import com.krontech.api.media.dto.MediaRegisterRequest;
import com.krontech.api.media.dto.MediaUpdateRequest;
import com.krontech.api.media.entity.MediaAsset;
import com.krontech.api.media.repository.MediaAssetRepository;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MediaAdminService {

    private final MediaAssetRepository mediaAssetRepository;
    private final ObjectStorageClient objectStorageClient;

    public MediaAdminService(
            MediaAssetRepository mediaAssetRepository,
            ObjectStorageClient objectStorageClient
    ) {
        this.mediaAssetRepository = mediaAssetRepository;
        this.objectStorageClient = objectStorageClient;
    }

    public Page<MediaAdminResponse> list(String mimeTypeFilter, Pageable pageable) {
        if (mimeTypeFilter != null && !mimeTypeFilter.isBlank()) {
            return mediaAssetRepository.findAllByMimeTypeStartingWith(mimeTypeFilter, pageable).map(this::toResponse);
        }
        return mediaAssetRepository.findAll(pageable).map(this::toResponse);
    }

    public MediaAdminResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    /**
     * Registers a media asset that has already been uploaded to S3/MinIO.
     * Prevents duplicate registration of the same objectKey.
     */
    public MediaAdminResponse register(MediaRegisterRequest request) {
        if (mediaAssetRepository.findByObjectKey(request.objectKey()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A media asset with this objectKey already exists.");
        }
        MediaAsset asset = new MediaAsset();
        asset.setObjectKey(request.objectKey());
        asset.setFileName(request.fileName());
        asset.setMimeType(request.mimeType());
        asset.setSizeBytes(request.sizeBytes());
        asset.setAltText(request.altText());
        asset.setWidth(request.width());
        asset.setHeight(request.height());
        return toResponse(mediaAssetRepository.save(asset));
    }

    public MediaAdminResponse update(UUID id, MediaUpdateRequest request) {
        MediaAsset asset = findOrThrow(id);
        asset.setAltText(request.altText());
        asset.setWidth(request.width());
        asset.setHeight(request.height());
        return toResponse(mediaAssetRepository.save(asset));
    }

    public void delete(UUID id) {
        MediaAsset asset = findOrThrow(id);
        mediaAssetRepository.delete(asset);
    }

    private MediaAsset findOrThrow(UUID id) {
        return mediaAssetRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Media asset not found."));
    }

    private MediaAdminResponse toResponse(MediaAsset asset) {
        return new MediaAdminResponse(
                asset.getId(),
                asset.getObjectKey(),
                objectStorageClient.buildPublicUrl(asset.getObjectKey()),
                asset.getFileName(),
                asset.getMimeType(),
                asset.getSizeBytes(),
                asset.getAltText(),
                asset.getWidth(),
                asset.getHeight(),
                asset.getCreatedAt(),
                asset.getUpdatedAt()
        );
    }
}
