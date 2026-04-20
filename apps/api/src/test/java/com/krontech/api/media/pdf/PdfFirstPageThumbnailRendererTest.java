package com.krontech.api.media.pdf;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.junit.jupiter.api.Test;

class PdfFirstPageThumbnailRendererTest {

    @Test
    void rendersBlankPageToJpeg() throws IOException {
        byte[] pdf;
        try (PDDocument doc = new PDDocument()) {
            doc.addPage(new PDPage());
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            doc.save(bos);
            pdf = bos.toByteArray();
        }
        byte[] jpeg = PdfFirstPageThumbnailRenderer.renderFirstPageToJpeg(pdf);
        assertTrue(jpeg.length > 2000);
        assertEquals((byte) 0xff, jpeg[0]);
        assertEquals((byte) 0xd8, jpeg[1]);
    }
}
