import { Router, Request, Response } from 'express';
import { spawn } from 'child_process';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '..', '..', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'omr-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed (JPEG, PNG, WebP)'));
        }
    }
});

/**
 * OMR Scan Endpoint with Full Scoring Integration
 * 
 * Receives: multipart/form-data with 'image' file, 'examId', optional 'studentId'
 * Returns: Detected answers, correct answers, score, and comparison details
 */
router.post('/scan', authenticateToken, authorizeRole(['INSTRUCTOR', 'ADMIN']), upload.single('image'), async (req: Request, res: Response) => {
    const imagePath = req.file?.path;
    const examId = req.body.examId;
    const studentId = req.body.studentId;
    const instructorId = (req as any).user?.id;

    console.log('[OMR] === NEW SCAN REQUEST ===');
    console.log('[OMR] ExamId:', examId);
    console.log('[OMR] StudentId:', studentId);
    console.log('[OMR] InstructorId:', instructorId);

    if (!imagePath) {
        res.status(400).json({ success: false, error: 'No image uploaded' });
        return;
    }

    if (!examId) {
        cleanupFile(imagePath);
        res.status(400).json({ success: false, error: 'examId is required' });
        return;
    }

    try {
        // ========================================
        // STEP 1: Run Python OMR Script
        // ========================================
        const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'omr.py');
        const debugOutputPath = path.join(uploadDir, `debug_${Date.now()}.jpg`);

        console.log('[OMR] Running Python script...');
        const omrResult = await runPythonScript(scriptPath, imagePath, debugOutputPath);

        // Clean up uploaded image
        cleanupFile(imagePath);

        console.log('[OMR] Python result:', JSON.stringify(omrResult));
        console.log('[OMR] Used fallback:', omrResult.usedFallback);
        console.log('[OMR] Note:', omrResult.note);

        // Check if we have answers - accept both border-detected and fallback results
        if (!omrResult.answers || !Array.isArray(omrResult.answers) || omrResult.answers.length === 0) {
            res.status(400).json({
                success: false,
                error: omrResult.error || 'OMR processing failed - no answers detected',
                answers: null,
                debugImage: fs.existsSync(debugOutputPath) ? `/uploads/${path.basename(debugOutputPath)}` : null
            });
            return;
        }

        const userAnswers: string[] = omrResult.answers;
        console.log('[OMR] User answers from Python:', userAnswers);

        // ========================================
        // STEP 2: Fetch Correct Answers from Database
        // ========================================
        console.log('[OMR] Fetching exam from database...');

        const exam = await prisma.exam.findUnique({
            where: { id: Number(examId) },
            include: {
                questions: {
                    where: {
                        type: 'MULTIPLE_CHOICE'  // Only get MC questions for OMR
                    },
                    orderBy: { id: 'asc' }  // Order by ID to maintain question order
                },
                course: true
            }
        });

        if (!exam) {
            res.status(404).json({
                success: false,
                error: 'Exam not found',
                examId: examId
            });
            return;
        }

        console.log('[OMR] Exam found:', exam.title);
        console.log('[OMR] MULTIPLE_CHOICE questions count:', exam.questions.length);

        // Build correct answers array from questions
        // answerKey contains the VALUE of the correct answer, not the letter
        // We need to find the index of this value in structure.options and convert to letter
        const LETTERS = ['A', 'B', 'C', 'D', 'E'];

        const correctAnswers: string[] = exam.questions.map((q, qIndex) => {
            const answerKey = q.answerKey as string;
            const structure = q.structure as any;

            // If answerKey is already a letter (A-E), use it directly
            if (answerKey && LETTERS.includes(answerKey.toUpperCase())) {
                return answerKey.toUpperCase();
            }

            // Try to find the answerKey value in structure.options
            if (structure?.options && Array.isArray(structure.options)) {
                for (let i = 0; i < structure.options.length && i < LETTERS.length; i++) {
                    const option = structure.options[i];
                    const optionText = option?.text || option?.label || option;

                    // Compare as strings
                    if (String(optionText) === String(answerKey)) {
                        console.log(`[OMR] Q${qIndex + 1}: answerKey "${answerKey}" found at index ${i} -> ${LETTERS[i]}`);
                        return LETTERS[i];
                    }
                }
            }

            // If answerKey is a number like 0, 1, 2, 3, 4 - treat as index
            const indexNum = parseInt(answerKey);
            if (!isNaN(indexNum) && indexNum >= 0 && indexNum < LETTERS.length) {
                console.log(`[OMR] Q${qIndex + 1}: answerKey "${answerKey}" treated as index -> ${LETTERS[indexNum]}`);
                return LETTERS[indexNum];
            }

            console.log(`[OMR] Q${qIndex + 1}: Could not convert answerKey "${answerKey}" to letter, using '?'`);
            return '?';
        });

        console.log('[OMR] Correct answers from DB:', correctAnswers);

        // ========================================
        // STEP 3: Calculate Score
        // ========================================
        const totalQuestions = Math.min(userAnswers.length, correctAnswers.length);
        let correctCount = 0;

        const comparison: Array<{
            question: number;
            userAnswer: string;
            correctAnswer: string;
            isCorrect: boolean;
        }> = [];

        for (let i = 0; i < totalQuestions; i++) {
            const userAns = userAnswers[i] || '?';
            const correctAns = correctAnswers[i] || '?';
            const isCorrect = userAns !== '?' && userAns === correctAns;

            if (isCorrect) {
                correctCount++;
            }

            comparison.push({
                question: i + 1,
                userAnswer: userAns,
                correctAnswer: correctAns,
                isCorrect
            });

            console.log(`[OMR] Q${i + 1}: User="${userAns}" Correct="${correctAns}" => ${isCorrect ? '✓' : '✗'}`);
        }

        const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

        console.log('[OMR] ========== SCORE RESULT ==========');
        console.log(`[OMR] Correct: ${correctCount} / ${totalQuestions}`);
        console.log(`[OMR] Score: ${score}%`);
        console.log('[OMR] ====================================');

        // ========================================
        // STEP 4: Save Result to Database (if studentId provided)
        // ========================================
        let savedResult = null;

        if (studentId) {
            try {
                console.log('[OMR] Saving result for student:', studentId);

                // Verify instructor owns this course
                if (exam.course.instructorId !== instructorId) {
                    console.log('[OMR] Warning: Instructor does not own this course');
                }

                // Check if result already exists
                const existingResult = await prisma.examResult.findFirst({
                    where: {
                        examId: Number(examId),
                        userId: Number(studentId)
                    }
                });

                if (existingResult) {
                    // Update existing result
                    savedResult = await prisma.examResult.update({
                        where: { id: existingResult.id },
                        data: {
                            score: score,
                            completedAt: new Date()
                        }
                    });
                    console.log('[OMR] Updated existing result ID:', savedResult.id);
                } else {
                    // Create new result
                    savedResult = await prisma.examResult.create({
                        data: {
                            examId: Number(examId),
                            userId: Number(studentId),
                            score: score
                        }
                    });
                    console.log('[OMR] Created new result ID:', savedResult.id);
                }
            } catch (dbError) {
                console.error('[OMR] Failed to save result:', dbError);
                // Continue without saving - return score anyway
            }
        }

        // ========================================
        // STEP 5: Return Response
        // ========================================
        const response = {
            success: true,
            examId: Number(examId),
            examTitle: exam.title,
            score: score,
            totalQuestions: totalQuestions,
            correctCount: correctCount,
            userAnswers: userAnswers,
            correctAnswers: correctAnswers,
            comparison: comparison,
            saved: savedResult !== null,
            resultId: savedResult?.id || null,
            debugImage: fs.existsSync(debugOutputPath) ? `/uploads/${path.basename(debugOutputPath)}` : null
        };

        console.log('[OMR] Sending response to client');
        res.json(response);

    } catch (error: any) {
        console.error('[OMR] Error:', error);

        // Clean up uploaded file
        if (imagePath && fs.existsSync(imagePath)) {
            cleanupFile(imagePath);
        }

        res.status(500).json({
            success: false,
            error: error.message || 'OMR processing failed',
            answers: null
        });
    }
});

