import { prisma } from '../../lib/prisma';
import {
  createEmptyFrequencyMap,
  createScenarioId,
  PRACTICE_ACTION_ORDER,
  PracticeAction,
  PracticeFocus,
  PracticeScenario,
} from './PracticeTypes';
import { PracticeFocusBuilder } from './PracticeFocusBuilder';
import { PracticeSpotMatcher } from './PracticeSpotMatcher';

const PASSIVE_ACTIONS: PracticeAction[] = ['CHECK', 'CALL', 'FOLD'];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function roundPct(value: number) {
  return Math.round(value);
}

function normalizeActions(map: Record<PracticeAction, number>, activeActions: PracticeAction[]) {
  const total = activeActions.reduce((sum, action) => sum + map[action], 0);
  if (total <= 0) {
    return map;
  }

  const normalized = { ...map };
  let running = 0;
  activeActions.forEach((action, index) => {
    if (index === activeActions.length - 1) {
      normalized[action] = clamp(100 - running, 0, 100);
      return;
    }

    normalized[action] = roundPct((map[action] / total) * 100);
    running += normalized[action];
  });

  return normalized;
}

function getAvailableActions(spot: any): PracticeAction[] {
  return spot.action_line ? ['FOLD', 'CALL', 'RAISE'] : ['CHECK', 'BET_SMALL', 'BET_BIG'];
}

function buildGtoFrequencies(spot: any, hand: any): Record<PracticeAction, number> {
  const map = createEmptyFrequencyMap();

  if (spot.action_line) {
    map.FOLD = roundPct(hand.fold * 100);
    map.CALL = roundPct(hand.call * 100);
    map.RAISE = roundPct(hand.raise * 100);
  } else {
    map.CHECK = roundPct(hand.check * 100);
    map.BET_SMALL = roundPct(hand.bet_small * 100);
    map.BET_BIG = roundPct(hand.bet_big * 100);
  }

  return map;
}

function applyExploitPlan(
  gto: Record<PracticeAction, number>,
  focus: PracticeFocus,
  activeActions: PracticeAction[]
) {
  const exploit = { ...gto };

  focus.exploitPlan.increase.forEach(({ action, deltaPct }) => {
    exploit[action] = clamp(exploit[action] + deltaPct, 0, 100);
  });
  focus.exploitPlan.decrease.forEach(({ action, deltaPct }) => {
    exploit[action] = clamp(exploit[action] - deltaPct, 0, 100);
  });

  const normalized = normalizeActions(exploit, activeActions);
  const deltas = createEmptyFrequencyMap();
  PRACTICE_ACTION_ORDER.forEach((action) => {
    deltas[action] = normalized[action] - gto[action];
  });

  return { frequencies: normalized, deltas };
}

function getBestAction(frequencies: Record<PracticeAction, number>, activeActions: PracticeAction[]) {
  return activeActions.reduce<PracticeAction | null>((best, action) => {
    if (!best || frequencies[action] > frequencies[best]) {
      return action;
    }
    return best;
  }, null);
}

function preferredHandClasses(focus: PracticeFocus) {
  const action = focus.exploitPlan.baselineAction;
  if (action === 'CALL') return ['top_pair', 'second_pair', 'flush_draw', 'straight_draw'];
  if (action === 'RAISE') return ['top_pair', 'overpair', 'two_pair', 'strong_draw'];
  if (action === 'FOLD') return ['ace_high', 'underpair', 'second_pair', 'air'];
  if (action === 'CHECK') return ['top_pair', 'overpair', 'two_pair'];
  return ['top_pair', 'flush_draw', 'straight_draw', 'second_pair'];
}

function handScore(hand: any, preferred: string[], spot: any) {
  let score = 0;
  if (preferred.includes(hand.hand_class)) score += 5;
  if (spot.action_line) {
    if (hand.fold > 0 && hand.fold < 1) score += 3;
    if (hand.call > 0 && hand.call < 1) score += 3;
    if (hand.raise > 0 && hand.raise < 1) score += 3;
  } else {
    if (hand.check > 0 && hand.check < 1) score += 3;
    if (hand.bet_small > 0 && hand.bet_small < 1) score += 3;
    if (hand.bet_big > 0 && hand.bet_big < 1) score += 3;
  }
  return score;
}

