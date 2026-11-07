CREATE TABLE app.accounts (
    id uuid PRIMARY KEY,
    email varchar(254) NOT NULL UNIQUE,
    password_hash varchar(255) NOT NULL,
    email_verified boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT accounts_normalized_email CHECK (email = lower(trim(email)))
);

CREATE TABLE app.email_tokens (
    token_hash varchar(64) PRIMARY KEY,
    account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
    purpose varchar(32) NOT NULL CHECK (purpose = 'verify_email'),
    expires_at timestamptz NOT NULL,
    used_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX email_tokens_account_idx ON app.email_tokens(account_id);
CREATE INDEX email_tokens_expiry_idx ON app.email_tokens(expires_at);

-- Spring Session JDBC's PostgreSQL schema, owned exclusively by Flyway.
CREATE TABLE app.spring_session (
    primary_id char(36) NOT NULL PRIMARY KEY,
    session_id char(36) NOT NULL UNIQUE,
    creation_time bigint NOT NULL,
    last_access_time bigint NOT NULL,
    max_inactive_interval integer NOT NULL,
    expiry_time bigint NOT NULL,
    principal_name varchar(100)
);
CREATE INDEX spring_session_expiry_idx ON app.spring_session(expiry_time);
CREATE INDEX spring_session_principal_idx ON app.spring_session(principal_name);
CREATE TABLE app.spring_session_attributes (
    session_primary_id char(36) NOT NULL REFERENCES app.spring_session(primary_id) ON DELETE CASCADE,
    attribute_name varchar(200) NOT NULL,
    attribute_bytes bytea NOT NULL,
    PRIMARY KEY (session_primary_id, attribute_name)
);

CREATE TABLE app.request_limits (
    bucket_hash varchar(64) PRIMARY KEY,
    attempts integer NOT NULL CHECK (attempts > 0),
    expires_at timestamptz NOT NULL
);
CREATE INDEX request_limits_expiry_idx ON app.request_limits(expires_at);
