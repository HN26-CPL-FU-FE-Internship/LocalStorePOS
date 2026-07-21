package com.pos.backend.util;
import java.io.IOException;
import java.nio.file.Files;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import com.pos.backend.constant.ErrorCode;

import com.pos.backend.exception.AppException;

@Component
public class FileStorageUtil {

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
            Path folder = Paths.get(UPLOAD_ROOT, subFolder);
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
            String relativePath = publicPath.startsWith("/") ? publicPath.substring(1) : publicPath;
            Path path = Paths.get(relativePath);
            Files.deleteIfExists(path);
        } catch(IOException ignored){

        }
    }
}