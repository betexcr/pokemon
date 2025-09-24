import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { buildFullDex } from "@/lib/checklist/buildDex";

export const revalidate = 86400; // 24h

const cachedDex = unstable_cache(
  async () => buildFullDex(),
  ["dex-full-v1"],
  { revalidate: 86400, tags: ["dex"] }
);

export async function GET() {
  const dex = await cachedDex();
  return NextResponse.json(dex, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, max-age=86400, stale-while-revalidate=172800",
    },
  });
}

