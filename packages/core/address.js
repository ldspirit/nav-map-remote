// Core address logic (simplified MVP)

export const GPS_MATCH_THRESHOLD_METERS = 12;

export function formatAddress({ houseNumber, streetName, pNumber, city = '', state = '', postalCode = '', country = '' }) {
  const parts = [`${houseNumber} ${streetName} P${pNumber}`.trim()];
  const tail = [postalCode, city, state, country].filter(Boolean).join(', ');
  if (tail) parts.push(tail);
  return parts.join(', ');
}

export function chooseStreetType({ isDeadEnd = false, isCurved = false, widthMeters = 6 }) {
  if (isDeadEnd) return 'Close';
  if (isCurved) return 'Crescent';
  if (widthMeters < 4) return 'Lane';
  if (widthMeters >= 15) return 'Avenue';
  return 'Street';
}

export function generateStreetName(base = 'Hope') {
  return base;
}
