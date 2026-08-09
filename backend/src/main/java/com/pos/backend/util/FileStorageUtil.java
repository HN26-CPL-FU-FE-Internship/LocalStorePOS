package com.pos.backend.util;
import java.io.IOException;
import java.nio.file.Files;

import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import com.pos.backend.constant.ErrorCode;

import com.pos.backend.config.UploadPathResolver;
import com.pos.backend.exception.AppException;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class FileStorageUtil {

    private final UploadPathResolver uploadPathResolver;

    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024;
    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
        "image/jpeg","image/jpg","image/png","image/webp","image/gif"
    );
    private static final String UPLOAD_ROOT = "uploads";

    public String storeImage(MultipartFile file, String subFolder){
        if(file == null || file.isEmpty()){
            return null;
        }

        if(file.getSize() > MAX_FILE_SIZE){
            throw new AppException(ErrorCode.IMAGE_TOO_LARGE);
        }

        String contentType = file.getContentType();
        if(contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())){
            throw new AppException(ErrorCode.INVALID_IMAGE_FILE);
        }

        try{
            Path folder = uploadPathResolver.resolve(subFolder);
            Files.createDirectories(folder);

            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "image";
            String extension = "";
            int dotIndex = originalName.lastIndexOf('.');
            if(dotIndex >= 0){
                extension = originalName.substring(dotIndex);
            }

            String fileName = UUID.randomUUID() + extension;
            Path destination = folder.resolve(fileName);

            file.transferTo(destination.toFile());

            return "/" + UPLOAD_ROOT + "/" + subFolder + "/" + fileName;
        } catch(IOException e){
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
        }
    }

    public void deleteFile(String publicPath){
        if(publicPath == null || publicPath.isBlank()){
            return;
        }

        try{
            // Only paths under /uploads/** are stored inside the uploads
            // root; anything else (e.g. a static /logo.png) is not ours to
            // delete.
            String relative = publicPath.startsWith("/") ? publicPath.substring(1) : publicPath;
            if (!relative.startsWith("uploads/")) {
                return;
            }
            relative = relative.substring("uploads/".length());
            if (relative.isEmpty()) {
                return;
            }
            Path path = uploadPathResolver.resolve(relative);
            Files.deleteIfExists(path);
        } catch(IOException ignored){

        }
    }
}