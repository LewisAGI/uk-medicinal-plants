import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, test } from 'vitest'

const ROOT = process.cwd()
const FIXTURE = path.join(ROOT, 'tests/fixtures/pack-uk-medicinal-plants-v1.tgz')
const STORE = '/cursor/stores/bot/packs/pack-uk-medicinal-plants-v1.tgz'
const PACK_SHA256 = '8e99f7b998673d47a050302a8fa7e82a052b1e39433fb7df498cf95746a522ed'

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function walk(dir: string, base = dir): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full, base))
    else out.push(path.relative(base, full).split(path.sep).join('/'))
  }
  return out.sort()
}

function filesFromTar(tarball: string): Map<string, Buffer> {
  const names = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' })
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.endsWith('/'))
  const out = new Map<string, Buffer>()
  for (const name of names) {
    const clean = name.replace(/^\.\//, '')
    const prefix = 'uk-medicinal-plants/'
    if (!clean.startsWith(prefix)) throw new Error(`unexpected pack path ${name}`)
    const bytes = execFileSync('tar', ['-xOzf', tarball, name], { maxBuffer: 20_000_000 })
    out.set(clean.slice(prefix.length), bytes)
  }
  return out
}

test('data matches the content pack byte-for-byte', () => {
  const fixture = readFileSync(FIXTURE)
  expect(sha256(fixture)).toBe(PACK_SHA256)
  if (existsSync(STORE)) {
    expect(readFileSync(STORE).equals(fixture)).toBe(true)
  }

  const packed = filesFromTar(FIXTURE)
  const dataDir = path.join(ROOT, 'data')
  const disk = walk(dataDir)
  expect(disk).toEqual([...packed.keys()].sort())
  for (const [rel, bytes] of packed) {
    const actual = readFileSync(path.join(dataDir, rel))
    expect(actual.equals(bytes), rel).toBe(true)
    expect(sha256(actual)).toBe(sha256(bytes))
  }
})
