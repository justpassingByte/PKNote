import { PracticeAction, PracticeEvaluation, PracticeScenario } from './PracticeTypes';

const PASSIVE_SCORE: Record<PracticeAction, number> = {
  CHECK: 0,
  FOLD: 0,
  CALL: 1,
  BET_SMALL: 2,
  BET_BIG: 3,
  RAISE: 4,
};

function bestAction(frequencies: Record<PracticeAction, number>, availableActions: PracticeAction[]) {
  return availableActions.reduce<PracticeAction | null>((best, action) => {
    if (!best || frequencies[action] > frequencies[best]) {
      return action;
    }
    return best;
  }, null);
}

function deltaText(deltas: Record<PracticeAction, number>, availableActions: PracticeAction[]) {
  return availableActions
    .map((action) => `${action} ${deltas[action] >= 0 ? '+' : ''}${deltas[action]}%`)
    .join(', ')
    .concat(' versus baseline.');
}

export class PracticeEvaluationService {
  static evaluate(scenario: PracticeScenario, selectedAction: PracticeAction): PracticeEvaluation {
    const gtoBest = bestAction(scenario.gto.frequencies, scenario.availableActions);
    const exploitBest = bestAction(scenario.exploit.frequencies, scenario.availableActions);
    const gtoSelectedFreq = scenario.gto.frequencies[selectedAction] || 0;
    const exploitSelectedFreq = scenario.exploit.frequencies[selectedAction] || 0;

    const gtoVerdict: PracticeEvaluation['gto']['verdict'] =
      selectedAction === gtoBest ? 'best' : gtoSelectedFreq >= 20 ? 'acceptable' : gtoSelectedFreq >= 5 ? 'low_freq' : 'punt';

    let exploitVerdict: PracticeEvaluation['exploit']['verdict'];
    if (selectedAction === exploitBest) {
      exploitVerdict = 'best_exploit';
    } else if (exploitBest && Math.abs(exploitSelectedFreq - scenario.exploit.frequencies[exploitBest]) <= 10) {
      exploitVerdict = 'good';
    } else if (exploitBest && PASSIVE_SCORE[selectedAction] < PASSIVE_SCORE[exploitBest]) {
      exploitVerdict = PASSIVE_SCORE[exploitBest] >= 2 ? 'missed_value' : 'too_passive';
    } else {
      exploitVerdict = 'too_aggressive';
    }

    return {
      selectedAction,
      gto: {
        selectedFreq: gtoSelectedFreq,
        bestAction: gtoBest,
        frequencies: scenario.gto.frequencies,
        verdict: gtoVerdict,
      },
      exploit: {
        selectedFreq: exploitSelectedFreq,
        bestAction: exploitBest,
        frequencies: scenario.exploit.frequencies,
        deltas: scenario.exploit.deltas,
        verdict: exploitVerdict,
      },
      summary: {
        gtoText: gtoBest
          ? `${gtoBest} is the highest-frequency GTO action in this spot.`
          : 'No GTO baseline is available for this spot.',
        exploitText: scenario.exploit.recommendedAction
          ? `Versus this opponent, ${scenario.exploit.recommendedAction} should increase because ${scenario.exploit.rationale.toLowerCase()}`
          : 'No exploit adjustment is available for this spot.',
        deltaText: deltaText(scenario.exploit.deltas, scenario.availableActions),
      },
      evidence: scenario.focus.evidence,
    };
  }
}

