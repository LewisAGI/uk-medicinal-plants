import { expect, test } from 'vitest'
import { catalog, normalizeName, searchPlants } from '../src/model'

const empty = { habitats: [], seasons: [], grades: [], sort: 'common' as const }

test('searches common and Latin names', () => {
  expect(normalizeName("St. John's wort")).toBe('st johns wort')
  expect(normalizeName('Mentha × piperita')).toBe('mentha piperita')
  expect(searchPlants('Hypericum perforatum')[0]).toMatchObject({ kind: 'medicinal', plant: { id: 'st-johns-wort' } })
  expect(searchPlants("st john's wort")[0]?.plant.id).toBe('st-johns-wort')
  expect(searchPlants('ivy')[0]?.plant.id).toBe('ivy')
  expect(searchPlants('foxglove')[0]).toMatchObject({ kind: 'non-medicinal', plant: { id: 'foxglove' } })
  expect(searchPlants('Digitalis purpurea')[0]?.plant.id).toBe('foxglove')
  expect(searchPlants('holly')[0]?.plant.id).toBe('holly')
  expect(searchPlants('belladonna')[0]?.plant.id).toBe('deadly-nightshade')
  expect(searchPlants('a')).toEqual([])
  expect(searchPlants('')).toEqual([])
  expect(searchPlants('zzzz-not-a-plant')).toEqual([])
})

test('browse lists published plants and filters without pill rows of hidden entries', () => {
  const home = catalog({ q: '', ...empty })
  expect(home).toHaveLength(45)
  expect(home.every((item) => item.kind === 'medicinal')).toBe(true)
  expect(home.some((item) => item.plant.id === 'foxglove')).toBe(false)
  expect(home.some((item) => item.plant.pending)).toBe(false)
  expect(catalog({ q: '', ...empty, grades: ['no_known_benefit'] })).toEqual([])

  const filtered = catalog({ q: '', habitats: ['woodland'], seasons: [], grades: ['traditional_only'], sort: 'common' })
  expect(filtered.some((item) => item.plant.id === 'hawthorn')).toBe(true)
  expect(filtered.some((item) => item.plant.id === 'ivy')).toBe(false)
  expect(filtered.some((item) => item.plant.id === 'lavender')).toBe(false)

  expect(catalog({ q: '', habitats: [], seasons: ['winter'], grades: [], sort: 'common' }).map((item) => item.plant.id)).toEqual(['mistletoe'])
  expect(catalog({ q: '', habitats: ['coast'], seasons: [], grades: [], sort: 'common' }).map((item) => item.plant.id)).toEqual(['marshmallow'])

  const latin = catalog({ q: '', habitats: [], seasons: [], grades: [], sort: 'latin' })
  const common = catalog({ q: '', ...empty })
  const at = (list: typeof latin, id: string) => list.findIndex((item) => item.plant.id === id)
  expect(at(latin, 'calendula')).toBeLessThan(at(latin, 'chamomile'))
  expect(at(common, 'chamomile')).toBeLessThan(at(common, 'calendula'))

  const named = catalog({ q: 'foxglove', habitats: ['woodland'], seasons: [], grades: ['clinical_supported'], sort: 'common' })
  expect(named.map((item) => item.plant.id)).toContain('foxglove')
  expect(named.find((item) => item.plant.id === 'foxglove')?.plant.pendingNotice).toBe('No match for medicinal benefits')
})
