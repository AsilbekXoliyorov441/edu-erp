import { query, mutation, internalMutation } from './_generated/server'
import { v } from 'convex/values'
import { requireTeacher } from './lib/authz'

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('gifts').collect()
  },
})

export const create = mutation({
  args: { token: v.string(), name: v.string(), icon: v.string(), price: v.number(), image: v.optional(v.string()) },
  handler: async (ctx, { token, name, icon, price, image }) => {
    await requireTeacher(ctx, token)
    return await ctx.db.insert('gifts', { name, icon, price, image })
  },
})

export const update = mutation({
  args: {
    token: v.string(),
    id: v.id('gifts'),
    name: v.string(),
    icon: v.string(),
    price: v.number(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, { token, id, name, icon, price, image }) => {
    await requireTeacher(ctx, token)
    await ctx.db.patch(id, { name, icon, price, image })
  },
})

export const remove = mutation({
  args: { token: v.string(), id: v.id('gifts') },
  handler: async (ctx, { token, id }) => {
    await requireTeacher(ctx, token)
    await ctx.db.delete(id)
  },
})

/** One-time bootstrap of the starter gift catalog — run via:
 * npx convex run gifts:seedDefaults */
export const seedDefaults = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('gifts').first()
    if (existing) return { ok: false, error: 'Gifts already seeded' }

    const defaults = [
      { name: "Stikerlar to'plami", price: 20, icon: 'Sticker' },
      { name: 'Bloknot', price: 40, icon: 'NotebookPen' },
      { name: 'Krujka', price: 60, icon: 'Coffee' },
      { name: 'Flesh-karta 32GB', price: 70, icon: 'Usb' },
      { name: 'PDP kepkasi', price: 90, icon: 'Crown' },
      { name: 'Sichqoncha', price: 130, icon: 'Mouse' },
      { name: 'Futbolka', price: 150, icon: 'Shirt' },
      { name: 'Ryukzak', price: 300, icon: 'Backpack' },
    ]
    for (const gift of defaults) await ctx.db.insert('gifts', gift)
    return { ok: true }
  },
})

/** One-time catalog refresh — replaces every existing gift with the real Uzum product
 * catalog (photo, price, description, category, purchase link). Run via:
 * npx convex run gifts:importProductCatalog */
