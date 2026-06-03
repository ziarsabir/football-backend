import db from "../config/database.js";

export function insertOrReplaceSquadPlayer(row) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO squads (
      teamId,
      playerId,
      playerName,
      age,
      number,
      position,
      photo
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    row.teamId,
    row.playerId,
    row.playerName,
    row.age,
    row.number,
    row.position,
    row.photo
  );
}

export function getSquadByTeamId(teamId) {
  const stmt = db.prepare(`
    SELECT *
    FROM squads
    WHERE teamId = ?
    ORDER BY 
      CASE position
        WHEN 'Goalkeeper' THEN 1
        WHEN 'Defender' THEN 2
        WHEN 'Midfielder' THEN 3
        WHEN 'Attacker' THEN 4
        ELSE 5
      END,
      playerName ASC
  `);

  return stmt.all(teamId);
}