'use client'

import React from 'react'

type AnimMeta = {
	name: string
	sheet: string
	frameWidth: number
	frameHeight: number
	frames: number
	baseDurationSec: number
}

export default function SpriteJsTile({ meta, speedMul = 1, scale = 2 }: { meta: AnimMeta; speedMul?: number; scale?: number }) {
	const containerRef = React.useRef<HTMLDivElement | null>(null)
	const [error, setError] = React.useState<string | null>(null)
	const [visible, setVisible] = React.useState<boolean>(false)
	const [isPlaying, setIsPlaying] = React.useState<boolean>(true)
	const [currentRow, setCurrentRow] = React.useState<number>(0)
	const [rowCount, setRowCount] = React.useState<number>(1)

	// Refs to share between callbacks without re-running the heavy setup
	const framesByRowRef = React.useRef<HTMLCanvasElement[][]>([])
	const frameIndexRef = React.useRef<number>(0)
	const isPlayingRef = React.useRef<boolean>(true)
	const currentRowRef = React.useRef<number>(0)

	React.useEffect(() => { isPlayingRef.current = isPlaying; if (!isPlaying) return; frameIndexRef.current = 0 }, [isPlaying])
	React.useEffect(() => { currentRowRef.current = currentRow; frameIndexRef.current = 0 }, [currentRow])

	React.useEffect(() => {
		let disposed = false
		let scene: any | null = null
		let layer: any | null = null
		let sprite: any | null = null
		let timer: number | null = null

		const run = async () => {
			try {
				// Force canvas fallback by disabling WebGL globals before loading spritejs
				const g: any = window as any
				const prevGL = g.WebGLRenderingContext
				const prevGL2 = g.WebGL2RenderingContext
				g.WebGLRenderingContext = undefined
				g.WebGL2RenderingContext = undefined
				const { Scene, Sprite } = await import('spritejs')
				if (!containerRef.current) return
				// Ensure a clean container (StrictMode mounts can double-invoke effects)
				try { containerRef.current.innerHTML = '' } catch {}
				const width = Math.max(1, Math.round(meta.frameWidth * scale))
				const height = Math.max(1, Math.round(meta.frameHeight * scale))
				// Hide until first frame is ready to avoid any placeholder icons
				containerRef.current.style.visibility = 'hidden'
				scene = new Scene({ container: containerRef.current, width, height })
				// Use 2D canvas to avoid WebGL shader errors in environments without WebGL
				layer = scene.layer({ contextType: '2d' })

				const sheetImg = new Image()
				sheetImg.crossOrigin = 'anonymous'
					sheetImg.onload = () => {
					try {
							const cols = Math.max(1, Math.floor(sheetImg.naturalWidth / meta.frameWidth))
							const rows = Math.max(1, Math.floor(sheetImg.naturalHeight / meta.frameHeight))
							// Build frames per row so we can cycle across rows for multi-row sheets
							const framesPerRow = Math.max(1, Math.min(meta.frames, cols))
							const framesByRow: HTMLCanvasElement[][] = []
							for (let r = 0; r < rows; r++) {
								const rowFrames: HTMLCanvasElement[] = []
								for (let i = 0; i < framesPerRow; i++) {
									const sx = i * meta.frameWidth
									const sy = r * meta.frameHeight
									const canvas = document.createElement('canvas')
									canvas.width = Math.max(1, Math.round(meta.frameWidth * scale))
									canvas.height = Math.max(1, Math.round(meta.frameHeight * scale))
									const ctx = canvas.getContext('2d')!
									ctx.imageSmoothingEnabled = false
									ctx.drawImage(
										sheetImg,
										sx,
										sy,
										meta.frameWidth,
										meta.frameHeight,
										0,
										0,
										canvas.width,
										canvas.height
									)
									rowFrames.push(canvas)
								}
								framesByRow.push(rowFrames)
							}
							// Create sprite only after we have at least one prepared frame to avoid placeholder icon
							sprite = new Sprite()
							sprite.attr({ size: [width, height], texture: framesByRow[0]?.[0] })
							layer.append(sprite)
						// Reveal now that texture is ready
						setVisible(true)
						if (containerRef.current) containerRef.current.style.visibility = 'visible'

							// Save prepared data
							framesByRowRef.current = framesByRow
							frameIndexRef.current = 0
							setRowCount(framesByRow.length)
							setCurrentRow(0)

							const frameMs = Math.max(50, (meta.baseDurationSec / speedMul) * 1000 / Math.max(1, framesPerRow))
							const tick = () => {
								if (disposed) return
								if (!isPlayingRef.current) { timer = window.setTimeout(tick, frameMs); return }
								// Ensure previous frame is cleared on 2D layer to avoid ghost images
								try { (layer as any)?.clear && (layer as any).clear() } catch {}
								const rowsArr = framesByRowRef.current
								const rowIdx = Math.max(0, Math.min(currentRowRef.current, rowsArr.length - 1))
								const rowFrames = rowsArr[rowIdx] || []
								const idx = frameIndexRef.current % Math.max(1, rowFrames.length)
								const canvas = rowFrames[idx]
								sprite!.attr({ texture: canvas })
								// advance frame, and if we wrapped, move to next row automatically
								const nextIndex = (frameIndexRef.current + 1) % Math.max(1, rowFrames.length)
								const wrapped = nextIndex === 0
								frameIndexRef.current = nextIndex
								if (wrapped) {
									const rowsTotal = Math.max(1, rowsArr.length)
									const nextRow = (currentRowRef.current + 1) % rowsTotal
									currentRowRef.current = nextRow
									setCurrentRow(nextRow)
								}
								timer = window.setTimeout(tick, frameMs)
							}
							tick()
					} catch (e) {
						setError('Failed to prepare frames')
					}
				}
				sheetImg.onerror = () => setError('Failed to load sheet')
				sheetImg.src = meta.sheet
			} catch (e) {
				setError('SpriteJS init failed')
			}
		}
		run()

		return () => {
			disposed = true
			if (timer) window.clearTimeout(timer)
			try {
				if (sprite) sprite.remove()
				if (layer) (layer as any).clear && (layer as any).clear()
				if (scene) (scene as any).dispose && (scene as any).dispose()
				if (containerRef.current) containerRef.current.innerHTML = ''
			} catch {}
		}
	}, [meta.name, meta.sheet, meta.frameWidth, meta.frameHeight, meta.frames, meta.baseDurationSec, scale, speedMul])

	return (
		<div ref={containerRef} style={{ width: Math.max(1, Math.round(meta.frameWidth * scale)), height: Math.max(1, Math.round(meta.frameHeight * scale)), visibility: visible ? 'visible' : 'hidden' }} />
	)
}
