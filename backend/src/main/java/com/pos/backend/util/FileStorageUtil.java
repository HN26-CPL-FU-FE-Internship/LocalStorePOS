package com.pos.backend.util;

import com.pos.backend.service.CloudinaryService.CloudinaryService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
@RequiredArgsConstructor
public class FileStorageUtil {

    private final CloudinaryService cloudinaryService;

    public CloudinaryService.Asset storeImageAsset(MultipartFile file, String subFolder) {
        if (file == null || file.isEmpty()) {
            return null;
        }
        return cloudinaryService.uploadImage(file, "restaurant-pos/" + subFolder);
    }

    public String storeImage(MultipartFile file, String subFolder) {
        CloudinaryService.Asset asset = storeImageAsset(file, subFolder);
        return asset == null ? null : asset.secureUrl();
    }

    public void deleteFile(String publicPath) {
        cloudinaryService.delete(publicPath);
    }

    public void deleteFile(String publicPath, String publicId, String resourceType) {
        cloudinaryService.delete(publicPath, publicId, resourceType);
    }
}
