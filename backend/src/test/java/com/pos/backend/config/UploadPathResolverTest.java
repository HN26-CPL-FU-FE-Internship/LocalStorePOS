package com.pos.backend.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

/**
 * Unit tests for {@link UploadPathResolver}.
 *
 * <p>
 * The resolver must always choose a single uploads directory that both the
 * resource handler (serve) and the file storage util (write) agree on,
 * regardless of which working directory the backend is launched from.
 */
class UploadPathResolverTest {

    @TempDir
    Path temp;

    private Path makeProjectRoot(boolean withUploads) throws IOException {
        Files.createDirectories(temp.resolve("backend"));
        Files.createDirectories(temp.resolve("frontend"));
        if (withUploads) {
            Files.createDirectories(temp.resolve("uploads"));
        }
        return temp;
    }

    @Test
    void launchedFromProjectRoot_shouldUseRootUploads() throws IOException {
        Path root = makeProjectRoot(true);

        UploadPathResolver resolver = new UploadPathResolver(root);

        String location = resolver.getResourceLocation();
        assertTrue(location.startsWith("file://"), "expected file:// URL but was: " + location);
        assertTrue(location.contains(root.resolve("uploads").toUri().toString()),
                "expected " + root.resolve("uploads") + " but was: " + location);
    }

    @Test
    void launchedFromProjectRoot_withoutUploadsDir_shouldStillUseRootUploads() throws IOException {
        // Fresh clone: project markers exist but uploads/ does not yet (it is
        // created on the first upload). Must NOT fall back to a sibling dir.
        Path root = makeProjectRoot(false);

        UploadPathResolver resolver = new UploadPathResolver(root);

        assertEquals(root.resolve("uploads").normalize(), resolver.resolve("items").getParent());
    }

    @Test
    void launchedFromBackendDir_shouldUseProjectRootUploads() throws IOException {
        // cwd = <root>/backend — markers are one level up.
        Path root = makeProjectRoot(true);
        Path backendDir = root.resolve("backend");

        UploadPathResolver resolver = new UploadPathResolver(backendDir);

        assertEquals(root.resolve("uploads").normalize(), resolver.resolve("items").getParent());
    }

    @Test
    void launchedFromBackendDir_withStaleCwdUploads_shouldStillUseProjectRoot() throws IOException {
        // Regression guard: a leftover backend/uploads (from an old buggy run)
        // must NOT shadow the real project-root uploads directory.
        Path root = makeProjectRoot(true);
        Files.createDirectories(root.resolve("backend").resolve("uploads"));
        Path backendDir = root.resolve("backend");

        UploadPathResolver resolver = new UploadPathResolver(backendDir);

        assertEquals(root.resolve("uploads").normalize(), resolver.resolve("items").getParent());
    }

    @Test
    void noProjectMarkers_firstExistingCandidateWins() throws IOException {
        // cwd has no backend/frontend markers (e.g. packaged jar run from an
        // arbitrary dir) — the first existing candidate is used.
        Path cwd = temp.resolve("workdir");
        Files.createDirectories(cwd.resolve("uploads"));
        Files.createDirectories(cwd.resolve("..").resolve("uploads"));

        UploadPathResolver resolver = new UploadPathResolver(cwd);

        assertEquals(cwd.resolve("uploads").normalize(), resolver.resolve("x").getParent());
    }

    @Test
    void noProjectMarkers_neitherCandidateExists_fallsBackToParentUploads() throws IOException {
        Path cwd = temp.resolve("workdir");
        Files.createDirectories(cwd);

        UploadPathResolver resolver = new UploadPathResolver(cwd);

        // Neither cwd/uploads nor ../uploads exists → project-root location
        // (../uploads) is used.
        assertEquals(cwd.resolve("..").resolve("uploads").normalize(),
                resolver.resolve("x").getParent());
    }

    @Test
    void resolve_buildsPathUnderUploadRoot() throws IOException {
        Path root = makeProjectRoot(true);

        UploadPathResolver resolver = new UploadPathResolver(root);

        assertEquals(root.resolve("uploads").resolve("items").normalize(), resolver.resolve("items"));
        assertEquals(root.resolve("uploads").resolve("categories").normalize(), resolver.resolve("categories"));
    }

    @Test
    void getResourceLocation_isFileUrlWithTrailingSlash() throws IOException {
        Path root = makeProjectRoot(true);

        UploadPathResolver resolver = new UploadPathResolver(root);

        String location = resolver.getResourceLocation();
        assertTrue(location.startsWith("file://"), "expected file:// URL but was: " + location);
        assertTrue(location.endsWith("/"), "expected trailing slash but was: " + location);
        assertTrue(location.contains("/uploads/"), "expected uploads path but was: " + location);
    }
}
