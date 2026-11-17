ALTER TABLE app.world_handbook_entries
    DROP CONSTRAINT world_handbook_entries_handbook_category_check,
    ADD CONSTRAINT world_handbook_entries_handbook_category_check CHECK (
        handbook_category IN (
            'edge', 'hindrance', 'skill', 'weapon', 'gear', 'power', 'mount', 'racialAbility', 'arcaneBackground'
        )
    );
