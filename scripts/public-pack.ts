import { readFileSync } from 'node:fs'
import path from 'node:path'
import { hasDosing, stripDosing } from '../src/dosing.ts'

export interface RawUse {
  use: string
  evidence_grade: string
  basis: string
  evidence_label?: string
  sources: string[]
}

export interface RawCited {
  text: string
  sources: string[]
  evidence_label?: string
}

export interface RawToxicity {
  level: string
  summary: string
  sources: string[]
}

export interface RawLookalike {
  lookalike: string
  risk: string
  distinguishing_features: string
  evidence_label?: string
  sources: string[]
}

export interface RawPlant {
  id: string
  common_name: string
  botanical_name: string
  medicinal_uses: RawUse[]
  toxicity?: RawToxicity
  lookalikes?: RawLookalike[]
  cautions?: RawCited[]
  traditional_notes?: RawCited[]
  safety_banner: string
}

interface RawContent {
  schema_version: string
  grades: Record<string, string>
  general_safety: { id: string; text: string; sources: string[] }[]
  plants: RawPlant[]
}

interface RawSource {
  id: string
  title: string
  publisher: string
  url: string
  type: string
}

export interface PublishedPlant extends RawPlant {
  expert_review_pending?: boolean
}

export interface PublicPack {
  content: {
    schema_version: string
    grades: Record<string, string>
    general_safety: { id: string; text: string; sources: string[] }[]
    plants: PublishedPlant[]
    counts: {
      plants: number
      uses: number
      by_grade: Record<string, number>
      with_lookalikes: number
      with_toxicity: number
    }
  }
  sources: RawSource[]
  evidenceLabelNote: string
}

/** A plant stays withheld only when every medicinal use is no_known_benefit. */
export function isUnreviewedEntry(uses: readonly { evidence_grade: string }[]): boolean {
  return uses.length > 0 && uses.every((use) => use.evidence_grade === 'no_known_benefit')
}

export function assertPublishableField(text: string, where: string): string {
  if (hasDosing(text)) throw new Error(`Refusing to publish dosing in ${where}`)
  return text
}

function publishUseText(text: string, where: string): string {
  const stripped = stripDosing(text)
  if (hasDosing(stripped)) throw new Error(`Dosing remains in ${where}`)
  return stripped
}

function publishUse(use: RawUse, where: string): RawUse {
  return {
    use: publishUseText(use.use, `${where} use`),
    evidence_grade: use.evidence_grade,
    basis: publishUseText(use.basis, `${where} basis`),
    ...(use.evidence_label ? { evidence_label: assertPublishableField(use.evidence_label, `${where} evidence_label`) } : {}),
    sources: use.sources,
  }
}

function publishToxicity(toxicity: RawToxicity, where: string): RawToxicity {
  return {
    level: assertPublishableField(toxicity.level, `${where} toxicity level`),
    summary: assertPublishableField(toxicity.summary, `${where} toxicity`),
    sources: toxicity.sources,
  }
}

function publishLookalike(item: RawLookalike, where: string): RawLookalike {
  return {
    lookalike: assertPublishableField(item.lookalike, `${where} lookalike`),
    risk: assertPublishableField(item.risk, `${where} lookalike risk`),
    distinguishing_features: assertPublishableField(item.distinguishing_features, `${where} lookalike features`),
    ...(item.evidence_label ? { evidence_label: assertPublishableField(item.evidence_label, `${where} lookalike label`) } : {}),
    sources: item.sources,
  }
}

function publishNote(item: RawCited, where: string): RawCited {
  return {
    text: assertPublishableField(item.text, where),
    ...(item.evidence_label ? { evidence_label: assertPublishableField(item.evidence_label, `${where} label`) } : {}),
    sources: item.sources,
  }
}

