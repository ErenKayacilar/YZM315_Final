# LMS Platform

Bu proje; web, mobil , desktop üzerinden çalışan, temel öğrenim yönetim sistemi (LMS) özelliklerini içeren bir platformdur.
_____________________________________________________
Web Sitesi Linki : https://lmse.netlify.app/login 
_____________________________________________________

Projenin amacı:
Admin – öğretmen – öğrenci temelli; öğretmenlerin öğrencilere dersler verdiği, sınavların yaptığı, ders içerikleri yüklediği güvenli (anti-cheat) bir uygulama yapmak. (web, mobil, desktop)

Web kısmı =

Özellikleri:
Responsive (tüm ekran boyutlarıyla uyumlu), SPA mimarisi (dinamik şekilde tek sayfa yüklemek), PWA desteği (çevrimdışı özelliği), tarayıcı uyumlu, Lighthouse skoru = 91, çoklu dil (ing, türkçe, almanca), tema desteği (normal – dark).

İçerik – kullanım =
Öğretmen sistemde hesap oluşturur. Eğer hesabı admin tarafından onaylanırsa sisteme giriş yapabilir, ders oluşturabilir. Oluşturduğu derste ders içeriği kısmından öğrencilere kendinin çektiği videoları, youtube gibi kanallardan ders içeriği, ders notları gibi PDF’ler, canlı ders linki veya metin (txt) içeriklerini yükleyebilir. Sınavlar kısmından yeni sınav oluşturabilir, havuzdan ekle seçeneğiyle manuel olarak soru seçip ekleyebilir veya rastgele ekle butonu ile soru tipi ve sayısını seçip rastgele seçilmiş sorulardan oluşan sınav oluşturabilir.
(Soru tipleri = Multiple Choice, Multiple Select, True-False, Short Answer, Long Answer, Ordering, Matching, Fill in blanks, Numeric, Code Snippet).
Ve şıkları karıştır butonu ile şıkları karıştırabilir. Soruları seçtikten sonra Safe Exam Browser’ı aktif edebilir, sınav süresi belirler ve deadline belirler. Yapmış olduğu sınavların sonuçlarını “sonuçları gör” butonuna basarak hangi öğrencisi kaç puan almış görebilir. Öğrenci istekleri kısmından öğrencilerin derse girip giremeyeceklerini (o derse ait olup olmadıklarını) onaylayıp reddedebilir. Soru bankası kısmında manuel soru ekleyebilir veya toplu soru ekle butonuna basarak xlsx, xls, csv formatlarında soruları toplu şekilde soru bankasına yükleyebilir.Özel notlar kısmında sadece kendisinin görebildiği şekilde notlar alabilir, hatırlatmalar ekleyebilir. Öğrenci puanları sekmesinden öğrencilere genel puanlar verebilir. (Derste lab varsa lab puanı da ekleyebilir) Puanları düzenleyebilir.

Öğrenci paneli:

Öğrenci derslere katılma isteği atar. Eğer dersin hocası tarafından onaylanırsa derse katılım sağlayabilir. Müfredat içeriği kısmından hocaların yüklediği video, pdf, linkleri görüntüleyebilir, indirebilir. Sınavlar kısmından hocaların hazırladığı sınavlara girebilir. (Hoca SEB’i aktif ettiyse sadece web, desktoptan girebilir.) Sınav notlarını görüntüleyebilir. Notlarım kısmından sadece kendisinin görebildiği notlar ekleyebilir, yazabilir. (Derse özel notlar).

Admin paneli:

Tüm dersler, öğretmenler, öğrenciler ve içerikleri görüntüler. Öğretmenleri onaylar veya reddeder. Bilgileri düzenleyebilir.

Mobil =

Özellikleri:
iOS desteği (14.0 ve üzeri), Android desteği, offline mod, push bildirimi, biyometrik giriş (parmak izi), çoklu dil (ing, türkçe), karanlık mod, erişilebilirlik.

Optik okuyucu modülü =

Sistemimize özel optik formlarla gerçek zamanlı görüntü, optik form algılama (siyah çizgi tespiti), köşe tespiti, perspektif düzenleme (yan dönmüş fotoğrafı hizalama ile kontrol edip 90° saat yönünde döndürme), bubble okuma, sonuç doğrulama, JSON veri çıktısı, doğru sonuçlarla karşılaştırma.

Desktop –

Özellikleri:
Windows (10/11), macOS (11+), Electron updater ile otomatik güncelleme, sistem tepsisi (arka plan çalışma), dosya sistemi (yerel okuma, yazma), indirme yöneticisi, offline senkron, webcam – mikrofona erişim.

İçeriği – kullanımı:
Öğretmen sistemde hesap oluşturur, admin tarafından onaylanır. Ders oluşturabilir (labsız – lablı). Ders içeriği oluşturabilir (video, PDF, link, canlı ders). Sınav oluşturabilir, soruları havuzdan rastgele – manuel seçer. SEB, deadline, süre belirler. Yapmış olduğu sınavların sonuçlarını görüntüler. Öğrenci isteklerini onaylar – reddeder. Kendine ve derse özel notlar alır. Soru bankasına manuel – toplu soru ekleyebilir. Profil düzenleyebilir. Öğrencilere puanlar verebilir.

Öğrenci girişi:
Derslere istek atar. Hocaların yüklediği içeriklere erişim sağlar, indirir. Hocaların sınavlarına girebilir. Notlarını görüntüleyebilir. Kendine ve derse özel notlar alabilir. Profil güncelleyebilir.

Admin girişi:
Tüm dersler, öğretmenler, öğrenciler ve içerikleri görüntüler. Öğretmenleri onaylar – reddeder. Bilgileri düzenler.

İçeriği – kullanımı:

Öğretmen girişi:
Derslerim kısmında derslerini ve içeriklerini görüntüler.
Modül ekleme = video, PDF, canlı ders linki, metin modüllerini ekleme, görüntüleme.
Sınavlar kısmından sınav ekleme, sınavın detaylarını (SEB, soru havuzundan rastgele–manuel seçimler, deadline, süre, başlık) belirler.
Oluşturduğu sınavların sonuçlarını görüntüler.
Optik oku seçeneğiyle optik formu okuma ve sınav sonuçlarını database’e kaydetme.
Öğrenci isteklerini onaylama ve profil kısmında profil fotoğrafı, şifre, gmail bilgileri gibi bilgileri düzenleme.
Dil, görünüm modlarıyla oynama.

Öğrenci girişi:
Derslere istek atma, kabul edildiği derslere erişim.
Notlarını görüntüleme.
Müfredat içeriklere bakma (video, PDF, canlı link gibi hocanın attığı içeriklere erişim, indirme).
Sınavlar kısmından SEB’siz sınavlara girme.
Sonuçları görme (sınavda kamera erişimi var).
Profilden bilgilerini güncelleme.
Kendine özel ve derse özel notlar almak.
Görünüm, dil ayarlarıyla tercih yapmak.

Admin girişi:
Tüm dersleri, içerikleri, hocaları, öğrencileri görüntüleme.
Düzenleme ve öğretmenleri onaylayıp reddetme.
Profil, tema ayarlarını düzenleme.



