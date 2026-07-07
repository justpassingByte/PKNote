import { PracticeAction } from './types';

const LABELS: Record<PracticeAction, string> = {
  CHECK: 'Check',
  BET_SMALL: 'Bet Small',
  BET_BIG: 'Bet Big',
  FOLD: 'Fold',
  CALL: 'Call',
  RAISE: 'Raise',
};

const COLORS: Record<PracticeAction, string> = {
  CHECK: 'border-slate-700 bg-slate-900/60 text-slate-100 hover:border-slate-500',
  BET_SMALL: 'border-amber-500/35 bg-amber-500/10 text-amber-200 hover:border-amber-400',
  BET_BIG: 'border-orange-500/35 bg-orange-500/10 text-orange-200 hover:border-orange-400',
  FOLD: 'border-red-500/35 bg-red-500/10 text-red-200 hover:border-red-400',
  CALL: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400',
  RAISE: 'border-sky-500/35 bg-sky-500/10 text-sky-200 hover:border-sky-400',
};

export function PracticeActionButtons({
  actions,
  disabled,
  onSelect,
}: {
  actions: PracticeAction[];
  disabled?: boolean;
  onSelect: (action: PracticeAction) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {actions.map((action) => (
        <button
          key={action}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(action)}
          className={[
            'rounded-2xl border px-4 py-4 text-sm font-black uppercase tracking-[0.18em] transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
            COLORS[action],
          ].join(' ')}
        >
          {LABELS[action]}
        </button>
      ))}
    </div>
  );
}

