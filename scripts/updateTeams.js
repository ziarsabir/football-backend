import "dotenv/config";
import fetch from "node-fetch";
import { insertOrReplaceTeam } from "../src/services/teamsService.js";

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

const headers = {
  "X-RapidAPI-Key": API_KEY,
  "X-RapidAPI-Host": "v3.football.api-sports.io",
};

async function updateTeams() {
  try {
    const leagueId = 39;
    const season = 2025;

    console.log("Fetching Premier League teams...");

    const response = await fetch(
      `${BASE_URL}/teams?league=${leagueId}&season=${season}`,
      { headers }
    );

    const data = await response.json();
    const teams = data?.response || [];

    teams.forEach((item) => {
      insertOrReplaceTeam({
        leagueId,
        season,
        teamId: item.team.id,
        teamName: item.team.name,
        teamLogo: item.team.logo,
        country: item.team.country,
        founded: item.team.founded,
        venueName: item.venue?.name,
        venueCity: item.venue?.city,
      });
    });

    console.log(`Saved ${teams.length} teams to SQLite.`);
  } catch (error) {
    console.error("Failed to update teams:", error);
  }
}

updateTeams();