import { q, c, topic } from './build'

const S1 = '1-modul. CSS asoslari'
const S2 = '2-modul. Joylashuv'
const S3 = '3-modul. Flexbox va Grid'
const S4 = '4-modul. Responsive va animatsiya'
const S5 = '5-modul. Zamonaviy CSS'
const css = (n, name, section, items) => topic(`${n}-dars. ${name}`, 'css', section, items)

/** CSS: lessons 11–30 (after the ten HTML lessons), each from easy to hard. */
export const CSS = [
  css(11, "CSS'ni ulash va sintaksis", S1, [
    q(`CSS nima?`, `Sahifa ko'rinishini (rang, o'lcham, joylashuv) belgilovchi stil tili`, [
      `Sahifa tuzilishini yaratuvchi til`,
      `Dasturlash tili`,
      `Ma'lumotlar bazasi`,
    ]),
    q(`Tashqi CSS fayl qanday ulanadi?`, `<link rel="stylesheet" href="style.css">`, [
      `<style src="style.css">`,
      `<css href="style.css">`,
      `@link "style.css"`,
    ]),
    q(`Ichki (internal) CSS qayerda yoziladi?`, `<head> ichidagi <style> tegida`, [`<body> ichidagi <css> tegida`, `<script> tegida`, `<meta> tegida`]),
    q(`Inline CSS qanday yoziladi?`, `<p style="color: red">`, [`<p css="color: red">`, `<p class="color: red">`, `<p color="red">`]),
    q(`Qaysi usul eng tavsiya etiladi?`, `Tashqi CSS fayl — bir nechta sahifa bir faylni ishlatadi`, [`Inline style`, `Har sahifada <style>`, `Uchalasi bir xil`]),
    q(`Qaysi qoida to'g'ri yozilgan?`, `p { color: red; }`, [`p ( color = red )`, `p { color => red }`, `{p: color red}`]),
    q(`CSS'da izoh qanday yoziladi?`, `/* izoh */`, [`// izoh`, `<!-- izoh -->`, `# izoh`]),
    q(`class="card" bo'lgan elementlarni tanlash?`, `.card`, [`#card`, `card`, `*card`]),
    q(`id="header" bo'lgan elementni tanlash?`, `#header`, [`.header`, `header`, `@header`]),
    q(`h1, h2 va p ga bir xil stil berish?`, `h1, h2, p { … }`, [`h1 h2 p { … }`, `h1 + h2 + p { … }`, `h1.h2.p { … }`]),
    q(`Sahifadagi barcha elementlarni tanlovchi selektor?`, `*`, [`all`, `body`, `html`]),
    q(`id va class farqi?`, `id sahifada yagona bo'ladi, class ko'p elementga beriladi`, [`Farqi yo'q`, `class yagona, id ko'p`, `id faqat div uchun`]),
    c(`/* Qaysi selektor bu paragrafni TANLAMAYDI? */
<p class="note big">Salom</p>`, `#note`, [`.note`, `.big`, `p.note.big`]),
  ]),

  css(12, 'Murakkab selektorlar', S1, [
    q(`"div p" selektori nimani tanlaydi?`, `div ichidagi barcha p larni (har qanday chuqurlikda)`, [
      `Faqat div ning bevosita farzandi bo'lgan p ni`,
      `div dan keyin keladigan p ni`,
      `Ham div, ham p ni`,
    ]),
    q(`"div > p" selektori nimani tanlaydi?`, `Faqat div ning bevosita farzandi bo'lgan p larni`, [
      `div ichidagi barcha p larni`,
      `div dan keyingi p ni`,
      `p dan katta div ni`,
    ]),
    q(`"h2 + p" nimani tanlaydi?`, `h2 dan keyin darhol keladigan bitta qo'shni p ni`, [
      `h2 dan keyingi barcha p larni`,
      `h2 va p ni`,
      `h2 ichidagi p ni`,
    ]),
    q(`"h2 ~ p" nimani tanlaydi?`, `h2 dan keyin keladigan barcha qo'shni p larni`, [
      `Faqat bitta keyingi p ni`,
      `h2 dan oldingi p larni`,
      `h2 ichidagi p larni`,
    ]),
    q(`a[target="_blank"] nimani tanlaydi?`, `target atributi "_blank" bo'lgan havolalarni`, [`Barcha havolalarni`, `target'i yo'q havolalarni`, `Yangi tabda ochilgan sahifalarni`]),
    q(`a[href^="https"] nimani tanlaydi?`, `href qiymati "https" bilan boshlanadigan havolalarni`, [`"https" bilan tugaydiganlarni`, `"https" qatnashganlarni`, `"https" bo'lmaganlarini`]),
    q(`a[href$=".pdf"] nimani tanlaydi?`, `href ".pdf" bilan tugaydigan havolalarni`, [`".pdf" bilan boshlanadiganlarni`, `PDF ochilgan sahifani`, `".pdf" qatnashmaganlarni`]),
    q(`[class*="btn"] nimani tanlaydi?`, `class qiymatida "btn" qatnashgan (btn-primary, mybtn…) elementlarni`, [`Faqat class="btn" ni`, `"btn" bilan boshlanuvchilarni`, `Barcha tugmalarni`]),
    q(`"p.intro" va "p .intro" farqi?`, `p.intro — intro klassli p; p .intro — p ichidagi intro klassli element`, [
      `Farqi yo'q`,
      `Ikkinchisi xato yozilgan`,
      `p.intro — p ichidagi element`,
    ]),
    c(`/* ".menu > li" nechta li ni tanlaydi? */
<ul class="menu">
  <li>A</li>
  <li>
    <ul><li>B</li></ul>
  </li>
</ul>`, `2 ta — tashqi ro'yxatdagilar (B emas)`, [`3 ta — hammasini`, `1 ta — faqat B`, `Hech qaysisini`]),
    c(`/* "h2 ~ p" nechta elementni tanlaydi? */
<h2>A</h2>
<p>1</p>
<p>2</p>
<div>3</div>
<p>4</p>`, `3`, [`1`, `2`, `4`]),
  ]),

  css(13, 'Kaskad, specificity va meros', S1, [
    q(`"Cascading" (kaskad) nimani bildiradi?`, `Bir elementga bir nechta qoida tushsa, ustuvorlik va tartib bo'yicha qaysi biri ishlashi aniqlanadi`, [
      `Stillar faqat birinchi elementga qo'llanadi`,
      `CSS fayllar zinapoya kabi ulanadi`,
      `Animatsiya turi`,
    ]),
    q(`Qaysi selektorning ustuvorligi (specificity) eng yuqori?`, `#main`, [`.title`, `p`, `*`]),
    q(`Ikki qoidaning specificity'si bir xil bo'lsa qaysi biri ishlaydi?`, `Kodda keyinroq yozilgani`, [`Birinchi yozilgani`, `Qisqarog'i`, `Hech biri`]),
    q(`Inline style va #id selektoridan qaysi kuchliroq?`, `Inline style`, [`#id`, `Teng kuchli`, `Qaysi biri pastda yozilganiga bog'liq`]),
    q(`!important nima qiladi?`, `Oddiy qoidalardan ustun keladi — lekin ko'p ishlatish yomon amaliyot`, [`Qoidani o'chiradi`, `Faqat mobil uchun ishlaydi`, `Xatoni ko'rsatadi`]),
    q(`Qaysi xususiyat ota elementdan farzandga meros o'tadi?`, `color`, [`border`, `margin`, `padding`]),
    q(`color: inherit nimani bildiradi?`, `Ota elementdagi qiymatni olish`, [`Standart qora rang`, `Rangni o'chirish`, `Brauzer rangini olish`]),
    q(`"#nav .item a" selektorining specificity'si (id-class-teg)?`, `1-1-1`, [`0-2-1`, `1-0-2`, `0-1-2`]),
    q(`initial qiymati nimani bildiradi?`, `Xususiyatning CSS standartidagi boshlang'ich qiymatini`, [`Ota element qiymatini`, `Birinchi yozilgan qiymatni`, `Brauzer stilini`]),
    q(`Nega <a> ota elementning rangini olmaydi?`, `Brauzer <a> ga o'z standart rangini beradi — color: inherit bilan tuzatiladi`, [
      `Havolalar umuman rang olmaydi`,
      `Faqat !important bilan o'zgaradi`,
      `<a> inline element bo'lgani uchun`,
    ]),
    c(`/* <p id="txt" class="info">Salom</p> — matn rangi? */
p      { color: blue; }
.info  { color: green; }
#txt   { color: red; }
p.info { color: orange; }`, `red`, [`orange`, `green`, `blue`]),
    c(`/* <button class="btn"> matni qaysi rangda? */
.btn { color: white; }
.btn { color: black; }`, `black`, [`white`, `Brauzer standart rangi`, `Xato — ikki marta yozib bo'lmaydi`]),
    c(`/* <p id="a" style="color: green"> rangi? */
p  { color: red !important; }
#a { color: blue; }`, `red — !important inline style'dan ham ustun`, [`green — inline eng kuchli`, `blue — id kuchli`, `Qora`]),
  ]),

  css(14, "Ranglar va o'lchov birliklari", S1, [
    q(`Qizil rangning hex kodi?`, `#ff0000`, [`#00ff00`, `#0000ff`, `#000000`]),
    q(`#fff qaysi rang?`, `Oq`, [`Qora`, `Kulrang`, `Sariq`]),
    q(`rgba(0, 0, 0, 0.5) dagi 0.5 nima?`, `Shaffoflik (alpha) — 50% ko'rinadi`, [`Yorqinlik`, `Qora rang miqdori`, `Chegara qalinligi`]),
    q(`hsl(120, 100%, 50%) qaysi rang?`, `Yashil`, [`Qizil`, `Ko'k`, `Sariq`]),
    q(`#ff000080 dagi oxirgi "80" nima?`, `Shaffoflik (taxminan 50%)`, [`Yorqinlik`, `Ko'k rang`, `Xato yozuv`]),
    q(`rem birligi nimaga nisbatan?`, `Ildiz (html) elementining font-size'iga`, [`Ota elementning font-size'iga`, `Ekran kengligiga`, `Joriy element kengligiga`]),
    q(`em birligi (font-size'da) nimaga nisbatan?`, `Ota elementning font-size'iga`, [`html ning font-size'iga`, `Ekran balandligiga`, `Har doim 16px`]),
    q(`1vw nimaga teng?`, `Brauzer oynasi kengligining 1%`, [`1 piksel`, `Ota element kengligining 1%`, `Ekran balandligining 1%`]),
    q(`html { font-size: 16px } bo'lsa, 2.5rem necha piksel?`, `40px`, [`25px`, `32px`, `2.5px`]),
    q(`width: 50% nimaga nisbatan hisoblanadi?`, `Ota elementning kengligiga`, [`Ekran kengligiga`, `Elementning o'z kontentiga`, `html elementiga`]),
    q(`opacity: 0.5 va background: rgba(…, 0.5) farqi?`, `opacity butun elementni (matni bilan) shaffof qiladi, rgba — faqat fonni`, [
      `Farqi yo'q`,
      `rgba butun elementni shaffof qiladi`,
      `opacity faqat rasmga ishlaydi`,
    ]),
    q(`currentColor qiymati nima?`, `Elementning joriy color qiymati`, [`Brauzer standart rangi`, `Ota fon rangi`, `Tasodifiy rang`]),
    c(`/* .child ichidagi matn necha px? */
.parent { font-size: 20px; }
.child  { font-size: 1.5em; }  /* .parent ichida */`, `30px`, [`24px`, `1.5px`, `20px`]),
    c(`/* .c necha px? */
.a { font-size: 10px; }
.b { font-size: 2em; }  /* .a ichida */
.c { font-size: 2em; }  /* .b ichida */`, `40px`, [`20px`, `10px`, `80px`]),
  ]),

  css(15, 'Matn va shriftlar', S1, [
    q(`Shrift turini qaysi xususiyat belgilaydi?`, `font-family`, [`font-type`, `font-style`, `text-font`]),
    q(`Matn qalinligini qaysi xususiyat belgilaydi?`, `font-weight`, [`font-bold`, `text-weight`, `font-size`]),
    q(`font-weight: bold raqamda qanchaga teng?`, `700`, [`400`, `500`, `900`]),
    q(`Matnni markazga tekislash?`, `text-align: center`, [`align: center`, `text-center: true`, `vertical-align: middle`]),
    q(`Havola tagidagi chiziqni olib tashlash?`, `text-decoration: none`, [`text-line: none`, `underline: off`, `link-style: none`]),
    q(`Barcha harflarni katta qilish (HTML'ni o'zgartirmasdan)?`, `text-transform: uppercase`, [`font-variant: big`, `text-case: upper`, `font-transform: caps`]),
    q(`Qatorlar orasidagi masofa?`, `line-height`, [`letter-spacing`, `word-spacing`, `margin`]),
    q(`Harflar orasidagi masofa?`, `letter-spacing`, [`line-height`, `word-spacing`, `font-stretch`]),
    q(`font-family: "Roboto", Arial, sans-serif — nega bir nechta shrift yoziladi?`, `Birinchisi topilmasa, keyingisi ishlatiladi (zaxira)`, [
      `Hammasi aralashtirib ishlatiladi`,
      `Har xil qatorlarga har xil shrift`,
      `Xato, faqat bittasi yoziladi`,
    ]),
    q(`O'z shrift faylingizni ulash uchun qaysi qoida?`, `@font-face`, [`@import-font`, `@font`, `font-src`]),
    q(`Matnga soya berish?`, `text-shadow`, [`box-shadow`, `font-shadow`, `shadow`]),
    q(`line-height: 1.5 (birliksiz) yozishning afzalligi?`, `Har bir elementning o'z font-size'iga ko'paytiriladi va farzandlarga nisbat sifatida o'tadi`, [
      `Har doim 1.5px bo'ladi`,
      `Faqat ota elementga ta'sir qiladi`,
      `Hech qanday afzalligi yo'q`,
    ]),
    q(`Uzun matnni bitta qatorda "..." bilan kesish uchun nima kerak?`, `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`, [
      `text-overflow: ellipsis; o'zi yetarli`,
      `overflow: scroll;`,
      `text-cut: dots;`,
    ]),
    c(`/* "16px/1.5" nimani bildiradi? */
p { font: italic 700 16px/1.5 Arial, sans-serif; }`, `font-size: 16px va line-height: 1.5`, [
      `16px ni 1.5 ga bo'lish`,
      `Kenglik 16px, balandlik 1.5`,
      `font-size 16px dan 1.5px gacha`,
    ]),
  ]),

  css(16, 'Box model', S1, [
    q(`Box model qismlari ichkaridan tashqariga?`, `content → padding → border → margin`, [
      `margin → border → padding → content`,
      `content → margin → border → padding`,
      `padding → content → border → margin`,
    ]),
    q(`padding nima?`, `Kontent va chegara (border) orasidagi ichki masofa`, [`Elementlar orasidagi tashqi masofa`, `Chegara qalinligi`, `Kontent kengligi`]),
    q(`margin nima?`, `Element chegarasidan tashqaridagi masofa`, [`Ichki masofa`, `Chegara rangi`, `Kontent balandligi`]),
    q(`margin: 10px 20px; nimani bildiradi?`, `Yuqori va past 10px, chap va o'ng 20px`, [`Yuqori 10px, past 20px`, `Chap 10px, o'ng 20px`, `Hamma tomondan 30px`]),
    q(`padding: 5px 10px 15px 20px; tartibi qanday?`, `yuqori, o'ng, past, chap (soat mili bo'yicha)`, [`yuqori, past, chap, o'ng`, `chap, o'ng, yuqori, past`, `chap, yuqori, o'ng, past`]),
    q(`Kengligi berilgan block elementni gorizontal markazlash?`, `margin: 0 auto`, [`text-align: center`, `align: center`, `padding: auto`]),
    q(`Manfiy margin yozish mumkinmi?`, `Ha — element siljiydi yoki qo'shnisi ustiga chiqadi`, [`Yo'q, xato beradi`, `Faqat padding'da mumkin`, `Faqat inline elementda`]),
    q(`<span> ga margin-top: 20px berilsa nima bo'ladi?`, `Vertikal margin inline elementga ta'sir qilmaydi`, [`20px pastga tushadi`, `Butun qator pastga tushadi`, `Xato beradi`]),
    q(`max-width: 600px nima qiladi?`, `Element 600px dan kengaymaydi, kichik ekranda esa kichrayaveradi`, [
      `Element doim 600px bo'ladi`,
      `Element 600px dan kichik bo'lmaydi`,
      `Faqat rasmga ishlaydi`,
    ]),
    q(`* { box-sizing: border-box; } nima uchun ko'p yoziladi?`, `padding va border kenglik ichida hisoblanadi — o'lchamlar oson boshqariladi`, [
      `Barcha elementlarga chegara qo'shadi`,
      `Margin'larni o'chiradi`,
      `Sahifani tezlashtiradi`,
    ]),
    c(`/* Elementning ekrandagi umumiy kengligi? */
.box {
  box-sizing: content-box;
  width: 200px;
  padding: 20px;
  border: 5px solid;
}`, `250px`, [`200px`, `225px`, `240px`]),
    c(`/* Elementning ekrandagi umumiy kengligi? */
.box {
  box-sizing: border-box;
  width: 200px;
  padding: 20px;
  border: 5px solid;
}`, `200px`, [`250px`, `150px`, `240px`]),
    c(`/* Ikki blok orasidagi vertikal masofa? */
.a { margin-bottom: 30px; }
.b { margin-top: 20px; }   /* .a dan keyin keladi */`, `30px — vertikal marginlar qo'shilmaydi, kattasi qoladi (margin collapse)`, [`50px`, `20px`, `10px`]),
  ]),

  css(17, 'Fon, chegara va soyalar', S1, [
    q(`Fonga rasm qo'yish?`, `background-image: url("bg.jpg")`, [`background: image("bg.jpg")`, `bg-image: "bg.jpg"`, `image: url(bg.jpg)`]),
    q(`Fon rasmi takrorlanmasligi uchun?`, `background-repeat: no-repeat`, [`background-repeat: none`, `repeat: false`, `background-loop: off`]),
    q(`Fon rasmi butun maydonni qoplasin (chetlari kesilsa ham)?`, `background-size: cover`, [`background-size: contain`, `background-size: 100px`, `background-fit: full`]),
    q(`background-size: contain nima qiladi?`, `Rasm to'liq ko'rinadi, bo'sh joy qolishi mumkin`, [`Rasm maydonni to'liq qoplaydi`, `Rasm takrorlanadi`, `Rasm yashirinadi`]),
    q(`Gradient fon qanday yoziladi?`, `background: linear-gradient(to right, red, blue)`, [`background: gradient(red, blue)`, `color: linear(red, blue)`, `background-gradient: red blue`]),
    q(`Burchaklarni yumaloqlash?`, `border-radius`, [`border-round`, `corner-radius`, `radius`]),
    q(`Kvadrat elementni doiraga aylantirish?`, `border-radius: 50%`, [`border-radius: 100px`, `shape: circle`, `border: round`]),
    q(`border: 2px solid #333 nimani bildiradi?`, `Qalinlik 2px, chiziq turi to'g'ri, rangi #333`, [`2 ta chegara`, `Faqat yuqori chegara`, `Xato yozilgan`]),
    q(`box-shadow: 0 4px 10px rgba(0,0,0,.2) dagi 10px nima?`, `Soyaning xiraligi (blur)`, [`Pastga siljish`, `Soya qalinligi`, `O'ngga siljish`]),
    q(`box-shadow'dagi inset kalit so'zi nima qiladi?`, `Soyani element ichiga tushiradi`, [`Soyani o'chiradi`, `Soyani kattalashtiradi`, `Soyani matnga beradi`]),
    q(`outline va border farqi?`, `outline joy egallamaydi va box model'ga kirmaydi`, [`Farqi yo'q`, `outline faqat rasmga ishlaydi`, `border joy egallamaydi`]),
    q(`background-attachment: fixed nima qiladi?`, `Sahifa aylantirilganda fon qimirlamaydi`, [`Fon rasmini yuklab oladi`, `Fonni markazlaydi`, `Fonni takrorlaydi`]),
    c(`/* Qaysi rasm ustida ko'rinadi? */
.hero {
  background: url(a.png), url(b.png);
}`, `a.png — ro'yxatda birinchisi eng ustda`, [`b.png — oxirgisi ustda`, `Ikkalasi aralashadi`, `Faqat bittasi yuklanadi`]),
  ]),

  css(18, 'display va overflow', S2, [
    q(`display: block element qanday joylashadi?`, `Yangi qatordan boshlanadi va butun kenglikni egallaydi`, [`Qator ichida turadi`, `Ko'rinmaydi`, `Ekranga yopishadi`]),
    q(`display: inline elementda nima ishlamaydi?`, `width va height`, [`color`, `font-size`, `background`]),
    q(`display: inline-block xususiyati?`, `Qator ichida turadi, lekin width/height va vertikal padding/margin ishlaydi`, [
      `Yangi qatordan boshlanadi`,
      `inline bilan bir xil`,
      `Faqat rasmlarga ishlaydi`,
    ]),
    q(`display: none va visibility: hidden farqi?`, `none — joy ham egallamaydi; hidden — ko'rinmaydi, joyi saqlanadi`, [
      `Farqi yo'q`,
      `hidden joy egallamaydi`,
      `none faqat rasmga ishlaydi`,
    ]),
    q(`opacity: 0 bo'lgan element...`, `Ko'rinmaydi, lekin joy egallaydi va bosish mumkin`, [`Butunlay o'chiriladi`, `Joy egallamaydi`, `Bosib bo'lmaydi va joyi yo'qoladi`]),
    q(`overflow: hidden nima qiladi?`, `Sig'magan qismni yashiradi`, [`Scroll qo'shadi`, `Elementni kattalashtiradi`, `Elementni yashiradi`]),
    q(`overflow: auto nima qiladi?`, `Kontent sig'masa scroll chiqaradi, sig'sa yo'q`, [`Doim scroll chiqaradi`, `Kontentni kesadi`, `Kontentni kichraytiradi`]),
    q(`<a> ga width berish uchun nima qilish kerak?`, `display: inline-block yoki block qilish`, [`width: !important yozish`, `position: absolute`, `Iloji yo'q`]),
    q(`Yonma-yon inline-block elementlar orasida kichik bo'shliq nimadan?`, `HTML'dagi bo'sh joy / qator ko'chishi matn bo'sh joyi sifatida ko'rinadi`, [
      `Brauzer xatosi`,
      `Standart margin`,
      `border tufayli`,
    ]),
    q(`<img> ostida kichik bo'sh joy qoladi — sababi va yechimi?`, `img inline bo'lgani uchun matn chizig'i (baseline) joyi qoladi; display: block yechadi`, [
      `Rasm faylida bo'sh joy bor`,
      `margin-bottom: 4px standart`,
      `Faqat padding: 0 yechadi`,
    ]),
    c(`/* span qanday ko'rinadi? */
span {
  width: 200px;
  height: 50px;
  background: red;
}`, `width va height ishlamaydi — qizil fon faqat matn atrofida`, [`200×50 qizil to'rtburchak`, `Ko'rinmaydi`, `Butun qatorni egallaydi`]),
  ]),

  css(19, 'Pozitsiyalash', S2, [
    q(`position'ning standart qiymati?`, `static`, [`relative`, `absolute`, `fixed`]),
    q(`position: relative nima qiladi?`, `Odatiy joyidan siljiydi, asl joyi bo'sh saqlanadi`, [
      `Oqimdan chiqib ketadi`,
      `Ekranga yopishadi`,
      `Hech narsa — top/left ishlamaydi`,
    ]),
    q(`position: absolute nimaga nisbatan joylashadi?`, `Eng yaqin pozitsiyalangan (static bo'lmagan) ota elementga`, [`Har doim body'ga`, `Ekranga`, `Oldingi qo'shnisiga`]),
    q(`Absolute element otasi ichida joylashishi uchun otaga odatda nima beriladi?`, `position: relative`, [`display: block`, `overflow: hidden`, `z-index: 1`]),
    q(`position: fixed nima qiladi?`, `Ekranga (viewport) nisbatan joylashadi, scroll'da qimirlamaydi`, [`Otaga yopishadi`, `Oqimda qoladi`, `Faqat yuqoriga yopishadi`]),
    q(`position: sticky qanday ishlaydi?`, `Belgilangan joyga yetguncha oddiy, keyin yopishib qoladi`, [`Doim ekranga yopishgan`, `Absolute bilan bir xil`, `Faqat footer uchun`]),
    q(`position: sticky ishlashi uchun nima shart?`, `top (yoki bottom, left…) qiymati berilishi`, [`z-index berilishi`, `display: flex`, `width berilishi`]),
    q(`z-index nima?`, `Ustma-ust tushgan elementlar tartibi — kattasi ustda`, [`Element o'lchami`, `Shaffoflik`, `Animatsiya tezligi`]),
    q(`z-index qachon ishlamaydi?`, `position: static elementda (flex/grid farzandi bo'lmasa)`, [`Manfiy qiymatda`, `Rasmlarda`, `Hech qachon — doim ishlaydi`]),
    q(`inset: 0 nimaga teng?`, `top: 0; right: 0; bottom: 0; left: 0`, [`margin: 0`, `padding: 0`, `z-index: 0`]),
    q(`absolute element boshqa elementlarga qanday ta'sir qiladi?`, `Oqimdan chiqadi — qolganlar uni yo'qdek joylashadi`, [
      `Qo'shnilarini suradi`,
      `Otasini kattalashtiradi`,
      `Boshqalarni yashiradi`,
    ]),
    c(`/* Bu kod nima qiladi? */
.child {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}`, `Elementni ota ichida aniq markazga qo'yadi`, [`Elementni yarmiga kichraytiradi`, `Elementni chap-yuqoriga qo'yadi`, `Elementni yashiradi`]),
    c(`/* .child va .b ustma-ust tushsa, qaysi biri ustda? */
.a        { position: relative; z-index: 1; }
.a .child { position: relative; z-index: 999; }
.b        { position: relative; z-index: 2; }`, `.b — .child baribir .a ning (z-index: 1) qatlami ichida qoladi`, [
      `.child — 999 katta`,
      `Qaysi biri HTML'da keyin bo'lsa`,
      `Ikkalasi shaffof bo'lib aralashadi`,
    ]),
  ]),

  css(20, 'Psevdo-klasslar va psevdo-elementlar', S2, [
    q(`Sichqoncha ustiga borganda stil berish?`, `:hover`, [`:active`, `:focus`, `:over`]),
    q(`Input'ga fokus tushganda stil?`, `:focus`, [`:hover`, `:selected`, `:input`]),
    q(`Otasining birinchi farzandini tanlash?`, `:first-child`, [`:first`, `:nth(1)`, `::first`]),
    q(`li:nth-child(2n) nimani tanlaydi?`, `Juft o'rindagi li larni`, [`Toq o'rindagilarni`, `Faqat 2-li ni`, `Har 3-ni`]),
    q(`li:nth-child(odd) nimani tanlaydi?`, `Toq o'rindagi li larni (1, 3, 5…)`, [`Juft o'rindagilarni`, `Oxirgisini`, `Birinchisini`]),
    q(`.item:not(.active) nimani tanlaydi?`, `active klassi bo'lmagan .item larni`, [`Faqat .active ni`, `Hech narsani`, `.active ichidagi .item ni`]),
    q(`::before va ::after nima?`, `Element kontentining oldi/oxiriga CSS orqali qo'shiladigan psevdo-element`, [`Oldingi va keyingi qo'shni element`, `Hover holati`, `Animatsiya bosqichi`]),
    q(`::before ko'rinishi uchun qaysi xususiyat majburiy?`, `content`, [`display`, `position`, `width`]),
    q(`Belgilangan (tanlangan) matn rangini o'zgartirish?`, `::selection`, [`:selected`, `::highlight`, `:checked`]),
    q(`":" va "::" farqi?`, `":" — psevdo-klass (holat), "::" — psevdo-element (elementning bir qismi)`, [`Farqi yo'q`, `"::" eski yozuv`, `":" faqat havolalar uchun`]),
    q(`:focus-visible nimasi bilan :focus dan farq qiladi?`, `Faqat klaviatura bilan fokuslanganda ishlaydi, sichqoncha bosilganda emas`, [
      `Faqat ko'rinadigan elementlarga ishlaydi`,
      `Farqi yo'q`,
      `Faqat input'larga ishlaydi`,
    ]),
    q(`input:checked + label nimani tanlaydi?`, `Belgilangan input'dan keyin darhol keladigan label'ni`, [`Barcha label'larni`, `Belgilanmagan input'ni`, `input ichidagi label'ni`]),
    q(`Tashrif buyurilgan havolalar uchun psevdo-klass?`, `:visited`, [`:link`, `:clicked`, `:active`]),
    c(`/* Qaysi elementlar qizil bo'ladi? */
li:nth-child(3n + 1) { color: red; }

<ul>
  <li>1</li><li>2</li><li>3</li>
  <li>4</li><li>5</li><li>6</li>
</ul>`, `1 va 4`, [`3 va 6`, `1, 3 va 6`, `2 va 5`]),
    c(`/* "p:nth-child(1)" nechta elementni tanlaydi? */
<div>
  <h2>Sarlavha</h2>
  <p>A</p>
  <p>B</p>
</div>`, `Hech qaysisini — 1-farzand h2`, [`1 ta — A`, `2 ta — A va B`, `1 ta — h2`]),
  ]),

  css(21, 'Flexbox: konteyner', S3, [
    q(`Flexbox qanday yoqiladi?`, `display: flex`, [`flex: on`, `display: flexbox`, `position: flex`]),
    q(`flex-direction'ning standart qiymati?`, `row`, [`column`, `row-reverse`, `wrap`]),
    q(`Elementlarni ustun bo'lib (pastga) joylash?`, `flex-direction: column`, [`flex-wrap: column`, `align-items: column`, `display: column`]),
    q(`Asosiy o'q bo'yicha tekislash xususiyati?`, `justify-content`, [`align-items`, `align-content`, `text-align`]),
    q(`Ko'ndalang o'q bo'yicha tekislash xususiyati?`, `align-items`, [`justify-content`, `justify-items`, `vertical-align`]),
    q(`Birinchi va oxirgisi chetlarda, qolganlari teng oraliqda?`, `justify-content: space-between`, [`space-around`, `space-evenly`, `center`]),
    q(`justify-content: space-evenly ning xususiyati?`, `Barcha oraliqlar, chetlar ham, teng bo'ladi`, [
      `Chetlarda oraliq yo'q`,
      `Chetlardagi oraliq yarim`,
      `Elementlar cho'ziladi`,
    ]),
    q(`Elementlar sig'masa keyingi qatorga o'tsin?`, `flex-wrap: wrap`, [`flex-direction: wrap`, `overflow: wrap`, `white-space: wrap`]),
    q(`Flex elementlar orasidagi masofa?`, `gap`, [`margin`, `space`, `flex-gap-only`]),
    q(`Elementni konteynerning aniq markaziga qo'yish?`, `display: flex; justify-content: center; align-items: center;`, [
      `display: flex; text-align: center;`,
      `display: flex; align-content: center;`,
      `display: flex; margin: center;`,
    ]),
    q(`flex-direction: column bo'lganda justify-content qaysi yo'nalishda ishlaydi?`, `Vertikal`, [`Gorizontal`, `Ikkalasida`, `Ishlamaydi`]),
    q(`align-items'ning standart qiymati?`, `stretch — elementlar ko'ndalang o'q bo'ylab cho'ziladi`, [`center`, `flex-start`, `baseline`]),
    q(`align-content qachon ta'sir qiladi?`, `Bir nechta qator bo'lganda (flex-wrap: wrap)`, [`Doim`, `Faqat column'da`, `Faqat bitta element bo'lsa`]),
    q(`flex-flow: row wrap nima?`, `flex-direction va flex-wrap ning qisqa yozuvi`, [`Animatsiya turi`, `justify-content qisqartmasi`, `Xato yozuv`]),
  ]),

  css(22, 'Flexbox: elementlar', S3, [
    q(`flex-grow: 1 nima qiladi?`, `Element bo'sh joyni egallab o'sadi`, [`Elementni kichraytiradi`, `Elementni 1px qiladi`, `Tartibni o'zgartiradi`]),
    q(`flex-shrink: 0 nima qiladi?`, `Joy yetmasa ham element kichraymaydi`, [`Elementni yashiradi`, `Element o'smaydi`, `Elementni 0 qiladi`]),
    q(`flex-basis nima?`, `Elementning asosiy o'q bo'yicha boshlang'ich o'lchami`, [`Element tartibi`, `Element orasidagi masofa`, `Minimal balandlik`]),
    q(`flex: 1 nimaning qisqartmasi?`, `flex: 1 1 0% — bo'sh joyni boshqalar bilan teng bo'lib oladi`, [`flex-grow: 1 xolos`, `width: 100%`, `order: 1`]),
    q(`order xususiyatining standart qiymati?`, `0`, [`1`, `-1`, `auto`]),
    q(`Bitta flex element uchun align-items'ni o'zgartirish?`, `align-self`, [`align-item`, `justify-self`, `self-align`]),
    q(`Flex elementga margin-left: auto berilsa?`, `Element (va undan keyingilar) o'ng chetga suriladi`, [`Markazga keladi`, `Hech narsa bo'lmaydi`, `Chapga yopishadi`]),
    q(`flex: none nimaga teng?`, `0 0 auto — o'smaydi ham, kichraymaydi ham`, [`display: none`, `flex: 0 1 auto`, `flex: 1`]),
    q(`Uzun matnli flex element kichraymay, konteynerdan toshib ketyapti. Nima yordam beradi?`, `min-width: 0`, [`flex-grow: 0`, `order: -1`, `align-self: center`]),
    c(`/* 2-element kengligi qancha? */
.box  { display: flex; width: 600px; }
.item { flex-basis: 0; }
.i1 { flex-grow: 1; }
.i2 { flex-grow: 2; }
.i3 { flex-grow: 3; }`, `200px`, [`100px`, `300px`, `600px`]),
    c(`/* .a ning kengligi qancha? */
.box { display: flex; width: 500px; }
.a { width: 100px; flex-grow: 1; }
.b { width: 100px; flex-grow: 0; }`, `400px`, [`250px`, `100px`, `300px`]),
    c(`/* HTML tartibi: a, b, c. Ekranda qanday tartibda ko'rinadi? */
.a { order: 2; }
.b { order: -1; }
.c { /* order yo'q */ }`, `b, c, a`, [`a, b, c`, `c, b, a`, `b, a, c`]),
    c(`/* Bu qanday natija beradi? */
body { min-height: 100vh; display: flex; flex-direction: column; }
main { flex: 1; }`, `Kontent kam bo'lsa ham footer sahifa pastida turadi`, [
      `main yashirinadi`,
      `footer tepaga chiqadi`,
      `Sahifa gorizontal bo'ladi`,
    ]),
  ]),

  css(23, 'Grid asoslari', S3, [
    q(`Grid qanday yoqiladi?`, `display: grid`, [`display: table`, `grid: on`, `display: flex-grid`]),
    q(`3 ta teng ustun yaratish?`, `grid-template-columns: repeat(3, 1fr)`, [`grid-columns: 3`, `columns: 3 equal`, `grid-template-rows: repeat(3, 1fr)`]),
    q(`fr birligi nima?`, `Bo'sh joyning ulushi (fraction)`, [`Frame — kadr`, `Shrift o'lchami`, `Foiz`]),
    q(`Grid katakchalari orasidagi masofa?`, `gap`, [`margin`, `grid-space`, `padding`]),
    q(`Element 2 ta ustunni egallashi uchun?`, `grid-column: span 2`, [`grid-span: 2`, `colspan: 2`, `grid-column: 2`]),
    q(`grid-column: 1 / 3 nimani bildiradi?`, `1-chiziqdan 3-chiziqqacha — 2 ta ustun`, [`3 ta ustun`, `1 va 3-ustun`, `1/3 qismi`]),
    q(`grid-column: 1 / -1 nimani bildiradi?`, `Butun qator bo'ylab — birinchidan oxirgi chiziqqacha`, [`Oxirgi ustun`, `Teskari tartib`, `Bitta ustun`]),
    q(`grid-template-columns: 200px 1fr?`, `Birinchi ustun 200px, ikkinchisi qolgan joyni egallaydi`, [`Ikkalasi 200px`, `Ikkinchisi 1px`, `Xato`]),
    q(`Flexbox va Grid asosiy farqi?`, `Flex — bir o'lchamli (qator yoki ustun), Grid — ikki o'lchamli (qator va ustun birga)`, [
      `Farqi yo'q`,
      `Grid eski, Flex yangi`,
      `Flex faqat matn uchun`,
    ]),
    q(`grid-template-rows: auto 1fr auto ko'pincha nima uchun?`, `Header, cho'ziladigan kontent va footer maketi`, [`3 ta teng qator`, `Jadval`, `Animatsiya`]),
    c(`/* 3-ustun kengligi? */
.grid {
  display: grid;
  width: 1000px;
  grid-template-columns: 100px 1fr 2fr;
}`, `600px`, [`300px`, `666px`, `450px`]),
    c(`/* Har bir ustun kengligi? */
.grid {
  display: grid;
  width: 620px;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}`, `200px`, [`206px`, `210px`, `193px`]),
    c(`/* 7 ta element nechta qatorga joylashadi? */
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}`, `3`, [`2`, `7`, `1 — qolganlari yashirinadi`]),
  ]),

  css(24, 'Grid: hududlar va responsive grid', S3, [
    q(`grid-template-areas nima uchun?`, `Maket hududlarini nom bilan "chizish" va elementlarni grid-area bilan joylash`, [
      `Grid o'lchamini belgilash`,
      `Animatsiya uchun`,
      `Rasmlar galereyasi uchun maxsus`,
    ]),
    q(`Elementni "header" hududiga joylash?`, `grid-area: header`, [`area: header`, `grid-template: header`, `grid-name: header`]),
    q(`grid-template-areas da bo'sh katak qanday belgilanadi?`, `Nuqta (.)`, [`Bo'sh joy`, `0`, `none`]),
    q(`minmax(200px, 1fr) nimani bildiradi?`, `Kamida 200px, ko'pi bilan 1fr`, [`200px dan 1px gacha`, `Doim 200px`, `200 ta ustun`]),
    q(`repeat(auto-fit, minmax(250px, 1fr)) nima beradi?`, `Media query'siz responsive kartochkalar — sig'gancha ustun`, [
      `Doim 4 ta ustun`,
      `250 ta ustun`,
      `Faqat mobil uchun bitta ustun`,
    ]),
    q(`auto-fill va auto-fit farqi?`, `auto-fill bo'sh ustunlarni saqlab qoladi, auto-fit ularni yig'ib elementlarni cho'zadi`, [
      `Farqi yo'q`,
      `auto-fit bo'sh ustunlarni saqlaydi`,
      `auto-fill faqat qatorlar uchun`,
    ]),
    q(`place-items: center nimaga teng?`, `align-items: center + justify-items: center`, [`justify-content: center`, `text-align: center`, `margin: auto`]),
    q(`Grid'da justify-items va justify-content farqi?`, `justify-items — katak ichida elementni, justify-content — butun grid'ni konteyner ichida tekislaydi`, [
      `Farqi yo'q`,
      `justify-content faqat flex'da`,
      `justify-items butun grid'ni suradi`,
    ]),
    q(`grid-auto-rows: 150px nima qiladi?`, `Avtomatik yaratilgan qatorlar balandligini 150px qiladi`, [`Faqat birinchi qatorni`, `Qatorlar sonini 150 qiladi`, `Ustun kengligini`]),
    q(`grid-auto-flow: dense nima qiladi?`, `Bo'sh qolgan kataklarni keyingi kichik elementlar bilan to'ldiradi`, [`Elementlarni zichlashtirib kichraytiradi`, `Gap'ni olib tashlaydi`, `Ustunlarni birlashtiradi`]),
    q(`subgrid nima?`, `Ichki grid ota grid'ning qator/ustun chiziqlarini ishlatadi`, [`Grid ichidagi flex`, `Kichik grid`, `Eski grid sintaksisi`]),
    c(`/* .header nechta ustun egallaydi? */
.page {
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-template-areas:
    "head head"
    "side main";
}
.header { grid-area: head; }`, `2 ta — butun qator`, [`1 ta`, `3 ta`, `Hech qaysi — xato`]),
    c(`/* Bu e'lon qanday natija beradi? */
.grid {
  display: grid;
  grid-template-areas:
    "a a"
    "b a";
}`, `Xato: "a" hududi to'rtburchak emas — butun e'lon e'tiborsiz qoldiriladi`, [
      `"a" 3 ta katakni egallaydi`,
      `"b" yashirinadi`,
      `Brauzer avtomatik tuzatadi`,
    ]),
  ]),

  css(25, 'Responsive dizayn', S4, [
    q(`Responsive dizayn nima?`, `Sahifa har xil ekran o'lchamlariga moslashib ko'rinishi`, [`Tez yuklanadigan sayt`, `Animatsiyali sayt`, `Faqat mobil uchun sayt`]),
    q(`Media query qanday yoziladi?`, `@media (max-width: 768px) { … }`, [`@screen 768px { … }`, `media(768) { … }`, `@if (width < 768) { … }`]),
    q(`Mobile-first yondashuvi nima?`, `Avval mobil uchun stil, keyin min-width bilan katta ekranlar`, [
      `Faqat mobil versiya`,
      `Avval kompyuter, keyin max-width bilan mobil`,
      `Mobil uchun alohida sayt`,
    ]),
    q(`Mobile-first'da odatda qaysi shart ishlatiladi?`, `min-width`, [`max-width`, `orientation`, `max-height`]),
    q(`Rasm o'z konteyneridan oshib ketmasligi uchun?`, `max-width: 100%; height: auto;`, [`width: auto;`, `overflow: hidden;`, `size: contain;`]),
    q(`<meta name="viewport"> yozilmasa telefonda nima bo'ladi?`, `Sahifa ~980px kenglikda chizilib, kichraytirilgan holda ko'rinadi`, [
      `Hech narsa o'zgarmaydi`,
      `Sahifa ochilmaydi`,
      `Faqat matn ko'rinadi`,
    ]),
    q(`@media (prefers-color-scheme: dark) qachon ishlaydi?`, `Foydalanuvchi qurilmasida qorong'i rejim tanlangan bo'lsa`, [`Kechqurun`, `Ekran qorong'i bo'lsa`, `Har doim`]),
    q(`@media (prefers-reduced-motion: reduce) nima uchun?`, `Harakatni kamaytirishni xohlagan foydalanuvchilar uchun animatsiyani o'chirish`, [
      `Sekin internet uchun`,
      `Batareyani tejash rejimi`,
      `Eski brauzerlar uchun`,
    ]),
    q(`Breakpoint (o'tish nuqtasi) qanday tanlanadi?`, `Kontent buzila boshlagan kenglikka qarab`, [`Faqat iPhone o'lchamlariga qarab`, `Har 100px da`, `Doim 768px`]),
    q(`clamp(16px, 4vw, 24px) nimani bildiradi?`, `4vw, lekin 16px dan kichik va 24px dan katta emas`, [`16px, 4vw va 24px ning o'rtachasi`, `Tasodifiy qiymat`, `Doim 24px`]),
    q(`Ekran kengligi 500px bo'lsa, clamp(16px, 4vw, 24px) qancha?`, `20px`, [`16px`, `24px`, `4px`]),
    c(`/* Ekran 800px. p ning shrift o'lchami? */
p { font-size: 14px; }
@media (min-width: 600px)  { p { font-size: 16px; } }
@media (min-width: 1000px) { p { font-size: 18px; } }`, `16px`, [`14px`, `18px`, `15px`]),
    c(`/* Ekran 1200px. .box rangi? */
@media (min-width: 600px) {
  .box { color: red; }
}
.box { color: blue; }`, `blue — specificity teng, keyin yozilgani ustun`, [`red — media query ustun`, `Ikkalasi aralashadi`, `Qora`]),
  ]),

  css(26, 'Transition va transform', S4, [
    q(`transition nima qiladi?`, `Xususiyat o'zgarishini silliq (animatsiyali) qiladi`, [`Elementni ko'chiradi`, `Rangni o'zgartiradi`, `Elementni aylantiradi`]),
    q(`transition: background-color 0.3s ease dagi 0.3s?`, `Davomiyligi`, [`Kechikish`, `Takrorlar soni`, `Tezlik koeffitsienti`]),
    q(`Hover'dan chiqqanda ham silliq qaytishi uchun transition qayerga yoziladi?`, `Elementning asosiy holatiga (hover'ga emas)`, [`Faqat :hover ichiga`, `body ga`, `Ikkalasiga ham shart`]),
    q(`Qaysi xususiyatni transition bilan silliq o'zgartirib bo'lmaydi?`, `display`, [`opacity`, `transform`, `width`]),
    q(`transform: translateX(50px) nima qiladi?`, `Elementni 50px o'ngga siljitadi, boshqa elementlar joyidan qimirlamaydi`, [
      `Elementni 50px kattalashtiradi`,
      `Qo'shni elementlarni suradi`,
      `margin-left: 50px bilan aynan bir xil`,
    ]),
    q(`Elementni 45 gradusga aylantirish?`, `transform: rotate(45deg)`, [`rotate: 45`, `transform: turn(45)`, `transform: angle(45deg)`]),
    q(`transform: scale(1.2) nima qiladi?`, `Elementni 1.2 marta kattalashtiradi`, [`1.2px ga kattalashtiradi`, `120px qiladi`, `Kichraytiradi`]),
    q(`transform-origin nima?`, `Aylantirish va kattalashtirish qaysi nuqta atrofida bo'lishi`, [`Element boshlang'ich joyi`, `Animatsiya boshlanish vaqti`, `Soya yo'nalishi`]),
    q(`ease-in-out qanday harakat?`, `Sekin boshlanib, tezlashib, sekin tugaydi`, [`Bir xil tezlikda`, `Tez boshlanib sekinlashadi`, `Sakrab-sakrab`]),
    q(`Qaysi xususiyatlarni animatsiya qilish eng tejamkor?`, `transform va opacity`, [`width va height`, `top va left`, `margin va padding`]),
    q(`transform: translateX(100px) rotate(90deg) va rotate(90deg) translateX(100px) — natija bir xilmi?`, `Yo'q — transformlar tartibi natijaga ta'sir qiladi`, [
      `Ha, tartib muhim emas`,
      `Ikkinchisi xato`,
      `Faqat brauzerga bog'liq`,
    ]),
    c(`/* Atrofdagi elementlar uchun .box qancha joy egallaydi? */
.box {
  width: 100px;
  transform: scale(2);
}`, `100px — transform oqimga ta'sir qilmaydi`, [`200px`, `50px`, `0px`]),
  ]),

  css(27, 'Animatsiyalar (@keyframes)', S4, [
    q(`@keyframes nima uchun?`, `Animatsiya bosqichlarini e'lon qilish uchun`, [`Klaviatura tugmalari uchun`, `Shrift ulash uchun`, `Media query uchun`]),
    q(`Elementga animatsiyani ulash xususiyati?`, `animation-name`, [`keyframes-name`, `animate`, `transition-name`]),
    q(`Animatsiya cheksiz takrorlansin?`, `animation-iteration-count: infinite`, [`animation-loop: true`, `animation-repeat: always`, `animation: forever`]),
    q(`@keyframes ichida from va to nimaga teng?`, `0% va 100%`, [`Boshlanish va tugash vaqti`, `1 va 10`, `Birinchi va oxirgi element`]),
    q(`animation-direction: alternate nima qiladi?`, `Har takrorda yo'nalishni almashtiradi — oldinga, orqaga`, [`Teskari ijro`, `Tasodifiy tartib`, `Ikki baravar tez`]),
    q(`animation-fill-mode: forwards nima qiladi?`, `Animatsiya tugagach element oxirgi kadrdagi holatda qoladi`, [`Animatsiyani oldinga suradi`, `Animatsiyani tezlashtiradi`, `Boshidan qaytadan boshlaydi`]),
    q(`Animatsiyani to'xtatib turish?`, `animation-play-state: paused`, [`animation: stop`, `animation-pause: true`, `animation-duration: 0`]),
    q(`animation: spin 2s linear infinite — qismlari?`, `nom, davomiylik, tezlik egri chizig'i, takror soni`, [`nom, kechikish, yo'nalish, takror`, `davomiylik, nom, rang, takror`, `Xato yozuv`]),
    q(`steps(4) timing function nima qiladi?`, `Animatsiyani 4 ta sakrash bilan bajaradi (sprite animatsiya)`, [`4 marta takrorlaydi`, `4 soniya davom etadi`, `4 ta elementga qo'llaydi`]),
    q(`transition va animation farqi?`, `transition holat o'zgarishiga javob beradi; animation o'zi boshlanadi va bir nechta bosqichli bo'la oladi`, [
      `Farqi yo'q`,
      `transition takrorlana oladi, animation yo'q`,
      `animation faqat hover'da ishlaydi`,
    ]),
    q(`animation-delay: -1s nima qiladi?`, `Animatsiya 1 soniya o'tgan joyidan darhol boshlanadi`, [`Xato beradi`, `Animatsiya teskari ijro etiladi`, `1 soniya kutadi`]),
    c(`/* Animatsiya tugagach .box ning opacity'si qancha? */
@keyframes fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.box { animation: fade 1s 2 alternate; }`, `1 — fill-mode yo'q, element o'z qiymatiga qaytadi`, [`0`, `0.5`, `Animatsiya to'xtamaydi`]),
  ]),

  css(28, "CSS o'zgaruvchilar va funksiyalar", S5, [
    q(`CSS o'zgaruvchi qanday e'lon qilinadi?`, `--main-color: #333;`, [`$main-color: #333;`, `var main-color = #333;`, `@main-color: #333;`]),
    q(`O'zgaruvchi qanday ishlatiladi?`, `color: var(--main-color);`, [`color: --main-color;`, `color: $main-color;`, `color: get(--main-color);`]),
    q(`Global o'zgaruvchilar odatda qayerda e'lon qilinadi?`, `:root da`, [`body da`, `* da`, `@global da`]),
    q(`O'zgaruvchi topilmasa zaxira qiymat berish?`, `var(--x, blue)`, [`var(--x || blue)`, `var(--x) or blue`, `var(--x ?? blue)`]),
    q(`width: calc(100% - 60px) nima qiladi?`, `Ota kengligidan 60px kam kenglik beradi`, [`Xato beradi`, `100px - 60px = 40px`, `60% beradi`]),
    q(`calc() da qaysi operatorlar atrofida bo'sh joy majburiy?`, `+ va -`, [`* va /`, `Hammasida`, `Hech birida`]),
    q(`width: min(100%, 600px) nima qiladi?`, `Ikkisidan kichigini oladi — 600px dan oshmaydi`, [`Kattasini oladi`, `O'rtachasini oladi`, `Doim 100%`]),
    q(`CSS o'zgaruvchilari meros o'tadimi?`, `Ha — ota elementda e'lon qilingani farzandlarda ham ishlaydi`, [`Yo'q, faqat o'sha elementda`, `Faqat :root dagilari`, `Faqat !important bilan`]),
    q(`JavaScript'dan CSS o'zgaruvchisini o'zgartirish?`, `el.style.setProperty('--x', '5px')`, [`el.style.--x = '5px'`, `css.set('--x', '5px')`, `el.var('--x', '5px')`]),
    q(`Dark mode'ni o'zgaruvchilar bilan qilishning odatiy yo'li?`, `Ranglarni o'zgaruvchiga olib, [data-theme="dark"] da qayta e'lon qilish`, [
      `Har bir elementga alohida dark klass`,
      `filter: invert(1)`,
      `Ikkinchi CSS fayl`,
    ]),
    q(`CSS o'zgaruvchilari Sass ($var) o'zgaruvchilaridan nimasi bilan farq qiladi?`, `Brauzerda ishlaydi, ishlash vaqtida o'zgaradi va meros o'tadi`, [
      `Farqi yo'q`,
      `Sass'nikidan tezroq kompilyatsiya qilinadi`,
      `Faqat ranglar uchun`,
    ]),
    c(`/* .card ichidagi p ning margin'i? */
:root     { --gap: 10px; }
.card     { --gap: 20px; }
.card p   { margin: var(--gap); }`, `20px`, [`10px`, `30px`, `0`]),
    c(`/* .box kengligi? */
.box {
  --size: 20;
  width: calc(var(--size) * 1px);
}`, `20px`, [`20`, `Xato — birliksiz son`, `1px`]),
  ]),

  css(29, 'Zamonaviy CSS imkoniyatlari', S5, [
    q(`Elementni doim 16:9 nisbatda saqlash?`, `aspect-ratio: 16 / 9`, [`ratio: 16:9`, `height: 56.25vw`, `size: 16/9`]),
    q(`object-fit: cover rasmga nima qiladi?`, `Ramkani to'ldiradi, nisbatni saqlab, ortiqchasini kesadi`, [`Rasmni cho'zadi`, `Rasm to'liq ko'rinadi, bo'sh joy qoladi`, `Rasmni takrorlaydi`]),
    q(`:is(h1, h2, h3) a nimaga teng?`, `h1 a, h2 a, h3 a`, [`h1 h2 h3 a`, `Faqat h1 a`, `h1 + h2 + h3 a`]),
    q(`:where() ning specificity'si qancha?`, `0 — hech qachon ustunlik qilmaydi`, [`Ichidagi eng kuchli selektorniki`, `Har doim 1`, `id bilan teng`]),
    q(`.card:has(img) nimani tanlaydi?`, `Ichida img bor .card larni`, [`.card ichidagi img ni`, `img dan keyingi .card ni`, `img klassli .card ni`]),
    q(`CSS nesting'da &:hover nimani bildiradi?`, `Ota selektorning o'zi hover holatida`, [`Ichidagi barcha elementlar hover'da`, `Xato sintaksis`, `Ota elementning otasi`]),
    q(`Container queries (@container) nima?`, `Ekranga emas, konteyner o'lchamiga qarab stil berish`, [`Media query'ning eski nomi`, `Grid konteyneri`, `JS bilan o'lcham olish`]),
    q(`@container ishlashi uchun otaga nima yoziladi?`, `container-type: inline-size`, [`display: container`, `position: container`, `contain: all`]),
    q(`margin-inline-start nimani bildiradi?`, `Yozuv yo'nalishiga qarab chap (ltr) yoki o'ng (rtl) margin`, [`Faqat chap margin`, `Yuqori margin`, `Inline elementlar margin'i`]),
    q(`Checkbox va radio rangini oson o'zgartirish?`, `accent-color`, [`color`, `checkbox-color`, `fill`]),
    q(`Sahifa ichidagi havolaga silliq aylantirish?`, `html { scroll-behavior: smooth; }`, [`scroll: smooth;`, `transition: scroll 1s;`, `overflow: smooth;`]),
    c(`/* <div class="box"><p>…</p></div> (#main yo'q) — p rangi? */
:is(#main, .box) p { color: red; }   /* A */
.box p             { color: blue; }  /* B */`, `red — :is() ichidagi eng kuchli selektor (#main) specificity'sini oladi`, [
      `blue — keyin yozilgan`,
      `blue — #main yo'q, shuning uchun A ishlamaydi`,
      `Ikkalasi ham ishlamaydi`,
    ]),
    c(`/* <div class="box"><p>…</p></div> — p rangi? */
:where(.box) p { color: red; }
p              { color: blue; }`, `blue — :where() 0 ga teng, specificity tenglashdi va keyingisi yutdi`, [
      `red — .box klassi kuchliroq`,
      `Ikkalasi aralashadi`,
      `Qora`,
    ]),
  ]),

  css(30, 'CSS arxitekturasi va yaxshi amaliyotlar', S5, [
    q(`BEM'da card__title--big nimani bildiradi?`, `Blok: card, element: title, modifikator: big`, [
      `Uchta alohida klass`,
      `card ichidagi title ichidagi big`,
      `Xato nomlash`,
    ]),
    q(`CSS reset / normalize nima uchun?`, `Brauzerlarning standart stillarini bir xillashtirish`, [`Barcha CSS'ni o'chirish`, `Saytni tezlashtirish`, `Xatolarni tuzatish`]),
    q(`Nega id orqali stil berish tavsiya qilinmaydi?`, `Specificity juda yuqori — ustidan yozish va qayta ishlatish qiyin`, [`id ishlamaydi`, `Sekin ishlaydi`, `Faqat JS uchun`]),
    q(`Utility-first (Tailwind) yondashuvi nima?`, `Bitta vazifali kichik klasslar bilan HTML'da stil berish`, [`Faqat inline style`, `Faqat CSS o'zgaruvchilar`, `Har komponentga alohida CSS fayl`]),
    q(`-webkit- kabi prefikslar nima?`, `Ba'zi brauzerlarga xos yoki eski imkoniyatlar uchun prefiks`, [`Xato yozuv`, `Mobil uchun stil`, `CSS o'zgaruvchi`]),
    q(`Element qaysi CSS qoidalaridan stil olayotganini qayerda ko'rasiz?`, `DevTools → Elements → Styles (ustidan yozilganlari chizilgan)`, [`Console`, `Network`, `Hech qayerda`]),
    q(`font-display: swap nima qiladi?`, `Shrift yuklanguncha matn zaxira shrift bilan ko'rinib turadi`, [`Shriftlarni almashtiradi`, `Shriftni yashiradi`, `Shriftni oldindan yuklaydi`]),
    q(`Qaysi xususiyatni animatsiya qilish eng qimmat (layout qayta hisoblanadi)?`, `width`, [`transform`, `opacity`, `color`]),
    q(`will-change: transform nima uchun?`, `Brauzerga bu xususiyat o'zgarishini oldindan aytib, optimallashtirishga imkon beradi`, [
      `Transformni majburiy qiladi`,
      `Transformni o'chiradi`,
      `Animatsiyani tezlashtiradi — doim yozish kerak`,
    ]),
    q(`CSS ichida @import ishlatishning kamchiligi?`, `Fayllar ketma-ket yuklanadi — sahifa sekinlashadi`, [`Ishlamaydi`, `Faqat bitta fayl ulanadi`, `Kamchiligi yo'q`]),
    q(`!important o'rniga nima qilish kerak?`, `Selektorlarni to'g'ri tuzib, klasslar bilan boshqarish`, [`Ko'proq !important yozish`, `Inline style ishlatish`, `id ishlatish`]),
    c(`/* Bu qoida nima qiladi? */
.list li + li {
  margin-top: 12px;
}`, `Birinchisidan tashqari har bir li ustiga 12px joy qo'shadi`, [
      `Hamma li ga 12px`,
      `Faqat ikkinchi li ga`,
      `Faqat oxirgi li ga`,
    ]),
    c(`/* <button class="btn--big btn"> ning padding'i? */
.btn      { padding: 8px 16px; }
.btn--big { padding: 12px 24px; }`, `12px 24px — HTML'dagi klass tartibi emas, CSS'dagi tartib muhim`, [
      `8px 16px — HTML'da btn oxirida`,
      `20px 40px — qo'shiladi`,
      `Ikkalasi ham ishlamaydi`,
    ]),
  ]),
]
