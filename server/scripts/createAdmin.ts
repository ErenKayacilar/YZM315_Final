import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
    const adminEmail = 'admin@lms.com';
    const adminPassword = 'admin123';
    const adminName = 'Sistem Yöneticisi';

    try {
        // Check if admin exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (existingAdmin) {
            console.log('✓ Admin kullanıcısı zaten mevcut:', adminEmail);
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Create admin
        const admin = await prisma.user.create({
            data: {
                email: adminEmail,
                password: hashedPassword,
                name: adminName,
                role: 'ADMIN'
            }
        });

        console.log('✓ Admin kullanıcısı oluşturuldu:');
        console.log('  Email:', adminEmail);
        console.log('  Şifre:', adminPassword);
        console.log('  Rol:', admin.role);
    } catch (error) {
        console.error('✗ Admin oluşturulurken hata:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
