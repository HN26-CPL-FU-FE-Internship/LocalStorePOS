package com.pos.backend.service.AssetMigration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import org.springframework.context.ConfigurableApplicationContext;

import com.pos.backend.entity.Item;
import com.pos.backend.repository.AddonRepository;
import com.pos.backend.repository.CategoryRepository;
import com.pos.backend.repository.CustomerRepository;
import com.pos.backend.repository.ItemRepository;
import com.pos.backend.repository.StoreRepository;
import com.pos.backend.repository.UserRepository;
import com.pos.backend.service.CloudinaryService.CloudinaryService;
import com.pos.backend.config.UploadPathResolver;

import static org.mockito.Mockito.mock;

class LegacyAssetMigrationJobTest {

    @TempDir
    Path uploadRoot;

    private UploadPathResolver uploadPathResolver;
    private CloudinaryService cloudinaryService;
    private StoreRepository storeRepository;
    private CategoryRepository categoryRepository;
    private ItemRepository itemRepository;
    private AddonRepository addonRepository;
    private CustomerRepository customerRepository;
    private UserRepository userRepository;
    private ConfigurableApplicationContext applicationContext;

    @BeforeEach
    void setUp() {
        uploadPathResolver = mock(UploadPathResolver.class);
        cloudinaryService = mock(CloudinaryService.class);
        storeRepository = mock(StoreRepository.class);
        categoryRepository = mock(CategoryRepository.class);
        itemRepository = mock(ItemRepository.class);
        addonRepository = mock(AddonRepository.class);
        customerRepository = mock(CustomerRepository.class);
        userRepository = mock(UserRepository.class);
        applicationContext = mock(ConfigurableApplicationContext.class);

        when(uploadPathResolver.resolve("")).thenReturn(uploadRoot);
        when(storeRepository.findAll()).thenReturn(List.of());
        when(categoryRepository.findAll()).thenReturn(List.of());
        when(addonRepository.findAll()).thenReturn(List.of());
        when(customerRepository.findAll()).thenReturn(List.of());
        when(userRepository.findAll()).thenReturn(List.of());
    }

    @Test
    void dryRun_reportsPlan_withoutUploadingOrSaving() throws Exception {
        Item item = item(1L, "/uploads/items/food-01.jpg");
        Path image = uploadRoot.resolve("items/food-01.jpg");
        Files.createDirectories(image.getParent());
        Files.writeString(image, "fake-image");
        when(itemRepository.findAll()).thenReturn(List.of(item));
        when(uploadPathResolver.resolve("items/food-01.jpg")).thenReturn(image);

        LegacyAssetMigrationJob job = job();
        LegacyAssetMigrationJob.MigrationReport report = job.migrate(true);

        assertEquals(1, report.scanned());
        assertEquals(1, report.planned());
        assertEquals(0, report.migrated());
        verify(cloudinaryService, never()).uploadImage(any(Path.class), any(String.class), any(String.class));
        verify(itemRepository, never()).save(any(Item.class));
        assertTrue(Files.exists(image));
    }

    @Test
    void migratesLegacyImage_updatesDatabase_andKeepsLocalFile() throws Exception {
        Item item = item(7L, "/uploads/items/food-07.jpg");
        Path image = uploadRoot.resolve("items/food-07.jpg");
        Files.createDirectories(image.getParent());
        Files.writeString(image, "fake-image");
        when(itemRepository.findAll()).thenReturn(List.of(item));
        when(uploadPathResolver.resolve("items/food-07.jpg")).thenReturn(image);
        when(cloudinaryService.uploadImage(image, "restaurant-pos/legacy/items", "7"))
                .thenReturn(new CloudinaryService.Asset(
                        "https://res.cloudinary.com/demo/image/upload/v1/restaurant-pos/legacy/items/7.jpg",
                        "restaurant-pos/legacy/items/7",
                        "image"));

        LegacyAssetMigrationJob job = job();
        LegacyAssetMigrationJob.MigrationReport report = job.migrate(false);

        assertEquals(1, report.migrated());
        assertEquals("https://res.cloudinary.com/demo/image/upload/v1/restaurant-pos/legacy/items/7.jpg",
                item.getImagePath());
        assertEquals("restaurant-pos/legacy/items/7", item.getImagePublicId());
        assertEquals("image", item.getImageResourceType());
        verify(itemRepository).save(item);
        assertTrue(Files.exists(image));
    }

