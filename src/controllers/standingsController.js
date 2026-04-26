import fetch from "node-fetch";
import db from "../config/database.js";
import { getStandingsFromDb } from "../models/standingsModel.js";


export function getStandingsFromDB(req, res) {
  const { league = 39, season = 2025 } = req.query;

  const rows = getStandingsFromDb(league, season);

  res.json({
    count: rows.length,
    items: rows,
  });
}