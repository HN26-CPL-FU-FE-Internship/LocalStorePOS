-- Cloudinary delivery URLs can be longer than the original local path limit.
ALTER TABLE stores MODIFY COLUMN image_path VARCHAR(1024) NULL;
ALTER TABLE categories MODIFY COLUMN image_path VARCHAR(1024) NULL;
ALTER TABLE items MODIFY COLUMN image_path VARCHAR(1024) NULL;
ALTER TABLE addons MODIFY COLUMN image_path VARCHAR(1024) NULL;
ALTER TABLE customers MODIFY COLUMN avatar_path VARCHAR(1024) NULL;
ALTER TABLE users MODIFY COLUMN avatar_path VARCHAR(1024) NULL;
