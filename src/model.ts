import contentJson from '../data/content.json'
import sourcesJson from '../data/sources.json'
import readme from '../data/README.md?raw'
import { CHROME } from './chrome'
import { EXAMPLE_DATA_LABEL, HABITATS, SEASONS, exampleFacets, type HabitatId, type SeasonId } from './exampleFacets'

const DOSING = /\bmg\b|\bml\b|\bgrams?\b|\bteaspoons?\b|\btimes a day/i

export function hasDosing(text: string): boolean {
  return DOSING.test(text)
}

export function stripDosing(text: string): string {
  return text
    .split(/(?<=[.!?])\s+/)
    .filter((part) => !DOSING.test(part))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function pub(text: string): string {
  return stripDosing(text)
}

export const GRADE_LABEL: Record<string, string> = {
  clinical_supported: 'Clinical',
  clinical_mixed: 'Mixed',
  traditional_only: 'Traditional only',
  monograph_area_only: 'Monograph area only',
  not_endorsed: 'Not endorsed',
  no_known_benefit: 'No known benefit',
}

export const GRADE_ORDER = [
  'clinical_supported',
  'clinical_mixed',
  'traditional_only',
  'monograph_area_only',
  'not_endorsed',
] as const

export interface MedicinalUse {
  use: string
  evidence_grade: string
  basis: string
  evidence_label?: string
  sources: string[]
}

export interface Toxicity {
  level: string
  summary: string
  sources: string[]
}

export interface Lookalike {
  lookalike: string
  risk: string
  distinguishing_features: string
  evidence_label?: string
  sources: string[]
}

export interface CitedNote {
  text: string
  sources: string[]
  evidence_label?: string
}

export interface Plant {
  id: string
  common_name: string
  botanical_name: string
  medicinal_uses: MedicinalUse[]
  toxicity?: Toxicity
  lookalikes?: Lookalike[]
  cautions?: CitedNote[]
  traditional_notes?: CitedNote[]
  safety_banner: string
}

export interface GeneralSafety {
  id: string
  text: string
  sources: string[]
}

export interface Content {
  schema_version: string
  grades: Record<string, string>
  general_safety: GeneralSafety[]
  plants: Plant[]
  counts: {
    plants: number
    uses: number
    by_grade: Record<string, number>
    with_lookalikes: number
    with_toxicity: number
  }
}

export interface Source {
  id: string
  title: string
  publisher: string
  url: string
  type: string
}

export const content = contentJson as unknown as Content

if (!Array.isArray(content.plants) || content.plants.length === 0) {
  throw new Error('content pack is not readable')
}

/** no_known_benefit entries stay unpublished until a botanist or pharmacist reviews them. */
export const EXPERT_REVIEW_PENDING = true

export function isPendingExpertReview(plant: Plant): boolean {
  if (!EXPERT_REVIEW_PENDING) return false
  return plant.medicinal_uses.length > 0 && plant.medicinal_uses.every((use) => use.evidence_grade === 'no_known_benefit')
}

export function publishedPlants(): Plant[] {
  return content.plants.filter((plant) => !isPendingExpertReview(plant))
}

export function labelize(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

const sourceList: Source[] = (sourcesJson as unknown as Source[]).map((source) => ({
  ...source,
  title: pub(source.title),
  publisher: pub(source.publisher),
}))

const sourcesById = new Map(sourceList.map((source) => [source.id, source]))

export function sourceById(id: string): Source {
  const source = sourcesById.get(id)
  if (!source) throw new Error(`Missing source ${id}`)
  return source
}

export function allSources(): Source[] {
  return sourceList
}

export function publisherNames(): string[] {
  return [...new Set(sourceList.map((source) => source.publisher))].sort((a, b) => a.localeCompare(b, 'en'))
}

export function readingList(query: string, publishers: readonly string[]): Source[] {
  const q = normalizeName(query)
  return sourceList.filter((source) => {
    if (publishers.length > 0 && !publishers.includes(source.publisher)) return false
    if (!q) return true
    const haystack = normalizeName(`${source.title} ${source.publisher} ${source.type} ${labelize(source.type)}`)
    return haystack.includes(q)
  })
}

export function groupSources(sources: readonly Source[]): { publisher: string; sources: Source[] }[] {
  const groups = new Map<string, Source[]>()
  for (const source of sources) {
    const list = groups.get(source.publisher) ?? []
    list.push(source)
    groups.set(source.publisher, list)
  }
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'en'))
    .map(([publisher, items]) => ({
      publisher,
      sources: [...items].sort((a, b) => a.title.localeCompare(b.title, 'en')),
    }))
}

export interface PublicUse {
  use: string
  grade: string
  gradeLabel: string
  definition: string
  basis: string
  evidenceLabel: string | null
  sources: string[]
}

export interface PublicLookalike {
  lookalike: string
  risk: string
  features: string
  evidenceLabel: string | null
  sources: string[]
}

