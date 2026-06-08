import { getGoalEventsByFixtureId } from "../services/fixtureEventsService.js";

export function getGoalEventsByFixture(req, res) {
  try {
    const { fixtureId } = req.params;

    const goals = getGoalEventsByFixtureId(fixtureId);

    res.json({
      count: goals.length,
      items: goals,
    });
  } catch (error) {
    console.error("Error reading fixture goal events:", error);
    res.status(500).json({ error: "Failed to fetch fixture goal events" });
  }
}