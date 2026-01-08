
import { PrismaClient, QuestionType } from '@prisma/client';

const prisma = new PrismaClient();

const INSTRUCTOR_EMAIL = 'iskender123@gmail.com';
const COURSE_TITLE_KEYWORD = 'Kayak';

// Helper to generate questions
const generateQuestions = (courseId: number) => {
    const questions = [];

    // 1. MULTIPLE_CHOICE (5 Soru)
    questions.push(
        {
            courseId,
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'Kayak sporunda "slalom" disiplininde kapılar arasındaki mesafe nasıldır?',
            structure: { options: [{ text: 'Çok geniştir' }, { text: 'Kısadır ve sık dönüş gerektirir' }, { text: 'Rastgeledir' }, { text: 'Düzdür' }] },
            answerKey: 'Kısadır ve sık dönüş gerektirir',
        },
        {
            courseId,
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'Yeni başlayanlar için en uygun duruş tekniği hangisidir?',
            structure: { options: [{ text: 'Paralel' }, { text: 'Carving' }, { text: 'Kar Sapani (Pizza)' }, { text: 'Tek ayak' }] },
            answerKey: 'Kar Sapani (Pizza)',
        },
        {
            courseId,
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'Kayak takımlarının altındaki metal kenarlara ne ad verilir?',
            structure: { options: [{ text: 'Çelik' }, { text: 'Kenar (Edge)' }, { text: 'Bıçak' }, { text: 'Ray' }] },
            answerKey: 'Kenar (Edge)',
        },
        {
            courseId,
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'Hangi renk pist en zor seviyeyi temsil eder?',
            structure: { options: [{ text: 'Yeşil' }, { text: 'Mavi' }, { text: 'Kırmızı' }, { text: 'Siyah' }] },
            answerKey: 'Siyah',
        },
        {
            courseId,
            type: QuestionType.MULTIPLE_CHOICE,
            text: 'Kayak batonlarının temel amacı nedir?',
            structure: { options: [{ text: 'Hızlanmak' }, { text: 'Denge sağlamak ve dönüşü başlatmak' }, { text: 'Fren yapmak' }, { text: 'Kar topu oynamak' }] },
            answerKey: 'Denge sağlamak ve dönüşü başlatmak',
        }
    );

    // 2. TRUE_FALSE (5 Soru)
    questions.push(
        {
            courseId,
            type: QuestionType.TRUE_FALSE,
            text: 'Kayak yaparken kask takmak sadece profesyoneller için zorunludur.',
            structure: { options: [{ text: 'Doğru' }, { text: 'Yanlış' }] },
            answerKey: 'Yanlış',
        },
        {
            courseId,
            type: QuestionType.TRUE_FALSE,
            text: 'Kar sapanı (Pizza) tekniği hızı azaltmak için kullanılır.',
            structure: { options: [{ text: 'Doğru' }, { text: 'Yanlış' }] },
            answerKey: 'Doğru',
        },
        {
            courseId,
            type: QuestionType.TRUE_FALSE,
            text: 'Kayak ayakkabıları ayağa bol gelmelidir ki kan dolaşımı rahat olsun.',
            structure: { options: [{ text: 'Doğru' }, { text: 'Yanlış' }] },
            answerKey: 'Yanlış',
        },
        {
            courseId,
            type: QuestionType.TRUE_FALSE,
            text: 'Teleferikte güvenlik barını indirmek zorunludur.',
            structure: { options: [{ text: 'Doğru' }, { text: 'Yanlış' }] },
            answerKey: 'Doğru',
        },
        {
            courseId,
            type: QuestionType.TRUE_FALSE,
            text: 'Buzlu pistlerde kayakların kenarlarını (edge) kullanmak daha zordur.',
            structure: { options: [{ text: 'Doğru' }, { text: 'Yanlış' }] },
            answerKey: 'Doğru',
        }
    );

    // 3. SHORT_ANSWER (5 Soru) - Şık gerekmez
    questions.push(
        {
            courseId,
            type: QuestionType.SHORT_ANSWER,
            text: 'Kayakta dönüş yaparken ağırlığımızı hangi ayağımıza veririz? (İç/Dış)',
            structure: {},
            answerKey: 'Dış',
        },
        {
            courseId,
            type: QuestionType.SHORT_ANSWER,
            text: 'Kayak merkezlerinde yukarı çıkmak için kullanılan sandalyeli sisteme ne ad verilir?',
            structure: {},
            answerKey: 'Telesiyej',
        },
        {
            courseId,
            type: QuestionType.SHORT_ANSWER,
            text: 'Kayak sporunun yapıldığı, sıkıştırılmış karla kaplı alana ne denir?',
            structure: {},
            answerKey: 'Pist',
        },
        {
            courseId,
            type: QuestionType.SHORT_ANSWER,
            text: 'Kayağın kar üzerinde kaymasını sağlayan malzemenin adı nedir (bakım için yapılır)?',
            structure: {},
            answerKey: 'Vaks',
        },
        {
            courseId,
            type: QuestionType.SHORT_ANSWER,
            text: 'Alp disiplini yarışlarında sporcuların geçtiği kırmızı ve mavi işaretlere ne denir?',
            structure: {},
            answerKey: 'Kapı',
        }
    );

    // 4. FILL_IN_BLANKS (5 Soru) - Şık gerekmez
    questions.push(
        {
            courseId,
            type: QuestionType.FILL_IN_BLANKS,
            text: 'Kayak yaparken dizler hafifçe _____ olmalıdır.',
            structure: {},
            answerKey: ['bükülmüş'],
        },
        {
            courseId,
            type: QuestionType.FILL_IN_BLANKS,
            text: '_____ kayak stili, her iki kayağın birbirine paralel tutulduğu ileri seviye bir tekniktir.',
            structure: {},
            answerKey: ['Paralel'],
        },
        {
            courseId,
            type: QuestionType.FILL_IN_BLANKS,
            text: 'Kayak bağlamaları (binding), düşme anında kayağın ayaktan _____ sağlar.',
            structure: {},
            answerKey: ['çıkmasını'],
        },
        {
            courseId,
            type: QuestionType.FILL_IN_BLANKS,
            text: 'Kış olimpiyatlarında kayakla atlama _____ rampadan yapılır.',
            structure: {},
            answerKey: ['yüksek'],
        },
        {
            courseId,
            type: QuestionType.FILL_IN_BLANKS,
            text: 'Çığ tehlikesi olan bölgelerde _____ yapmak yasaktır.',
            structure: {},
            answerKey: ['kayak'],
        }
    );

    // 5. MULTIPLE_SELECT (5 Soru)
    questions.push(
        {
            courseId,
            type: QuestionType.MULTIPLE_SELECT,
            text: 'Hangi ekipmanlar kayak güvenliği için önemlidir? (Birden fazla seçin)',
            structure: { options: [{ text: 'Kask' }, { text: 'Güneş Gözlüğü/Google' }, { text: 'Yüzme Simidi' }, { text: 'Eldiven' }] },
            answerKey: ['Kask', 'Güneş Gözlüğü/Google', 'Eldiven'],
        },
        {
            courseId,
            type: QuestionType.MULTIPLE_SELECT,
            text: 'Kayak disiplinlerinden hangileri kış olimpiyatlarında yer alır?',
            structure: { options: [{ text: 'Slalom' }, { text: 'Dev Slalom' }, { text: 'Su Kayağı' }, { text: 'İniş (Downhill)' }] },
            answerKey: ['Slalom', 'Dev Slalom', 'İniş (Downhill)'],
        },
        {
            courseId,
            type: QuestionType.MULTIPLE_SELECT,
            text: 'Kayak botu seçerken nelere dikkat edilmelidir?',
            structure: { options: [{ text: 'Ayak numarası' }, { text: 'Flex (Sertlik) değeri' }, { text: 'Rengi' }, { text: 'Konfor' }] },
            answerKey: ['Ayak numarası', 'Flex (Sertlik) değeri', 'Konfor'],
        },
        {
            courseId,
            type: QuestionType.MULTIPLE_SELECT,
            text: 'Pist dışı (Off-piste) kayak yapmanın riskleri nelerdir?',
            structure: { options: [{ text: 'Çığ düşmesi' }, { text: 'Kaybolma' }, { text: 'Daha eğlenceli olması' }, { text: 'Gizli kayalar' }] },
            answerKey: ['Çığ düşmesi', 'Kaybolma', 'Gizli kayalar'],
        },
        {
            courseId,
            type: QuestionType.MULTIPLE_SELECT,
            text: 'Hangi ülkeler kayak turizmi ile ünlüdür?',
            structure: { options: [{ text: 'İsviçre' }, { text: 'Mısır' }, { text: 'Avusturya' }, { text: 'Fransa' }] },
            answerKey: ['İsviçre', 'Avusturya', 'Fransa'],
        }
    );

    // 6. ORDERING (5 Soru) -- structure.items expects objects with text property probably, let's verify renderer.
    // QuestionRenderer: const items = ... structure.items?.map((i: any) => i.text) || []);
    // It expects items to have a .text property to render. Yes.
    questions.push(
        {
            courseId,
            type: QuestionType.ORDERING,
            text: 'Kayak giyinme sırasını doğru şekilde sıralayın.',
            structure: { items: [{ text: 'Kayak Pantolonu/Montu' }, { text: 'Termal İçlik' }, { text: 'Kayak Ayakkabısı' }] },
            answerKey: ['Termal İçlik', 'Kayak Pantolonu/Montu', 'Kayak Ayakkabısı'],
        },
        {
            courseId,
            type: QuestionType.ORDERING,
            text: 'Bir dönüş hareketini sıralayın.',
            structure: { items: [{ text: 'Ağırlık transferi' }, { text: 'Dönüşü tamamlama' }, { text: 'Dönüşe bakış' }] },
            answerKey: ['Dönüşe bakış', 'Ağırlık transferi', 'Dönüşü tamamlama'],
        },
        {
            courseId,
            type: QuestionType.ORDERING,
            text: 'Telesiyeje binme sırası.',
            structure: { items: [{ text: 'Turnikeden geç' }, { text: 'Biniş alanında bekle' }, { text: 'Sandalyeye otur ve barı indir' }] },
            answerKey: ['Turnikeden geç', 'Biniş alanında bekle', 'Sandalyeye otur ve barı indir'],
        },
        {
            courseId,
            type: QuestionType.ORDERING,
            text: 'Düşme sonrası kalkış sırası.',
            structure: { items: [{ text: 'Kayakları yamaç aşağı paralel hale getir' }, { text: 'Destek alarak doğrul' }, { text: 'Üstündeki karı temizle' }] },
            answerKey: ['Kayakları yamaç aşağı paralel hale getir', 'Destek alarak doğrul', 'Üstündeki karı temizle'],
        },
        {
            courseId,
            type: QuestionType.ORDERING,
            text: 'Kayak sezonu döngüsü.',
            structure: { items: [{ text: 'İlk Karın Yağması' }, { text: 'Pistlerin Açılması' }, { text: 'Sezon Sonu Erimeleri' }] },
            answerKey: ['İlk Karın Yağması', 'Pistlerin Açılması', 'Sezon Sonu Erimeleri'],
        }
    );

    // 7. MATCHING (5 Soru) - Correct Structure confirmed (pairs: [{left, right}])
    questions.push(
        {
            courseId,
            type: QuestionType.MATCHING,
            text: 'Pist renklerini zorluk dereceleriyle eşleştirin.',
            structure: { pairs: [{ left: 'Yeşil', right: 'Çok Kolay' }, { left: 'Mavi', right: 'Kolay' }, { left: 'Kırmızı', right: 'Orta' }, { left: 'Siyah', right: 'Zor' }] },
            answerKey: { 'Yeşil': 'Çok Kolay', 'Mavi': 'Kolay', 'Kırmızı': 'Orta', 'Siyah': 'Zor' },
        },
        {
            courseId,
            type: QuestionType.MATCHING,
            text: 'Ekipmanları vücut bölgeleriyle eşleştirin.',
            structure: { pairs: [{ left: 'Kask', right: 'Baş' }, { left: 'Goggle', right: 'Göz' }, { left: 'Baton', right: 'El' }] },
            answerKey: { 'Kask': 'Baş', 'Goggle': 'Göz', 'Baton': 'El' },
        },
        {
            courseId,
            type: QuestionType.MATCHING,
            text: 'Disiplinleri özellikleriyle eşleştirin.',
            structure: { pairs: [{ left: 'Slalom', right: 'Kısa dönüşler' }, { left: 'İniş', right: 'Yüksek hız' }, { left: 'Freestyle', right: 'Akrobasi' }] },
            answerKey: { 'Slalom': 'Kısa dönüşler', 'İniş': 'Yüksek hız', 'Freestyle': 'Akrobasi' },
        },
        {
            courseId,
            type: QuestionType.MATCHING,
            text: 'Terimleri anlamlarıyla eşleştirin.',
            structure: { pairs: [{ left: 'Off-piste', right: 'Pist dışı' }, { left: 'Lift', right: 'Asansör' }, { left: 'Skipass', right: 'Giriş Kartı' }] },
            answerKey: { 'Off-piste': 'Pist dışı', 'Lift': 'Asansör', 'Skipass': 'Giriş Kartı' },
        },
        {
            courseId,
            type: QuestionType.MATCHING,
            text: 'Kayak merkezlerini ülkelerle eşleştirin.',
            structure: { pairs: [{ left: 'Uludağ', right: 'Türkiye' }, { left: 'Alpler', right: 'Avrupa' }, { left: 'Aspen', right: 'ABD' }] },
            answerKey: { 'Uludağ': 'Türkiye', 'Alpler': 'Avrupa', 'Aspen': 'ABD' },
        }
    );

    // 8. NUMERIC (5 Soru)
    questions.push(
        {
            courseId,
            type: QuestionType.NUMERIC,
            text: 'Tipik bir kayak dersi kaç saat sürer (ortalama)?',
            structure: {},
            answerKey: 1,
        },
        {
            courseId,
            type: QuestionType.NUMERIC,
            text: 'Bir çift kayakta toplam kaç adet kenar (edge) bulunur? (İç ve dış toplam)',
            structure: {},
            answerKey: 4,
        },
        {
            courseId,
            type: QuestionType.NUMERIC,
            text: 'Profesyonel iniş yarışlarında hız kaç km/s üzerine çıkabilir? (Tahmini alt sınır)',
            structure: {},
            answerKey: 100,
        },
        {
            courseId,
            type: QuestionType.NUMERIC,
            text: 'Kayak batonları genellikle kaç adettir?',
            structure: {},
            answerKey: 2,
        },
        {
            courseId,
            type: QuestionType.NUMERIC,
            text: 'Türkiye\'de önemli kayak merkezi sayısı yaklaşık kaçtır? (En bilinenler: Erciyes, Palandöken, Uludağ, Kartalkaya vb.)',
            structure: {},
            answerKey: 10,
        }
    );

    // 9. CODE_SNIPPET (5 Soru)
    questions.push(
        {
            courseId,
            type: QuestionType.CODE_SNIPPET,
            text: 'Aşağıdaki Python kodu ne hesaplar?\n\n```python\nehim = 30\nif ehim > 45:\n  print("Çığ Riski Yüksek")\nelse:\n  print("Güvenli")\n```',
            structure: { language: 'python' },
            answerKey: 'Güvenli',
        },
        {
            courseId,
            type: QuestionType.CODE_SNIPPET,
            text: 'Kodu tamamlayın: Hız artarsa fren mesafesi _____.\n`fren_mesafesi = hiz * katsayi`',
            structure: { language: 'python' },
            answerKey: 'artar',
        },
        {
            courseId,
            type: QuestionType.CODE_SNIPPET,
            text: 'Bu fonksiyon ne döndürür?\n```javascript\nfunction pistSeviyesi(renk) {\n  if(renk === "Siyah") return "Zor";\n  return "Kolay";\n}\npistSeviyesi("Siyah");\n```',
            structure: { language: 'javascript' },
            answerKey: 'Zor',
        },
        {
            courseId,
            type: QuestionType.CODE_SNIPPET,
            text: 'Döngü kaç kez çalışır?\n`for kapilar in range(1, 11): print("Geçiş")`',
            structure: { language: 'python' },
            answerKey: '10',
        },
        {
            courseId,
            type: QuestionType.CODE_SNIPPET,
            text: 'Hata nerede?\n`kayak_takimi = ["sol", "sag", "yedek"]`\nKayak takımında 3 parça olmaz.',
            structure: { language: 'python' },
            answerKey: 'yedek',
        }
    );

    // 10. LONG_ANSWER (5 Soru)
    questions.push(
        {
            courseId,
            type: QuestionType.LONG_ANSWER,
            text: 'Kayak sporunun fiziksel ve zihinsel faydalarını açıklayınız.',
            structure: {},
            answerKey: {},
        },
        {
            courseId,
            type: QuestionType.LONG_ANSWER,
            text: 'Carving tekniği ile eski stil kayma arasındaki farkları anlatınız.',
            structure: {},
            answerKey: {},
        },
        {
            courseId,
            type: QuestionType.LONG_ANSWER,
            text: 'Bir kayak tatiline giderken çantanızda bulunması gerekenleri listeleyip nedenini açıklayın.',
            structure: {},
            answerKey: {},
        },
        {
            courseId,
            type: QuestionType.LONG_ANSWER,
            text: 'Küresel ısınmanın kış sporları üzerindeki etkilerini tartışınız.',
            structure: {},
            answerKey: {},
        },
        {
            courseId,
            type: QuestionType.LONG_ANSWER,
            text: '"Sorumlu Kayakçı" kuralları (FIS Kuralları) hakkında bildiklerinizi yazınız.',
            structure: {},
            answerKey: {},
        }
    );

    return questions;
};

