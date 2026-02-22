export const COUNTRY_TEMPLATES = {
  NG: { country: 'Nigeria', postalDigits: 6, format: '{number} {street} {unit}, {postal} {city}, {state}, {country}' },
  KE: { country: 'Kenya', postalDigits: 5, format: '{number} {street} {unit}, {postal} {city}, {state}, {country}' },
  GH: { country: 'Ghana', postalDigits: 4, format: '{number} {street} {unit}, {postal} {city}, {state}, {country}' },
  ZA: { country: 'South Africa', postalDigits: 4, format: '{number} {street} {unit}, {postal} {city}, {state}, {country}' }
};

export function formatByCountry({
  countryCode = 'NG',
  number,
  street,
  unit = '',
  postal = '',
  city = '',
  state = ''
}) {
  const tpl = COUNTRY_TEMPLATES[countryCode] || COUNTRY_TEMPLATES.NG;
  return tpl.format
    .replace('{number}', number)
    .replace('{street}', street)
    .replace('{unit}', unit ? ` ${unit}` : '')
    .replace('{postal}', postal)
    .replace('{city}', city)
    .replace('{state}', state)
    .replace('{country}', tpl.country)
    .replace(/\s+/g, ' ')
    .replace(' ,', ',')
    .trim();
}
