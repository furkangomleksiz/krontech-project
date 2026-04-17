package com.krontech.api.components.repository;

import com.krontech.api.components.entity.ContentBlock;
import com.krontech.api.pages.entity.Page;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContentBlockRepository extends JpaRepository<ContentBlock, UUID> {

    /** Returns all blocks for a page ordered for rendering. */
    List<ContentBlock> findByPageOrderBySortOrderAsc(Page page);

    /** Useful for cleanup when a page is deleted. */
    void deleteByPage(Page page);
}
