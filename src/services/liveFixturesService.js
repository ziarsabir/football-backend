import db from "../config/database.js";

export function insertOrReplaceLiveFixture(row) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO live_fixtures (
      fixtureId,
      fixtureDate,
      statusShort,
      statusLong,
      elapsed,
      homeTeamId,
      homeTeamName,
      awayTeamId,
      awayTeamName,
      goalsHome,
      goalsAway,
      leagueId,
      leagueName,
      leagueCountry,
      updatedAt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  stmt.run(
    row.fixtureId,
    row.fixtureDate,
    row.statusShort,
    row.statusLong,
    row.elapsed,
    row.homeTeamId,
    row.homeTeamName,
    row.awayTeamId,
    row.awayTeamName,
    row.goalsHome,
    row.goalsAway,
    row.leagueId,
    row.leagueName,
    row.leagueCountry
  );
}

export function getLiveFixturesFromDb() {
  const stmt = db.prepare(`
    SELECT *
    FROM live_fixtures
    ORDER BY datetime(fixtureDate) ASC
  `);

  return stmt.all();
}

export function clearLiveFixtures() {
  db.prepare(`DELETE FROM live_fixtures`).run();
}