import { getTeamLeadersFromDb } from "../services/playerStatsService.js";

export function getTeamLeaders(req, res) {
  try {
    const { teamId } = req.params;

    const leaders = getTeamLeadersFromDb(teamId);

    res.json(leaders);
  } catch (error) {
    console.error("Error fetching team leaders:", error);

    res.status(500).json({
      error: "Failed to fetch team leaders",
    });
  }
}