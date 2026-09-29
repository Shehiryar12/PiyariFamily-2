import { PROFILE_COUNTRIES, type CountryOption } from '../../Constant/ProfileSetup';

export type CountryApiItem = {
  id?: number | string;
  name?: string | null;
  code?: string | null;
  slug?: string | null;
};

export type CountriesResponse = {
  success?: number | boolean;
  data?: CountryApiItem[] | { countries?: CountryApiItem[] };
  countries?: CountryApiItem[];
  message?: string;
};

const ISO3_TO_ISO2: Record<string, string> = {
  AFG: 'AF', ALB: 'AL', DZA: 'DZ', AND: 'AD', AGO: 'AO', ATG: 'AG', ARG: 'AR',
  ARM: 'AM', AUS: 'AU', AUT: 'AT', AZE: 'AZ', BHS: 'BS', BHR: 'BH', BGD: 'BD',
  BRB: 'BB', BLR: 'BY', BEL: 'BE', BLZ: 'BZ', BEN: 'BJ', BTN: 'BT', BOL: 'BO',
  BIH: 'BA', BWA: 'BW', BRA: 'BR', BRN: 'BN', BGR: 'BG', BFA: 'BF', BDI: 'BI',
  CPV: 'CV', KHM: 'KH', CMR: 'CM', CAN: 'CA', CAF: 'CF', TCD: 'TD', CHL: 'CL',
  CHN: 'CN', COL: 'CO', COM: 'KM', COG: 'CG', COD: 'CD', CRI: 'CR', CIV: 'CI',
  HRV: 'HR', CUB: 'CU', CYP: 'CY', CZE: 'CZ', DNK: 'DK', DJI: 'DJ', DMA: 'DM',
  DOM: 'DO', ECU: 'EC', EGY: 'EG', SLV: 'SV', GNQ: 'GQ', ERI: 'ER', EST: 'EE',
  SWZ: 'SZ', ETH: 'ET', FJI: 'FJ', FIN: 'FI', FRA: 'FR', GAB: 'GA', GMB: 'GM',
  GEO: 'GE', DEU: 'DE', GHA: 'GH', GRC: 'GR', GRD: 'GD', GTM: 'GT', GIN: 'GN',
  GNB: 'GW', GUY: 'GY', HTI: 'HT', HND: 'HN', HUN: 'HU', ISL: 'IS', IND: 'IN',
  IDN: 'ID', IRN: 'IR', IRQ: 'IQ', IRL: 'IE', ISR: 'IL', ITA: 'IT', JAM: 'JM',
  JPN: 'JP', JOR: 'JO', KAZ: 'KZ', KEN: 'KE', KIR: 'KI', PRK: 'KP', KOR: 'KR',
  KWT: 'KW', KGZ: 'KG', LAO: 'LA', LVA: 'LV', LBN: 'LB', LSO: 'LS', LBR: 'LR',
  LBY: 'LY', LIE: 'LI', LTU: 'LT', LUX: 'LU', MDG: 'MG', MWI: 'MW', MYS: 'MY',
  MDV: 'MV', MLI: 'ML', MLT: 'MT', MHL: 'MH', MRT: 'MR', MUS: 'MU', MEX: 'MX',
  FSM: 'FM', MDA: 'MD', MCO: 'MC', MNG: 'MN', MNE: 'ME', MAR: 'MA', MOZ: 'MZ',
  MMR: 'MM', NAM: 'NA', NRU: 'NR', NPL: 'NP', NLD: 'NL', NZL: 'NZ', NIC: 'NI',
  NER: 'NE', NGA: 'NG', MKD: 'MK', NOR: 'NO', OMN: 'OM', PAK: 'PK', PLW: 'PW',
  PAN: 'PA', PNG: 'PG', PRY: 'PY', PER: 'PE', PHL: 'PH', POL: 'PL', PRT: 'PT',
  QAT: 'QA', ROU: 'RO', RUS: 'RU', RWA: 'RW', KNA: 'KN', LCA: 'LC', VCT: 'VC',
  WSM: 'WS', SMR: 'SM', STP: 'ST', SAU: 'SA', SEN: 'SN', SRB: 'RS', SYC: 'SC',
  SLE: 'SL', SGP: 'SG', SVK: 'SK', SVN: 'SI', SLB: 'SB', SOM: 'SO', ZAF: 'ZA',
  SSD: 'SS', ESP: 'ES', LKA: 'LK', SDN: 'SD', SUR: 'SR', SWE: 'SE', CHE: 'CH',
  SYR: 'SY', TWN: 'TW', TJK: 'TJ', TZA: 'TZ', THA: 'TH', TLS: 'TL', TGO: 'TG',
  TON: 'TO', TTO: 'TT', TUN: 'TN', TUR: 'TR', TKM: 'TM', TUV: 'TV', UGA: 'UG',
  UKR: 'UA', ARE: 'AE', GBR: 'GB', USA: 'US', URY: 'UY', UZB: 'UZ', VUT: 'VU',
  VAT: 'VA', VEN: 'VE', VNM: 'VN', YEM: 'YE', ZMB: 'ZM', ZWE: 'ZW',
};

const pickString = (...values: Array<string | number | null | undefined>) => {
  for (const value of values) {
    if (value === undefined || value === null) {
      continue;
    }

    const next = String(value).trim();
    if (next) {
      return next;
    }
  }

  return '';
};

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const toFlagCountryCode = (code?: string | null) => {
  const raw = code?.trim().toUpperCase() ?? '';

  if (/^[A-Z]{2}$/.test(raw)) {
    return raw;
  }

  if (/^[A-Z]{3}$/.test(raw)) {
    return ISO3_TO_ISO2[raw] ?? null;
  }

  return null;
};

const pickCountryItems = (
  response?: CountriesResponse | CountryApiItem[] | null,
): CountryApiItem[] => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (
    response?.data &&
    typeof response.data === 'object' &&
    Array.isArray(response.data.countries)
  ) {
    return response.data.countries;
  }

  if (Array.isArray(response?.countries)) {
    return response.countries;
  }

  return [];
};

const mapCountry = (item: CountryApiItem, index: number): CountryOption | null => {
  const name = pickString(item.name);
  const id = Number(item.id);

  if (!name) {
    return null;
  }

  const code = pickString(item.code).toUpperCase();

  return {
    id: Number.isFinite(id) && id > 0 ? id : index + 1,
    name,
    code,
    slug: pickString(item.slug) || toSlug(name),
  };
};

export const mapCountries = (
  response?: CountriesResponse | CountryApiItem[] | null,
): CountryOption[] => {
  const mapped = pickCountryItems(response)
    .map(mapCountry)
    .filter((item): item is CountryOption => item != null);

  return mapped.length > 0 ? mapped : PROFILE_COUNTRIES;
};

export const findCountryMatch = (
  countries: CountryOption[],
  profile?: {
    country?: string | null;
    country_id?: number | string | null;
  } | null,
) => {
  const countryId = Number(profile?.country_id);
  if (Number.isFinite(countryId) && countryId > 0) {
    const byId = countries.find(country => country.id === countryId);
    if (byId) {
      return byId;
    }
  }

  const value = profile?.country?.trim().toLowerCase();
  if (!value) {
    return undefined;
  }

  return countries.find(country => {
    return (
      country.name.toLowerCase() === value ||
      country.slug.toLowerCase() === value ||
      country.code.toLowerCase() === value
    );
  });
};
