package com.krontech.api.media.repository;

import com.krontech.api.media.entity.MediaAsset;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MediaAssetRepository extends JpaRepository<MediaAsset, UUID> {

    Optional<MediaAsset> findByObjectKey(String objectKey);

    List<MediaAsset> findAllByObjectKeyIn(Collection<String> objectKeys);

    Page<MediaAsset> findAllByMimeTypeStartingWith(String mimeTypePrefix, Pageable pageable);
}
