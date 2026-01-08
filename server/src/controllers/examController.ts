import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createExam = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, courseId, questions, requiresSeb, duration, deadline } = req.body;
        const exam = await prisma.exam.create({
            data: {
                title,
                courseId: Number(courseId),
                requiresSeb: Boolean(requiresSeb),
                duration: duration ? Number(duration) : null,
                deadline: deadline ? new Date(deadline) : null,
                questions: {
                    create: questions.map((q: any) => ({
                        text: q.text,
                        type: q.type,
                        structure: q.structure,
                        answerKey: q.answerKey
                    }))
                }
            },
            include: { questions: true }
        });
        res.status(201).json(exam);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Sinav olusturulamadi' });
    }
};

// Helper function to check if request is from SEB
const isSebBrowser = (req: Request): boolean => {
    const userAgent = req.headers['user-agent'] || '';
    return userAgent.toLowerCase().includes('seb');
};

export const getExamById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const exam = await prisma.exam.findUnique({
            where: { id: Number(id) },
            include: { questions: true, results: { where: { userId: Number((req as any).user.id) } } }
        });

        if (!exam) {
            res.status(404).json({ error: 'Sinav bulunamadi' });
            return;
        }

        // Deadline Check: If exam has deadline and it passed, block access
        if (exam.deadline && new Date() > new Date(exam.deadline)) {
            // Check if user already took the exam
            if (!exam.results || exam.results.length === 0) {
                res.status(403).json({
                    error: 'Sınav süresi doldu. Artık giriş yapamazısınız.',
                    deadlinePassed: true
                });
                return;
            }
        }

        // SEB Check: If exam requires SEB, verify User-Agent
        if (exam.requiresSeb && !isSebBrowser(req)) {
            res.status(403).json({
                error: 'Bu sınava sadece Safe Exam Browser ile girilebilir.',
                requiresSeb: true
            });
            return;
        }

        res.json(exam);
    } catch (error) {
        res.status(500).json({ error: 'Sinav alinamadi' });
    }
};

export const submitExam = async (req: Request, res: Response): Promise<void> => {
    try {
        const { examId, answers: rawAnswers } = req.body;
        const userId = Number((req as any).user.id);

        if (!examId) {
            res.status(400).json({ error: 'Exam ID is required' });
            return;
        }

        // Convert answers to object format if it's an array
        // Frontend sends: [{ questionId: 1, answer: 'value' }]
        // Backend expects: { 1: 'value' }
        let answers: Record<number, any> = {};
        if (Array.isArray(rawAnswers)) {
            rawAnswers.forEach((a: any) => {
                answers[a.questionId] = a.answer;
            });
        } else if (typeof rawAnswers === 'object' && rawAnswers !== null) {
            answers = rawAnswers;
        }

        console.log('Processed answers:', answers); // Debug log

        const exam = await prisma.exam.findUnique({
            where: { id: Number(examId) },
            include: { questions: true }
        });

        if (!exam) {
            res.status(404).json({ error: 'Sinav bulunamadi' });
            return;
        }

        // SEB Check: If exam requires SEB, verify User-Agent
        if (exam.requiresSeb && !isSebBrowser(req)) {
            res.status(403).json({
                error: 'Bu sınava sadece Safe Exam Browser ile girilebilir.',
                requiresSeb: true
            });
            return;
        }

        let correctCount = 0;
        let totalQuestions = exam.questions.length;

        if (totalQuestions === 0) {
            const result = await prisma.examResult.create({
                data: { examId: Number(examId), userId, score: 0 }
            });
            res.json(result);
            return;
        }

        exam.questions.forEach(q => {
            const userAnswer = answers[q.id];
            const correctKey = q.answerKey as any; // Cast from Json
            const type = q.type;

            console.log(`Q${q.id} [${type}]: user="${JSON.stringify(userAnswer)}" correct="${JSON.stringify(correctKey)}"`); // Debug

            let isCorrect = false;

            try {
                switch (type) {
                    case 'MULTIPLE_CHOICE':
                    case 'TRUE_FALSE':
                        // Exact match (String or Boolean)
                        isCorrect = String(userAnswer) === String(correctKey);
                        break;

                    case 'MULTIPLE_SELECT':
                        // Compare sorted arrays
                        if (Array.isArray(userAnswer) && Array.isArray(correctKey)) {
                            const sortedUser = [...userAnswer].sort();
                            const sortedKey = [...correctKey].sort();
                            isCorrect = JSON.stringify(sortedUser) === JSON.stringify(sortedKey);
                        }
                        break;

                    case 'SHORT_ANSWER':
                        // Case insensitive trim match
                        if (typeof userAnswer === 'string' && typeof correctKey === 'string') {
                            isCorrect = userAnswer.trim().toLowerCase() === correctKey.trim().toLowerCase();
                        }
                        break;

                    case 'ORDERING':
                        // Strict array order match
                        if (Array.isArray(userAnswer) && Array.isArray(correctKey)) {
                            isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correctKey);
                        }
                        break;

                    case 'MATCHING':
                        // Object comparison
                        if (typeof userAnswer === 'object' && typeof correctKey === 'object') {
                            const userKeys = Object.keys(userAnswer || {}).sort();
                            const correctKeys = Object.keys(correctKey || {}).sort();
                            if (JSON.stringify(userKeys) === JSON.stringify(correctKeys)) {
                                isCorrect = userKeys.every(k => userAnswer[k] === correctKey[k]);
                            }
                        }
                        break;

                    case 'FILL_IN_BLANKS':
                        // Compare array of answers
                        if (Array.isArray(userAnswer) && Array.isArray(correctKey)) {
                            if (userAnswer.length === correctKey.length) {
                                isCorrect = userAnswer.every((ans, idx) =>
                                    String(ans).trim().toLowerCase() === String(correctKey[idx]).trim().toLowerCase()
                                );
                            }
                        }
                        break;

                    case 'NUMERIC':
                        if (userAnswer !== null && userAnswer !== undefined) {
                            isCorrect = Number(userAnswer) === Number(correctKey);
                        }
                        break;

                    case 'LONG_ANSWER':
                    case 'CODE_SNIPPET':
                        // Manual grading required. For now, 0 points.
                        isCorrect = false;
                        break;

                    default:
                        isCorrect = false;
                }
            } catch (err) {
                console.error(`Grading error for Q ${q.id}:`, err);
                isCorrect = false;
            }

            if (isCorrect) correctCount++;
        });

        const score = Math.round((correctCount / totalQuestions) * 100);

        const result = await prisma.examResult.create({
            data: {
                examId: Number(examId),
                userId,
                score
            }
        });

        res.json(result);

    } catch (error) {
        console.error('Submit Exam Error:', error);
        res.status(500).json({ error: 'Sinav gonderilemedi', details: (error as Error).message });
    }
};

