/**
 * trackData.js — v2.2
 * 3 completely separate tracks. Zero shared coordinates.
 * Track 1: Southern  (Patna → Bongaigaon) — lat ~25.3–26.5
 * Track 2: Middle    (Siliguri → Guwahati) — lat ~26.5–26.7
 * Track 3: Northern  (N.Siliguri → Azara)  — lat ~26.8–26.98
 */

export const TRACKS = [
  {
    id: 'track1',
    name: 'Main Trunk Line',
    color: '#00E096',
    points: [
      [25.59, 85.13],   // Patna
      [25.46, 86.12],   // Mokama
      [25.30, 87.00],   // Bhagalpur
      [25.55, 87.57],   // Katihar Jn
      [25.80, 88.10],   // Dalkhola
      [26.05, 88.43],   // Raiganj
      [26.27, 88.62],   // Islampur
      [26.51, 88.73],   // Jalpaiguri
      [26.48, 89.25],   // Birpara
      [26.48, 89.66],   // Alipurduar
      [26.39, 90.27],   // Kokrajhar
      [26.47, 90.98],   // Bongaigaon
    ],
    stations: [
      { name: 'KIR / Katihar Jn',   code: 'KIR',  lat: 25.55, lng: 87.57, stationId: 'KIR'  },
      { name: 'JPL / Jalpaiguri',    code: 'JPL',  lat: 26.51, lng: 88.73, stationId: 'JPL'  },
      { name: 'APDJ / Alipurduar',   code: 'APDJ', lat: 26.48, lng: 89.66, stationId: 'APDJ' },
      { name: 'KOJ / Kokrajhar',     code: 'KOJ',  lat: 26.39, lng: 90.27, stationId: 'KOJ'  },
      { name: 'BBN / Bongaigaon',    code: 'BBN',  lat: 26.47, lng: 90.98, stationId: 'BBN'  },
    ],
  },
  {
    id: 'track2',
    name: 'Northeast Express Line',
    color: '#4DA6FF',
    points: [
      [26.71, 88.42],   // Siliguri
      [26.58, 88.68],   // Mainaguri
      [26.62, 89.10],   // Dhupguri
      [26.65, 89.55],   // Madarihat
      [26.60, 90.00],   // Assam Gate
      [26.53, 90.67],   // Bongaigaon South
      [26.40, 91.10],   // Nalbari
      [26.19, 91.67],   // Kamakhya
      [26.14, 91.74],   // Guwahati
    ],
    stations: [
      { name: 'SGUJ / Siliguri',     code: 'SGUJ', lat: 26.71, lng: 88.42, stationId: 'SGUJ' },
      { name: 'DPG / Dhupguri',      code: 'DPG',  lat: 26.62, lng: 89.10, stationId: 'DPG'  },
      { name: 'NBQ / Nalbari',       code: 'NBQ',  lat: 26.40, lng: 91.10, stationId: 'NBQ'  },
      { name: 'KYQ / Kamakhya',      code: 'KYQ',  lat: 26.19, lng: 91.67, stationId: 'KYQ'  },
      { name: 'GHY / Guwahati',      code: 'GHY',  lat: 26.14, lng: 91.74, stationId: 'GHY'  },
    ],
  },
  {
    id: 'track3',
    name: 'Hill Bypass Line',
    color: '#FF9D4D',
    points: [
      [26.88, 88.35],   // North Siliguri
      [26.95, 88.72],   // Odlabari
      [26.98, 89.20],   // Hasimara
      [26.92, 89.72],   // Assam foothills
      [26.85, 90.30],   // Gossaigaon
      [26.78, 90.88],   // Abhayapuri
      [26.68, 91.35],   // Barpeta Road
      [26.53, 91.61],   // Rangiya
      [26.42, 91.88],   // Azara
    ],
    stations: [
      { name: 'NSL / N.Siliguri',    code: 'NSL',  lat: 26.88, lng: 88.35, stationId: 'NSL'  },
      { name: 'HSA / Hasimara',      code: 'HSA',  lat: 26.98, lng: 89.20, stationId: 'HSA'  },
      { name: 'GSN / Gossaigaon',    code: 'GSN',  lat: 26.85, lng: 90.30, stationId: 'GSN'  },
      { name: 'BPRD / Barpeta Rd',   code: 'BPRD', lat: 26.68, lng: 91.35, stationId: 'BPRD' },
      { name: 'RNY / Rangiya',       code: 'RNY',  lat: 26.53, lng: 91.61, stationId: 'RNY'  },
    ],
  },
];

export const MAP_CENTER = [26.3, 89.5];
export const MAP_ZOOM   = 7;

export const TRAIN_NAMES = [
  'Kanchanjunga Exp',
  'Brahmaputra Mail',
  'Saraighat Exp',
  'Humsafar Exp',
  'Darjeeling Mail',
  'North East Exp',
];

// Each train uses its track's own color
export const TRAIN_COLORS = ['#00E096', '#4DA6FF', '#FF9D4D'];

export const ALL_STATIONS = TRACKS.flatMap((t) => t.stations);
