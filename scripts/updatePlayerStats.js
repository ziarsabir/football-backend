import "dotenv/config";
import fetch from "node-fetch";

import { getTeamsFromDb } from "../src/services/teamsService.js";
import { insertOrReplacePlayerStat } from "../src/services/playerStatsService.js";

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

const headers = {
  "X-RapidAPI-Key": API_KEY,
  "X-RapidAPI-Host": "v3.football.api-sports.io",
};

async function updatePlayerStats() {
  try {
    const leagueId = 39;
    const season = 2026;

    const teams = getTeamsFromDb(leagueId, season);

    console.log(`Fetching player statistics for ${teams.length} teams...`);

    for (const team of teams) {
      let page = 1;
      let totalPages = 1;
      let totalPlayers = 0;

      // I loop through every available page of player statistics.
      while (page <= totalPages) {
        const response = await fetch(
          `${BASE_URL}/players?team=${team.teamId}&league=${leagueId}&season=${season}&page=${page}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error(
            `API request failed for ${team.teamName}: ${response.status}`
          );
        }

        const data = await response.json();

        if (data.errors && Object.keys(data.errors).length > 0) {
          throw new Error(
            `API-Football error for ${team.teamName}: ${JSON.stringify(data.errors)}`
          );
        }

        const players = data?.response || [];

        // I use the API pagination information to determine how many pages exist.
        totalPages = data?.paging?.total || 1;

        players.forEach((item) => {
          const player = item.player || {};
          const stats = item.statistics?.[0] || {};

          insertOrReplacePlayerStat({
            playerId: player.id,
            teamId: stats.team?.id,
            leagueId: stats.league?.id,
            season: stats.league?.season,
            playerName: player.name,
            age: player.age,
            nationality: player.nationality,
            photo: player.photo,
            position: stats.games?.position,
            appearances: stats.games?.appearences,
            minutes: stats.games?.minutes,
            rating: stats.games?.rating,
            goals: stats.goals?.total ?? 0,
            assists: stats.goals?.assists ?? 0,
            interceptions: stats.tackles?.interceptions ?? 0,
          });
        });

        totalPlayers += players.length;

        console.log(
          `${team.teamName}: fetched page ${page} of ${totalPages}`
        );

        page++;
      }

      console.log(
        `Saved ${totalPlayers} player stats for ${team.teamName}`
      );
    }

    console.log("Finished updating player statistics.");
  } catch (error) {
    console.error("Failed to update player statistics:", error);
    process.exitCode = 1;
  }
}

updatePlayerStats();