CREATE TABLE user_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id BIGINT UNSIGNED NOT NULL,

    refresh_token_hash VARCHAR(64) NOT NULL,

    revoked TINYINT(1) NOT NULL DEFAULT 0,

    expires_at DATETIME NOT NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    last_used_at DATETIME NULL,

    CONSTRAINT fk_user_sessions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT uk_user_sessions_refresh_token_hash
        UNIQUE (refresh_token_hash)
);

CREATE INDEX idx_user_sessions_user_id
ON user_sessions(user_id);

CREATE INDEX idx_user_sessions_expires_at
ON user_sessions(expires_at);