/**
 * Run Python OMR script and return parsed result
 */
function runPythonScript(scriptPath: string, imagePath: string, debugOutputPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';

        console.log('[OMR] Executing:', pythonCommand, scriptPath);
        console.log('[OMR] Image path:', imagePath);
        console.log('[OMR] Debug output:', debugOutputPath);

        const pythonProcess = spawn(pythonCommand, [scriptPath, imagePath, debugOutputPath]);

        let stdout = '';
        let stderr = '';

        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        pythonProcess.on('close', (code) => {
            console.log('[OMR] Python exit code:', code);
            console.log('[OMR] Python stdout length:', stdout.length);
            console.log('[OMR] Python stdout:', stdout.substring(0, 500)); // First 500 chars

            if (stderr) {
                console.log('[OMR] Python stderr:', stderr);
            }

            // Even if exit code is non-zero, try to parse JSON
            // (Python might print JSON before error)
            try {
                // Try to find JSON object in output
                // Use a more robust regex that matches the outermost { }
                let jsonStr = stdout.trim();

                // If there's multiple lines, try to find the JSON line
                const lines = jsonStr.split('\n');
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                        jsonStr = trimmed;
                        break;
                    }
                }

                // If still not found, try regex
                if (!jsonStr.startsWith('{')) {
                    const jsonMatch = stdout.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
                    if (jsonMatch) {
                        jsonStr = jsonMatch[0];
                    }
                }

                console.log('[OMR] Attempting to parse JSON:', jsonStr.substring(0, 200));

                const result = JSON.parse(jsonStr);
                console.log('[OMR] Successfully parsed JSON. Answers:', result.answers);
                resolve(result);

            } catch (parseError: any) {
                console.error('[OMR] JSON parse error:', parseError.message);
                console.error('[OMR] Raw stdout:', stdout);

                if (code !== 0) {
                    reject(new Error(`Python script failed with code ${code}: ${stderr}`));
                } else {
                    reject(new Error('Failed to parse OMR result JSON'));
                }
            }
        });

        pythonProcess.on('error', (err) => {
            console.error('[OMR] Failed to start Python:', err);
            reject(new Error('Python not found. Is Python installed and in PATH?'));
        });
    });
}

/**
 * Clean up temporary file
 */
function cleanupFile(filePath: string): void {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('[OMR] Cleaned up:', filePath);
        }
    } catch (err) {
        console.error('[OMR] Failed to cleanup:', err);
    }
}

export default router;
