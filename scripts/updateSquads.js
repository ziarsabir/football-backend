import "dotenv/config";
import fetch from "node-fetch";

import { getTeamsFromDb } from "../src/services/teamsService.js";
import { insertOrReplaceSquadPlayer } from "../src/services/squadService.js";

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

const headers = {
  "X-RapidAPI-Key": API_KEY,
  "X-RapidAPI-Host": "v3.football.api-sports.io",
};

async function updateSquads() {
  try {
    const leagueId = 39;
    const season = 2025;

    const teams = getTeamsFromDb(leagueId, season);

    console.log(`Fetching squads for ${teams.length} teams...`);

    for (const team of teams) {
      const response = await fetch(
        `${BASE_URL}/players/squads?team=${team.teamId}`,
        { headers }
      );

      const data = await response.json();

      const squad = data?.response?.[0]?.players || [];

      squad.forEach((player) => {
        insertOrReplaceSquadPlayer({
          teamId: team.teamId,
          playerId: player.id,
          playerName: player.name,
          age: player.age,
          number: player.number,
          position: player.position,
          photo: player.photo,
        });
      });

      console.log(
        `Saved ${squad.length} players for ${team.teamName}`
      );
    }

    console.log("Finished updating squads.");
  } catch (error) {
    console.error("Failed to update squads:", error);
  }
}

updateSquads(); 