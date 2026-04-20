package com.krontech.api.products;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.krontech.api.media.service.ObjectStorageClient;
import com.krontech.api.products.dto.ProductDetailTabSectionResponse;
import java.util.List;
import org.junit.jupiter.api.Test;

class ProductTabCardPresentationTest {

    @Test
    void toPublicSections_emptyCards_returnsFourTabsInDisplayOrder() {
        ObjectStorageClient urls = mock(ObjectStorageClient.class);
        when(urls.buildPublicUrl(anyString())).thenAnswer(inv -> "https://cdn.test/" + inv.getArgument(0));

        List<ProductDetailTabSectionResponse> sections =
                ProductTabCardPresentation.toPublicSections(List.of(), urls, false);

        assertEquals(4, sections.size());
        assertEquals("solution", sections.get(0).tab());
        assertEquals("how_it_works", sections.get(1).tab());
        assertEquals("key_benefits", sections.get(2).tab());
        assertEquals("resources", sections.get(3).tab());
        assertEquals(0, sections.get(0).cards().size());
    }
}
