/**
 * Proximity and Geolocation Utility for KaamSetu
 *
 * Provides real Haversine distance calculations when coordinates are present or
 * resolvable from known Indian localities/pincodes.
 * When coordinates cannot be resolved, uses an honest locality-based hierarchy
 * (same locality -> same city -> different area) without displaying fabricated kilometers.
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ProximityResult {
  distanceKm: number | null;
  distanceLabel: string;
  isCalculatedDistance: boolean;
  proximityRank: number; // lower number = closer / higher priority
  localityMatchTier: "coordinates" | "same_locality" | "same_city" | "different_area";
}

// Standard coordinates for major localities, suburbs, and landmarks in Mumbai / MMR and major hubs
const KNOWN_LOCALITY_COORDINATES: Record<string, Coordinates> = {
  // Mumbai Western Suburbs
  "andheri west": { lat: 19.1363, lng: 72.8277 },
  "andheri east": { lat: 19.1136, lng: 72.8697 },
  "andheri": { lat: 19.1197, lng: 72.8468 },
  "bandra west": { lat: 19.0596, lng: 72.8295 },
  "bandra east": { lat: 19.0607, lng: 72.8524 },
  "bandra": { lat: 19.0596, lng: 72.8295 },
  "khar": { lat: 19.0700, lng: 72.8339 },
  "santacruz west": { lat: 19.0800, lng: 72.8370 },
  "santacruz east": { lat: 19.0815, lng: 72.8550 },
  "santacruz": { lat: 19.0808, lng: 72.8460 },
  "vile parle west": { lat: 19.1020, lng: 72.8375 },
  "vile parle east": { lat: 19.0980, lng: 72.8530 },
  "vile parle": { lat: 19.1000, lng: 72.8450 },
  "juhu": { lat: 19.1075, lng: 72.8263 },
  "jogeshwari west": { lat: 19.1380, lng: 72.8420 },
  "jogeshwari east": { lat: 19.1340, lng: 72.8610 },
  "jogeshwari": { lat: 19.1360, lng: 72.8510 },
  "goregaon west": { lat: 19.1663, lng: 72.8350 },
  "goregaon east": { lat: 19.1663, lng: 72.8526 },
  "goregaon": { lat: 19.1663, lng: 72.8438 },
  "malad west": { lat: 19.1874, lng: 72.8484 },
  "malad east": { lat: 19.1850, lng: 72.8600 },
  "malad": { lat: 19.1862, lng: 72.8542 },
  "kandivali west": { lat: 19.2060, lng: 72.8380 },
  "kandivali east": { lat: 19.2050, lng: 72.8680 },
  "kandivali": { lat: 19.2055, lng: 72.8530 },
  "borivali west": { lat: 19.2307, lng: 72.8567 },
  "borivali east": { lat: 19.2288, lng: 72.8643 },
  "borivali": { lat: 19.2298, lng: 72.8605 },
  "dahisar": { lat: 19.2570, lng: 72.8630 },
  "mira road": { lat: 19.2810, lng: 72.8690 },
  "bhayandar": { lat: 19.3020, lng: 72.8530 },

  // Mumbai Eastern Suburbs
  "kurla west": { lat: 19.0726, lng: 72.8750 },
  "kurla east": { lat: 19.0680, lng: 72.8890 },
  "kurla": { lat: 19.0703, lng: 72.8820 },
  "ghatkopar west": { lat: 19.0860, lng: 72.9020 },
  "ghatkopar east": { lat: 19.0860, lng: 72.9160 },
  "ghatkopar": { lat: 19.0860, lng: 72.9090 },
  "chembur": { lat: 19.0522, lng: 72.8994 },
  "govandi": { lat: 19.0550, lng: 72.9150 },
  "mankhurd": { lat: 19.0490, lng: 72.9320 },
  "sion": { lat: 19.0400, lng: 72.8600 },
  "vidyavihar": { lat: 19.0790, lng: 72.8970 },
  "vikhroli": { lat: 19.1110, lng: 72.9280 },
  "kanjurmarg": { lat: 19.1300, lng: 72.9330 },
  "bhandup": { lat: 19.1450, lng: 72.9370 },
  "mulund west": { lat: 19.1726, lng: 72.9450 },
  "mulund east": { lat: 19.1680, lng: 72.9620 },
  "mulund": { lat: 19.1703, lng: 72.9535 },
  "powai": { lat: 19.1176, lng: 72.9060 },
  "chandivali": { lat: 19.1110, lng: 72.8910 },

  // South / Central Mumbai
  "dadar west": { lat: 19.0200, lng: 72.8350 },
  "dadar east": { lat: 19.0178, lng: 72.8478 },
  "dadar": { lat: 19.0189, lng: 72.8414 },
  "matunga": { lat: 19.0270, lng: 72.8550 },
  "wadala": { lat: 19.0220, lng: 72.8650 },
  "lower parel": { lat: 18.9953, lng: 72.8300 },
  "prabhadevi": { lat: 19.0150, lng: 72.8270 },
  "worli": { lat: 19.0176, lng: 72.8181 },
  "byculla": { lat: 18.9750, lng: 72.8300 },
  "charni road": { lat: 18.9510, lng: 72.8190 },
  "marine lines": { lat: 18.9430, lng: 72.8250 },
  "churchgate": { lat: 18.9322, lng: 72.8260 },
  "fort": { lat: 18.9322, lng: 72.8350 },
  "colaba": { lat: 18.9067, lng: 72.8147 },
  "cuffe parade": { lat: 18.9140, lng: 72.8180 },
  "dharavi": { lat: 19.0400, lng: 72.8520 },

  // Thane & Navi Mumbai
  "thane west": { lat: 19.2183, lng: 72.9781 },
  "thane east": { lat: 19.1850, lng: 72.9800 },
  "thane": { lat: 19.2183, lng: 72.9781 },
  "vashi": { lat: 19.0771, lng: 72.9986 },
  "navi mumbai": { lat: 19.0330, lng: 73.0297 },
  "nerul": { lat: 19.0330, lng: 73.0160 },
  "belapur": { lat: 19.0220, lng: 73.0420 },
  "kharghar": { lat: 19.0470, lng: 73.0690 },
  "panvel": { lat: 18.9894, lng: 73.1175 },
  "kalyan": { lat: 19.2403, lng: 73.1305 },
  "dombivli": { lat: 19.2184, lng: 73.0867 },

  // Broader Cities
  "mumbai": { lat: 19.0760, lng: 72.8777 },
  "pune": { lat: 18.5204, lng: 73.8567 },
  "nashik": { lat: 19.9975, lng: 73.7898 },
  "nagpur": { lat: 21.1458, lng: 79.0882 },
  "delhi": { lat: 28.6139, lng: 77.2090 },
  "bengaluru": { lat: 12.9716, lng: 77.5946 },
};

// Known Mumbai postal codes
const PINCODE_COORDINATES: Record<string, Coordinates> = {
  "400001": { lat: 18.9322, lng: 72.8350 }, // Fort
  "400005": { lat: 18.9067, lng: 72.8147 }, // Colaba
  "400014": { lat: 19.0178, lng: 72.8478 }, // Dadar
  "400017": { lat: 19.0400, lng: 72.8520 }, // Dharavi
  "400018": { lat: 19.0176, lng: 72.8181 }, // Worli
  "400050": { lat: 19.0596, lng: 72.8295 }, // Bandra West
  "400051": { lat: 19.0607, lng: 72.8524 }, // Bandra East
  "400053": { lat: 19.1363, lng: 72.8277 }, // Andheri West
  "400058": { lat: 19.1363, lng: 72.8277 }, // Andheri West
  "400069": { lat: 19.1136, lng: 72.8697 }, // Andheri East
  "400062": { lat: 19.1663, lng: 72.8350 }, // Goregaon West
  "400063": { lat: 19.1663, lng: 72.8526 }, // Goregaon East
  "400064": { lat: 19.1874, lng: 72.8484 }, // Malad West
  "400092": { lat: 19.2307, lng: 72.8567 }, // Borivali West
  "400066": { lat: 19.2288, lng: 72.8643 }, // Borivali East
  "400076": { lat: 19.1176, lng: 72.9060 }, // Powai
  "400070": { lat: 19.0703, lng: 72.8820 }, // Kurla
  "400071": { lat: 19.0522, lng: 72.8994 }, // Chembur
  "400077": { lat: 19.0860, lng: 72.9090 }, // Ghatkopar
  "400080": { lat: 19.1703, lng: 72.9535 }, // Mulund
  "400601": { lat: 19.2183, lng: 72.9781 }, // Thane
  "400703": { lat: 19.0771, lng: 72.9986 }, // Vashi
};

/**
 * Normalizes text for locality matching
 */
