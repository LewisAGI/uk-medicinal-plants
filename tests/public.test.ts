import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'
import { CHROME } from '../src/chrome'
import { EXAMPLE_DATA_LABEL, exampleFacets } from '../src/exampleFacets'
import { identifyPhoto, PHOTO_IDENTIFY_AVAILABLE } from '../src/identify/photo'
import { assertPublishableField, toPublishedPlant, type RawPlant } from '../scripts/public-pack'
import {
  EXPERT_REVIEW_PENDING,
  GRADE_LABEL,
  allPublicText,
  content,
  evidenceLabelNote,
  generalSafety,
  isPendingExpertReview,
  publishedPlants,
  sourceById,
  stripDosing,
  toPublic,
  type Plant,
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
  const raw = JSON.parse(readFileSync(path.join(process.cwd(), 'data/content.json'), 'utf8')) as {
    counts: { by_grade: Record<string, number> }
    plants: { id: string; medicinal_uses: { use: string; basis: string; evidence_grade: string }[] }[]
  }
  expect(raw.counts.by_grade.no_known_benefit).toBe(30)
  const hidden = content.plants.filter(isPendingExpertReview)
  const published = publishedPlants()
  expect(hidden).toHaveLength(30)
  expect(published).toHaveLength(45)
  expect(content.counts.by_grade.no_known_benefit).toBeUndefined()
  expect(hidden.map((plant) => plant.id)).toEqual(expect.arrayContaining(['foxglove', 'hemlock', 'bluebell', 'holly', 'deadly-nightshade']))
  for (const id of ['foxglove', 'bluebell', 'holly', 'hemlock']) {
    expect(published.map((plant) => plant.id)).not.toContain(id)
  }
  const bundled = JSON.stringify(content)
  for (const plant of hidden) {
    expect(plant.expert_review_pending).toBe(true)
    expect(plant.medicinal_uses).toEqual([])
    expect(plant.cautions).toBeUndefined()
    expect(plant.traditional_notes).toBeUndefined()
    const view = toPublic(plant)
    expect(view.pending).toBe(true)
    expect(view.pendingNotice).toBe('No match for medicinal benefits')
    expect(view.uses).toEqual([])
    expect(view.cautions).toEqual([])
    expect(view.traditionalNotes).toEqual([])
    const rawPlant = raw.plants.find((item) => item.id === plant.id)
    expect(rawPlant?.medicinal_uses.every((use) => use.evidence_grade === 'no_known_benefit')).toBe(true)
    const rendered = JSON.stringify(view)
    for (const use of rawPlant?.medicinal_uses ?? []) {
      expect(use.use.length).toBeGreaterThan(0)
      expect(rendered).not.toContain(use.use)
      expect(rendered).not.toContain(use.basis)
      expect(bundled).not.toContain(use.use)
      expect(bundled).not.toContain(use.basis)
    }
  }
  const fox = toPublic(content.plants.find((plant) => plant.id === 'foxglove')!)
  expect(JSON.stringify(fox).toLowerCase()).not.toContain('digoxin')
  expect(fox.toxicity?.summary).toMatch(/toxic if eaten/i)
  expect(fox.commonName).toBe('Foxglove')
  expect(fox.botanicalName).toBe('Digitalis purpurea')
  expect(evidenceLabelNote()).toMatch(/stated by the cited source/)
  expect(evidenceLabelNote()).not.toMatch(/botanist|Verification log/i)
})

test('a mixed-grade plant is not treated as unreviewed', () => {
  const mixed: Plant = {
    id: 'mixed-fixture',
    common_name: 'Mixed fixture',
    botanical_name: 'Mixta fixture',
    medicinal_uses: [
      {
        use: 'A specific product studied in trials',
        evidence_grade: 'clinical_supported',
        basis: 'A systematic review supports this specific product.',
        sources: [],
      },
      {
        use: 'No known evidence-based medicinal use',
        evidence_grade: 'no_known_benefit',
        basis: 'No monograph was located for this second use.',
        sources: [],
      },
    ],
    safety_banner: 'Information only. Not medical advice.',
  }
  expect(isPendingExpertReview(mixed)).toBe(false)
  const view = toPublic(mixed)
  expect(view.pending).toBe(false)
  expect(view.uses.map((use) => use.grade)).toEqual(['clinical_supported', 'no_known_benefit'])
  expect(view.uses[0]?.gradeLabel).toBe('Clinically supported (specific products)')

  const withheld: Plant = {
    id: 'withheld-fixture',
    common_name: 'Withheld fixture',
    botanical_name: 'Occulta fixture',
    medicinal_uses: [
      { use: 'secret use text', evidence_grade: 'no_known_benefit', basis: 'secret basis text', sources: [] },
    ],
    safety_banner: 'Information only. Not medical advice.',
  }
  expect(isPendingExpertReview(withheld)).toBe(true)
  expect(toPublic(withheld).uses).toEqual([])
  expect(JSON.stringify(toPublic(withheld))).not.toContain('secret use text')
})

