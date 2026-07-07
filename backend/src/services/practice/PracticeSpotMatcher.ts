import { prisma } from '../../lib/prisma';
import { PracticeFocus } from './PracticeTypes';

export class PracticeSpotMatcher {
  static async findSpots(focus: PracticeFocus) {
    const where: any = {
      street: focus.parsedTarget.street || undefined,
      position: { in: focus.parsedTarget.positionFamilies },
    };

    if (focus.parsedTarget.boardBuckets.length > 0) {
      where.board_bucket = { in: focus.parsedTarget.boardBuckets };
    }

    if (focus.parsedTarget.actionFamily === 'root') {
      where.action_line = null;
    } else if (focus.parsedTarget.actionFamily === 'facing_cbet') {
      where.action_line = { contains: 'facing_cbet' };
    } else if (focus.parsedTarget.actionFamily === 'facing_bet') {
      where.action_line = { not: null };
    }

    const spots = await prisma.gtoSpot.findMany({ where, take: 20, orderBy: { id: 'asc' } });

    return spots.sort((a, b) => this.scoreSpot(b, focus) - this.scoreSpot(a, focus));
  }

  private static scoreSpot(spot: any, focus: PracticeFocus) {
    let score = 0;
    if (spot.street === focus.parsedTarget.street) score += 4;
    if (focus.parsedTarget.positionFamilies.includes(spot.position)) score += 4;
    if (focus.parsedTarget.boardBuckets.includes(spot.board_bucket)) score += 3;

    if (focus.parsedTarget.actionFamily === 'root' && !spot.action_line) score += 4;
    if (focus.parsedTarget.actionFamily === 'facing_cbet' && String(spot.action_line || '').includes('facing_cbet')) score += 4;
    if (focus.parsedTarget.actionFamily === 'facing_bet' && spot.action_line) score += 4;

    return score;
  }
}