async function main() {
    try {
        console.log('⛷️ Kayak Soru Bankası Seed İşlemi Başlıyor...');

        // 1. Eğitmeni Bul
        const instructor = await prisma.user.findUnique({
            where: { email: INSTRUCTOR_EMAIL }
        });

        if (!instructor) {
            console.error(`❌ Eğitmen bulunamadı: ${INSTRUCTOR_EMAIL}`);
            return;
        }

        console.log(`✓ Eğitmen bulundu: ${instructor.name} (ID: ${instructor.id})`);

        // 2. Kursu Bul
        const course = await prisma.course.findFirst({
            where: {
                title: { contains: COURSE_TITLE_KEYWORD, mode: 'insensitive' },
                instructorId: instructor.id,
            }
        });

        if (!course) {
            console.error(`❌ "${COURSE_TITLE_KEYWORD}" içeren bir kurs bulunamadı.`);
            return;
        }

        console.log(`✓ Kurs bulundu: "${course.title}" (ID: ${course.id})`);

        // 3. Mevcut soruları temizle
        console.log('🗑️ Mevcut sorular siliniyor...');
        const deleted = await prisma.question.deleteMany({
            where: { courseId: course.id }
        });
        console.log(`✓ ${deleted.count} eski soru silindi.`);

        // 4. Soruları Oluştur
        const questionsData = generateQuestions(course.id);
        console.log(`✓ ${questionsData.length} adet yeni soru hazırlandı.`);

        // 5. Soruları Ekle (Döngü ile)
        let successCount = 0;
        for (const q of questionsData) {
            try {
                await prisma.question.create({ data: q });
                successCount++;
            } catch (err) {
                console.error(`Soru eklenemedi: ${q.text.substring(0, 30)}...`, err);
            }
        }

        console.log(`🎉 Başarılı! ${successCount} soru "${course.title}" soru bankasına eklendi ve güncellendi. (Şıklar düzeltildi)`);

    } catch (e) {
        console.error('Bilinmeyen bir hata oluştu:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
