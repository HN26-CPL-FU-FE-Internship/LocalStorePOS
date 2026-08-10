ALTER TABLE stores ADD COLUMN image_public_id VARCHAR(512) NULL, ADD COLUMN image_resource_type VARCHAR(20) NULL;
ALTER TABLE categories ADD COLUMN image_public_id VARCHAR(512) NULL, ADD COLUMN image_resource_type VARCHAR(20) NULL;
ALTER TABLE items ADD COLUMN image_public_id VARCHAR(512) NULL, ADD COLUMN image_resource_type VARCHAR(20) NULL;
ALTER TABLE addons ADD COLUMN image_public_id VARCHAR(512) NULL, ADD COLUMN image_resource_type VARCHAR(20) NULL;
ALTER TABLE customers ADD COLUMN avatar_public_id VARCHAR(512) NULL, ADD COLUMN avatar_resource_type VARCHAR(20) NULL;
ALTER TABLE users ADD COLUMN avatar_public_id VARCHAR(512) NULL, ADD COLUMN avatar_resource_type VARCHAR(20) NULL;
