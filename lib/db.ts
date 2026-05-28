import Database from "better-sqlite3";
import path from "path";

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    const dbPath =
      process.env.DATABASE_PATH ?? path.join(process.cwd(), "app.db");
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS price_alerts (
        id TEXT PRIMARY KEY,
        cancel_token TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        origin TEXT NOT NULL,
        destination TEXT NOT NULL,
        depart_from TEXT NOT NULL,
        depart_to TEXT NOT NULL,
        return_from TEXT NOT NULL,
        return_to TEXT NOT NULL,
        adults INTEGER NOT NULL,
        children INTEGER NOT NULL DEFAULT 0,
        flight_target_price INTEGER,
        hotel_target_price INTEGER,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        last_notified_at TEXT
      )
    `);
  }
  return db;
}

export { getDb };
