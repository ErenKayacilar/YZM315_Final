import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role } = req.body;

        // Email kontrolü
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Bu email zaten kullanimda.' });
        }

        // Şifre hashlama
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Kullanıcı oluşturma
        // NOT: Gerçek hayatta rolü client'tan almamalıyız, ama test için şimdilik OK.

        let isApproved = true;
        if (role === Role.INSTRUCTOR) {
            isApproved = false;
        }

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || Role.STUDENT,
                isApproved
            },
        });

        res.status(201).json({ message: 'Kullanici olusturuldu.', userId: user.id });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatasi.', error });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Kullanici bulunamadi veya sifre yanlis.' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Kullanici bulunamadi veya sifre yanlis.' });
        }

        if (user.role === Role.INSTRUCTOR && !user.isApproved) {
            return res.status(403).json({ message: 'Giriş başarısız. Hesabınız admin onayı beklemektedir.' });
        }

        // Token oluşturma
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phoneNumber: user.phoneNumber,
                profileImage: user.profileImage
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Sunucu hatasi.', error });
    }
};
