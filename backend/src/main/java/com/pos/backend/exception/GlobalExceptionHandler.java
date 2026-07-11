package com.pos.backend.exception;

import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.dto.response.ApiResponse;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> exceptionHandler(Exception exception) {

        ApiResponse<?> response = ApiResponse.builder()
                .code(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode())
                .message(ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage())
                .build();

        return ResponseEntity.status(ErrorCode.UNCATEGORIZED_EXCEPTION.getStatus()).body(response);
    }

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<?>> appExceptionHandler(AppException exception) {
        ErrorCode errorCode = exception.getErrorCode();

        ApiResponse<?> response = ApiResponse.builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .build();

        return ResponseEntity.status(errorCode.getStatus()).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> invalidateHandler(MethodArgumentNotValidException exception) {

        ApiResponse<?> response = ApiResponse.builder()
                .code(ErrorCode.VALID_FAILED.getCode())
                .message(ErrorCode.VALID_FAILED.getMessage())
                .errors(exception.getBindingResult().getFieldErrors().stream()
                        .collect(Collectors.toMap(FieldError::getField, FieldError::getDefaultMessage,
                                (oldValue, newValue) -> oldValue)))
                .build();

        return ResponseEntity.status(ErrorCode.VALID_FAILED.getStatus()).body(response);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<?>> accessDeniedHandler(AccessDeniedException exception) {

        ApiResponse<?> response = ApiResponse.builder()
                .code(ErrorCode.UNAUTHENTICATED.getCode())
                .message(ErrorCode.UNAUTHENTICATED.getMessage())
                .build();

        return ResponseEntity.status(ErrorCode.UNAUTHENTICATED.getStatus()).body(response);
    }
}
