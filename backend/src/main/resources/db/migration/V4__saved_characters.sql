CREATE TABLE app.characters (
    id uuid PRIMARY KEY,
    owner_account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
    character_data jsonb NOT NULL,
    version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT characters_json_object CHECK (jsonb_typeof(character_data) = 'object'),
    CONSTRAINT characters_standalone CHECK (
        character_data->>'worldId' IS NULL OR character_data->>'worldId' = ''
    ),
    CONSTRAINT characters_no_portrait CHECK (COALESCE(character_data->>'portraitUrl', '') = '')
);

CREATE INDEX characters_owner_updated_idx ON app.characters(owner_account_id, updated_at DESC);
