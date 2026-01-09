import { Request, Response } from 'express';
import { EnrollmentStatus } from '@prisma/client';
import prisma from '../lib/prisma';

// Ders oluşturma (Sadece Instructor/Admin)
export const createCourse = async (req: Request, res: Response) => {
    try {
        const { title, description, hasLab } = req.body;
        const instructorId = req.user?.id;

        if (!instructorId) return res.status(401).json({ message: 'Yetkisiz islem.' });

        const course = await prisma.course.create({
            data: {
                title,
                description,
                hasLab: hasLab || false,
                instructorId,
            },
        });

        res.status(201).json(course);
    } catch (error) {
        res.status(500).json({ message: 'Ders olusturulamadi.', error });
    }
};

// Eğitmenin sadece kendi derslerini getirmesi
export const getInstructorCourses = async (req: Request, res: Response) => {
    try {
        const instructorId = req.user?.id;
        if (!instructorId) return res.status(401).json({ message: 'Yetkisiz.' });

        const courses = await prisma.course.findMany({
            where: {
                instructorId: instructorId
            },
            include: {
                exams: { include: { questions: true } },
                modules: true
            }
        });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Dersler getirilemedi.', error });
    }
};

// Tüm dersleri listeleme (Öğrenci kataloğu için)
export const getCourses = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        const courses = await prisma.course.findMany({
            include: {
                instructor: {
                    select: { name: true, email: true }
                },
                // Eğer kullanıcı giriş yapmışsa, bu derse olan kaydını getir
                enrollments: userId ? {
                    where: { userId: userId }
                } : false
            }
        });

        // Frontend'e kolaylık olsun diye userStatus ve puanları ekleyelim
        const coursesWithStatus = courses.map((course: any) => {
            const enrollment = course.enrollments && course.enrollments.length > 0
                ? course.enrollments[0]
                : null;
            return {
                ...course,
                userStatus: enrollment?.status || null,
                theoryScore: enrollment?.theoryScore,
                labScore: enrollment?.labScore
            };
        });

        res.json(coursesWithStatus);
    } catch (error) {
        res.status(500).json({ message: 'Dersler getirilemedi.', error });
    }
};

// Tek bir dersi getirme (Modüllerle birlikte)
export const getCourseById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const course = await prisma.course.findUnique({
            where: { id: Number(id) },
            include: {
                modules: {
                    include: {
                        lessons: true
                    }
                },
                exams: {
                    include: {
                        questions: true,
                        results: {
                            where: { userId: req.user?.id }
                        }
                    }
                },
                instructor: {
                    select: { name: true }
                }
            }
        });

        if (!course) return res.status(404).json({ message: 'Ders bulunamadi.' });

        // Erişim Kontrolü: Eğitmen değilse ve Admin değilse
        if (req.user?.role !== 'INSTRUCTOR' && req.user?.role !== 'ADMIN') {
            // Kullanıcının enrollment durumuna bak
            const enrollment = await prisma.enrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId: req.user!.id,
                        courseId: Number(id)
                    }
                }
            });

            // Eğer kayıt yoksa veya onaylanmamışsa içeriği gizle
            if (!enrollment || enrollment.status !== EnrollmentStatus.APPROVED) {
                return res.json({
                    ...course,
                    modules: [],
                    exams: [],
                    isEnrolled: !!enrollment,
                    enrollmentStatus: enrollment?.status || null
                });
            }

            // APPROVED ise status bilgisini ekle
            return res.json({
                ...course,
                enrollmentStatus: enrollment.status
            });
        }

        res.json(course);
    } catch (error) {
        res.status(500).json({ message: 'Ders getirilemedi.', error });
    }
};

// Derse içerik ekleme (Module/Lesson)
export const addModule = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // Course ID
        const { title } = req.body;

        const module = await prisma.module.create({
            data: {
                title,
                courseId: Number(id)
            }
        });
        res.status(201).json(module);
    } catch (error) {
        res.status(500).json({ message: 'Modul eklenemedi.', error });
    }
};

export const addLesson = async (req: Request, res: Response) => {
    try {
        const { moduleId } = req.params;
        const { title, type, url } = req.body;

        const lesson = await prisma.lesson.create({
            data: {
                title,
                type,
                url,
                moduleId: Number(moduleId)
            }
        });
        res.status(201).json(lesson);
    } catch (error) {
        res.status(500).json({ message: 'Ders icerigi eklenemedi.', error });
    }
}

// Modül güncelleme
export const updateModule = async (req: Request, res: Response) => {
    try {
        const { moduleId } = req.params;
        const { title } = req.body;

        const module = await prisma.module.update({
            where: { id: Number(moduleId) },
            data: { title }
        });
        res.json(module);
    } catch (error) {
        res.status(500).json({ message: 'Modul guncellenemedi.', error });
    }
};

// Modül silme
// Modül silme
export const deleteModule = async (req: Request, res: Response) => {
    try {
        const { moduleId } = req.params;

        // Find associated lessons to clean up progress
        const lessons = await prisma.lesson.findMany({
            where: { moduleId: Number(moduleId) },
            select: { id: true }
        });
        const lessonIds = lessons.map(l => l.id);

        if (lessonIds.length > 0) {
            // Delete UserProgress for these lessons
            await prisma.userProgress.deleteMany({
                where: { lessonId: { in: lessonIds } }
            });

            // Delete Lessons
            await prisma.lesson.deleteMany({
                where: { moduleId: Number(moduleId) }
            });
        }

        // Delete Module
        await prisma.module.delete({
            where: { id: Number(moduleId) }
        });

        res.json({ message: 'Modul silindi.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Modul silinemedi.', error });
    }
};

