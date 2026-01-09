import { PrismaClient, Role } from '@prisma/client' // 1. Role buraya eklendi
import * as bcrypt from 'bcrypt' // 2. Şifreleme için bcrypt eklendi

const prisma = new PrismaClient()

async function main() {
  const emailToMakeAdmin = 'admin@lms.com' 
  const rawPassword = '123456' // Admin şifresi bu olacak

  // Şifreyi hashliyoruz (yoksa giriş yapamazsınız)
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  try { // 3. TRY bloğu eklendi
    const admin = await prisma.user.upsert({
        where: { email: emailToMakeAdmin },
        update: {
            // Eğer kullanıcı zaten varsa, sadece rolünü ADMIN yap ve onayla
            role: Role.ADMIN,
            isApproved: true,
        },
        create: {
            email: emailToMakeAdmin,
            password: hashedPassword, // Hashlenmiş şifre
            name: 'Sistem Yöneticisi',
            role: Role.ADMIN,
            isApproved: true,
        },
    });
    console.log(`✅ BAŞARILI: ${emailToMakeAdmin} hesabı (Şifre: ${rawPassword}) ADMIN olarak ayarlandı!`)
  } catch (e) {
    console.log("❌ Bir hata oluştu:", e)
  }
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })