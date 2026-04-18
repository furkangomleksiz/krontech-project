package com.krontech.api.publishing;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.krontech.api.audit.service.AuditService;
import com.krontech.api.localization.LocaleCode;
import com.krontech.api.pages.entity.Page;
import com.krontech.api.pages.repository.PageRepository;
import com.krontech.api.publishing.dto.PublishPageRequest;
import com.krontech.api.publishing.dto.PublishStateResponse;
import com.krontech.api.publishing.service.CacheService;
import com.krontech.api.publishing.service.PublishingService;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.web.server.ResponseStatusException;

class PublishingServiceTest {

    private final PageRepository pageRepository = Mockito.mock(PageRepository.class);
    private final CacheService cacheService = Mockito.mock(CacheService.class);
    private final AuditService auditService = Mockito.mock(AuditService.class);
    private final PublishingService service = new PublishingService(pageRepository, cacheService, auditService);

    // ── publish ────────────────────────────────────────────────────────────────

    @Test
    void shouldPublishDraftPage() {
        Page page = draftPage("home", LocaleCode.EN);
        when(pageRepository.findBySlugAndLocale("home", LocaleCode.EN)).thenReturn(Optional.of(page));
        when(pageRepository.save(any(Page.class))).thenAnswer(inv -> inv.getArgument(0));

        PublishStateResponse response = service.publish(new PublishPageRequest("home", "en"));

        assertEquals(PublishStatus.PUBLISHED, page.getStatus());
        assertEquals("PUBLISHED", response.status());
        verify(cacheService).evictContent("en", "home");
        verify(auditService).record(eq("PUBLISH"), eq("PAGE"), any(), eq("home"), any());
    }

    @Test
    void shouldPublishScheduledPage() {
        Page page = pageWithStatus("about", LocaleCode.TR, PublishStatus.SCHEDULED);
        when(pageRepository.findBySlugAndLocale("about", LocaleCode.TR)).thenReturn(Optional.of(page));
        when(pageRepository.save(any(Page.class))).thenAnswer(inv -> inv.getArgument(0));

        PublishStateResponse response = service.publish(new PublishPageRequest("about", "tr"));

        assertEquals(PublishStatus.PUBLISHED, page.getStatus());
        assertEquals("PUBLISHED", response.status());
        verify(cacheService).evictContent("tr", "about");
    }

    @Test
    void shouldRejectPublishingAlreadyPublishedPage() {
        Page page = pageWithStatus("home", LocaleCode.EN, PublishStatus.PUBLISHED);
        when(pageRepository.findBySlugAndLocale("home", LocaleCode.EN)).thenReturn(Optional.of(page));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.publish(new PublishPageRequest("home", "en")));
        assertEquals(409, ex.getStatusCode().value());
    }

    @Test
    void shouldThrowNotFoundWhenPageMissingOnPublish() {
        when(pageRepository.findBySlugAndLocale(any(), any())).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.publish(new PublishPageRequest("missing", "en")));
        assertEquals(404, ex.getStatusCode().value());
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private Page draftPage(String slug, LocaleCode locale) {
        return PublishingWorkflowTest.draftPage(slug, locale);
    }

    private Page pageWithStatus(String slug, LocaleCode locale, PublishStatus status) {
        return PublishingWorkflowTest.pageWithStatus(slug, locale, status);
    }
}
