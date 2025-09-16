export function toCssPos(p: { x: number; y: number }) {
  return { left: `${p.x * 100}%`, top: `${p.y * 100}%` };
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

