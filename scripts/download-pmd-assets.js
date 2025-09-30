#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const https = require('https')

const BASES = [
  'https://sprites.pmdcollab.org/assets/pmd',
  'https://sprites.pmdcollab.org/pmd'
]
const SERVER_ZIP = (id) => `https://spriteserver.pmdcollab.org/assets/${id}/sprites.zip`
const PAGE = (id) => `https://sprites.pmdcollab.org/#/${id}?form=0`

function fetchBuf(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuf(res.headers.location).then(resolve, reject)
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      const data = []
      res.on('data', d => data.push(d))
      res.on('end', () => resolve(Buffer.concat(data)))
    }).on('error', reject)
  })
}

async function tryFetch(primary, alts) {
  try { return await fetchBuf(primary) } catch {}
  for (const u of alts) { try { return await fetchBuf(u) } catch {} }
  throw new Error('all sources failed')
}

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true })
}

async function saveFile(filepath, data) {
  await ensureDir(path.dirname(filepath))
  await fs.promises.writeFile(filepath, data)
}

async function downloadForId(id) {
  const outDir = path.resolve(process.cwd(), 'public/assets/pmd', id, 'sprite')
  await ensureDir(outDir)
  // Try multiple id formats: 4-digit, 3-digit, plain
  const idVariants = [id, id.replace(/^0+/, ''), id.slice(-3)]
  const sources = []
  for (const base of BASES) {
    for (const v of idVariants) {
      sources.push(`${base}/${v}/sprite`)
    }
  }
  // Try XML path first
  try {
    const xml = await tryFetch(`${sources[0]}/AnimData.xml`, sources.slice(1).map(s => `${s}/AnimData.xml`))
    await saveFile(path.join(outDir, 'AnimData.xml'), xml)
  } catch {}

  // Prefer the site-provided ZIP: use spriteserver direct, then fallbacks
  const zipCandidates = [
    SERVER_ZIP(id),
    ...BASES.map(b => `${b}/${id}/sprite.zip`),
    ...BASES.map(b => `${b}/${id}.zip`),
  ]
  let zipBuf = null
  for (const z of zipCandidates) {
    try { zipBuf = await fetchBuf(z); console.log(`found zip: ${z}`); break } catch {}
  }
  if (!zipBuf) {
    // Try scraping the SPA page for a .zip href
    try {
      const html = (await fetchBuf(PAGE(id))).toString('utf-8')
      const m = html.match(/href=\"([^\"]+\.zip)\"/i)
      if (m) {
        const zipUrl = m[1].startsWith('http') ? m[1] : `https://sprites.pmdcollab.org${m[1]}`
        zipBuf = await fetchBuf(zipUrl)
        console.log(`scraped zip: ${zipUrl}`)
      }
    } catch {}
  }
  if (zipBuf) {
    const tmpZip = path.join(process.cwd(), `pmd-${id}.zip`)
    await fs.promises.writeFile(tmpZip, zipBuf)
    // Unzip using system unzip
    await new Promise((resolve, reject) => {
      const { exec } = require('child_process')
      exec(`unzip -o ${JSON.stringify(tmpZip)} -d ${JSON.stringify(outDir)}`, (err, stdout, stderr) => {
        if (err) return reject(err)
        resolve(null)
      })
    })
    await fs.promises.unlink(tmpZip).catch(() => {})
    console.log(`unzipped into ${outDir}`)
    return
  }

  // Fallback: try to fetch frames individually if XML was available
  try {
    const xmlPath = path.join(outDir, 'AnimData.xml')
    const xml = await fs.promises.readFile(xmlPath)
    const text = xml.toString('utf-8')
    const names = Array.from(text.matchAll(new RegExp('<Name>([^<]+)</Name>', 'g'))).map(m => m[1])
    const unique = Array.from(new Set(names))
    for (const name of unique) {
      const filename = `${name}-Anim.png`
      const primary = `${sources[0]}/${filename}`
      const alternates = sources.slice(1).map(s => `${s}/${filename}`)
      try {
        const buf = await tryFetch(primary, alternates)
        await saveFile(path.join(outDir, filename), buf)
        console.log(`saved: ${id}/${filename}`)
      } catch {
        console.warn(`missing: ${id}/${filename}`)
      }
    }
  } catch {
    throw new Error('Failed to locate ZIP or XML')
  }
}

async function main() {
  const idsArg = process.argv[2] || ''
  let ids = []
  if (!idsArg) {
    ids = ['0025']
  } else if (idsArg.includes('-')) {
    const [a, b] = idsArg.split('-').map(s => parseInt(s.trim(), 10))
    for (let i = a; i <= b; i++) ids.push(String(i).padStart(4, '0'))
  } else {
    ids = idsArg.split(',').map(s => s.trim()).filter(Boolean).map(s => String(parseInt(s, 10)).padStart(4, '0'))
  }
  for (const raw of ids) {
    const id = raw.padStart(4, '0')
    try { await downloadForId(id) } catch (e) { console.error(`Failed for ${id}:`, e.message) }
  }
}

main()


