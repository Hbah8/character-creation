CREATE TABLE app.password_reset_tokens (
    token_hash varchar(64) PRIMARY KEY,
    account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX password_reset_tokens_account_idx ON app.password_reset_tokens(account_id);
CREATE INDEX password_reset_tokens_expiry_idx ON app.password_reset_tokens(expires_at);
