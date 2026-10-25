const COUNTRY_NAMES: Record<string, string> = {
  india: 'India',
  nepal: 'Nepal',
  bangladesh: 'Bangladesh',
  bhutan: 'Bhutan',
  sri_lanka: 'Sri Lanka',
  south_africa: 'South Africa'
};

export function countryName(country?: string): string {
  if (!country) return '';
  return COUNTRY_NAMES[country.toLowerCase()] || country;
}

export function trackLabel(contact: { brand?: string; country?: string; language?: string }): string {
  const brand = (contact.brand || '').toLowerCase();
  const country = (contact.country || '').toLowerCase();
  const language = (contact.language || '').toLowerCase();
  if (!brand) return '';
  if (brand === 'flovax') {
    if (country === 'nepal') return '🇳🇵 FLOVAX Nepal';
    if (country === 'india') return '🇮🇳 FLOVAX India';
    if (country) return `FLOVAX ${countryName(country)}`;
    if (language === 'en' || language === 'ne') return 'FLOVAX';
    return '🇳🇵 FLOVAX Nepal';
  }
  const place = countryName(country);
  return place ? `CLAREN ${place}` : 'CLAREN';
}

export function usesNepaliFlovaxForm(contact: { brand?: string; country?: string; language?: string }): boolean {
  const brand = (contact.brand || '').toLowerCase();
  if (brand !== 'flovax') return false;
  const country = (contact.country || '').toLowerCase();
  const language = (contact.language || '').toLowerCase();
  if (country === 'india') return false;
  if (country === 'nepal') return true;
  return !country && !language;
}
