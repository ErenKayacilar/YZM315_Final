import { Router } from 'express';
import { createQuestionInBank, getQuestionsByCourse, deleteQuestion, importQuestionsFromExcel } from '../controllers/questionController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// /api/questions

// Get questions for a specific course (Bank) - Note: courseId is usually easier to pass via query or params here, 
// but sticking to a convention. Ideally these might be under /courses/:id/questions but independent routes work too if we pass courseId in body/query or route.
// Let's assume the frontend calls /api/courses/:courseId/questions normally, but here we are defining standalone question routes.
// However, looking at the plan: GET /api/courses/:courseId/questions. 
// So this logic should probably be in courseRoutes or we create a route that accepts courseId.

// Acturally, let's put these under /api/courses/:id/questions in courseRoutes or simpler here:
// Let's define: GET /api/questions/course/:courseId
router.get('/course/:courseId', authenticateToken, getQuestionsByCourse);
router.post('/course/:courseId', authenticateToken, authorizeRole(['INSTRUCTOR', 'ADMIN']), createQuestionInBank);
router.post('/course/:courseId/import', authenticateToken, authorizeRole(['INSTRUCTOR', 'ADMIN']), importQuestionsFromExcel);
router.delete('/:id', authenticateToken, authorizeRole(['INSTRUCTOR', 'ADMIN']), deleteQuestion);

export default router;

