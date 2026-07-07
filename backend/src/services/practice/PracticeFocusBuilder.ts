import { ExploitDeltaResolver } from './ExploitDeltaResolver';
import { PracticeNodeParser } from './PracticeNodeParser';
import { PracticeFocus } from './PracticeTypes';

type PlayerLike = {
  id: string;
  ai_profile?: any;
  patterns?: Array<{ pattern: string; confidence: number; occurrences: number }>;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function titleize(input: string) {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => {
      if (/^(BTN|BB|SB|CO|IP|OOP|CBET|A-high|K-high|Q-high)$/i.test(part)) {
        return part.toUpperCase().replace('A-HIGH', 'A-high').replace('K-HIGH', 'K-high').replace('Q-HIGH', 'Q-high');
      }
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(' ');
}

function buildLabel(nodeText: string) {
  const compact = nodeText.replace(/[|]/g, ' ').replace(/\s+/g, ' ').trim();
  return titleize(compact).slice(0, 72);
}

function buildDescription(nodeText: string, action: unknown) {
  const actionText = typeof action === 'string' ? action.toUpperCase() : 'ADJUST';
  return `Train ${actionText.toLowerCase()} decisions in ${nodeText.replace(/\s+/g, ' ').trim()}.`;
}

function isUsableFocus(focus: PracticeFocus) {
  return Boolean(
    focus.parsedTarget.street &&
    focus.parsedTarget.positionFamilies.length > 0 &&
    focus.parsedTarget.actionFamily &&
    focus.exploitPlan.baselineAction
  );
}

export class PracticeFocusBuilder {
  static build(player: PlayerLike): PracticeFocus[] {
    const strategyList = Array.isArray(player.ai_profile?.strategy) ? player.ai_profile.strategy : [];
    const profileConfidence = typeof player.ai_profile?.confidence === 'number' ? player.ai_profile.confidence : 0.65;
    const leaks = Array.isArray(player.ai_profile?.leaks) ? player.ai_profile.leaks.filter((item: unknown) => typeof item === 'string') : [];

    return strategyList
      .map((item: any, index: number) => {
        const nodeText = typeof item?.node === 'string' ? item.node : null;
        if (!nodeText) {
          return null;
        }

        const parsedTarget = PracticeNodeParser.parse(nodeText);
        const delta = ExploitDeltaResolver.resolve({ nodeText, evidence: ['Strategy node from ai_profile', ...leaks.slice(0, 2)] }, item);
        const confidence = clamp(typeof item?.confidence === 'number' ? item.confidence : profileConfidence, 0, 1);
        const priority = clamp(
          50 +
          (parsedTarget.street ? 10 : 0) +
          (parsedTarget.actionFamily ? 10 : 0) +
          (parsedTarget.boardBuckets.length > 0 ? 10 : 0) +
          Math.round(confidence * 20),
          0,
          100
        );

        const focus: PracticeFocus = {
          id: `focus_strategy_${index}`,
          playerId: player.id,
          sourceType: 'strategy',
          label: buildLabel(nodeText),
          description: buildDescription(nodeText, item?.action),
          priority,
          confidence,
          nodeText,
          evidence: ['Strategy node from ai_profile', ...leaks.slice(0, 2)],
          parsedTarget,
          exploitPlan: {
            baselineAction: delta.baselineAction,
            increase: delta.increase,
            decrease: delta.decrease,
            rationale: delta.rationale,
          },
        };

        return isUsableFocus(focus) ? focus : null;
      })
      .filter((focus): focus is PracticeFocus => Boolean(focus))
      .sort((a, b) => b.priority - a.priority || b.confidence - a.confidence);
  }
}

