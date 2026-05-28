import { getDb } from "@/lib/db";
import type { PriceAlert, CreateAlertInput } from "@/types/alert";

export function createAlert(input: CreateAlertInput): { id: string; cancelToken: string } {
  const db = getDb();
  const id = crypto.randomUUID();
  const cancelToken = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO price_alerts
      (id, cancel_token, email, origin, destination, depart_from, depart_to,
       return_from, return_to, adults, children, flight_target_price,
       hotel_target_price, is_active, created_at, last_notified_at)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, NULL)
  `).run(
    id,
    cancelToken,
    input.email,
    input.origin,
    input.destination,
    input.depart_from,
    input.depart_to,
    input.return_from,
    input.return_to,
    input.adults,
    input.children,
    input.flight_target_price ?? null,
    input.hotel_target_price ?? null,
    now,
  );

  return { id, cancelToken };
}

export function getActiveAlerts(): PriceAlert[] {
  const db = getDb();
  return db.prepare("SELECT * FROM price_alerts WHERE is_active = 1").all() as PriceAlert[];
}

export function deactivateAlert(cancelToken: string): boolean {
  const db = getDb();
  const result = db
    .prepare("UPDATE price_alerts SET is_active = 0 WHERE cancel_token = ? AND is_active = 1")
    .run(cancelToken);
  return result.changes > 0;
}

export function recordNotification(id: string): void {
  const db = getDb();
  db.prepare("UPDATE price_alerts SET last_notified_at = ? WHERE id = ?").run(
    new Date().toISOString(),
    id,
  );
}
