import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mark a lesson as completed
export const markLessonComplete = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const { lessonId } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (!lessonId) {
            res.status(400).json({ error: 'lessonId is required' });
            return;
        }

        // Upsert - create or update progress
        const progress = await prisma.userProgress.upsert({
            where: {
                userId_lessonId: {
                    userId: Number(userId),
                    lessonId: Number(lessonId)
                }
            },
            update: {
                isCompleted: true,
                completedAt: new Date()
            },
            create: {
                userId: Number(userId),
                lessonId: Number(lessonId),
                isCompleted: true,
                completedAt: new Date()
            }
        });

        res.json({ success: true, progress });
    } catch (error) {
        console.error('Error marking lesson complete:', error);
        res.status(500).json({ error: 'Failed to mark lesson as complete' });
    }
};

// Get user progress for a course
export const getCourseProgress = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const { courseId } = req.params;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Get all lessons in the course
        const course = await prisma.course.findUnique({
            where: { id: Number(courseId) },
            include: {
                modules: {
                    include: {
                        lessons: true
                    }
                },
                exams: true
            }
        });

        if (!course) {
            res.status(404).json({ error: 'Course not found' });
            return;
        }

        // Count total lessons
        const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
        const totalExams = course.exams.length;
        const totalItems = totalLessons + totalExams;

        if (totalItems === 0) {
            res.json({ progress: 0, completedLessons: 0, totalLessons: 0, completedExams: 0, totalExams: 0 });
            return;
        }

        // Get completed lessons
        const lessonIds = course.modules.flatMap(m => m.lessons.map(l => l.id));
        const completedLessons = await prisma.userProgress.count({
            where: {
                userId: Number(userId),
                lessonId: { in: lessonIds },
                isCompleted: true
            }
        });

        // Get completed exams
        const examIds = course.exams.map(e => e.id);
        const completedExams = await prisma.examResult.count({
            where: {
                userId: Number(userId),
                examId: { in: examIds }
            }
        });

        const completedItems = completedLessons + completedExams;
        const progress = Math.round((completedItems / totalItems) * 100);

        res.json({
            progress,
            completedLessons,
            totalLessons,
            completedExams,
            totalExams
        });
    } catch (error) {
        console.error('Error getting course progress:', error);
        res.status(500).json({ error: 'Failed to get course progress' });
    }
};

// Get user's progress for a specific lesson
export const getLessonProgress = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id;
        const { lessonId } = req.params;

        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const progress = await prisma.userProgress.findUnique({
            where: {
                userId_lessonId: {
                    userId: Number(userId),
                    lessonId: Number(lessonId)
                }
            }
        });

        res.json({ isCompleted: progress?.isCompleted || false });
    } catch (error) {
        console.error('Error getting lesson progress:', error);
        res.status(500).json({ error: 'Failed to get lesson progress' });
    }
};
