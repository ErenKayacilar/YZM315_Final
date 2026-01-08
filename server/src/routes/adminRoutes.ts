import { Router } from 'express';
import { getStats, getAllUsers, getAllCourses, deleteUser, deleteCourse, getPendingInstructors, approveInstructor, rejectInstructor } from '../controllers/adminController';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// All routes require ADMIN role
router.use(authenticateToken, authorizeRole(['ADMIN']));

// Stats
router.get('/stats', getStats);

// Approvals
router.get('/approvals/pending', getPendingInstructors);
router.post('/approvals/:id/approve', approveInstructor);
router.delete('/approvals/:id/reject', rejectInstructor);

// Users
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

// Courses
router.get('/courses', getAllCourses);
router.delete('/courses/:id', deleteCourse);

export default router;
