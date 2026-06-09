import db from "../config/database.js";

export function insertOrReplacePlayerStat(row) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO player_statistics (
      playerId,
      teamId,
      leagueId,
      season,
      playerName,
      age,
      nationality,
      photo,
      position,
      appearances,
      minutes,
      rating,
      goals,
      assists,
      interceptions
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    row.playerId,
    row.teamId,
    row.leagueId,
    row.season,
    row.playerName,
    row.age,
    row.nationality,
    row.photo,
    row.position,
    row.appearances,
    row.minutes,
    row.rating,
    row.goals,
    row.assists,
    row.interceptions
  );
}

export function getTeamLeadersFromDb(teamId, leagueId = 39, season = 2025) {
  const topGoalscorer = db.prepare(`
    SELECT *
    FROM player_statistics
    WHERE teamId = ? AND leagueId = ? AND season = ?
    ORDER BY goals DESC, minutes DESC
    LIMIT 1
  `).get(teamId, leagueId, season);

  const topAssister = db.prepare(`
    SELECT *
    FROM player_statistics
    WHERE teamId = ? AND leagueId = ? AND season = ?
    ORDER BY assists DESC, minutes DESC
    LIMIT 1
  `).get(teamId, leagueId, season);

  const mostInterceptions = db.prepare(`
    SELECT *
    FROM player_statistics
    WHERE teamId = ? AND leagueId = ? AND season = ?
    ORDER BY interceptions DESC, minutes DESC
    LIMIT 1
  `).get(teamId, leagueId, season);

  const highestRated = db.prepare(`
    SELECT *
    FROM player_statistics
    WHERE teamId = ? AND leagueId = ? AND season = ?
    AND rating IS NOT NULL
    ORDER BY CAST(rating AS REAL) DESC, minutes DESC
    LIMIT 1
  `).get(teamId, leagueId, season);

  return {
    topGoalscorer,
    topAssister,
    mostInterceptions,
    highestRated,
  };
}