export class PracticeScenarioService {
  static async getFocusesForPlayer(playerId: string) {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { patterns: true },
    });

    if (!player) {
      return null;
    }

    return PracticeFocusBuilder.build(player as any);
  }

  static async getNextScenario(playerId: string, focusId?: string): Promise<PracticeScenario | null> {
    const focuses = await this.getFocusesForPlayer(playerId);
    if (!focuses || focuses.length === 0) {
      return null;
    }

    const focus = focusId ? focuses.find((item) => item.id === focusId) : focuses[0];
    if (!focus) {
      return null;
    }

    const spots = await PracticeSpotMatcher.findSpots(focus);
    const spot = spots[0];
    if (!spot) {
      return null;
    }

    const heroPosition = focus.parsedTarget.heroPosition || (spot.action_line ? 'oop' : 'oop');
    const hands = await prisma.gtoHand.findMany({
      where: { spot_id: spot.id, player: heroPosition },
      take: 100,
    });

    const preferred = preferredHandClasses(focus);
    const hand = hands.sort((a, b) => handScore(b, preferred, spot) - handScore(a, preferred, spot))[0];
    if (!hand) {
      return null;
    }

    const availableActions = getAvailableActions(spot);
    const gtoFrequencies = buildGtoFrequencies(spot, hand);
    const exploit = applyExploitPlan(gtoFrequencies, focus, availableActions);
    const recommendedAction = getBestAction(exploit.frequencies, availableActions);

    return {
      scenarioId: createScenarioId({ playerId, focusId: focus.id, spotId: spot.id, handId: hand.id }),
      playerId,
      focusId: focus.id,
      focus: {
        label: focus.label,
        description: focus.description,
        nodeText: focus.nodeText,
        evidence: focus.evidence,
      },
      spot: {
        gtoSpotId: spot.id,
        position: spot.position,
        boardBucket: spot.board_bucket,
        street: spot.street,
        actionLine: spot.action_line,
        turnType: spot.turn_type,
        riverType: spot.river_type,
        board: spot.board,
        pot: spot.pot,
        effStack: spot.eff_stack,
        heroPosition,
      },
      hand: {
        gtoHandId: hand.id,
        combo: hand.hand,
        handClass: hand.hand_class,
      },
      availableActions,
      gto: {
        frequencies: gtoFrequencies,
      },
      exploit: {
        frequencies: exploit.frequencies,
        deltas: exploit.deltas,
        recommendedAction,
        rationale: focus.exploitPlan.rationale,
        confidence: focus.confidence,
      },
    };
  }

  static async rebuildScenario(playerId: string, focusId: string, spotId: string, handId: string) {
    const focuses = await this.getFocusesForPlayer(playerId);
    const focus = focuses?.find((item) => item.id === focusId);
    if (!focus) {
      return null;
    }

    const [spot, hand] = await Promise.all([
      prisma.gtoSpot.findUnique({ where: { id: spotId } }),
      prisma.gtoHand.findUnique({ where: { id: handId } }),
    ]);

    if (!spot || !hand) {
      return null;
    }

    const availableActions = getAvailableActions(spot);
    const gtoFrequencies = buildGtoFrequencies(spot, hand);
    const exploit = applyExploitPlan(gtoFrequencies, focus, availableActions);
    const recommendedAction = getBestAction(exploit.frequencies, availableActions);

    return {
      scenarioId: createScenarioId({ playerId, focusId: focus.id, spotId: spot.id, handId: hand.id }),
      playerId,
      focusId: focus.id,
      focus: {
        label: focus.label,
        description: focus.description,
        nodeText: focus.nodeText,
        evidence: focus.evidence,
      },
      spot: {
        gtoSpotId: spot.id,
        position: spot.position,
        boardBucket: spot.board_bucket,
        street: spot.street,
        actionLine: spot.action_line,
        turnType: spot.turn_type,
        riverType: spot.river_type,
        board: spot.board,
        pot: spot.pot,
        effStack: spot.eff_stack,
        heroPosition: hand.player as 'ip' | 'oop',
      },
      hand: {
        gtoHandId: hand.id,
        combo: hand.hand,
        handClass: hand.hand_class,
      },
      availableActions,
      gto: { frequencies: gtoFrequencies },
      exploit: {
        frequencies: exploit.frequencies,
        deltas: exploit.deltas,
        recommendedAction,
        rationale: focus.exploitPlan.rationale,
        confidence: focus.confidence,
      },
    };
  }
}

