import { Database, MapPinned } from 'lucide-react';
import { PracticeScenarioUI } from './types';

function boardCards(board: string) {
  return board.split(',').map((card) => card.trim()).filter(Boolean);
}

export function PracticeScenarioStage({ scenario }: { scenario: PracticeScenarioUI }) {
  return (
    <div className="rounded-[24px] border border-gray-800 bg-[linear-gradient(135deg,rgba(245,158,11,0.10),rgba(17,19,24,0.92)_22%,rgba(17,19,24,0.96)_100%)] p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">
          Matched Focus
        </span>
        <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-sky-300">
          <Database className="mr-1 inline h-3 w-3" />
          From GTO Library
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">Matched Spot</p>
          <h3 className="mt-2 text-xl font-black tracking-tight text-white">{scenario.focus.label}</h3>
          <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-gray-400">{scenario.focus.description}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {boardCards(scenario.spot.board).map((card) => (
              <div
                key={card}
                className="rounded-xl border border-gray-700 bg-black/50 px-3 py-3 text-center font-mono text-base font-black tracking-tight text-white shadow-inner"
              >
                {card}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-2xl border border-gray-800 bg-black/30 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Hero Combo</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="font-mono text-2xl font-black tracking-tight text-amber-300">{scenario.hand.combo}</span>
              <span className="rounded-full border border-gray-700 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-300">
                {scenario.spot.heroPosition}
              </span>
            </div>
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-gray-500">{scenario.hand.handClass}</p>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-black/30 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Node Context</p>
            <div className="mt-3 space-y-2 text-sm text-gray-300">
              <p className="flex items-center gap-2"><MapPinned className="h-4 w-4 text-amber-400" />{scenario.spot.position}</p>
              <p>{scenario.spot.street.toUpperCase()} · {scenario.spot.boardBucket}</p>
              <p>{scenario.spot.actionLine || 'ROOT'}</p>
              <p>Pot {scenario.spot.pot} · Stack {scenario.spot.effStack}bb</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

