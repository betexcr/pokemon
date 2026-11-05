'use client';

type TeraToggleProps = {
  /** Whether Terastallizing is still possible this battle for the active Pokémon. */
  available: boolean;
  teraType: string | null | undefined;
  armed: boolean;
  disabled?: boolean;
  onToggle: (armed: boolean) => void;
};

const label = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Arms Terastallization for the next move choice (once per battle). */
export function TeraToggle({ available, teraType, armed, disabled = false, onToggle }: TeraToggleProps) {
  if (!available || !teraType) return null;
  return (
    <button
      type="button"
      aria-pressed={armed}
      disabled={disabled}
      onClick={() => onToggle(!armed)}
      data-testid="tera-toggle"
      className={`mb-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-not-allowed disabled:opacity-50 ${
        armed
          ? 'border-fuchsia-500 bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300'
          : 'border-border bg-surface text-text hover:border-fuchsia-500/60'
      }`}
    >
      <span aria-hidden="true">💎</span>
      {armed ? `Terastallizing into ${label(teraType)}. Pick a move` : `Terastallize (${label(teraType)})`}
    </button>
  );
}
