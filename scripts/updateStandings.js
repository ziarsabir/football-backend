import "dotenv/config";
import fetch from "node-fetch";
import { insertOrReplaceStandingRow } from "../src/services/standingsService.js";

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

const headers = {
  "X-RapidAPI-Key": API_KEY,
  "X-RapidAPI-Host": "v3.football.api-sports.io",
};

async function updateStandings() {
  try {
    const leagueId = 39;
    const season = 2025;

    console.log("Fetching latest standings...");

    const response = await fetch(
      `${BASE_URL}/standings?league=${leagueId}&season=${season}`,
      { headers }
    );

    const data = await response.json();

    const leagueBlock = data?.response?.[0]?.league;
    const standingsRows = leagueBlock?.standings?.[0] || [];

    standingsRows.forEach((teamRow) => {
      insertOrReplaceStandingRow({
        leagueId: leagueBlock.id,
        season: leagueBlock.season,
        rank: teamRow.rank,
        teamId: teamRow.team.id,
        teamName: teamRow.team.name,
        teamLogo: teamRow.team.logo,
        points: teamRow.points,
        goalsDiff: teamRow.goalsDiff,
        played: teamRow.all.played,
        win: teamRow.all.win,
        draw: teamRow.all.draw,
        lose: teamRow.all.lose,
        form: teamRow.form,
        groupName: teamRow.group,
        status: teamRow.status,
        description: teamRow.description,
        goalsFor: teamRow.all.goals.for,
        goalsAgainst: teamRow.all.goals.against,
      });
    });

    console.log(`Saved ${standingsRows.length} standings rows to SQLite.`);
  } catch (error) {
    console.error("Failed to update standings:", error);
  }
}

updateStandings();