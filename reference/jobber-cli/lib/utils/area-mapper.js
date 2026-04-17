/**
 * Area Mapper
 * Maps cities to KC area codes (LA, NLA, IE, OC, SDN, SDC)
 */

const AREA_MAP = {
  // LA Area
  'los angeles': 'LA',
  'la': 'LA',
  'hollywood': 'LA',
  'beverly hills': 'LA',
  'santa monica': 'LA',
  'west hollywood': 'LA',
  'culver city': 'LA',
  'downtown': 'LA',
  
  // NLA (North LA)
  'burbank': 'NLA',
  'glendale': 'NLA',
  'pasadena': 'NLA',
  'arcadia': 'NLA',
  'monrovia': 'NLA',
  'la canada': 'NLA',
  'altadena': 'NLA',
  
  // IE (Inland Empire)
  'riverside': 'IE',
  'corona': 'IE',
  'norco': 'IE',
  'ontario': 'IE',
  'rancho cucamonga': 'IE',
  'fontana': 'IE',
  'san bernardino': 'IE',
  'redlands': 'IE',
  
  // OC (Orange County)
  'orange': 'OC',
  'anaheim': 'OC',
  'irvine': 'OC',
  'santa ana': 'OC',
  'costa mesa': 'OC',
  'newport beach': 'OC',
  'huntington beach': 'OC',
  'fullerton': 'OC',
  'tustin': 'OC',
  'yorba linda': 'OC',
  
  // SDN (San Diego North)
  'oceanside': 'SDN',
  'carlsbad': 'SDN',
  'encinitas': 'SDN',
  'solana beach': 'SDN',
  'del mar': 'SDN',
  'vista': 'SDN',
  'san marcos': 'SDN',
  
  // SDC (San Diego Central)
  'san diego': 'SDC',
  'la jolla': 'SDC',
  'pacific beach': 'SDC',
  'mission beach': 'SDC',
  'point loma': 'SDC',
  'coronado': 'SDC',
};

/**
 * Get area code from city name
 * @param {string} city - City name
 * @returns {string} Area code (LA, NLA, IE, OC, SDN, SDC) or empty string
 */
export function getArea(city) {
  if (!city) {
    return '';
  }
  
  const cityLower = city.toLowerCase().trim();
  return AREA_MAP[cityLower] || '';
}

export default { getArea };

