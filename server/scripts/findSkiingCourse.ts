
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findCourse() {
    try {
        console.log('🔍 "Kayak" içeren ders aranıyor...');
        const courses = await prisma.course.findMany({
            where: {
                title: {
                    contains: 'Kayak',
                    mode: 'insensitive'
                }
            },
            include: {
                instructor: true
            }
        });

        if (courses.length === 0) {
            console.log('❌ "Kayak" isminde ders bulunamadı.');
        } else {
            console.log(`✅ ${courses.length} adet ders bulundu:`);
            courses.forEach(c => {
                console.log(`----------------------------------------`);
                console.log(`ID: ${c.id}`);
                console.log(`Başlık: ${c.title}`);
                console.log(`Eğitmen: ${c.instructor.name} (${c.instructor.email})`);
                console.log(`----------------------------------------`);
            });
        }
    } catch (e) {
        console.error('Hata:', e);
    } finally {
        await prisma.$disconnect();
    }
}

findCourse();