export const getExamResults = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // Exam ID
        const results = await prisma.examResult.findMany({
            where: { examId: Number(id) },
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { completedAt: 'desc' }
        });
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Sonuclar alinamadi' });
    }
};

// Submit Optical Exam Result (OMR Scanner)
// This endpoint is for instructors to submit exam results on behalf of students
export const submitOpticalExam = async (req: Request, res: Response): Promise<void> => {
    try {
        const { examId, studentId, score, answers } = req.body;
        const instructorId = (req as any).user?.id;

        console.log('[OMR Backend] Received submission:', { examId, studentId, score, answers });

        // Validate required fields
        if (!examId || !studentId || score === undefined) {
            res.status(400).json({ error: 'examId, studentId ve score alanları gereklidir.' });
            return;
        }

        // Verify the exam exists
        const exam = await prisma.exam.findUnique({
            where: { id: Number(examId) },
            include: { course: true }
        });

        if (!exam) {
            res.status(404).json({ error: 'Sınav bulunamadı.' });
            return;
        }

        // Verify the instructor owns this course
        if (exam.course.instructorId !== instructorId) {
            res.status(403).json({ error: 'Bu sınavı yönetme yetkiniz yok.' });
            return;
        }

        // Verify the student is enrolled in this course
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: Number(studentId),
                    courseId: exam.courseId
                }
            }
        });

        if (!enrollment || enrollment.status !== 'APPROVED') {
            res.status(400).json({ error: 'Öğrenci bu derse kayıtlı değil veya onaylı değil.' });
            return;
        }

        // Check if student already has a result for this exam
        const existingResult = await prisma.examResult.findFirst({
            where: {
                examId: Number(examId),
                userId: Number(studentId)
            }
        });

        let result;

        if (existingResult) {
            // Update existing result
            result = await prisma.examResult.update({
                where: { id: existingResult.id },
                data: {
                    score: Number(score),
                    completedAt: new Date()
                },
                include: { user: { select: { id: true, name: true, email: true } } }
            });
            console.log('[OMR Backend] Updated existing result:', result.id);
        } else {
            // Create new result
            result = await prisma.examResult.create({
                data: {
                    examId: Number(examId),
                    userId: Number(studentId),
                    score: Number(score)
                },
                include: { user: { select: { id: true, name: true, email: true } } }
            });
            console.log('[OMR Backend] Created new result:', result.id);
        }

        res.status(201).json({
            success: true,
            message: 'Optik form sonucu kaydedildi.',
            result
        });

    } catch (error) {
        console.error('[OMR Backend] Error:', error);
        res.status(500).json({ error: 'Optik form sonucu kaydedilemedi.', details: (error as Error).message });
    }
};

