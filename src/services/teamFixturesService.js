import db from "../config/database.js";

export function insertOrReplaceTeamFixture(row) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO team_fixtures (
      teamId,
      season,
      fixtureId,
      fixtureDate,
      statusShort,
      statusLong,
      homeTeamId,
      homeTeamName,
      awayTeamId,
      awayTeamName,
      goalsHome,
      goalsAway,
      leagueName,
      leagueCountry
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    row.teamId,
    row.season,
    row.fixtureId,
    row.fixtureDate,
    row.statusShort,
    row.statusLong,
    row.homeTeamId,
    row.homeTeamName,
    row.awayTeamId,
    row.awayTeamName,
    row.goalsHome,
    row.goalsAway,
    row.leagueName,
    row.leagueCountry
  );
}

export function getTeamFixturesFromDb(teamId, season = 2025) {
  const stmt = db.prepare(`
    SELECT *
    FROM team_fixtures
    WHERE teamId = ? AND season = ?
    ORDER BY datetime(fixtureDate) ASC
  `);

  return stmt.all(teamId, season);
}