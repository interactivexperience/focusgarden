/**
 * Ganzzahlige Differenz in Kalendertagen zwischen zwei "YYYY-MM-DD"-Datums-Keys.
 * Date.parse auf ein reines Datum ohne Zeitzone ankert an UTC-Mitternacht für
 * beide Seiten gleichermaßen, wodurch DST-Wechsel die Differenz nicht verfälschen –
 * vorausgesetzt, die Keys selbst sind bereits korrekte lokale Kalendertage
 * (siehe todayDateKey in storage.ts).
 */
export function daysBetween(fromKey: string, toKey: string): number {
  const from = Date.parse(fromKey)
  const to = Date.parse(toKey)
  if (Number.isNaN(from) || Number.isNaN(to)) return Infinity
  return Math.round((to - from) / 86400000)
}

/**
 * Streak-Wert für einen neuen Tag, an dem noch nicht geerntet wurde (App-Start
 * oder Tageswechsel während die App offen bleibt). Ein übersprungener Tag
 * (Lücke > 1) bricht die Serie; eine Lücke von genau 1 (gestern zuletzt
 * geerntet) lässt den Stand bis zur ersten Ernte des neuen Tages unangetastet.
 */
export function streakOnNewDay(streak: number, lastHarvestDate: string, today: string): number {
  return daysBetween(lastHarvestDate, today) > 1 ? 0 : streak
}

/**
 * Streak-Wert nach einer abgeschlossenen Fokuszeit. Mehrere Ernten am selben
 * Tag ändern den Stand nicht; eine Ernte nach genau einem Tag Lücke zählt als
 * fortgesetzte Serie; jede größere Lücke (oder die allererste Ernte) startet
 * eine neue Serie bei 1.
 */
export function streakOnHarvest(streak: number, lastHarvestDate: string, today: string): number {
  if (lastHarvestDate === today) return streak
  return daysBetween(lastHarvestDate, today) === 1 ? streak + 1 : 1
}
