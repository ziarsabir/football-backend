import fetch from "node-fetch";
import { insertOrReplaceStandingRow, getStandingsFromDb } from "../models/standingsModel.js";

const BASE_URL = "https://v3.football.api-sports.io";

// This route will: 
// 1. fetch live standings, 2. save each team row into SQLite, 3. still return the API data to the frontend

export async function getStandings(req, res) {
  try {
    const API_KEY = process.env.API_KEY;

    const headers = {
        "X-RapidAPI-Key": API_KEY,
        "X-RapidAPI-Host": "v3.football.api-sports.io",
    };

    const leagueId = req.query.league || 39;
    const season = req.query.season || 2025;

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
        goalsAgainst: teamRow.all.goals.against
      });
    });

    res.json(data);

  } catch (error) {
    console.error("Error fetching standings:", error);
    res.status(500).json({ error: "Failed to fetch standings" });
  }
}

export function getSavedStandings(req, res) {
  try {
    const leagueId = req.query.league || 39;
    const season = req.query.season || 2025;

    const standings = getStandingsFromDb(leagueId, season);

    res.json({
      count: standings.length,
      items: standings
    });
  } catch (error) {
    console.error("Error reading saved standings:", error);
    res.status(500).json({ error: "Failed to fetch saved standings" });
  }
}