export type Point = { x: number; y: number }; // 0..1 relative to arena
export type MoveCommonProps = {
  from: Point;
  to: Point;
  onDone?: () => void;
  power?: number; // 0.5..2 suggested
};
export type FxKind = "electric" | "water" | "fire" | "grass" | "ice" | "rock" | "ground" | "psychic" | "fairy";

