import { PracticeEvaluationUI, PracticeScenarioUI } from './types';
import { FrequencyDeltaTable } from './FrequencyDeltaTable';
import { PracticeEvidenceList } from './PracticeEvidenceList';

const GTO_VERDICTS: Record<PracticeEvaluationUI['gto']['verdict'], string> = {
  best: 'Best GTO',
  acceptable: 'Acceptable Mix',
  low_freq: 'Low-Frequency GTO',
  punt: 'Punt',
};

const EXPLOIT_VERDICTS: Record<PracticeEvaluationUI['exploit']['verdict'], string> = {
  best_exploit: 'Best Exploit',
  good: 'Good Exploit',
  too_passive: 'Too Passive',
  too_aggressive: 'Too Aggressive',
  missed_value: 'Missed Value',
};

export function PracticeResultConsole({
  scenario,
  evaluation,
}: {
  scenario: PracticeScenarioUI;
  evaluation: PracticeEvaluationUI;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-300">GTO Baseline</p>
            <p className="mt-3 text-lg font-black tracking-tight text-white">{GTO_VERDICTS[evaluation.gto.verdict]}</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-300">{evaluation.summary.gtoText}</p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">Exploit Adjustment</p>
            <p className="mt-3 text-lg font-black tracking-tight text-white">{EXPLOIT_VERDICTS[evaluation.exploit.verdict]}</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-300">{evaluation.summary.exploitText}</p>
          </div>
        </div>
        <FrequencyDeltaTable scenario={scenario} />
        <div className="rounded-2xl border border-gray-800 bg-black/30 p-4 text-sm leading-relaxed text-gray-300">
          {evaluation.summary.deltaText}
        </div>
      </div>
      <PracticeEvidenceList evidence={evaluation.evidence} />
    </div>
  );
}

