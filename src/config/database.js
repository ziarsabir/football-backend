// This file creates a SQLite database file called football.sqlite
// Creates a news table if it does not already exist 

import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("football.sqlite");

db.exec(`
  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    title TEXT NOT NULL,
    link TEXT UNIQUE,
    pubDate TEXT,
    description TEXT,
    categories TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

export default db;