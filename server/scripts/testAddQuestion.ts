
import { PrismaClient, QuestionType } from '@prisma/client';

const prisma = new PrismaClient();

async function testAdd() {
    try {
        console.log('🧪 Test soru ekleme...');

        // Kurs ID 2 olduğunu biliyoruz (önceki scriptlerden)
        const courseId = 2;

        const q = await prisma.question.create({
            data: {
                courseId: courseId,
                text: 'Test Sorusu 1',
                type: QuestionType.MULTIPLE_CHOICE,
                structure: { options: ['A', 'B'] },
                answerKey: 'A',
                points: 10
            }
        });

        console.log('✅ Soru eklendi:', q);

    } catch (e) {
        console.error('❌ Hata:', e);
    } finally {
        await prisma.$disconnect();
    }
}

testAdd();
