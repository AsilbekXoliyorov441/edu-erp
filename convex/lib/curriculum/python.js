import { q, c, topic } from './build'

const S1 = '1-modul. Asoslar'
const S2 = '2-modul. Stringlar va shartlar'
const S3 = '3-modul. Tsikllar'
const S4 = "4-modul. Ma'lumotlar tuzilmalari"
const S5 = '5-modul. Funksiyalar'
const S6 = '6-modul. Xatolar, fayllar va modullar'
const S7 = '7-modul. OOP va chuqur mavzular'
const py = (n, name, section, items) => topic(`${n}-dars. ${name}`, 'python', section, items)

/** Python: lessons 1–24, each from easy to hard. */
export const PYTHON = [
  py(1, 'Python bilan tanishuv', S1, [
    q(`Python qanday til?`, `Yuqori darajali, interpretatsiya qilinadigan dasturlash tili`, [`Belgilash (markup) tili`, `Faqat ma'lumotlar bazasi tili`, `Stil tili`]),
    q(`Ekranga matn chiqarish?`, `print()`, [`echo()`, `console.log()`, `write()`]),
    q(`Python'da izoh qanday yoziladi?`, `# izoh`, [`// izoh`, `<!-- izoh -->`, `/* izoh */`]),
    q(`Python fayl kengaytmasi?`, `.py`, [`.pt`, `.python`, `.pyt`]),
    q(`Python kod bloklarini nima bilan ajratadi?`, `Chekinish (bo'sh joylar) bilan`, [`Figurali qavslar { } bilan`, `begin/end bilan`, `Nuqtali vergul bilan`]),
    q(`PEP 8 bo'yicha bitta chekinish necha bo'sh joy?`, `4 ta`, [`2 ta`, `8 ta`, `1 ta tab, boshqasi xato`]),
    q(`Ko'p qatorli string qanday yoziladi?`, `Uchta qo'shtirnoq: """ … """`, [`Backtick: \` … \``, `/* … */`, `<< … >>`]),
    c(`# Natija?
print("Salom", "dunyo")`, `Salom dunyo`, [`Salomdunyo`, `Salom, dunyo`, `("Salom", "dunyo")`]),
    c(`# Natija?
print("A", "B", sep="-")`, `A-B`, [`A B`, `AB`, `A - B`]),
    c(`# Natija?
print("A", end="")
print("B")`, `AB`, [`A B`, `A (yangi qator) B`, `SyntaxError`]),
    c(`# Natija?
print("5" + "5")`, `55`, [`10`, `TypeError`, `"5" "5"`]),
    c(`# Natija?
print(10 / 2)`, `5.0`, [`5`, `5.00`, `2`]),
    c(`# Natija?
if True:
print("Salom")`, `IndentationError`, [`Salom`, `Hech narsa`, `True`]),
  ]),

  py(2, "O'zgaruvchilar va ma'lumot turlari", S1, [
    q(`O'zgaruvchi yaratish?`, `x = 5`, [`int x = 5`, `let x = 5`, `var x := 5`]),
    q(`type(3.14) natijasi?`, `<class 'float'>`, [`<class 'int'>`, `<class 'double'>`, `<class 'decimal'>`]),
    q(`type("5") natijasi?`, `<class 'str'>`, [`<class 'int'>`, `<class 'char'>`, `<class 'number'>`]),
    q(`Python'da mantiqiy qiymatlar?`, `True va False`, [`true va false`, `1 va 0 faqat`, `yes va no`]),
    q(`"Qiymat yo'q" degan maxsus qiymat?`, `None`, [`null`, `undefined`, `nil`]),
    q(`Qaysi o'zgaruvchi nomi to'g'ri?`, `my_name`, [`2name`, `my-name`, `class`]),
    q(`Python'da o'zgaruvchilar nomlash uslubi (PEP 8)?`, `snake_case: user_name`, [`camelCase: userName`, `PascalCase: UserName`, `kebab-case: user-name`]),
    q(`Python dinamik tipli til — bu nimani bildiradi?`, `Tur qiymatga qarab aniqlanadi, o'zgaruvchiga keyin boshqa turdagi qiymat berish mumkin`, [
      `O'zgaruvchi turini e'lon qilish shart`,
      `Tur hech qachon o'zgarmaydi`,
      `Faqat sonlar bilan ishlaydi`,
    ]),
    q(`Konstantalar odatda qanday nomlanadi?`, `Katta harflar bilan: MAX_SIZE = 100`, [`const max_size = 100`, `final maxSize = 100`, `#MAX_SIZE 100`]),
    c(`# Natija?
a, b = 1, 2
a, b = b, a
print(a, b)`, `2 1`, [`1 2`, `2 2`, `SyntaxError`]),
    c(`# Natija?
x = y = 5
y = 6
print(x)`, `5`, [`6`, `11`, `SyntaxError`]),
    c(`# Natija?
print(type(6 / 3))`, `<class 'float'>`, [`<class 'int'>`, `2`, `<class 'number'>`]),
    c(`# Natija?
print(True + 1, type(True + 1))`, `2 <class 'int'>`, [`TypeError`, `True1 <class 'str'>`, `2 <class 'bool'>`]),
  ]),

  py(3, "input va tur o'zgartirish", S1, [
    q(`input() qaysi turda qiymat qaytaradi?`, `Doim str`, [`Kiritilganga qarab int yoki str`, `int`, `float`]),
    q(`Foydalanuvchidan butun son olish?`, `int(input())`, [`input(int)`, `int.input()`, `input().int`]),
    q(`int("3.5") natijasi?`, `ValueError`, [`3`, `4`, `3.5`]),
    q(`float("3.5") natijasi?`, `3.5`, [`3`, `"3.5"`, `ValueError`]),
    q(`int(3.9) natijasi?`, `3 — kasr qismi tashlab yuboriladi`, [`4`, `3.9`, `ValueError`]),
    q(`bool("") natijasi?`, `False`, [`True`, `None`, `ValueError`]),
    q(`bool("0") natijasi?`, `True — bo'sh bo'lmagan har qanday string`, [`False`, `0`, `ValueError`]),
    c(`# Foydalanuvchi 5 kiritdi. Natija?
a = input()
print(a * 2)`, `55`, [`10`, `TypeError`, `5 5`]),
    c(`# Natija?
print(int("  42 "))`, `42 — chetdagi bo'sh joylar e'tiborga olinmaydi`, [`ValueError`, `"42"`, `0`]),
    c(`# Natija?
print(int("101", 2))`, `5`, [`101`, `ValueError`, `2`]),
    c(`# Natija?
print(round(2.5), round(3.5))`, `2 4 — juft songa yaxlitlanadi`, [`3 4`, `2 3`, `3 3`]),
    c(`# Foydalanuvchi "abc" kiritdi. Natija?
x = int(input())`, `ValueError`, [`0`, `None`, `TypeError`]),
  ]),

  py(4, 'Operatorlar', S1, [
    q(`7 // 2 natijasi?`, `3`, [`3.5`, `4`, `1`]),
    q(`7 % 2 natijasi?`, `1`, [`3`, `3.5`, `0`]),
    q(`2 ** 10 natijasi?`, `1024`, [`20`, `100`, `512`]),
    q(`"Teng emas" operatori?`, `!=`, [`<>`, `=!`, `not=`]),
    q(`Python'da mantiqiy operatorlar?`, `and, or, not`, [`&&, ||, !`, `AND, OR, NOT`, `&, |, ~ faqat`]),
    q(`is va == farqi?`, `== qiymatlar tengligini, is — bitta obyekt ekanini tekshiradi`, [`Farqi yo'q`, `is qiymatni tekshiradi`, `== faqat sonlar uchun`]),
    c(`# Natija?
print(-7 // 2)`, `-4 — pastga (kichik tomonga) yaxlitlanadi`, [`-3`, `-3.5`, `3`]),
    c(`# Natija?
print(-7 % 3)`, `2`, [`-1`, `1`, `-2`]),
    c(`# Natija?
print(2 ** 3 ** 2)`, `512 — daraja o'ngdan chapga hisoblanadi`, [`64`, `36`, `256`]),
    c(`# Natija?
print(1 < 3 < 2)`, `False — bu 1 < 3 and 3 < 2 degani`, [`True`, `SyntaxError`, `1`]),
    c(`# Natija?
print(0 or "bo'sh")`, `bo'sh`, [`0`, `True`, `False`]),
    c(`# Natija?
print(5 and 0)`, `0`, [`5`, `True`, `False`]),
    c(`# Natija?
print(0.1 + 0.2 == 0.3)`, `False`, [`True`, `0.3`, `TypeError`]),
  ]),

  py(5, 'Stringlar: indeks va kesish', S2, [
    q(`s = "salom" bo'lsa, s[0]?`, `"s"`, [`"m"`, `"salom"`, `IndexError`]),
    q(`Oxirgi belgini olish?`, `s[-1]`, [`s[len(s)]`, `s[last]`, `s.end()`]),
    q(`len("salom") natijasi?`, `5`, [`4`, `6`, `"5"`]),
    q(`Python'da stringlar o'zgaruvchanmi?`, `Yo'q — o'zgarmas (immutable); o'zgartirish uchun yangi string yaratiladi`, [`Ha`, `Faqat inglizcha harflar`, `Faqat [0] o'zgaradi`]),
    c(`# Natija?
s = "Python"
print(s[1:4])`, `yth`, [`Pyt`, `ytho`, `yt`]),
    c(`# Natija?
s = "Python"
print(s[::-1])`, `nohtyP`, [`Python`, `n`, `P`]),
    c(`# Natija?
s = "Python"
print(s[:2] + s[-2:])`, `Pyon`, [`Pyth`, `Pyhon`, `thon`]),
    c(`# Natija?
print("ab" * 3)`, `ababab`, [`ab3`, `TypeError`, `aaabbb`]),
    c(`# Natija?
print("Python"[::2])`, `Pto`, [`yhn`, `Pyt`, `Python`]),
    c(`# Natija?
s = "Python"
print(s[10])`, `IndexError`, [`""`, `None`, `n`]),
    c(`# Natija?
s = "Python"
print(s[2:100])`, `thon — kesishda chegara oshsa xato bo'lmaydi`, [`IndexError`, `th`, `""`]),
    c(`# Natija?
s = "salom"
s[0] = "S"`, `TypeError — string elementini o'zgartirib bo'lmaydi`, [`Salom`, `IndexError`, `salom`]),
    c(`# Natija?
print("lo" in "salom")`, `True`, [`False`, `2`, `TypeError`]),
  ]),

  py(6, "String metodlari va f-string", S2, [
    q(`Hamma harfni katta qilish?`, `s.upper()`, [`s.toUpperCase()`, `upper(s)`, `s.capitalize()`]),
    q(`Boshi va oxiridagi bo'sh joylarni olib tashlash?`, `s.strip()`, [`s.trim()`, `s.clean()`, `s.cut()`]),
    q(`"a b c".split() natijasi?`, `['a', 'b', 'c']`, [`"abc"`, `('a', 'b', 'c')`, `['a b c']`]),
    q(`find va index farqi?`, `find topa olmasa -1, index esa ValueError beradi`, [`Farqi yo'q`, `index -1 qaytaradi`, `find xato beradi`]),
    q(`f-string to'g'ri yozilishi?`, `f"Salom, {name}!"`, [`"Salom, {name}!".f`, `f"Salom, $name!"`, `"Salom, " + {name}`]),
    q(`"banana".count("a") natijasi?`, `3`, [`2`, `1`, `[1, 3, 5]`]),
    q(`"123".isdigit() natijasi?`, `True`, [`False`, `123`, `None`]),
    q(`"salom".startswith("sa") natijasi?`, `True`, [`False`, `0`, `"sa"`]),
    c(`# Natija?
print("  hi  ".strip() + "!")`, `hi!`, [`  hi  !`, `hi  !`, `  hi!`]),
    c(`# Natija?
print("-".join(["a", "b", "c"]))`, `a-b-c`, [`-a-b-c-`, `['a-b-c']`, `abc`]),
    c(`# Natija?
print(f"{3.14159:.2f}")`, `3.14`, [`3.14159`, `3.1`, `3.15`]),
    c(`# Natija?
s = "salom"
s.upper()
print(s)`, `salom — upper() yangi string qaytaradi`, [`SALOM`, `None`, `Salom`]),
    c(`# Natija?
print("a,b,,c".split(","))`, `['a', 'b', '', 'c']`, [`['a', 'b', 'c']`, `['a', 'b', ',', 'c']`, `['a,b,,c']`]),
    c(`# Natija?
print("Salom Dunyo".replace("o", "0", 1))`, `Sal0m Dunyo`, [`Sal0m Duny0`, `Salom Dunyo`, `TypeError`]),
  ]),

  py(7, 'Shartlar', S2, [
    q(`if to'g'ri yozilishi?`, `if x > 5:`, [`if (x > 5) {`, `if x > 5 then`, `if x > 5`]),
    q(`"Aks holda, agar…" uchun kalit so'z?`, `elif`, [`else if`, `elseif`, `elsif`]),
    q(`Qaysi qiymat if'da False hisoblanadi?`, `[] (bo'sh ro'yxat)`, [`"0"`, `" " (bo'sh joy)`, `[0]`]),
    q(`3 < x < 10 nimani bildiradi?`, `x 3 dan katta va 10 dan kichik`, [`SyntaxError`, `x 3 yoki 10`, `(3 < x) < 10 — True/False ni 10 bilan solishtiradi`]),
    q(`pass nima qiladi?`, `Hech narsa — bo'sh blok uchun o'rinbosar`, [`Tsikldan chiqadi`, `Funksiyani tugatadi`, `Xatoni o'tkazib yuboradi`]),
    q(`Python'da switch'ga o'xshash konstruksiya (3.10+)?`, `match … case`, [`switch … case`, `select … when`, `Bunday imkoniyat yo'q`]),
    c(`# Natija?
x = 7
if x > 5:
    print("A")
elif x > 3:
    print("B")`, `A`, [`B`, `A va B`, `Hech narsa`]),
    c(`# Natija?
print("juft" if 4 % 2 == 0 else "toq")`, `juft`, [`toq`, `True`, `SyntaxError`]),
    c(`# Natija?
if []:
    print("A")
else:
    print("B")`, `B`, [`A`, `TypeError`, `Hech narsa`]),
    c(`# Natija?
n = 0
if n:
    print("bor")
elif n == 0:
    print("nol")
else:
    print("manfiy")`, `nol`, [`bor`, `manfiy`, `bor va nol`]),
    c(`# Natija?
match 3:
    case 1 | 2:
        print("kichik")
    case _:
        print("boshqa")`, `boshqa`, [`kichik`, `Hech narsa`, `SyntaxError`]),
    c(`# Natija?
x = None
if x is None or x > 5:
    print("ok")`, `ok — or birinchi shart True bo'lgani uchun ikkinchisi tekshirilmaydi`, [`TypeError`, `Hech narsa`, `None`]),
  ]),

  py(8, 'while tsikli', S3, [
    q(`while tsikli qachongacha ishlaydi?`, `Shart True bo'lib turguncha`, [`Aniq 10 marta`, `Bir marta`, `Shart False bo'lguncha bir marta`]),
    q(`Tsikldan butunlay chiqish?`, `break`, [`continue`, `exit`, `stop`]),
    q(`Joriy qadamni o'tkazib, keyingisiga o'tish?`, `continue`, [`break`, `pass`, `next`]),
    q(`Cheksiz tsikl qanday yoziladi?`, `while True:`, [`while 1 > 2:`, `loop:`, `for ever:`]),
    c(`# Natija?
i = 0
while i < 3:
    print(i)
    i += 1`, `0 1 2`, [`1 2 3`, `0 1 2 3`, `Cheksiz tsikl`]),
    c(`# Natija?
n = 1234
s = 0
while n > 0:
    s += n % 10
    n //= 10
print(s)`, `10`, [`1234`, `4`, `24`]),
    c(`# Natija?
n = 10
c = 0
while n > 1:
    n //= 2
    c += 1
print(c)`, `3`, [`5`, `4`, `10`]),
    c(`# Natija?
i = 0
while i < 3:
    i += 1
else:
    print("tugadi", i)`, `tugadi 3`, [`Hech narsa`, `tugadi 2`, `SyntaxError`]),
    c(`# Natija?
i = 0
while i < 5:
    if i == 2:
        break
    i += 1
else:
    print("else")
print(i)`, `2 — break bo'lgani uchun else ishlamaydi`, [`else, keyin 2`, `5`, `else, keyin 5`]),
    c(`# Natija?
i = 0
while i < 3:
    print(i)`, `0 cheksiz chiqaveradi — i o'zgarmaydi`, [`0 1 2`, `0`, `Hech narsa`]),
  ]),

  py(9, 'for va range', S3, [
    q(`range(5) qaysi sonlarni beradi?`, `0, 1, 2, 3, 4`, [`1, 2, 3, 4, 5`, `0, 1, 2, 3, 4, 5`, `5`]),
    q(`range(1, 10, 2) qaysi sonlarni beradi?`, `1, 3, 5, 7, 9`, [`1, 2, …, 10`, `2, 4, 6, 8`, `1, 3, 5, 7, 9, 11`]),
    q(`5 dan 1 gacha teskari sanash?`, `range(5, 0, -1)`, [`range(5, 1)`, `range(1, 5, -1)`, `reversed(5)`]),
    q(`enumerate() nima beradi?`, `Har bir element bilan uning indeksini`, [`Elementlar sonini`, `Saralangan ro'yxatni`, `Faqat indekslarni`]),
    q(`zip() nima qiladi?`, `Bir nechta ketma-ketlikni element-element juftlaydi`, [`Faylni siqadi`, `Ro'yxatni saralaydi`, `Ro'yxatlarni qo'shadi`]),
    c(`# Natija?
print(list(range(2, 10, 3)))`, `[2, 5, 8]`, [`[2, 5, 8, 11]`, `[3, 6, 9]`, `[2, 3, 4]`]),
    c(`# Natija?
print(sum(range(1, 101)))`, `5050`, [`5000`, `5151`, `100`]),
    c(`# Natija?
c = 0
for i in range(3):
    for j in range(4):
        c += 1
print(c)`, `12`, [`7`, `3`, `4`]),
    c(`# Natija?
for n in [3, 5, 8, 9]:
    if n % 2 == 0:
        print("juft topildi", n)
        break
else:
    print("juft yo'q")`, `juft topildi 8`, [`juft yo'q`, `juft topildi 8, juft yo'q`, `Hech narsa`]),
    c(`# Natija?
for i in range(5):
    pass
print(i)`, `4`, [`5`, `NameError`, `0`]),
    c(`# Natija?
print(list(zip([1, 2, 3], "ab")))`, `[(1, 'a'), (2, 'b')] — eng qisqasi bo'yicha`, [`[(1, 'a'), (2, 'b'), (3, None)]`, `ValueError`, `[1, 'a', 2, 'b']`]),
    c(`# Natija?
for i, ch in enumerate("ab", start=1):
    print(i, ch)`, `1 a, 2 b`, [`0 a, 1 b`, `a 1, b 2`, `1 ab`]),
  ]),

  py(10, "Ro'yxatlar (list)", S4, [
    q(`Ro'yxat yaratish?`, `a = [1, 2, 3]`, [`a = (1, 2, 3)`, `a = {1, 2, 3}`, `a = list[1, 2, 3]`]),
    q(`Oxiriga element qo'shish?`, `a.append(x)`, [`a.push(x)`, `a.add(x)`, `a.insert(x)`]),
    q(`Ma'lum joyga element qo'yish?`, `a.insert(i, x)`, [`a.append(i, x)`, `a.put(i, x)`, `a[i].add(x)`]),
    q(`Qiymat bo'yicha o'chirish?`, `a.remove(x)`, [`a.pop(x)`, `a.delete(x)`, `del a(x)`]),
    q(`a.pop() nima qiladi?`, `Oxirgi elementni o'chirib, uni qaytaradi`, [`Birinchi elementni o'chiradi`, `Ro'yxatni tozalaydi`, `Oxirgi elementni qaytaradi, o'chirmaydi`]),
    q(`append va extend farqi?`, `append bitta element qo'shadi, extend — boshqa ketma-ketlikning hamma elementlarini`, [`Farqi yo'q`, `extend boshiga qo'shadi`, `append ko'p element qo'shadi`]),
    c(`# Natija?
a = [1, 2, 3]
a.append([4, 5])
print(len(a))`, `4`, [`5`, `3`, `TypeError`]),
    c(`# Natija?
a = [1, 2, 3]
b = a
b.append(4)
print(a)`, `[1, 2, 3, 4] — a va b bitta ro'yxat`, [`[1, 2, 3]`, `[4]`, `None`]),
    c(`# Natija?
a = [1, 2, 3]
b = a[:]
b.append(4)
print(a)`, `[1, 2, 3]`, [`[1, 2, 3, 4]`, `[4]`, `[]`]),
    c(`# Natija?
a = [3, 1, 2]
print(a.sort())`, `None — sort() ro'yxatni joyida saralaydi`, [`[1, 2, 3]`, `[3, 2, 1]`, `[3, 1, 2]`]),
    c(`# Natija?
print(sorted([3, 1, 2], reverse=True))`, `[3, 2, 1]`, [`[1, 2, 3]`, `None`, `[2, 1, 3]`]),
    c(`# Natija?
a = [1, 2, 3, 4, 5]
print(a[1:4], a[-2:])`, `[2, 3, 4] [4, 5]`, [`[1, 2, 3, 4] [4, 5]`, `[2, 3] [5]`, `[2, 3, 4, 5] [4]`]),
    c(`# Natija?
m = [[0] * 3] * 2
m[0][0] = 1
print(m)`, `[[1, 0, 0], [1, 0, 0]] — ikkala qator bitta ro'yxat`, [`[[1, 0, 0], [0, 0, 0]]`, `[[1, 1, 1], [0, 0, 0]]`, `TypeError`]),
  ]),

  py(11, "List comprehension va ro'yxat amallari", S4, [
    q(`List comprehension nima?`, `Yangi ro'yxatni bir qatorda yaratish usuli: [ifoda for x in …]`, [`Ro'yxatni tushunish funksiyasi`, `Ro'yxatni siqish`, `Ro'yxatni saralash`]),
    q(`Generator ifoda (x for x in …) list comprehension'dan nimasi bilan farq qiladi?`, `Qiymatlarni birma-bir hosil qiladi — xotira tejaydi`, [`Farqi yo'q`, `Tezroq saralaydi`, `Tuple qaytaradi`]),
    c(`# Natija?
print([x * 2 for x in range(4)])`, `[0, 2, 4, 6]`, [`[2, 4, 6, 8]`, `[0, 1, 2, 3]`, `[0, 2, 4, 6, 8]`]),
    c(`# Natija?
print([x for x in range(10) if x % 3 == 0])`, `[0, 3, 6, 9]`, [`[3, 6, 9]`, `[1, 4, 7]`, `[0, 3, 6]`]),
    c(`# Natija?
print(["juft" if x % 2 == 0 else "toq" for x in range(3)])`, `['juft', 'toq', 'juft']`, [`['toq', 'juft', 'toq']`, `['juft', 'juft']`, `SyntaxError`]),
    c(`# Natija?
print([i * j for i in range(1, 3) for j in range(1, 3)])`, `[1, 2, 2, 4]`, [`[1, 4]`, `[[1, 2], [2, 4]]`, `[2, 4]`]),
    c(`# Natija?
print([x for row in [[1, 2], [3]] for x in row])`, `[1, 2, 3]`, [`[[1, 2], [3]]`, `[1, 2]`, `SyntaxError`]),
    c(`# Natija?
print(max([3, 7, 2]), min([3, 7, 2]))`, `7 2`, [`2 7`, `7 3`, `3 2`]),
    c(`# Natija?
print([1, 2, 2, 3].count(2))`, `2`, [`1`, `4`, `[1, 2]`]),
    c(`# Natija?
print(list("abc"))`, `['a', 'b', 'c']`, [`['abc']`, `"abc"`, `TypeError`]),
    c(`# Natija?
a = [1, 2, 3]
a[1:2] = [7, 8, 9]
print(a)`, `[1, 7, 8, 9, 3]`, [`[1, [7, 8, 9], 3]`, `[1, 7, 3]`, `ValueError`]),
  ]),

  py(12, 'Tuple va set', S4, [
    q(`Tuple nima?`, `O'zgarmas, tartiblangan ketma-ketlik: (1, 2, 3)`, [`O'zgaruvchan ro'yxat`, `Takrorlanmas to'plam`, `Kalit-qiymat juftligi`]),
    q(`Bitta elementli tuple?`, `(5,)`, [`(5)`, `[5]`, `tuple 5`]),
    q(`Set nima?`, `Takrorlanmaydigan, tartibsiz elementlar to'plami`, [`Tartiblangan ro'yxat`, `O'zgarmas ro'yxat`, `Lug'at`]),
    q(`Bo'sh set yaratish?`, `set()`, [`{}`, `[]`, `()`]),
    q(`Element set'da bormi — tekshirish nima uchun tez?`, `Set xesh-jadvalga asoslangan — qidiruv o'rtacha O(1)`, [`Set saralangan`, `Set kichik`, `Tez emas`]),
    c(`# Natija?
t = (1, 2, 3)
t[0] = 9`, `TypeError`, [`(9, 2, 3)`, `IndexError`, `None`]),
    c(`# Natija?
print(len({1, 2, 2, 3, 3, 3}))`, `3`, [`6`, `4`, `1`]),
    c(`# Natija?
print({1, 2, 3} & {2, 3, 4})`, `{2, 3}`, [`{1, 2, 3, 4}`, `{1, 4}`, `{1}`]),
    c(`# Natija?
print({1, 2, 3} | {3, 4})`, `{1, 2, 3, 4}`, [`{3}`, `{1, 2, 3, 3, 4}`, `{1, 2, 4}`]),
    c(`# Natija?
print({1, 2, 3} - {2})`, `{1, 3}`, [`{2}`, `{-1, 0, 1}`, `TypeError`]),
    c(`# Natija?
a, *b = (1, 2, 3)
print(b)`, `[2, 3]`, [`(2, 3)`, `2`, `SyntaxError`]),
    c(`# Natija?
print(type((5)))`, `<class 'int'> — qavs tuple yaratmaydi, vergul yaratadi`, [`<class 'tuple'>`, `<class 'list'>`, `<class 'set'>`]),
    c(`# Natija?
s = {[1, 2]}`, `TypeError: unhashable type: 'list'`, [`{[1, 2]}`, `{1, 2}`, `set()`]),
  ]),

  py(13, "Lug'atlar (dict)", S4, [
    q(`Lug'at yaratish?`, `d = {"ism": "Ali", "yosh": 20}`, [`d = ["ism": "Ali"]`, `d = ("ism" = "Ali")`, `d = {"ism" = "Ali"}`]),
    q(`Kalit bo'yicha qiymat olish?`, `d["ism"]`, [`d.ism`, `d("ism")`, `d->ism`]),
    q(`Kalit yo'q bo'lsa xatosiz qiymat olish?`, `d.get("x")`, [`d["x"]`, `d.find("x")`, `d.value("x")`]),
    q(`d.get("x", 0) kalit bo'lmasa nima qaytaradi?`, `0`, [`None`, `KeyError`, `"x"`]),
    q(`Kalit va qiymat juftlarini aylanib chiqish?`, `for k, v in d.items():`, [`for k, v in d:`, `for k, v in d.pairs():`, `for (k, v) of d:`]),
    q(`Qaysi tur lug'at kaliti bo'la olmaydi?`, `list`, [`str`, `int`, `tuple`]),
    c(`# Natija?
d = {"a": 1}
print(d["b"])`, `KeyError`, [`None`, `0`, `IndexError`]),
    c(`# Natija?
d = {"a": 1, "a": 2}
print(d)`, `{'a': 2}`, [`{'a': 1, 'a': 2}`, `{'a': 1}`, `SyntaxError`]),
    c(`# Natija?
print({x: x * x for x in range(3)})`, `{0: 0, 1: 1, 2: 4}`, [`[0, 1, 4]`, `{1: 1, 2: 4}`, `{0, 1, 4}`]),
    c(`# Natija?
s = "banan"
d = {}
for ch in s:
    d[ch] = d.get(ch, 0) + 1
print(d)`, `{'b': 1, 'a': 2, 'n': 2}`, [`{'b': 1, 'a': 1, 'n': 1}`, `KeyError`, `{'banan': 1}`]),
    c(`# Natija?
d = {"a": 1}
print(d | {"b": 2})`, `{'a': 1, 'b': 2}`, [`TypeError`, `{'b': 2}`, `{'a': 1}`]),
    c(`# Natija?
d = {"a": 1, "b": 2}
for k in d:
    del d[k]`, `RuntimeError: aylanish paytida lug'at o'lchami o'zgardi`, [`{}`, `{'b': 2}`, `KeyError`]),
    c(`# Natija?
d = {"x": 1}
print(list(d.keys()), list(d.values()))`, `['x'] [1]`, [`x 1`, `[('x', 1)]`, `dict_keys(['x'])`]),
  ]),

  py(14, 'Funksiyalar asoslari', S5, [
    q(`Funksiya e'lon qilish?`, `def salom():`, [`function salom():`, `func salom()`, `def salom() {`]),
    q(`return yozilmagan funksiya nima qaytaradi?`, `None`, [`0`, `False`, `Oxirgi qatorni`]),
    q(`Standart qiymatli parametr?`, `def f(a, b=2):`, [`def f(a, b: 2):`, `def f(a, default b=2):`, `def f(b=2, a):`]),
    q(`Nomli (keyword) argument bilan chaqirish?`, `f(b=3, a=1)`, [`f(b:3, a:1)`, `f({b: 3, a: 1})`, `f(3 -> b)`]),
    q(`Docstring nima?`, `Funksiya boshidagi """…""" ko'rinishidagi tavsif`, [`Izoh # bilan`, `Funksiya nomi`, `Xato xabari`]),
    c(`# Natija?
def f(a, b=2):
    return a * b
print(f(3))`, `6`, [`3`, `TypeError`, `5`]),
    c(`# Natija?
def f():
    print("hi")
x = f()
print(x)`, `hi, keyin None`, [`hi`, `None`, `hi hi`]),
    c(`# Natija?
def f(a, b):
    return a - b
print(f(b=10, a=3))`, `-7`, [`7`, `TypeError`, `13`]),
    c(`# Natija?
def f():
    return 1, 2
print(type(f()))`, `<class 'tuple'>`, [`<class 'int'>`, `<class 'list'>`, `SyntaxError`]),
    c(`# Natija?
def f(a=1, b):
    return a + b`, `SyntaxError — standart qiymatsiz parametr oldin turishi kerak`, [`Hech qanday xato yo'q`, `TypeError chaqirilganda`, `None`]),
    c(`# Natija?
def f(n):
    for i in range(n):
        if i == 2:
            return i
    return -1
print(f(5), f(2))`, `2 -1`, [`2 2`, `-1 -1`, `4 1`]),
  ]),

  py(15, 'Funksiyalar: *args, **kwargs va scope', S5, [
    q(`*args nima?`, `Istalgancha pozitsion argumentni tuple qilib oladi`, [`Ko'paytirish`, `Ko'rsatkich (pointer)`, `Faqat 2 ta argument`]),
    q(`**kwargs nima?`, `Istalgancha nomli argumentni dict qilib oladi`, [`Darajaga ko'tarish`, `Ro'yxat`, `Majburiy argumentlar`]),
    q(`Funksiya ichidan global o'zgaruvchini o'zgartirish?`, `global x deb e'lon qilish`, [`x = global`, `this.x`, `Iloji yo'q`]),
    q(`Python o'zgaruvchini qidirish tartibi (LEGB)?`, `Local → Enclosing → Global → Built-in`, [`Global → Local`, `Built-in → Global → Local`, `Tasodifiy`]),
    q(`nonlocal nima uchun?`, `Ichki funksiyadan tashqi (lekin global emas) funksiya o'zgaruvchisini o'zgartirish`, [`Global o'zgaruvchi yaratish`, `O'zgaruvchini o'chirish`, `Import qilish`]),
    c(`# Natija?
def f(*a):
    return sum(a)
print(f(1, 2, 3))`, `6`, [`(1, 2, 3)`, `TypeError`, `3`]),
    c(`# Natija?
def f(**k):
    return list(k)
print(f(x=1, y=2))`, `['x', 'y']`, [`[1, 2]`, `[('x', 1), ('y', 2)]`, `{'x': 1, 'y': 2}`]),
    c(`# Natija?
def f(a, *args, b=0):
    return a + len(args) + b
print(f(1, 2, 3, b=10))`, `13`, [`16`, `6`, `TypeError`]),
    c(`# Natija?
nums = [1, 2, 3]
print(*nums)`, `1 2 3`, [`[1, 2, 3]`, `(1, 2, 3)`, `SyntaxError`]),
    c(`# Natija?
def add(x, lst=[]):
    lst.append(x)
    return lst
add(1)
print(add(2))`, `[1, 2] — standart ro'yxat bir marta yaratiladi va umumiy`, [`[2]`, `[1]`, `[]`]),
    c(`# Natija?
x = 5
def f():
    x += 1
f()`, `UnboundLocalError`, [`6 bo'ladi`, `5 qoladi`, `Hech narsa`]),
    c(`# Natija?
def make(n):
    def inner(x):
        return x * n
    return inner
triple = make(3)
print(triple(5))`, `15`, [`8`, `3`, `TypeError`]),
  ]),

  py(16, 'lambda, map, filter va rekursiya', S5, [
    q(`lambda nima?`, `Bir ifodali anonim (nomsiz) funksiya`, [`Kutubxona`, `Tsikl turi`, `O'zgaruvchi turi`]),
    q(`map(f, a) nima qaytaradi?`, `Iterator — list() bilan ro'yxatga aylantiriladi`, [`Doim ro'yxat`, `Lug'at`, `Bitta qiymat`]),
    q(`Rekursiya nima?`, `Funksiyaning o'zini o'zi chaqirishi — tugash sharti albatta kerak`, [`Tsikl turi`, `Xato turi`, `Import usuli`]),
    c(`# Natija?
f = lambda x: x ** 2
print(f(4))`, `16`, [`8`, `4`, `SyntaxError`]),
    c(`# Natija?
print(list(map(int, ["1", "2"])))`, `[1, 2]`, [`['1', '2']`, `3`, `TypeError`]),
    c(`# Natija?
print(list(filter(lambda x: x > 2, [1, 2, 3, 4])))`, `[3, 4]`, [`[1, 2]`, `[False, False, True, True]`, `2`]),
    c(`# Natija?
print(sorted(["bb", "a", "ccc"], key=len))`, `['a', 'bb', 'ccc']`, [`['ccc', 'bb', 'a']`, `['bb', 'a', 'ccc']`, `[1, 2, 3]`]),
    c(`# Natija?
talabalar = [("Ali", 85), ("Vali", 92), ("Sami", 78)]
print(max(talabalar, key=lambda t: t[1])[0])`, `Vali`, [`Sami`, `92`, `Ali`]),
    c(`# Natija?
m = map(str, [1, 2])
print(list(m), list(m))`, `['1', '2'] [] — iterator bir marta ishlatiladi`, [`['1', '2'] ['1', '2']`, `[] []`, `TypeError`]),
    c(`# Natija?
print(any([0, "", 3]), all([1, []]))`, `True False`, [`False False`, `True True`, `False True`]),
    c(`# Natija?
from functools import reduce
print(reduce(lambda a, b: a * b, [1, 2, 3, 4]))`, `24`, [`10`, `[1, 2, 6, 24]`, `4`]),
    c(`# Natija?
def f(n):
    if n <= 1:
        return 1
    return n * f(n - 1)
print(f(5))`, `120`, [`15`, `5`, `RecursionError`]),
  ]),

  py(17, 'Xatolar va try/except', S6, [
    q(`Xatoni ushlash konstruksiyasi?`, `try / except`, [`try / catch`, `if / error`, `do / rescue`]),
    q(`try … except … else dagi else qachon ishlaydi?`, `try blokida xato bo'lmasa`, [`Xato bo'lsa`, `Doim`, `Hech qachon`]),
    q(`finally qachon ishlaydi?`, `Xato bo'lsa ham, bo'lmasa ham — doim`, [`Faqat xato bo'lsa`, `Faqat xato bo'lmasa`, `Faqat return bo'lsa`]),
    q(`O'zingiz xato chiqarish?`, `raise ValueError("xabar")`, [`throw ValueError("xabar")`, `error("xabar")`, `except ValueError`]),
    q(`int("abc") qaysi xatoni beradi?`, `ValueError`, [`TypeError`, `SyntaxError`, `NameError`]),
    q(`"5" + 5 qaysi xatoni beradi?`, `TypeError`, [`ValueError`, `SyntaxError`, `10`]),
    q(`Nega except: (turini yozmasdan) yomon amaliyot?`, `Hamma xatoni, hatto Ctrl+C ni ham yutib yuboradi — xatoni topish qiyinlashadi`, [`Ishlamaydi`, `Sekin ishlaydi`, `Faqat Python 2 da ishlaydi`]),
    q(`O'z xato klassingizni yaratish?`, `class MyError(Exception): pass`, [`error MyError`, `def MyError(): raise`, `Exception.new("MyError")`]),
    c(`# Natija?
try:
    print(1 / 0)
except ZeroDivisionError:
    print("nol")`, `nol`, [`0`, `inf`, `ZeroDivisionError`]),
    c(`# Natija?
try:
    print("A")
    x = 1 / 0
    print("B")
except ZeroDivisionError:
    print("C")
else:
    print("D")
finally:
    print("E")`, `A C E`, [`A B C D E`, `A C D E`, `A E`]),
    c(`# Natija?
try:
    [1, 2][5]
except KeyError:
    print("K")
except IndexError:
    print("I")`, `I`, [`K`, `K I`, `Xato chiqib dastur to'xtaydi`]),
    c(`# Natija?
def f():
    try:
        return "try"
    finally:
        return "finally"
print(f())`, `finally`, [`try`, `try finally`, `None`]),
  ]),

  py(18, 'Fayllar bilan ishlash', S6, [
    q(`Faylni o'qish uchun ochish?`, `open("a.txt", "r")`, [`open("a.txt", "w")`, `read("a.txt")`, `file("a.txt")`]),
    q(`"w" rejimi nima qiladi?`, `Yozish uchun ochadi — fayl bor bo'lsa ichini o'chiradi`, [`Oxiriga qo'shadi`, `Faqat o'qiydi`, `Faylni o'chiradi`]),
    q(`Fayl oxiriga qo'shish rejimi?`, `"a"`, [`"w"`, `"r+"`, `"x"`]),
    q(`with open(…) as f: ning afzalligi?`, `Blok tugaganda (xato bo'lsa ham) fayl avtomatik yopiladi`, [`Fayl tezroq o'qiladi`, `Fayl shifrlanadi`, `Afzalligi yo'q`]),
    q(`Butun faylni bitta string qilib o'qish?`, `f.read()`, [`f.readline()`, `f.lines()`, `f.get()`]),
    q(`O'zbekcha harflar to'g'ri o'qilishi uchun?`, `open("a.txt", encoding="utf-8")`, [`open("a.txt", "uz")`, `open("a.txt", lang="uz")`, `Hech narsa kerak emas`]),
    q(`Mavjud bo'lmagan faylni "r" bilan ochsa?`, `FileNotFoundError`, [`Bo'sh fayl yaratiladi`, `None qaytadi`, `ValueError`]),
    q(`Lug'atni JSON faylga yozish?`, `json.dump(data, f)`, [`f.write(data)`, `json.write(f, data)`, `json.loads(data, f)`]),
    q(`"rb" rejimi nima?`, `Faylni ikkilik (binary) ko'rinishda o'qish — rasm va boshqalar uchun`, [`Faylni qayta yozish`, `Zaxira nusxa`, `Faqat o'qish va bloklash`]),
    c(`# Natija?
with open("a.txt", "w") as f:
    f.write("Salom")
with open("a.txt", "w") as f:
    f.write("Dunyo")
print(open("a.txt").read())`, `Dunyo`, [`SalomDunyo`, `Salom`, `Salom Dunyo`]),
    c(`# Natija?
line = "Ali\\n"
print(len(line), len(line.strip()))`, `4 3`, [`3 3`, `4 4`, `5 3`]),
  ]),

  py(19, 'Modullar va standart kutubxona', S6, [
    q(`math modulini ulash?`, `import math`, [`include math`, `require("math")`, `using math`]),
    q(`Moduldan faqat bitta funksiyani olish?`, `from math import sqrt`, [`import sqrt from math`, `import math.sqrt only`, `from sqrt import math`]),
    q(`Modulga qisqa nom berish?`, `import numpy as np`, [`import numpy = np`, `import np from numpy`, `alias numpy np`]),
    q(`random.randint(1, 6) qaysi sonlarni berishi mumkin?`, `1 dan 6 gacha — 6 ham kiradi`, [`1 dan 5 gacha`, `0 dan 6 gacha`, `Kasr sonlarni ham`]),
    q(`Ro'yxatdan tasodifiy element olish?`, `random.choice(a)`, [`random.pick(a)`, `random.randint(a)`, `a.random()`]),
    q(`Tashqi paket o'rnatish?`, `pip install requests`, [`npm install requests`, `import install requests`, `python get requests`]),
    q(`if __name__ == "__main__": nima uchun?`, `Kod faqat fayl to'g'ridan-to'g'ri ishga tushirilganda bajariladi, import qilinganda emas`, [
      `Asosiy funksiyani e'lon qiladi`,
      `Faylni tezlashtiradi`,
      `Majburiy qator`,
    ]),
    q(`Virtual muhit (venv) nima uchun?`, `Har bir loyiha paketlarini alohida, bir-biriga aralashtirmasdan saqlash`, [`Python'ni tezlashtirish`, `Internet ulash`, `Kodni shifrlash`]),
    c(`# Natija?
import math
print(math.sqrt(16))`, `4.0`, [`4`, `16`, `256`]),
    c(`# Natija?
import math
print(math.floor(-2.5))`, `-3`, [`-2`, `-2.5`, `2`]),
    c(`# Natija?
from collections import Counter
print(Counter("hello").most_common(1))`, `[('l', 2)]`, [`[('h', 1)]`, `{'l': 2}`, `('l', 2)`]),
  ]),

  py(20, 'OOP: klass va obyekt', S7, [
    q(`Klass e'lon qilish?`, `class User:`, [`class User {`, `def class User:`, `new class User:`]),
    q(`__init__ qachon chaqiriladi?`, `Obyekt yaratilganda avtomatik`, [`Dastur boshlanganda`, `Obyekt o'chirilganda`, `Qo'lda chaqirilganda`]),
    q(`Metodlardagi self nima?`, `Metod chaqirilgan obyektning o'zi`, [`Klass nomi`, `Global o'zgaruvchi`, `Kalit so'z, hech narsa emas`]),
    q(`Klassdan obyekt yaratish?`, `u = User("Ali")`, [`u = new User("Ali")`, `u = User.create("Ali")`, `u = class User("Ali")`]),
    q(`Klass atributi va obyekt atributi farqi?`, `Klass atributi barcha obyektlar uchun umumiy, obyekt atributi — har biriga alohida`, [`Farqi yo'q`, `Obyekt atributi umumiy`, `Klass atributi o'zgarmaydi`]),
    q(`__str__ metodi nima uchun?`, `print(obj) da ko'rinadigan matnni belgilaydi`, [`Obyektni stringga majburan aylantirish uchun xato`, `Obyekt nomi`, `Obyektni o'chirish`]),
    q(`_name va __name farqi?`, `_name — "ichki" degan kelishuv; __name — nomi o'zgartiriladi (name mangling)`, [`Farqi yo'q`, `__name ochiq, _name yopiq`, `Ikkalasi ham xato`]),
    c(`# Natija?
class Dog:
    def __init__(self, name):
        self.name = name
    def bark(self):
        return self.name + " vov!"
print(Dog("Rex").bark())`, `Rex vov!`, [`vov!`, `TypeError`, `name vov!`]),
    c(`# Natija?
class A:
    def hi():
        return "hi"
print(A().hi())`, `TypeError — self parametri yo'q`, [`hi`, `None`, `SyntaxError`]),
    c(`# Natija?
class C:
    count = 0
    def __init__(self):
        C.count += 1
C(); C(); C()
print(C.count)`, `3`, [`1`, `0`, `TypeError`]),
    c(`# Natija?
class T:
    items = []
a, b = T(), T()
a.items.append(1)
print(b.items)`, `[1] — ro'yxat klass atributi, umumiy`, [`[]`, `None`, `AttributeError`]),
  ]),

  py(21, 'OOP: meros va maxsus metodlar', S7, [
    q(`Meros olish?`, `class Admin(User):`, [`class Admin extends User:`, `class Admin : User`, `class Admin inherits User:`]),
    q(`Ota klass konstruktorini chaqirish?`, `super().__init__(…)`, [`parent.__init__()`, `base()`, `self.super()`]),
    q(`Polimorfizm nima?`, `Bir xil nomli metod turli klasslarda o'zicha ishlashi`, [`Ko'p meros`, `Xato turi`, `Ko'p o'zgaruvchi`]),
    q(`Obyekt ma'lum klassdan ekanini tekshirish?`, `isinstance(x, User)`, [`type(x) == "User"`, `x.is(User)`, `x instanceof User`]),
    q(`len(obj) chaqirilganda qaysi metod ishlaydi?`, `__len__`, [`__size__`, `__count__`, `length()`]),
    q(`@property nima qiladi?`, `Metodni atributdek o'qish imkonini beradi: obj.full_name`, [`Atributni yashiradi`, `Atributni o'zgarmas qiladi`, `Metodni statik qiladi`]),
    q(`@classmethod va @staticmethod farqi?`, `classmethod birinchi argument sifatida klassni (cls) oladi, staticmethod hech narsa olmaydi`, [`Farqi yo'q`, `staticmethod self oladi`, `classmethod obyekt yaratmaydi`]),
    c(`# Natija?
class A:
    def hi(self):
        return "A"
class B(A):
    def hi(self):
        return "B" + super().hi()
print(B().hi())`, `BA`, [`AB`, `B`, `A`]),
    c(`# Natija?
class V:
    def __init__(self, x):
        self.x = x
    def __add__(self, o):
        return V(self.x + o.x)
print((V(2) + V(3)).x)`, `5`, [`23`, `TypeError`, `V(5)`]),
    c(`# Natija?
class A:
    def who(self): return "A"
class B(A):
    def who(self): return "B"
class C(A):
    def who(self): return "C"
class D(B, C):
    pass
print(D().who())`, `B — MRO bo'yicha chapdan o'ngga`, [`C`, `A`, `TypeError`]),
    c(`# Natija?
class P:
    def __init__(self, x):
        self.x = x
print(P(1) == P(1))`, `False — __eq__ bo'lmasa obyektlar identifikatori solishtiriladi`, [`True`, `TypeError`, `None`]),
  ]),

  py(22, 'Iterator va generatorlar', S7, [
    q(`Iterator nima?`, `next() bilan elementlarni birma-bir beradigan obyekt`, [`Tsikl turi`, `Ro'yxat nusxasi`, `Xato turi`]),
    q(`Iterator tugaganda next() nima qiladi?`, `StopIteration xatosini chiqaradi`, [`None qaytaradi`, `Boshidan boshlaydi`, `-1 qaytaradi`]),
    q(`Generator funksiya qanday aniqlanadi?`, `Ichida yield bor`, [`Nomi gen bilan boshlanadi`, `@generator dekoratori`, `return list`]),
    q(`yield va return farqi?`, `yield qiymat berib to'xtab turadi va keyin davom etadi; return funksiyani tugatadi`, [`Farqi yo'q`, `return davom etadi`, `yield faqat sonlar uchun`]),
    q(`Generatorning asosiy afzalligi?`, `Qiymatlarni kerak bo'lganda hosil qilib, xotirani tejaydi`, [`Har doim tezroq`, `Saralaydi`, `Xatolarni yashiradi`]),
    c(`# Natija?
def gen():
    yield 1
    yield 2
g = gen()
print(next(g), next(g))`, `1 2`, [`1 1`, `[1, 2]`, `StopIteration`]),
    c(`# Natija?
def gen():
    yield 1
g = gen()
next(g)
next(g)`, `StopIteration`, [`1`, `None`, `Hech narsa`]),
    c(`# Natija?
print(list(x * x for x in range(4)))`, `[0, 1, 4, 9]`, [`[1, 4, 9, 16]`, `<generator object>`, `[0, 2, 4, 6]`]),
    c(`# Natija?
g = (x for x in range(3))
print(sum(g), sum(g))`, `3 0 — generator bir marta ishlatiladi`, [`3 3`, `0 0`, `TypeError`]),
    c(`# Natija?
r = range(3)
print(list(r), list(r))`, `[0, 1, 2] [0, 1, 2] — range qayta-qayta aylantiriladi`, [`[0, 1, 2] []`, `[] []`, `TypeError`]),
    c(`# Natija?
def count_up(n):
    i = 0
    while i < n:
        yield i
        i += 1
print(list(count_up(3)))`, `[0, 1, 2]`, [`[1, 2, 3]`, `[0, 1, 2, 3]`, `<generator object>`]),
  ]),

  py(23, 'Dekoratorlar va kontekst menejerlari', S7, [
    q(`Dekorator nima?`, `Funksiyani o'rab, uning xatti-harakatini o'zgartiradigan funksiya`, [`Kodni bezatuvchi izoh`, `Klass turi`, `Modul`]),
    q(`@deco yozuvi nimaga teng?`, `f = deco(f)`, [`deco = f(deco)`, `f()`, `import deco`]),
    q(`functools.wraps nima uchun?`, `O'ralgan funksiyaning nomi va docstring'ini saqlab qoladi`, [`Funksiyani tezlashtiradi`, `Funksiyani keshlaydi`, `Xatolarni ushlaydi`]),
    q(`Kontekst menejeri nima?`, `with bilan ishlaydigan, kirish va chiqishda amal bajaradigan obyekt`, [`Sozlamalar fayli`, `Xato turi`, `Tsikl`]),
    q(`Kontekst menejeri qaysi metodlarga ega bo'ladi?`, `__enter__ va __exit__`, [`__start__ va __stop__`, `__open__ va __close__`, `__init__ va __del__`]),
    q(`@functools.lru_cache nima qiladi?`, `Funksiya natijalarini keshlaydi — bir xil argumentda qayta hisoblamaydi`, [`Xotirani tozalaydi`, `Funksiyani sekinlashtiradi`, `Xatolarni yozib boradi`]),
    c(`# Natija?
def shout(fn):
    def wrap():
        return fn().upper()
    return wrap

@shout
def hi():
    return "salom"

print(hi())`, `SALOM`, [`salom`, `None`, `TypeError`]),
    c(`# Natija?
def a(fn):
    return lambda: "a(" + fn() + ")"
def b(fn):
    return lambda: "b(" + fn() + ")"

@a
@b
def f():
    return "f"

print(f())`, `a(b(f))`, [`b(a(f))`, `f`, `a(f)b(f)`]),
    c(`# Natija?
def counter(fn):
    def wrap(*args):
        wrap.calls += 1
        return fn(*args)
    wrap.calls = 0
    return wrap

@counter
def add(a, b):
    return a + b

add(1, 2)
add(3, 4)
print(add.calls)`, `2`, [`0`, `1`, `AttributeError`]),
    c(`# Funksiya hech qachon chaqirilmasa ham nima chiqadi?
def deco(fn):
    print("deco")
    return fn

@deco
def f():
    print("f")`, `deco — dekorator funksiya e'lon qilinganda ishlaydi`, [`Hech narsa`, `f`, `deco f`]),
  ]),

  py(24, "Xotira: o'zgaruvchan va o'zgarmas turlar, nusxalash", S7, [
    q(`Qaysi turlar o'zgaruvchan (mutable)?`, `list, dict, set`, [`int, str, tuple`, `str, list`, `tuple, set`]),
    q(`Qaysi turlar o'zgarmas (immutable)?`, `int, str, tuple`, [`list, dict`, `set, list`, `dict, tuple`]),
    q(`None bilan to'g'ri solishtirish?`, `x is None`, [`x == None — yagona to'g'ri yo'l`, `x === None`, `None(x)`]),
    q(`Ro'yxatning to'liq (chuqur) nusxasi?`, `copy.deepcopy(a)`, [`a.copy()`, `a[:]`, `list(a)`]),
    q(`id(x) nima qaytaradi?`, `Obyektning noyob identifikatorini (xotiradagi o'rni)`, [`O'zgaruvchi nomini`, `Turini`, `Qiymatini`]),
    c(`# Natija?
a = [1, [2, 3]]
b = a.copy()
b[1].append(4)
print(a)`, `[1, [2, 3, 4]] — copy() yuza nusxa`, [`[1, [2, 3]]`, `[1, [2, 3], 4]`, `TypeError`]),
    c(`# Natija?
import copy
a = [1, [2, 3]]
b = copy.deepcopy(a)
b[1].append(4)
print(a)`, `[1, [2, 3]]`, [`[1, [2, 3, 4]]`, `[1, [2, 3], 4]`, `TypeError`]),
    c(`# Natija?
s = "abc"
t = s
t += "d"
print(s)`, `abc`, [`abcd`, `d`, `TypeError`]),
    c(`# Natija?
a = [1, 2]
b = a
a += [3]
print(b)`, `[1, 2, 3] — += ro'yxatni joyida o'zgartiradi`, [`[1, 2]`, `[3]`, `TypeError`]),
    c(`# Natija?
a = [1, 2]
b = a
a = a + [3]
print(b)`, `[1, 2] — a + [3] yangi ro'yxat yaratadi`, [`[1, 2, 3]`, `[3]`, `None`]),
    c(`# Natija?
def f(lst):
    lst.append(1)
x = []
f(x)
print(x)`, `[1]`, [`[]`, `None`, `[[1]]`]),
    c(`# Natija?
def f(n):
    n += 1
x = 5
f(x)
print(x)`, `5`, [`6`, `None`, `UnboundLocalError`]),
  ]),
]
