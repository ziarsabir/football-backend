import db from "../config/database.js";

export function insertOrReplaceFixtureEvent(row) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO fixture_events (
      fixtureId,
      teamId,
      teamName,
      playerId,
      playerName,
      assistId,
      assistName,
      eventTime,
      extraTime,
      type,
      detail,
      comments
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    row.fixtureId,
    row.teamId,
    row.teamName,
    row.playerId,
    row.playerName,
    row.assistId,
    row.assistName,
    row.eventTime,
    row.extraTime,
    row.type,
    row.detail,
    row.comments
  );
}

export function getGoalEventsByFixtureId(fixtureId) {
  const stmt = db.prepare(`
    SELECT *
    FROM fixture_events
    WHERE fixtureId = ?
    AND type = 'Goal'
    ORDER BY eventTime ASC
  `);

  return stmt.all(fixtureId);
}