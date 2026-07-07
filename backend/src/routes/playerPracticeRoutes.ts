import { Router } from 'express';
import { PlayerPracticeController } from '../controllers/PlayerPracticeController';
import { asyncErrorWrapper } from '../utils/asyncErrorWrapper';

const router = Router();

router.get(
  '/:playerId/practice/focuses',
  asyncErrorWrapper((req, res) => PlayerPracticeController.getFocuses(req, res))
);

router.get(
  '/:playerId/practice/next',
  asyncErrorWrapper((req, res) => PlayerPracticeController.getNextScenario(req, res))
);

router.post(
  '/:playerId/practice/evaluate',
  asyncErrorWrapper((req, res) => PlayerPracticeController.evaluateScenario(req, res))
);

export const playerPracticeRoutes = router;

