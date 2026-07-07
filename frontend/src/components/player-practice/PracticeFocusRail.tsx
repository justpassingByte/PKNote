import { Target } from 'lucide-react';
import { PracticeFocusUI } from './types';

export function PracticeFocusRail({
  focuses,
  selectedFocusId,
  onSelect,
}: {
  focuses: PracticeFocusUI[];
  selectedFocusId: string | null;
  onSelect: (focusId: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">
        <Target className="h-3.5 w-3.5 text-amber-400" />
        <span>Training Focus</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide lg:grid lg:grid-cols-2 lg:overflow-visible">
        {focuses.map((focus) => {
          const active = selectedFocusId === focus.id;
          return (
            <button
              key={focus.id}
              type="button"
              onClick={() => onSelect(focus.id)}
              className={[
                'min-w-[280px] rounded-2xl border px-4 py-4 text-left transition-all duration-150 lg:min-w-0',
                active
                  ? 'border-amber-400/60 bg-amber-500/10 shadow-[0_0_0_1px_rgba(251,191,36,0.08)]'
                  : 'border-gray-800 bg-[#161920] hover:border-gray-700 hover:bg-[#1a1e26]',
              ].join(' ')}
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <span className="text-sm font-bold leading-snug text-white">{focus.label}</span>
                <span className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 font-mono text-[10px] font-bold text-emerald-300">
                  {Math.round(focus.confidence * 100)}%
                </span>
              </div>
              <p className="text-xs leading-relaxed text-gray-400">{focus.description}</p>
              {focus.nodeText ? (
                <p className="mt-3 line-clamp-1 text-[11px] font-medium uppercase tracking-[0.16em] text-amber-300/80">
                  {focus.nodeText}
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

