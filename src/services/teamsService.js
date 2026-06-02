import db from "../config/database.js";

export function insertOrReplaceTeam(row) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO teams (
      leagueId,
      season,
      teamId,
      teamName,
      teamLogo,
      country,
      founded,
      venueName,
      venueCity
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    row.leagueId,
    row.season,
    row.teamId,
    row.teamName,
    row.teamLogo,
    row.country,
    row.founded,
    row.venueName,
    row.venueCity
  );
}

export function getTeamsFromDb(leagueId = 39, season = 2025) {
  const stmt = db.prepare(`
    SELECT *
    FROM teams
    WHERE leagueId = ? AND season = ?
    ORDER BY teamName ASC
  `);

  return stmt.all(leagueId, season);
}

export function getTeamByIdFromDb(teamId) {
  const stmt = db.prepare(`
    SELECT *
    FROM teams
    WHERE teamId = ?
  `);

  return stmt.get(teamId);
}