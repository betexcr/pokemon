'use strict'

const fs = require('fs/promises')
const path = require('path')

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function readTop50NationalNumbers() {
  const filePath = path.join(process.cwd(), 'src', 'data', 'top50Pokemon.ts')
  const content = await fs.readFile(filePath, 'utf8')
  const numbers = new Set()
  const re = /nationalNumber:\s*(\d+)/g
  let m
  while ((m = re.exec(content)) !== null) {
    numbers.add(parseInt(m[1], 10))
  }
  return Array.from(numbers)
}

function padDex(num) {
  return String(num).padStart(4, '0')
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'pokemon-downloader' } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

async function fetchBuffer(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'pokemon-downloader' } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

async function main() {
  const outRoot = path.join(process.cwd(), 'public', 'assets', 'pmd')
  await ensureDir(outRoot)

  const dexNumbers = await readTop50NationalNumbers()
  const wantDex = new Set(dexNumbers.map(padDex))

  // Get entire repo tree once to avoid rate limits
  const treeUrl = 'https://api.github.com/repos/PMDCollab/SpriteCollab/git/trees/master?recursive=1'
  const tree = await fetchJson(treeUrl)
  if (!tree || !Array.isArray(tree.tree)) throw new Error('Unexpected tree response')

  // Collect files for desired dex folders
  const filesToDownload = []
  for (const node of tree.tree) {
    if (node.type !== 'blob') continue
    const p = node.path
    // Expected paths: sprite/0004/..., portrait/0004/...
    if (!(p.startsWith('sprite/') || p.startsWith('portrait/'))) continue
    const parts = p.split('/')
    if (parts.length < 3) continue
    const dex = parts[1]
    if (!wantDex.has(dex)) continue
    const kind = parts[0] // 'sprite' | 'portrait'
    const fileName = parts.slice(2).join('/')
    // Limit to images and AnimData.xml
    if (!(/\.(png|gif|webp)$/i.test(fileName) || /AnimData\.xml$/i.test(fileName))) continue
    const rawUrl = `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/${p}`
    filesToDownload.push({ rawUrl, dex, kind, fileName })
  }

  // Download with limited concurrency
  const concurrency = 8
  let idx = 0
  let ok = 0
  let fail = 0

  async function worker() {
    while (true) {
      const i = idx++
      if (i >= filesToDownload.length) return
      const item = filesToDownload[i]
      const destDir = path.join(outRoot, item.dex, item.kind)
      const destPath = path.join(destDir, item.fileName)
      try {
        await ensureDir(path.dirname(destPath))
        const buf = await fetchBuffer(item.rawUrl)
        await fs.writeFile(destPath, buf)
        ok++
      } catch (e) {
        fail++
        // eslint-disable-next-line no-console
        console.error('Failed:', item.rawUrl, e.message)
      }
    }
  }

  const start = Date.now()
  await Promise.all(Array.from({ length: concurrency }, () => worker()))
  const ms = Date.now() - start
  // eslint-disable-next-line no-console
  console.log(`Downloaded ${ok} files (${fail} failed) into ${outRoot} in ${Math.round(ms/1000)}s`)
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})



