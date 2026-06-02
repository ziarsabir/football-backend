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

export function getNewsBySource(source) {
  const stmt = db.prepare(`
    SELECT * FROM news
    WHERE source = ?
    ORDER BY datetime(pubDate) DESC
  `);

  return stmt.all(source);
}