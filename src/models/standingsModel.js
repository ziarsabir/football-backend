import db from "../config/database.js";

// Saves one club row 
export function insertOrReplaceStandingRow(row) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO standings (
      leagueId,
      season,
      rank,
      teamId,
      teamName,
      teamLogo,
      points,
      goalsDiff,
      played,
      win,
      draw,
      lose,
      form,
      groupName,
      status,
      description,
      goalsFor,
      goalsAgainst,
      updatedAt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  stmt.run(
    row.leagueId,
    row.season,
    row.rank,
    row.teamId,
    row.teamName,
    row.teamLogo,
    row.points,
    row.goalsDiff,
    row.played,
    row.win,
    row.draw,
    row.lose,
    row.form,
    row.groupName,
    row.status,
    row.description,
    row.goalsFor,
    row.goalsAgainst
  );
}

// Reads standings back in rank order 
export function getStandingsFromDb(leagueId = 39, season = 2025) {
  const stmt = db.prepare(`
    SELECT *
    FROM standings
    WHERE leagueId = ? AND season = ?
    ORDER BY rank ASC
  `);

  return stmt.all(leagueId, season);
}