// Add questions from bank to exam (Duplicate logic)
export const addQuestionsToExam = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // Exam ID
        const { questionIds, count, random } = req.body;

        const exam = await prisma.exam.findUnique({
            where: { id: Number(id) }
        });

        if (!exam) {
            res.status(404).json({ error: 'Exam not found' });
            return;
        }

        let questionsToCopy: any[] = [];

        if (random && count) {
            // Random mode: Fetch all bank questions for this course
            const allQuestions = await prisma.question.findMany({
                where: {
                    courseId: exam.courseId,
                    examId: null // Only from bank
                }
            });

            // Shuffle and pick
            const shuffled = allQuestions.sort(() => 0.5 - Math.random());
            questionsToCopy = shuffled.slice(0, Number(count));

        } else if (questionIds && Array.isArray(questionIds)) {
            // Manual mode
            questionsToCopy = await prisma.question.findMany({
                where: {
                    id: { in: questionIds.map((qid: any) => Number(qid)) },
                    examId: null // Ensure they are from bank
                }
            });
        }

        if (questionsToCopy.length === 0) {
            res.status(400).json({ message: 'No questions found to add' });
            return;
        }

        // Duplicate each question and link to exam
        await prisma.$transaction(
            questionsToCopy.map(q =>
                prisma.question.create({
                    data: {
                        text: q.text,
                        type: q.type,
                        structure: q.structure,
                        answerKey: q.answerKey,
                        examId: Number(id),
                        courseId: q.courseId
                    }
                })
            )
        );

        res.json({ message: `${questionsToCopy.length} questions added to exam.` });

    } catch (error) {
        console.error('Error adding questions:', error);
        res.status(500).json({ error: 'Could not add questions' });
    }
};

// Generate SEB Configuration File - Buffer-based UTF-8 Response
export const getSebConfig = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const exam = await prisma.exam.findUnique({
            where: { id: Number(id) }
        });

        if (!exam) {
            res.status(404).json({ error: 'Sinav bulunamadi' });
            return;
        }

        if (!exam.requiresSeb) {
            res.status(400).json({ error: 'Bu sinav icin SEB gerekli degil' });
            return;
        }

        // Use correct frontend URL - this is what the student will see in SEB
        // The frontend runs on port 3000, not the backend port
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const examUrl = `${frontendUrl}/exams/${id}`;

        // XML with NO leading spaces - starts exactly at <?xml
        // showQuitButton = false to hide native quit, we use custom quit with password
        const xmlString = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>startURL</key>
    <string>${examUrl}</string>
    <key>showQuitButton</key>
    <false/>
    <key>allowQuit</key>
    <true/>
    <key>showTaskBar</key>
    <true/>
    <key>showReloadButton</key>
    <true/>
    <key>showTime</key>
    <true/>
    <key>sebServerURL</key>
    <string></string>
    <key>hashedAdminPassword</key>
    <string></string>
    <key>hashedQuitPassword</key>
    <string></string>
    <key>createNewDesktop</key>
    <false/>
    <key>showSideBar</key>
    <false/>
    <key>allowVideoCapture</key>
    <true/>
    <key>allowAudioCapture</key>
    <true/>
    <key>browserMediaStreamApi</key>
    <true/>
</dict>
</plist>`;

        // Convert to Buffer with UTF-8 encoding (crucial for correct file handling)
        const fileBuffer = Buffer.from(xmlString.trim(), 'utf-8');

        // Set Headers and Send Buffer
        res.setHeader('Content-Type', 'application/seb');
        res.setHeader('Content-Disposition', `attachment; filename="exam_${id}.seb"`);
        res.setHeader('Content-Length', fileBuffer.length);

        res.send(fileBuffer);

    } catch (error) {
        console.error('Error generating SEB config:', error);
        res.status(500).json({ error: 'SEB config olusturulamadi' });
    }
};
