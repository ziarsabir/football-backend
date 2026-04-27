import "dotenv/config";
import fetch from "node-fetch";
import { getTeamsFromDb } from "../src/models/teamsModel.js";
import { insertOrReplaceTeamFixture } from "../src/models/teamFixturesModel.js";

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

const headers = {
  "X-RapidAPI-Key": API_KEY,
  "X-RapidAPI-Host": "v3.football.api-sports.io",
};

async function updateTeamFixtures() {
  try {
    const leagueId = 39;
    const season = 2025;

    const teams = getTeamsFromDb(leagueId, season);

    console.log(`Fetching fixtures for ${teams.length} teams...`);

    for (const team of teams) {
      const response = await fetch(
        `${BASE_URL}/fixtures?team=${team.teamId}&season=${season}`,
        { headers }
      );

      const data = await response.json();
      const fixtures = data?.response || [];

      fixtures.forEach((item) => {
        insertOrReplaceTeamFixture({
          teamId: team.teamId,
          season,
          fixtureId: item.fixture.id,
          fixtureDate: item.fixture.date,
          statusShort: item.fixture.status?.short,
          statusLong: item.fixture.status?.long,
          homeTeamId: item.teams.home?.id,
          homeTeamName: item.teams.home?.name,
          awayTeamId: item.teams.away?.id,
          awayTeamName: item.teams.away?.name,
          goalsHome: item.goals.home,
          goalsAway: item.goals.away,
          leagueName: item.league.name,
          leagueCountry: item.league.country,
        });
      });

      console.log(`Saved ${fixtures.length} fixtures for ${team.teamName}`);
    }

    console.log("Finished updating team fixtures.");
  } catch (error) {
    console.error("Failed to update team fixtures:", error);
  }
}

updateTeamFixtures();