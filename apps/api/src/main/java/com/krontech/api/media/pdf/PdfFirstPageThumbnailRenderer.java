package com.krontech.api.media.pdf;

import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;

/** Renders the first page of a PDF to a JPEG byte array for card thumbnails. */
public final class PdfFirstPageThumbnailRenderer {

    private static final int RENDER_DPI = 110;
    private static final int MAX_WIDTH_PX = 880;

    private PdfFirstPageThumbnailRenderer() {}

    public static byte[] renderFirstPageToJpeg(byte[] pdfBytes) throws IOException {
        try (PDDocument doc = PDDocument.load(new ByteArrayInputStream(pdfBytes))) {
            if (doc.getNumberOfPages() < 1) {
                throw new IOException("PDF has no pages");
            }
            PDFRenderer renderer = new PDFRenderer(doc);
            BufferedImage rendered = renderer.renderImageWithDPI(0, RENDER_DPI, ImageType.RGB);
            BufferedImage scaled = scaleDownIfNeeded(rendered, MAX_WIDTH_PX);
            return writeJpeg(scaled, 0.82f);
        }
    }

    private static BufferedImage scaleDownIfNeeded(BufferedImage src, int maxWidth) {
        if (src.getWidth() <= maxWidth) {
            return src;
        }
        int w = maxWidth;
        int h = (int) Math.round(src.getHeight() * (maxWidth / (double) src.getWidth()));
        BufferedImage out = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = out.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.drawImage(src, 0, 0, w, h, null);
        g.dispose();
        return out;
    }

    private static byte[] writeJpeg(BufferedImage image, float quality) throws IOException {
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
        if (!writers.hasNext()) {
            ByteArrayOutputStream fallback = new ByteArrayOutputStream();
            ImageIO.write(image, "jpg", fallback);
            return fallback.toByteArray();
        }
        ImageWriter writer = writers.next();
        ImageWriteParam param = writer.getDefaultWriteParam();
        if (param.canWriteCompressed()) {
            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            param.setCompressionQuality(quality);
        }
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ImageOutputStream ios = ImageIO.createImageOutputStream(baos)) {
            writer.setOutput(ios);
            writer.write(null, new IIOImage(image, null, null), param);
        } finally {
            writer.dispose();
        }
        return baos.toByteArray();
    }
}
