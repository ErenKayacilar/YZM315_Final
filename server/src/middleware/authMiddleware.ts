import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Erisim reddedildi. Token yok.' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET as string);
        req.user = verified as any;
        next();
    } catch (err) {
        res.status(403).json({ message: 'Gecersiz token.' });
    }
};

export const optionalAuthenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return next();
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET as string);
        req.user = verified as any;
        next();
    } catch (err) {
        // Token geçersizse de devam et, public içerik gösterilir
        next();
    }
};

export const authorizeRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Bu islem icin yetkiniz yok.' });
        }
        next();
    };
};
