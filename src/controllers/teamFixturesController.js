import { getTeamFixturesFromDb } from "../models/teamFixturesModel.js";

export function getTeamFixturesFromDB(req, res) {
  try {
    const { teamId } = req.params;
    const season = req.query.season || 2025;

    const fixtures = getTeamFixturesFromDb(teamId, season);

    res.json({
      count: fixtures.length,
      items: fixtures,
    });
  } catch (error) {
    console.error("Error reading team fixtures:", error);
    res.status(500).json({ error: "Failed to fetch team fixtures" });
  }
}