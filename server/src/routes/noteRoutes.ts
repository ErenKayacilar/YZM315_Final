import { Router } from 'express';
import { deleteCourseNote } from '../controllers/noteController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.delete('/:id', authenticateToken, deleteCourseNote);

export default router;