export interface PublicNote {
  text: string
  evidenceLabel: string | null
  sources: string[]
}

export interface PublicToxicity {
  level: string
  summary: string
  sources: string[]
  urgent: boolean
}

export interface PublicPlant {
  id: string
  commonName: string
  botanicalName: string
  safetyBanner: string
  pending: boolean
  pendingNotice: string | null
  toxicity: PublicToxicity | null
  lookalikes: PublicLookalike[]
  cautions: PublicNote[]
  traditionalNotes: PublicNote[]
  uses: PublicUse[]
  sourceIds: string[]
}

export interface PublicSafety {
  id: string
  text: string
  sources: string[]
}

function notable(label?: string): string | null {
  if (!label || label === 'evidence') return null
  return pub(label)
}

export function needsPoisoningGuidance(level: string, summary: string): boolean {
  return /severe|fatal|\bpoison/i.test(`${level} ${summary}`)
}

function unique(ids: readonly string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const id of ids) {
    if (seen.has(id)) continue
    seen.add(id)
    out.push(id)
  }
  return out
}

export function toPublic(plant: Plant): PublicPlant {
  const pending = isPendingExpertReview(plant)
  const toxicity = plant.toxicity
    ? {
        level: pub(plant.toxicity.level),
        summary: pub(plant.toxicity.summary),
        sources: plant.toxicity.sources,
        urgent: needsPoisoningGuidance(plant.toxicity.level, plant.toxicity.summary),
      }
    : null
  const lookalikes = (plant.lookalikes ?? []).map((item) => ({
    lookalike: pub(item.lookalike),
    risk: pub(item.risk),
    features: pub(item.distinguishing_features),
    evidenceLabel: notable(item.evidence_label),
    sources: item.sources,
  }))
  const cautions = pending
    ? []
    : (plant.cautions ?? []).map((item) => ({
        text: pub(item.text),
        evidenceLabel: notable(item.evidence_label),
        sources: item.sources,
      }))
  const traditionalNotes = pending
    ? []
    : (plant.traditional_notes ?? []).map((item) => ({
        text: pub(item.text),
        evidenceLabel: notable(item.evidence_label),
        sources: item.sources,
      }))
  const uses = pending
    ? []
    : plant.medicinal_uses.map((item) => ({
        use: pub(item.use),
        grade: item.evidence_grade,
        gradeLabel: GRADE_LABEL[item.evidence_grade] ?? item.evidence_grade,
        definition: pub(content.grades[item.evidence_grade] ?? ''),
        basis: pub(item.basis),
        evidenceLabel: notable(item.evidence_label),
        sources: item.sources,
      }))
  const sourceIds = unique([
    ...(toxicity?.sources ?? []),
    ...lookalikes.flatMap((item) => item.sources),
    ...cautions.flatMap((item) => item.sources),
    ...traditionalNotes.flatMap((item) => item.sources),
    ...uses.flatMap((item) => item.sources),
  ])
  return {
    id: plant.id,
    commonName: pub(plant.common_name),
    botanicalName: pub(plant.botanical_name),
    safetyBanner: pub(plant.safety_banner),
    pending,
    pendingNotice: pending ? CHROME.noMatch : null,
    toxicity,
    lookalikes,
    cautions,
    traditionalNotes,
    uses,
    sourceIds,
  }
}

export function plantById(id: string): PublicPlant | null {
  const plant = content.plants.find((item) => item.id === id)
  return plant ? toPublic(plant) : null
}

export function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[×✕]/g, 'x')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\bx\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function nameScore(plant: Plant, query: string): number {
  const q = normalizeName(query)
  if (!q) return 0
  const names = [normalizeName(plant.common_name), normalizeName(plant.botanical_name)]
  let best = 0
  for (const name of names) {
    if (!name) continue
    const tokens = name.split(' ')
    if (name === q) best = Math.max(best, 100)
    else if (q.length >= 3 && name.startsWith(q)) best = Math.max(best, 80)
    if (q.length >= 3 && tokens.some((token) => token.startsWith(q))) best = Math.max(best, 70)
    if (q.length >= 4 && name.includes(q)) best = Math.max(best, 50)
  }
  return best
}

export interface SearchHit {
  kind: 'medicinal' | 'non-medicinal'
  plant: Plant
  score: number
}

export function searchPlants(query: string): SearchHit[] {
  const q = normalizeName(query)
  if (!q) return []
  const hits: SearchHit[] = []
  for (const plant of content.plants) {
    const score = nameScore(plant, query)
    if (isPendingExpertReview(plant)) {
      if (score >= 70) hits.push({ kind: 'non-medicinal', plant, score })
    } else if (score >= 50) {
      hits.push({ kind: 'medicinal', plant, score })
    }
  }
  hits.sort((a, b) => b.score - a.score || a.plant.common_name.localeCompare(b.plant.common_name, 'en'))
  return hits
}

