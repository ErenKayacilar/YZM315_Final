import { Router } from 'express';
import {
    createCourse,
    getCourses,
    getCourseById,
    addModule,
    addLesson,
    updateModule,
    deleteModule,
    deleteLesson,
    getInstructorCourses,
    enrollCourse,
    getCourseEnrollments,
    updateEnrollmentStatus,
    getStudentEnrollments,
    gradeStudent
} from '../controllers/courseController';
import { authenticateToken, authorizeRole, optionalAuthenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Herkes dersleri görebilir (veya sadece giriş yapmışlar)
router.get('/', optionalAuthenticateToken, getCourses);
router.get('/my-courses', authenticateToken, authorizeRole(['INSTRUCTOR', 'ADMIN']), getInstructorCourses);
router.get('/my-enrollments', authenticateToken, getStudentEnrollments);
router.get('/:id', authenticateToken, getCourseById);
router.post('/:id/enroll', authenticateToken, authorizeRole(['STUDENT']), enrollCourse);

// Sadece eğitmenler ders oluşturabilir ve içerik ekleyebilir
router.post('/', authenticateToken, authorizeRole(['INSTRUCTOR', 'ADMIN']), createCourse);
router.post('/:id/modules', authenticateToken, authorizeRole(['INSTRUCTOR', 'ADMIN']), addModule);
router.post('/modules/:moduleId/lessons', authenticateToken, authorizeRole(['INSTRUCTOR', 'ADMIN']), addLesson);

// Modül ve İçerik Yönetimi
router.put('/modules/:moduleId', authenticateToken, authorizeRole(['INSTRUCTOR', 'ADMIN']), updateModule);
router.delete('/modules/:moduleId', authenticateToken, authorizeRole(['INSTRUCTOR', 'ADMIN']), deleteModule);
router.delete('/lessons/:lessonId', authenticateToken, authorizeRole(['INSTRUCTOR', 'ADMIN']), deleteLesson);

// Enrollment Management (Instructor)
router.get('/:id/enrollments', authenticateToken, authorizeRole(['INSTRUCTOR', 'ADMIN']), getCourseEnrollments);
router.patch('/:id/enrollments/:studentId', authenticateToken, authorizeRole(['INSTRUCTOR', 'ADMIN']), updateEnrollmentStatus);

// Grading (Manual Score Entry)
router.put('/:id/grade', authenticateToken, authorizeRole(['INSTRUCTOR', 'ADMIN']), gradeStudent);

// Student Notes
import { getCourseNotes, createCourseNote } from '../controllers/noteController';
router.get('/:id/notes', authenticateToken, getCourseNotes);
router.post('/:id/notes', authenticateToken, createCourseNote);

export default router;

