// server.js
import express from "express";
import fetch from "node-fetch";
import { parseStringPromise as parseXml } from "xml2js";
import cors from "cors";

const app = express();
app.use(cors());

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

/* =========================
   Routes
   ========================= */
app.get("/", (_req, res) => res.json("hello"));

app.get("/api/news", async (req, res) => {
  try {
    const source = String(req.query.source || "bbc").toLowerCase();
    const url = FEEDS[source] || FEEDS.bbc;

    const r = await fetch(url, { headers: { "User-Agent": "news-proxy/1.0" } });
    const xml = await r.text();
    const parsed = await parseXml(xml, { explicitArray: false });

    // Normalize RSS -> JSON (+ capture categories if present)
    const channel = parsed?.rss?.channel;
    const itemsRaw = Array.isArray(channel?.item) ? channel.item : [channel?.item].filter(Boolean);

    let news = (itemsRaw || []).map((it) => {
      const categories = it?.category
        ? (Array.isArray(it.category) ? it.category : [it.category])
        : [];
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

    // Query options
    const topic = normalize(req.query.topic);    // "premierleague" to enforce PL
    const clubParam = normalize(req.query.club); // optional club

    // Massage each item for robust matching
    const massage = (n) => {
      const title = normalize(n.title);
      const desc  = normalize(n.description);
      const link  = String(n.link || "").toLowerCase();
      const cats  = normalize(n.categories);
      const hay   = `${title} ${desc} ${cats}`; // main searchable text
      return { ...n, _title: title, _desc: desc, _link: link, _hay: hay };
    };
    news = news.map(massage);

    /* 1) Exclude women by URL path (strongest signal) + regex fallback */
    news = news.filter((n) => {
      const link = n._link;
      const hitSub = WOMEN_LINK_SUBSTR.some((s) => link.includes(s));
      const hitRe  = WOMEN_LINK_REGEXPS.some((re) => re.test(link));
      return !(hitSub || hitRe);
    });

    /* 2) Exclude women by text (general + team variants + common phrases) */
    news = news.filter((n) => {
      if (containsAny(n._hay, WOMEN_TERMS)) return false;
      if (containsAny(n._hay, WOMEN_TEAM_TERMS)) return false;
      if (/\bengland women\b/i.test(n._hay)) return false;
      if (/\bwomen'?s football\b/i.test(n._hay)) return false;
      return true;
    });

    /* 3) Exclude Scottish by URL path and text */
    news = news.filter((n) => !SCOTLAND_LINK_SUBSTR.some((s) => n._link.includes(s)));
    news = news.filter((n) => {
      if (containsAny(n._hay, SCOTTISH_LEAGUE_TERMS)) return false;
      if (containsAny(n._hay, SCOTTISH_TEAMS)) return false;
      return true;
    });

    /* 4) If PL-only requested, block foreign leagues unless EPL explicitly present */
    if (topic === "premierleague") {
      news = news.filter((n) => {
        const hasEPL = containsAny(n._hay, EPL_LEAGUE_TERMS) || containsAny(n._hay, EPL_MEN_TEAMS);
        if (!hasEPL) return false;

        const mentionsForeign =
          FOREIGN_LINK_SUBSTR.some((s) => n._link.includes(s)) ||
          containsAny(n._hay, FOREIGN_LEAGUE_TERMS);

        // Allow foreign mentions only when article explicitly references EPL league terms
        if (mentionsForeign) {
          const explicitEPL = containsAny(n._hay, EPL_LEAGUE_TERMS);
          if (!explicitEPL) return false;
        }
        return true;
      });
    }

    /* 5) Optional: narrow to a specific club (?club=Arsenal) */
    if (clubParam) {
      const matchKey = Object.keys(CLUB_TERMS).find((k) => normalize(k) === clubParam);
      const terms = matchKey ? CLUB_TERMS[matchKey].map(normalize) : [clubParam];
      news = news.filter((n) => containsAny(n._hay, terms));
    }

    // Sort newest first
    news.sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0));

    res.json({ source, count: news.length, items: news });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load news" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT,"0.0.0.0", () => console.log(`News proxy on ${PORT}`));
