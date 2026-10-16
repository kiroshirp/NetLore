CREATE TABLE IF NOT EXISTS servers (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 description TEXT NOT NULL DEFAULT '',
 details TEXT NOT NULL DEFAULT '{}',
 category TEXT NOT NULL CHECK(category IN ('roleplay','freeroam','racing','pvp','social','custom')),
 url TEXT NOT NULL,
 promoted INTEGER NOT NULL DEFAULT 0 CHECK(promoted IN (0,1)),
 published INTEGER NOT NULL DEFAULT 1 CHECK(published IN (0,1)),
 revision INTEGER NOT NULL DEFAULT 1,
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS servers_public ON servers(published, promoted);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash TEXT PRIMARY KEY,
 auth_version TEXT NOT NULL,
 expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS login_limits (
 key TEXT PRIMARY KEY,
 attempts INTEGER NOT NULL,
 expires_at INTEGER NOT NULL
);
