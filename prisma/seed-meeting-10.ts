import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL ortam değişkeni tanımlı değil");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  console.log("Haftalık Saha Toplantı Notları – 10 verisi oluşturuluyor...");

  // 1. Toplantıyı oluştur
  const meeting = await prisma.meeting.create({
    data: {
      title: "Haftalık Saha Toplantı Notları – 10",
      meetingNo: 10,
      type: "HAFTALIK",
      status: "COMPLETED",
      date: new Date("2026-02-25"),
      location: "Saha",
      notes: "GBBVA Genel Müdürlük Renovasyon – Genel Koordinasyon\nYazan: Pelin Sezgin",
    },
  });
  console.log("Toplantı oluşturuldu:", meeting.id);

  // 2. Katılımcılar
  const participants = [
    // GBBVA
    { name: "Mesut Çetin", company: "GBBVA", role: "Katılımcı" },
    { name: "Zafer Kılınç", company: "GBBVA", role: "Katılımcı" },
    { name: "Burcu Özer", company: "GBBVA", role: "Katılımcı" },
    { name: "Ceyhun Işınkan", company: "GBBVA", role: "Katılımcı" },
    // Barış İnş.
    { name: "Zafer Şener", company: "Barış İnş.", role: "Katılımcı" },
    { name: "Rıdvan Halitoğulları", company: "Barış İnş.", role: "Katılımcı" },
    { name: "Nurcan Alpaydın", company: "Barış İnş.", role: "Katılımcı" },
    { name: "Cem Baştoğ", company: "Barış İnş.", role: "Katılımcı" },
    { name: "Seyfullah Sepet", company: "Barış İnş.", role: "Katılımcı" },
    // NSMH
    { name: "Baran Akkoyun", company: "NSMH", role: "Katılımcı" },
    { name: "Elçin Nur Türeli", company: "NSMH", role: "Katılımcı" },
    // CW-TR
    { name: "Pelin Sezgin", company: "CW-TR", role: "Yazan" },
    { name: "Burak Özkoca", company: "CW-TR", role: "Katılımcı" },
    { name: "Mehmet Semiz", company: "CW-TR", role: "Katılımcı" },
    { name: "Süleyman Aktaş", company: "CW-TR", role: "Katılımcı" },
    { name: "Ramazan Akın", company: "CW-TR", role: "Katılımcı" },
  ];

  await prisma.meetingParticipant.createMany({
    data: participants.map((p) => ({ meetingId: meeting.id, ...p, isPresent: true })),
  });
  console.log(`${participants.length} katılımcı eklendi.`);

  // 3. Sütunlar oluştur (varsayılanları kullanmıyoruz, özel sütunlar)
  const colKonu = await prisma.meetingColumn.create({
    data: { meetingId: meeting.id, name: "KONU", type: "text", sortOrder: 0, width: 500 },
  });
  const colIlgili = await prisma.meetingColumn.create({
    data: { meetingId: meeting.id, name: "İLGİLİ", type: "text", sortOrder: 1, width: 160 },
  });
  const colNotTarihi = await prisma.meetingColumn.create({
    data: { meetingId: meeting.id, name: "Not Tarihi", type: "text", sortOrder: 2, width: 130 },
  });
  const colTerminTarihi = await prisma.meetingColumn.create({
    data: { meetingId: meeting.id, name: "Termin Tarihi", type: "text", sortOrder: 3, width: 150 },
  });
  console.log("4 sütun oluşturuldu.");

  // 4. Tüm satırlar (17 madde)
  const rows = [
    {
      rowNumber: 1,
      konu: "1. Kat mock up iş programının güncel termin süreleri ve resmi tatil günlerine göre güncellenerek iletilmesi beklenmektedir.\n2-3.kat iş programlarının yayımlanması beklenmektedir.",
      ilgili: "Barış İnş.",
      notTarihi: "25/02/2026",
      terminTarihi: "02/03/2026",
    },
    {
      rowNumber: 2,
      konu: "Üst yönetim mock up sunumu 3 Mart 2026 sa:10:30 olarak planlanmıştır.\nHazır olacak ve yetişmeyecek imalatlar banka ile paylaşılmıştır.",
      ilgili: "BİLGİ",
      notTarihi: "25/02/2026",
      terminTarihi: "-",
    },
    {
      rowNumber: 3,
      konu: "Statikle ilgili yerindeki durumdan kaynaklı olarak projeden farklı imalat ve ürün kullanımları için Cüneyt Hoca'nın yazılı onayları beklenmektedir.",
      ilgili: "Barış İnş.",
      notTarihi: "11/02/2026",
      terminTarihi: "02/03/2026",
    },
    {
      rowNumber: 4,
      konu: "Sismik askılama kapsamında, açık tavana gelen kısımlar sismik danışmanı ile görüşülerek iptal edilecektir.",
      ilgili: "Barış İnş.",
      notTarihi: "25/02/2026",
      terminTarihi: "BİLGİ",
    },
    {
      rowNumber: 5,
      konu: "Revize sprinkler yerleşimi -yangın danışman onayı olmasına rağmen- yeterli görülmemektedir. Ceyhun Bey yorumlarını mekanik revizyon için Habib Bey'e iletecektir.",
      ilgili: "GBBVA",
      notTarihi: "25/02/2026",
      terminTarihi: "02/03/2026",
    },
    {
      rowNumber: 6,
      konu: "Yerindeki imalatların kontrolü için yangın danışmanı saha ziyareti planlanacaktır.\n- Sprink tesisatı uygulamaları\n- Yangın hattı şaft bağlantısı konuları Kazım Hoca ile yerinde görüşülecek.",
      ilgili: "CW-TR",
      notTarihi: "25/02/2026",
      terminTarihi: "TBD",
    },
    {
      rowNumber: 7,
      konu: "Temiz su borularının Aquatherm'e dönülmesi talep edilmiştir.\nPis su boruları pik boru olarak devam edilecek.",
      ilgili: "Barış İnş.",
      notTarihi: "25/02/2026",
      terminTarihi: "BİLGİ",
    },
    {
      rowNumber: 8,
      konu: "VAV cihazlarının yenilenmesi iptal edilmiş olup mevcut sistemin kullanım ve kapasite hesapları ile ilgili mekanik tasarımcı dönüşü beklenmektedir.",
      ilgili: "Meridyen",
      notTarihi: "25/02/2026",
      terminTarihi: "04/03/2026",
    },
    {
      rowNumber: 9,
      konu: "Mock up katı tavan kapama onayı için imalatlar ve testler tamamlandıktan sonra MEP ekipleri davet edilecektir, sahanın durumuna göre program bilgisi beklenmektedir.",
      ilgili: "",
      notTarihi: "",
      terminTarihi: "",
    },
    {
      rowNumber: 10,
      konu: "Mutfak arıtma cihazları için temiz su hattı ve drenaj altyapıları çekilmelidir.",
      ilgili: "Barış İnş.",
      notTarihi: "25/02/2026",
      terminTarihi: "BİLGİ",
    },
    {
      rowNumber: 11,
      konu: "Mutfak davlumbazı için sacdan davlumbaz kanalı yapılması, fan olmaması, çevresinin boyalı cam olarak yapılması kararlaştırılmıştır.",
      ilgili: "Barış İnş.",
      notTarihi: "25/02/2026",
      terminTarihi: "BİLGİ",
    },
    {
      rowNumber: 12,
      konu: "Tasarım konuları;\n- Mutfak tasarımı için latalı son tasarım onaylanmıştır.\n- Zemin için vinil kaplama ve tezgah için akrilik stoklu ürünlerden seçilecektir. (@NSMH)\n- Aydınlatma armatür ve elektrik anahtar renkleri seçilmelidir. (@NSMH)\n- Sebillerin yenilenip yenilenmeyeceği dönüşü beklenmektedir. (@Ceyhun Işınkan)\n- Sahte kolonların sökülmesi onaylanmıştır.\n- Görüşme odalarında keçe/kumaş panel kullanımı için akustik danışman görüşü beklenmektedir. (@NSMH)",
      ilgili: "NSMH, GBBVA",
      notTarihi: "25/02/2026",
      terminTarihi: "02/03/2026",
    },
    {
      rowNumber: 13,
      konu: "Yangın merdiveni imalatları için alternatif iskele sistemi için yangın danışmanı uygunluk vermiş ancak ıslak imzalı olarak onay vermemiştir.\nBu konu ile ilgili üst yönetim kararına göre ilerlenecektir.",
      ilgili: "Barış İnş.",
      notTarihi: "25/02/2026",
      terminTarihi: "02/03/2026",
    },
    {
      rowNumber: 14,
      konu: "Sahada yoğun koku ve gürültü oluşturan imalatların mesai saatleri dışında planlanması talep edilmiştir. Aksi durumda iş durdurma yapılacaktır.",
      ilgili: "BİLGİ",
      notTarihi: "25/02/2026",
      terminTarihi: "-",
    },
    {
      rowNumber: 15,
      konu: "ISG uzmanı gece vardiyası korunacaktır, bütçeye eklenmiştir.",
      ilgili: "BİLGİ",
      notTarihi: "25/02/2026",
      terminTarihi: "-",
    },
    {
      rowNumber: 16,
      konu: "Ofis katlarının tasarımı için bu aşamada ERİŞİLEBİLİRLİK görüşü alınması önerildi.",
      ilgili: "GBBVA, CW-TR",
      notTarihi: "11/02/2026",
      terminTarihi: "-",
    },
    {
      rowNumber: 17,
      konu: "Kattan yangın merdivenine çıkan yangın kapısı körlenmesi gerekmektedir. Ortak alandaki KGS, menfez vb. kim tarafından söküleceği belirlenmelidir. Körlenecek kapı alanında süpürgelik ilavesi ve tamir gerekecektir.",
      ilgili: "Barış İnş., CW-TR",
      notTarihi: "07/01/2026",
      terminTarihi: "En sona bırakılmıştır",
    },
  ];

  // Her satırı oluştur ve değerleri ekle
  for (const row of rows) {
    const item = await prisma.meetingItem.create({
      data: {
        meetingId: meeting.id,
        rowNumber: row.rowNumber,
        sortOrder: row.rowNumber,
      },
    });

    // Hücre değerleri
    const values = [
      { itemId: item.id, columnId: colKonu.id, value: row.konu },
      { itemId: item.id, columnId: colIlgili.id, value: row.ilgili },
      { itemId: item.id, columnId: colNotTarihi.id, value: row.notTarihi },
      { itemId: item.id, columnId: colTerminTarihi.id, value: row.terminTarihi },
    ];

    await prisma.meetingItemValue.createMany({ data: values });
  }
  console.log(`${rows.length} madde (satır) eklendi.`);

  console.log("\n✅ Toplantı başarıyla oluşturuldu!");
  console.log(`   ID: ${meeting.id}`);
  console.log(`   Başlık: ${meeting.title}`);
  console.log(`   Tarih: 25/02/2026`);
  console.log(`   Katılımcı: ${participants.length}`);
  console.log(`   Satır: ${rows.length}`);
  console.log(`\n   Görüntülemek için: http://localhost:3000/toplanti-tutanaklari/${meeting.id}`);
}

main()
  .catch((e) => {
    console.error("Hata:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
