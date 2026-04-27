import fetch from "node-fetch";
import { parseStringPromise as parseXml } from "xml2js"; 
// Import functions from the model (this is where we interact with the database)
import { getAllNews, getNewsBySource, insertNewsItem } from "../models/newsModel.js";

// General football feeds (we'll keyword-filter)
const FEEDS = {
  bbc: "https://www.bbc.com/sport/football/premier-league/rss.xml",
  skysportsnews: "https://www.skysports.com/rss/11095", // Sky Sports News - Football
  espn: "https://www.espn.com/espn/rss/soccer/news",
};

/* =========================
   Helpers & Normalization
   ========================= */
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const wb = (term) => new RegExp(`\\b${esc(term)}\\b`, "i"); // word-boundary regex
const containsAny = (hay, terms) => terms.some((t) => wb(t).test(hay));

// Strip HTML tags
const stripHtml = (html) => String(html || "").replace(/<[^>]+>/g, " ");

// Normalize text: unify quotes, strip HTML, collapse spaces, lowercase
const normalize = (s) =>
  String(s || "")
    .replace(/[\u2018\u2019\u201A\u2032]/g, "'")     // curly → straight apostrophes
    .replace(/[\u201C\u201D\u201E\u2033]/g, '"')     // curly → straight quotes
    .replace(/<[^>]+>/g, " ")                        // strip HTML
    .replace(/\s+/g, " ")                            // collapse whitespace
    .trim()
    .toLowerCase();

/* =========================
   Positive allow-list (MEN'S EPL)
   ========================= */
const EPL_LEAGUE_TERMS = ["premier league", "epl"];

const EPL_MEN_TEAMS = [
  "arsenal",
  "aston villa",
  "bournemouth",
  "brentford",
  "brighton", "brighton & hove albion", "brighton and hove albion",
  "chelsea",
  "crystal palace",
  "everton",
  "fulham",
  "ipswich",
  "leeds", "leeds united",
  "leicester", "leicester city",
  "liverpool",
  "manchester city", "man city",
  "manchester united", "man united",
  "newcastle", "newcastle united",
  "nottingham forest", "nottm forest",
  "southampton",
  "tottenham", "spurs", "tottenham hotspur",
  "west ham", "west ham united",
  "wolves", "wolverhampton wanderers", "wolverhampton"
];

/* =========================
   Negative filters
   - Women’s football (terms + URL paths + regex)
   - Scottish football (terms + URL paths)
   - Foreign top leagues (terms + URL paths)
   ========================= */
const WOMEN_TERMS = [
  "women", "woman", "women's", "womens", "women’s", "female",
  "lionesses", "wsl", "fa women's super league", "fa womens super league",
  "women super league", "women’s super league", "ladies", "wfc"
];
const WOMEN_TEAM_TERMS = EPL_MEN_TEAMS.flatMap((t) => [
  `${t} women`, `${t} ladies`, `${t} wfc`
]);

