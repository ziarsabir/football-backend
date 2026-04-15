// insertNewsItem() saves one article into SQLite
// getAllNews() reads articles back out

import db from "../config/database.js";

export function insertNewsItem(item) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO news (source, title, link, pubDate, description, categories)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    item.source,
    item.title,
    item.link,
    item.pubDate,
    item.description,
    item.categories
  );
}

export function getAllNews() {
  const stmt = db.prepare(`
    SELECT * FROM news
    ORDER BY datetime(pubDate) DESC
  `);

  return stmt.all();
}

// Gets news from database where source matches (e.g. "bbc" or "ESPN" etc.)
export function getNewsBySource(source) {
  const stmt = db.prepare(`
    SELECT * FROM news
    WHERE source = ?
    ORDER BY datetime(pubDate) DESC
  `);

  return stmt.all(source);
}