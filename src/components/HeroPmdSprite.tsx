'use client'

import React from 'react'
import SpriteJsTile from './SpriteJsTile'

type AnimMeta = {
	name: string
	sheet: string
	frameWidth: number
	frameHeight: number
	frames: number
	baseDurationSec: number
	cols: number
	rows: number
}

function buildCandidateBases(pokemonId: number): string[] {
	const id = String(pokemonId).padStart(4, '0')
	return [
		`/assets/pmd/${id}/sprite`,
		`https://spriteserver.pmdcollab.org/assets/${id}/sprite`,
		`https://sprites.pmdcollab.org/assets/pmd/${id}/sprite`,
		`https://sprites.pmdcollab.org/pmd/${id}/sprite`,
	]
}

async function fetchFirst(urls: string[]): Promise<{ base: string; text: string } | null> {
	for (const u of urls) {
		try {
			const res = await fetch(`${u}/AnimData.xml`, { cache: 'no-store' })
			if (res.ok) {
				const text = await res.text()
				return { base: u, text }
			}
		} catch {}
	}
	return null
}

export function usePmdAnimations(pokemonId: number): { anims: AnimMeta[] | null; error: string | null } {
	const [list, setList] = React.useState<AnimMeta[] | null>(null)
	const [error, setError] = React.useState<string | null>(null)

	React.useEffect(() => {
		let cancelled = false
		const load = async () => {
			const basePath = `/assets/pmd/${String(pokemonId).padStart(4, '0')}/sprite`
			const remoteBasePath = `https://spriteserver.pmdcollab.org/assets/${String(pokemonId).padStart(4, '0')}/sprite`

			try {
				let xmlText: string
				try {
					const res = await fetch(`${basePath}/AnimData.xml`)
					if (!res.ok) throw new Error('Local AnimData.xml not found')
					xmlText = await res.text()
				} catch (e) {
					console.warn(`Local AnimData.xml for ${pokemonId} not found, trying remote:`, e)
					const res = await fetch(`${remoteBasePath}/AnimData.xml`)
					if (!res.ok) throw new Error('Remote AnimData.xml not found')
					xmlText = await res.text()
				}

				const doc = new DOMParser().parseFromString(xmlText, 'application/xml')
				const animNodes = Array.from(doc.getElementsByTagName('Anim'))
				const out: AnimMeta[] = []

				for (const node of animNodes) {
					const name = node.getElementsByTagName('Name')[0]?.textContent || ''
					if (!name) continue
					
					console.log(`Processing PMD animation: ${name} for Pokemon ${pokemonId}`)

					const w = Number(node.getElementsByTagName('FrameWidth')[0]?.textContent || '40')
					const h = Number(node.getElementsByTagName('FrameHeight')[0]?.textContent || '40')
					const durations = Array.from(node.getElementsByTagName('Durations')[0]?.getElementsByTagName('Duration') || [])
					const frames = Math.max(1, durations.length)
					const ticks = durations.reduce((sum, d) => sum + Number(d.textContent || '0'), 0)
					const baseDurationSec = ticks > 0 ? Math.max(0.2, ticks * 0.05) : Math.max(0.2, frames * 0.08)

					// We need to load the image to get actual cols/rows
					const sheetUrl = `${basePath}/${name}-Anim.png`
					const remoteSheetUrl = `${remoteBasePath}/${name}-Anim.png`

					let sheetImg = new Image()
					sheetImg.crossOrigin = 'anonymous'
					let imgLoaded = false

					try {
						await new Promise<void>((resolve, reject) => {
							sheetImg.onload = () => { imgLoaded = true; resolve() }
							sheetImg.onerror = () => reject(new Error(`Failed to load local sheet for ${name}`))
							sheetImg.src = sheetUrl
						})
					} catch (e) {
						console.warn(`Local sheet for ${name} not found, trying remote:`, e)
						try {
							await new Promise<void>((resolve, reject) => {
								sheetImg = new Image() // Re-create image to clear error state
								sheetImg.crossOrigin = 'anonymous'
								sheetImg.onload = () => { imgLoaded = true; resolve() }
								sheetImg.onerror = () => reject(new Error(`Failed to load remote sheet for ${name}`))
								sheetImg.src = remoteSheetUrl
							})
						} catch (e) {
							console.warn(`Skipping animation ${name} - no sprite sheet available:`, e)
							continue // Skip this animation if no sheet can be loaded
						}
					}

					if (!imgLoaded) {
						console.warn(`Image for ${name} did not load, skipping.`)
						continue
					}

					const cols = Math.max(1, Math.floor(sheetImg.naturalWidth / w))
					const rows = Math.max(1, Math.floor(sheetImg.naturalHeight / h))

					out.push({
						name,
						sheet: sheetImg.src, // Use the successfully loaded URL
						frameWidth: w,
						frameHeight: h,
						frames,
						baseDurationSec,
						cols,
						rows,
					})
				}
				if (!cancelled) {
					setList(out)
					setError(null)
				}
			} catch (e: any) {
				console.error(`Error loading PMD animations for ${pokemonId}:`, e)
				if (!cancelled) {
					// Don't fail completely if we have some animations loaded
					if (out.length > 0) {
						setList(out)
						setError(null)
					} else {
						setList(null)
						setError(e.message || 'Failed to load animations')
					}
				}
			}
		}
		load()
		return () => { cancelled = true }
	}, [pokemonId])

	return { anims: list, error }
}

type HeroPmdSpriteProps = {
	pokemonId: number
	animName: string
	scale?: number
	speedMul?: number
}

export default function HeroPmdSprite({ pokemonId, animName, scale = 2, speedMul = 1 }: HeroPmdSpriteProps) {
	const { anims, error: hookError } = usePmdAnimations(pokemonId)
	const [error, setError] = React.useState<string | null>(null)

	const meta = React.useMemo(() => anims?.find(a => a.name === animName), [anims, animName])

	React.useEffect(() => {
		setError(hookError)
	}, [hookError])

	if (error) {
		return <div className="text-red-500 text-xs text-center">{error}</div>
	}
	if (!meta) {
		return <div className="text-gray-500 text-xs text-center">Loading animation...</div>
	}

	// Convert AnimMeta to the format expected by SpriteJsTile
	const spriteMeta = {
		name: meta.name,
		sheet: meta.sheet,
		frameWidth: meta.frameWidth,
		frameHeight: meta.frameHeight,
		frames: meta.frames,
		baseDurationSec: meta.baseDurationSec,
	}

	return <SpriteJsTile meta={spriteMeta} speedMul={speedMul} scale={scale} />
}