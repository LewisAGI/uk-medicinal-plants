/**
 * Habitat and season are not fields in the content pack.
 * These tags are example data for the filters, and the UI labels them as such.
 */
export const EXAMPLE_DATA_LABEL = 'Example data'

export const HABITATS = [
  { id: 'woodland', label: 'Woodland' },
  { id: 'hedgerow', label: 'Hedgerow' },
  { id: 'grassland', label: 'Grassland' },
  { id: 'wetland', label: 'Wetland' },
  { id: 'coast', label: 'Coast' },
  { id: 'garden', label: 'Garden' },
] as const

export const SEASONS = [
  { id: 'spring', label: 'Spring' },
  { id: 'summer', label: 'Summer' },
  { id: 'autumn', label: 'Autumn' },
  { id: 'winter', label: 'Winter' },
] as const

export type HabitatId = (typeof HABITATS)[number]['id']
export type SeasonId = (typeof SEASONS)[number]['id']

export const exampleFacets: Record<string, { habitat: HabitatId[]; season: SeasonId[] }> = {
  'st-johns-wort': { habitat: ['grassland', 'hedgerow'], season: ['summer'] },
  valerian: { habitat: ['wetland', 'grassland'], season: ['summer'] },
  peppermint: { habitat: ['garden', 'wetland'], season: ['summer'] },
  chamomile: { habitat: ['garden', 'grassland'], season: ['summer'] },
  hawthorn: { habitat: ['hedgerow', 'woodland'], season: ['spring'] },
  ivy: { habitat: ['woodland', 'hedgerow'], season: ['autumn'] },
  lavender: { habitat: ['garden'], season: ['summer'] },
  'white-willow': { habitat: ['wetland', 'woodland'], season: ['spring'] },
  nettle: { habitat: ['hedgerow', 'grassland'], season: ['summer'] },
  elder: { habitat: ['hedgerow', 'woodland'], season: ['summer'] },
  yarrow: { habitat: ['grassland'], season: ['summer'] },
  thyme: { habitat: ['garden'], season: ['summer'] },
  sage: { habitat: ['garden'], season: ['summer'] },
  comfrey: { habitat: ['wetland', 'grassland'], season: ['spring', 'summer'] },
  'horse-chestnut': { habitat: ['woodland', 'garden'], season: ['spring'] },
  ginkgo: { habitat: ['garden'], season: ['autumn'] },
  'milk-thistle': { habitat: ['grassland', 'garden'], season: ['summer'] },
  rosemary: { habitat: ['garden'], season: ['spring', 'summer'] },
  'lemon-balm': { habitat: ['garden'], season: ['summer'] },
  calendula: { habitat: ['garden'], season: ['summer'] },
  hop: { habitat: ['hedgerow'], season: ['summer', 'autumn'] },
  flax: { habitat: ['garden', 'grassland'], season: ['summer'] },
  echinacea: { habitat: ['garden'], season: ['summer'] },
  garlic: { habitat: ['garden'], season: ['summer'] },
  feverfew: { habitat: ['garden', 'hedgerow'], season: ['summer'] },
  'ribwort-plantain': { habitat: ['grassland'], season: ['spring', 'summer'] },
  meadowsweet: { habitat: ['wetland'], season: ['summer'] },
  birch: { habitat: ['woodland'], season: ['spring'] },
  dandelion: { habitat: ['grassland'], season: ['spring'] },
  raspberry: { habitat: ['woodland', 'hedgerow'], season: ['summer'] },
  oak: { habitat: ['woodland'], season: ['spring'] },
  agrimony: { habitat: ['grassland', 'hedgerow'], season: ['summer'] },
  horsetail: { habitat: ['wetland'], season: ['spring', 'summer'] },
  knotgrass: { habitat: ['grassland'], season: ['summer'] },
  cowslip: { habitat: ['grassland'], season: ['spring'] },
  marshmallow: { habitat: ['wetland', 'coast'], season: ['summer'] },
  'great-mullein': { habitat: ['grassland'], season: ['summer'] },
  arnica: { habitat: ['grassland', 'garden'], season: ['summer'] },
  'lime-tree': { habitat: ['woodland'], season: ['summer'] },
  centaury: { habitat: ['grassland'], season: ['summer'] },
  'shepherds-purse': { habitat: ['grassland'], season: ['spring', 'summer', 'autumn'] },
  goldenrod: { habitat: ['grassland', 'hedgerow'], season: ['summer', 'autumn'] },
  bogbean: { habitat: ['wetland'], season: ['spring', 'summer'] },
  'greater-celandine': { habitat: ['hedgerow', 'woodland'], season: ['spring'] },
  mistletoe: { habitat: ['woodland'], season: ['winter'] },
}
