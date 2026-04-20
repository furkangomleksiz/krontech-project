package com.krontech.api.resources.service;

import com.krontech.api.media.pdf.PdfFirstPageThumbnailRenderer;
import com.krontech.api.media.service.ObjectStorageClient;
import com.krontech.api.resources.entity.ResourceItem;
import java.io.ByteArrayInputStream;
import java.util.Locale;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class ResourcePdfPreviewService {

    private static final Logger log = LoggerFactory.getLogger(ResourcePdfPreviewService.class);

    /** Skip thumbnail generation for extremely large PDFs to avoid memory pressure. */
    private static final int MAX_PDF_BYTES = 48 * 1024 * 1024;

    private final ObjectStorageClient objectStorageClient;

    public ResourcePdfPreviewService(ObjectStorageClient objectStorageClient) {
        this.objectStorageClient = objectStorageClient;
    }

    /**
     * Reads the stored file when it is a PDF, renders the first page to JPEG, uploads it, and sets
     * {@link ResourceItem#setFilePreviewImageKey}. Clears the preview when the file is not a PDF or is absent.
     */
    public void syncPreviewFromStoredFile(ResourceItem item) {
        String fileKey = item.getFileKey();
        if (fileKey == null || fileKey.isBlank()) {
            removePreviewObjectIfPresent(item);
            item.setFilePreviewImageKey(null);
            return;
        }
        String key = fileKey.strip();
        try {
            byte[] pdfBytes = objectStorageClient.getObjectAsBytes(key);
            if (pdfBytes.length > MAX_PDF_BYTES) {
                log.warn("Skipping PDF preview for resource {}: file exceeds {} bytes.", item.getId(), MAX_PDF_BYTES);
                removePreviewObjectIfPresent(item);
                item.setFilePreviewImageKey(null);
                return;
            }
            if (!looksLikePdf(pdfBytes, key)) {
                removePreviewObjectIfPresent(item);
                item.setFilePreviewImageKey(null);
                return;
            }
            byte[] jpeg = PdfFirstPageThumbnailRenderer.renderFirstPageToJpeg(pdfBytes);
            String destKey = previewObjectKey(item.getId());
            objectStorageClient.upload(destKey, new ByteArrayInputStream(jpeg), "image/jpeg", jpeg.length);
            item.setFilePreviewImageKey(destKey);
        } catch (Exception e) {
            log.warn("PDF preview generation failed for resource {} (key={}): {}", item.getId(), key, e.getMessage());
            removePreviewObjectIfPresent(item);
            item.setFilePreviewImageKey(null);
        }
    }

    /** Deletes the generated JPEG from storage (best-effort) and clears the key on the entity. */
    public void removePreviewObjectIfPresent(ResourceItem item) {
        String previewKey = item.getFilePreviewImageKey();
        if (previewKey != null && !previewKey.isBlank()) {
            try {
                objectStorageClient.delete(previewKey.strip());
            } catch (Exception e) {
                log.debug("Could not delete resource preview object '{}': {}", previewKey, e.getMessage());
            }
        }
        item.setFilePreviewImageKey(null);
    }

    private static String previewObjectKey(UUID resourceId) {
        return "generated/resource-previews/" + resourceId + ".jpg";
    }

    private static boolean looksLikePdf(byte[] data, String fileKey) {
        if (data.length >= 5
                && data[0] == '%'
                && data[1] == 'P'
                && data[2] == 'D'
                && data[3] == 'F'
                && data[4] == '-') {
            return true;
        }
        return fileKey.toLowerCase(Locale.ROOT).endsWith(".pdf");
    }
}