// Expanded women link substrings (BBC + Sky + Guardian + ESPN)
const WOMEN_LINK_SUBSTR = [
  // BBC
  "/sport/football/womens-football",
  "/sport/football/womens",
  "/sport/football/england-women",
  "/sport/football/womens-super-league",
  "/sport/football/womens-championship",
  "/sport/football/womens-fa-cup",
  // Sky Sports
  "/football/womens-football",
  // Guardian
  "/football/womensfootball",
  // ESPN
  "/soccer/womens-",
  "/womens-soccer",
];
// Broad regex fallback for any football path containing "women" or "womens"
const WOMEN_LINK_REGEXPS = [
  /\/football\/[^?#]*women\b/i,
  /\/football\/[^?#]*womens\b/i
];

const SCOTTISH_LEAGUE_TERMS = [
  "scottish premiership", "scottish championship", "scottish cup", "spfl"
];
const SCOTTISH_TEAMS = [
  "rangers", "celtic", "aberdeen", "hearts", "hibernian",
  "dundee", "dundee united", "motherwell", "kilmarnock",
  "st mirren", "st. mirren", "livingston", "ross county",
  "st johnstone", "st. johnstone"
];
const SCOTLAND_LINK_SUBSTR = [
  "/scotland/", "/scottish-", "/scottish_", "/spfl"
];

// Foreign leagues (block if mentioned unless there’s explicit EPL context)
const FOREIGN_LEAGUE_TERMS = [
  "bundesliga",
  "la liga", "laliga",
  "serie a",
  "ligue 1",
  "eredivisie",
  "primeira liga", "portuguese league",
  "mls", "major league soccer",
  "saudi pro league",
  "turkish super lig", "super lig",
  "j1 league", "a-league",
  "belgian pro league",
  "championship" // strict PL-only: also block EFL Championship
];
const FOREIGN_LINK_SUBSTR = [
  "/bundesliga", "/la-liga", "/laliga", "/serie-a",
  "/ligue-1", "/eredivisie", "/primeira-liga",
  "/mls", "/major-league-soccer",
  "/saudi-pro-league",
  "/super-lig", "/turkish-",
  "/j1-league", "/a-league",
  "/belgian-pro-league",
  "/efl-championship", "/championship-"
];

/* =========================
   Optional: club narrowing (?club=)
   ========================= */
const CLUB_TERMS = {
  "Arsenal": ["arsenal"],
  "Aston Villa": ["aston villa"],
  "Bournemouth": ["bournemouth"],
  "Brentford": ["brentford"],
  "Brighton": ["brighton", "brighton & hove albion", "brighton and hove albion"],
  "Chelsea": ["chelsea"],
  "Crystal Palace": ["crystal palace"],
  "Everton": ["everton"],
  "Fulham": ["fulham"],
  "Sunderland": ["sunderland"], // keep only if you want non-PL too
  "Burnley": ["burnley"],       // keep only if you want non-PL too
  "Leeds United": ["leeds", "leeds united"],
  "Liverpool": ["liverpool"],
  "Manchester City": ["manchester city", "man city"],
  "Manchester United": ["manchester united", "man united"],
  "Newcastle United": ["newcastle", "newcastle united"],
  "Nottingham Forest": ["nottingham forest", "nottm forest"],
  "Tottenham Hotspur": ["tottenham", "spurs", "tottenham hotspur"],
  "West Ham United": ["west ham", "west ham united"],
  "Wolves": ["wolves", "wolverhampton wanderers", "wolverhampton"]
};
// Controller function to handle GET /api/saved-news
export function getSavedNews(req, res) {
  try {
    // Extract 'source' from query params (e.g. ?source=bbc)
    const { source } = req.query;

    // If a source is provided, return filtered news from the database
    if (source) {
      const filtered = getNewsBySource(source);

      // Send filtered results back to the client
      return res.json({
        count: filtered.length,
        items: filtered
      });
    }

    // If no source is provided, return all saved news
    const all = getAllNews();

    res.json({
      count: all.length,
      items: all
    });

  } catch (error) {
    // If something goes wrong, log the error and return a 500 response
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch saved news"
    });
  }
}

//Fetches RSS data
//Converts XML → JavaScript
//Cleans and filters articles
//Stores them in SQLite
//Returns them to the frontend

