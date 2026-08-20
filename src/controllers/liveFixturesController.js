import "dotenv/config";
import fetch from "node-fetch";
import {
  clearLiveFixtures,
  getLiveFixturesFromDb,
  insertOrReplaceLiveFixture,
} from "../services/liveFixturesService.js";

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

const headers = {
  "X-RapidAPI-Key": API_KEY,
  "X-RapidAPI-Host": "v3.football.api-sports.io",
};

export async function updateAndGetLiveFixtures(req, res) {
  try {
    const leagueId = req.query.league || 39;
    const season = req.query.season || 2026;

    const response = await fetch(
      `${BASE_URL}/fixtures?live=all&league=${leagueId}&season=${season}`,
      { headers }
    );

    const data = await response.json();
    const fixtures = data?.response || [];

    clearLiveFixtures();

    fixtures.forEach((item) => {
      insertOrReplaceLiveFixture({
        fixtureId: item.fixture.id,
        fixtureDate: item.fixture.date,
        statusShort: item.fixture.status?.short,
        statusLong: item.fixture.status?.long,
        elapsed: item.fixture.status?.elapsed,
        homeTeamId: item.teams.home?.id,
        homeTeamName: item.teams.home?.name,
        awayTeamId: item.teams.away?.id,
        awayTeamName: item.teams.away?.name,
        goalsHome: item.goals?.home,
        goalsAway: item.goals?.away,
        leagueId: item.league?.id,
        leagueName: item.league?.name,
        leagueCountry: item.league?.country,
      });
    });

    const liveFixtures = getLiveFixturesFromDb();

    res.json({
      count: liveFixtures.length,
      items: liveFixtures,
    });
  } catch (error) {
    console.error("Error fetching live fixtures:", error);
    res.status(500).json({ error: "Failed to fetch live fixtures" });
  }
}

export function getSavedLiveFixtures(req, res) {
  try {
    const liveFixtures = getLiveFixturesFromDb();

    res.json({
      count: liveFixtures.length,
      items: liveFixtures,
    });
  } catch (error) {
    console.error("Error reading live fixtures:", error);
    res.status(500).json({ error: "Failed to read saved live fixtures" });
  }
}