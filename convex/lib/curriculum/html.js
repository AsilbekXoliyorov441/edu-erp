import { q, c, topic } from './build'

const S1 = '1-modul. HTML asoslari'
const S2 = '2-modul. Formalar va semantika'
const html = (n, name, section, items) => topic(`${n}-dars. ${name}`, 'html', section, items)

/** HTML: lessons 1–10, each from easy to hard. */
export const HTML = [
  html(1, 'Veb va HTML hujjat tuzilishi', S1, [
    q(`HTML nima?`, `Veb-sahifa tuzilishini belgilovchi belgilash (markup) tili`, [
      `Dasturlash tili`,
      `Ma'lumotlar bazasi bilan ishlash tili`,
      `Sahifaga rang va dizayn beruvchi til`,
    ]),
    q(`HTML fayl qaysi kengaytma bilan saqlanadi?`, `.html`, [`.css`, `.js`, `.htm.txt`]),
    q(`Brauzerga manzil (URL) yozilganda nima sodir bo'ladi?`, `Brauzer serverga so'rov yuboradi va javobda kelgan HTML'ni chizib ko'rsatadi`, [
      `Brauzer sahifani kompyuterdan qidiradi`,
      `Server brauzerga rasm yuboradi, HTML kerak emas`,
      `Brauzer sahifani o'zi yaratadi`,
    ]),
    q(`<!DOCTYPE html> qatori nima uchun yoziladi?`, `Brauzerga hujjat zamonaviy HTML5 standartida ekanini bildiradi`, [
      `Sahifaga sarlavha qo'shadi`,
      `HTML faylni CSS bilan ulaydi`,
      `Sahifani tezroq yuklaydi`,
    ]),
    q(`Sahifada ko'rinadigan barcha kontent qaysi teg ichida bo'ladi?`, `<body>`, [`<head>`, `<html>`, `<title>`]),
    q(`<head> tegi ichida odatda nima bo'ladi?`, `Sahifa haqidagi ma'lumotlar: <title>, <meta>, CSS ulanishi`, [
      `Sahifaning asosiy matni va rasmlari`,
      `Sayt menyusi va logotipi`,
      `Sahifa pastidagi kontaktlar`,
    ]),
    q(`<meta charset="UTF-8"> nima qiladi?`, `Matn kodlashini belgilaydi — o', g', ш kabi belgilar to'g'ri ko'rinadi`, [
      `Sahifa tilini o'zbekchaga o'zgartiradi`,
      `Sahifani mobilga moslaydi`,
      `Shrift turini belgilaydi`,
    ]),
    q(`<html lang="uz"> dagi lang atributi nima uchun kerak?`, `Sahifa tilini bildiradi — ekran o'quvchi va qidiruv tizimlari uchun`, [
      `Sahifani avtomatik tarjima qiladi`,
      `Klaviatura tilini almashtiradi`,
      `Hech narsa qilmaydi, eski atribut`,
    ]),
    q(`Qaysi teg yopilmaydigan (bo'sh) teg?`, `<img>`, [`<p>`, `<div>`, `<title>`]),
    q(`Atribut nima?`, `Tegga qo'shimcha ma'lumot beruvchi nom="qiymat" juftligi`, [
      `Teg ichidagi matn`,
      `Yopuvchi teg`,
      `CSS xususiyati`,
    ]),
    q(`HTML'da izoh (comment) qanday yoziladi?`, `<!-- izoh -->`, [`// izoh`, `/* izoh */`, `# izoh`]),
    q(`Qaysi yozuvda teglar to'g'ri ichma-ich joylashgan?`, `<p><strong>Salom</strong></p>`, [
      `<p><strong>Salom</p></strong>`,
      `<strong><p>Salom</strong></p>`,
      `<p><strong>Salom</p>`,
    ]),
    c(`<!-- Brauzer bu matnni qanday ko'rsatadi? -->
<p>Salom       dunyo
   qalaysan</p>`, `Salom dunyo qalaysan — ortiqcha bo'sh joy va qator ko'chishi bitta bo'sh joyga aylanadi`, [
      `Aynan yozilgandek: bo'sh joylar va yangi qator bilan`,
      `Salomdunyoqalaysan — bo'sh joylarsiz`,
      `Xato beradi`,
    ]),
  ]),

  html(2, 'Matn bilan ishlash', S1, [
    q(`Eng katta (birinchi darajali) sarlavha qaysi teg?`, `<h1>`, [`<h6>`, `<head>`, `<header>`]),
    q(`HTML'da nechta sarlavha darajasi bor?`, `6 ta (h1–h6)`, [`3 ta`, `5 ta`, `10 ta`]),
    q(`Paragraf qaysi teg bilan yoziladi?`, `<p>`, [`<para>`, `<text>`, `<pg>`]),
    q(`Matnni yangi qatorga o'tkazish uchun qaysi teg ishlatiladi?`, `<br>`, [`<hr>`, `<lb>`, `<break>`]),
    q(`<hr> tegi nimani bildiradi?`, `Mavzu almashinuvi — gorizontal chiziq`, [`Yangi qator`, `Sarlavha`, `Havola`]),
    q(`Matn muhimligini bildiruvchi (semantik) qalin teg qaysi?`, `<strong>`, [`<b>`, `<bold>`, `<mark>`]),
    q(`<em> va <i> farqi nimada?`, `<em> — ma'noli urg'u (semantik), <i> — faqat ko'rinishi qiya`, [
      `Farqi yo'q`,
      `<i> — semantik, <em> — faqat ko'rinish`,
      `<em> matnni kattalashtiradi`,
    ]),
    q(`H₂O dagi "2" ni yozish uchun qaysi teg kerak?`, `<sub>`, [`<sup>`, `<small>`, `<low>`]),
    q(`x² dagi "2" ni yozish uchun qaysi teg kerak?`, `<sup>`, [`<sub>`, `<up>`, `<big>`]),
    q(`Matnni marker bilan belgilangandek (sariq fon) ko'rsatuvchi teg?`, `<mark>`, [`<highlight>`, `<strong>`, `<span>`]),
    q(`Bo'sh joylar va qator ko'chishlarini aynan saqlab ko'rsatuvchi teg?`, `<pre>`, [`<code>`, `<p>`, `<text>`]),
    q(`Iqtibos (boshqa manbadan olingan katta parcha) uchun qaysi teg?`, `<blockquote>`, [`<quote>`, `<cite>`, `<q>`]),
    q(`Matn ichida "<" belgisini ko'rsatish uchun nima yoziladi?`, `&lt;`, [`&gt;`, `&less;`, `<<`]),
    q(`&nbsp; nima?`, `Uzilmaydigan bo'sh joy — so'zlar shu joyda qatorga bo'linmaydi`, [
      `Yangi qator`,
      `Tab (4 ta bo'sh joy)`,
      `Ko'rinmas harf`,
    ]),
    q(`Bitta sahifada nechta <h1> bo'lishi tavsiya etiladi?`, `Odatda bitta — sahifaning asosiy sarlavhasi`, [
      `Har bir bo'limda bittadan, cheklov muhim`,
      `Kamida uchta`,
      `Umuman ishlatmaslik kerak`,
    ]),
  ]),

  html(3, 'Havolalar', S1, [
    q(`Havola (link) qaysi teg bilan yaratiladi?`, `<a>`, [`<link>`, `<href>`, `<url>`]),
    q(`Havola manzili qaysi atributda yoziladi?`, `href`, [`src`, `link`, `url`]),
    q(`Havolani yangi tabda ochish uchun qaysi atribut kerak?`, `target="_blank"`, [`target="_new"`, `open="tab"`, `rel="blank"`]),
    q(`target="_blank" bilan birga xavfsizlik uchun nima yoziladi?`, `rel="noopener noreferrer"`, [`rel="stylesheet"`, `secure="true"`, `rel="nofollow"`]),
    q(`Bosilganda pochta dasturini ochadigan havola qaysi?`, `<a href="mailto:info@site.uz">`, [
      `<a href="email:info@site.uz">`,
      `<a mail="info@site.uz">`,
      `<a href="info@site.uz">`,
    ]),
    q(`Telefonda bosilganda qo'ng'iroq qiladigan havola qaysi?`, `<a href="tel:+998901234567">`, [
      `<a href="call:+998901234567">`,
      `<a phone="+998901234567">`,
      `<a href="+998901234567">`,
    ]),
    q(`Shu sahifadagi id="contact" bo'limiga o'tadigan havola qaysi?`, `<a href="#contact">`, [`<a href="contact">`, `<a href=".contact">`, `<a id="contact">`]),
    q(`"https://google.com" qanday manzil?`, `Absolyut (to'liq) manzil`, [`Nisbiy manzil`, `Lokal fayl`, `Noto'g'ri manzil`]),
    q(`pages/about.html faylidan loyiha ildizidagi index.html ga havola qanday yoziladi?`, `../index.html`, [`/pages/index.html`, `./index.html`, `index.html`]),
    q(`href="/" nimani bildiradi?`, `Saytning ildiz (bosh) sahifasini`, [`Joriy sahifani qayta yuklashni`, `Bo'sh havolani`, `Oldingi sahifani`]),
    q(`Faylni ochish o'rniga yuklab oldiradigan atribut?`, `download`, [`save`, `get`, `target="_download"`]),
    q(`<a> ichiga <img> qo'yish mumkinmi?`, `Ha — rasm bosiladigan havolaga aylanadi`, [
      `Yo'q, faqat matn bo'lishi mumkin`,
      `Faqat <button> ichida`,
      `Faqat CSS orqali`,
    ]),
    q(`Qaysi havola matni foydalanuvchi va ekran o'quvchi uchun eng yaxshi?`, `"Narxlar ro'yxatini ko'rish"`, [`"Bu yerga bosing"`, `"Batafsil"`, `"Link"`]),
  ]),

  html(4, 'Rasmlar va media', S1, [
    q(`Rasm qaysi teg bilan qo'shiladi?`, `<img>`, [`<image>`, `<pic>`, `<src>`]),
    q(`<img> da rasm manzili qaysi atributda?`, `src`, [`href`, `alt`, `link`]),
    q(`alt atributi nima uchun kerak?`, `Rasm yuklanmasa yoki ekran o'quvchi uchun rasmni tasvirlovchi matn`, [
      `Rasm o'lchamini belgilash`,
      `Rasmni havolaga aylantirish`,
      `Rasm ustiga sichqoncha borganda ko'rinadigan matn`,
    ]),
    q(`Faqat bezak uchun qo'yilgan rasmning alt'i qanday bo'lishi kerak?`, `alt="" (bo'sh) — ekran o'quvchi uni o'tkazib yuboradi`, [
      `alt atributini umuman yozmaslik`,
      `alt="rasm"`,
      `alt="bezak rasm"`,
    ]),
    q(`<img> ga width va height yozish nima beradi?`, `Rasm yuklanguncha joyi ajratiladi — sahifa "sakramaydi" (layout shift)`, [
      `Rasm sifati oshadi`,
      `Rasm tezroq yuklanadi`,
      `Hech narsa, faqat CSS ishlaydi`,
    ]),
    q(`Rasm va uning izohini semantik bog'lash uchun qaysi teglar?`, `<figure> va <figcaption>`, [`<div> va <p>`, `<img> va <caption>`, `<picture> va <label>`]),
    q(`<video> da play/pauza tugmalarini ko'rsatuvchi atribut?`, `controls`, [`buttons`, `play`, `autoplay`]),
    q(`Brauzerlar videoni avtomatik ijro etishga qachon ruxsat beradi?`, `Ovozsiz bo'lsa: autoplay muted`, [
      `Har doim autoplay bilan`,
      `Faqat loop bilan`,
      `Hech qachon`,
    ]),
    q(`Boshqa sahifa yoki YouTube videoni sahifaga joylash uchun qaysi teg?`, `<iframe>`, [`<embed-page>`, `<frame>`, `<object-video>`]),
    q(`loading="lazy" nima qiladi?`, `Rasm ekranga yaqinlashgandagina yuklanadi`, [`Rasmni sekin ko'rsatadi`, `Rasm sifatini pasaytiradi`, `Rasmni keshlaydi`]),
    q(`srcset atributi nima uchun?`, `Ekran o'lchami va zichligiga mos rasm variantini brauzer o'zi tanlashi uchun`, [
      `Bir nechta rasmni slayder qilish uchun`,
      `Rasmga ramka berish uchun`,
      `Rasmni zaxira serverdan olish uchun`,
    ]),
    q(`<picture> ichidagi <source> lar nima uchun?`, `Turli shart yoki formatlar (masalan, WebP) uchun muqobil manbalar berish`, [
      `Rasmlarni ketma-ket ko'rsatish`,
      `Rasm muallifini ko'rsatish`,
      `Video qo'shish`,
    ]),
    q(`Shaffof fonni qo'llaydigan, sifatni saqlab hajmi kichik zamonaviy rasm formati?`, `WebP`, [`JPEG`, `BMP`, `TIFF`]),
  ]),

  html(5, "Ro'yxatlar", S1, [
    q(`Belgili (nuqtali) ro'yxat qaysi teg?`, `<ul>`, [`<ol>`, `<li>`, `<dl>`]),
    q(`Raqamli (tartiblangan) ro'yxat qaysi teg?`, `<ol>`, [`<ul>`, `<nl>`, `<list>`]),
    q(`Ro'yxat elementi qaysi teg?`, `<li>`, [`<item>`, `<dt>`, `<le>`]),
    q(`Raqamli ro'yxatni 5 dan boshlash uchun nima yoziladi?`, `<ol start="5">`, [`<ol from="5">`, `<ol begin="5">`, `<ol value="5">`]),
    q(`Ro'yxatni rim raqamlari bilan (I, II, III) chiqarish?`, `<ol type="I">`, [`<ol type="roman">`, `<ol style="I">`, `<ul type="I">`]),
    q(`Raqamli ro'yxatni teskari tartibda sanash atributi?`, `reversed`, [`reverse`, `desc`, `order="back"`]),
    q(`Atama va uning ta'rifi ro'yxati qaysi teglar bilan yoziladi?`, `<dl>, <dt>, <dd>`, [`<ul>, <li>, <p>`, `<ol>, <dt>, <li>`, `<table>, <tr>, <td>`]),
    q(`<ul> ning bevosita ichida qaysi teg bo'lishi kerak?`, `Faqat <li>`, [`Har qanday teg`, `<p>`, `<div>`]),
    q(`Sayt menyusi odatda qanday yoziladi?`, `<nav> ichida <ul>, har bir <li> ichida <a>`, [
      `Faqat <div> lar bilan`,
      `<table> bilan`,
      `<ol> ichida <button> lar`,
    ]),
    q(`Ichma-ich ro'yxat to'g'ri qanday yoziladi?`, `<ul><li>Meva<ul><li>Olma</li></ul></li></ul>`, [
      `<ul><li>Meva</li><ul><li>Olma</li></ul></ul>`,
      `<ul><li>Meva</li></ul><ul><li>Olma</li></ul>`,
      `<ul><ul><li>Olma</li></ul><li>Meva</li></ul>`,
    ]),
    c(`<!-- "C" qaysi raqam bilan ko'rinadi? -->
<ol start="3" reversed>
  <li>A</li>
  <li>B</li>
  <li>C</li>
</ol>`, `1`, [`3`, `5`, `4`]),
  ]),

  html(6, 'Jadvallar', S1, [
    q(`Jadval qaysi teg bilan boshlanadi?`, `<table>`, [`<tab>`, `<grid>`, `<tbl>`]),
    q(`Jadval qatori qaysi teg?`, `<tr>`, [`<td>`, `<th>`, `<row>`]),
    q(`Oddiy katak (ma'lumot) qaysi teg?`, `<td>`, [`<tr>`, `<th>`, `<cell>`]),
    q(`Sarlavha katagi qaysi teg?`, `<th>`, [`<td>`, `<thead>`, `<caption>`]),
    q(`Jadval nomi (izohi) qaysi teg bilan beriladi?`, `<caption>`, [`<title>`, `<th>`, `<legend>`]),
    q(`Katakni 2 ta ustunga cho'zish uchun?`, `colspan="2"`, [`rowspan="2"`, `span="2"`, `cols="2"`]),
    q(`Katakni 2 ta qatorga cho'zish uchun?`, `rowspan="2"`, [`colspan="2"`, `rows="2"`, `height="2"`]),
    q(`<thead>, <tbody>, <tfoot> nima uchun?`, `Jadval qismlarini mantiqan ajratadi — sarlavha, asosiy qism, yakun`, [
      `Jadvalni chiroyli qiladi`,
      `Jadvalni 3 ta jadvalga bo'ladi`,
      `Faqat chop etishda kerak`,
    ]),
    q(`<th scope="col"> dagi scope nima uchun?`, `Sarlavha qaysi ustunga tegishli ekanini bildiradi (ekran o'quvchi uchun)`, [
      `Ustun kengligini belgilaydi`,
      `Ustunni yashiradi`,
      `Ustunni saralaydi`,
    ]),
    q(`Jadvalni nima uchun ishlatmaslik kerak?`, `Sahifa maketini (layout) qurish uchun`, [
      `Narxlar ro'yxati uchun`,
      `Dars jadvali uchun`,
      `Statistika uchun`,
    ]),
    c(`<!-- Jadvalda nechta ustun bor? -->
<table>
  <tr><td colspan="3">A</td></tr>
  <tr><td>B</td><td colspan="2">C</td></tr>
</table>`, `3`, [`2`, `4`, `5`]),
    c(`<!-- C katak qaysi ustunda turadi? -->
<table>
  <tr><td rowspan="2">A</td><td>B</td></tr>
  <tr><td>C</td></tr>
</table>`, `2-ustunda — 1-ustunni A egallab turibdi`, [`1-ustunda`, `3-ustunda`, `Jadvaldan tashqarida`]),
  ]),

  html(7, 'Formalar: input va label', S2, [
    q(`Forma qaysi teg bilan yaratiladi?`, `<form>`, [`<input>`, `<fieldset>`, `<frm>`]),
    q(`Forma ma'lumotlari qayerga yuborilishini qaysi atribut belgilaydi?`, `action`, [`method`, `href`, `target`]),
    q(`GET va POST farqi nimada?`, `GET ma'lumotni URL'da yuboradi, POST — so'rov tanasida (body)`, [
      `GET tezroq, POST sekinroq — boshqa farqi yo'q`,
      `GET faqat rasm, POST faqat matn yuboradi`,
      `POST ma'lumotni URL'da yuboradi`,
    ]),
    q(`Parol kiritish maydoni qaysi?`, `<input type="password">`, [`<input type="secret">`, `<password>`, `<input type="hidden">`]),
    q(`Email maydoni qaysi?`, `<input type="email">`, [`<input type="mail">`, `<email>`, `<input type="text" email>`]),
    q(`<label for="ism"> qanday ishlaydi?`, `id="ism" bo'lgan input bilan bog'lanadi — label bosilsa input fokuslanadi`, [
      `name="ism" bo'lgan inputni yashiradi`,
      `Inputga "ism" yozib qo'yadi`,
      `Hech narsa, faqat matn`,
    ]),
    q(`input'dagi name atributi nima uchun kerak?`, `Ma'lumot serverga qaysi nom bilan borishini belgilaydi`, [
      `Inputni CSS'da tanlash uchun`,
      `Foydalanuvchiga ko'rinadigan nom`,
      `Inputni majburiy qiladi`,
    ]),
    q(`Input ichidagi kulrang yordamchi matn qaysi atribut?`, `placeholder`, [`value`, `hint`, `title`]),
    q(`value va placeholder farqi?`, `value — haqiqiy boshlang'ich qiymat (yuboriladi), placeholder — faqat ko'rsatma`, [
      `Ikkalasi bir xil`,
      `placeholder yuboriladi, value yo'q`,
      `value faqat raqam uchun`,
    ]),
    q(`Sana tanlash maydoni qaysi?`, `<input type="date">`, [`<input type="calendar">`, `<date>`, `<input type="time-date">`]),
    q(`1 dan 10 gacha, 0.5 qadam bilan son kiritish maydoni?`, `<input type="number" min="1" max="10" step="0.5">`, [
      `<input type="range" from="1" to="10">`,
      `<input type="number" range="1-10">`,
      `<input type="text" min="1" max="10">`,
    ]),
    q(`Foydalanuvchiga ko'rinmaydigan, lekin yuboriladigan maydon?`, `<input type="hidden">`, [`<input hidden-value>`, `<input type="invisible">`, `<input style="display:none" disabled>`]),
    c(`<!-- "Qidirish" bosilganda brauzer qaysi manzilga o'tadi? -->
<form action="/search" method="get">
  <input name="q" value="html">
  <button>Qidirish</button>
</form>`, `/search?q=html`, [`/search/html`, `/search`, `/q=html`]),
  ]),

  html(8, 'Formalar: tanlash va tekshirish', S2, [
    q(`Ochiluvchi ro'yxat qaysi teglar bilan yaratiladi?`, `<select> va <option>`, [`<list> va <item>`, `<dropdown> va <option>`, `<input type="list">`]),
    q(`Bir nechta variantdan faqat bittasini tanlash uchun qaysi input?`, `type="radio"`, [`type="checkbox"`, `type="select"`, `type="option"`]),
    q(`Radio tugmalar guruhida faqat bittasi tanlanishi uchun nima kerak?`, `Hammasining name atributi bir xil bo'lishi`, [
      `Hammasining id'si bir xil bo'lishi`,
      `Ularni <ul> ichiga qo'yish`,
      `Har biriga required yozish`,
    ]),
    q(`Bir nechtasini birga belgilash mumkin bo'lgan input?`, `type="checkbox"`, [`type="radio"`, `type="multi"`, `type="toggle"`]),
    q(`Checkbox oldindan belgilangan bo'lishi uchun?`, `checked`, [`selected`, `active`, `value="on"`]),
    q(`<select> da variant oldindan tanlangan bo'lishi uchun?`, `<option selected>`, [`<option checked>`, `<option default>`, `<option active>`]),
    q(`To'ldirilishi majburiy maydon uchun atribut?`, `required`, [`must`, `validate`, `important`]),
    q(`Ko'p qatorli matn maydoni qaysi teg?`, `<textarea>`, [`<input type="multiline">`, `<textbox>`, `<text>`]),
    q(`<fieldset> va <legend> nima uchun?`, `Bog'liq maydonlarni guruhlab, guruhga nom beradi`, [
      `Formani yuboradi`,
      `Xato xabarini ko'rsatadi`,
      `Maydonlarni yashiradi`,
    ]),
    q(`Forma ichidagi <button> ning standart type'i qaysi?`, `submit — bosilsa forma yuboriladi`, [`button`, `reset`, `click`]),
    q(`pattern="[0-9]{9}" nimani tekshiradi?`, `Qiymat aynan 9 ta raqamdan iborat bo'lishini`, [
      `Qiymat 9 dan kichik bo'lishini`,
      `0 dan 9 gacha bitta raqamni`,
      `Kamida 9 ta belgi borligini`,
    ]),
    q(`disabled va readonly farqi?`, `readonly maydon yuboriladi, disabled maydon yuborilmaydi`, [
      `Ikkalasi ham yuborilmaydi`,
      `disabled maydon yuboriladi, readonly yo'q`,
      `Farqi yo'q`,
    ]),
    q(`<optgroup> nima qiladi?`, `<select> variantlarini nomlangan guruhlarga ajratadi`, [
      `Bir nechta variant tanlashga ruxsat beradi`,
      `Variantlarni saralaydi`,
      `Variantlarni yashiradi`,
    ]),
    q(`<datalist> ning <select> dan farqi?`, `Taklif variantlarini beradi, lekin o'z qiymatini yozish ham mumkin`, [
      `Bir nechta variant tanlash mumkin`,
      `Faqat raqamlar uchun`,
      `Farqi yo'q`,
    ]),
  ]),

  html(9, 'Semantik HTML', S2, [
    q(`Semantik teg nima?`, `Nomi mazmunini bildiradigan teg (header, nav, article…)`, [
      `Faqat stil beradigan teg`,
      `JavaScript bilan ishlaydigan teg`,
      `Yopilmaydigan teg`,
    ]),
    q(`Sayt navigatsiyasi (menyu) uchun qaysi teg?`, `<nav>`, [`<menu-bar>`, `<header>`, `<links>`]),
    q(`Sahifaning asosiy, yagona kontenti qaysi tegga joylanadi?`, `<main>`, [`<body>`, `<section>`, `<content>`]),
    q(`Alohida tarqatsa ham ma'noli bo'ladigan kontent (blog post, yangilik) uchun?`, `<article>`, [`<section>`, `<div>`, `<aside>`]),
    q(`Asosiy kontentga yondosh qo'shimcha ma'lumot (yon panel) uchun?`, `<aside>`, [`<nav>`, `<side>`, `<footer>`]),
    q(`Sahifa yoki bo'lim pastki qismi uchun?`, `<footer>`, [`<bottom>`, `<end>`, `<aside>`]),
    q(`Qaysi biri inline element?`, `<span>`, [`<div>`, `<p>`, `<section>`]),
    q(`<section> va <div> farqi?`, `<section> — sarlavhali mavzuli bo'lim, <div> — ma'nosiz konteyner`, [
      `Farqi yo'q`,
      `<div> semantik, <section> emas`,
      `<section> faqat <article> ichida bo'ladi`,
    ]),
    q(`Maqola ichida sarlavha va muallif ma'lumoti qaysi tegga joylanadi?`, `<header> — u <article> ichida ham bo'la oladi`, [
      `<head>`,
      `Faqat <h1>`,
      `<caption>`,
    ]),
    q(`Sana va vaqtni mashina tushunadigan qilib belgilash?`, `<time datetime="2026-11-16">16-noyabr</time>`, [
      `<date>16-noyabr</date>`,
      `<span type="date">16-noyabr</span>`,
      `<time>2026-11-16</time> — boshqa yo'li yo'q`,
    ]),
    q(`Kontakt ma'lumotlari uchun semantik teg?`, `<address>`, [`<contact>`, `<info>`, `<footer>`]),
    q(`Semantik teglarning foydasi nimada?`, `SEO, ekran o'quvchilar va kodni o'qish osonligi`, [
      `Sahifa tezroq yuklanadi`,
      `CSS kerak bo'lmaydi`,
      `JavaScript ishlamaydi`,
    ]),
  ]),

  html(10, "Head, SEO va accessibility", S2, [
    q(`<meta name="viewport" content="width=device-width, initial-scale=1"> nima qiladi?`, `Mobil qurilmada sahifa kengligini ekran kengligiga moslaydi`, [
      `Sahifani kattalashtiradi`,
      `Rasmlarni moslashtiradi`,
      `Sahifani faqat kompyuterda ochadi`,
    ]),
    q(`<meta name="description"> nima uchun?`, `Qidiruv natijalarida sarlavha ostida ko'rinadigan qisqa tavsif`, [
      `Sahifa muallifi`,
      `Sahifadagi birinchi paragraf`,
      `Brauzer tabidagi nom`,
    ]),
    q(`Tashqi CSS fayl qanday ulanadi?`, `<link rel="stylesheet" href="style.css">`, [
      `<style src="style.css">`,
      `<css href="style.css">`,
      `<script href="style.css">`,
    ]),
    q(`Brauzer tabidagi kichik ikonka (favicon) qanday ulanadi?`, `<link rel="icon" href="favicon.ico">`, [
      `<img rel="icon" src="favicon.ico">`,
      `<meta icon="favicon.ico">`,
      `<icon src="favicon.ico">`,
    ]),
    q(`<script src="app.js" defer> dagi defer nima qiladi?`, `Skript HTML to'liq o'qilgandan keyin bajariladi, sahifa yuklanishini to'xtatmaydi`, [
      `Skriptni umuman bajarmaydi`,
      `Skriptni 1 soniya kechiktiradi`,
      `Skriptni har sahifada qayta yuklaydi`,
    ]),
    q(`<meta property="og:title"> nima uchun?`, `Havola ijtimoiy tarmoqda ulashilganda ko'rinadigan sarlavha`, [
      `Google uchun asosiy sarlavha`,
      `Sahifa tilini bildiradi`,
      `Brauzer tabidagi nom`,
    ]),
    q(`Accessibility (a11y) nima?`, `Saytdan imkoniyati cheklangan odamlar ham to'liq foydalana olishi`, [
      `Sayt tezligi`,
      `Saytning xavfsizligi`,
      `Saytning mobil versiyasi`,
    ]),
    q(`aria-label nima uchun?`, `Ko'rinadigan matni yo'q element (masalan, ikonkali tugma) ga ekran o'quvchi uchun nom beradi`, [
      `Elementga sarlavha chiqaradi`,
      `Elementni yashiradi`,
      `Elementga stil beradi`,
    ]),
    q(`tabindex="0" nima qiladi?`, `Odatda fokus olmaydigan elementni Tab bilan fokuslanadigan qiladi`, [
      `Elementni Tab tartibidan olib tashlaydi`,
      `Elementni birinchi o'ringa qo'yadi`,
      `Elementni yashiradi`,
    ]),
    q(`Bosiladigan tugma uchun qaysi yaxshiroq?`, `<button> — klaviatura va ekran o'quvchi bilan o'zi ishlaydi`, [
      `<div onclick="...">`,
      `<span onclick="...">`,
      `Farqi yo'q`,
    ]),
    q(`Sarlavhalar tartibi to'g'risi qaysi?`, `Darajani o'tkazib yubormaslik: h1 → h2 → h3`, [
      `h1 dan keyin darrov h4 bo'lishi mumkin — faqat o'lcham muhim`,
      `Kichik matn uchun h6 ishlatish`,
      `Har bir sarlavha h1 bo'lishi kerak`,
    ]),
    q(`<title> tegi qayerda ko'rinadi?`, `Brauzer tabida va qidiruv natijalaridagi sarlavhada`, [
      `Sahifaning yuqorisida, katta harflarda`,
      `Faqat kod ichida`,
      `Rasm ustida`,
    ]),
    q(`HTML kodni xatolarga tekshirishning rasmiy vositasi?`, `W3C Markup Validator`, [`Google Translate`, `Lighthouse Fonts`, `npm validator`]),
  ]),
]
