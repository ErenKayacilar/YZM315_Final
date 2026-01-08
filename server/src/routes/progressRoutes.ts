import { Router } from 'express';
import { markLessonComplete, getCourseProgress, getLessonProgress } from '../controllers/progressController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Mark a lesson as complete
router.post('/complete', authenticateToken, markLessonComplete);

// Get progress for a course
router.get('/course/:courseId', authenticateToken, getCourseProgress);

// Get progress for a specific lesson
router.get('/lesson/:lessonId', authenticateToken, getLessonProgress);

export default router;
