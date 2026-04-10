import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL ortam değişkeni tanımlı değil");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

/* ══════════════════════════════════════════════════════════
   İMALAT TAKİP SEED DATA
   Konut projesi için standart imalat kalemleri
   ══════════════════════════════════════════════════════════ */

type Yer = "DUVAR" | "TAVAN" | "DOSEME" | "DUVAR_TAVAN" | "ALIN_SAKAL" | "GENEL" | "DIGER";

interface ImalatItem {
  siraNo: number;
  yer: Yer;
  aciklama: string;
  disiplin: string;
}

interface MahalDefinition {
  name: string;
  items: ImalatItem[];
}

/* ─── MAHAL TANIMLARI ─── */
const mahalTanimlari: MahalDefinition[] = [
  /* ═══ 1. ANTRE ═══ */
  {
    name: "ANTRE",
    items: [
      { siraNo: 1,  yer: "DUVAR",  aciklama: "Alçıpan duvar - Karkas + Tek yüz kapama", disiplin: "İnşaat" },
      { siraNo: 2,  yer: "DUVAR",  aciklama: "Alçıpan duvar - Karkas + Çift yüz kapama", disiplin: "İnşaat" },
      { siraNo: 3,  yer: "DUVAR",  aciklama: "Alçıpan duvar - İzolasyon (Ses yalıtımı)", disiplin: "İnşaat" },
      { siraNo: 4,  yer: "GENEL",  aciklama: "Sıhhi tesisat altyapısı", disiplin: "Mekanik" },
      { siraNo: 5,  yer: "GENEL",  aciklama: "Elektrik altyapısı (Kuvvetli akım)", disiplin: "Elektrik" },
      { siraNo: 6,  yer: "GENEL",  aciklama: "Elektrik altyapısı (Zayıf akım)", disiplin: "Elektrik" },
      { siraNo: 7,  yer: "GENEL",  aciklama: "Yangın algılama altyapısı", disiplin: "Elektrik" },
      { siraNo: 8,  yer: "DUVAR",  aciklama: "Duvar sıvası", disiplin: "İnşaat" },
      { siraNo: 9,  yer: "TAVAN",  aciklama: "Tavan sıvası", disiplin: "İnşaat" },
      { siraNo: 10, yer: "DOSEME", aciklama: "Şap", disiplin: "İnşaat" },
      { siraNo: 11, yer: "DOSEME", aciklama: "Mermer / Doğaltaş döşeme kaplama", disiplin: "İnşaat" },
      { siraNo: 12, yer: "DUVAR",  aciklama: "Duvar boyası (Astar + Son kat)", disiplin: "Boya" },
      { siraNo: 13, yer: "TAVAN",  aciklama: "Tavan boyası", disiplin: "Boya" },
      { siraNo: 14, yer: "GENEL",  aciklama: "Giriş kapısı kasa montajı", disiplin: "İnşaat" },
      { siraNo: 15, yer: "GENEL",  aciklama: "Giriş kapısı kanat montajı", disiplin: "İnşaat" },
      { siraNo: 16, yer: "DOSEME", aciklama: "Süpürgelik", disiplin: "İnşaat" },
      { siraNo: 17, yer: "DOSEME", aciklama: "Mermer eşik", disiplin: "İnşaat" },
      { siraNo: 18, yer: "DUVAR",  aciklama: "Priz / Anahtar montajı", disiplin: "Elektrik" },
      { siraNo: 19, yer: "TAVAN",  aciklama: "Aydınlatma armatürü", disiplin: "Elektrik" },
      { siraNo: 20, yer: "GENEL",  aciklama: "Kapı zili / İnterkom montajı", disiplin: "Elektrik" },
    ],
  },

  /* ═══ 2. İÇ HOL ═══ */
  {
    name: "İÇ HOL",
    items: [
      { siraNo: 1,  yer: "DUVAR",  aciklama: "Alçıpan duvar - Karkas + Tek yüz kapama", disiplin: "İnşaat" },
      { siraNo: 2,  yer: "DUVAR",  aciklama: "Alçıpan duvar - Karkas + Çift yüz kapama", disiplin: "İnşaat" },
      { siraNo: 3,  yer: "DUVAR",  aciklama: "Alçıpan duvar - İzolasyon (Ses yalıtımı)", disiplin: "İnşaat" },
      { siraNo: 4,  yer: "GENEL",  aciklama: "Sıhhi tesisat altyapısı", disiplin: "Mekanik" },
      { siraNo: 5,  yer: "GENEL",  aciklama: "Elektrik altyapısı (Kuvvetli akım)", disiplin: "Elektrik" },
      { siraNo: 6,  yer: "GENEL",  aciklama: "Elektrik altyapısı (Zayıf akım)", disiplin: "Elektrik" },
      { siraNo: 7,  yer: "GENEL",  aciklama: "Klima altyapısı", disiplin: "Mekanik" },
      { siraNo: 8,  yer: "GENEL",  aciklama: "Yangın algılama altyapısı", disiplin: "Elektrik" },
      { siraNo: 9,  yer: "DUVAR",  aciklama: "Duvar sıvası", disiplin: "İnşaat" },
      { siraNo: 10, yer: "TAVAN",  aciklama: "Tavan sıvası / Alçıpan tavan", disiplin: "İnşaat" },
      { siraNo: 11, yer: "DOSEME", aciklama: "Şap", disiplin: "İnşaat" },
      { siraNo: 12, yer: "DOSEME", aciklama: "Parke döşeme", disiplin: "İnşaat" },
      { siraNo: 13, yer: "DUVAR",  aciklama: "Duvar boyası (Astar + Son kat)", disiplin: "Boya" },
      { siraNo: 14, yer: "TAVAN",  aciklama: "Tavan boyası", disiplin: "Boya" },
      { siraNo: 15, yer: "GENEL",  aciklama: "İç kapı kasası montajı", disiplin: "İnşaat" },
      { siraNo: 16, yer: "GENEL",  aciklama: "İç kapı kanadı montajı", disiplin: "İnşaat" },
      { siraNo: 17, yer: "DOSEME", aciklama: "Süpürgelik", disiplin: "İnşaat" },
      { siraNo: 18, yer: "DOSEME", aciklama: "Mermer eşik", disiplin: "İnşaat" },
      { siraNo: 19, yer: "DUVAR",  aciklama: "Priz / Anahtar montajı", disiplin: "Elektrik" },
      { siraNo: 20, yer: "TAVAN",  aciklama: "Aydınlatma armatürü", disiplin: "Elektrik" },
      { siraNo: 21, yer: "TAVAN",  aciklama: "Asma tavan", disiplin: "İnşaat" },
    ],
  },

  /* ═══ 3. SALON ═══ */
  {
    name: "SALON",
    items: [
      { siraNo: 1,  yer: "DUVAR",  aciklama: "Alçıpan duvar - Karkas + Tek yüz kapama", disiplin: "İnşaat" },
      { siraNo: 2,  yer: "DUVAR",  aciklama: "Alçıpan duvar - Karkas + Çift yüz kapama", disiplin: "İnşaat" },
      { siraNo: 3,  yer: "DUVAR",  aciklama: "Alçıpan duvar - İzolasyon (Ses yalıtımı)", disiplin: "İnşaat" },
      { siraNo: 4,  yer: "DUVAR",  aciklama: "Alçıpan duvar - İzolasyon (Isı yalıtımı)", disiplin: "İnşaat" },
      { siraNo: 5,  yer: "GENEL",  aciklama: "Sıhhi tesisat altyapısı", disiplin: "Mekanik" },
      { siraNo: 6,  yer: "GENEL",  aciklama: "Elektrik altyapısı (Kuvvetli akım)", disiplin: "Elektrik" },
      { siraNo: 7,  yer: "GENEL",  aciklama: "Elektrik altyapısı (Zayıf akım)", disiplin: "Elektrik" },
      { siraNo: 8,  yer: "GENEL",  aciklama: "Klima altyapısı", disiplin: "Mekanik" },
      { siraNo: 9,  yer: "GENEL",  aciklama: "Yangın algılama altyapısı", disiplin: "Elektrik" },
      { siraNo: 10, yer: "DUVAR",  aciklama: "Duvar sıvası", disiplin: "İnşaat" },
      { siraNo: 11, yer: "TAVAN",  aciklama: "Tavan sıvası / Alçıpan tavan", disiplin: "İnşaat" },
      { siraNo: 12, yer: "DOSEME", aciklama: "Şap", disiplin: "İnşaat" },
      { siraNo: 13, yer: "DOSEME", aciklama: "Parke döşeme", disiplin: "İnşaat" },
      { siraNo: 14, yer: "DUVAR",  aciklama: "Duvar boyası (Astar + Son kat)", disiplin: "Boya" },
      { siraNo: 15, yer: "TAVAN",  aciklama: "Tavan boyası", disiplin: "Boya" },
      { siraNo: 16, yer: "DOSEME", aciklama: "Süpürgelik", disiplin: "İnşaat" },
      { siraNo: 17, yer: "DOSEME", aciklama: "Mermer eşik", disiplin: "İnşaat" },
      { siraNo: 18, yer: "DUVAR",  aciklama: "Denizlik", disiplin: "İnşaat" },
      { siraNo: 19, yer: "DUVAR",  aciklama: "Priz / Anahtar montajı", disiplin: "Elektrik" },
      { siraNo: 20, yer: "TAVAN",  aciklama: "Aydınlatma armatürü", disiplin: "Elektrik" },
      { siraNo: 21, yer: "TAVAN",  aciklama: "Asma tavan", disiplin: "İnşaat" },
      { siraNo: 22, yer: "GENEL",  aciklama: "Perde korniz montajı", disiplin: "İnşaat" },
    ],
  },

  /* ═══ 4. MUTFAK ═══ */
  {
    name: "MUTFAK",
    items: [
      { siraNo: 1,  yer: "DUVAR",  aciklama: "Alçıpan duvar - Karkas + Tek yüz kapama", disiplin: "İnşaat" },
      { siraNo: 2,  yer: "DUVAR",  aciklama: "Alçıpan duvar - Karkas + Çift yüz kapama", disiplin: "İnşaat" },
      { siraNo: 3,  yer: "DUVAR",  aciklama: "Alçıpan duvar - İzolasyon (Ses yalıtımı)", disiplin: "İnşaat" },
      { siraNo: 4,  yer: "GENEL",  aciklama: "Sıhhi tesisat altyapısı", disiplin: "Mekanik" },
      { siraNo: 5,  yer: "GENEL",  aciklama: "Doğalgaz tesisatı", disiplin: "Mekanik" },
      { siraNo: 6,  yer: "GENEL",  aciklama: "Elektrik altyapısı (Kuvvetli akım)", disiplin: "Elektrik" },
      { siraNo: 7,  yer: "GENEL",  aciklama: "Elektrik altyapısı (Zayıf akım)", disiplin: "Elektrik" },
      { siraNo: 8,  yer: "GENEL",  aciklama: "Klima altyapısı", disiplin: "Mekanik" },
      { siraNo: 9,  yer: "GENEL",  aciklama: "Yangın algılama altyapısı", disiplin: "Elektrik" },
      { siraNo: 10, yer: "GENEL",  aciklama: "Davlumbaz havalandırma kanalı", disiplin: "Mekanik" },
      { siraNo: 11, yer: "DUVAR",  aciklama: "Duvar sıvası", disiplin: "İnşaat" },
      { siraNo: 12, yer: "TAVAN",  aciklama: "Tavan sıvası / Alçıpan tavan", disiplin: "İnşaat" },
      { siraNo: 13, yer: "DOSEME", aciklama: "Şap", disiplin: "İnşaat" },
      { siraNo: 14, yer: "DOSEME", aciklama: "Seramik döşeme kaplama", disiplin: "İnşaat" },
      { siraNo: 15, yer: "DUVAR",  aciklama: "Seramik duvar kaplama (Tezgah arası)", disiplin: "İnşaat" },
      { siraNo: 16, yer: "DUVAR",  aciklama: "Duvar boyası (Astar + Son kat)", disiplin: "Boya" },
      { siraNo: 17, yer: "TAVAN",  aciklama: "Tavan boyası", disiplin: "Boya" },
      { siraNo: 18, yer: "GENEL",  aciklama: "Mutfak dolabı montajı (Alt + Üst)", disiplin: "Mobilya" },
      { siraNo: 19, yer: "GENEL",  aciklama: "Tezgah montajı", disiplin: "İnşaat" },
      { siraNo: 20, yer: "GENEL",  aciklama: "Evye + Batarya montajı", disiplin: "Mekanik" },
      { siraNo: 21, yer: "GENEL",  aciklama: "Ankastre cihaz montajı (Fırın/Ocak)", disiplin: "Elektrik" },
      { siraNo: 22, yer: "GENEL",  aciklama: "Davlumbaz montajı", disiplin: "Elektrik" },
      { siraNo: 23, yer: "DOSEME", aciklama: "Süpürgelik", disiplin: "İnşaat" },
      { siraNo: 24, yer: "DOSEME", aciklama: "Mermer eşik", disiplin: "İnşaat" },
      { siraNo: 25, yer: "DUVAR",  aciklama: "Denizlik", disiplin: "İnşaat" },
      { siraNo: 26, yer: "DUVAR",  aciklama: "Priz / Anahtar montajı", disiplin: "Elektrik" },
      { siraNo: 27, yer: "TAVAN",  aciklama: "Aydınlatma armatürü", disiplin: "Elektrik" },
    ],
  },

  /* ═══ 5. YATAK ODASI-1 (Ebeveyn) ═══ */
  {
    name: "YATAK ODASI-1",
    items: [
      { siraNo: 1,  yer: "DUVAR",  aciklama: "Alçıpan duvar - Karkas + Tek yüz kapama", disiplin: "İnşaat" },
      { siraNo: 2,  yer: "DUVAR",  aciklama: "Alçıpan duvar - Karkas + Çift yüz kapama", disiplin: "İnşaat" },
      { siraNo: 3,  yer: "DUVAR",  aciklama: "Alçıpan duvar - İzolasyon (Ses yalıtımı)", disiplin: "İnşaat" },
      { siraNo: 4,  yer: "DUVAR",  aciklama: "Alçıpan duvar - İzolasyon (Isı yalıtımı)", disiplin: "İnşaat" },
      { siraNo: 5,  yer: "GENEL",  aciklama: "Sıhhi tesisat altyapısı", disiplin: "Mekanik" },
      { siraNo: 6,  yer: "GENEL",  aciklama: "Elektrik altyapısı (Kuvvetli akım)", disiplin: "Elektrik" },
      { siraNo: 7,  yer: "GENEL",  aciklama: "Elektrik altyapısı (Zayıf akım)", disiplin: "Elektrik" },
      { siraNo: 8,  yer: "GENEL",  aciklama: "Klima altyapısı", disiplin: "Mekanik" },
      { siraNo: 9,  yer: "GENEL",  aciklama: "Yangın algılama altyapısı", disiplin: "Elektrik" },
      { siraNo: 10, yer: "DUVAR",  aciklama: "Duvar sıvası", disiplin: "İnşaat" },
      { siraNo: 11, yer: "TAVAN",  aciklama: "Tavan sıvası / Alçıpan tavan", disiplin: "İnşaat" },
      { siraNo: 12, yer: "DOSEME", aciklama: "Şap", disiplin: "İnşaat" },
      { siraNo: 13, yer: "DOSEME", aciklama: "Parke döşeme", disiplin: "İnşaat" },
      { siraNo: 14, yer: "DUVAR",  aciklama: "Duvar boyası (Astar + Son kat)", disiplin: "Boya" },
      { siraNo: 15, yer: "TAVAN",  aciklama: "Tavan boyası", disiplin: "Boya" },
      { siraNo: 16, yer: "GENEL",  aciklama: "İç kapı kasası montajı", disiplin: "İnşaat" },
      { siraNo: 17, yer: "GENEL",  aciklama: "İç kapı kanadı montajı", disiplin: "İnşaat" },
      { siraNo: 18, yer: "DOSEME", aciklama: "Süpürgelik", disiplin: "İnşaat" },
      { siraNo: 19, yer: "DOSEME", aciklama: "Mermer eşik", disiplin: "İnşaat" },
      { siraNo: 20, yer: "DUVAR",  aciklama: "Denizlik", disiplin: "İnşaat" },
      { siraNo: 21, yer: "DUVAR",  aciklama: "Priz / Anahtar montajı", disiplin: "Elektrik" },
      { siraNo: 22, yer: "TAVAN",  aciklama: "Aydınlatma armatürü", disiplin: "Elektrik" },
      { siraNo: 23, yer: "TAVAN",  aciklama: "Asma tavan", disiplin: "İnşaat" },
      { siraNo: 24, yer: "GENEL",  aciklama: "Gömme dolap montajı", disiplin: "Mobilya" },
      { siraNo: 25, yer: "GENEL",  aciklama: "Perde korniz montajı", disiplin: "İnşaat" },
    ],
  },

  /* ═══ 6. GİYİNME ODASI ═══ */
  {
    name: "GİYİNME ODASI",
    items: [
      { siraNo: 1,  yer: "DUVAR",  aciklama: "Alçıpan duvar - Karkas + Tek yüz kapama", disiplin: "İnşaat" },
      { siraNo: 2,  yer: "DUVAR",  aciklama: "Alçıpan duvar - Karkas + Çift yüz kapama", disiplin: "İnşaat" },
      { siraNo: 3,  yer: "DUVAR",  aciklama: "Alçıpan duvar - İzolasyon (Ses yalıtımı)", disiplin: "İnşaat" },
      { siraNo: 4,  yer: "GENEL",  aciklama: "Elektrik altyapısı (Kuvvetli akım)", disiplin: "Elektrik" },
      { siraNo: 5,  yer: "GENEL",  aciklama: "Elektrik altyapısı (Zayıf akım)", disiplin: "Elektrik" },
      { siraNo: 6,  yer: "GENEL",  aciklama: "Klima altyapısı", disiplin: "Mekanik" },
      { siraNo: 7,  yer: "DUVAR",  aciklama: "Duvar sıvası", disiplin: "İnşaat" },
      { siraNo: 8,  yer: "TAVAN",  aciklama: "Tavan sıvası / Alçıpan tavan", disiplin: "İnşaat" },
      { siraNo: 9,  yer: "DOSEME", aciklama: "Şap", disiplin: "İnşaat" },
      { siraNo: 10, yer: "DOSEME", aciklama: "Parke döşeme", disiplin: "İnşaat" },
      { siraNo: 11, yer: "DUVAR",  aciklama: "Duvar boyası (Astar + Son kat)", disiplin: "Boya" },
      { siraNo: 12, yer: "TAVAN",  aciklama: "Tavan boyası", disiplin: "Boya" },
      { siraNo: 13, yer: "GENEL",  aciklama: "İç kapı kasası montajı", disiplin: "İnşaat" },
      { siraNo: 14, yer: "GENEL",  aciklama: "İç kapı kanadı montajı", disiplin: "İnşaat" },
      { siraNo: 15, yer: "DOSEME", aciklama: "Süpürgelik", disiplin: "İnşaat" },
      { siraNo: 16, yer: "DOSEME", aciklama: "Mermer eşik", disiplin: "İnşaat" },
      { siraNo: 17, yer: "DUVAR",  aciklama: "Priz / Anahtar montajı", disiplin: "Elektrik" },
      { siraNo: 18, yer: "TAVAN",  aciklama: "Aydınlatma armatürü", disiplin: "Elektrik" },
      { siraNo: 19, yer: "GENEL",  aciklama: "Gömme dolap montajı", disiplin: "Mobilya" },
    ],
  },

  /* ═══ 7. EBEVEYN BANYOSU ═══ */
  {
    name: "EBEVEYN BANYOSU",
    items: [
      { siraNo: 1,  yer: "DUVAR",  aciklama: "Alçıpan duvar - Karkas + Tek yüz kapama", disiplin: "İnşaat" },
      { siraNo: 2,  yer: "DUVAR",  aciklama: "Alçıpan duvar - Karkas + Çift yüz kapama", disiplin: "İnşaat" },
      { siraNo: 3,  yer: "DUVAR",  aciklama: "Alçıpan duvar - İzolasyon (Ses yalıtımı)", disiplin: "İnşaat" },
      { siraNo: 4,  yer: "GENEL",  aciklama: "Sıhhi tesisat altyapısı (Temiz su)", disiplin: "Mekanik" },
      { siraNo: 5,  yer: "GENEL",  aciklama: "Sıhhi tesisat altyapısı (Pis su)", disiplin: "Mekanik" },
      { siraNo: 6,  yer: "GENEL",  aciklama: "Elektrik altyapısı (Kuvvetli akım)", disiplin: "Elektrik" },
      { siraNo: 7,  yer: "GENEL",  aciklama: "Yangın algılama altyapısı", disiplin: "Elektrik" },
      { siraNo: 8,  yer: "GENEL",  aciklama: "Pis su tesisatı - Pik döküm montajı", disiplin: "Mekanik" },
      { siraNo: 9,  yer: "DUVAR",  aciklama: "Duvar sıvası", disiplin: "İnşaat" },
      { siraNo: 10, yer: "TAVAN",  aciklama: "Alçıpan tavan", disiplin: "İnşaat" },
      { siraNo: 11, yer: "DOSEME", aciklama: "Şap", disiplin: "İnşaat" },
      { siraNo: 12, yer: "DOSEME", aciklama: "Su yalıtımı - Zemin", disiplin: "İnşaat" },
      { siraNo: 13, yer: "DUVAR",  aciklama: "Su yalıtımı - Duvar (Islak hacim)", disiplin: "İnşaat" },
      { siraNo: 14, yer: "DUVAR",  aciklama: "Seramik duvar kaplama", disiplin: "İnşaat" },
      { siraNo: 15, yer: "DOSEME", aciklama: "Seramik döşeme kaplama", disiplin: "İnşaat" },
      { siraNo: 16, yer: "DOSEME", aciklama: "Mermer eşik", disiplin: "İnşaat" },
      { siraNo: 17, yer: "TAVAN",  aciklama: "Tavan boyası", disiplin: "Boya" },
      { siraNo: 18, yer: "GENEL",  aciklama: "İç kapı kasası montajı", disiplin: "İnşaat" },
      { siraNo: 19, yer: "GENEL",  aciklama: "İç kapı kanadı montajı", disiplin: "İnşaat" },
      { siraNo: 20, yer: "GENEL",  aciklama: "Vitrifiye montajı (Lavabo)", disiplin: "Mekanik" },
      { siraNo: 21, yer: "GENEL",  aciklama: "Vitrifiye montajı (Klozet)", disiplin: "Mekanik" },
      { siraNo: 22, yer: "GENEL",  aciklama: "Vitrifiye montajı (Duş teknesi / Küvet)", disiplin: "Mekanik" },
      { siraNo: 23, yer: "GENEL",  aciklama: "Batarya montajı (Lavabo)", disiplin: "Mekanik" },
      { siraNo: 24, yer: "GENEL",  aciklama: "Batarya montajı (Duş)", disiplin: "Mekanik" },
      { siraNo: 25, yer: "GENEL",  aciklama: "Duş cam montajı / Duşakabin", disiplin: "İnşaat" },
      { siraNo: 26, yer: "GENEL",  aciklama: "Banyo dolabı montajı", disiplin: "Mobilya" },
      { siraNo: 27, yer: "DUVAR",  aciklama: "Ayna montajı", disiplin: "İnşaat" },
      { siraNo: 28, yer: "GENEL",  aciklama: "Aksesuar montajı (Havluluk, Kağıtlık, vb.)", disiplin: "İnşaat" },
      { siraNo: 29, yer: "DUVAR",  aciklama: "Priz / Anahtar montajı", disiplin: "Elektrik" },
      { siraNo: 30, yer: "TAVAN",  aciklama: "Aydınlatma armatürü", disiplin: "Elektrik" },
      { siraNo: 31, yer: "GENEL",  aciklama: "Havalandırma fanı montajı", disiplin: "Mekanik" },
    ],
  },

  /* ═══ 8. YATAK ODASI-2 ═══ */
  {
    name: "YATAK ODASI-2",
    items: [
      { siraNo: 1,  yer: "DUVAR",  aciklama: "Alçıpan duvar - Karkas + Tek yüz kapama", disiplin: "İnşaat" },
      { siraNo: 2,  yer: "DUVAR",  aciklama: "Alçıpan duvar - Karkas + Çift yüz kapama", disiplin: "İnşaat" },
      { siraNo: 3,  yer: "DUVAR",  aciklama: "Alçıpan duvar - İzolasyon (Ses yalıtımı)", disiplin: "İnşaat" },
      { siraNo: 4,  yer: "DUVAR",  aciklama: "Alçıpan duvar - İzolasyon (Isı yalıtımı)", disiplin: "İnşaat" },
      { siraNo: 5,  yer: "GENEL",  aciklama: "Sıhhi tesisat altyapısı", disiplin: "Mekanik" },
      { siraNo: 6,  yer: "GENEL",  aciklama: "Elektrik altyapısı (Kuvvetli akım)", disiplin: "Elektrik" },
      { siraNo: 7,  yer: "GENEL",  aciklama: "Elektrik altyapısı (Zayıf akım)", disiplin: "Elektrik" },
      { siraNo: 8,  yer: "GENEL",  aciklama: "Klima altyapısı", disiplin: "Mekanik" },
      { siraNo: 9,  yer: "GENEL",  aciklama: "Yangın algılama altyapısı", disiplin: "Elektrik" },
      { siraNo: 10, yer: "DUVAR",  aciklama: "Duvar sıvası", disiplin: "İnşaat" },
      { siraNo: 11, yer: "TAVAN",  aciklama: "Tavan sıvası / Alçıpan tavan", disiplin: "İnşaat" },
      { siraNo: 12, yer: "DOSEME", aciklama: "Şap", disiplin: "İnşaat" },
      { siraNo: 13, yer: "DOSEME", aciklama: "Parke döşeme", disiplin: "İnşaat" },
      { siraNo: 14, yer: "DUVAR",  aciklama: "Duvar boyası (Astar + Son kat)", disiplin: "Boya" },
      { siraNo: 15, yer: "TAVAN",  aciklama: "Tavan boyası", disiplin: "Boya" },
      { siraNo: 16, yer: "GENEL",  aciklama: "İç kapı kasası montajı", disiplin: "İnşaat" },
      { siraNo: 17, yer: "GENEL",  aciklama: "İç kapı kanadı montajı", disiplin: "İnşaat" },
      { siraNo: 18, yer: "DOSEME", aciklama: "Süpürgelik", disiplin: "İnşaat" },
      { siraNo: 19, yer: "DOSEME", aciklama: "Mermer eşik", disiplin: "İnşaat" },
      { siraNo: 20, yer: "DUVAR",  aciklama: "Denizlik", disiplin: "İnşaat" },
      { siraNo: 21, yer: "DUVAR",  aciklama: "Priz / Anahtar montajı", disiplin: "Elektrik" },
      { siraNo: 22, yer: "TAVAN",  aciklama: "Aydınlatma armatürü", disiplin: "Elektrik" },
      { siraNo: 23, yer: "GENEL",  aciklama: "Perde korniz montajı", disiplin: "İnşaat" },
    ],
  },

  /* ═══ 9. YATAK ODASI-3 ═══ */
  {
    name: "YATAK ODASI-3",
    items: [
      { siraNo: 1,  yer: "DUVAR",  aciklama: "Alçıpan duvar - Karkas + Tek yüz kapama", disiplin: "İnşaat" },
      { siraNo: 2,  yer: "DUVAR",  aciklama: "Alçıpan duvar - Karkas + Çift yüz kapama", disiplin: "İnşaat" },
      { siraNo: 3,  yer: "DUVAR",  aciklama: "Alçıpan duvar - İzolasyon (Ses yalıtımı)", disiplin: "İnşaat" },
      { siraNo: 4,  yer: "DUVAR",  aciklama: "Alçıpan duvar - İzolasyon (Isı yalıtımı)", disiplin: "İnşaat" },
      { siraNo: 5,  yer: "GENEL",  aciklama: "Sıhhi tesisat altyapısı", disiplin: "Mekanik" },
      { siraNo: 6,  yer: "GENEL",  aciklama: "Elektrik altyapısı (Kuvvetli akım)", disiplin: "Elektrik" },
      { siraNo: 7,  yer: "GENEL",  aciklama: "Elektrik altyapısı (Zayıf akım)", disiplin: "Elektrik" },
      { siraNo: 8,  yer: "GENEL",  aciklama: "Klima altyapısı", disiplin: "Mekanik" },
      { siraNo: 9,  yer: "GENEL",  aciklama: "Yangın algılama altyapısı", disiplin: "Elektrik" },
      { siraNo: 10, yer: "DUVAR",  aciklama: "Duvar sıvası", disiplin: "İnşaat" },
      { siraNo: 11, yer: "TAVAN",  aciklama: "Tavan sıvası / Alçıpan tavan", disiplin: "İnşaat" },
      { siraNo: 12, yer: "DOSEME", aciklama: "Şap", disiplin: "İnşaat" },
      { siraNo: 13, yer: "DOSEME", aciklama: "Parke döşeme", disiplin: "İnşaat" },
      { siraNo: 14, yer: "DUVAR",  aciklama: "Duvar boyası (Astar + Son kat)", disiplin: "Boya" },
      { siraNo: 15, yer: "TAVAN",  aciklama: "Tavan boyası", disiplin: "Boya" },
      { siraNo: 16, yer: "GENEL",  aciklama: "İç kapı kasası montajı", disiplin: "İnşaat" },
      { siraNo: 17, yer: "GENEL",  aciklama: "İç kapı kanadı montajı", disiplin: "İnşaat" },
      { siraNo: 18, yer: "DOSEME", aciklama: "Süpürgelik", disiplin: "İnşaat" },
      { siraNo: 19, yer: "DOSEME", aciklama: "Mermer eşik", disiplin: "İnşaat" },
      { siraNo: 20, yer: "DUVAR",  aciklama: "Denizlik", disiplin: "İnşaat" },
      { siraNo: 21, yer: "DUVAR",  aciklama: "Priz / Anahtar montajı", disiplin: "Elektrik" },
      { siraNo: 22, yer: "TAVAN",  aciklama: "Aydınlatma armatürü", disiplin: "Elektrik" },
      { siraNo: 23, yer: "GENEL",  aciklama: "Perde korniz montajı", disiplin: "İnşaat" },
    ],
  },

  /* ═══ 10. ÇOCUK BANYOSU ═══ */
  {
    name: "ÇOCUK BANYOSU",
    items: [
      { siraNo: 1,  yer: "DUVAR",  aciklama: "Alçıpan duvar - Karkas + Tek yüz kapama", disiplin: "İnşaat" },
      { siraNo: 2,  yer: "DUVAR",  aciklama: "Alçıpan duvar - Karkas + Çift yüz kapama", disiplin: "İnşaat" },
      { siraNo: 3,  yer: "DUVAR",  aciklama: "Alçıpan duvar - İzolasyon (Ses yalıtımı)", disiplin: "İnşaat" },
      { siraNo: 4,  yer: "GENEL",  aciklama: "Sıhhi tesisat altyapısı (Temiz su)", disiplin: "Mekanik" },
      { siraNo: 5,  yer: "GENEL",  aciklama: "Sıhhi tesisat altyapısı (Pis su)", disiplin: "Mekanik" },
      { siraNo: 6,  yer: "GENEL",  aciklama: "Elektrik altyapısı (Kuvvetli akım)", disiplin: "Elektrik" },
      { siraNo: 7,  yer: "GENEL",  aciklama: "Yangın algılama altyapısı", disiplin: "Elektrik" },
      { siraNo: 8,  yer: "GENEL",  aciklama: "Pis su tesisatı - Pik döküm montajı", disiplin: "Mekanik" },
      { siraNo: 9,  yer: "DUVAR",  aciklama: "Duvar sıvası", disiplin: "İnşaat" },
      { siraNo: 10, yer: "TAVAN",  aciklama: "Alçıpan tavan", disiplin: "İnşaat" },
      { siraNo: 11, yer: "DOSEME", aciklama: "Şap", disiplin: "İnşaat" },
      { siraNo: 12, yer: "DOSEME", aciklama: "Su yalıtımı - Zemin", disiplin: "İnşaat" },
      { siraNo: 13, yer: "DUVAR",  aciklama: "Su yalıtımı - Duvar (Islak hacim)", disiplin: "İnşaat" },
      { siraNo: 14, yer: "DUVAR",  aciklama: "Seramik duvar kaplama", disiplin: "İnşaat" },
      { siraNo: 15, yer: "DOSEME", aciklama: "Seramik döşeme kaplama", disiplin: "İnşaat" },
      { siraNo: 16, yer: "DOSEME", aciklama: "Mermer eşik", disiplin: "İnşaat" },
      { siraNo: 17, yer: "TAVAN",  aciklama: "Tavan boyası", disiplin: "Boya" },
      { siraNo: 18, yer: "GENEL",  aciklama: "İç kapı kasası montajı", disiplin: "İnşaat" },
      { siraNo: 19, yer: "GENEL",  aciklama: "İç kapı kanadı montajı", disiplin: "İnşaat" },
      { siraNo: 20, yer: "GENEL",  aciklama: "Vitrifiye montajı (Lavabo)", disiplin: "Mekanik" },
      { siraNo: 21, yer: "GENEL",  aciklama: "Vitrifiye montajı (Klozet)", disiplin: "Mekanik" },
      { siraNo: 22, yer: "GENEL",  aciklama: "Vitrifiye montajı (Duş teknesi)", disiplin: "Mekanik" },
      { siraNo: 23, yer: "GENEL",  aciklama: "Batarya montajı (Lavabo)", disiplin: "Mekanik" },
      { siraNo: 24, yer: "GENEL",  aciklama: "Batarya montajı (Duş)", disiplin: "Mekanik" },
      { siraNo: 25, yer: "GENEL",  aciklama: "Duş cam montajı / Duşakabin", disiplin: "İnşaat" },
      { siraNo: 26, yer: "GENEL",  aciklama: "Banyo dolabı montajı", disiplin: "Mobilya" },
      { siraNo: 27, yer: "DUVAR",  aciklama: "Ayna montajı", disiplin: "İnşaat" },
      { siraNo: 28, yer: "GENEL",  aciklama: "Aksesuar montajı (Havluluk, Kağıtlık, vb.)", disiplin: "İnşaat" },
      { siraNo: 29, yer: "DUVAR",  aciklama: "Priz / Anahtar montajı", disiplin: "Elektrik" },
      { siraNo: 30, yer: "TAVAN",  aciklama: "Aydınlatma armatürü", disiplin: "Elektrik" },
      { siraNo: 31, yer: "GENEL",  aciklama: "Havalandırma fanı montajı", disiplin: "Mekanik" },
    ],
  },

  /* ═══ 11. WC ═══ */
  {
    name: "WC",
    items: [
      { siraNo: 1,  yer: "DUVAR",  aciklama: "Alçıpan duvar - Karkas + Tek yüz kapama", disiplin: "İnşaat" },
      { siraNo: 2,  yer: "DUVAR",  aciklama: "Alçıpan duvar - Karkas + Çift yüz kapama", disiplin: "İnşaat" },
      { siraNo: 3,  yer: "GENEL",  aciklama: "Sıhhi tesisat altyapısı (Temiz su)", disiplin: "Mekanik" },
      { siraNo: 4,  yer: "GENEL",  aciklama: "Sıhhi tesisat altyapısı (Pis su)", disiplin: "Mekanik" },
      { siraNo: 5,  yer: "GENEL",  aciklama: "Elektrik altyapısı (Kuvvetli akım)", disiplin: "Elektrik" },
      { siraNo: 6,  yer: "GENEL",  aciklama: "Pis su tesisatı - Pik döküm montajı", disiplin: "Mekanik" },
      { siraNo: 7,  yer: "DUVAR",  aciklama: "Duvar sıvası", disiplin: "İnşaat" },
      { siraNo: 8,  yer: "TAVAN",  aciklama: "Alçıpan tavan", disiplin: "İnşaat" },
      { siraNo: 9,  yer: "DOSEME", aciklama: "Şap", disiplin: "İnşaat" },
      { siraNo: 10, yer: "DOSEME", aciklama: "Su yalıtımı - Zemin", disiplin: "İnşaat" },
      { siraNo: 11, yer: "DUVAR",  aciklama: "Su yalıtımı - Duvar (Islak hacim)", disiplin: "İnşaat" },
      { siraNo: 12, yer: "DUVAR",  aciklama: "Seramik duvar kaplama", disiplin: "İnşaat" },
      { siraNo: 13, yer: "DOSEME", aciklama: "Seramik döşeme kaplama", disiplin: "İnşaat" },
      { siraNo: 14, yer: "DOSEME", aciklama: "Mermer eşik", disiplin: "İnşaat" },
      { siraNo: 15, yer: "TAVAN",  aciklama: "Tavan boyası", disiplin: "Boya" },
      { siraNo: 16, yer: "GENEL",  aciklama: "İç kapı kasası montajı", disiplin: "İnşaat" },
      { siraNo: 17, yer: "GENEL",  aciklama: "İç kapı kanadı montajı", disiplin: "İnşaat" },
      { siraNo: 18, yer: "GENEL",  aciklama: "Vitrifiye montajı (Lavabo)", disiplin: "Mekanik" },
      { siraNo: 19, yer: "GENEL",  aciklama: "Vitrifiye montajı (Klozet)", disiplin: "Mekanik" },
      { siraNo: 20, yer: "GENEL",  aciklama: "Batarya montajı (Lavabo)", disiplin: "Mekanik" },
      { siraNo: 21, yer: "DUVAR",  aciklama: "Ayna montajı", disiplin: "İnşaat" },
      { siraNo: 22, yer: "GENEL",  aciklama: "Aksesuar montajı (Havluluk, Kağıtlık, vb.)", disiplin: "İnşaat" },
      { siraNo: 23, yer: "DUVAR",  aciklama: "Priz / Anahtar montajı", disiplin: "Elektrik" },
      { siraNo: 24, yer: "TAVAN",  aciklama: "Aydınlatma armatürü", disiplin: "Elektrik" },
      { siraNo: 25, yer: "GENEL",  aciklama: "Havalandırma fanı montajı", disiplin: "Mekanik" },
    ],
  },

  /* ═══ 12. ÇAMAŞIR ODASI ═══ */
  {
    name: "ÇAMAŞIR ODASI",
    items: [
      { siraNo: 1,  yer: "DUVAR",  aciklama: "Alçıpan duvar - Karkas + Tek yüz kapama", disiplin: "İnşaat" },
      { siraNo: 2,  yer: "DUVAR",  aciklama: "Alçıpan duvar - Karkas + Çift yüz kapama", disiplin: "İnşaat" },
      { siraNo: 3,  yer: "GENEL",  aciklama: "Sıhhi tesisat altyapısı", disiplin: "Mekanik" },
      { siraNo: 4,  yer: "GENEL",  aciklama: "Elektrik altyapısı (Kuvvetli akım)", disiplin: "Elektrik" },
      { siraNo: 5,  yer: "GENEL",  aciklama: "Elektrik altyapısı (Zayıf akım)", disiplin: "Elektrik" },
      { siraNo: 6,  yer: "DUVAR",  aciklama: "Duvar sıvası", disiplin: "İnşaat" },
      { siraNo: 7,  yer: "TAVAN",  aciklama: "Tavan sıvası / Alçıpan tavan", disiplin: "İnşaat" },
      { siraNo: 8,  yer: "DOSEME", aciklama: "Şap", disiplin: "İnşaat" },
      { siraNo: 9,  yer: "DOSEME", aciklama: "Su yalıtımı - Zemin", disiplin: "İnşaat" },
      { siraNo: 10, yer: "DOSEME", aciklama: "Seramik döşeme kaplama", disiplin: "İnşaat" },
      { siraNo: 11, yer: "DUVAR",  aciklama: "Seramik duvar kaplama", disiplin: "İnşaat" },
      { siraNo: 12, yer: "DUVAR",  aciklama: "Duvar boyası (Astar + Son kat)", disiplin: "Boya" },
      { siraNo: 13, yer: "TAVAN",  aciklama: "Tavan boyası", disiplin: "Boya" },
      { siraNo: 14, yer: "GENEL",  aciklama: "İç kapı kasası montajı", disiplin: "İnşaat" },
      { siraNo: 15, yer: "GENEL",  aciklama: "İç kapı kanadı montajı", disiplin: "İnşaat" },
      { siraNo: 16, yer: "GENEL",  aciklama: "Çamaşır makinesi musluğu + Gider", disiplin: "Mekanik" },
      { siraNo: 17, yer: "DOSEME", aciklama: "Süpürgelik", disiplin: "İnşaat" },
      { siraNo: 18, yer: "DOSEME", aciklama: "Mermer eşik", disiplin: "İnşaat" },
      { siraNo: 19, yer: "DUVAR",  aciklama: "Priz / Anahtar montajı", disiplin: "Elektrik" },
      { siraNo: 20, yer: "TAVAN",  aciklama: "Aydınlatma armatürü", disiplin: "Elektrik" },
      { siraNo: 21, yer: "GENEL",  aciklama: "Havalandırma fanı montajı", disiplin: "Mekanik" },
    ],
  },

  /* ═══ 13. KİLER ═══ */
  {
    name: "KİLER",
    items: [
      { siraNo: 1,  yer: "DUVAR",  aciklama: "Alçıpan duvar - Karkas + Tek yüz kapama", disiplin: "İnşaat" },
      { siraNo: 2,  yer: "DUVAR",  aciklama: "Alçıpan duvar - Karkas + Çift yüz kapama", disiplin: "İnşaat" },
      { siraNo: 3,  yer: "GENEL",  aciklama: "Elektrik altyapısı (Kuvvetli akım)", disiplin: "Elektrik" },
      { siraNo: 4,  yer: "DUVAR",  aciklama: "Duvar sıvası", disiplin: "İnşaat" },
      { siraNo: 5,  yer: "TAVAN",  aciklama: "Tavan sıvası", disiplin: "İnşaat" },
      { siraNo: 6,  yer: "DOSEME", aciklama: "Şap", disiplin: "İnşaat" },
      { siraNo: 7,  yer: "DOSEME", aciklama: "Seramik döşeme kaplama", disiplin: "İnşaat" },
      { siraNo: 8,  yer: "DUVAR",  aciklama: "Duvar boyası (Astar + Son kat)", disiplin: "Boya" },
      { siraNo: 9,  yer: "TAVAN",  aciklama: "Tavan boyası", disiplin: "Boya" },
      { siraNo: 10, yer: "GENEL",  aciklama: "İç kapı kasası montajı", disiplin: "İnşaat" },
      { siraNo: 11, yer: "GENEL",  aciklama: "İç kapı kanadı montajı", disiplin: "İnşaat" },
      { siraNo: 12, yer: "DOSEME", aciklama: "Süpürgelik", disiplin: "İnşaat" },
      { siraNo: 13, yer: "DOSEME", aciklama: "Mermer eşik", disiplin: "İnşaat" },
      { siraNo: 14, yer: "DUVAR",  aciklama: "Priz / Anahtar montajı", disiplin: "Elektrik" },
      { siraNo: 15, yer: "TAVAN",  aciklama: "Aydınlatma armatürü", disiplin: "Elektrik" },
    ],
  },

  /* ═══ 14. BALKON-1 ═══ */
  {
    name: "BALKON-1",
    items: [
      { siraNo: 1,  yer: "DUVAR",  aciklama: "Alçıpan / Bims duvar tamamlama", disiplin: "İnşaat" },
      { siraNo: 2,  yer: "DUVAR",  aciklama: "Mantolama / Dış cephe yalıtımı", disiplin: "İnşaat" },
      { siraNo: 3,  yer: "GENEL",  aciklama: "Elektrik altyapısı", disiplin: "Elektrik" },
      { siraNo: 4,  yer: "DUVAR",  aciklama: "Dış cephe sıvası", disiplin: "İnşaat" },
      { siraNo: 5,  yer: "TAVAN",  aciklama: "Tavan sıvası", disiplin: "İnşaat" },
      { siraNo: 6,  yer: "DOSEME", aciklama: "Şap (Eğimli)", disiplin: "İnşaat" },
      { siraNo: 7,  yer: "DOSEME", aciklama: "Su yalıtımı - Zemin", disiplin: "İnşaat" },
      { siraNo: 8,  yer: "DOSEME", aciklama: "Seramik döşeme kaplama", disiplin: "İnşaat" },
      { siraNo: 9,  yer: "DUVAR",  aciklama: "Seramik duvar kaplama (Çevre)", disiplin: "İnşaat" },
      { siraNo: 10, yer: "DUVAR",  aciklama: "Dış cephe boyası", disiplin: "Boya" },
      { siraNo: 11, yer: "TAVAN",  aciklama: "Tavan boyası", disiplin: "Boya" },
      { siraNo: 12, yer: "GENEL",  aciklama: "Korkuluk / Cam balkon montajı", disiplin: "İnşaat" },
      { siraNo: 13, yer: "DUVAR",  aciklama: "Denizlik", disiplin: "İnşaat" },
      { siraNo: 14, yer: "DOSEME", aciklama: "Mermer eşik", disiplin: "İnşaat" },
      { siraNo: 15, yer: "DUVAR",  aciklama: "Priz / Anahtar montajı", disiplin: "Elektrik" },
      { siraNo: 16, yer: "TAVAN",  aciklama: "Aydınlatma armatürü", disiplin: "Elektrik" },
      { siraNo: 17, yer: "DOSEME", aciklama: "Balkon gideri", disiplin: "Mekanik" },
    ],
  },

  /* ═══ 15. BALKON-2 ═══ */
  {
    name: "BALKON-2",
    items: [
      { siraNo: 1,  yer: "DUVAR",  aciklama: "Alçıpan / Bims duvar tamamlama", disiplin: "İnşaat" },
      { siraNo: 2,  yer: "DUVAR",  aciklama: "Mantolama / Dış cephe yalıtımı", disiplin: "İnşaat" },
      { siraNo: 3,  yer: "GENEL",  aciklama: "Elektrik altyapısı", disiplin: "Elektrik" },
      { siraNo: 4,  yer: "DUVAR",  aciklama: "Dış cephe sıvası", disiplin: "İnşaat" },
      { siraNo: 5,  yer: "TAVAN",  aciklama: "Tavan sıvası", disiplin: "İnşaat" },
      { siraNo: 6,  yer: "DOSEME", aciklama: "Şap (Eğimli)", disiplin: "İnşaat" },
      { siraNo: 7,  yer: "DOSEME", aciklama: "Su yalıtımı - Zemin", disiplin: "İnşaat" },
      { siraNo: 8,  yer: "DOSEME", aciklama: "Seramik döşeme kaplama", disiplin: "İnşaat" },
      { siraNo: 9,  yer: "DUVAR",  aciklama: "Seramik duvar kaplama (Çevre)", disiplin: "İnşaat" },
      { siraNo: 10, yer: "DUVAR",  aciklama: "Dış cephe boyası", disiplin: "Boya" },
      { siraNo: 11, yer: "TAVAN",  aciklama: "Tavan boyası", disiplin: "Boya" },
      { siraNo: 12, yer: "GENEL",  aciklama: "Korkuluk / Cam balkon montajı", disiplin: "İnşaat" },
      { siraNo: 13, yer: "DUVAR",  aciklama: "Denizlik", disiplin: "İnşaat" },
      { siraNo: 14, yer: "DOSEME", aciklama: "Mermer eşik", disiplin: "İnşaat" },
      { siraNo: 15, yer: "DUVAR",  aciklama: "Priz / Anahtar montajı", disiplin: "Elektrik" },
      { siraNo: 16, yer: "TAVAN",  aciklama: "Aydınlatma armatürü", disiplin: "Elektrik" },
      { siraNo: 17, yer: "DOSEME", aciklama: "Balkon gideri", disiplin: "Mekanik" },
    ],
  },

  /* ═══ 16. TERAS ═══ */
  {
    name: "TERAS",
    items: [
      { siraNo: 1,  yer: "DUVAR",  aciklama: "Alçıpan / Bims duvar tamamlama", disiplin: "İnşaat" },
      { siraNo: 2,  yer: "DUVAR",  aciklama: "Mantolama / Dış cephe yalıtımı", disiplin: "İnşaat" },
      { siraNo: 3,  yer: "GENEL",  aciklama: "Elektrik altyapısı", disiplin: "Elektrik" },
      { siraNo: 4,  yer: "GENEL",  aciklama: "Sıhhi tesisat altyapısı", disiplin: "Mekanik" },
      { siraNo: 5,  yer: "DUVAR",  aciklama: "Dış cephe sıvası", disiplin: "İnşaat" },
      { siraNo: 6,  yer: "TAVAN",  aciklama: "Tavan sıvası", disiplin: "İnşaat" },
      { siraNo: 7,  yer: "DOSEME", aciklama: "Şap (Eğimli)", disiplin: "İnşaat" },
      { siraNo: 8,  yer: "DOSEME", aciklama: "Su yalıtımı - Zemin", disiplin: "İnşaat" },
      { siraNo: 9,  yer: "DOSEME", aciklama: "Seramik / Doğaltaş döşeme kaplama", disiplin: "İnşaat" },
      { siraNo: 10, yer: "DUVAR",  aciklama: "Seramik duvar kaplama (Çevre)", disiplin: "İnşaat" },
      { siraNo: 11, yer: "DUVAR",  aciklama: "Dış cephe boyası", disiplin: "Boya" },
      { siraNo: 12, yer: "TAVAN",  aciklama: "Tavan boyası", disiplin: "Boya" },
      { siraNo: 13, yer: "GENEL",  aciklama: "Korkuluk montajı", disiplin: "İnşaat" },
      { siraNo: 14, yer: "DUVAR",  aciklama: "Denizlik", disiplin: "İnşaat" },
      { siraNo: 15, yer: "DOSEME", aciklama: "Mermer eşik", disiplin: "İnşaat" },
      { siraNo: 16, yer: "DUVAR",  aciklama: "Priz / Anahtar montajı", disiplin: "Elektrik" },
      { siraNo: 17, yer: "TAVAN",  aciklama: "Aydınlatma armatürü", disiplin: "Elektrik" },
      { siraNo: 18, yer: "DOSEME", aciklama: "Teras gideri", disiplin: "Mekanik" },
      { siraNo: 19, yer: "GENEL",  aciklama: "Dış mekan musluğu", disiplin: "Mekanik" },
    ],
  },

  /* ═══ 17. MERDİVEN HOLü ═══ */
  {
    name: "MERDİVEN HOLü",
    items: [
      { siraNo: 1,  yer: "DUVAR",  aciklama: "Alçıpan duvar - Karkas + Tek yüz kapama", disiplin: "İnşaat" },
      { siraNo: 2,  yer: "DUVAR",  aciklama: "Alçıpan duvar - Karkas + Çift yüz kapama", disiplin: "İnşaat" },
      { siraNo: 3,  yer: "GENEL",  aciklama: "Elektrik altyapısı (Kuvvetli akım)", disiplin: "Elektrik" },
      { siraNo: 4,  yer: "GENEL",  aciklama: "Yangın algılama altyapısı", disiplin: "Elektrik" },
      { siraNo: 5,  yer: "DUVAR",  aciklama: "Duvar sıvası", disiplin: "İnşaat" },
      { siraNo: 6,  yer: "TAVAN",  aciklama: "Tavan sıvası", disiplin: "İnşaat" },
      { siraNo: 7,  yer: "DOSEME", aciklama: "Şap", disiplin: "İnşaat" },
      { siraNo: 8,  yer: "DOSEME", aciklama: "Mermer / Doğaltaş döşeme kaplama", disiplin: "İnşaat" },
      { siraNo: 9,  yer: "DOSEME", aciklama: "Merdiven basamak kaplaması", disiplin: "İnşaat" },
      { siraNo: 10, yer: "ALIN_SAKAL", aciklama: "Merdiven alın + Sakal kaplaması", disiplin: "İnşaat" },
      { siraNo: 11, yer: "DUVAR",  aciklama: "Duvar boyası (Astar + Son kat)", disiplin: "Boya" },
      { siraNo: 12, yer: "TAVAN",  aciklama: "Tavan boyası", disiplin: "Boya" },
      { siraNo: 13, yer: "GENEL",  aciklama: "Merdiven korkuluğu montajı", disiplin: "İnşaat" },
      { siraNo: 14, yer: "DOSEME", aciklama: "Süpürgelik", disiplin: "İnşaat" },
      { siraNo: 15, yer: "DUVAR",  aciklama: "Priz / Anahtar montajı", disiplin: "Elektrik" },
      { siraNo: 16, yer: "TAVAN",  aciklama: "Aydınlatma armatürü", disiplin: "Elektrik" },
    ],
  },

  /* ═══ 18. GİRİŞ HOLü (Apartman Giriş) ═══ */
  {
    name: "GİRİŞ HOLü",
    items: [
      { siraNo: 1,  yer: "DUVAR",  aciklama: "Duvar örme (Tuğla/Gazbeton)", disiplin: "İnşaat" },
      { siraNo: 2,  yer: "DUVAR",  aciklama: "Alçıpan duvar - Karkas + Çift yüz kapama", disiplin: "İnşaat" },
      { siraNo: 3,  yer: "GENEL",  aciklama: "Elektrik altyapısı (Kuvvetli akım)", disiplin: "Elektrik" },
      { siraNo: 4,  yer: "GENEL",  aciklama: "Elektrik altyapısı (Zayıf akım)", disiplin: "Elektrik" },
      { siraNo: 5,  yer: "GENEL",  aciklama: "Yangın algılama altyapısı", disiplin: "Elektrik" },
      { siraNo: 6,  yer: "DUVAR",  aciklama: "Duvar sıvası", disiplin: "İnşaat" },
      { siraNo: 7,  yer: "TAVAN",  aciklama: "Tavan sıvası / Alçıpan tavan", disiplin: "İnşaat" },
      { siraNo: 8,  yer: "DOSEME", aciklama: "Şap", disiplin: "İnşaat" },
      { siraNo: 9,  yer: "DOSEME", aciklama: "Mermer / Doğaltaş döşeme kaplama", disiplin: "İnşaat" },
      { siraNo: 10, yer: "DUVAR",  aciklama: "Duvar boyası (Astar + Son kat)", disiplin: "Boya" },
      { siraNo: 11, yer: "TAVAN",  aciklama: "Tavan boyası", disiplin: "Boya" },
      { siraNo: 12, yer: "GENEL",  aciklama: "Giriş kapısı montajı (Bina ana giriş)", disiplin: "İnşaat" },
      { siraNo: 13, yer: "DOSEME", aciklama: "Süpürgelik", disiplin: "İnşaat" },
      { siraNo: 14, yer: "DUVAR",  aciklama: "Priz / Anahtar montajı", disiplin: "Elektrik" },
      { siraNo: 15, yer: "TAVAN",  aciklama: "Aydınlatma armatürü", disiplin: "Elektrik" },
      { siraNo: 16, yer: "GENEL",  aciklama: "Posta kutusu montajı", disiplin: "İnşaat" },
      { siraNo: 17, yer: "GENEL",  aciklama: "İnterkom / Diafon panel montajı", disiplin: "Elektrik" },
    ],
  },

  /* ═══ 19. BODRUM KAT / DEPO ═══ */
  {
    name: "DEPO / BODRUM",
    items: [
      { siraNo: 1,  yer: "DUVAR",  aciklama: "Duvar örme (Tuğla/Gazbeton)", disiplin: "İnşaat" },
      { siraNo: 2,  yer: "GENEL",  aciklama: "Elektrik altyapısı", disiplin: "Elektrik" },
      { siraNo: 3,  yer: "DUVAR",  aciklama: "Duvar sıvası", disiplin: "İnşaat" },
      { siraNo: 4,  yer: "TAVAN",  aciklama: "Tavan sıvası", disiplin: "İnşaat" },
      { siraNo: 5,  yer: "DOSEME", aciklama: "Şap", disiplin: "İnşaat" },
      { siraNo: 6,  yer: "DOSEME", aciklama: "Epoksi / Beton döşeme kaplama", disiplin: "İnşaat" },
      { siraNo: 7,  yer: "DUVAR_TAVAN", aciklama: "Boya (Astar + Son kat)", disiplin: "Boya" },
      { siraNo: 8,  yer: "GENEL",  aciklama: "Çelik kapı montajı", disiplin: "İnşaat" },
      { siraNo: 9,  yer: "DUVAR",  aciklama: "Priz / Anahtar montajı", disiplin: "Elektrik" },
      { siraNo: 10, yer: "TAVAN",  aciklama: "Aydınlatma armatürü", disiplin: "Elektrik" },
    ],
  },

  /* ═══ 20. ORTAK ALAN / SİTE İÇİ ═══ */
  {
    name: "ORTAK ALAN",
    items: [
      { siraNo: 1,  yer: "DUVAR",  aciklama: "Duvar örme / Duvar tamamlama", disiplin: "İnşaat" },
      { siraNo: 2,  yer: "GENEL",  aciklama: "Elektrik altyapısı", disiplin: "Elektrik" },
      { siraNo: 3,  yer: "GENEL",  aciklama: "Mekanik altyapısı", disiplin: "Mekanik" },
      { siraNo: 4,  yer: "GENEL",  aciklama: "Yangın algılama ve söndürme altyapısı", disiplin: "Elektrik" },
      { siraNo: 5,  yer: "DUVAR",  aciklama: "Duvar sıvası", disiplin: "İnşaat" },
      { siraNo: 6,  yer: "TAVAN",  aciklama: "Tavan sıvası / Alçıpan tavan", disiplin: "İnşaat" },
      { siraNo: 7,  yer: "DOSEME", aciklama: "Şap", disiplin: "İnşaat" },
      { siraNo: 8,  yer: "DOSEME", aciklama: "Mermer / Doğaltaş döşeme kaplama", disiplin: "İnşaat" },
      { siraNo: 9,  yer: "DUVAR",  aciklama: "Duvar boyası (Astar + Son kat)", disiplin: "Boya" },
      { siraNo: 10, yer: "TAVAN",  aciklama: "Tavan boyası", disiplin: "Boya" },
      { siraNo: 11, yer: "DOSEME", aciklama: "Süpürgelik", disiplin: "İnşaat" },
      { siraNo: 12, yer: "DUVAR",  aciklama: "Priz / Anahtar montajı", disiplin: "Elektrik" },
      { siraNo: 13, yer: "TAVAN",  aciklama: "Aydınlatma armatürü", disiplin: "Elektrik" },
      { siraNo: 14, yer: "GENEL",  aciklama: "Yangın dolabı montajı", disiplin: "Mekanik" },
      { siraNo: 15, yer: "GENEL",  aciklama: "Asansör montajı", disiplin: "Elektrik" },
    ],
  },
];

