# LMS Platform

Bu proje, web ve mobil üzerinden çalışan, temel öğrenim yönetim sistemi (LMS) özelliklerini içeren bir platformdur.

## Amaç
- Öğrenci, eğitmen ve yönetici rolleri olan
- Ders, içerik ve sınav yönetimi yapılabilen
- Web ve mobil uygulaması bulunan
- Backend + frontend + mobil uçları çalışan
bir uçtan uca sistem geliştirmek.

## Kullanıcı Rolleri
- Admin
- Manager
- Instructor
- Assistant
- Student
- Guest

## Temel Özellikler

### Kimlik Doğrulama
- Kullanıcı kayıt / giriş
- JWT tabanlı oturum
- Rol bazlı yetkilendirme
- Güvenli şifre saklama (hash)

### Ders Yönetimi
- Ders oluşturma
- Modül / ünite yapısı
- İçerik ekleme (PDF, video link)
- Ders kopyalama

### Sınav & Değerlendirme
- Soru bankası
- Sınav oluşturma
- Rastgele soru seçimi
- Otomatik puanlama
- Sonuç ve not görüntüleme

### Öğrenci Deneyimi
- Ders listesi
- İçerik görüntüleme
- Sınav çözme
- İlerleme takibi

### Mobil Uygulama
- iOS & Android
- Ders ve içerik görüntüleme
- Sınav çözme
- Offline içerik desteği
- Karanlık mod

### Güvenlik
- Input validation
- Rate limiting
- XSS / CSRF korumaları
- Audit log (kritik işlemler)

## Teknoloji Stack

### Backend
- Node.js
- Express
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Docker

### Web
- Next.js
- React
- TypeScript

### Mobile
- React Native
- TypeScript

## Demo Senaryosu
1. Admin giriş yapar, kullanıcıları görür
2. Eğitmen ders oluşturur, içerik ve sınav ekler
3. Öğrenci derse girer, içeriği görüntüler ve sınav çözer
4. Sonuçlar ve notlar görüntülenir