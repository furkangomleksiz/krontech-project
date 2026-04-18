package com.krontech.api.publishing.service;

import com.krontech.api.pages.entity.Page;
import com.krontech.api.pages.repository.PageRepository;
import com.krontech.api.publishing.PublishStatus;
import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Periodically promotes SCHEDULED pages whose scheduledAt time has passed.
 *
 * Runs every 60 seconds by default (configurable via app.publishing.scheduler-delay-ms).
 * The actor recorded in the audit log is "system" since no user context is present.
 *
 * In a multi-instance deployment this job could fire on multiple nodes simultaneously.
 * For this first pass that is acceptable; a distributed lock (e.g. Redisson) can be
 * added later if needed.
 */
@Service
public class ScheduledPublishingService {

    private static final Logger log = LoggerFactory.getLogger(ScheduledPublishingService.class);

    private final PageRepository pageRepository;
    private final PublishingService publishingService;

    public ScheduledPublishingService(
            PageRepository pageRepository,
            PublishingService publishingService
    ) {
        this.pageRepository = pageRepository;
        this.publishingService = publishingService;
    }

    @Scheduled(fixedDelayString = "${app.publishing.scheduler-delay-ms:60000}")
    public void promoteScheduledPages() {
        List<Page> due = pageRepository.findByStatusAndScheduledAtBefore(PublishStatus.SCHEDULED, Instant.now());

        if (due.isEmpty()) {
            return;
        }

        log.info("scheduled_publish_run promoting={}", due.size());

        for (Page page : due) {
            try {
                publishingService.promoteToPublished(page);
                log.info("scheduled_publish_ok id={} slug={}", page.getId(), page.getSlug());
            } catch (Exception e) {
                log.error("scheduled_publish_failed id={} slug={} reason={}",
                        page.getId(), page.getSlug(), e.getMessage());
            }
        }
    }
}
