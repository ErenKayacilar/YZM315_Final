
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkQuestions() {
    try {
        console.log('🔍 Kayak kursu soruları kontrol ediliyor...');

        // 1. Kursu bul
        const course = await prisma.course.findFirst({
            where: {
                title: { contains: 'Kayak', mode: 'insensitive' },
                instructor: { email: 'iskender123@gmail.com' }
            }
        });

        if (!course) {
            console.log('❌ Kurs bulunamadı!');
            return;
        }

        console.log(`✓ Kurs: ${course.title} (ID: ${course.id})`);

        // 2. Soruları say
        const questions = await prisma.question.findMany({
            where: { courseId: course.id }
        });

        console.log(`📊 Toplam Soru Sayısı: ${questions.length}`);

        if (questions.length > 0) {
            console.log('--- İlk 3 Soru ---');
            questions.slice(0, 3).forEach(q => {
                console.log(`[${q.type}] ${q.text.substring(0, 50)}...`);
                // @ts-ignore
                console.log('Structure:', JSON.stringify(q.structure, null, 2));
            });
        }

    } catch (e) {
        console.error('Hata:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkQuestions();
