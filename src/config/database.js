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

db.exec(`
  CREATE TABLE IF NOT EXISTS standings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    leagueId INTEGER NOT NULL,
    season INTEGER NOT NULL,
    rank INTEGER NOT NULL,
    teamId INTEGER NOT NULL,
    teamName TEXT NOT NULL,
    teamLogo TEXT,
    points INTEGER,
    goalsDiff INTEGER,
    played INTEGER,
    win INTEGER,
    draw INTEGER,
    lose INTEGER,
    form TEXT,
    groupName TEXT,
    status TEXT,
    description TEXT,
    goalsFor INTEGER,
    goalsAgainst INTEGER,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(leagueId, season, teamId)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    leagueId INTEGER NOT NULL,
    season INTEGER NOT NULL,
    teamId INTEGER NOT NULL,
    teamName TEXT NOT NULL,
    teamLogo TEXT,
    country TEXT,
    founded INTEGER,
    venueName TEXT,
    venueCity TEXT,
    UNIQUE(leagueId, season, teamId)
  )
`);

export default db;