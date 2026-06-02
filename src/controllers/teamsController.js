import { getTeamsFromDb, getTeamByIdFromDb } from "../services/teamsService.js";

export function getTeams(req, res) {
  try {
    const leagueId = req.query.league || 39;
    const season = req.query.season || 2025;

    const teams = getTeamsFromDb(leagueId, season);

    res.json({
      count: teams.length,
      items: teams,
    });
  } catch (error) {
    console.error("Error reading teams:", error);
    res.status(500).json({ error: "Failed to fetch teams" });
  }
}

export function getTeamById(req, res) {
  try {
    const { teamId } = req.params;

    const team = getTeamByIdFromDb(teamId);

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    res.json(team);
  } catch (error) {
    console.error("Error reading team:", error);
    res.status(500).json({ error: "Failed to fetch team" });
  }
}