function normalizeMapKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function withNormalizedKeys<T>(source: Record<string, T>) {
  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [normalizeMapKey(key), value]),
  ) as Record<string, T>;
}

type RegionDelegationCoordinates = Record<string, Record<string, [number, number]>>;

export const OAXACA_MAP_BOUNDS: [[number, number], [number, number]] = [
  [15.45, -98.95],
  [18.95, -93.45],
];

const regionCenters = withNormalizedKeys({
  'REGIÓN DE VALLES CENTRALES ZONA NORTE': [17.0965868, -96.7207816],
  'REGIÓN DE VALLES CENTRALES ZONA SUR': [16.784699, -96.6681765],
  'REGIÓN COSTA ZONA ORIENTE': [15.8693331, -97.0726428],
  'REGIÓN COSTA ZONA PONIENTE': [16.2247631, -97.7807521],
  'REGIÓN DEL ISTMO ZONA NORTE': [17.1324525, -94.8785788],
  'REGIÓN DEL ISTMO ZONA SUR': [16.413329, -94.9118795],
  'REGIÓN DE LA MIXTECA': [17.4517598, -97.1843544],
  'REGIÓN DE LA CUENCA': [18.0504073, -96.1144188],
  CENTRO: [17.0965868, -96.7207816],
});

const regionDelegationCoordinates: RegionDelegationCoordinates = Object.fromEntries(
  Object.entries({
    'REGIÓN DE VALLES CENTRALES ZONA NORTE': withNormalizedKeys({
      TLACOLULA: [16.9314623, -96.4611075],
      MITLA: [16.9675629, -96.3182467],
      'EL RETIRO': [17.0847899, -96.7190858],
      'IXTLÁN DE JUÁREZ': [17.476844, -96.3460036],
      ETLA: [17.197111, -96.7962866],
    }),
    'REGIÓN DE VALLES CENTRALES ZONA SUR': withNormalizedKeys({
      'MIAHUATLÁN DE P.D.': [16.3610815, -96.5850579],
      ZAACHILA: [16.9529021, -96.7839466],
      OCOTLÁN: [16.784699, -96.6681765],
      'EJUTLA DE CRESPO': [16.5976679, -96.6608337],
      ZIMATLÁN: [16.8727536, -96.8013464],
      'SOLA DE VEGA': [16.5716082, -97.1035414],
    }),
    'REGIÓN COSTA ZONA ORIENTE': withNormalizedKeys({
      HUATULCO: [15.8220916, -96.2059859],
      'PUERTO ESCONDIDO': [15.8693331, -97.0726428],
      POCHUTLA: [15.7914326, -96.4300667],
      'SANTOS REYES NOPALA': [16.0821395, -97.1791905],
    }),
    'REGIÓN COSTA ZONA PONIENTE': withNormalizedKeys({
      'PINOTEPA NACIONAL': [16.2961977, -98.1602324],
      JUQUILA: [16.1799827, -97.3303513],
      'RÍO GRANDE': [16.0114184, -97.4346709],
      JAMILTEPEC: [16.2247631, -97.7807521],
      CACAHUATEPEC: [16.655554, -98.1934795],
    }),
    'REGIÓN DEL ISTMO ZONA NORTE': withNormalizedKeys({
      'MATIAS ROMERO': [17.1324525, -94.8785788],
      TAPANATEPEC: [16.3037258, -94.2852336],
      'MA. LOMBARDO': [17.44684, -95.43134],
      'SAN JUAN GUICHICOVI': [17.1049808, -95.2254143],
    }),
    'REGIÓN DEL ISTMO ZONA SUR': withNormalizedKeys({
      'SALINA CRUZ': [16.1977789, -95.2131936],
      'CIUDAD IXTEPEC': [16.6165531, -95.0784727],
      JUCHITÁN: [16.413329, -94.9118795],
      TEHUANTEPEC: [16.1889599, -95.3960273],
    }),
    'REGIÓN DE LA MIXTECA': withNormalizedKeys({
      'HUAJUAPAN DE LEÓN': [17.8472979, -97.8775394],
      NOCHIXTLÁN: [17.4517598, -97.1843544],
      TAMAZULAPAN: [17.6948288, -97.5780665],
      TLAXIACO: [17.2364266, -97.6989523],
      'S.P. Y S.P. TEPOSCOLULA': [17.4936148, -97.4712169],
      'PUTLA DE GRO.': [16.7867827, -97.7798491],
      JUXTLAHUACA: [17.208558, -98.0383524],
    }),
    'REGIÓN DE LA CUENCA': withNormalizedKeys({
      TUXTEPEC: [18.0504073, -96.1144188],
      TEMASCAL: [18.2419655, -96.4023187],
      COSOLAPA: [18.5805064, -96.652796],
    }),
    CENTRO: withNormalizedKeys({
      'JEFE OPERATIVO': [17.0965868, -96.7207816],
      COORDINACION: [17.0965868, -96.7207816],
    }),
  }).map(([regionName, delegations]) => [normalizeMapKey(regionName), delegations]),
) as RegionDelegationCoordinates;

export function getDelegationLatLng(regionName: string, delegationName: string) {
  const normalizedRegionName = normalizeMapKey(regionName);
  const normalizedDelegationName = normalizeMapKey(delegationName);

  return (
    regionDelegationCoordinates[normalizedRegionName]?.[normalizedDelegationName] ??
    regionCenters[normalizedRegionName] ??
    null
  );
}
