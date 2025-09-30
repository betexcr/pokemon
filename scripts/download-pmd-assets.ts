#!/usr/bin/env ts-node

import fs from 'fs'
import path from 'path'
import https from 'https'

const BASES = [
  'https://sprites.pmdcollab.org/assets/pmd',
  'https://sprites.pmdcollab.org/pmd'
]

function fetch(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // redirect
        fetch(res.headers.location).then(resolve, reject)
        return
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`))
        return
      }
      const data: Buffer[] = []
      res.on('data', (d) => data.push(d))
      res.on('end', () => resolve(Buffer.concat(data)))
    }).on('error', reject)
  })
}

async function tryFetch(first: string, rest: string[]): Promise<Buffer> {
  try { return await fetch(first) } catch {}
  for (const u of rest) { try { return await fetch(u) } catch {} }
  throw new Error(`All sources failed: ${[first, ...rest].join(', ')}`)
}

async function ensureDir(dir: string) {
  await fs.promises.mkdir(dir, { recursive: true })
}

async function saveFile(filepath: string, data: Buffer) {
  await ensureDir(path.dirname(filepath))
  await fs.promises.writeFile(filepath, data)
}

async function downloadForId(id: string) {
  const outDir = path.resolve(process.cwd(), 'public/assets/pmd', id, 'sprite')
  await ensureDir(outDir)
  const sources = BASES.map(b => `${b}/${id}/sprite`)
  const xml = await tryFetch(`${sources[0]}/AnimData.xml`, sources.slice(1).map(s => `${s}/AnimData.xml`))
  await saveFile(path.join(outDir, 'AnimData.xml'), xml)

  // Parse names from XML quickly
  const text = xml.toString('utf-8')
  const names = Array.from(text.matchAll(/<Name>([^<]+)<\/Name>/g)).map(m => m[1])
  const unique = Array.from(new Set(names))
  for (const name of unique) {
    const filename = `${name}-Anim.png`
    const primary = `${sources[0]}/${filename}`
    const alternates = sources.slice(1).map(s => `${s}/${filename}`)
    try {
      const buf = await tryFetch(primary, alternates)
      await saveFile(path.join(outDir, filename), buf)
      console.log(`saved: ${id}/${filename}`)
    } catch (e) {
      console.warn(`missing: ${id}/${filename}`)
    }
  }
}

async function main() {
  const idsArg = process.argv[2] || ''
  const ids = idsArg
    ? idsArg.split(',').map(s => s.trim()).filter(Boolean)
    : ['0025']

  for (const raw of ids) {
    const id = raw.padStart(4, '0')
    try {
      await downloadForId(id)
    } catch (e) {
      console.error(`Failed for ${id}:`, (e as Error).message)
    }
  }
}

main()


