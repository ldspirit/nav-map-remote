const THEMES = {
  NG: ['Hope', 'Peace', 'Unity', 'Prosperity', 'Freedom', 'Grace'],
  KE: ['Amani', 'Uhuru', 'Harambee', 'Safari', 'Neema'],
  GH: ['Joy', 'Faith', 'Victory', 'Courage', 'Harmony'],
  ZA: ['Ubuntu', 'Liberty', 'Sunrise', 'Harbor', 'Cedar']
};

export function pickStreetName(countryCode = 'NG') {
  const list = THEMES[countryCode] || THEMES.NG;
  return list[Math.floor(Math.random() * list.length)];
}
