package com.pos.backend.exception;

import java.util.stream.Collectors;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.pos.backend.constant.ErrorCode;
import com.pos.backend.constant.enums.AuditAction;
import com.pos.backend.dto.response.ApiResponse;
import com.pos.backend.service.Audit.AuditLogService;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private final AuditLogService auditLogService;

    @ExceptionHandler(Exception.class)
    public ApiResponse<?> exceptionHandler(Exception exception, HttpServletResponse response) {

        auditLogService.logSystemError(
                "Unhandled exception: " + exception.getClass().getSimpleName() + " - " + exception.getMessage(),
                null);

        response.setStatus(ErrorCode.UNCATEGORIZED_EXCEPTION.getStatus().value());

        return ApiResponse.builder()
                .code(ErrorCode.UNCATEGORIZED_EXCEPTION.getCode())
                .message(ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage())
                .build();
    }

    @ExceptionHandler(AppException.class)
    public ApiResponse<?> appExceptionHandler(AppException exception, HttpServletResponse response) {
        ErrorCode errorCode = exception.getErrorCode();

        response.setStatus(errorCode.getStatus().value());

        return ApiResponse.builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .build();
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ApiResponse<?> invalidateHandler(MethodArgumentNotValidException exception, HttpServletResponse response) {

        response.setStatus(ErrorCode.VALID_FAILED.getStatus().value());

        return ApiResponse.builder()
                .code(ErrorCode.VALID_FAILED.getCode())
                .message(ErrorCode.VALID_FAILED.getMessage())
                .errors(exception.getBindingResult().getFieldErrors().stream()
                        .collect(Collectors.toMap(FieldError::getField, FieldError::getDefaultMessage,
                                (oldValue, newValue) -> oldValue)))
                .build();
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ApiResponse<?> accessDeniedHandler(AccessDeniedException exception, HttpServletResponse response) {

        response.setStatus(ErrorCode.UNAUTHENTICATED.getStatus().value());

        return ApiResponse.builder()
                .code(ErrorCode.UNAUTHENTICATED.getCode())
                .message(ErrorCode.UNAUTHENTICATED.getMessage())
                .build();
    }
}
