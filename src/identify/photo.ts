/**
 * Photo identification is not mounted.
 * A hosted identifier needs an API key, and this pack does not include an on-device model.
 * Search and browse by common name and Latin name are the identification route.
 */
export const PHOTO_IDENTIFY_AVAILABLE = false as const

export interface PhotoIdentifyResult {
  available: false
  reason: 'api-key-required'
}

export function identifyPhoto(): PhotoIdentifyResult {
  return { available: false, reason: 'api-key-required' }
}
