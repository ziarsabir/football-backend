import { getSquadByTeamId } from "../services/squadService.js";

export function getSquadByTeam(req, res) {
  try {
    const { teamId } = req.params;

    const squad = getSquadByTeamId(teamId);

    res.json({
      count: squad.length,
      items: squad,
    });
  } catch (error) {
    console.error("Error reading squad:", error);
    res.status(500).json({ error: "Failed to fetch squad" });
  }
}