export async function getLiveNews(req, res) {
  try {
    // Get the selected source from query params (default = BBC)
    const source = String(req.query.source || "bbc").toLowerCase();

    // Choose the correct RSS feed URL based on source
    const url = FEEDS[source] || FEEDS.bbc;

    // Fetch the RSS XML data from the external API
    const r = await fetch(url, { headers: { "User-Agent": "news-proxy/1.0" } });

    // Convert response to raw XML text
    const xml = await r.text();

    // Parse XML into a JavaScript object so we can work with it
    const parsed = await parseXml(xml, { explicitArray: false });

    // Safely access the RSS channel
    const channel = parsed?.rss?.channel;

    // Ensure items are always in an array (even if only one item exists)
    const itemsRaw = Array.isArray(channel?.item)
      ? channel.item
      : [channel?.item].filter(Boolean);
      

    // Convert raw RSS items into clean JS objects
    let news = (itemsRaw || []).map((it) => {
      // Ensure categories are always an array
      const categories = it?.category
        ? (Array.isArray(it.category) ? it.category : [it.category])
        : [];

      // Combine all categories into one string for searching/filtering
      const catText = categories
        .map((c) => (typeof c === "string" ? c : c?._ || ""))
        .join(" ");

      return {
        title: it?.title,
        link: it?.link,
        pubDate: it?.pubDate || it?.published || it?.updated,
        description: it?.description,
        categories: catText,
        source
      };
    });

    // Get optional filters from query params
    const topic = normalize(req.query.topic);
    const clubParam = normalize(req.query.club);

    // Prepare each item for advanced filtering (create searchable text)
    const massage = (n) => {
      const title = normalize(n.title);
      const desc = normalize(n.description);
      const link = String(n.link || "").toLowerCase();
      const cats = normalize(n.categories);

      // Combine everything into one searchable string
      const hay = `${title} ${desc} ${cats}`;

      return { ...n, _title: title, _desc: desc, _link: link, _hay: hay };
    };

    // Apply transformation to all news items
    news = news.map(massage);

    // Remove women's football articles (based on URL patterns)
    news = news.filter((n) => {
      const link = n._link;
      const hitSub = WOMEN_LINK_SUBSTR.some((s) => link.includes(s));
      const hitRe = WOMEN_LINK_REGEXPS.some((re) => re.test(link));
      return !(hitSub || hitRe);
    });

    // Remove women's football articles (based on text content)
    news = news.filter((n) => {
      if (containsAny(n._hay, WOMEN_TERMS)) return false;
      if (containsAny(n._hay, WOMEN_TEAM_TERMS)) return false;
      if (/\bengland women\b/i.test(n._hay)) return false;
      if (/\bwomen'?s football\b/i.test(n._hay)) return false;
      return true;
    });

    // Remove Scottish football articles (URL + text filters)
    news = news.filter((n) => !SCOTLAND_LINK_SUBSTR.some((s) => n._link.includes(s)));
    news = news.filter((n) => {
      if (containsAny(n._hay, SCOTTISH_LEAGUE_TERMS)) return false;
      if (containsAny(n._hay, SCOTTISH_TEAMS)) return false;
      return true;
    });

    // If Premier League filter is applied, restrict results
    if (topic === "premierleague") {
      news = news.filter((n) => {
        const hasEPL =
          containsAny(n._hay, EPL_LEAGUE_TERMS) ||
          containsAny(n._hay, EPL_MEN_TEAMS);

        if (!hasEPL) return false;

        const mentionsForeign =
          FOREIGN_LINK_SUBSTR.some((s) => n._link.includes(s)) ||
          containsAny(n._hay, FOREIGN_LEAGUE_TERMS);

        if (mentionsForeign) {
          const explicitEPL = containsAny(n._hay, EPL_LEAGUE_TERMS);
          if (!explicitEPL) return false;
        }

        return true;
      });
    }

    // If the user has selected a club from the dropdown (e.g. Arsenal)
    if (clubParam) {

        // Try to find a matching club key from the predefined CLUB_TERMS object
        // Example: "Arsenal" → ["arsenal"]
        const matchKey = Object.keys(CLUB_TERMS).find(
            (k) => normalize(k) === clubParam
        );

        // Get all possible terms for that club (e.g. "man united", "manchester united")
        // If no match is found, just use the raw clubParam as a fallback
        const terms = matchKey
            ? CLUB_TERMS[matchKey].map(normalize)
            : [clubParam];

        // Filter the news so only articles mentioning the selected club remain
        // This checks the combined searchable text (_hay) for any of the club terms
        // _hay is a combined searchable string (title + description + categories) used to easily check if an article contains certain keywords.
        news = news.filter((n) => containsAny(n._hay, terms));
    }

    // Sort articles by newest first
    news.sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));

    // Save each article into SQLite database
    news.forEach((item) => {
      insertNewsItem(item);
    });

    // Send final response back to frontend
    res.json({
      source,
      count: news.length,
      items: news
    });

  } catch (e) {
    // Handle errors safely
    console.error(e);
    res.status(500).json({ error: "Failed to load news" });
  }
}