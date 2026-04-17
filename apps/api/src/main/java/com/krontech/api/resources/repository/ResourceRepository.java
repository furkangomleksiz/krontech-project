package com.krontech.api.resources.repository;

import com.krontech.api.localization.LocaleCode;
import com.krontech.api.publishing.PublishStatus;
import com.krontech.api.resources.entity.ResourceItem;
import com.krontech.api.resources.entity.ResourceType;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResourceRepository extends JpaRepository<ResourceItem, UUID> {

    List<ResourceItem> findByLocaleAndStatus(LocaleCode locale, PublishStatus status, Pageable pageable);

    List<ResourceItem> findByLocaleAndStatusAndResourceType(
            LocaleCode locale, PublishStatus status, ResourceType resourceType, Pageable pageable);
}
