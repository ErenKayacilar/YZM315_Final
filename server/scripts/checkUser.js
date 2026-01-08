const { PrismaClient } = require('@prisma/client');

async function checkUser() {
    const prisma = new PrismaClient();

    try {
        const user = await prisma.user.findUnique({
            where: { email: 'erenk123@gmail.com' }
        });

        if (user) {
            console.log('=== Kullanıcı Bulundu ===');
            console.log('ID:', user.id);
            console.log('Email:', user.email);
            console.log('Name:', user.name);
            console.log('Role:', user.role);
            console.log('Password Hash:', user.password);
            console.log('Phone:', user.phoneNumber);
            console.log('Profile Image:', user.profileImage);
        } else {
            console.log('Kullanıcı bulunamadı: erenk123@gmail.com');

            // Tüm kullanıcıları listele
            console.log('\n=== Tüm Kullanıcılar ===');
            const allUsers = await prisma.user.findMany({
                select: { id: true, email: true, name: true, role: true }
            });
            allUsers.forEach(u => console.log(`ID: ${u.id}, Email: ${u.email}, Name: ${u.name}, Role: ${u.role}`));
        }
    } catch (error) {
        console.error('Hata:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
