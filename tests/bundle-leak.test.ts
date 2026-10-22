import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'

const TEXT = new Set(['.js', '.mjs', '.css', '.html', '.svg', '.json', '.map', '.txt', '.webmanifest'])
const BINARY = new Set(['.woff', '.woff2', '.ttf', '.otf', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico'])

interface RawUse {
  use: string
  basis: string
  evidence_grade: string
  sources: string[]
}

interface RawPlant {
  id: string
  medicinal_uses: RawUse[]
  toxicity?: { sources: string[] }
  lookalikes?: { sources: string[] }[]
  cautions?: { text: string; sources: string[] }[]
  traditional_notes?: { text: string; sources: string[] }[]
}

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

function decodeBundle(source: string): string {
  return source
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
}

function withheldStrings(): string[] {
  const root = process.cwd()
  const content = JSON.parse(readFileSync(path.join(root, 'data/content.json'), 'utf8')) as {
    general_safety: { sources: string[] }[]
    plants: RawPlant[]
  }
  const sources = JSON.parse(readFileSync(path.join(root, 'data/sources.json'), 'utf8')) as {
    id: string
    title: string
    url: string
  }[]
  const readme = readFileSync(path.join(root, 'data/README.md'), 'utf8')
  const pending = content.plants.filter(
    (plant) => plant.medicinal_uses.length > 0 && plant.medicinal_uses.every((use) => use.evidence_grade === 'no_known_benefit'),
  )
  const needles = new Set<string>()
  const allowedSources = new Set<string>()
  for (const item of content.general_safety) for (const id of item.sources) allowedSources.add(id)
  for (const plant of content.plants) {
    const hidden = pending.includes(plant)
    if (!hidden) {
      for (const use of plant.medicinal_uses) for (const id of use.sources) allowedSources.add(id)
      for (const item of plant.cautions ?? []) for (const id of item.sources) allowedSources.add(id)
      for (const item of plant.traditional_notes ?? []) for (const id of item.sources) allowedSources.add(id)
    } else {
      for (const use of plant.medicinal_uses) {
        needles.add(use.use)
        needles.add(use.basis)
      }
      for (const item of plant.cautions ?? []) needles.add(item.text)
      for (const item of plant.traditional_notes ?? []) needles.add(item.text)
    }
    for (const id of plant.toxicity?.sources ?? []) allowedSources.add(id)
    for (const item of plant.lookalikes ?? []) for (const id of item.sources) allowedSources.add(id)
  }
  for (const line of readme.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('- Labels:')) continue
    needles.add(trimmed)
  }
  for (const source of sources) {
    if (allowedSources.has(source.id)) continue
    needles.add(source.title)
    needles.add(source.url)
  }
  return [...needles].filter((needle) => needle.length > 0)
}

test('client source does not import the pack files', () => {
  const files = walk(path.join(process.cwd(), 'src')).filter((file) => statSync(file).isFile())
  expect(files.length).toBeGreaterThan(0)
  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    expect(source, file).not.toMatch(/data\/content\.json/)
    expect(source, file).not.toMatch(/data\/sources\.json/)
    expect(source, file).not.toMatch(/data\/README\.md/)
  }
})

test('built dist omits every withheld pack string', { timeout: 120_000 }, () => {
  const needles = withheldStrings()
  expect(needles.some((needle) => needle.includes('digoxin is derived'))).toBe(true)
  expect(needles.some((needle) => needle.includes('taxane alkaloids'))).toBe(true)
  expect(needles.some((needle) => needle.includes('needs a botanist/pharmacist review'))).toBe(true)
  expect(needles.some((needle) => needle.includes('Verification log'))).toBe(true)
  expect(needles.some((needle) => needle.includes('CD003230.pub5 does not exist'))).toBe(true)
  expect(needles.some((needle) => needle.includes('evening primrose not included'))).toBe(true)

  execFileSync(process.execPath, [path.join(process.cwd(), 'node_modules/vite/bin/vite.js'), 'build'], {
    cwd: process.cwd(),
    stdio: 'pipe',
    env: process.env,
  })

  const dist = path.join(process.cwd(), 'dist')
  const files = walk(dist)
  expect(files.length).toBeGreaterThan(0)
  const scanned: string[] = []
  for (const file of files) {
    const ext = path.extname(file).toLowerCase()
    const base = path.basename(file)
    if (BINARY.has(ext)) continue
    if (ext && !TEXT.has(ext)) throw new Error(`Refusing to skip unscanned dist file ${file}`)
    if (!ext && base !== '_headers' && base !== '_redirects') throw new Error(`Refusing to skip unscanned dist file ${file}`)
    scanned.push(file)
  }
  const haystack = scanned.map((file) => decodeBundle(readFileSync(file, 'utf8'))).join('\n')
  expect(haystack).toContain('stated by the cited source')
  expect(haystack).toContain('Clinically supported (specific products)')
  expect(haystack).not.toContain('needs a botanist/pharmacist review')
  expect(haystack).not.toContain('Verification log')

  const leaked = needles.filter((needle) => haystack.includes(needle))
  expect(leaked, leaked.slice(0, 8).join('\n')).toEqual([])
})
