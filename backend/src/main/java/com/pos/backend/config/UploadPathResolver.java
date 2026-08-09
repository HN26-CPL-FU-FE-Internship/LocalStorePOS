package com.pos.backend.config;

import java.nio.file.Files;
import java.nio.file.Path;

import org.springframework.stereotype.Component;

/**
 * Single source of truth for the uploads directory. Both the resource
 * handler (which serves {@code /uploads/**}) and the file storage utility
 * (which writes new files) resolve the directory through this bean, so
 * writing and serving always agree no matter which working directory the
 * backend is launched from:
 *
 * <pre>
 *   - project root: ./uploads
 *   - backend/    : ../uploads
 * </pre>
 *
 * <p>
 * The project root (the directory containing both {@code backend/} and
 * {@code frontend/}) is located first so its {@code uploads} folder is
 * always used — even if a stale CWD-relative {@code uploads} exists.
 */
@Component
public class UploadPathResolver {

    private final Path uploadRoot;

    public UploadPathResolver() {
        this(Path.of("").toAbsolutePath().normalize());
    }

    /**
     * Test seam: resolve the uploads root relative to an explicit working
     * directory instead of the JVM's current working directory.
     */
    UploadPathResolver(Path workingDirectory) {
        this.uploadRoot = resolveUploadRoot(workingDirectory);
    }

    /** Absolute path of a sub-path inside the uploads directory. */
    public Path resolve(String subPath) {
        return uploadRoot.resolve(subPath).normalize();
    }

    /** {@code file://} location with a trailing slash, for Spring resource handlers. */
    public String getResourceLocation() {
        return withTrailingSlash(uploadRoot.toUri().toString());
    }

    static Path resolveUploadRoot(Path cwd) {

        // Prefer the project root (the dir containing both backend/ and
        // frontend/) — its ./uploads holds the seed images. Checking the
        // markers avoids a stale CWD-relative uploads dir (e.g. a leftover
        // backend/uploads from an old run) shadowing the real one. The
        // uploads dir itself may not exist yet (fresh clone) — it is
        // created on the first upload.
        for (Path candidate : new Path[] { cwd, cwd.resolve("..").normalize() }) {
            if (Files.isDirectory(candidate.resolve("backend"))
                    && Files.isDirectory(candidate.resolve("frontend"))) {
                return candidate.resolve("uploads").normalize();
            }
        }

        // Fallback: first existing candidate wins, else the project-root
        // location where the seed data lives.
        Path[] candidates = {
                cwd.resolve("uploads"),
                cwd.resolve("..").resolve("uploads").normalize(),
        };
        for (Path candidate : candidates) {
            if (Files.isDirectory(candidate)) {
                return candidate;
            }
        }
        return candidates[1];
    }

    private String withTrailingSlash(String uri) {
        return uri.endsWith("/") ? uri : uri + "/";
    }
}
