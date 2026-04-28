import { getTeamTransfersFromDb } from "../models/teamTransfersModel.js";

export function getTeamTransfersFromDB(req, res) {
  try {
    const { teamId } = req.params;

    const transfers = getTeamTransfersFromDb(teamId);

    res.json({
      count: transfers.length,
      items: transfers,
    });
  } catch (error) {
    console.error("Error fetching team transfers:", error);
    res.status(500).json({ error: "Failed to fetch transfers" });
  }
}