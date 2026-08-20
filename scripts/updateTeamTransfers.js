import "dotenv/config";
import fetch from "node-fetch";
import { getTeamsFromDb } from "../src/services/teamsService.js";
import { insertOrReplaceTeamTransfer } from "../src/services/teamTransfersService.js";

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

const headers = {
  "X-RapidAPI-Key": API_KEY,
  "X-RapidAPI-Host": "v3.football.api-sports.io",
};

async function updateTeamTransfers() {
  try {
    const leagueId = 39;
    const season = 2026;

    const teams = getTeamsFromDb(leagueId, season);

    console.log(`Fetching transfers for ${teams.length} teams...`);

    for (const team of teams) {
      const response = await fetch(
        `${BASE_URL}/transfers?team=${team.teamId}`,
        { headers }
      );

      const data = await response.json();
      const transfers = data?.response || [];

      transfers.forEach((playerTransfer) => {
        const playerName = playerTransfer.player?.name;

        const transferList = playerTransfer.transfers || [];

        transferList.forEach((transfer) => {
          const fromTeamName = transfer.teams?.out?.name || "";
          const toTeamName = transfer.teams?.in?.name || "";

          let direction = "OTHER";

          if (toTeamName.toLowerCase() === team.teamName.toLowerCase()) {
            direction = "IN";
          }

          if (fromTeamName.toLowerCase() === team.teamName.toLowerCase()) {
            direction = "OUT";
          }

          // API-Football returns both transfer types and transfer fees
          // inside the "type" property, so I separate them before saving.
          const transferValue = transfer.type || "";

          // I check for a currency symbol to determine whether the value is a fee.
          const isFee = /€|£|\$/.test(transferValue);

          insertOrReplaceTeamTransfer({
            teamId: team.teamId,
            playerName,
            transferDate: transfer.date,

            // If the value contains a fee, there is no separate transfer type.
            transferType: isFee ? null : transferValue,

            // If the value contains money, I store it in the transferFee column.
            transferFee: isFee ? transferValue : null,

            fromTeamName,
            toTeamName,
            direction,
          });
        });
      });

      console.log(`Saved transfers for ${team.teamName}`);
    }

    console.log("Finished updating team transfers.");
  } catch (error) {
    console.error("Failed to update team transfers:", error);
  }
}

updateTeamTransfers();