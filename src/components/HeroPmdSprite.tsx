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

export function usePmdAnimations(pokemonId: number): { anims: AnimMeta[] | null; error: string | null } {
	const [list, setList] = React.useState<AnimMeta[] | null>(null)
	const [error, setError] = React.useState<string | null>(null)

	React.useEffect(() => {
		let cancelled = false
		const load = async () => {
			const id = String(pokemonId).padStart(4, '0')
			const basePath = `/assets/pmd/${id}/sprite`
			const remoteBasePath = `https://spriteserver.pmdcollab.org/assets/${id}/sprite`
			const out: AnimMeta[] = []

			try {
				let xmlText: string
				try {
					const res = await fetch(`${basePath}/AnimData.xml`)
					if (!res.ok) throw new Error('Local AnimData.xml not found')
					xmlText = await res.text()
				} catch {
					if (cancelled) return
					const res = await fetch(`${remoteBasePath}/AnimData.xml`)
					if (!res.ok) throw new Error('No AnimData.xml available')
					xmlText = await res.text()
				}

				if (cancelled) return

				const doc = new DOMParser().parseFromString(xmlText, 'application/xml')
				const animNodes = Array.from(doc.getElementsByTagName('Anim'))

				for (const node of animNodes) {
					if (cancelled) return
					const name = node.getElementsByTagName('Name')[0]?.textContent || ''
					if (!name) continue

					const w = Number(node.getElementsByTagName('FrameWidth')[0]?.textContent || '40')
					const h = Number(node.getElementsByTagName('FrameHeight')[0]?.textContent || '40')
					const durations = Array.from(node.getElementsByTagName('Durations')[0]?.getElementsByTagName('Duration') || [])
					const frames = Math.max(1, durations.length)
					const ticks = durations.reduce((sum, d) => sum + Number(d.textContent || '0'), 0)
					const baseDurationSec = ticks > 0 ? Math.max(0.2, ticks * 0.05) : Math.max(0.2, frames * 0.08)

					const sheetUrl = `${basePath}/${name}-Anim.png`
					const remoteSheetUrl = `${remoteBasePath}/${name}-Anim.png`

					const loadImage = (url: string) => new Promise<HTMLImageElement>((resolve, reject) => {
						const img = new Image()
						img.crossOrigin = 'anonymous'
						img.onload = () => resolve(img)
						img.onerror = () => reject(new Error(`Failed to load ${url}`))
						img.src = url
					})

					let sheetImg: HTMLImageElement | null = null
					try {
						sheetImg = await loadImage(sheetUrl)
					} catch {
						try {
							sheetImg = await loadImage(remoteSheetUrl)
						} catch {
							continue
						}
					}

					if (!sheetImg) continue

					out.push({
						name,
						sheet: sheetImg.src,
						frameWidth: w,
						frameHeight: h,
						frames,
						baseDurationSec,
						cols: Math.max(1, Math.floor(sheetImg.naturalWidth / w)),
						rows: Math.max(1, Math.floor(sheetImg.naturalHeight / h)),
					})
				}
				if (!cancelled) {
					setList(out)
					setError(null)
				}
			} catch (e: any) {
				if (!cancelled) {
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