export const importProductCatalog = internalMutation({
  args: {},
  handler: async (ctx) => {
    const catalog = [
      {
        name: "Simli quloqchin D21",
        description:
          "Asosiy xususiyatlari: 3,5 mm raz'emli smartfon va planshetlar uchun mo'ljallangan.Ovoz va dizayn: Super Bass texnologiyasi va qulay kiyish uchun yengil quloq ichidagi dizayn bilan jihozlangan.",
        category: "Aksessuarlar",
        price: 80,
        link: "https://uzum.uz/uz/product/simli-quloqchin-d21-oq---5-2925273?skuId=10724787",
        image: "https://images.uzum.uz/d8odu4a1146tv07844gg/t_product_540_high.jpg",
      },
      {
        name: "Kovrik",
        description: "Komyuter sichqonchasi uchun gilamcha, 5 xil rangda, 21x25",
        category: "Aksessuarlar",
        price: 91,
        image: "https://images.uzum.uz/d793osq1146ojv9c295g/t_product_540_high.jpg",
      },
      {
        name: "Telefon va planshetlar uchun taglik",
        description:
          "Telefon va planshet uchun plastik buklanadigan taglik — uyda, ofisda va safarda foydalanish uchun qulay aksessuar.",
        category: "Aksessuarlar",
        price: 95,
        image: "https://images.uzum.uz/d80r0321146tv06v9mjg/feedback_40.jpg",
      },
      {
        name: "MEMO qoplamalari",
        description: "Smartfon, PUBG, Fortnite o'yinlari uchun sensor barmoqlar, MEMO o'yin qo'lqoplari",
        category: "Aksessuarlar",
        price: 96,
        link: "https://uzum.uz/uz/product/smartfon-pubg-fortnite-indigo---251-464838?skuId=8076063",
        image: "https://images.uzum.uz/d5i8c33tqdhu87jrha20/original.jpg",
      },
      {
        name: "Universal OTG Type-C",
        description: "Universal OTG Type-C dan USB, USB dan Type-C ga.",
        category: "Aksessuarlar",
        price: 99,
        image: "https://images.uzum.uz/d2a7nr52lln4bo5daklg/original.jpg",
        link: "https://uzum.uz/uz/product/universal-otg-typec-dan-usb-usb-qora---1-1870927?skuId=6572523",
      },
      {
        name: "Hohlagan telfonga mos g'iloflar",
        description: "Istalgam telefon markasi uchun mos qopchiqlar",
        category: "Aksessuarlar",
        price: 94,
        image: "https://images.uzum.uz/d360kafiub30vbrug5cg/original.jpg",
      },
      {
        name: "IPhone Lightning adapteri",
        description:
          "AUX to Type-C va LIGHTNING adapteri 3,5 mm raz'emli aksessuarlarni Type-C va LIGHTNING raz'emli zamonaviy qurilmalarga ulash uchun ideal yechimdir. Ushbu adapter tufayli siz har qanday naushnik yoki naushnikni smartfon, planshet yoki noutbukga ulashda ajoyib ovoz sifatidan bahramand bo'lishingiz mumkin.",
        category: "Aksessuarlar",
        price: 108,
        image: "https://images.uzum.uz/d2rd30l2llnd6jukcch0/original.jpg",
      },
      {
        name: "Bolalar qo'l soati, elektron, qizlar va o'g'il bolalar uchun",
        description: "Bolalar qo'l soati, sensorli, elektron, qizlar va o'g'il bolalar uchun",
        category: "Aksessuarlar",
        price: 126,
        image: "https://images.uzum.uz/ct0cnbdpq3ggq63eqi8g/original.jpg",
        link: "https://uzum.uz/uz/product/bolalar-qol-soati-qora---1-1361451?skuId=4396023",
      },
      {
        name: "Germetik g'ilof telefonigizni suvdan himoya qiling",
        description: "* iPhone, Samsung, Xiaomi, Huawei va boshqa 6,7 dyuymgacha bo'lgan telefonlarga mos keladi",
        category: "Aksessuarlar",
        price: 134,
        image: "https://images.uzum.uz/d06b1aei4n37npaq9vd0/original.jpg",
      },
      {
        name: "IPhone USB-C to Lightning 1 metr kabeli,",
        description:
          "iPhone uchun zaryadka, USB-C - Lightning kabeli 1m — bu sizning iPhone yoki Lightning ulagichli iPad qurilmangizni qulay va ishonchli tarzda zaryad qilish hamda sinxronlashtirish uchun ajoyib yechimdir.",
        category: "Aksessuarlar",
        price: 135,
        image: "https://images.uzum.uz/d1qdsig9oh61u9a4k60g/original.jpg",
      },
      {
        name: "IPhone va Type-C qurilmalar uchun Lightning va Type-C ↔ Lightning adapter",
        description:
          "type c lightning adapter lightning type c adapter iphone uchun adapter iphone uchun perehodnik type c iphone adapter lightning iphone adapter iphone zaryad adapter tez zaryadlash adapter iphone tez zaryadlash type c lightning tez zaryad",
        category: "Aksessuarlar",
        price: 125,
        image: "https://images.uzum.uz/d5u42ajq345o6s40gg70/original.jpg",
      },
      {
        name: "Telefoningizni qulay va xavfsiz ushlab turish uchun mo'ljallangan universal holder",
        description:
          "Universal – barcha smartfonlarga mos. 360° aylanish funksiyasi. Mustahkam va sirpanmaydigan qisqich. Panel yoki oynaga o'rnatiladi. Oson o'rnatiladi va yechiladi.",
        category: "Aksessuarlar",
        price: 158,
        image: "https://images.uzum.uz/d66obgdsp2tk1m7i49q0/original.jpg",
      },
      {
        name: "Eztek simli sichqonchasi ps/2 ulagichi faqat statsionar kompyuterlar uchun 800 dpi",
        description: "sichqoncha kompyuter statsionar stol usti ps/2 dumaloq 1 800dpi 1000 dpi klik eztek",
        category: "Aksessuarlar",
        price: 155,
        image: "https://images.uzum.uz/d6v6th43obpjedc34ik0/original.jpg",
      },
      {
        name: "IPhone uchun zaryadchik, zaryadnik tez zaryadlovchi 20 Vt",
        description:
          "Type-C 20W tez zaryadlash bloki qurilmalaringizni tez va xavfsiz zaryadlash uchun universal yechimdir. Type-C adapteri 20W quvvatni qo'llab-quvvatlaydi, bu esa iPhone va Android qurilmalarini tez zaryadlashni ta'minlaydi. iPhone 11/12/13/14/15 modellari, iPad, Apple Watch, AirPods, shuningdek, Type-C va Lightning ulagichli barcha Android smartfon va gadjetlari bilan mos keladi.",
        category: "Aksessuarlar",
        price: 181,
        image: "https://images.uzum.uz/d8og4u49g1ktqmlummkg/original.jpg",
      },
      {
        name: "Geymerlar uchun stressga qarshi klaviatura",
        description:
          "Taktil hissiyot: Har bir tugma bosilganda o'ziga xos yoqimli 'click' (shiqillash) ovozi va qarshilikni his qildiradi, bu esa asablarni tinchlantirishga yordam beradi.",
        category: "Aksessuarlar",
        price: 181,
        image: "https://images.uzum.uz/d76gpb43obpufnh8dg6g/original.jpg",
      },
      {
        name: "Simli kompyuter sichqonchasi, o'yinlar uchun",
        description:
          "Ishonchli, tezkor va jim — bu sichqoncha sizni ishda ham, o'yinda ham yutqazmaydi! Ergonomik dizayn va matli korpus qo'lda mukammal yotadi, uzoq soatlar davomida ishlashda charchoqni kamaytiradi.",
        category: "Aksessuarlar",
        price: 190,
        image: "https://images.uzum.uz/d88pv3bsv8vo2t0guft0/original.jpg",
      },
      {
        name: "Simli sichqoncha HP M10 USB, 1000 DPI, qulay va ishonchli",
        description: "1000 DPI – aniq va silliq harakat",
        category: "Aksessuarlar",
        price: 195,
        image: "https://images.uzum.uz/d7lnnki1146tv06qjdj0/original.jpg",
      },
      {
        name: "Kompyuter uchun simli sichqoncha, USB / RGB yorug'ligi / 1200-1600 DPI",
        description:
          "Zamonaviy simli gaming va ofis sichqonchasi — qulaylik, aniqlik va chiroyli dizayn uyg'unligi. Mahsulot kundalik ish, o'qish va o'yin jarayonida qulay foydalanish uchun ishlab chiqilgan.",
        category: "Aksessuarlar",
        price: 195,
        image: "https://images.uzum.uz/d835dh3sv8vo2t0eo800/original.jpg",
      },
      {
        name: "Playstation, printer, kompyuter, monitor, sakkiz uchun quvvat kabeli",
        description: "Mahsulotning o'ram bilan og'irligi (g): 83 g",
        category: "Aksessuarlar",
        price: 195,
        image: "https://images.uzum.uz/d2mut834eu2h0tmp3ojg/original.jpg",
      },
      {
        name: "Kamera va smartfonlar uchun shtativ-tripoid — ixcham va universal",
        description: "Moslashuvchan oyoqlar — istalgan joyda ishlaydi",
        category: "Aksessuarlar",
        price: 195,
        image: "https://images.uzum.uz/d7if3e21146ojv9fvs8g/original.jpg",
      },
      {
        name: "Simsiz Bluetooth quloqchinlar P9, mikrofonli, to'liq o'lchamli",
        description: "Simsiz Bluetooth quloqchinlar P9, mikrofonli, to'liq o'lchamli",
        category: "Aksessuarlar",
        price: 220,
        image: "https://images.uzum.uz/d8l6iq49g1ktqmltbd9g/original.jpg",
      },
      {
        name: "Allohga oson amaliyoti - Ruhiy yuksalish uchun kundalik",
        description:
          "Allohga oson amaliyoti — mo'minlar uchun mo'ljallangan amaliy daftar bo'lib, Alloh bilan bo'lgan munosabatni mustahkamlashga xizmat qiladi. Unda kundalik ibodatlar, amallar va ruhiy mashqlar jamlangan.",
        category: "Kitoblar",
        price: 147,
        image: "https://images.uzum.uz/d6sqlk21146lmcd3bp5g/original.jpg",
      },
      {
        name: "O'lmas Umarbekov - Odam bo'lish qiyin",
        description:
          "Bu qissa yoki hikoya markazida insonning 'odam bo'lish' yo'lidagi ichki kurashi turadi. Asarda qahramonlar orqali shaxsiy manfaat, vijdon, adolat va jamiyat talablari o'rtasidagi ziddiyatlar ko'rsatiladi.",
        category: "Kitoblar",
        price: 143,
        image: "https://images.uzum.uz/d5f51bgjsv1neact8q0g/original.jpg",
      },
      {
        name: "O'gay Ona — Ahmad Lutfi Qozonchi Turk Adabiyotining Ta'sirchan Bestseller Romani RU",
        description:
          "O'gay Ona — turk yozuvchisi Ahmad Lutfi Qozonchi qalamiga mansub ma'naviy va tarbiyaviy roman bo'lib, onalikning ulug' maqomi, farzand tarbiyasi va oilaviy qadriyatlarni chuqur yoritadi.",
        category: "Kitoblar",
        price: 140,
        image: "https://images.uzum.uz/d8cm19jsv8vo2t0i2rlg/original.jpg",
      },
      {
        name: "Abdulla Qahhor, O'g'ri",
        description: "Abdulla Qahhor, O'g'ri",
        category: "Kitoblar",
        image: "https://images.uzum.uz/cv0iqmrvgbkm5ehhadeg/t_product_540_high.jpg",
        price: 153,
        link: "https://uzum.uz/ru/product/abdulla-kahkhor-ogri-1566633?skuId=5159653",
      },
      {
        name: "Bemor, Abdulla Qahhor",
        description:
          "Abdulla Qahhor o'zbek adabiyotiga hikoya janrining betakror ustasi sifatida kirib keldi. U o'zbek Chexovi darajasida e'zozlanadi. Uning hikoyalarida o'zbek xalqining eng yaxshi fazilatlari — o'tkir aql, hayotiy donolik va hazilga moyillik aks etadi.",
        category: "Kitoblar",
        image: "https://images.uzum.uz/cuorf7c5j42bjc4el0m0/t_product_540_high.jpg",
        price: 153,
        link: "https://uzum.uz/ru/product/bemor-abdulla-kakhkhor-1537659?skuId=5051136",
      },
      {
        name: "O'tkir Xoshimov - Daftar hoshiyasidagi bitiklar",
        description: "O'tkir Xoshimov - Daftar hoshiyasidagi bitiklar",
        category: "Kitoblar",
        image: "https://images.uzum.uz/d5iv2cbs2tab83sbkm00/original.jpg",
        price: 158,
        link: "https://uzum.uz/ru/product/otkir-khoshimov-daftar-hoshiyasidagi-bitiklar-2282191?skuId=8168274",
      },
      {
        name: "Erkaklar uchun bir xil rangdagi futbolka – 100% paxta",
        description: "Erkaklar uchun bir xil rangdagi futbolka – 100% paxta",
        category: "Kiyim",
        image: "https://images.uzum.uz/d75m57q1146ojv9ai3i0/t_product_540_high.jpg",
        price: 140,
        link: "https://uzum.uz/uz/product/erkaklar-uchun-bir-qora---1-2500054?skuId=9017353",
      },
      {
        name: "Kepka klassik oq va qora ranglarda, yozgi himoya va uslub",
        description: "Klassik oq va qora ranglarda, yozgi himoya va uslub",
        category: "Kiyim",
        image: "https://images.uzum.uz/d1dd4oql822j34pmt9og/original.jpg",
        price: 130,
        link: "https://uzum.uz/uz/product/uniseks-kepka-klassik-oq---5-1767867?skuId=6148344",
      },
      {
        name: "Kepka, beysbolka",
        description: "Kepka, beysbolka",
        category: "Kiyim",
        image: "https://images.uzum.uz/cifejut40v9pplt508vg/original.jpg",
        price: 135,
        link: "https://uzum.uz/uz/product/kepka-beysbolka-uniseks-kumush-rang---4-533086?skuId=10492900",
      },
      {
        name: "Kepka – erkaklar va ayollar uchun, bahor, yoz, kuz",
        description: "Kepka – erkaklar va ayollar uchun, bahor, yoz, kuz",
        category: "Kiyim",
        image: "https://images.uzum.uz/d83lp9jsv8vo2t0evpm0/t_product_540_high.jpg",
        price: 210,
        link: "https://uzum.uz/uz/product/kepka-erkaklar-va-ayollar-uchun-bahor-kulrang-melanj---248-2815681?skuId=10281111",
      },
      {
        name: "Uzuk zanglamaydigan po'latdan yasalgan",
        description: "Uzuk zanglamaydigan po'latdan yasalgan",
        category: "Texnika",
        image: "https://images.uzum.uz/d85ak8k9g1ktqmlnjmk0/original.jpg",
        price: 74,
        link: "https://uzum.uz/uz/product/nikoh-uzugi-zanglamaydigan-polatdan-yasalgani-kumush-rang---4-2823967?skuId=10573449",
      },
      {
        name: "Tana haroratini o'lchaydigan uzuk",
        description: "Tana haroratini o'lchaydigan uzuk",
        category: "Texnika",
        image: "https://images.uzum.uz/d5mr302i5abomerp0rd0/original.jpg",
        price: 128,
        link: "https://uzum.uz/uz/product/tana-haroratini-olchaydigan-kok---125-2301883?skuId=8243236",
      },
    ]

    const existing = await ctx.db.query('gifts').collect()
    for (const gift of existing) await ctx.db.delete(gift._id)
    for (const gift of catalog) await ctx.db.insert('gifts', gift)
    return { ok: true, count: catalog.length }
  },
})
