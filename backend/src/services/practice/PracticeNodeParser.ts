import { PracticeFocus } from './PracticeTypes';

const BOARD_BUCKET_MAP: Array<{ patterns: RegExp[]; buckets: string[] }> = [
  { patterns: [/A-?high/i], buckets: ['A_dry', 'ace_wet', 'two_tone_A'] },
  { patterns: [/K-?high/i], buckets: ['K_dry', 'two_tone_K'] },
  { patterns: [/Q-?high/i], buckets: ['Q_dry'] },
  { patterns: [/wet/i], buckets: ['ace_wet', 'broadway_wet', 'mid_wet', 'connected_high', 'connected_mid', 'connected_low'] },
  { patterns: [/dry/i], buckets: ['A_dry', 'K_dry', 'Q_dry', 'low_dry'] },
  { patterns: [/paired/i], buckets: ['paired_high', 'paired_mid', 'paired_low'] },
  { patterns: [/monotone/i], buckets: ['monotone_A', 'monotone_low'] },
  { patterns: [/(?<!A-|K-|Q-)low/i], buckets: ['low_dry', 'connected_low', 'two_tone_low'] },
];

export class PracticeNodeParser {
  static parse(nodeText: string): PracticeFocus['parsedTarget'] {
    const upper = nodeText.toUpperCase();
    const street = upper.includes('FLOP') ? 'flop' : upper.includes('TURN') ? 'turn' : upper.includes('RIVER') ? 'river' : null;

    const positionFamilies: PracticeFocus['parsedTarget']['positionFamilies'] = [];
    if (upper.includes('BTN') || upper.includes('BUTTON')) positionFamilies.push('BTN_vs_BB');
    if (upper.includes('SB') && upper.includes('BB')) positionFamilies.push('SB_vs_BB');
    if (upper.includes('CO') || upper.includes('CUTOFF')) positionFamilies.push('CO_vs_BTN');

    let heroPosition: PracticeFocus['parsedTarget']['heroPosition'] = null;
    if (/\bIP\b/i.test(nodeText) || /late-position attack/i.test(nodeText)) heroPosition = 'ip';
    if (/\bOOP\b/i.test(nodeText) || /defend/i.test(nodeText) || /\bBB\b/i.test(nodeText)) heroPosition = 'oop';

    let actionFamily: PracticeFocus['parsedTarget']['actionFamily'] = 'root';
    if (/vs\s*cbet|vs\s*c-bet|cbet/i.test(nodeText)) actionFamily = 'facing_cbet';
    else if (/facing\s+bet/i.test(nodeText)) actionFamily = 'facing_bet';

    const boardBuckets = Array.from(
      new Set(
        BOARD_BUCKET_MAP.flatMap((entry) =>
          entry.patterns.some((pattern) => pattern.test(nodeText)) ? entry.buckets : []
        )
      )
    );

    return {
      street,
      positionFamilies,
      heroPosition,
      actionFamily,
      boardBuckets,
    };
  }
}

