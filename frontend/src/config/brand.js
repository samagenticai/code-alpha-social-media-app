/** Central brand configuration — single source of truth for app identity */
export const BRAND = {
  name: 'Pulse',
  tagline: 'Connect Beyond Limits',
  shortTagline: 'Social Pulse',
  domain: 'pulse.app',
  supportEmail: 'support@pulse.app',
  legalEmail: 'legal@pulse.app',
  privacyEmail: 'privacy@pulse.app',
  storagePrefix: 'pulse',
};

export const getPageTitle = (section) =>
  section ? `${section} | ${BRAND.name}` : `${BRAND.name} | ${BRAND.tagline}`;

export const getShareUrl = (path = '') => {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined' && window.location?.origin) {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `${window.location.origin}${suffix}`;
    }
  }
  return `https://${BRAND.domain}${suffix}`;
};

/** Read legacy localStorage keys from prior branding */
export const readStoredValue = (key) => {
  if (typeof window === 'undefined') return null;
  const prefix = BRAND.storagePrefix;
  const legacyKeys = [
    `${prefix}_${key}`,
    `nexora_${key}`,
    `nexus_${key}`,
  ];
  for (const storageKey of legacyKeys) {
    const value = localStorage.getItem(storageKey);
    if (value !== null) return value;
  }
  return null;
};

export const writeStoredValue = (key, value) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${BRAND.storagePrefix}_${key}`, value);
};

export const removeStoredValue = (key) => {
  if (typeof window === 'undefined') return;
  [`${BRAND.storagePrefix}_${key}`, `nexora_${key}`, `nexus_${key}`].forEach((storageKey) => {
    localStorage.removeItem(storageKey);
  });
};
  
