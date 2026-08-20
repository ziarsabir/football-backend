import "dotenv/config";
import fetch from "node-fetch";
import { getTeamFixturesFromDb } from "../src/services/teamFixturesService.js";
import { getTeamsFromDb } from "../src/services/teamsService.js";
import { insertOrReplaceFixtureEvent } from "../src/services/fixtureEventsService.js";

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

const headers = {
  "X-RapidAPI-Key": API_KEY,
  "X-RapidAPI-Host": "v3.football.api-sports.io",
};

async function updateFixtureEvents() {
  try {
    const leagueId = 39;
    const season = 2026;

    const teams = getTeamsFromDb(leagueId, season);

    console.log(`Fetching fixture events for ${teams.length} teams...`);

    const seenFixtureIds = new Set();

    for (const team of teams) {
      const fixtures = getTeamFixturesFromDb(team.teamId, season);

      for (const fixture of fixtures) {
        if (seenFixtureIds.has(fixture.fixtureId)) continue;
        seenFixtureIds.add(fixture.fixtureId);

        const response = await fetch(
          `${BASE_URL}/fixtures/events?fixture=${fixture.fixtureId}`,
          { headers }
        );

        const data = await response.json();
        const events = data?.response || [];

        events.forEach((event) => {
          insertOrReplaceFixtureEvent({
            fixtureId: fixture.fixtureId,
            teamId: event.team?.id,
            teamName: event.team?.name,
            playerId: event.player?.id,
            playerName: event.player?.name,
            assistId: event.assist?.id,
            assistName: event.assist?.name,
            eventTime: event.time?.elapsed,
            extraTime: event.time?.extra,
            type: event.type,
            detail: event.detail,
            comments: event.comments,
          });
        });

        console.log(`Saved ${events.length} events for fixture ${fixture.fixtureId}`);
      }
    }

    console.log("Finished updating fixture events.");
  } catch (error) {
    console.error("Failed to update fixture events:", error);
  }
}

updateFixtureEvents();