export function toPublishedPlant(plant: RawPlant): PublishedPlant {
  const pending = isUnreviewedEntry(plant.medicinal_uses)
  const published: PublishedPlant = {
    id: plant.id,
    common_name: assertPublishableField(plant.common_name, `${plant.id} common_name`),
    botanical_name: assertPublishableField(plant.botanical_name, `${plant.id} botanical_name`),
    safety_banner: assertPublishableField(plant.safety_banner, `${plant.id} safety_banner`),
    medicinal_uses: pending ? [] : plant.medicinal_uses.map((use) => publishUse(use, plant.id)),
    ...(plant.toxicity ? { toxicity: publishToxicity(plant.toxicity, plant.id) } : {}),
    ...(plant.lookalikes ? { lookalikes: plant.lookalikes.map((item) => publishLookalike(item, plant.id)) } : {}),
  }
  for (const item of plant.cautions ?? []) assertPublishableField(item.text, `${plant.id} caution`)
  for (const item of plant.traditional_notes ?? []) assertPublishableField(item.text, `${plant.id} traditional note`)
  if (pending) {
    published.expert_review_pending = true
    return published
  }
  if (plant.cautions) published.cautions = plant.cautions.map((item) => publishNote(item, `${plant.id} caution`))
  if (plant.traditional_notes) {
    published.traditional_notes = plant.traditional_notes.map((item) => publishNote(item, `${plant.id} traditional note`))
  }
  return published
}

export function labelsLine(readme: string): string {
  const line = readme.split('\n').find((entry) => entry.trimStart().startsWith('- Labels:'))
  if (!line) throw new Error('README Labels line is missing')
  const note = line.replace(/^-\s*/, '').replace(/`/g, '').trim()
  if (!note.includes('stated by the cited source')) throw new Error('README Labels line is not the evidence-label note')
  if (/verification log|botanist|pharmacist review/i.test(note)) {
    throw new Error('README Labels extraction included withheld review text')
  }
  return assertPublishableField(note, 'README Labels line')
}

function referencedSourceIds(plants: readonly PublishedPlant[], safety: RawContent['general_safety']): Set<string> {
  const ids = new Set<string>()
  for (const item of safety) for (const id of item.sources) ids.add(id)
  for (const plant of plants) {
    for (const use of plant.medicinal_uses) for (const id of use.sources) ids.add(id)
    for (const id of plant.toxicity?.sources ?? []) ids.add(id)
    for (const item of plant.lookalikes ?? []) for (const id of item.sources) ids.add(id)
    for (const item of plant.cautions ?? []) for (const id of item.sources) ids.add(id)
    for (const item of plant.traditional_notes ?? []) for (const id of item.sources) ids.add(id)
  }
  return ids
}

function countsFor(plants: readonly PublishedPlant[]): PublicPack['content']['counts'] {
  const by_grade: Record<string, number> = {}
  let uses = 0
  let with_lookalikes = 0
  let with_toxicity = 0
  for (const plant of plants) {
    if (plant.toxicity) with_toxicity += 1
    if ((plant.lookalikes ?? []).length > 0) with_lookalikes += 1
    for (const use of plant.medicinal_uses) {
      uses += 1
      by_grade[use.evidence_grade] = (by_grade[use.evidence_grade] ?? 0) + 1
    }
  }
  return { plants: plants.length, uses, by_grade, with_lookalikes, with_toxicity }
}

export function buildPublicPack(root = process.cwd()): PublicPack {
  const content = JSON.parse(readFileSync(path.join(root, 'data/content.json'), 'utf8')) as RawContent
  const sources = JSON.parse(readFileSync(path.join(root, 'data/sources.json'), 'utf8')) as RawSource[]
  const readme = readFileSync(path.join(root, 'data/README.md'), 'utf8')
  const grades: Record<string, string> = {}
  for (const [id, text] of Object.entries(content.grades)) grades[id] = assertPublishableField(text, `grade ${id}`)
  const general_safety = content.general_safety.map((item) => ({
    ...item,
    text: assertPublishableField(item.text, `general safety ${item.id}`),
  }))
  const plants = content.plants.map((plant) => toPublishedPlant(plant))
  const allowed = referencedSourceIds(plants, general_safety)
  const publishedSources = sources
    .filter((source) => allowed.has(source.id))
    .map((source) => ({
      ...source,
      title: assertPublishableField(source.title, `source ${source.id} title`),
      publisher: assertPublishableField(source.publisher, `source ${source.id} publisher`),
    }))
  return {
    content: {
      schema_version: content.schema_version,
      grades,
      general_safety,
      plants,
      counts: countsFor(plants),
    },
    sources: publishedSources,
    evidenceLabelNote: labelsLine(readme),
  }
}
