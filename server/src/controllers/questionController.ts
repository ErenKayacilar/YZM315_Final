import { Request, Response } from 'express';
import * as XLSX from 'xlsx';
import prisma from '../lib/prisma';

// Valid question types from Prisma schema
const VALID_QUESTION_TYPES = [
    'MULTIPLE_CHOICE',
    'MULTIPLE_SELECT',
    'TRUE_FALSE',
    'SHORT_ANSWER',
    'LONG_ANSWER',
    'ORDERING',
    'MATCHING',
    'FILL_IN_BLANKS',
    'NUMERIC',
    'CODE_SNIPPET'
] as const;

// Create a question in the bank (examId is null)
export const createQuestionInBank = async (req: Request, res: Response): Promise<void> => {
    try {
        const { courseId } = req.params;
        const { text, type, structure, answerKey } = req.body;

        if (!text || !type || !structure) {
            res.status(400).json({ error: 'Gecersiz veri' });
            return;
        }

        const question = await prisma.question.create({
            data: {
                text,
                type,
                structure,
                answerKey,
                courseId: Number(courseId),
            }
        });

        res.status(201).json(question);
    } catch (error) {
        console.error('Error creating question in bank:', error);
        res.status(500).json({ error: 'Soru olusturulamadi' });
    }
};

// Get all bank questions for a course
export const getQuestionsByCourse = async (req: Request, res: Response): Promise<void> => {
    try {
        const { courseId } = req.params;

        const questions = await prisma.question.findMany({
            where: {
                courseId: Number(courseId),
                examId: null // Only fetch questions that are NOT part of an exam (Bank questions)
            },
            orderBy: { id: 'desc' }
        });

        res.json(questions);
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: 'Sorular alinamadi' });
    }
};

// Delete a question from the bank
export const deleteQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Question delete will cascade if we had relations, but now it's just the row
        await prisma.question.delete({
            where: { id: Number(id) }
        });

        res.json({ message: 'Soru silindi' });
    } catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ error: 'Soru silinemedi' });
    }
};

// Import questions from Excel file
export const importQuestionsFromExcel = async (req: Request, res: Response): Promise<void> => {
    try {
        const { courseId } = req.params;
        const { fileData } = req.body; // Base64 encoded Excel file

        if (!fileData) {
            res.status(400).json({ error: 'Dosya verisi gerekli' });
            return;
        }

        // Decode base64 and read Excel
        const buffer = Buffer.from(fileData, 'base64');
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (rows.length === 0) {
            res.status(400).json({ error: 'Excel dosyası boş veya geçersiz format' });
            return;
        }

        const validQuestions: any[] = [];
        const errors: string[] = [];

        rows.forEach((row, index) => {
            const rowNum = index + 2; // +2 because Excel rows are 1-indexed and first row is header

            // Get values from row (case-insensitive column names)
            const type = row.Type || row.type || row.TYPE;
            const content = row.Content || row.content || row.CONTENT;
            const optionsRaw = row.Options || row.options || row.OPTIONS;
            const correctAnswerRaw = row.CorrectAnswer || row.correctAnswer || row.CORRECTANSWER || row.correctanswer;

            // Validate Type
            if (!type || !VALID_QUESTION_TYPES.includes(type as any)) {
                errors.push(`Satır ${rowNum}: Geçersiz veya eksik Type (${type || 'boş'})`);
                return;
            }

            // Validate Content
            if (!content || typeof content !== 'string' || content.trim() === '') {
                errors.push(`Satır ${rowNum}: Content boş olamaz`);
                return;
            }

            // Parse Options
            let structure: any = {};
            let answerKey: any = correctAnswerRaw;

            try {
                if (type === 'MULTIPLE_CHOICE' || type === 'MULTIPLE_SELECT' || type === 'TRUE_FALSE') {
                    let options: string[] = [];

                    if (typeof optionsRaw === 'string') {
                        // Try to parse as JSON
                        try {
                            options = JSON.parse(optionsRaw);
                        } catch {
                            // If not JSON, split by comma
                            options = optionsRaw.split(',').map((o: string) => o.trim());
                        }
                    } else if (Array.isArray(optionsRaw)) {
                        options = optionsRaw;
                    }

                    if (options.length < 2) {
                        errors.push(`Satır ${rowNum}: Options en az 2 seçenek içermeli`);
                        return;
                    }

                    structure = {
                        options: options.map((text: string, idx: number) => ({
                            text: String(text),
                            id: `opt${idx + 1}`
                        }))
                    };
                } else if (type === 'MATCHING') {
                    // For matching, expect JSON format like [{"left": "A", "right": "1"}, ...]
                    if (typeof optionsRaw === 'string') {
                        structure = { pairs: JSON.parse(optionsRaw) };
                    }
                    if (typeof correctAnswerRaw === 'string') {
                        try {
                            answerKey = JSON.parse(correctAnswerRaw);
                        } catch {
                            answerKey = correctAnswerRaw;
                        }
                    }
                } else if (type === 'ORDERING') {
                    // For ordering, expect JSON array of items
                    if (typeof optionsRaw === 'string') {
                        const items = JSON.parse(optionsRaw);
                        structure = {
                            items: items.map((text: string, idx: number) => ({
                                text: String(text),
                                id: idx + 1
                            }))
                        };
                    }
                    if (typeof correctAnswerRaw === 'string') {
                        try {
                            answerKey = JSON.parse(correctAnswerRaw);
                        } catch {
                            answerKey = correctAnswerRaw;
                        }
                    }
                } else {
                    // SHORT_ANSWER, LONG_ANSWER, NUMERIC, CODE_SNIPPET, FILL_IN_BLANKS
                    structure = {};
                    answerKey = correctAnswerRaw || '';
                }
            } catch (parseError) {
                errors.push(`Satır ${rowNum}: Options veya CorrectAnswer parse edilemedi`);
                return;
            }

            validQuestions.push({
                text: content.trim(),
                type: type,
                structure: structure,
                answerKey: answerKey,
                courseId: Number(courseId)
            });
        });

        // Bulk insert valid questions
        let insertedCount = 0;
        if (validQuestions.length > 0) {
            const result = await prisma.question.createMany({
                data: validQuestions
            });
            insertedCount = result.count;
        }

        res.json({
            success: true,
            message: `${insertedCount} soru başarıyla eklendi`,
            inserted: insertedCount,
            errors: errors.length > 0 ? errors : undefined,
            totalRows: rows.length,
            failedRows: errors.length
        });
    } catch (error) {
        console.error('Error importing questions from Excel:', error);
        res.status(500).json({ error: 'Excel import başarısız oldu' });
    }
};
