package com.krontech.api.publishing;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.krontech.api.localization.LocaleCode;
import com.krontech.api.pages.entity.Page;
import com.krontech.api.pages.repository.PageRepository;
import com.krontech.api.publishing.dto.PublishPageRequest;
import com.krontech.api.publishing.service.PublishingService;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.redis.core.StringRedisTemplate;

class PublishingServiceTest {

    private final PageRepository pageRepository = Mockito.mock(PageRepository.class);
    private final StringRedisTemplate redisTemplate = Mockito.mock(StringRedisTemplate.class);
    private final PublishingService service = new PublishingService(pageRepository, redisTemplate);

    @Test
    void shouldPublishDraftPage() {
        Page page = draftPage("home", LocaleCode.EN);
        when(pageRepository.findBySlugAndLocaleAndStatus("home", LocaleCode.EN, PublishStatus.DRAFT))
                .thenReturn(Optional.of(page));
        when(pageRepository.save(any(Page.class))).thenAnswer(inv -> inv.getArgument(0));

        service.publish(new PublishPageRequest("home", "en"));

        assertEquals(PublishStatus.PUBLISHED, page.getStatus());
        verify(redisTemplate).delete("cache:page:en:home");
    }

    @Test
    void shouldPublishScheduledPage() {
        Page page = scheduledPage("about", LocaleCode.TR);
        when(pageRepository.findBySlugAndLocaleAndStatus("about", LocaleCode.TR, PublishStatus.DRAFT))
                .thenReturn(Optional.empty());
        when(pageRepository.findBySlugAndLocaleAndStatus("about", LocaleCode.TR, PublishStatus.SCHEDULED))
                .thenReturn(Optional.of(page));
        when(pageRepository.save(any(Page.class))).thenAnswer(inv -> inv.getArgument(0));

        service.publish(new PublishPageRequest("about", "tr"));

        assertEquals(PublishStatus.PUBLISHED, page.getStatus());
        verify(redisTemplate).delete("cache:page:tr:about");
    }

    @Test
    void shouldThrowWhenNoPublishablePage() {
        when(pageRepository.findBySlugAndLocaleAndStatus(any(), any(), any())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> service.publish(new PublishPageRequest("missing", "en")));
    }

    private Page draftPage(String slug, LocaleCode locale) {
        Page page = new Page();
        page.setSlug(slug);
        page.setLocale(locale);
        page.setPageType("generic");
        page.setTitle("Test Page");
        page.setSummary("A test page.");
        page.setStatus(PublishStatus.DRAFT);
        return page;
    }

    private Page scheduledPage(String slug, LocaleCode locale) {
        Page page = draftPage(slug, locale);
        page.setStatus(PublishStatus.SCHEDULED);
        return page;
    }
}
