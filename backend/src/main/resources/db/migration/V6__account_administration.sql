ALTER TABLE app.accounts
    ADD COLUMN approved boolean NOT NULL DEFAULT true,
    ADD COLUMN blocked boolean NOT NULL DEFAULT false;

CREATE INDEX accounts_admin_list_idx
    ON app.accounts (blocked, approved, created_at DESC);

CREATE TABLE app.admin_audit_log (
    id uuid PRIMARY KEY,
    actor_account_id uuid NOT NULL,
    action varchar(32) NOT NULL CHECK (action IN ('approved', 'blocked', 'unblocked', 'deleted')),
    target_account_id uuid NOT NULL,
    target_email varchar(254) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX admin_audit_log_created_idx ON app.admin_audit_log(created_at DESC);
CREATE INDEX admin_audit_log_target_idx ON app.admin_audit_log(target_account_id, created_at DESC);
