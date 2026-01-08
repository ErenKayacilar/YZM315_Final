const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function recreateUser() {
    const prisma = new PrismaClient();

    try {
        // 1. Önce Matematik dersini kontrol et
        const mathCourse = await prisma.course.findFirst({
            where: { title: { contains: 'Matematik' } }
        });

        console.log('=== Matematik Dersi ===');
        if (mathCourse) {
            console.log('ID:', mathCourse.id);
            console.log('Title:', mathCourse.title);
            console.log('Current InstructorId:', mathCourse.instructorId);
        } else {
            console.log('Matematik dersi bulunamadı.');
        }

        // 2. Kullanıcıyı oluştur
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('erenk123', salt);

        const newUser = await prisma.user.create({
            data: {
                email: 'erenk123@gmail.com',
                password: hashedPassword,
                name: 'Eren Kayacılar',
                role: 'INSTRUCTOR'
            }
        });

        console.log('\n=== Yeni Kullanıcı Oluşturuldu ===');
        console.log('ID:', newUser.id);
        console.log('Email:', newUser.email);
        console.log('Name:', newUser.name);
        console.log('Role:', newUser.role);

        // 3. Eğer Matematik dersi varsa, instructorId'yi güncelle
        if (mathCourse) {
            await prisma.course.update({
                where: { id: mathCourse.id },
                data: { instructorId: newUser.id }
            });
            console.log('\n=== Matematik Dersi Güncellendi ===');
            console.log('Yeni InstructorId:', newUser.id);
        }

        console.log('\n✅ İşlem başarılı! Giriş bilgileri:');
        console.log('Email: erenk123@gmail.com');
        console.log('Şifre: erenk123');

    } catch (error) {
        console.error('Hata:', error);
    } finally {
        await prisma.$disconnect();
    }
}

recreateUser();
