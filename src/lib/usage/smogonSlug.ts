/**
 * Smogon usage filename resolution for `/usage`.
 *
 * Combined usage stats live at:
 * `https://www.smogon.com/stats/{YYYY-MM}/{stem}-0.txt`
 *
 * **Singles (SMOGON_SINGLES)** — stem `gen{N}{tier}` (e.g. `gen9ou`, `gen9monotype`).
 * Tier must match Smogon’s published basename for that generation.
 *
 * **VGC (VGC_OFFICIAL)** — Smogon doubles filenames follow regulation seasons, e.g.
 * `gen9vgc2025regg`, `gen9vgc2024regh`. The letter maps to `VGC_REG_*`:
 * `VGC_REG_A` → `rega`, …, `VGC_REG_I` → `regi`. Year is chosen from the monthly
 * index (prefer calendar year of the stats month, then prior years). Non-`bo3`
 * files are preferred when both exist.
 *
 * **BSS (BSS_OFFICIAL)** — regulation files: `gen{N}bssreg{L}-0.txt` (e.g. `gen9bssregg`).
 * Gen 8 Battle Stadium Singles often appears as `gen8battlestadiumsingles-0.txt`.
 * Series labels (`BSS_SERIES_12` / `13`) map to the regulation dumps Smogon published
 * for those seasons (see `pickBssSeriesGen9` in `smogonResolve.ts`).
 *
 * Resolution uses the monthly index HTML (`fetchSmogonIndexFilenames`) so renames
 * are discovered without hard-coding every historical filename.
 *
 * **Verifying filenames:** Open `https://www.smogon.com/stats/{YYYY-MM}/` in a browser
 * and confirm which `*-0.txt` basenames exist when regulations change. If the index
 * HTML breaks or returns empty, `resolveSmogonUsageFile` falls back to conventional
 * stems probed with `HEAD` (see `tryResolveViaStaticHead` in `smogonResolve.ts`).
 *
 * **Ops / env (availability):** `USAGE_AVAILABILITY_MONTHS` (default 18, max 36),
 * `USAGE_AVAILABILITY_CONCURRENCY` (default 6, max 32) tune `/api/usage/availability`
 * probe cost; availability uses index-only existence when resolution succeeds (no full
 * `.txt` download per cell).
 */

export { resolveSmogonUsageFile, type ResolvedSmogonStem, type SmogonFormatKind } from './smogonResolve';
