import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet';

type DelegationCoords = Record<string, LatLngTuple>;

type RegionDelegations = {
  region: string;
  delegations: DelegationCoords;
};

const DELEGATION_COORDS: RegionDelegations[] = [
  {
    region: 'REGION I',
    delegations: {
      'CENTRAL OAXACA': [17.0654, -96.7236],
    },
  },
  {
    region: 'REGION II',
    delegations: {
      'ISTMO': [16.9841, -95.1208],
    },
  },
  {
    region: 'REGION III',
    delegations: {
      'COSTA': [16.4322, -98.1508],
    },
  },
  {
    region: 'REGION IV',
    delegations: {
      'CAÑADA': [18.3738, -96.3791],
    },
  },
  {
    region: 'REGION V',
    delegations: {
      'MIXTECA': [17.7833, -97.8000],
    },
  },
  {
    region: 'REGION VI',
    delegations: {
      'SIERRA NORTE': [17.5167, -96.3500],
    },
  },
  {
    region: 'REGION VII',
    delegations: {
      'VALLES CENTRALES': [17.0654, -96.7236],
    },
  },
];

const FLAT_COORDS: Record<string, LatLngTuple> = DELEGATION_COORDS.reduce(
  (acc, region) => ({ ...acc, ...region.delegations }),
  {} as Record<string, LatLngTuple>,
);

export const OAXACA_MAP_BOUNDS: LatLngBoundsExpression = [
  [14.4, -98.9],
  [18.7, -94.4],
];

export function getDelegationLatLng(
  regionName: string,
  delegationName: string,
): LatLngTuple | null {
  const coords = FLAT_COORDS[delegationName.toUpperCase().trim()];

  if (coords) {
    return coords;
  }

  const region = DELEGATION_COORDS.find(
    (r) => r.region.toUpperCase().trim() === regionName.toUpperCase().trim(),
  );

  if (region) {
    const firstKey = Object.keys(region.delegations)[0];
    return region.delegations[firstKey] ?? null;
  }

  return null;
}