    @Test
    void skipsAlreadyMigratedRecord_withoutUploading() {
        Item item = item(2L, "https://res.cloudinary.com/demo/image/upload/v1/legacy/2.jpg");
        item.setImagePublicId("restaurant-pos/legacy/items/2");
        when(itemRepository.findAll()).thenReturn(List.of(item));

        LegacyAssetMigrationJob.MigrationReport report = job().migrate(false);

        assertEquals(1, report.scanned());
        assertEquals(1, report.skipped());
        verify(cloudinaryService, never()).uploadImage(any(Path.class), any(String.class), any(String.class));
    }

    @Test
    void saveFailure_deletesUploadedCloudinaryAsset() throws Exception {
        Item item = item(8L, "/uploads/items/food-08.jpg");
        Path image = uploadRoot.resolve("items/food-08.jpg");
        Files.createDirectories(image.getParent());
        Files.writeString(image, "fake-image");
        when(itemRepository.findAll()).thenReturn(List.of(item));
        when(uploadPathResolver.resolve("items/food-08.jpg")).thenReturn(image);
        CloudinaryService.Asset asset = new CloudinaryService.Asset(
                "https://res.cloudinary.com/demo/image/upload/v1/legacy/8.jpg",
                "restaurant-pos/legacy/items/8",
                "image");
        when(cloudinaryService.uploadImage(image, "restaurant-pos/legacy/items", "8")).thenReturn(asset);
        doThrow(new RuntimeException("database unavailable")).when(itemRepository).save(item);

        LegacyAssetMigrationJob.MigrationReport report = job().migrate(false);

        assertEquals(1, report.failed());
        verify(cloudinaryService).delete(asset.secureUrl(), asset.publicId(), asset.resourceType());
        assertTrue(Files.exists(image));
    }

    @Test
    void symlinkOutsideUploads_isRejectedWithoutUploading() throws Exception {
        Item item = item(9L, "/uploads/items/link.jpg");
        Path outside = uploadRoot.getParent().resolve("outside.jpg");
        Files.writeString(outside, "outside-file");
        Path link = uploadRoot.resolve("items/link.jpg");
        Files.createDirectories(link.getParent());
        Files.createSymbolicLink(link, outside);
        when(itemRepository.findAll()).thenReturn(List.of(item));
        when(uploadPathResolver.resolve("items/link.jpg")).thenReturn(link);

        LegacyAssetMigrationJob.MigrationReport report = job().migrate(false);

        assertEquals(1, report.failed());
        verify(cloudinaryService, never()).uploadImage(any(Path.class), any(String.class), any(String.class));
    }

    @Test
    void reportsMissingFile_withoutUploading() {
        Item item = item(3L, "/uploads/items/missing.jpg");
        Path image = uploadRoot.resolve("items/missing.jpg");
        when(itemRepository.findAll()).thenReturn(List.of(item));
        when(uploadPathResolver.resolve("items/missing.jpg")).thenReturn(image);

        LegacyAssetMigrationJob.MigrationReport report = job().migrate(false);

        assertEquals(1, report.missing());
        verify(cloudinaryService, never()).uploadImage(any(Path.class), any(String.class), any(String.class));
    }

    private LegacyAssetMigrationJob job() {
        return new LegacyAssetMigrationJob(
                uploadPathResolver,
                cloudinaryService,
                storeRepository,
                categoryRepository,
                itemRepository,
                addonRepository,
                customerRepository,
                userRepository,
                applicationContext);
    }

    private Item item(Long id, String imagePath) {
        Item item = Item.builder().name("Test item").imagePath(imagePath).build();
        item.setId(id);
        return item;
    }
}
