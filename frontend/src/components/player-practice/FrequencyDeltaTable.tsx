import { PracticeAction, PracticeScenarioUI } from './types';

const ACTION_LABELS: Record<PracticeAction, string> = {
  CHECK: 'CHECK',
  BET_SMALL: 'BET_SMALL',
  BET_BIG: 'BET_BIG',
  FOLD: 'FOLD',
  CALL: 'CALL',
  RAISE: 'RAISE',
};

export function FrequencyDeltaTable({ scenario }: { scenario: Pick<PracticeScenarioUI, 'availableActions' | 'gto' | 'exploit'> }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-800 bg-black/30">
      <table className="w-full text-left">
        <thead className="border-b border-gray-800 bg-[#181b22] text-[10px] uppercase tracking-[0.22em] text-gray-500">
          <tr>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3 text-sky-300">GTO</th>
            <th className="px-4 py-3 text-amber-300">Exploit</th>
            <th className="px-4 py-3">Delta</th>
          </tr>
        </thead>
        <tbody>
          {scenario.availableActions.map((action) => {
            const delta = scenario.exploit.deltas[action];
            return (
              <tr key={action} className="border-b border-gray-900 last:border-b-0">
                <td className="px-4 py-3 font-mono text-xs font-bold text-white">{ACTION_LABELS[action]}</td>
                <td className="px-4 py-3 font-mono text-sm font-bold tabular-nums text-sky-300">{scenario.gto.frequencies[action]}%</td>
                <td className="px-4 py-3 font-mono text-sm font-bold tabular-nums text-amber-300">{scenario.exploit.frequencies[action]}%</td>
                <td className={[
                  'px-4 py-3 font-mono text-sm font-bold tabular-nums',
                  delta >= 0 ? 'text-emerald-300' : 'text-red-300',
                ].join(' ')}>
                  {delta >= 0 ? '+' : ''}{delta}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

