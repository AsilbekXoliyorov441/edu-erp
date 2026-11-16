import { q, c, topic } from './build'

const S1 = '1-modul. Asoslar'
const S2 = "2-modul. Funksiyalar va ma'lumotlar"
const S3 = '3-modul. DOM va brauzer'
const S4 = '4-modul. Asinxron JavaScript'
const S5 = '5-modul. OOP va chuqur mavzular'

/** JavaScript topics are titled "JS 5-mavzu. …", not "5-dars": a frontend group's lessons are
 * numbered from the start of the course (HTML/CSS first), so "5-dars" would unlock JavaScript
 * in the town far too early. Without a lesson number JavaScript opens after the HTML/CSS stage. */
const js = (n, name, section, items) => topic(`JS ${n}-mavzu. ${name}`, 'javascript', section, items)

export const JAVASCRIPT = [
  js(1, "Kirish va o'zgaruvchilar", S1, [
    q(`JavaScript sahifada nima uchun ishlatiladi?`, `Sahifani interaktiv qilish: tugmalar, formalar, ma'lumot yuklash`, [
      `Faqat ranglar berish uchun`,
      `Sahifa tuzilishini yaratish uchun`,
      `Rasmlarni siqish uchun`,
    ]),
    q(`Konsolga ma'lumot chiqarish?`, `console.log()`, [`print()`, `echo()`, `document.log()`]),
    q(`Tashqi JS fayl qanday ulanadi?`, `<script src="app.js"></script>`, [`<link href="app.js">`, `<js src="app.js">`, `<script href="app.js">`]),
    q(`Qiymati qayta o'zlashtirilmaydigan o'zgaruvchi?`, `const`, [`let`, `var`, `static`]),
    q(`let va var asosiy farqi?`, `let blok ichida ko'rinadi (block scope), var — butun funksiya bo'ylab`, [`Farqi yo'q`, `var yangi, let eski`, `let faqat sonlar uchun`]),
    q(`Qaysi o'zgaruvchi nomi to'g'ri?`, `userName`, [`2name`, `user-name`, `let`]),
    q(`JavaScript katta-kichik harfni farqlaydimi?`, `Ha — name va Name ikki xil o'zgaruvchi`, [`Yo'q`, `Faqat funksiyalarda`, `Faqat stringlarda`]),
    q(`JS'da bir qatorli izoh?`, `// izoh`, [`<!-- izoh -->`, `# izoh`, `-- izoh`]),
    c(`// Natija?
const x = 5;
x = 10;
console.log(x);`, `TypeError: const o'zgaruvchiga qayta qiymat berib bo'lmaydi`, [`10`, `5`, `undefined`]),
    c(`// Natija?
const arr = [1, 2];
arr.push(3);
console.log(arr);`, `[1, 2, 3] — const havolani qotiradi, massiv ichi o'zgarishi mumkin`, [`TypeError`, `[1, 2]`, `[3]`]),
    c(`// Natija?
let a = 1;
{
  let a = 2;
}
console.log(a);`, `1`, [`2`, `SyntaxError`, `undefined`]),
    c(`// Natija?
console.log(b);
var b = 5;`, `undefined — var e'loni yuqoriga ko'tariladi (hoisting), qiymati emas`, [`5`, `ReferenceError`, `null`]),
    c(`// Natija?
console.log(c);
let c = 5;`, `ReferenceError — let e'lon qilinguncha ishlatib bo'lmaydi (TDZ)`, [`undefined`, `5`, `null`]),
  ]),

  js(2, "Ma'lumot turlari", S1, [
    q(`JavaScript'da nechta primitiv tur bor?`, `7 ta: string, number, bigint, boolean, undefined, null, symbol`, [`3 ta`, `5 ta`, `10 ta`]),
    q(`typeof "salom" natijasi?`, `"string"`, [`"text"`, `"char"`, `"object"`]),
    q(`typeof 42 natijasi?`, `"number"`, [`"integer"`, `"int"`, `"float"`]),
    q(`typeof null natijasi?`, `"object" — tilning tarixiy xatosi`, [`"null"`, `"undefined"`, `"empty"`]),
    q(`typeof [] natijasi?`, `"object"`, [`"array"`, `"list"`, `"undefined"`]),
    q(`typeof function () {} natijasi?`, `"function"`, [`"object"`, `"method"`, `"code"`]),
    q(`null va undefined farqi?`, `undefined — qiymat berilmagan; null — ataylab "bo'sh" deb qo'yilgan qiymat`, [`Farqi yo'q`, `null — xato, undefined — normal`, `undefined faqat funksiyalarda`]),
    q(`typeof NaN natijasi?`, `"number"`, [`"NaN"`, `"undefined"`, `"error"`]),
    q(`O'zgaruvchi massiv ekanini to'g'ri tekshirish?`, `Array.isArray(x)`, [`typeof x === "array"`, `x.isArray()`, `x instanceof List`]),
    c(`// Natija?
let x;
console.log(x);`, `undefined`, [`null`, `0`, `ReferenceError`]),
    c(`// Natija?
console.log(0.1 + 0.2 === 0.3);`, `false — kasr sonlar ikkilikda aniq saqlanmaydi`, [`true`, `undefined`, `NaN`]),
    c(`// Natija?
console.log(typeof typeof 1);`, `"string"`, [`"number"`, `"typeof"`, `"undefined"`]),
  ]),

  js(3, 'Operatorlar', S1, [
    q(`10 % 3 natijasi?`, `1`, [`3`, `3.33`, `0`]),
    q(`2 ** 3 natijasi?`, `8`, [`6`, `5`, `9`]),
    q(`== va === farqi?`, `=== tur va qiymatni birga solishtiradi, == turini o'zgartirib solishtiradi`, [`Farqi yo'q`, `== qat'iyroq`, `=== faqat sonlar uchun`]),
    q(`"5" == 5 natijasi?`, `true`, [`false`, `TypeError`, `undefined`]),
    q(`"5" === 5 natijasi?`, `false`, [`true`, `TypeError`, `undefined`]),
    q(`&& operatori qachon true beradi?`, `Ikkala tomon ham true bo'lsa`, [`Bittasi true bo'lsa`, `Ikkalasi false bo'lsa`, `Doim`]),
    q(`x += 5 nimaga teng?`, `x = x + 5`, [`x = 5`, `x == 5`, `x = x * 5`]),
    c(`// Natija?
let i = 5;
console.log(i++);`, `5`, [`6`, `4`, `undefined`]),
    c(`// Natija?
let i = 5;
console.log(++i + i++);`, `12`, [`11`, `13`, `10`]),
    c(`// Natija?
console.log("3" + 2);`, `"32"`, [`5`, `"5"`, `NaN`]),
    c(`// Natija?
console.log("3" - 2);`, `1`, [`"32"`, `"1"`, `NaN`]),
    c(`// Natija?
console.log(null == undefined, null === undefined);`, `true false`, [`true true`, `false false`, `false true`]),
    c(`// Natija?
console.log(NaN === NaN);`, `false`, [`true`, `NaN`, `TypeError`]),
  ]),

  js(4, "Tur o'zgartirish, truthy va falsy", S1, [
    q(`"42" ni songa aylantirish?`, `Number("42")`, [`"42".toNumber()`, `int("42")`, `Integer("42")`]),
    q(`parseInt("42px") natijasi?`, `42`, [`NaN`, `"42"`, `42px`]),
    q(`Number("42px") natijasi?`, `NaN`, [`42`, `0`, `"42"`]),
    q(`Qaysi qiymat falsy?`, `0`, [`"0"`, `[]`, `{}`]),
    q(`Boolean("false") natijasi?`, `true — bo'sh bo'lmagan har qanday string truthy`, [`false`, `undefined`, `TypeError`]),
    q(`!!"" natijasi?`, `false`, [`true`, `""`, `undefined`]),
    c(`// Natija?
console.log(1 + true);`, `2`, [`"1true"`, `NaN`, `1`]),
    c(`// Natija?
console.log("5" * "2");`, `10`, [`"52"`, `"10"`, `NaN`]),
    c(`// Natija?
console.log(+"");`, `0`, [`NaN`, `""`, `undefined`]),
    c(`// Natija?
console.log([] == false);`, `true — [] avval "" ga, keyin 0 ga aylanadi`, [`false`, `TypeError`, `undefined`]),
    c(`// Natija?
console.log(isNaN("abc"), Number.isNaN("abc"));`, `true false`, [`true true`, `false false`, `false true`]),
    c(`// Natija?
console.log([1, 2] + [3]);`, `"1,23"`, [`[1, 2, 3]`, `6`, `"[1,2][3]"`]),
  ]),

  js(5, 'Shartlar', S1, [
    q(`if to'g'ri yozilishi?`, `if (x > 5) { … }`, [`if x > 5 then { … }`, `if [x > 5] { … }`, `if x > 5: …`]),
    q(`Ternar operator sintaksisi?`, `shart ? qiymat1 : qiymat2`, [`shart ?? qiymat1 : qiymat2`, `if shart ? qiymat1`, `shart : qiymat1 ? qiymat2`]),
    q(`switch'da break yozilmasa nima bo'ladi?`, `Keyingi case'lar ham ketma-ket bajarilaveradi`, [`Xato beradi`, `Faqat o'sha case bajariladi`, `switch qayta boshlanadi`]),
    q(`switch qiymatlarni qanday solishtiradi?`, `=== bilan (qat'iy)`, [`== bilan`, `> bilan`, `Faqat stringlarni`]),
    q(`switch'dagi default qachon ishlaydi?`, `Hech bir case mos kelmasa`, [`Doim birinchi`, `Har doim oxirida`, `Xato bo'lsa`]),
    c(`// Natija?
const age = 18;
console.log(age >= 18 ? "katta" : "kichik");`, `katta`, [`kichik`, `true`, `undefined`]),
    c(`// Natija?
let x = 0;
if (x) console.log("A");
else console.log("B");`, `B`, [`A`, `A va B`, `Hech narsa`]),
    c(`// Natija?
const n = 2;
switch (n) {
  case 1: console.log("bir");
  case 2: console.log("ikki");
  case 3: console.log("uch");
}`, `ikki, uch`, [`ikki`, `bir, ikki, uch`, `Hech narsa`]),
    c(`// Natija?
switch ("2") {
  case 2: console.log("son"); break;
  default: console.log("boshqa");
}`, `boshqa`, [`son`, `son, boshqa`, `TypeError`]),
    c(`// Natija?
console.log(0 || "salom");`, `"salom"`, [`0`, `true`, `false`]),
    c(`// Natija?
console.log(0 ?? "salom");`, `0 — ?? faqat null va undefined'da o'ng tomonni oladi`, [`"salom"`, `null`, `false`]),
    c(`// Natija?
const user = null;
console.log(user && user.name);`, `null`, [`TypeError`, `undefined`, `false`]),
  ]),

  js(6, 'Tsikllar', S1, [
    q(`for tsikli to'g'ri yozilishi?`, `for (let i = 0; i < 5; i++) { … }`, [`for (i = 0 to 5) { … }`, `for i in 0..5 { … }`, `for (let i = 0, i < 5, i++) { … }`]),
    q(`do…while ning while dan farqi?`, `Shart qanday bo'lmasin, kamida bir marta bajariladi`, [`Tezroq ishlaydi`, `Cheksiz ishlaydi`, `Farqi yo'q`]),
    q(`break nima qiladi?`, `Tsikldan butunlay chiqadi`, [`Joriy qadamni o'tkazib yuboradi`, `Dasturni to'xtatadi`, `Tsiklni qaytadan boshlaydi`]),
    q(`continue nima qiladi?`, `Joriy qadamni o'tkazib, keyingisiga o'tadi`, [`Tsikldan chiqadi`, `Tsiklni to'xtatadi`, `Funksiyadan chiqadi`]),
    q(`Massiv qiymatlarini aylanib chiqish uchun qulay tsikl?`, `for…of`, [`for…in`, `for…each`, `while…of`]),
    q(`Obyekt kalitlarini aylanib chiqish uchun?`, `for…in`, [`for…of`, `for…keys`, `forEach`]),
    c(`// Natija?
for (let i = 0; i <= 5; i += 2) console.log(i);`, `0 2 4`, [`0 2 4 6`, `2 4`, `0 1 2 3 4 5`]),
    c(`// Natija?
let s = 0;
for (let i = 1; i <= 4; i++) s += i;
console.log(s);`, `10`, [`4`, `6`, `15`]),
    c(`// Natija?
let i = 10;
do {
  console.log(i);
  i++;
} while (i < 5);`, `10 — bir marta`, [`Hech narsa`, `5 6 7 8 9`, `Cheksiz tsikl`]),
    c(`// Natija?
for (let i = 0; i < 5; i++) {
  if (i === 2) continue;
  if (i === 4) break;
  console.log(i);
}`, `0 1 3`, [`0 1 2 3`, `0 1 3 4`, `0 1`]),
    c(`// Natija?
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}`, `3 3 3 — var bitta umumiy o'zgaruvchi`, [`0 1 2`, `0 0 0`, `undefined x3`]),
    c(`// Natija?
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}`, `0 1 2 — let har qadamda yangi o'zgaruvchi yaratadi`, [`3 3 3`, `0 0 0`, `2 2 2`]),
  ]),

  js(7, 'Funksiyalar', S2, [
    q(`Funksiya e'lon qilish?`, `function salom() { … }`, [`func salom() { … }`, `def salom(): …`, `function = salom() { … }`]),
    q(`return nima qiladi?`, `Qiymat qaytaradi va funksiyani shu joyda tugatadi`, [`Funksiyani qayta chaqiradi`, `Konsolga chiqaradi`, `Faqat qiymat qaytaradi, kod davom etadi`]),
    q(`return yozilmagan funksiya nima qaytaradi?`, `undefined`, [`null`, `0`, `Oxirgi qatorni`]),
    q(`Arrow funksiya to'g'ri yozilishi?`, `const sum = (a, b) => a + b;`, [`const sum = (a, b) -> a + b;`, `const sum => (a, b) a + b;`, `arrow sum(a, b) { a + b }`]),
    q(`Parametr va argument farqi?`, `Parametr — e'londagi nom, argument — chaqirishda berilgan qiymat`, [`Farqi yo'q`, `Argument — e'londagi nom`, `Parametr faqat sonlar uchun`]),
    q(`Standart (default) parametr?`, `function f(a = 1) { … }`, [`function f(a || 1) { … }`, `function f(default a = 1) { … }`, `function f(a: 1) { … }`]),
    q(`Function declaration ning expression'dan asosiy farqi?`, `Declaration e'lonidan oldin ham chaqirilishi mumkin (hoisting)`, [`Tezroq ishlaydi`, `Faqat bitta parametr oladi`, `Farqi yo'q`]),
    c(`// Natija?
function sum(a, b) {
  return a + b;
}
console.log(sum(2));`, `NaN — b undefined`, [`2`, `TypeError`, `undefined`]),
    c(`// Natija?
const double = x => { x * 2 };
console.log(double(3));`, `undefined — figurali qavsda return yozilmagan`, [`6`, `NaN`, `SyntaxError`]),
    c(`// Natija?
const make = x => ({ v: x });
console.log(make(1));`, `{ v: 1 }`, [`undefined`, `1`, `SyntaxError`]),
    c(`// Natija?
hello();
function hello() {
  console.log("hi");
}`, `hi`, [`ReferenceError`, `undefined`, `TypeError`]),
    c(`// Natija?
greet();
const greet = () => console.log("hi");`, `ReferenceError`, [`hi`, `undefined`, `TypeError: greet is not a function`]),
    c(`// Natija?
function f(...nums) {
  return nums.length;
}
console.log(f(1, 2, 3));`, `3`, [`1`, `6`, `undefined`]),
  ]),

  js(8, 'Scope, hoisting va closure', S2, [
    q(`Scope nima?`, `O'zgaruvchi ko'rinadigan va ishlatilishi mumkin bo'lgan soha`, [`Funksiya nomi`, `Xato turi`, `Massiv uzunligi`]),
    q(`Closure nima?`, `Ichki funksiya tashqi funksiya o'zgaruvchilarini u tugagandan keyin ham eslab qolishi`, [
      `Funksiyani yopish`,
      `Brauzer oynasini yopish`,
      `Xatoni ushlash usuli`,
    ]),
    q(`Hoisting nima?`, `E'lonlar o'z sohasining tepasiga "ko'tarilgandek" ishlashi`, [`Funksiyani tezlashtirish`, `O'zgaruvchini o'chirish`, `Kodni siqish`]),
    q(`IIFE nima?`, `E'lon qilingan zahoti chaqiriladigan funksiya: (function () { … })()`, [`Ichki obyekt`, `Xato turi`, `Import usuli`]),
    q(`Closure'ning amaliy foydasi?`, `Tashqaridan o'zgartirib bo'lmaydigan yashirin holat saqlash (masalan, hisoblagich)`, [`Kodni tezlashtirish`, `Xotirani tozalash`, `Hech qanday`]),
    c(`// Natija?
function counter() {
  let n = 0;
  return () => ++n;
}
const c = counter();
c();
c();
console.log(c());`, `3`, [`1`, `2`, `0`]),
    c(`// Natija?
function counter() {
  let n = 0;
  return () => ++n;
}
const a = counter();
const b = counter();
a();
a();
console.log(b());`, `1 — har chaqiruvda alohida n yaratiladi`, [`3`, `2`, `0`]),
    c(`// Natija?
let x = 1;
function f() {
  let x = 2;
  return x;
}
console.log(f(), x);`, `2 1`, [`2 2`, `1 1`, `1 2`]),
    c(`// Natija?
let x = 1;
function f() { console.log(x); }
function g() {
  let x = 2;
  f();
}
g();`, `1 — funksiya e'lon qilingan joyidagi scope'ni ko'radi`, [`2`, `undefined`, `ReferenceError`]),
    c(`// Natija?
var x = 1;
function f() {
  console.log(x);
  var x = 2;
}
f();`, `undefined — ichki var x yuqoriga ko'tarilgan`, [`1`, `2`, `ReferenceError`]),
  ]),

  js(9, 'Stringlar', S2, [
    q(`String uzunligi?`, `str.length`, [`str.size`, `str.length()`, `len(str)`]),
    q(`Hamma harfni katta qilish?`, `str.toUpperCase()`, [`str.upper()`, `str.toUpper()`, `str.capitalize()`]),
    q(`"salom"[0] natijasi?`, `"s"`, [`"m"`, `undefined`, `"salom"`]),
    q(`Template literal to'g'ri yozilishi?`, "`Salom, ${name}!`", ['"Salom, ${name}!"', `'Salom, {name}!'`, "`Salom, $name!`"]),
    q(`"salom".includes("lo") natijasi?`, `true`, [`false`, `2`, `"lo"`]),
    q(`indexOf topa olmasa nima qaytaradi?`, `-1`, [`0`, `null`, `undefined`]),
    q(`"a,b,c".split(",") natijasi?`, `["a", "b", "c"]`, [`"abc"`, `["a,b,c"]`, `[",", ","]`]),
    q(`trim() nima qiladi?`, `Boshi va oxiridagi bo'sh joylarni olib tashlaydi`, [`Barcha bo'sh joylarni`, `Birinchi harfni`, `Stringni qisqartiradi`]),
    q(`replace va replaceAll farqi?`, `replace (string bilan) faqat birinchisini, replaceAll hammasini almashtiradi`, [`Farqi yo'q`, `replace hammasini`, `replaceAll faqat raqamlarni`]),
    c(`// Natija?
console.log("JavaScript".slice(1, 4));`, `"ava"`, [`"Java"`, `"avaS"`, `"av"`]),
    c(`// Natija?
const s = "abc";
s[0] = "X";
console.log(s);`, `"abc" — stringlar o'zgarmas`, [`"Xbc"`, `TypeError`, `"X"`]),
    c(`// Natija?
console.log("a-b-c".split("-").join("+"));`, `"a+b+c"`, [`"a-b-c"`, `["a", "b", "c"]`, `"abc"`]),
    c(`// Natija?
console.log("salom".split("").reverse().join(""));`, `"molas"`, [`"salom"`, `["m","o","l","a","s"]`, `TypeError`]),
    c(`// Natija?
console.log("Hello".at(-1));`, `"o"`, [`"H"`, `undefined`, `-1`]),
  ]),

  js(10, 'Massivlar asoslari', S2, [
    q(`Massiv yaratish?`, `const arr = [1, 2, 3];`, [`const arr = (1, 2, 3);`, `const arr = {1, 2, 3};`, `const arr = <1, 2, 3>;`]),
    q(`Massivning birinchi elementi indeksi?`, `0`, [`1`, `-1`, `first`]),
    q(`Oxiriga element qo'shish?`, `push`, [`pop`, `unshift`, `add`]),
    q(`Oxirgi elementni olib tashlash?`, `pop`, [`push`, `shift`, `remove`]),
    q(`Boshiga element qo'shish?`, `unshift`, [`shift`, `push`, `prepend`]),
    q(`Birinchi elementni olib tashlash?`, `shift`, [`unshift`, `pop`, `delete`]),
    q(`slice va splice farqi?`, `slice yangi massiv qaytaradi va asl massivni o'zgartirmaydi; splice asl massivni o'zgartiradi`, [
      `Farqi yo'q`,
      `slice asl massivni o'zgartiradi`,
      `splice faqat stringlar uchun`,
    ]),
    c(`// Natija?
const a = [1, 2, 3];
a[5] = 6;
console.log(a.length);`, `6`, [`4`, `3`, `TypeError`]),
    c(`// Natija?
const a = [10, 20, 30, 40];
console.log(a.slice(1, 3));`, `[20, 30]`, [`[20, 30, 40]`, `[10, 20, 30]`, `[10, 40]`]),
    c(`// Natija?
const a = [1, 2, 3, 4];
const r = a.splice(1, 2);
console.log(a, r);`, `[1, 4] [2, 3]`, [`[1, 2, 3, 4] [2, 3]`, `[2, 3] [1, 4]`, `[1, 4] [2]`]),
    c(`// Natija?
const a = [1, 2, 3];
const b = a;
b.push(4);
console.log(a.length);`, `4 — a va b bitta massivga havola`, [`3`, `1`, `undefined`]),
    c(`// Natija?
console.log([1, 2, 3].indexOf(4));`, `-1`, [`undefined`, `3`, `null`]),
    c(`// Natija?
console.log([1, [2, [3]]].flat(Infinity));`, `[1, 2, 3]`, [`[1, 2, [3]]`, `[1, [2, [3]]]`, `TypeError`]),
  ]),

  js(11, 'Massiv metodlari', S2, [
    q(`map nima qiladi?`, `Har bir elementni o'zgartirib, yangi massiv qaytaradi`, [`Elementlarni filtrlaydi`, `Bitta qiymat qaytaradi`, `Asl massivni o'zgartiradi`]),
    q(`filter nima qiladi?`, `Shartga mos elementlardan yangi massiv qaytaradi`, [`Birinchi mos elementni qaytaradi`, `Elementlarni o'zgartiradi`, `Massivni saralaydi`]),
    q(`find mos element topilmasa nima qaytaradi?`, `undefined`, [`-1`, `null`, `[]`]),
    q(`reduce nima qiladi?`, `Massivni bitta qiymatga yig'adi (yig'indi, obyekt…)`, [`Massivni kichraytiradi`, `Dublikatlarni o'chiradi`, `Elementlarni kamaytiradi`]),
    q(`forEach nima qaytaradi?`, `undefined`, [`Yangi massiv`, `Asl massiv`, `Elementlar soni`]),
    q(`some va every farqi?`, `some — kamida bittasi mos bo'lsa true; every — hammasi mos bo'lsa true`, [`Farqi yo'q`, `some — hammasi`, `every — kamida bittasi`]),
    c(`// Natija?
console.log([1, 2, 3].map(x => x * 2));`, `[2, 4, 6]`, [`[1, 2, 3]`, `12`, `undefined`]),
    c(`// Natija?
console.log([1, 2, 3, 4, 5].filter(n => n % 2));`, `[1, 3, 5]`, [`[2, 4]`, `[1, 0, 1, 0, 1]`, `[]`]),
    c(`// Natija?
console.log([1, 2, 3, 4].reduce((s, n) => s + n, 0));`, `10`, [`24`, `[1, 3, 6, 10]`, `0`]),
    c(`// Natija?
console.log([1, 2, 3].findIndex(x => x > 5));`, `-1`, [`undefined`, `3`, `null`]),
    c(`// Natija?
console.log([10, 1, 5, 100].sort());`, `[1, 10, 100, 5] — standart sort stringdek saralaydi`, [`[1, 5, 10, 100]`, `[100, 10, 5, 1]`, `[10, 1, 5, 100]`]),
    c(`// Natija?
console.log([10, 1, 5, 100].sort((a, b) => a - b));`, `[1, 5, 10, 100]`, [`[100, 10, 5, 1]`, `[1, 10, 100, 5]`, `[10, 1, 5, 100]`]),
    c(`// Natija?
const sum = [1, 2, 3, 4]
  .filter(n => n > 1)
  .map(n => n * 10)
  .reduce((a, b) => a + b);
console.log(sum);`, `90`, [`100`, `60`, `[20, 30, 40]`]),
    c(`// Natija?
console.log([].reduce((a, b) => a + b));`, `TypeError — bo'sh massiv va boshlang'ich qiymat yo'q`, [`0`, `undefined`, `[]`]),
    c(`// Natija?
console.log(["1", "2", "3"].map(parseInt));`, `[1, NaN, NaN] — parseInt ikkinchi argument sifatida indeksni oladi`, [`[1, 2, 3]`, `["1", "2", "3"]`, `[NaN, NaN, NaN]`]),
  ]),

  js(12, 'Obyektlar', S2, [
    q(`Obyekt yaratish?`, `const user = { name: "Ali", age: 20 };`, [`const user = [name: "Ali"];`, `const user = (name = "Ali");`, `const user = { name = "Ali" };`]),
    q(`Kaliti o'zgaruvchida bo'lgan qiymatni olish?`, `user[key]`, [`user.key`, `user->key`, `user(key)`]),
    q(`Xususiyatni o'chirish?`, `delete user.age`, [`user.age = delete`, `remove user.age`, `user.delete("age")`]),
    q(`Obyektda kalit borligini tekshirish?`, `"age" in user`, [`user.has("age")`, `user.age.exists`, `exists(user.age)`]),
    q(`Object.keys(user) nima qaytaradi?`, `Kalitlar massivini`, [`Qiymatlar massivini`, `Kalitlar sonini`, `Obyekt nusxasini`]),
    q(`Object.entries(user) nima qaytaradi?`, `[kalit, qiymat] juftliklari massivini`, [`Faqat kalitlarni`, `Faqat qiymatlarni`, `Map obyektini`]),
    q(`Oddiy metod ichida this nimani bildiradi?`, `Metod chaqirilgan obyektni (nuqtadan oldingisini)`, [`window'ni har doim`, `Funksiyaning o'zini`, `Doim undefined`]),
    c(`// Natija?
const user = {
  name: "Ali",
  hi() { return "Salom, " + this.name; },
};
console.log(user.hi());`, `Salom, Ali`, [`Salom, undefined`, `TypeError`, `Salom, this.name`]),
    c(`// Natija?
const a = { x: 1 };
const b = { x: 1 };
console.log(a === b);`, `false — ikki xil obyekt`, [`true`, `undefined`, `TypeError`]),
    c(`// Natija?
const u = { name: "Ali" };
const v = u;
v.name = "Vali";
console.log(u.name);`, `Vali`, [`Ali`, `undefined`, `TypeError`]),
    c(`// Natija?
const o = {};
console.log(o.a.b);`, `TypeError — undefined'dan xususiyat o'qib bo'lmaydi`, [`undefined`, `null`, `{}`]),
    c(`// Natija?
const o = Object.freeze({ n: 1 });
o.n = 2;
console.log(o.n);`, `1`, [`2`, `undefined`, `null`]),
    c(`// Natija?
const k = "rang";
const o = { [k]: "qizil" };
console.log(o.rang);`, `qizil`, [`undefined`, `rang`, `SyntaxError`]),
  ]),

  js(13, 'Destructuring, spread, ?. va ??', S2, [
    q(`const { name } = user; nima qiladi?`, `user.name qiymatini name o'zgaruvchisiga oladi`, [`user'ni nusxalaydi`, `name xususiyatini o'chiradi`, `Yangi obyekt yaratadi`]),
    q(`Massivning nusxasini olishning qisqa yo'li?`, `[...arr]`, [`arr.copy()`, `{...arr}`, `copy(arr)`]),
    q(`Ikki obyektni birlashtirish?`, `{ ...a, ...b }`, [`a + b`, `[...a, ...b]`, `a.concat(b)`]),
    q(`?. (optional chaining) nima qiladi?`, `Oldingi qiymat null/undefined bo'lsa, xato bermay undefined qaytaradi`, [`Shartli operator`, `Qiymatni majburiy qiladi`, `Xatoni konsolga chiqaradi`]),
    q(`?? (nullish coalescing) qachon o'ng tomonni oladi?`, `Faqat chap tomon null yoki undefined bo'lsa`, [`Chap tomon falsy bo'lsa`, `Har doim`, `Chap tomon 0 bo'lsa`]),
    c(`// Natija?
const { a, b = 5 } = { a: 1 };
console.log(a + b);`, `6`, [`1`, `NaN`, `undefined`]),
    c(`// Natija?
const [x, , y] = [1, 2, 3];
console.log(x, y);`, `1 3`, [`1 2`, `2 3`, `1 undefined`]),
    c(`// Natija?
let a = 1, b = 2;
[a, b] = [b, a];
console.log(a, b);`, `2 1`, [`1 2`, `2 2`, `SyntaxError`]),
    c(`// Natija?
const o = { ...{ x: 1, y: 2 }, ...{ y: 3 } };
console.log(o);`, `{ x: 1, y: 3 }`, [`{ x: 1, y: 2 }`, `{ x: 1, y: 2, y: 3 }`, `{ y: 3 }`]),
    c(`// Natija?
const { name: ism } = { name: "Ali" };
console.log(ism);`, `Ali`, [`undefined`, `name`, `ReferenceError`]),
    c(`// Natija?
const u = {};
console.log(u.profile?.city ?? "noma'lum");`, `noma'lum`, [`undefined`, `TypeError`, `null`]),
    c(`// Natija?
const a = { inner: { n: 1 } };
const b = { ...a };
b.inner.n = 2;
console.log(a.inner.n);`, `2 — spread faqat yuza (shallow) nusxa oladi`, [`1`, `undefined`, `TypeError`]),
  ]),

  js(14, 'Number, Math va Date', S2, [
    q(`Math.round(4.5) natijasi?`, `5`, [`4`, `4.5`, `6`]),
    q(`Math.floor(4.9) natijasi?`, `4`, [`5`, `4.9`, `4.5`]),
    q(`Math.ceil(4.1) natijasi?`, `5`, [`4`, `4.1`, `6`]),
    q(`Math.random() nima qaytaradi?`, `0 (kiradi) dan 1 (kirmaydi) gacha tasodifiy son`, [`0 dan 100 gacha butun son`, `1 dan 10 gacha`, `Tasodifiy harf`]),
    q(`1 dan 10 gacha tasodifiy butun son?`, `Math.floor(Math.random() * 10) + 1`, [`Math.random(1, 10)`, `Math.round(Math.random() * 10)`, `Math.floor(Math.random() * 10)`]),
    q(`(3.14159).toFixed(2) natijasi va turi?`, `"3.14" — string`, [`3.14 — son`, `3.15 — son`, `"3.15" — string`]),
    q(`Yanvar oyi uchun date.getMonth() nima qaytaradi?`, `0`, [`1`, `"Yanvar"`, `12`]),
    q(`Ikki sana orasidagi kunlar soni?`, `(d2 - d1) / (1000 * 60 * 60 * 24)`, [`d2.days - d1.days`, `(d2 - d1) / 24`, `Date.diff(d1, d2)`]),
    c(`// Natija?
console.log(Math.max(...[3, 9, 4]));`, `9`, [`3`, `[3, 9, 4]`, `NaN`]),
    c(`// Natija?
console.log(Math.round(-4.5));`, `-4`, [`-5`, `-4.5`, `4`]),
    c(`// Natija?
console.log((1.005).toFixed(2));`, `"1.00" — 1.005 xotirada 1.00499… bo'lib saqlanadi`, [`"1.01"`, `"1.005"`, `1`]),
    c(`// Natija?
console.log(Math.max());`, `-Infinity`, [`0`, `undefined`, `NaN`]),
    c(`// Natija?
console.log(Number.isInteger(5.0), Number.isInteger("5"));`, `true false`, [`false false`, `true true`, `false true`]),
  ]),

  js(15, 'DOM: tanlash va o\'zgartirish', S3, [
    q(`DOM nima?`, `Brauzer HTML'dan quradigan obyektlar daraxti — JS orqali o'zgartirish mumkin`, [`Ma'lumotlar bazasi`, `CSS freymvorki`, `Server dasturi`]),
    q(`id bo'yicha element olish?`, `document.getElementById("x")`, [`document.getElement("#x")`, `document.id("x")`, `document.querySelectorAll("x")`]),
    q(`CSS selektor bo'yicha birinchi mos elementni olish?`, `document.querySelector(".card")`, [`document.getElementsByClassName(".card")[1]`, `document.select(".card")`, `document.find(".card")`]),
    q(`Matnni xavfsiz o'zgartirish?`, `el.textContent = "..."`, [`el.innerHTML = userInput`, `el.value = "..."`, `el.text("...")`]),
    q(`innerHTML ga foydalanuvchi matnini qo'yishning xavfi?`, `XSS — begona skript bajarilishi mumkin`, [`Sahifa sekinlashadi`, `Hech qanday xavfi yo'q`, `Matn ko'rinmaydi`]),
    q(`Elementga klass qo'shish?`, `el.classList.add("active")`, [`el.class = "active"`, `el.addClass("active")`, `el.classList.push("active")`]),
    q(`classList.toggle("open") nima qiladi?`, `Klass bo'lsa olib tashlaydi, bo'lmasa qo'shadi`, [`Doim qo'shadi`, `Doim olib tashlaydi`, `Klassni almashtiradi`]),
    q(`Yangi element yaratib sahifaga qo'shish?`, `document.createElement("li"), so'ng parent.append(li)`, [`new Element("li")`, `document.add("li")`, `parent.innerHTML.push("li")`]),
    q(`Inline stil berish?`, `el.style.backgroundColor = "red"`, [`el.style.background-color = "red"`, `el.css("background", "red")`, `el.backgroundColor = "red"`]),
    q(`<div data-id="5"> dan 5 ni olish?`, `el.dataset.id`, [`el.data.id`, `el.getData("id")`, `el.id`]),
    q(`Elementni sahifadan o'chirish?`, `el.remove()`, [`el.delete()`, `delete el`, `el.hide()`]),
    q(`getElementsByClassName va querySelectorAll farqi?`, `Birinchisi "jonli" (live) to'plam, querySelectorAll — statik NodeList`, [`Farqi yo'q`, `querySelectorAll jonli`, `getElementsByClassName faqat bitta qaytaradi`]),
    c(`// <ul><li>1</li><li>2</li></ul>
// Natija?
document.querySelectorAll("li")
  .forEach(li => li.textContent += "!");`, `Ro'yxat: "1!" va "2!"`, [`Faqat "1!"`, `TypeError — NodeList'da forEach yo'q`, `Hech narsa o'zgarmaydi`]),
  ]),

  js(16, 'Hodisalar (events)', S3, [
    q(`Tugma bosilishiga funksiya ulash?`, `btn.addEventListener("click", fn)`, [`btn.on("click", fn)`, `btn.click = fn()`, `btn.addEvent("onclick", fn)`]),
    q(`Forma yuborilganda sahifa yangilanmasligi uchun?`, `e.preventDefault()`, [`e.stopPropagation()`, `return true`, `form.stop()`]),
    q(`e.target nima?`, `Hodisa aynan sodir bo'lgan element`, [`Listener ulangan element`, `Butun sahifa`, `Hodisa nomi`]),
    q(`Bubbling (ko'tarilish) nima?`, `Hodisa ichki elementdan ota elementlarga qarab tarqaladi`, [`Hodisa takrorlanishi`, `Hodisa bekor qilinishi`, `Animatsiya turi`]),
    q(`e.stopPropagation() nima qiladi?`, `Hodisaning ota elementlarga tarqalishini to'xtatadi`, [`Brauzer standart amalini to'xtatadi`, `Listener'ni o'chiradi`, `Sahifani to'xtatadi`]),
    q(`Event delegation nima?`, `Ko'p elementga emas, otasiga bitta listener qo'yib, e.target orqali aniqlash`, [
      `Hodisani boshqa sahifaga yuborish`,
      `Har bir elementga alohida listener`,
      `Hodisani kechiktirish`,
    ]),
    q(`input va change hodisalari farqi?`, `input — har bir o'zgarishda, change — qiymat tasdiqlanganda (fokus chiqqanda)`, [`Farqi yo'q`, `change har harfda`, `input faqat tugmalarda`]),
    q(`Bosilgan klavishni bilish?`, `keydown hodisasida e.key`, [`click hodisasida e.button`, `e.keyCode faqat`, `input.key`]),
    q(`removeEventListener ishlashi uchun nima shart?`, `addEventListener'ga berilgan aynan o'sha funksiya havolasi`, [`Hodisa nomi yetarli`, `Bir xil kodli yangi funksiya`, `Element id'si`]),
    q(`{ once: true } opsiyasi nima qiladi?`, `Listener bir marta ishlagach o'zi o'chadi`, [`Faqat birinchi elementga ulanadi`, `Tezroq ishlaydi`, `Bubbling'ni o'chiradi`]),
    c(`// Bu kodda qanday xato bor?
btn.addEventListener("click", handle());`, `handle darhol bir marta chaqiriladi va click'ga uning natijasi ulanadi`, [
      `Xato yo'q`,
      `"click" o'rniga "onclick" bo'lishi kerak`,
      `addEventListener ikki marta chaqiriladi`,
    ]),
    c(`// <div id="outer"><button id="inner">OK</button></div>
outer.addEventListener("click", () => console.log("outer"));
inner.addEventListener("click", () => console.log("inner"));
// Tugma bosilsa nima chiqadi?`, `inner, outer`, [`outer, inner`, `inner`, `outer`]),
    c(`// <ul id="list"><li>A</li></ul>
list.addEventListener("click", (e) => {
  console.log(e.target.tagName, e.currentTarget.tagName);
});
// "A" bosilsa?`, `LI UL`, [`UL UL`, `LI LI`, `UL LI`]),
  ]),

  js(17, 'Formalar va localStorage', S3, [
    q(`Input qiymatini olish?`, `input.value`, [`input.text`, `input.innerHTML`, `input.content`]),
    q(`input.value qaysi turda bo'ladi?`, `Doim string (type="number" bo'lsa ham)`, [`Kiritilganga qarab son yoki string`, `Doim son`, `Obyekt`]),
    q(`Checkbox belgilanganini bilish?`, `input.checked`, [`input.value`, `input.selected`, `input.isChecked()`]),
    q(`localStorage'ga yozish?`, `localStorage.setItem("k", "v")`, [`localStorage.k = save("v")`, `localStorage.write("k", "v")`, `storage.set("k", "v")`]),
    q(`Mavjud bo'lmagan kalit uchun getItem nima qaytaradi?`, `null`, [`undefined`, `""`, `false`]),
    q(`localStorage'ga obyekt saqlash?`, `localStorage.setItem("u", JSON.stringify(obj))`, [`localStorage.setItem("u", obj)`, `localStorage.u = obj`, `localStorage.saveObject(obj)`]),
    q(`localStorage va sessionStorage farqi?`, `sessionStorage tab yopilganda o'chadi, localStorage saqlanib qoladi`, [`Farqi yo'q`, `localStorage tezroq`, `sessionStorage serverda saqlanadi`]),
    q(`localStorage'da nimani saqlamaslik kerak?`, `Parol va maxfiy tokenlarni — XSS orqali o'g'irlanishi mumkin`, [`Tanlangan mavzu (dark/light)`, `Til tanlovi`, `Qoralama matn`]),
    q(`Formadagi barcha maydonlarni bir yo'la yig'ish?`, `new FormData(form)`, [`form.values()`, `form.getAll()`, `JSON.parse(form)`]),
    c(`// Natija?
localStorage.setItem("n", 5);
console.log(typeof localStorage.getItem("n"));`, `"string"`, [`"number"`, `"object"`, `"undefined"`]),
    c(`// Natija?
localStorage.setItem("u", { name: "Ali" });
console.log(localStorage.getItem("u"));`, `"[object Object]"`, [`{ name: "Ali" }`, `"{"name":"Ali"}"`, `null`]),
    c(`// <input id="age" type="number" value="5">
const age = document.getElementById("age");
console.log(age.value + 1);`, `"51"`, [`6`, `"6"`, `NaN`]),
  ]),

  js(18, 'JSON va xatolarni ushlash', S3, [
    q(`JSON nima?`, `Ma'lumot almashish uchun matnli format`, [`JavaScript freymvorki`, `Ma'lumotlar bazasi`, `Rasm formati`]),
    q(`Obyektni JSON stringga aylantirish?`, `JSON.stringify(obj)`, [`JSON.parse(obj)`, `obj.toJSON()`, `String(obj)`]),
    q(`JSON stringni obyektga aylantirish?`, `JSON.parse(str)`, [`JSON.stringify(str)`, `Object(str)`, `str.toObject()`]),
    q(`JSON'da kalitlar qanday yoziladi?`, `Qo'shtirnoq ichida: {"name": "Ali"}`, [`Qo'shtirnoqsiz: {name: "Ali"}`, `Bittalik tirnoqda: {'name': 'Ali'}`, `Istalgancha`]),
    q(`try/catch nima uchun?`, `Xatoni ushlab, dastur to'xtab qolmasligi uchun`, [`Kodni tezlashtirish`, `Tsikl yaratish`, `Funksiya e'lon qilish`]),
    q(`finally bloki qachon bajariladi?`, `Xato bo'lsa ham, bo'lmasa ham`, [`Faqat xato bo'lsa`, `Faqat xato bo'lmasa`, `Hech qachon`]),
    q(`O'z xatoingizni yuzaga keltirish?`, `throw new Error("xabar")`, [`error("xabar")`, `raise Error("xabar")`, `catch("xabar")`]),
    q(`Obyektning chuqur (to'liq) nusxasini olish?`, `structuredClone(obj)`, [`{ ...obj }`, `Object.assign({}, obj)`, `obj.copy()`]),
    c(`// Natija?
JSON.parse("{name: 'Ali'}");`, `SyntaxError — JSON'da kalit va string qo'shtirnoqda bo'ladi`, [`{ name: "Ali" }`, `"Ali"`, `undefined`]),
    c(`// Natija?
console.log(JSON.stringify({ a: undefined, b: 1 }));`, `{"b":1}`, [`{"a":undefined,"b":1}`, `{"a":null,"b":1}`, `TypeError`]),
    c(`// Natija?
try {
  console.log("A");
  throw new Error("x");
  console.log("B");
} catch (e) {
  console.log("C");
} finally {
  console.log("D");
}`, `A C D`, [`A B C D`, `A C`, `A D`]),
    c(`// Natija?
function f() {
  try {
    return "try";
  } finally {
    console.log("finally");
  }
}
console.log(f());`, `finally, keyin try`, [`try, keyin finally`, `faqat try`, `faqat finally`]),
  ]),

  js(19, 'Asinxronlik va event loop', S4, [
    q(`JavaScript bir vaqtda nechta kodni bajaradi?`, `Bitta — u bir oqimli (single-threaded)`, [`Protsessor yadrolari soniga qarab`, `Cheksiz`, `Ikkita`]),
    q(`setTimeout(fn, 1000) nima qiladi?`, `Kamida 1 soniyadan keyin fn ni bir marta bajaradi`, [`Har soniyada bajaradi`, `1 soniya kodni to'xtatadi`, `Aynan 1 soniyada bajaradi`]),
    q(`setInterval'ni to'xtatish?`, `clearInterval(id)`, [`stopInterval(id)`, `setInterval(null)`, `clearTimeout() faqat`]),
    q(`Callback nima?`, `Boshqa funksiyaga argument sifatida beriladigan va keyin chaqiriladigan funksiya`, [`Qaytariladigan qiymat`, `Xato turi`, `Tsikl turi`]),
    q(`Event loop vazifasi?`, `Call stack bo'shaganda navbatdagi vazifalarni bajarishga olib kirish`, [`Tsikllarni tezlashtirish`, `Hodisalarni o'chirish`, `Xotirani tozalash`]),
    q(`Debounce nima?`, `Oxirgi chaqiruvdan keyin ma'lum vaqt o'tgach bir marta bajarish (masalan, qidiruv inputi)`, [
      `Funksiyani cheksiz takrorlash`,
      `Funksiyani darhol bajarish`,
      `Xatolarni yashirish`,
    ]),
    c(`// Natija?
console.log(1);
setTimeout(() => console.log(2), 0);
console.log(3);`, `1 3 2`, [`1 2 3`, `2 1 3`, `3 1 2`]),
    c(`// Natija?
setTimeout(() => console.log("timeout"), 0);
Promise.resolve().then(() => console.log("promise"));
console.log("sync");`, `sync, promise, timeout — microtask'lar macrotask'dan oldin`, [
      `timeout, promise, sync`,
      `sync, timeout, promise`,
      `promise, sync, timeout`,
    ]),
    c(`// "ok" qachon chiqadi?
const start = Date.now();
setTimeout(() => console.log("ok"), 100);
while (Date.now() - start < 1000) {}`, `Taxminan 1 soniyadan keyin — while tsikli oqimni band qilib turadi`, [
      `100 ms dan keyin`,
      `Hech qachon`,
      `Darhol`,
    ]),
    c(`// Natija?
setTimeout(() => console.log("A"), 10);
setTimeout(() => console.log("B"), 0);
console.log("C");`, `C B A`, [`A B C`, `C A B`, `B C A`]),
  ]),

  js(20, 'Promise', S4, [
    q(`Promise nima?`, `Kelajakda tayyor bo'ladigan natija (yoki xato) obyekti`, [`Tsikl turi`, `Funksiya nomi`, `Xato turi`]),
    q(`Promise holatlari?`, `pending, fulfilled, rejected`, [`start, run, end`, `open, closed`, `true, false`]),
    q(`Promise muvaffaqiyatli bajarilganda qaysi metod ishlaydi?`, `then`, [`catch`, `finally faqat`, `done`]),
    q(`Promise.all bitta promise xato bo'lsa?`, `Darhol o'sha xato bilan reject bo'ladi`, [`Qolganlarini kutib, xatoni o'tkazib yuboradi`, `undefined qaytaradi`, `Qayta urinadi`]),
    q(`Promise.allSettled nima qaytaradi?`, `Hammasini kutib, har birining holati va natijasini`, [`Faqat muvaffaqiyatlilarni`, `Birinchi tugaganini`, `Faqat xatolarni`]),
    q(`Promise.race nima qiladi?`, `Birinchi tugagan (muvaffaqiyatli yoki xato) promise natijasini oladi`, [`Eng tez muvaffaqiyatlisini`, `Hammasini kutadi`, `Tasodifiysini oladi`]),
    q(`Promise.any nima qiladi?`, `Birinchi muvaffaqiyatli bajarilgan promise natijasini oladi`, [`Birinchi tugaganini`, `Hammasini`, `Birinchi xatoni`]),
    q(`Bir marta resolve bo'lgan promise'da yana resolve chaqirilsa?`, `E'tiborsiz qoldiriladi — holat o'zgarmaydi`, [`Qiymat yangilanadi`, `Xato beradi`, `then ikki marta ishlaydi`]),
    c(`// Natija?
Promise.resolve(1)
  .then(x => x + 1)
  .then(x => console.log(x));`, `2`, [`1`, `undefined`, `Promise`]),
    c(`// Natija?
Promise.reject("xato")
  .then(() => console.log("A"))
  .catch(e => console.log("B", e))
  .then(() => console.log("C"));`, `B xato, C`, [`A, C`, `B xato`, `A, B xato, C`]),
    c(`// Natija?
console.log(1);
new Promise(res => {
  console.log(2);
  res();
}).then(() => console.log(3));
console.log(4);`, `1 2 4 3 — executor darhol (sinxron) ishlaydi`, [`1 2 3 4`, `1 4 2 3`, `2 1 4 3`]),
    c(`// Natija?
Promise.resolve(5)
  .then(x => { x * 2 })
  .then(x => console.log(x));`, `undefined`, [`10`, `5`, `NaN`]),
  ]),

  js(21, 'async/await va fetch', S4, [
    q(`async funksiya nima qaytaradi?`, `Doim Promise`, [`Oddiy qiymat`, `undefined`, `Callback`]),
    q(`await nima qiladi?`, `Promise tugaguncha shu funksiya ichida kutadi`, [`Butun sahifani to'xtatadi`, `Promise yaratadi`, `Xatoni yashiradi`]),
    q(`async funksiyada xatoni ushlash?`, `try/catch bilan`, [`if/else bilan`, `Ushlab bo'lmaydi`, `faqat window.onerror`]),
    q(`fetch'dan JSON ma'lumotni olish?`, `const data = await res.json()`, [`const data = res.data`, `const data = JSON.parse(res)`, `const data = res.body`]),
    q(`Server 404 qaytarsa fetch nima qiladi?`, `Reject bo'lmaydi — res.ok false bo'ladi; faqat tarmoq xatosida reject`, [`Reject bo'ladi`, `undefined qaytaradi`, `Qayta urinadi`]),
    q(`fetch bilan JSON POST qilish uchun nima kerak?`, `method: "POST", headers: Content-Type: application/json, body: JSON.stringify(data)`, [
      `Faqat method: "POST"`,
      `body: data (obyektning o'zi)`,
      `fetch.post(url, data)`,
    ]),
    q(`CORS xatosi nimani bildiradi?`, `Server boshqa domendagi sahifadan kelgan so'rovga ruxsat bermagan`, [`Internet yo'q`, `JS sintaksis xatosi`, `Sahifa topilmadi`]),
    q(`fetch so'rovini bekor qilish?`, `AbortController bilan`, [`fetch.cancel()`, `clearTimeout`, `Bekor qilib bo'lmaydi`]),
    c(`// Natija?
async function f() {
  return 1;
}
console.log(f());`, `Promise {<fulfilled>: 1}`, [`1`, `undefined`, `async 1`]),
    c(`// wait(ms) — ms dan keyin tugaydigan promise.
// Jami qancha vaqt ketadi?
const a = await wait(1000);
const b = await wait(1000);`, `Taxminan 2 soniya — ketma-ket kutiladi`, [`Taxminan 1 soniya`, `0 soniya`, `3 soniya`]),
    c(`// Jami qancha vaqt ketadi?
const [a, b] = await Promise.all([wait(1000), wait(1000)]);`, `Taxminan 1 soniya — parallel`, [`Taxminan 2 soniya`, `0 soniya`, `Xato beradi`]),
    c(`// Natija?
async function f() {
  console.log(1);
  await null;
  console.log(2);
}
f();
console.log(3);`, `1 3 2`, [`1 2 3`, `3 1 2`, `1 3`]),
  ]),

  js(22, 'Klasslar va OOP', S5, [
    q(`Klass e'lon qilish?`, `class User { constructor(name) { this.name = name; } }`, [`class User(name) { … }`, `function class User { … }`, `new class User { … }`]),
    q(`Klassdan obyekt yaratish?`, `new User("Ali")`, [`User("Ali")`, `create User("Ali")`, `User.new("Ali")`]),
    q(`constructor qachon chaqiriladi?`, `new bilan obyekt yaratilganda avtomatik`, [`Har bir metod chaqirilganda`, `Qo'lda chaqirish kerak`, `Hech qachon`]),
    q(`Meros olish?`, `class Admin extends User { … }`, [`class Admin inherits User`, `class Admin : User`, `class Admin(User)`]),
    q(`super() nima qiladi?`, `Ota klass konstruktorini chaqiradi — this'dan oldin bo'lishi shart`, [`Obyektni o'chiradi`, `Klassni statik qiladi`, `Metodni yashiradi`]),
    q(`static metod qanday chaqiriladi?`, `Klassning o'zidan: User.create()`, [`Obyektdan: user.create()`, `Faqat konstruktor ichida`, `this.create()`]),
    q(`#password kabi xususiyat nima?`, `Private — klass tashqarisidan o'qib bo'lmaydi`, [`Izoh`, `Statik xususiyat`, `CSS id'si`]),
    q(`Getter (get fullName()) qanday ishlatiladi?`, `Xususiyatdek: user.fullName`, [`Metoddek: user.fullName()`, `user.get("fullName")`, `Faqat klass ichida`]),
    q(`JavaScript'da meros qanday mexanizmga asoslangan?`, `Prototip zanjiri (prototype chain)`, [`Faqat klasslar nusxasi`, `Interfeyslar`, `Modullar`]),
    c(`// Natija?
class A { hi() { return "A"; } }
class B extends A {
  hi() { return "B" + super.hi(); }
}
console.log(new B().hi());`, `BA`, [`AB`, `B`, `A`]),
    c(`// Natija?
class M {
  static sum(a, b) { return a + b; }
}
const m = new M();
console.log(m.sum(1, 2));`, `TypeError — statik metod obyektda yo'q`, [`3`, `undefined`, `NaN`]),
    c(`// Natija?
class A {}
class B extends A {}
console.log(new B() instanceof A);`, `true`, [`false`, `TypeError`, `undefined`]),
    c(`// Natija?
class A {}
class B extends A {
  constructor() {
    this.x = 1;
  }
}
new B();`, `ReferenceError — this'dan oldin super() chaqirilmagan`, [`Hech qanday xato yo'q`, `x = 1 bo'lgan obyekt`, `TypeError: A is not a function`]),
  ]),

  js(23, 'Modullar, Map va Set', S5, [
    q(`Nomli eksport?`, `export const sum = …`, [`module.sum = …`, `exports sum`, `public sum = …`]),
    q(`Default importni to'g'ri yozish?`, `import App from "./App.js"`, [`import { default } from "./App.js"`, `require App from "./App.js"`, `import * App from "./App.js"`]),
    q(`Nomli importni to'g'ri yozish?`, `import { sum } from "./math.js"`, [`import sum from "./math.js" — har doim`, `import "sum" from "./math.js"`, `include { sum } "./math.js"`]),
    q(`Bitta faylda nechta default eksport bo'lishi mumkin?`, `Bitta`, [`Cheksiz`, `Ikkita`, `Umuman bo'lmaydi`]),
    q(`Brauzerda modul ishlatish uchun?`, `<script type="module" src="app.js">`, [`<script module>`, `<module src="app.js">`, `<script import="app.js">`]),
    q(`Set nima?`, `Takrorlanmaydigan qiymatlar to'plami`, [`Kalit-qiymat juftligi`, `Tartiblangan massiv`, `Sozlamalar obyekti`]),
    q(`Massivdan dublikatlarni olib tashlash?`, `[...new Set(arr)]`, [`arr.unique()`, `new Map(arr)`, `arr.filter(Set)`]),
    q(`Map'ning oddiy obyektdan afzalligi?`, `Kalit har qanday tur bo'lishi mumkin, tartib saqlanadi, size bor`, [`Tezroq yoziladi`, `JSON'ga avtomatik aylanadi`, `Farqi yo'q`]),
    q(`ES modullar qaysi rejimda ishlaydi?`, `Avtomatik strict mode'da`, [`Oddiy (sloppy) rejimda`, `Faqat Node.js'da`, `Rejim tanlanadi`]),
    c(`// Natija?
console.log(new Set([1, 1, 2, 3, 3]).size);`, `3`, [`5`, `2`, `undefined`]),
    c(`// Natija?
const m = new Map();
m.set(1, "son");
m.set("1", "matn");
console.log(m.size, m.get(1));`, `2 son`, [`1 matn`, `2 matn`, `1 son`]),
    c(`// Natija?
const o = {};
o[1] = "a";
o["1"] = "b";
console.log(Object.keys(o).length, o[1]);`, `1 b — obyekt kalitlari stringga aylanadi`, [`2 a`, `2 b`, `1 a`]),
  ]),

  js(24, 'this, call/apply/bind va funksional usullar', S5, [
    q(`Arrow funksiyada this qanday aniqlanadi?`, `O'zida this yo'q — tashqi (e'lon qilingan) kontekstdan oladi`, [`Chaqirilgan obyektdan`, `Doim window`, `Doim undefined`]),
    q(`call va apply farqi?`, `call argumentlarni vergul bilan, apply — massiv qilib oladi`, [`Farqi yo'q`, `apply funksiyani qaytaradi`, `call faqat bitta argument oladi`]),
    q(`bind nima qiladi?`, `this bog'langan yangi funksiya qaytaradi (darhol chaqirmaydi)`, [`Funksiyani darhol chaqiradi`, `Funksiyani o'chiradi`, `Hodisaga ulaydi`]),
    q(`Yuqori tartibli funksiya (higher-order) nima?`, `Funksiyani argument sifatida oladigan yoki qaytaradigan funksiya`, [`Eng uzun funksiya`, `Global funksiya`, `Klass metodi`]),
    q(`Memoization nima?`, `Natijalarni keshlab, bir xil argumentlarda qayta hisoblamaslik`, [`Xotirani tozalash`, `Funksiyani yodlash (nomini)`, `O'zgaruvchini o'chirish`]),
    q(`Toza (pure) funksiya nima?`, `Bir xil kirishga doim bir xil natija beradi va tashqi holatni o'zgartirmaydi`, [`Izohsiz funksiya`, `Qisqa funksiya`, `Faqat sonlar bilan ishlaydigan funksiya`]),
    c(`// Natija?
function hi() {
  return this.name;
}
const u = { name: "Ali" };
console.log(hi.call(u));`, `Ali`, [`undefined`, `TypeError`, `hi`]),
    c(`// Natija?
const user = {
  name: "Ali",
  later() {
    setTimeout(() => console.log(this.name), 0);
  },
};
user.later();`, `Ali — arrow this'ni later() dan oladi`, [`undefined`, `TypeError`, `""`]),
    c(`// Natija?
function f() { return this.x; }
const g = f.bind({ x: 1 });
const h = g.bind({ x: 2 });
console.log(h());`, `1 — bind bir marta bog'langan this'ni qayta o'zgartirmaydi`, [`2`, `undefined`, `TypeError`]),
    c(`// Natija?
console.log(Math.max.apply(null, [1, 5, 3]));`, `5`, [`1`, `NaN`, `[1, 5, 3]`]),
    c(`// Natija?
const add = a => b => a + b;
console.log(add(2)(3));`, `5`, [`"23"`, `Function`, `NaN`]),
  ]),
]
