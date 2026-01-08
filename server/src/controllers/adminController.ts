import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get system statistics
export const getStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const [totalUsers, totalCourses, totalQuestions, totalExams, totalStudents, totalInstructors] = await Promise.all([
            prisma.user.count(),
            prisma.course.count(),
            prisma.question.count(),
            prisma.exam.count(),
            prisma.user.count({ where: { role: 'STUDENT' } }),
            prisma.user.count({ where: { role: 'INSTRUCTOR' } })
        ]);

        res.json({
            totalUsers,
            totalCourses,
            totalQuestions,
            totalExams,
            totalStudents,
            totalInstructors
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'İstatistikler alınamadı' });
    }
};

// Get all users
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                _count: {
                    select: {
                        courses: true,
                        enrollments: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(users);
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ error: 'Kullanıcılar alınamadı' });
    }
};

// Get all courses
export const getAllCourses = async (req: Request, res: Response): Promise<void> => {
    try {
        const courses = await prisma.course.findMany({
            include: {
                instructor: {
                    select: { id: true, name: true, email: true }
                },
                _count: {
                    select: {
                        enrollments: true,
                        exams: true,
                        modules: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(courses);
    } catch (error) {
        console.error('Error getting courses:', error);
        res.status(500).json({ error: 'Dersler alınamadı' });
    }
};

// Delete a user
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = Number(id);

        // Prevent self-delete
        if (userId === (req as any).user?.id) {
            res.status(400).json({ error: 'Kendinizi silemezsiniz' });
            return;
        }

        // Delete related data first
        await prisma.courseNote.deleteMany({ where: { userId } });
        await prisma.examResult.deleteMany({ where: { userId } });
        await prisma.enrollment.deleteMany({ where: { userId } });
        await prisma.userProgress.deleteMany({ where: { userId } });

        // Delete user
        await prisma.user.delete({ where: { id: userId } });

        res.json({ message: 'Kullanıcı silindi' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Kullanıcı silinemedi' });
    }
};

// Delete a course
export const deleteCourse = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const courseId = Number(id);

        // Delete related data first
        await prisma.courseNote.deleteMany({ where: { courseId } });
        await prisma.enrollment.deleteMany({ where: { courseId } });

        // Delete exams and their data
        const exams = await prisma.exam.findMany({ where: { courseId } });
        for (const exam of exams) {
            await prisma.examResult.deleteMany({ where: { examId: exam.id } });
            await prisma.question.deleteMany({ where: { examId: exam.id } });
        }
        await prisma.exam.deleteMany({ where: { courseId } });

        // Delete modules and lessons
        const modules = await prisma.module.findMany({ where: { courseId } });
        for (const mod of modules) {
            await prisma.userProgress.deleteMany({ where: { lesson: { moduleId: mod.id } } });
            await prisma.lesson.deleteMany({ where: { moduleId: mod.id } });
        }
        await prisma.module.deleteMany({ where: { courseId } });

        // Delete questions from bank
        await prisma.question.deleteMany({ where: { courseId } });

        // Delete course
        await prisma.course.delete({ where: { id: courseId } });

        res.json({ message: 'Ders silindi' });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ error: 'Ders silinemedi' });
    }
};

// Get pending instructors
export const getPendingInstructors = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await prisma.user.findMany({
            where: {
                role: 'INSTRUCTOR',
                isApproved: false
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true
            }
        });
        res.json(users);
    } catch (error) {
        console.error('Error getting pending instructors:', error);
        res.status(500).json({ error: 'Bekleyen eğitmenler alınamadı' });
    }
};

// Approve instructor
export const approveInstructor = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await prisma.user.update({
            where: { id: Number(id) },
            data: { isApproved: true }
        });
        res.json({ message: 'Eğitmen onaylandı' });
    } catch (error) {
        console.error('Error approving instructor:', error);
        res.status(500).json({ error: 'Eğitmen onaylanamadı' });
    }
};

// Reject instructor
export const rejectInstructor = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await prisma.user.delete({
            where: { id: Number(id) }
        });
        res.json({ message: 'Eğitmen reddedildi' });
    } catch (error) {
        console.error('Error rejecting instructor:', error);
        res.status(500).json({ error: 'Eğitmen reddedilemedi' });
    }
};
