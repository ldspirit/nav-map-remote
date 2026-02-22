// Core address logic (MVP)

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

export function nextHouseNumber(existingNumbers = []) {
  if (existingNumbers.length === 0) return '1';
  const nums = existingNumbers
    .map(n => String(n))
    .filter(n => /^\d+$/.test(n))
    .map(n => parseInt(n, 10))
    .sort((a, b) => a - b);
  const last = nums[nums.length - 1] || 0;
  return String(last + 1);
}
