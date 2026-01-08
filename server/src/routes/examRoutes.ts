import { Router } from 'express';
import { createExam, getExamById, submitExam, getExamResults, addQuestionsToExam, getSebConfig, submitOpticalExam } from '../controllers/examController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

router.post('/', authenticateToken, authorizeRole(['INSTRUCTOR', 'ADMIN']), createExam);
router.get('/:id', authenticateToken, getExamById);
router.get('/:id/seb-config', authenticateToken, getSebConfig); // SEB config download
router.get('/:id/results', authenticateToken, authorizeRole(['INSTRUCTOR', 'ADMIN']), getExamResults);
router.post('/:id/add-questions', authenticateToken, authorizeRole(['INSTRUCTOR', 'ADMIN']), addQuestionsToExam);
router.post('/submit', authenticateToken, submitExam);
router.post('/submit-optical', authenticateToken, authorizeRole(['INSTRUCTOR', 'ADMIN']), submitOpticalExam);

export default router;