test('stripDosing edits uses and basis only', () => {
  const plant: Plant = {
    id: 'dose-fixture',
    common_name: 'Dose fixture',
    botanical_name: 'Dosis fixture',
    medicinal_uses: [
      {
        use: 'Keep this sentence. Take 5 mg today. Still useful.',
        evidence_grade: 'traditional_only',
        basis: 'Basis stays. 10 ml noted. Basis remains.',
        sources: [],
      },
    ],
    toxicity: {
      level: 'severe',
      summary: 'Toxic if eaten. A report mentioned 5 mg and the rest of this sentence stays.',
      sources: [],
    },
    cautions: [{ text: 'Caution starts. Avoid 2 grams in this sentence. Caution ends.', sources: [] }],
    safety_banner: 'Information only. Not medical advice.',
  }
  const view = toPublic(plant)
  expect(view.uses[0]?.use).toBe('Keep this sentence. Still useful.')
  expect(view.uses[0]?.basis).toBe('Basis stays. Basis remains.')
  expect(view.toxicity?.summary).toBe(plant.toxicity?.summary)
  expect(view.cautions[0]?.text).toBe(plant.cautions?.[0]?.text)
  expect(view.safetyBanner).toBe(plant.safety_banner)

  expect(() => assertPublishableField('Take 5 mg.', 'toxicity')).toThrow(/dosing/)
  expect(() => assertPublishableField('Measure 10 ml.', 'caution')).toThrow(/dosing/)
  const raw: RawPlant = {
    id: 'build-dose',
    common_name: 'Build dose',
    botanical_name: 'Dosis build',
    medicinal_uses: [
      { use: 'Keep. Take 5 mg today. Stay.', evidence_grade: 'traditional_only', basis: 'Noted. 2 grams once. Kept.', sources: [] },
    ],
    cautions: [{ text: 'Do not measure 10 ml for this caution.', sources: [] }],
    safety_banner: 'Information only.',
  }
  expect(() => toPublishedPlant(raw)).toThrow(/caution/)
  const toxicity: RawPlant = { ...raw, cautions: undefined, toxicity: { level: 'severe', summary: 'Limit 5 mg.', sources: [] } }
  expect(() => toPublishedPlant(toxicity)).toThrow(/toxicity/)
  const published = toPublishedPlant({ ...raw, cautions: undefined })
  expect(published.medicinal_uses[0]?.use).toBe('Keep. Stay.')
  expect(published.medicinal_uses[0]?.basis).toBe('Noted. Kept.')

  const mixedRaw: RawPlant = {
    id: 'mixed-raw',
    common_name: 'Mixed raw',
    botanical_name: 'Mixta raw',
    medicinal_uses: [
      { use: 'Supported use stays.', evidence_grade: 'clinical_supported', basis: 'Clinical basis stays in full.', sources: ['keep-me'] },
      { use: 'Hidden use stays on a mixed plant.', evidence_grade: 'no_known_benefit', basis: 'Hidden basis stays on a mixed plant.', sources: [] },
    ],
    toxicity: { level: 'mild', summary: 'Harmful if eaten.', sources: [] },
    safety_banner: 'Information only.',
  }
  const mixedOut = toPublishedPlant(mixedRaw)
  expect(mixedOut.expert_review_pending).toBeUndefined()
  expect(mixedOut.medicinal_uses).toHaveLength(2)
  expect(JSON.stringify(mixedOut)).toContain('Hidden basis stays on a mixed plant.')
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
  expect(wort.uses[0]?.gradeLabel).toBe('Clinically supported (specific products)')
  expect(GRADE_LABEL.clinical_supported).toBe('Clinically supported (specific products)')
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
