import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'
import { CHROME } from '../src/chrome'
import { EXAMPLE_DATA_LABEL, exampleFacets } from '../src/exampleFacets'
import { identifyPhoto, PHOTO_IDENTIFY_AVAILABLE } from '../src/identify/photo'
import {
  EXPERT_REVIEW_PENDING,
  allPublicText,
  content,
  evidenceLabelNote,
  generalSafety,
  isPendingExpertReview,
  publishedPlants,
  sourceById,
  stripDosing,
  toPublic,
} from '../src/model'

const DOSING = /\bmg\b|\bml\b|\bgrams?\b|\bteaspoons?\b|\btimes a day/i

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

test('hides the no-known-benefit entries until expert review', () => {
  expect(EXPERT_REVIEW_PENDING).toBe(true)
  const hidden = content.plants.filter(isPendingExpertReview)
  const published = publishedPlants()
  expect(hidden).toHaveLength(30)
  expect(published).toHaveLength(45)
  expect(content.counts.by_grade.no_known_benefit).toBe(30)
  expect(hidden.map((plant) => plant.id)).toEqual(expect.arrayContaining(['foxglove', 'hemlock', 'bluebell', 'holly', 'deadly-nightshade']))
  for (const id of ['foxglove', 'bluebell', 'holly', 'hemlock']) {
    expect(published.map((plant) => plant.id)).not.toContain(id)
  }
  for (const plant of hidden) {
    expect(plant.medicinal_uses.every((use) => use.evidence_grade === 'no_known_benefit')).toBe(true)
    const view = toPublic(plant)
    expect(view.pending).toBe(true)
    expect(view.pendingNotice).toBe('No match for medicinal benefits')
    expect(view.uses).toEqual([])
    expect(view.cautions).toEqual([])
    expect(view.traditionalNotes).toEqual([])
    const rendered = JSON.stringify(view)
    for (const use of plant.medicinal_uses) {
      expect(rendered).not.toContain(use.use)
      expect(rendered).not.toContain(use.basis)
    }
  }
  const fox = toPublic(content.plants.find((plant) => plant.id === 'foxglove')!)
  expect(JSON.stringify(fox).toLowerCase()).not.toContain('digoxin')
  expect(fox.toxicity?.summary).toMatch(/toxic if eaten/i)
  expect(fox.commonName).toBe('Foxglove')
  expect(fox.botanicalName).toBe('Digitalis purpurea')
})

test('rejects dosing patterns in public copy', () => {
  for (const sample of ['500 mg', '10 ml', '2 grams', '1 gram', 'a teaspoon', 'two teaspoons', '3 times a day', 'Times a day']) {
    expect(sample).toMatch(DOSING)
    expect(stripDosing(`Keep this sentence. ${sample} today. Still here.`)).toBe('Keep this sentence. Still here.')
    expect(stripDosing(`Keep this sentence. ${sample} today. Still here.`)).not.toMatch(DOSING)
  }
  expect(stripDosing('Take 5 mg')).toBe('')
  for (const text of allPublicText()) expect(text, text).not.toMatch(DOSING)
  const hawthorn = content.plants.find((plant) => plant.id === 'hawthorn')!
  expect(stripDosing(hawthorn.medicinal_uses[0]!.use)).toBe(hawthorn.medicinal_uses[0]!.use)
  const view = toPublic(hawthorn)
  expect(view.uses.every((use) => use.basis.length > 40)).toBe(true)
  expect(view.uses.map((use) => use.grade)).toEqual(['traditional_only', 'clinical_supported'])
})

test('shows pack explanations, grades, and the consult banner', () => {
  expect(CHROME.notice).toBe('Not medical advice.')
  expect(CHROME.noMatch).toBe('No match for medicinal benefits')
  const banner = content.plants[0]!.safety_banner
  expect(banner).toMatch(/Not medical advice/)
  expect(banner).toMatch(/Speak to a pharmacist or doctor/)
  for (const plant of content.plants) {
    expect(plant.safety_banner).toBe(banner)
    expect(toPublic(plant).safetyBanner).toBe(banner)
  }
  const comfrey = toPublic(content.plants.find((plant) => plant.id === 'comfrey')!)
  expect(comfrey.lookalikes[0]?.lookalike).toMatch(/Foxglove/)
  expect(comfrey.lookalikes[0]?.risk).toMatch(/toxic if eaten/)
  const wort = toPublic(content.plants.find((plant) => plant.id === 'st-johns-wort')!)
  expect(wort.cautions.some((item) => /contraceptive/i.test(item.text))).toBe(true)
  expect(wort.uses[0]?.basis.length).toBeGreaterThan(40)
  expect(evidenceLabelNote()).toMatch(/stated by the cited source/)
  expect(generalSafety().map((item) => item.id)).toEqual(['g-nhs-herbal', 'g-thr', 'g-yellowcard', 'g-poison'])
  for (const plant of content.plants) {
    for (const use of plant.medicinal_uses) for (const id of use.sources) expect(sourceById(id).url).toMatch(/^https:\/\//)
    for (const id of plant.toxicity?.sources ?? []) expect(sourceById(id).url).toMatch(/^https:\/\//)
    for (const look of plant.lookalikes ?? []) for (const id of look.sources) expect(sourceById(id).url).toMatch(/^https:\/\//)
  }
})

test('labels habitat and season as example data and keeps them out of the pack', () => {
  expect(EXAMPLE_DATA_LABEL).toBe('Example data')
  expect(JSON.stringify(content)).not.toContain('"habitat"')
  expect(JSON.stringify(content)).not.toContain('"season"')
  const published = publishedPlants().map((plant) => plant.id).sort()
  expect(Object.keys(exampleFacets).sort()).toEqual(published)
  for (const plant of content.plants.filter(isPendingExpertReview)) expect(exampleFacets[plant.id]).toBeUndefined()
})

test('photo identification stays unavailable and unmounted', () => {
  expect(PHOTO_IDENTIFY_AVAILABLE).toBe(false)
  expect(identifyPhoto()).toEqual({ available: false, reason: 'api-key-required' })
  const files = walk(path.join(process.cwd(), 'src')).filter((file) => !file.endsWith(`${path.sep}identify${path.sep}photo.ts`))
  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    expect(source, file).not.toMatch(/identify\/photo|identifyPhoto|PHOTO_IDENTIFY/)
    if (file.endsWith('.tsx')) {
      expect(source, file).not.toMatch(/style=\{|style="/)
      expect(source, file).not.toMatch(/dangerouslySetInnerHTML/)
    }
  }
})

test('headers set CSP, nosniff, and Referrer-Policy', () => {
  const headers = readFileSync(path.join(process.cwd(), 'public/_headers'), 'utf8')
  expect(headers).toContain("default-src 'self'")
  expect(headers).toContain("script-src 'self'")
  expect(headers).toContain("object-src 'none'")
  expect(headers).toContain("base-uri 'none'")
  expect(headers).toContain("frame-ancestors 'none'")
  expect(headers).toContain('X-Content-Type-Options: nosniff')
  expect(headers).toContain('Referrer-Policy: no-referrer')
  expect(headers).not.toContain('unsafe-inline')
  expect(headers).not.toContain('unsafe-eval')
  const redirects = readFileSync(path.join(process.cwd(), 'public/_redirects'), 'utf8')
  expect(redirects).toContain('/index.html')
})
