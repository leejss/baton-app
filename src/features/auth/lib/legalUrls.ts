import type { TermsCode } from '@/features/auth/api/signup.schema';

const LEGAL_BASE_URL = 'https://relay-baton.site/legal';

export const LEGAL_URLS = {
  TERMS_OF_SERVICE: `${LEGAL_BASE_URL}/terms/`,
  PRIVACY_COLLECTION_USE: `${LEGAL_BASE_URL}/privacy-collection-use/`,
  MARKETING_INFORMATION_RECEIPT: `${LEGAL_BASE_URL}/marketing-consent/`,
} as const satisfies Record<TermsCode, string>;

export function getLegalUrl(code: TermsCode): string {
  return LEGAL_URLS[code];
}
