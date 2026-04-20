package com.krontech.api.products;

import com.krontech.api.media.service.ObjectStorageClient;
import com.krontech.api.products.dto.ProductDetailTabSectionResponse;
import com.krontech.api.products.dto.ProductTabCardAdminItem;
import com.krontech.api.products.dto.ProductTabCardPublicItem;
import com.krontech.api.products.entity.ProductDetailTab;
import com.krontech.api.products.entity.ProductTabCard;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

public final class ProductTabCardPresentation {

    private ProductTabCardPresentation() {
    }

    /**
     * @param omitResourcesTabCards when true, the {@code resources} tab is always empty in the response so the
     *        product can use the structured Resources intro + linked documents instead of legacy tab cards.
     */
    public static List<ProductDetailTabSectionResponse> toPublicSections(
            List<ProductTabCard> cards,
            ObjectStorageClient objectStorageClient,
            boolean omitResourcesTabCards
    ) {
        Map<ProductDetailTab, List<ProductTabCard>> byTab = new EnumMap<>(ProductDetailTab.class);
        for (ProductDetailTab tab : ProductDetailTab.values()) {
            byTab.put(tab, new ArrayList<>());
        }
        for (ProductTabCard card : cards) {
            if (omitResourcesTabCards && card.getTab() == ProductDetailTab.RESOURCES) {
                continue;
            }
            byTab.get(card.getTab()).add(card);
        }
        List<ProductDetailTabSectionResponse> out = new ArrayList<>();
        for (ProductDetailTab tab : ProductDetailTab.values()) {
            List<ProductTabCard> list = byTab.get(tab);
            list.sort(Comparator.comparingInt(ProductTabCard::getSortOrder));
            List<ProductTabCardPublicItem> items = new ArrayList<>();
            for (ProductTabCard c : list) {
                String imageUrl = c.getImageObjectKey() != null
                        ? objectStorageClient.buildPublicUrl(c.getImageObjectKey())
                        : null;
                items.add(new ProductTabCardPublicItem(
                        c.getSortOrder(),
                        c.getTitle(),
                        c.getBody(),
                        imageUrl,
                        c.getImageAlt()
                ));
            }
            out.add(new ProductDetailTabSectionResponse(tab.apiValue(), items));
        }
        return out;
    }

    public static List<ProductTabCardAdminItem> toAdminItems(List<ProductTabCard> cards) {
        List<ProductTabCard> sorted = new ArrayList<>(cards);
        sorted.sort(Comparator
                .comparing(ProductTabCard::getTab, Comparator.comparingInt(Enum::ordinal))
                .thenComparingInt(ProductTabCard::getSortOrder));
        return sorted.stream()
                .map(c -> new ProductTabCardAdminItem(
                        c.getId(),
                        c.getTab().name(),
                        c.getSortOrder(),
                        c.getTitle(),
                        c.getBody(),
                        c.getImageObjectKey(),
                        c.getImageAlt()
                ))
                .toList();
    }
}
