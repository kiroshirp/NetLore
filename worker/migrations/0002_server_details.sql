-- Apply once to an existing directory before deploying the extended profile API.
ALTER TABLE servers ADD COLUMN details TEXT NOT NULL DEFAULT '{}';
