"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Tabs() {
  const items = ["overview","stats","moves","evolution","matchups"] as const;
  const [active, setActive] = useState("overview");

  useEffect(() => {
    const onScroll = () => {
      let current = active;
      for (const id of items) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= 96) current = id;
      }
      setActive(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="sticky top-16 z-30 border-b border-border/60 bg-bg/80 backdrop-blur">
      <ul className="mx-auto max-w-5xl px-4 py-2 flex flex-wrap gap-2">
        {items.map((id) => (
          <li key={id}>
            <Link
              href={`#${id}`}
              aria-current={active === id ? "page" : undefined}
              className="rounded-full px-3 py-1.5 text-sm font-semibold
                         text-text hover:bg-white/50 focus:outline-none
                         focus-visible:ring-2 focus-visible:ring-poke-blue
                         aria-[current=page]:text-poke-blue
                         aria-[current=page]:bg-poke-blue/10"
            >
              {capitalize(id)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
const capitalize = (s:string)=>s[0].toUpperCase()+s.slice(1);
