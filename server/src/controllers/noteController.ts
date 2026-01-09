import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// Get notes for a specific course (User specific)
export const getCourseNotes = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // courseId
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const notes = await prisma.courseNote.findMany({
            where: {
                courseId: Number(id),
                userId: userId
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(notes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notes', error });
    }
};

// Create a new note
export const createCourseNote = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // courseId
        const { content } = req.body;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const note = await prisma.courseNote.create({
            data: {
                content,
                courseId: Number(id),
                userId: userId
            }
        });

        res.status(201).json(note);
    } catch (error) {
        res.status(500).json({ message: 'Error creating note', error });
    }
};

// Delete a note
export const deleteCourseNote = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // noteId
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        // Verify ownership
        const note = await prisma.courseNote.findUnique({
            where: { id: Number(id) }
        });

        if (!note) return res.status(404).json({ message: 'Note not found' });
        if (note.userId !== userId) return res.status(403).json({ message: 'Forbidden' });

        await prisma.courseNote.delete({
            where: { id: Number(id) }
        });

        res.json({ message: 'Note deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting note', error });
    }
};
