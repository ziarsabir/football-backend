import db from "../config/database.js";

export function insertOrReplaceTeamTransfer(row) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO team_transfers (
      teamId,
      playerName,
      transferDate,
      transferType,
      transferFee,
      fromTeamName,
      toTeamName,
      direction
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    row.teamId,
    row.playerName,
    row.transferDate,
    row.transferType,
    row.transferFee,
    row.fromTeamName,
    row.toTeamName,
    row.direction
  );
}

export function getTeamTransfersFromDb(teamId) {
  const stmt = db.prepare(`
    SELECT *
    FROM team_transfers
    WHERE teamId = ?
    ORDER BY date(transferDate) DESC
  `);

  return stmt.all(teamId);
}