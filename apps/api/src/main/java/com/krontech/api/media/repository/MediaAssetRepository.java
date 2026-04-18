package com.krontech.api.media.repository;

import com.krontech.api.media.entity.MediaAsset;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MediaAssetRepository extends JpaRepository<MediaAsset, UUID> {

    Optional<MediaAsset> findByObjectKey(String objectKey);

    Page<MediaAsset> findAllByMimeTypeStartingWith(String mimeTypePrefix, Pageable pageable);
}
