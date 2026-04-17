package com.krontech.api.publishing.service;

import com.krontech.api.localization.LocaleCode;
import com.krontech.api.pages.entity.Page;
import com.krontech.api.pages.repository.PageRepository;
import com.krontech.api.publishing.PublishStatus;
import com.krontech.api.publishing.dto.PublishPageRequest;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class PublishingService {

    private final PageRepository pageRepository;
    private final StringRedisTemplate redisTemplate;

    public PublishingService(PageRepository pageRepository, StringRedisTemplate redisTemplate) {
        this.pageRepository = pageRepository;
        this.redisTemplate = redisTemplate;
    }

    public void publish(PublishPageRequest request) {
        LocaleCode localeCode = LocaleCode.valueOf(request.locale().toUpperCase());

        Optional<Page> candidate = pageRepository.findBySlugAndLocaleAndStatus(
                request.slug(), localeCode, PublishStatus.DRAFT);
        if (candidate.isEmpty()) {
            candidate = pageRepository.findBySlugAndLocaleAndStatus(
                    request.slug(), localeCode, PublishStatus.SCHEDULED);
        }

        Page page = candidate.orElseThrow(
                () -> new IllegalArgumentException("No publishable page found for slug=" + request.slug()));

        page.setStatus(PublishStatus.PUBLISHED);
        page.setPublishedAt(Instant.now());
        pageRepository.save(page);

        redisTemplate.delete("cache:page:" + request.locale() + ":" + request.slug());
    }
}