/* ─── MAIN ─── */
async function main() {
  // 1️⃣ Proje bul
  const project = await prisma.project.findFirst({ orderBy: { createdAt: "desc" } });
  if (!project) {
    console.error("❌ Veritabanında proje bulunamadı! Önce bir proje oluşturun.");
    process.exit(1);
  }
  console.log(`✅ Proje bulundu: ${project.name} (${project.id})`);

  // 2️⃣ İlk katı bul (Zone üzerinden)
  const floor = await prisma.floor.findFirst({
    where: { zone: { projectId: project.id } },
    orderBy: { orderNo: "asc" },
  });
  if (!floor) {
    console.error("❌ Projede kat bulunamadı! Önce mahal ve kat oluşturun.");
    process.exit(1);
  }
  console.log(`✅ Kat bulundu: ${floor.name} (${floor.id})`);

  // 3️⃣ Disiplinleri çek (name → id map)
  const disciplines = await prisma.discipline.findMany();
  const disciplineMap = new Map(disciplines.map((d) => [d.name, d.id]));
  console.log(`✅ ${disciplines.length} disiplin yüklendi`);

  // Eksik disiplinleri ekle
  const requiredDisciplines = ["Boya", "Mobilya"];
  for (const name of requiredDisciplines) {
    if (!disciplineMap.has(name)) {
      const created = await prisma.discipline.create({ data: { name } });
      disciplineMap.set(name, created.id);
      console.log(`  → Yeni disiplin oluşturuldu: ${name}`);
    }
  }

  // 4️⃣ Mevcut imalat verilerini temizle (bu proje için)
  const deletedKalem = await prisma.imalatKalemi.deleteMany({
    where: { imalatMahal: { projectId: project.id } },
  });
  const deletedMahal = await prisma.imalatMahal.deleteMany({
    where: { projectId: project.id },
  });
  const deletedSablon = await prisma.imalatSablon.deleteMany({
    where: { projectId: project.id },
  });
  console.log(`🗑️  Temizlendi: ${deletedMahal.count} mahal, ${deletedKalem.count} kalem, ${deletedSablon.count} şablon`);

  // 5️⃣ Mahal ve kalemler oluştur
  let totalKalem = 0;
  for (let i = 0; i < mahalTanimlari.length; i++) {
    const mahalDef = mahalTanimlari[i];

    const mahal = await prisma.imalatMahal.create({
      data: {
        projectId: project.id,
        floorId: floor.id,
        name: mahalDef.name,
        sortOrder: i + 1,
      },
    });

    const kalemData = mahalDef.items.map((item) => ({
      imalatMahalId: mahal.id,
      siraNo: item.siraNo,
      imalatAciklama: item.aciklama,
      yer: item.yer as any,
      disciplineId: disciplineMap.get(item.disiplin) || null,
      projeDurumu: "GECERLI" as any,
      imalatDurumu: "YAPILMADI" as any,
    }));

    await prisma.imalatKalemi.createMany({ data: kalemData });
    totalKalem += kalemData.length;
    console.log(`  📦 ${mahalDef.name}: ${kalemData.length} kalem oluşturuldu`);
  }

  console.log(`\n✅ Toplam ${mahalTanimlari.length} mahal, ${totalKalem} kalem oluşturuldu`);

  // 6️⃣ Şablonlar oluştur (benzersiz kalemlerden)
  const uniqueItems = new Map<string, { aciklama: string; yer: string; disiplin: string; sira: number }>();
  for (const mahalDef of mahalTanimlari) {
    for (const item of mahalDef.items) {
      const key = `${item.aciklama}|${item.yer}|${item.disiplin}`;
      if (!uniqueItems.has(key)) {
        uniqueItems.set(key, {
          aciklama: item.aciklama,
          yer: item.yer,
          disiplin: item.disiplin,
          sira: item.siraNo,
        });
      }
    }
  }

  const sablonData = Array.from(uniqueItems.values()).map((item, idx) => ({
    projectId: project.id,
    aciklama: item.aciklama,
    yer: item.yer as any,
    disiplinAdi: item.disiplin,
    varsayilanSira: idx + 1,
  }));

  await prisma.imalatSablon.createMany({ data: sablonData });
  console.log(`✅ ${sablonData.length} benzersiz şablon oluşturuldu`);

  console.log("\n🎉 İmalat takip seed verisi başarıyla yüklendi!");
}

main()
  .catch((e) => {
    console.error("❌ Hata:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
