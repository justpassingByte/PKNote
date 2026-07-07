export type PracticeAction = 'CHECK' | 'BET_SMALL' | 'BET_BIG' | 'FOLD' | 'CALL' | 'RAISE';

export interface PracticeFocusUI {
  id: string;
  label: string;
  description: string;
  nodeText: string | null;
  priority: number;
  confidence: number;
  evidence: string[];
}

export interface PracticeScenarioUI {
  scenarioId: string;
  playerId: string;
  focusId: string;
  focus: {
    label: string;
    description: string;
    nodeText: string | null;
    evidence: string[];
  };
  spot: {
    gtoSpotId: string;
    position: string;
    boardBucket: string;
    street: string;
    actionLine: string | null;
    turnType: string | null;
    riverType: string | null;
    board: string;
    pot: number;
    effStack: number;
    heroPosition: 'ip' | 'oop';
  };
  hand: {
    gtoHandId: string;
    combo: string;
    handClass: string;
  };
  availableActions: PracticeAction[];
  gto: {
    frequencies: Record<PracticeAction, number>;
  };
  exploit: {
    frequencies: Record<PracticeAction, number>;
    deltas: Record<PracticeAction, number>;
    recommendedAction: PracticeAction | null;
    rationale: string;
    confidence: number;
  };
}

export interface PracticeEvaluationUI {
  selectedAction: PracticeAction;
  gto: {
    selectedFreq: number;
    bestAction: PracticeAction | null;
    frequencies: Record<PracticeAction, number>;
    verdict: 'best' | 'acceptable' | 'low_freq' | 'punt';
  };
  exploit: {
    selectedFreq: number;
    bestAction: PracticeAction | null;
    frequencies: Record<PracticeAction, number>;
    deltas: Record<PracticeAction, number>;
    verdict: 'best_exploit' | 'good' | 'too_passive' | 'too_aggressive' | 'missed_value';
  };
  summary: {
    gtoText: string;
    exploitText: string;
    deltaText: string;
  };
  evidence: string[];
}