function cleanLocationString(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Attempts to extract coordinates from text (explicit coords, locality name, or pincode)
 */
export function resolveCoordinates(
  text: string,
  explicitCoords?: { lat?: number; lng?: number } | null,
): Coordinates | null {
  if (
    explicitCoords &&
    typeof explicitCoords.lat === "number" &&
    typeof explicitCoords.lng === "number" &&
    !isNaN(explicitCoords.lat) &&
    !isNaN(explicitCoords.lng)
  ) {
    return { lat: explicitCoords.lat, lng: explicitCoords.lng };
  }

  if (!text) return null;

  // 1. Check for 6-digit Indian PIN code in text
  const pinMatch = text.match(/\b([1-9][0-9]{5})\b/);
  if (pinMatch && PINCODE_COORDINATES[pinMatch[1]]) {
    return PINCODE_COORDINATES[pinMatch[1]];
  }

  // 2. Check for known locality matches (longer match keys first for specificity, e.g. "andheri west" before "andheri")
  const cleaned = cleanLocationString(text);
  const sortedKeys = Object.keys(KNOWN_LOCALITY_COORDINATES).sort(
    (a, b) => b.length - a.length,
  );

  for (const key of sortedKeys) {
    if (cleaned.includes(key)) {
      return KNOWN_LOCALITY_COORDINATES[key];
    }
  }

  return null;
}

/**
 * Calculates geographic distance in kilometers using the Haversine formula
 */
export function calculateHaversineDistanceKm(
  c1: Coordinates,
  c2: Coordinates,
): number {
  const R = 6371; // Earth's mean radius in km
  const lat1Rad = (c1.lat * Math.PI) / 180;
  const lat2Rad = (c2.lat * Math.PI) / 180;
  const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
  const dLng = ((c2.lng - c1.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // Round to 1 decimal place (e.g. 2.4 km)
}

/**
 * Evaluates proximity between a job location and a worker location.
 * If coordinates are resolvable, computes real distance.
 * If coordinates cannot be determined, provides an honest locality hierarchy
 * without fabricating numbers.
 */
export function evaluateProximity(
  jobLocation: string,
  workerLocation: string,
  workerAddress?: string,
  jobExplicitCoords?: { lat?: number; lng?: number } | null,
  workerExplicitCoords?: { lat?: number; lng?: number } | null,
): ProximityResult {
  const jobCoords = resolveCoordinates(jobLocation, jobExplicitCoords);

  const combinedWorkerText = `${workerLocation || ""} ${workerAddress || ""}`.trim();
  const workerCoords = resolveCoordinates(combinedWorkerText, workerExplicitCoords);

  // Case 1: Both locations resolved to coordinates
  if (jobCoords && workerCoords) {
    const km = calculateHaversineDistanceKm(jobCoords, workerCoords);
    return {
      distanceKm: km,
      distanceLabel: `${km} km away`,
      isCalculatedDistance: true,
      proximityRank: km,
      localityMatchTier: "coordinates",
    };
  }

  // Case 2: Locality text fallback
  const jobClean = cleanLocationString(jobLocation);
  const workerClean = cleanLocationString(combinedWorkerText);

  // Check if they share a specific locality name
  const localityKeys = Object.keys(KNOWN_LOCALITY_COORDINATES).filter(
    (k) => k !== "mumbai" && k !== "pune" && k !== "delhi" && k !== "bengaluru",
  );

  let sharedLocality: string | null = null;
  for (const loc of localityKeys) {
    if (jobClean.includes(loc) && workerClean.includes(loc)) {
      sharedLocality = loc;
      break;
    }
  }

  if (sharedLocality) {
    // Format locality title (e.g. "andheri west" -> "Andheri West")
    const formattedLoc = sharedLocality
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    return {
      distanceKm: null,
      distanceLabel: `Same Area (${formattedLoc})`,
      isCalculatedDistance: false,
      proximityRank: 50, // Rank below close coord matches, above general city
      localityMatchTier: "same_locality",
    };
  }

  // Check if they share the broader city (e.g., both mention "mumbai")
  const commonCities = ["mumbai", "thane", "pune", "delhi", "bengaluru", "navi mumbai"];
  let sharedCity: string | null = null;
  for (const city of commonCities) {
    if (jobClean.includes(city) && workerClean.includes(city)) {
      sharedCity = city;
      break;
    }
  }

  if (sharedCity) {
    const formattedCity = sharedCity
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    return {
      distanceKm: null,
      distanceLabel: `Same Region (${formattedCity})`,
      isCalculatedDistance: false,
      proximityRank: 150,
      localityMatchTier: "same_city",
    };
  }

  // Fallback: Different area or unspecified
  return {
    distanceKm: null,
    distanceLabel: "Locality: General",
    isCalculatedDistance: false,
    proximityRank: 300,
    localityMatchTier: "different_area",
  };
}