export interface CatalogQuery {
  q: string
  habitats: readonly string[]
  seasons: readonly string[]
  grades: readonly string[]
  sort: 'common' | 'latin'
}

export interface CatalogItem {
  kind: 'medicinal' | 'non-medicinal'
  plant: PublicPlant
}

function matchesFilters(plant: Plant, habitats: readonly string[], seasons: readonly string[], grades: readonly string[]): boolean {
  const facet = exampleFacets[plant.id]
  if (habitats.length > 0 && (!facet || !habitats.some((habitat) => facet.habitat.includes(habitat as HabitatId)))) return false
  if (seasons.length > 0 && (!facet || !seasons.some((season) => facet.season.includes(season as SeasonId)))) return false
  if (grades.length > 0 && !plant.medicinal_uses.some((use) => grades.includes(use.evidence_grade))) return false
  return true
}

function byName(sort: 'common' | 'latin') {
  return (a: Plant, b: Plant) => {
    const left = sort === 'latin' ? a.botanical_name : a.common_name
    const right = sort === 'latin' ? b.botanical_name : b.common_name
    return left.localeCompare(right, 'en') || a.id.localeCompare(b.id)
  }
}

export function catalog(query: CatalogQuery): CatalogItem[] {
  if (!normalizeName(query.q)) {
    return publishedPlants()
      .filter((plant) => matchesFilters(plant, query.habitats, query.seasons, query.grades))
      .sort(byName(query.sort))
      .map((plant) => ({ kind: 'medicinal' as const, plant: toPublic(plant) }))
  }
  const hits = searchPlants(query.q)
  const medicinal = hits
    .filter((hit) => hit.kind === 'medicinal' && matchesFilters(hit.plant, query.habitats, query.seasons, query.grades))
    .map((hit) => ({ kind: 'medicinal' as const, plant: toPublic(hit.plant) }))
  const nonMedicinal = hits
    .filter((hit) => hit.kind === 'non-medicinal')
    .map((hit) => ({ kind: 'non-medicinal' as const, plant: toPublic(hit.plant) }))
  return [...medicinal, ...nonMedicinal]
}

export function generalSafety(): PublicSafety[] {
  return content.general_safety.map((item) => ({
    id: item.id,
    text: pub(item.text),
    sources: item.sources,
  }))
}

export function poisoningGuidance(): string | null {
  return generalSafety().find((item) => item.id === 'g-poison')?.text ?? null
}

export interface GlossaryEntry {
  id: string
  term: string
  definition: string
}

export function evidenceLabelNote(): string | null {
  const line = readme.split('\n').find((entry) => entry.trimStart().startsWith('- Labels:'))
  if (!line) return null
  return pub(line.replace(/^-\s*/, '').replace(/`/g, '').trim())
}

export function glossaryEntries(): GlossaryEntry[] {
  const order = [...GRADE_ORDER, 'no_known_benefit']
  const entries: GlossaryEntry[] = order
    .filter((id) => content.grades[id])
    .map((id) => ({
      id,
      term: GRADE_LABEL[id] ?? id,
      definition: pub(content.grades[id] ?? ''),
    }))
  const note = evidenceLabelNote()
  if (note) entries.push({ id: 'evidence_label', term: CHROME.evidenceLabelTerm, definition: note })
  return entries
}

export function allPublicText(): string[] {
  const out: string[] = []
  const push = (value: string | null | undefined) => {
    if (value) out.push(value)
  }
  for (const value of Object.values(CHROME)) push(value)
  push(EXAMPLE_DATA_LABEL)
  for (const habitat of HABITATS) push(habitat.label)
  for (const season of SEASONS) push(season.label)
  for (const entry of glossaryEntries()) {
    push(entry.id)
    push(entry.term)
    push(entry.definition)
  }
  for (const item of generalSafety()) push(item.text)
  for (const source of allSources()) {
    push(source.title)
    push(source.publisher)
    push(source.type)
    push(labelize(source.type))
  }
  for (const plant of content.plants) {
    const view = toPublic(plant)
    push(view.commonName)
    push(view.botanicalName)
    push(view.safetyBanner)
    push(view.pendingNotice)
    if (view.toxicity) {
      push(view.toxicity.level)
      push(view.toxicity.summary)
    }
    for (const item of view.lookalikes) {
      push(item.lookalike)
      push(item.risk)
      push(item.features)
      push(item.evidenceLabel)
    }
    for (const item of view.cautions) {
      push(item.text)
      push(item.evidenceLabel)
    }
    for (const item of view.traditionalNotes) {
      push(item.text)
      push(item.evidenceLabel)
    }
    for (const item of view.uses) {
      push(item.use)
      push(item.grade)
      push(item.gradeLabel)
      push(item.definition)
      push(item.basis)
      push(item.evidenceLabel)
    }
  }
  const poison = poisoningGuidance()
  push(poison)
  return out
}
