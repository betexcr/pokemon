"use client";
import { MoveCommonProps, FxKind } from "./MoveFX.types";
import ElectricZap from "./ElectricZap";
import WaterRipple from "./WaterRipple";
import FireFlicker from "./FireFlicker";
import GrassLeaf from "./GrassLeaf";
import IceShard from "./IceShard";
import PsychicRing from "./PsychicRing";
import FairyStar from "./FairyStar";

type Props = MoveCommonProps & { kind: FxKind };

export default function MoveFX({ kind, ...rest }: Props) {
  switch (kind) {
    case "electric": return <ElectricZap {...rest} />;
    case "water":    return <WaterRipple {...rest} />;
    case "fire":     return <FireFlicker {...rest} />;
    case "grass":    return <GrassLeaf {...rest} />;
    case "ice":      return <IceShard {...rest} />;
    case "psychic":  return <PsychicRing {...rest} />;
    case "fairy":    return <FairyStar {...rest} />;
    // TODO: Add rock/ground effects
    case "rock":     return <FireFlicker {...rest} />; // Placeholder
    case "ground":   return <FireFlicker {...rest} />; // Placeholder
    default:         return null;
  }
}

