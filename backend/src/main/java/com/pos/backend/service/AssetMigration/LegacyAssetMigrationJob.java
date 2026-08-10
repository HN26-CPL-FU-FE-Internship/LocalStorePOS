package com.pos.backend.service.AssetMigration;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.function.Consumer;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.pos.backend.entity.Addon;
import com.pos.backend.entity.Category;
import com.pos.backend.entity.Customer;
import com.pos.backend.entity.Item;
import com.pos.backend.entity.Store;
import com.pos.backend.entity.User;
import com.pos.backend.repository.AddonRepository;
import com.pos.backend.repository.CategoryRepository;
import com.pos.backend.repository.CustomerRepository;
import com.pos.backend.repository.ItemRepository;
import com.pos.backend.repository.StoreRepository;
import com.pos.backend.repository.UserRepository;
import com.pos.backend.service.CloudinaryService.CloudinaryService;
import com.pos.backend.config.UploadPathResolver;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * One-shot migration for records that still point at local {@code /uploads/**}
 * assets. It is disabled by default and intentionally keeps local files so the
 * migration can be verified or rolled back safely.
 *
 * <p>Run with:
 * <pre>
 * java -jar app.jar \
 *   --legacy-assets.migration.enabled=true \
 *   --legacy-assets.migration.dry-run=true
 * </pre>
 */
@Component
@ConditionalOnProperty(name = "legacy-assets.migration.enabled", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class LegacyAssetMigrationJob implements ApplicationRunner {

    private static final String LEGACY_PREFIX = "/uploads/";
    private static final String CLOUDINARY_FOLDER = "restaurant-pos/legacy";

    private final UploadPathResolver uploadPathResolver;
    private final CloudinaryService cloudinaryService;
    private final StoreRepository storeRepository;
    private final CategoryRepository categoryRepository;
    private final ItemRepository itemRepository;
    private final AddonRepository addonRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final ConfigurableApplicationContext applicationContext;

    @Value("${legacy-assets.migration.dry-run:false}")
    private boolean configuredDryRun;

    @Override
    public void run(ApplicationArguments args) {
        MigrationReport report = migrate(configuredDryRun);        log.info(
                "Legacy asset migration finished: scanned={}, migrated={}, planned={}, skipped={}, missing={}, failed={}",
                report.scanned(), report.migrated(), report.planned(), report.skipped(), report.missing(),                report.failed());

        int exitCode = SpringApplication.exit(applicationContext, () -> report.failed() > 0 ? 1 : 0);
        System.exit(exitCode);
    }

    /** Execute the migration once and return a summary for logs/tests. */

    public MigrationReport migrate(boolean dryRun) {
        MigrationStats stats = new MigrationStats();

        storeRepository.findAll().forEach(store -> migrateStore(store, dryRun, stats));
        categoryRepository.findAll().forEach(category -> migrateCategory(category, dryRun, stats));
        itemRepository.findAll().forEach(item -> migrateItem(item, dryRun, stats));
        addonRepository.findAll().forEach(addon -> migrateAddon(addon, dryRun, stats));
        customerRepository.findAll().forEach(customer -> migrateCustomer(customer, dryRun, stats));
        userRepository.findAll().forEach(user -> migrateUser(user, dryRun, stats));

        return stats.toReport();
    }

    private void migrateStore(Store store, boolean dryRun, MigrationStats stats) {
        migrateAsset(
                "stores",
                store.getId(),
                store.getImagePath(),
                store.getImagePublicId(),
                dryRun,
                stats,
                asset -> {
                    store.setImagePath(asset.secureUrl());
                    store.setImagePublicId(asset.publicId());
                    store.setImageResourceType(asset.resourceType());
                },
                () -> storeRepository.save(store));
    }

    private void migrateCategory(Category category, boolean dryRun, MigrationStats stats) {
        migrateAsset(
                "categories",
                category.getId(),
                category.getImagePath(),
                category.getImagePublicId(),
                dryRun,
                stats,
                asset -> {
                    category.setImagePath(asset.secureUrl());
                    category.setImagePublicId(asset.publicId());
                    category.setImageResourceType(asset.resourceType());
                },
                () -> categoryRepository.save(category));
    }

    private void migrateItem(Item item, boolean dryRun, MigrationStats stats) {
        migrateAsset(
                "items",
                item.getId(),
                item.getImagePath(),
                item.getImagePublicId(),
                dryRun,
                stats,
                asset -> {
                    item.setImagePath(asset.secureUrl());
                    item.setImagePublicId(asset.publicId());
                    item.setImageResourceType(asset.resourceType());
                },
                () -> itemRepository.save(item));
    }

    private void migrateAddon(Addon addon, boolean dryRun, MigrationStats stats) {
        migrateAsset(
                "addons",
                addon.getId(),
                addon.getImagePath(),
                addon.getImagePublicId(),
                dryRun,
                stats,
                asset -> {
                    addon.setImagePath(asset.secureUrl());
                    addon.setImagePublicId(asset.publicId());
                    addon.setImageResourceType(asset.resourceType());
                },
                () -> addonRepository.save(addon));
    }

    private void migrateCustomer(Customer customer, boolean dryRun, MigrationStats stats) {
        migrateAsset(
                "customers",
                customer.getId(),
                customer.getAvatarPath(),
                customer.getAvatarPublicId(),
                dryRun,
                stats,
                asset -> {
                    customer.setAvatarPath(asset.secureUrl());
                    customer.setAvatarPublicId(asset.publicId());
                    customer.setAvatarResourceType(asset.resourceType());
                },
                () -> customerRepository.save(customer));
    }

    private void migrateUser(User user, boolean dryRun, MigrationStats stats) {
        migrateAsset(
                "users",
                user.getId(),
                user.getAvatarPath(),
                user.getAvatarPublicId(),
                dryRun,
                stats,
                asset -> {
                    user.setAvatarPath(asset.secureUrl());
                    user.setAvatarPublicId(asset.publicId());
                    user.setAvatarResourceType(asset.resourceType());
                },
                () -> userRepository.save(user));
    }

    private void migrateAsset(
            String entityType,
            Long entityId,
            String assetPath,
            String existingPublicId,
            boolean dryRun,
            MigrationStats stats,
            Consumer<CloudinaryService.Asset> updateAsset,
            Runnable saveEntity) {
        stats.scanned++;

        if (!StringUtils.hasText(assetPath)
                || !assetPath.startsWith(LEGACY_PREFIX)
                || StringUtils.hasText(existingPublicId)) {
            stats.skipped++;
            return;
        }

        Path localFile;
        try {
            localFile = resolveLegacyFile(assetPath);
        } catch (IllegalArgumentException exception) {
            stats.failed++;
            log.error("Unsafe legacy asset path for {}#{}: {}", entityType, entityId, assetPath);
            return;
        }

        if (!Files.isRegularFile(localFile) || !Files.isReadable(localFile)) {
            stats.missing++;
            log.warn("Legacy asset file is missing or unreadable for {}#{}: {}", entityType, entityId, localFile);
            return;
        }

        if (dryRun) {
            stats.planned++;
            log.info("[dry-run] Would migrate {}#{} from {}", entityType, entityId, localFile);
            return;
        }

        CloudinaryService.Asset uploadedAsset = null;
        try {
            uploadedAsset = cloudinaryService.uploadImage(
                    localFile,
                    CLOUDINARY_FOLDER + "/" + entityType,
                    String.valueOf(entityId));
            updateAsset.accept(uploadedAsset);
            saveEntity.run();
            stats.migrated++;
            log.info("Migrated {}#{} from {} to {}", entityType, entityId, localFile, uploadedAsset.secureUrl());
        } catch (RuntimeException exception) {
            if (uploadedAsset != null) {
                cloudinaryService.delete(
                        uploadedAsset.secureUrl(),
                        uploadedAsset.publicId(),
                        uploadedAsset.resourceType());
            }
            stats.failed++;
            log.error("Failed to migrate {}#{} from {}", entityType, entityId, localFile, exception);
        }
    }

    private Path resolveLegacyFile(String assetPath) {
        Path uploadRoot = uploadPathResolver.resolve("").toAbsolutePath().normalize();
        String relativePath = assetPath.substring(LEGACY_PREFIX.length());
        Path resolved = uploadPathResolver.resolve(relativePath).toAbsolutePath().normalize();
        if (!resolved.startsWith(uploadRoot)) {
            throw new IllegalArgumentException("Path escapes uploads root");
        }
        if (!Files.isRegularFile(resolved) || !Files.isReadable(resolved)) {
            return resolved;
        }

        try {
            Path realRoot = uploadRoot.toRealPath();
            Path realFile = resolved.toRealPath();
            if (!realFile.startsWith(realRoot)) {
                throw new IllegalArgumentException("Path escapes uploads root through a symlink");
            }
            return realFile;
        } catch (java.io.IOException exception) {
            throw new IllegalArgumentException("Cannot resolve legacy asset path", exception);
        }
    }

    public record MigrationReport(int scanned, int migrated, int planned, int skipped, int missing, int failed) {
    }

    private static final class MigrationStats {
        private int scanned;
        private int migrated;
        private int planned;
        private int skipped;
        private int missing;
        private int failed;

        private MigrationReport toReport() {
            return new MigrationReport(scanned, migrated, planned, skipped, missing, failed);
        }
    }
}
