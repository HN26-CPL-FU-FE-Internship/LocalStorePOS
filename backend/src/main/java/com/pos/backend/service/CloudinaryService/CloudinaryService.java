package com.pos.backend.service.CloudinaryService;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.pos.backend.constant.ErrorCode;
import com.pos.backend.exception.AppException;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024;
    private static final String CLOUDINARY_HOST_SUFFIX = ".cloudinary.com";

    private final Cloudinary cloudinary;

    public record Asset(String secureUrl, String publicId, String resourceType) {
    }

    public Asset uploadImage(MultipartFile file, String folder) {
        validateImage(file);
        return upload(file, folder, "image");
    }

    /** Upload images, videos, or raw files through Cloudinary's auto resource type. */
    public Asset uploadFile(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new AppException(ErrorCode.IMAGE_TOO_LARGE);
        }
        return upload(file, folder, "auto");
    }

    /** Delete by persisted Cloudinary identifiers. */
    public void delete(String assetUrl, String publicId, String resourceType) {
        if (publicId != null && !publicId.isBlank()) {
            destroy(publicId, resourceType == null || resourceType.isBlank() ? "image" : resourceType);
            return;
        }
        // Compatibility for rows created before public_id/resource_type existed.
        deleteLegacyUrl(assetUrl);
    }

    public void delete(String assetUrl) {
        delete(assetUrl, null, null);
    }

    private Asset upload(MultipartFile file, String folder, String resourceType) {
        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", folder,
                            "resource_type", resourceType,
                            "use_filename", false,
                            "unique_filename", true,
                            "overwrite", false));

            Object secureUrl = result.get("secure_url");
            Object publicId = result.get("public_id");
            Object actualResourceType = result.get("resource_type");
            if (secureUrl == null || publicId == null) {
                throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
            }
            return new Asset(
                    secureUrl.toString(),
                    publicId.toString(),
                    actualResourceType == null ? resourceType : actualResourceType.toString());
        } catch (IOException | RuntimeException exception) {
            if (exception instanceof AppException appException) {
                throw appException;
            }
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
        }
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new AppException(ErrorCode.IMAGE_TOO_LARGE);
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
            throw new AppException(ErrorCode.INVALID_IMAGE_FILE);
        }
    }

    private void deleteLegacyUrl(String assetUrl) {
        if (assetUrl == null || assetUrl.isBlank() || !isCloudinaryUrl(assetUrl)) {
            return;
        }

        try {
            URI uri = URI.create(assetUrl);
            String[] segments = uri.getPath().split("/");
            int uploadIndex = indexOf(segments, "upload");
            if (uploadIndex < 1 || uploadIndex + 1 >= segments.length) {
                return;
            }

            String resourceType = segments[uploadIndex - 1];
            String publicId = publicIdFrom(segments, uploadIndex + 1, resourceType);
            if (!publicId.isBlank()) {
                destroy(publicId, resourceType);
            }
        } catch (Exception ignored) {
            // Asset deletion must not make a successful database mutation fail.
        }
    }

    private void destroy(String publicId, String resourceType) {
        try {
            cloudinary.uploader().destroy(publicId,
                    ObjectUtils.asMap("resource_type", resourceType));
        } catch (Exception ignored) {
            // Asset deletion must not make a successful database mutation fail.
        }
    }

    private boolean isCloudinaryUrl(String assetUrl) {
        try {
            String host = URI.create(assetUrl).getHost();
            return host != null && (host.equals("cloudinary.com") || host.endsWith(CLOUDINARY_HOST_SUFFIX));
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private int indexOf(String[] segments, String value) {
        for (int index = 0; index < segments.length; index++) {
            if (value.equals(segments[index])) {
                return index;
            }
        }
        return -1;
    }

    private String publicIdFrom(String[] segments, int startIndex, String resourceType) {
        int firstAssetIndex = startIndex;
        if (firstAssetIndex < segments.length && segments[firstAssetIndex].matches("v\\d+")) {
            firstAssetIndex++;
        }
        if (firstAssetIndex >= segments.length) {
            return "";
        }

        StringBuilder publicId = new StringBuilder();
        for (int index = firstAssetIndex; index < segments.length; index++) {
            if (segments[index].isBlank()) {
                continue;
            }
            if (publicId.length() > 0) {
                publicId.append('/');
            }
            publicId.append(segments[index]);
        }

        String value = publicId.toString();
        if ("image".equals(resourceType) || "video".equals(resourceType)) {
            int extensionIndex = value.lastIndexOf('.');
            if (extensionIndex > value.lastIndexOf('/')) {
                value = value.substring(0, extensionIndex);
            }
        }
        return value;
    }
}
