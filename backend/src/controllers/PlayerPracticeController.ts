import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { PracticeEvaluationService } from '../services/practice/PracticeEvaluationService';
import { parseScenarioId, PracticeAction } from '../services/practice/PracticeTypes';
import { PracticeScenarioService } from '../services/practice/PracticeScenarioService';

export class PlayerPracticeController {
  static async getFocuses(req: Request, res: Response) {
    const userId = (req as any).user.id;
    const playerId = req.params.playerId as string;

    const player = await prisma.player.findFirst({ where: { id: playerId, user_id: userId } });
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    const focuses = await PracticeScenarioService.getFocusesForPlayer(playerId);
    return res.json({
      success: true,
      data: (focuses || []).map((focus) => ({
        id: focus.id,
        label: focus.label,
        description: focus.description,
        nodeText: focus.nodeText,
        priority: focus.priority,
        confidence: focus.confidence,
        evidence: focus.evidence,
      })),
    });
  }

  static async getNextScenario(req: Request, res: Response) {
    const userId = (req as any).user.id;
    const playerId = req.params.playerId as string;
    const focusId = req.query.focusId as string | undefined;

    const player = await prisma.player.findFirst({ where: { id: playerId, user_id: userId } });
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    const scenario = await PracticeScenarioService.getNextScenario(playerId, focusId);
    if (!scenario) {
      const focuses = await PracticeScenarioService.getFocusesForPlayer(playerId);
      if (focusId && focuses?.some((focus) => focus.id === focusId)) {
        return res.status(404).json({ success: false, error: 'No current GTO spot matches this exploit focus.' });
      }
      return res.status(422).json({ success: false, error: 'Invalid or unavailable practice focus.' });
    }

    return res.json({ success: true, data: scenario });
  }

  static async evaluateScenario(req: Request, res: Response) {
    const userId = (req as any).user.id;
    const playerId = req.params.playerId as string;
    const { scenarioId, selectedAction } = req.body as { scenarioId?: string; selectedAction?: PracticeAction };

    const player = await prisma.player.findFirst({ where: { id: playerId, user_id: userId } });
    if (!player) {
      return res.status(404).json({ success: false, error: 'Player not found' });
    }

    if (!scenarioId || !selectedAction) {
      return res.status(400).json({ success: false, error: 'scenarioId and selectedAction are required.' });
    }

    const parsed = parseScenarioId(scenarioId);
    if (!parsed || parsed.playerId !== playerId) {
      return res.status(422).json({ success: false, error: 'Invalid scenarioId.' });
    }

    const scenario = await PracticeScenarioService.rebuildScenario(parsed.playerId, parsed.focusId, parsed.spotId, parsed.handId);
    if (!scenario) {
      return res.status(404).json({ success: false, error: 'Scenario not found.' });
    }

    const evaluation = PracticeEvaluationService.evaluate(scenario, selectedAction);
    return res.json({ success: true, data: evaluation });
  }
}

