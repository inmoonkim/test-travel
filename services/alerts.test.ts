import { describe, it, expect, vi, beforeEach } from "vitest";

// Use in-memory SQLite by overriding DATABASE_PATH env
vi.mock("@/lib/db", async () => {
  const Database = (await import("better-sqlite3")).default;
  const db = new Database(":memory:");
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
  return { getDb: () => db };
});

import { createAlert, getActiveAlerts, deactivateAlert } from "./alerts";

const BASE_INPUT = {
  email: "test@example.com",
  origin: "ICN",
  destination: "NRT",
  depart_from: "2026-06-15",
  depart_to: "2026-06-20",
  return_from: "2026-06-25",
  return_to: "2026-06-30",
  adults: 2,
  children: 0,
};

describe("alerts service", () => {
  beforeEach(async () => {
    const { getDb } = await import("@/lib/db");
    getDb().prepare("DELETE FROM price_alerts").run();
  });

  it("createAlert returns id and cancelToken in UUID format", async () => {
    const { id, cancelToken } = createAlert({
      ...BASE_INPUT,
      flight_target_price: 200000,
      hotel_target_price: 100000,
    });

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    expect(id).toMatch(uuidRegex);
    expect(cancelToken).toMatch(uuidRegex);
  });

  it("created alert appears in getActiveAlerts()", () => {
    createAlert({ ...BASE_INPUT, flight_target_price: 200000 });
    const alerts = getActiveAlerts();
    expect(alerts.length).toBe(1);
    expect(alerts[0].email).toBe("test@example.com");
  });

  it("deactivateAlert removes alert from getActiveAlerts()", () => {
    const { cancelToken } = createAlert({ ...BASE_INPUT, flight_target_price: 100000 });
    expect(getActiveAlerts().length).toBe(1);
    const changed = deactivateAlert(cancelToken);
    expect(changed).toBe(true);
    expect(getActiveAlerts().length).toBe(0);
  });

  it("deactivateAlert returns false for unknown token", () => {
    const changed = deactivateAlert("unknown-token");
    expect(changed).toBe(false);
  });

  it("allows flight_target_price only (hotel null)", () => {
    createAlert({ ...BASE_INPUT, flight_target_price: 150000, hotel_target_price: null });
    const alerts = getActiveAlerts();
    expect(alerts[0].flight_target_price).toBe(150000);
    expect(alerts[0].hotel_target_price).toBeNull();
  });

  it("allows hotel_target_price only (flight null)", () => {
    createAlert({ ...BASE_INPUT, flight_target_price: null, hotel_target_price: 80000 });
    const alerts = getActiveAlerts();
    expect(alerts[0].hotel_target_price).toBe(80000);
    expect(alerts[0].flight_target_price).toBeNull();
  });
});
