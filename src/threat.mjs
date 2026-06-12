/**
 * Deterministic threat engine. Pure functions, no I/O, fully unit-tested.
 *
 * Design rule: THIS module decides the threat level. The AI layer only
 * explains the decision; it can never change it.
 */

export const LEVELS = ["ALL_CLEAR", "WATCH", "WARNING", "IMMINENT"];

const EARTH_RADIUS_KM = 6371;
const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

export function haversineKm(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/**
 * Dead-reckon a storm position `hours` ahead along its reported motion.
 * movementDir: degrees (meteorological heading the storm moves toward)
 * movementSpeedKt: knots
 */
export function projectPosition(lat, lon, movementDir, movementSpeedKt, hours) {
  const distanceKm = movementSpeedKt * 1.852 * hours;
  const bearing = toRad(movementDir);
  const lat1 = toRad(lat);
  const lon1 = toRad(lon);
  const angular = distanceKm / EARTH_RADIUS_KM;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) +
      Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2)
    );
  return { lat: toDeg(lat2), lon: ((toDeg(lon2) + 540) % 360) - 180 };
}

/**
 * Minimum projected distance from the storm to the island over a horizon,
 * stepping the dead-reckoned track. Returns { km, atHours }.
 */
export function closestApproach(storm, island, horizonHours = 120, stepHours = 3) {
  let best = {
    km: haversineKm(storm.lat, storm.lon, island.lat, island.lon),
    atHours: 0,
  };
  if (!Number.isFinite(storm.movementDir) || !Number.isFinite(storm.movementSpeedKt)) {
    return best;
  }
  for (let h = stepHours; h <= horizonHours; h += stepHours) {
    const p = projectPosition(
      storm.lat,
      storm.lon,
      storm.movementDir,
      storm.movementSpeedKt,
      h
    );
    const km = haversineKm(p.lat, p.lon, island.lat, island.lon);
    if (km < best.km) best = { km, atHours: h };
  }
  return best;
}

/**
 * Threat level for one storm relative to the island.
 */
export function assessStorm(storm, island, thresholds) {
  const nowKm = haversineKm(storm.lat, storm.lon, island.lat, island.lon);
  const approach = closestApproach(storm, island);

  let level = "ALL_CLEAR";

  const inBasinBox =
    storm.lat <= thresholds.watchMaxLat &&
    storm.lon >= thresholds.watchMinLon &&
    storm.lon <= thresholds.watchMaxLon;
  if (inBasinBox) level = "WATCH";

  if (
    approach.km <= thresholds.warningKm &&
    approach.atHours <= thresholds.warningHours
  ) {
    level = "WARNING";
  }

  if (
    nowKm <= thresholds.imminentKm ||
    (approach.km <= thresholds.imminentKm &&
      approach.atHours <= thresholds.imminentHours)
  ) {
    level = "IMMINENT";
  }

  return {
    level,
    distanceNowKm: Math.round(nowKm),
    closestApproachKm: Math.round(approach.km),
    closestApproachInHours: approach.atHours,
  };
}

/**
 * Overall assessment across all active storms.
 */
export function assess(storms, island, thresholds) {
  const assessed = storms.map((s) => ({
    ...s,
    assessment: assessStorm(s, island, thresholds),
  }));
  const overall = assessed.reduce(
    (max, s) =>
      LEVELS.indexOf(s.assessment.level) > LEVELS.indexOf(max)
        ? s.assessment.level
        : max,
    "ALL_CLEAR"
  );
  return { overall, storms: assessed };
}
