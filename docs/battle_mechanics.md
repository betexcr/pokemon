Perfect. I’ll now research the complete structure of Gen 9 Pokémon battle mechanics, including all phases—Start of Turn, Move Selection, Turn Execution (with priority, abilities, weather, items, status conditions), and End of Turn effects.

I’ll return with a breakdown of how these can be modeled in your system and provide a Codex-ready prompt to help you integrate this logic into your battle engine.


-----


Host your Next.js API routes on Vercel/Netlify (both have generous free tiers).

Clients do not write resolution fields in the battle doc.

Clients only POST their intent to /api/submitMove.

The API route (using Firebase Admin SDK) performs a transaction:

Read the current battle doc,

Write the caller’s move into a server-only field (or a server-owned subdoc),

If both sides have submitted and the turn is unresolved, compute the whole turn (priority, damage, abilities, weather, end-of-turn, etc.) and atomically write the resolved state (HP changes, logs, clear choices, increment turn).

Security rules: lock the battle doc so only reads are allowed to players; no client writes to authoritative fields. Players may only write to a tiny choices/{uid} subdoc (or skip even that and always POST to your API). The Admin SDK bypasses rules, so only your API can write resolution updates.