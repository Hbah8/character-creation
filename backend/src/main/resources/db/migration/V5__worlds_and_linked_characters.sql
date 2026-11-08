CREATE TABLE app.worlds (
    id uuid PRIMARY KEY,
    owner_account_id uuid NOT NULL REFERENCES app.accounts(id) ON DELETE CASCADE,
    name varchar(1000) NOT NULL,
    summary varchar(100000) NOT NULL,
    skill_points_budget numeric NOT NULL CHECK (skill_points_budget > 0),
    attribute_points_budget numeric NOT NULL CHECK (attribute_points_budget > 0),
    race_points_budget numeric NOT NULL CHECK (race_points_budget > 0),
    audio_data jsonb,
    version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT worlds_owner_id_unique UNIQUE (owner_account_id, id)
);

CREATE INDEX worlds_owner_updated_idx ON app.worlds(owner_account_id, updated_at DESC);

CREATE TABLE app.world_entities (
    world_id uuid NOT NULL REFERENCES app.worlds(id) ON DELETE CASCADE,
    id varchar(255) NOT NULL,
    sort_order integer NOT NULL CHECK (sort_order >= 0),
    entity_data jsonb NOT NULL CHECK (jsonb_typeof(entity_data) = 'object'),
    PRIMARY KEY (world_id, id),
    UNIQUE (world_id, sort_order)
);

CREATE TABLE app.world_relationships (
    world_id uuid NOT NULL REFERENCES app.worlds(id) ON DELETE CASCADE,
    id varchar(255) NOT NULL,
    sort_order integer NOT NULL CHECK (sort_order >= 0),
    source_id varchar(255) NOT NULL,
    target_id varchar(255) NOT NULL,
    relationship_data jsonb NOT NULL CHECK (jsonb_typeof(relationship_data) = 'object'),
    PRIMARY KEY (world_id, id),
    UNIQUE (world_id, sort_order),
    CONSTRAINT world_relationships_source_fk
        FOREIGN KEY (world_id, source_id) REFERENCES app.world_entities(world_id, id) ON DELETE CASCADE,
    CONSTRAINT world_relationships_target_fk
        FOREIGN KEY (world_id, target_id) REFERENCES app.world_entities(world_id, id) ON DELETE CASCADE,
    CONSTRAINT world_relationships_distinct_entities CHECK (source_id <> target_id)
);

CREATE TABLE app.world_races (
    world_id uuid NOT NULL REFERENCES app.worlds(id) ON DELETE CASCADE,
    id varchar(255) NOT NULL,
    sort_order integer NOT NULL CHECK (sort_order >= 0),
    race_data jsonb NOT NULL CHECK (jsonb_typeof(race_data) = 'object'),
    PRIMARY KEY (world_id, id),
    UNIQUE (world_id, sort_order)
);

CREATE TABLE app.world_handbook_entries (
    world_id uuid NOT NULL REFERENCES app.worlds(id) ON DELETE CASCADE,
    handbook_category varchar(32) NOT NULL CHECK (
        handbook_category IN ('edge', 'hindrance', 'skill', 'weapon', 'gear', 'power', 'mount', 'racialAbility')
    ),
    id varchar(255) NOT NULL,
    sort_order integer NOT NULL CHECK (sort_order >= 0),
    entry_data jsonb NOT NULL CHECK (jsonb_typeof(entry_data) = 'object'),
    PRIMARY KEY (world_id, handbook_category, id),
    UNIQUE (world_id, sort_order)
);

ALTER TABLE app.characters
    ADD COLUMN world_id uuid,
    DROP CONSTRAINT characters_standalone,
    ADD CONSTRAINT characters_world_owner_fk
        FOREIGN KEY (owner_account_id, world_id) REFERENCES app.worlds(owner_account_id, id) ON DELETE RESTRICT,
    ADD CONSTRAINT characters_world_json_consistent CHECK (
        (world_id IS NULL AND (character_data->>'worldId' IS NULL OR character_data->>'worldId' = ''))
        OR world_id::text = lower(character_data->>'worldId')
    );

CREATE INDEX characters_owner_world_updated_idx
    ON app.characters(owner_account_id, world_id, updated_at DESC);
