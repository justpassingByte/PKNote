export type PracticeAction =
  | 'CHECK'
  | 'BET_SMALL'
  | 'BET_BIG'
  | 'FOLD'
  | 'CALL'
  | 'RAISE';

export type PracticeFocusSource = 'strategy' | 'leak' | 'pattern';

export type PracticeStreet = 'flop' | 'turn' | 'river' | null;
export type PracticePositionFamily = 'BTN_vs_BB' | 'SB_vs_BB' | 'CO_vs_BTN';
export type PracticeHeroPosition = 'ip' | 'oop' | null;
export type PracticeActionFamily = 'root' | 'facing_cbet' | 'facing_bet' | null;

export interface PracticeFocus {
  id: string;
  playerId: string;
  sourceType: PracticeFocusSource;
  label: string;
  description: string;
  priority: number;
  confidence: number;
  nodeText: string | null;
  evidence: string[];
  parsedTarget: {
    street: PracticeStreet;
    positionFamilies: PracticePositionFamily[];
    heroPosition: PracticeHeroPosition;
    actionFamily: PracticeActionFamily;
    boardBuckets: string[];
  };
  exploitPlan: {
    baselineAction: PracticeAction | null;
    increase: Array<{ action: PracticeAction; deltaPct: number }>;
    decrease: Array<{ action: PracticeAction; deltaPct: number }>;
    rationale: string;
  };
}

export interface PracticeScenario {
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

export interface PracticeEvaluation {
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

export type PracticeScenarioSeed = {
  playerId: string;
  focusId: string;
  spotId: string;
  handId: string;
};

export const PRACTICE_ACTION_ORDER: PracticeAction[] = [
  'CHECK',
  'BET_SMALL',
  'BET_BIG',
  'FOLD',
  'CALL',
  'RAISE',
];

export function createEmptyFrequencyMap(): Record<PracticeAction, number> {
  return {
    CHECK: 0,
    BET_SMALL: 0,
    BET_BIG: 0,
    FOLD: 0,
    CALL: 0,
    RAISE: 0,
  };
}

export function createScenarioId(seed: PracticeScenarioSeed): string {
  return [seed.playerId, seed.focusId, seed.spotId, seed.handId].join('::');
}

export function parseScenarioId(scenarioId: string): PracticeScenarioSeed | null {
  const [playerId, focusId, spotId, handId] = scenarioId.split('::');
  if (!playerId || !focusId || !spotId || !handId) {
    return null;
  }

  return { playerId, focusId, spotId, handId };
}

