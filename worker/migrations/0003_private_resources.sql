CREATE TABLE IF NOT EXISTS private_resources (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 category TEXT NOT NULL CHECK(category IN ('script','map','addon','other')),
 status TEXT NOT NULL CHECK(status IN ('draft','ready')),
 description TEXT NOT NULL,
 url TEXT NOT NULL,
 revision INTEGER NOT NULL DEFAULT 1
);