// Ders (Lesson) silme
// Ders (Lesson) silme
export const deleteLesson = async (req: Request, res: Response) => {
    try {
        const { lessonId } = req.params;

        // Cleanup progress
        await prisma.userProgress.deleteMany({
            where: { lessonId: Number(lessonId) }
        });

        await prisma.lesson.delete({
            where: { id: Number(lessonId) }
        });

        res.json({ message: 'Icerik silindi.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Icerik silinemedi.', error });
    }
};

// Derse kayıt olma isteği
export const enrollCourse = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Giris yapmalisiniz.' });

        const enrollment = await prisma.enrollment.create({
            data: {
                courseId: Number(id),
                userId: userId,
                status: EnrollmentStatus.PENDING
            }
        });

        res.status(201).json(enrollment);
    } catch (error) {
        res.status(500).json({ message: 'Kayit olunamadi.', error });
    }
};

// Bir kursun kayıt isteklerini getirme (İnstructor için)
export const getCourseEnrollments = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const enrollments = await prisma.enrollment.findMany({
            where: { courseId: Number(id) },
            include: {
                user: { select: { id: true, name: true, email: true } }
            }
        });
        // Note: theoryScore and labScore are automatically included in the response
        res.json(enrollments);
    } catch (error) {
        res.status(500).json({ message: 'Kayitlar getirilemedi.', error });
    }
};

// Kayıt durumunu güncelleme (Approve/Reject)
export const updateEnrollmentStatus = async (req: Request, res: Response) => {
    try {
        const { id, studentId } = req.params; // id: courseId
        const { status } = req.body;

        const updatedEnrollment = await prisma.enrollment.update({
            where: {
                userId_courseId: {
                    userId: Number(studentId),
                    courseId: Number(id)
                }
            },
            data: { status }
        });
        res.json(updatedEnrollment);
    } catch (error) {
        res.status(500).json({ message: 'Guncellenemedi.', error });
    }
};

// Öğrencinin kayıtlı olduğu dersleri getirme (Mobil uygulama için)
export const getStudentEnrollments = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: 'Giris yapmalisiniz.' });

        const enrollments = await prisma.enrollment.findMany({
            where: {
                userId: userId,
                status: EnrollmentStatus.APPROVED
            },
            include: {
                course: {
                    include: {
                        instructor: { select: { name: true, email: true } },
                        modules: {
                            include: {
                                lessons: true
                            }
                        },
                        exams: true
                    }
                }
            }
        });

        // Her kurs için ilerleme hesapla (Web ile aynı mantık: lessons + exams)
        const coursesWithProgress = await Promise.all(enrollments.map(async (enrollment: any) => {
            const course = enrollment.course;

            // Toplam ders sayısını hesapla
            const totalLessons = course.modules.reduce((sum: number, module: any) =>
                sum + module.lessons.length, 0);
            const totalExams = course.exams?.length || 0;
            const totalItems = totalLessons + totalExams;

            // Tamamlanan ders sayısını hesapla
            const completedLessons = await prisma.userProgress.count({
                where: {
                    userId: userId,
                    isCompleted: true,
                    lesson: {
                        module: {
                            courseId: course.id
                        }
                    }
                }
            });

            // Tamamlanan sınav sayısını hesapla
            const examIds = course.exams?.map((e: any) => e.id) || [];
            const completedExams = examIds.length > 0 ? await prisma.examResult.count({
                where: {
                    userId: userId,
                    examId: { in: examIds }
                }
            }) : 0;

            const completedItems = completedLessons + completedExams;
            const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

            return {
                id: course.id,
                title: course.title,
                description: course.description,
                hasLab: course.hasLab,
                instructor: course.instructor,
                progress: progress,
                totalLessons,
                completedLessons,
                totalExams,
                completedExams,
                enrollmentId: enrollment.id,
                enrolledAt: enrollment.createdAt,
                theoryScore: enrollment.theoryScore,
                labScore: enrollment.labScore
            };
        }));

        res.json(coursesWithProgress);
    } catch (error) {
        console.error('getStudentEnrollments error:', error);
        res.status(500).json({ message: 'Kayitli dersler getirilemedi.', error });
    }
};

// Öğrenci notlarını güncelleme (Manual Grading)
export const gradeStudent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // Course ID
        const { studentId, theoryScore, labScore } = req.body;
        const instructorId = req.user?.id;

        if (!instructorId) return res.status(401).json({ message: 'Yetkisiz islem.' });

        // Verify the course belongs to this instructor
        const course = await prisma.course.findUnique({
            where: { id: Number(id) }
        });

        if (!course) return res.status(404).json({ message: 'Ders bulunamadi.' });
        if (course.instructorId !== instructorId && req.user?.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Bu dersi yonetme yetkiniz yok.' });
        }

        // Update the enrollment with scores
        const updatedEnrollment = await prisma.enrollment.update({
            where: {
                userId_courseId: {
                    userId: Number(studentId),
                    courseId: Number(id)
                }
            },
            data: {
                theoryScore: theoryScore !== undefined ? Number(theoryScore) : undefined,
                labScore: labScore !== undefined ? Number(labScore) : undefined
            },
            include: {
                user: { select: { id: true, name: true, email: true } }
            }
        });

        res.json(updatedEnrollment);
    } catch (error) {
        console.error('gradeStudent error:', error);
        res.status(500).json({ message: 'Not guncellenemedi.', error });
    }
};
