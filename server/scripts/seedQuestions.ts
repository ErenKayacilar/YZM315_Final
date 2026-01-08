import { PrismaClient, QuestionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Question Bank Seed...');

    // 1. Find the User
    const user = await prisma.user.findUnique({
        where: { email: 'erenk123@gmail.com' }
    });

    if (!user) {
        throw new Error('❌ User not found: erenk123@gmail.com');
    }
    console.log(`✅ Found user: ${user.name} (ID: ${user.id})`);

    // 2. Find the Course
    const course = await prisma.course.findFirst({
        where: {
            title: { contains: 'Matematik' },
            instructorId: user.id
        }
    });

    if (!course) {
        throw new Error(`❌ Course containing 'Matematik' not found for instructor ${user.email}`);
    }
    console.log(`✅ Found course: ${course.title} (ID: ${course.id})`);

    // 3. Generate Questions (5 per type = 50 total)
    const questionData: { text: string; type: QuestionType; structure: any; answerKey: any; courseId: number; examId: null }[] = [];

    // --- MULTIPLE_CHOICE (5) ---
    questionData.push(
        { text: '2 + 2 kaçtır?', type: 'MULTIPLE_CHOICE', structure: { options: [{ text: '3' }, { text: '4' }, { text: '5' }, { text: '6' }] }, answerKey: '4', courseId: course.id, examId: null },
        { text: '5 x 3 kaçtır?', type: 'MULTIPLE_CHOICE', structure: { options: [{ text: '8' }, { text: '12' }, { text: '15' }, { text: '18' }] }, answerKey: '15', courseId: course.id, examId: null },
        { text: 'Bir üçgenin iç açıları toplamı kaç derecedir?', type: 'MULTIPLE_CHOICE', structure: { options: [{ text: '90' }, { text: '180' }, { text: '270' }, { text: '360' }] }, answerKey: '180', courseId: course.id, examId: null },
        { text: '√16 kaçtır?', type: 'MULTIPLE_CHOICE', structure: { options: [{ text: '2' }, { text: '4' }, { text: '8' }, { text: '16' }] }, answerKey: '4', courseId: course.id, examId: null },
        { text: '12 / 4 kaçtır?', type: 'MULTIPLE_CHOICE', structure: { options: [{ text: '2' }, { text: '3' }, { text: '4' }, { text: '6' }] }, answerKey: '3', courseId: course.id, examId: null }
    );

    // --- MULTIPLE_SELECT (5) ---
    questionData.push(
        { text: 'Aşağıdakilerden hangileri asal sayıdır?', type: 'MULTIPLE_SELECT', structure: { options: [{ text: '2' }, { text: '4' }, { text: '5' }, { text: '9' }] }, answerKey: ['2', '5'], courseId: course.id, examId: null },
        { text: '10\'dan küçük çift sayılar hangileridir?', type: 'MULTIPLE_SELECT', structure: { options: [{ text: '2' }, { text: '4' }, { text: '6' }, { text: '8' }] }, answerKey: ['2', '4', '6', '8'], courseId: course.id, examId: null },
        { text: 'Aşağıdakilerden hangileri kare sayıdır?', type: 'MULTIPLE_SELECT', structure: { options: [{ text: '1' }, { text: '3' }, { text: '4' }, { text: '9' }] }, answerKey: ['1', '4', '9'], courseId: course.id, examId: null },
        { text: '20\'nin bölenleri hangileridir?', type: 'MULTIPLE_SELECT', structure: { options: [{ text: '1' }, { text: '5' }, { text: '7' }, { text: '10' }] }, answerKey: ['1', '5', '10'], courseId: course.id, examId: null },
        { text: 'Negatif sayılar hangileridir?', type: 'MULTIPLE_SELECT', structure: { options: [{ text: '-3' }, { text: '0' }, { text: '-7' }, { text: '5' }] }, answerKey: ['-3', '-7'], courseId: course.id, examId: null }
    );

    // --- TRUE_FALSE (5) ---
    questionData.push(
        { text: 'Pi sayısı 3.14\'e eşittir.', type: 'TRUE_FALSE', structure: { options: [{ text: 'Doğru' }, { text: 'Yanlış' }] }, answerKey: 'Yanlış', courseId: course.id, examId: null },
        { text: 'Sıfır çift bir sayıdır.', type: 'TRUE_FALSE', structure: { options: [{ text: 'Doğru' }, { text: 'Yanlış' }] }, answerKey: 'Doğru', courseId: course.id, examId: null },
        { text: 'Bir karenin tüm kenarları eşittir.', type: 'TRUE_FALSE', structure: { options: [{ text: 'Doğru' }, { text: 'Yanlış' }] }, answerKey: 'Doğru', courseId: course.id, examId: null },
        { text: '2^3 = 6', type: 'TRUE_FALSE', structure: { options: [{ text: 'Doğru' }, { text: 'Yanlış' }] }, answerKey: 'Yanlış', courseId: course.id, examId: null },
        { text: 'Dikdörtgenin köşegenleri eşit uzunluktadır.', type: 'TRUE_FALSE', structure: { options: [{ text: 'Doğru' }, { text: 'Yanlış' }] }, answerKey: 'Doğru', courseId: course.id, examId: null }
    );

    // --- SHORT_ANSWER (5) ---
    questionData.push(
        { text: '7 + 8 = ?', type: 'SHORT_ANSWER', structure: {}, answerKey: '15', courseId: course.id, examId: null },
        { text: '100 / 10 = ?', type: 'SHORT_ANSWER', structure: {}, answerKey: '10', courseId: course.id, examId: null },
        { text: '3^2 = ?', type: 'SHORT_ANSWER', structure: {}, answerKey: '9', courseId: course.id, examId: null },
        { text: 'Bir dairenin çevresinin çapına oranı nedir? (Sembol olarak)', type: 'SHORT_ANSWER', structure: {}, answerKey: 'pi', courseId: course.id, examId: null },
        { text: '√81 = ?', type: 'SHORT_ANSWER', structure: {}, answerKey: '9', courseId: course.id, examId: null }
    );

    // --- LONG_ANSWER (5) ---
    questionData.push(
        { text: 'Pisagor teoremini açıklayınız ve bir örnek veriniz.', type: 'LONG_ANSWER', structure: {}, answerKey: null, courseId: course.id, examId: null },
        { text: 'Bir denklemin köklerini bulma yöntemlerini anlatınız.', type: 'LONG_ANSWER', structure: {}, answerKey: null, courseId: course.id, examId: null },
        { text: 'Asal sayıların önemini matematikteki kullanımlarıyla açıklayınız.', type: 'LONG_ANSWER', structure: {}, answerKey: null, courseId: course.id, examId: null },
        { text: 'Üçgenlerin sınıflandırılmasını kenar ve açı özelliklerine göre yapınız.', type: 'LONG_ANSWER', structure: {}, answerKey: null, courseId: course.id, examId: null },
        { text: 'Cebirin günlük hayattaki uygulamalarından üç örnek veriniz.', type: 'LONG_ANSWER', structure: {}, answerKey: null, courseId: course.id, examId: null }
    );

    // --- NUMERIC (5) ---
    questionData.push(
        { text: '15 x 4 = ?', type: 'NUMERIC', structure: {}, answerKey: 60, courseId: course.id, examId: null },
        { text: '144\'ün karekökü nedir?', type: 'NUMERIC', structure: {}, answerKey: 12, courseId: course.id, examId: null },
        { text: 'Kenarları 5 ve 8 olan dikdörtgenin alanı kaçtır?', type: 'NUMERIC', structure: {}, answerKey: 40, courseId: course.id, examId: null },
        { text: '2^10 kaçtır?', type: 'NUMERIC', structure: {}, answerKey: 1024, courseId: course.id, examId: null },
        { text: '1+2+3+...+10 toplamı kaçtır?', type: 'NUMERIC', structure: {}, answerKey: 55, courseId: course.id, examId: null }
    );

    // --- CODE_SNIPPET (5) ---
    questionData.push(
        { text: 'Python ile iki sayının ortalamasını hesaplayan bir fonksiyon yazınız.', type: 'CODE_SNIPPET', structure: { language: 'python' }, answerKey: null, courseId: course.id, examId: null },
        { text: 'JavaScript ile faktöriyel hesaplayan bir fonksiyon yazınız.', type: 'CODE_SNIPPET', structure: { language: 'javascript' }, answerKey: null, courseId: course.id, examId: null },
        { text: 'Python ile bir sayının asal olup olmadığını kontrol eden fonksiyon yazınız.', type: 'CODE_SNIPPET', structure: { language: 'python' }, answerKey: null, courseId: course.id, examId: null },
        { text: 'JavaScript ile Fibonacci dizisinin ilk N elemanını döndüren fonksiyon yazınız.', type: 'CODE_SNIPPET', structure: { language: 'javascript' }, answerKey: null, courseId: course.id, examId: null },
        { text: 'Python ile verilen listenin en büyük elemanını bulan fonksiyon yazınız.', type: 'CODE_SNIPPET', structure: { language: 'python' }, answerKey: null, courseId: course.id, examId: null }
    );

    // --- MATCHING (5) ---
    questionData.push(
        { text: 'Şekilleri kenar sayılarıyla eşleştirin.', type: 'MATCHING', structure: { pairs: [{ left: 'Üçgen', right: '3' }, { left: 'Kare', right: '4' }, { left: 'Beşgen', right: '5' }] }, answerKey: { 'Üçgen': '3', 'Kare': '4', 'Beşgen': '5' }, courseId: course.id, examId: null },
        { text: 'İşlemleri sonuçlarıyla eşleştirin.', type: 'MATCHING', structure: { pairs: [{ left: '2+2', right: '4' }, { left: '3x3', right: '9' }, { left: '10/2', right: '5' }] }, answerKey: { '2+2': '4', '3x3': '9', '10/2': '5' }, courseId: course.id, examId: null },
        { text: 'Sembolleri anlamlarıyla eşleştirin.', type: 'MATCHING', structure: { pairs: [{ left: 'π', right: 'Pi' }, { left: '√', right: 'Kök' }, { left: '∑', right: 'Toplam' }] }, answerKey: { 'π': 'Pi', '√': 'Kök', '∑': 'Toplam' }, courseId: course.id, examId: null },
        { text: 'Geometrik şekilleri alan formülleriyle eşleştirin.', type: 'MATCHING', structure: { pairs: [{ left: 'Kare', right: 'a²' }, { left: 'Dikdörtgen', right: 'a×b' }, { left: 'Üçgen', right: '½×t×h' }] }, answerKey: { 'Kare': 'a²', 'Dikdörtgen': 'a×b', 'Üçgen': '½×t×h' }, courseId: course.id, examId: null },
        { text: 'Kuvvetleri sonuçlarıyla eşleştirin.', type: 'MATCHING', structure: { pairs: [{ left: '2²', right: '4' }, { left: '3²', right: '9' }, { left: '5²', right: '25' }] }, answerKey: { '2²': '4', '3²': '9', '5²': '25' }, courseId: course.id, examId: null }
    );

    // --- ORDERING (5) ---
    questionData.push(
        { text: 'Sayıları küçükten büyüğe sıralayın: 5, 2, 8, 1', type: 'ORDERING', structure: { items: [{ text: '5' }, { text: '2' }, { text: '8' }, { text: '1' }] }, answerKey: ['1', '2', '5', '8'], courseId: course.id, examId: null },
        { text: 'İşlem önceliğine göre sıralayın.', type: 'ORDERING', structure: { items: [{ text: 'Toplama' }, { text: 'Parantez' }, { text: 'Çarpma' }, { text: 'Üs' }] }, answerKey: ['Parantez', 'Üs', 'Çarpma', 'Toplama'], courseId: course.id, examId: null },
        { text: 'Kesirleri küçükten büyüğe sıralayın.', type: 'ORDERING', structure: { items: [{ text: '1/2' }, { text: '1/4' }, { text: '3/4' }, { text: '1/8' }] }, answerKey: ['1/8', '1/4', '1/2', '3/4'], courseId: course.id, examId: null },
        { text: 'Bir denklem çözme adımlarını sıralayın.', type: 'ORDERING', structure: { items: [{ text: 'Denklemi oluştur' }, { text: 'Bilinmeyeni yalnız bırak' }, { text: 'Sonucu kontrol et' }, { text: 'Problemi oku' }] }, answerKey: ['Problemi oku', 'Denklemi oluştur', 'Bilinmeyeni yalnız bırak', 'Sonucu kontrol et'], courseId: course.id, examId: null },
        { text: 'Sayı sistemlerini büyüklüğüne göre sıralayın (küçükten büyüğe).', type: 'ORDERING', structure: { items: [{ text: 'Doğal Sayılar' }, { text: 'Tam Sayılar' }, { text: 'Rasyonel Sayılar' }, { text: 'Gerçek Sayılar' }] }, answerKey: ['Doğal Sayılar', 'Tam Sayılar', 'Rasyonel Sayılar', 'Gerçek Sayılar'], courseId: course.id, examId: null }
    );

    // --- FILL_IN_BLANKS (5) ---
    questionData.push(
        { text: 'Bir karenin alanı ___ x ___ formülüyle bulunur.', type: 'FILL_IN_BLANKS', structure: { blanks: 2 }, answerKey: ['kenar', 'kenar'], courseId: course.id, examId: null },
        { text: 'Üçgenin iç açıları toplamı ___ derecedir.', type: 'FILL_IN_BLANKS', structure: { blanks: 1 }, answerKey: ['180'], courseId: course.id, examId: null },
        { text: 'Pi sayısının ilk 3 hanesi ___\'dır.', type: 'FILL_IN_BLANKS', structure: { blanks: 1 }, answerKey: ['3.14'], courseId: course.id, examId: null },
        { text: '(a+b)² = a² + ___ + b²', type: 'FILL_IN_BLANKS', structure: { blanks: 1 }, answerKey: ['2ab'], courseId: course.id, examId: null },
        { text: 'Bir dairenin çevresi ___ x ___ formülüyle bulunur.', type: 'FILL_IN_BLANKS', structure: { blanks: 2 }, answerKey: ['2πr', 'pi'], courseId: course.id, examId: null }
    );

    // 4. Insert into Database
    console.log(`📦 Inserting ${questionData.length} questions...`);

    await prisma.question.createMany({
        data: questionData
    });

    console.log('✅ Seed completed successfully!');
    console.log(`   📊 Total questions added: ${questionData.length}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
