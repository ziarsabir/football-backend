// server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import { getSavedNews, getLiveNews } from "./src/controllers/newsController.js";
import { getStandingsFromDB } from "./src/controllers/standingsController.js";
import { getTeams, getTeamById } from "./src/controllers/teamsController.js";
import { getTeamFixturesFromDB } from "./src/controllers/teamFixturesController.js";
import { getTeamTransfersFromDB } from "./src/controllers/teamTransfersController.js";
import { getSquadByTeam } from "./src/controllers/squadController.js";
import { getSavedLiveFixtures, updateAndGetLiveFixtures } from "./src/controllers/liveFixturesController.js";
import { getGoalEventsByFixture } from "./src/controllers/fixtureEventsController.js";
import { getTeamLeaders } from "./src/controllers/playerStatsController.js";


const app = express();
app.use(cors());

/* =========================
   Routes
   ========================= */
app.get("/", (_req, res) => res.json("hello"));

app.get("/api/news", getLiveNews);

const PORT = process.env.PORT || 4000;

// The route now delegates request handling to the controller, which keeps server.js clean and separates concerns.
app.get("/api/saved-news", getSavedNews);
app.get("/api/standings-db", getStandingsFromDB);

app.get("/api/teams-db", getTeams);
app.get("/api/teams-db/:teamId", getTeamById);

app.get("/api/team-fixtures-db/:teamId", getTeamFixturesFromDB);

app.get("/api/team-transfers-db/:teamId", getTeamTransfersFromDB);

app.get("/api/squad-db/:teamId", getSquadByTeam);

app.get("/api/live-fixtures", updateAndGetLiveFixtures);
app.get("/api/live-fixtures-db", getSavedLiveFixtures);
app.get("/api/fixture-events-db/:fixtureId", getGoalEventsByFixture);
app.get("/api/player-stats/:teamId", getTeamLeaders);

app.listen(PORT,"0.0.0.0", () => console.log(`News proxy on ${PORT}`));
