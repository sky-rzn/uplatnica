# Налоги, взносы и коммунальные счета: данные для шаблонов

Актуально на: **2026-11-13** (дата исследования). У каждого правила ниже
стоит источник и, где известно, дата публикации.

Пометки:

- **[П]**: первичный источник (purs.gov.rs, текст Pravilnik/закона на
  paragraf.rs, сайт эмитента счёта, сайт города).
- **[В]**: вторичный источник (блоги, сервисы-генераторы). Использован
  только для сверки.
- **НЕ ПРОВЕРЕНО**: подтверждения в первичном источнике не нашлось.

Контрольные цифры всех номеров счетов, перечисленных ниже, я дополнительно
пересчитал по ISO 7064 MOD 97-10 (`98 - (N * 100 mod 97)`, где N = банк(3) +
partija(13)). Все сошлись. Это проверка формата, а не подтверждение
действительности счёта.

---

## 0. Общие правила для счетов публичных доходов (раздел 5 задачи, вынесен вперёд)

Основной акт: **Pravilnik o uslovima i načinu vođenja računa za uplatu javnih
prihoda i raspored sredstava sa tih računa** ("Sl. glasnik RS", br. 16/2016
... 115/2025 i 30/2026). [П]
<https://www.paragraf.rs/propisi/pravilnik_o_uslovima_i_nacinu_vodjenja_racuna_za_uplatu_javnih_prihoda_i_raspored_sredstava_sa_tih_racuna.html>

### 0.1 Структура номера счёта (Član 5)

"Broj računa za uplatu javnog prihoda sastoji se iz tri dela, odvojena
crticama":

| Часть | Значение |
|---|---|
| `840` | "trocifreni broj Uprave za trezor kod Narodne banke Srbije" |
| `KKKKKK843` (13 цифр с ведущими нулями) | шесть цифр экономической классификации (konto) из колонки 2 Prilog 1 + "trocifreni broj oznake računa za uplatu javnih prihoda - 843" |
| `YY` | "dvocifreni kontrolni broj po standardu ISO - 7064, MODUL 97" |

Пример из самого Pravilnik: `840-711111843-52` (porez na zarade).

**Важно (опровержение гипотезы из задачи):** код общины **не входит** в номер
счёта. Номер счёта одинаков для всей Сербии; община (или город/Республика)
кодируется в **pozivu na broj** (см. 0.2). В Prilog 1 колонка 7 "nivo
uplate" (`1` = на уровне общины с шифрой общины, `1/g` = на уровне города)
говорит лишь о том, на каком уровне распределяются средства. [П], Član 5 и
Član 10.

Вторичные источники ([В] uplatnica.in.rs, mojdinar.rs) пишут, что счёт для
porez na imovinu "jedinstven za svaku opštinu" — это противоречит Član 5.
На практике различается poziv na broj, а не счёт. **Рекомендация для
приложения:** брать счёт из rešenja, а не вычислять его.

Длинная форма для IPS QR / e-banking: `840` + 13 цифр + 2 цифры, например
`840000071312184357` (длинная форма для 840-713121843-57 упоминается в
"Sl. list grada Beograda" 28/2020 — источник открыть не удалось, НЕ
ПРОВЕРЕНО; по формуле сходится).

### 0.2 Poziv na broj по модели 97 (Član 11, Član 12, Prilog 2)

Član 11: "Poziv na broj odobrenja kod modela 97 sastoji se iz tri dela":

1. две цифры контрольного числа по модели 97;
2. "trocifreni broj opštine, grada, autonomne pokrajine ili Republike iz
   kolone 3 Priloga 3";
3. идентификатор, "koje može imati od jednog do 18 alfanumeričkih
   karaktera".

Итого: `97` | `KK` | `OOO` | `ID…`. Контрольное число KK считается по
MOD 97 от `OOO` + `ID`.

Član 12: для счетов, у которых в колонке 8 Prilog 1 стоит **PU** (ведёт
Poreska uprava) или **LPA** (lokalna poreska administracija), в идентификатор
вписывается "obeležje za identifikaciju obveznika (poreski identifikacioni
broj - PIB, jedinstveni matični broj građana - JMBG, broj rešenja, broj
ugovora…)". Если в колонке 8 нет ни PU, ни LPA, вместо идентификатора
плательщика ставится JB KJS органа-получателя. [П]

Полный разбор Prilog 2 по позициям (таблица в HTML не парсится чисто) —
НЕ ПРОВЕРЕНО.

**Изменение с 2025 года:** с 3 января 2025 года отменён "opšti poziv na
broj" (то есть `97` + контрольное число + только шифра территории без
идентификатора плательщика). Основание: изменения Pravilnik ("Sl. glasnik
RS", br. 55/24). Источник — уведомление государственного органа (Uprava za
šume, 05.12.2024): "Počev od 3. januara 2025. godine, prestaje mogućnost
uplate javnog prihoda sa opštim pozivom na broj odobrenja po modelu 97 sa
kontrolnim brojem i šifrom teritorije." [П, но не PURS/Trezor]
<https://upravazasume.gov.rs/wp-content/uploads/2024/12/Obavestenje-o-izmeni-strukture-poziva-na-broj-odobrenja-kod-uplate-javnih-prihoda.pdf>

Вывод для приложения: **poziv na broj для налогов не генерировать, а брать
из rešenja / образца uplatnice**. Приложение может только проверять KK по
MOD 97.

### 0.3 Šifra plaćanja (Član 7)

"U element šifra plaćanja upisuje se numerički podatak od tri cifre":
первая цифра — форма платежа (1 gotovinski, 2 bezgotovinski, 3 obračunski),
затем две цифры "osnov" из колонки 6 Prilog 1. [П]

Для большинства налоговых счетов (porez na imovinu, paušal, doprinosi по
rešenju) osnov = **53**, отсюда **253** (безналичный / e-banking) и
**153** (наличными в окошке). Значение 53 для конкретных строк Prilog 1 я
видел частично (paragraf показывает 53 у большинства строк); по строкам
711122/7213xx — НЕ ПРОВЕРЕНО построчно. [В] preduzmi.com, uplatnica.in.rs,
uis.gov.rs (для такс: "253 bezgotovinsko, 153 gotovinsko") подтверждают 253/153.

### 0.4 Šifre opština (Prilog 3 Pravilnik) [П]

Источник: <https://www.paragraf.rs/propisi/pravilnik_o_uslovima_i_nacinu_vodjenja_racuna_za_uplatu_javnih_prihoda_i_raspored_sredstava_sa_tih_racuna-4.html>
(Prilog 3; полный список — там же).

Белград:

| Община | Šifra |
|---|---|
| Barajevo | 010 |
| Čukarica | 011 |
| Grocka | 012 |
| Novi Beograd | 013 |
| Obrenovac | 014 |
| Palilula | 015 |
| Savski venac | 016 |
| Sopot | 017 |
| Stari grad | 018 |
| Voždovac | 019 |
| Vračar | 020 |
| Zemun | 021 |
| Zvezdara | 022 |
| Lazarevac | 056 |
| Mladenovac | 070 |
| Rakovica | 120 |
| Surčin | 124 |
| **Grad Beograd** | **501** |

Несколько других для примера: Ada 201, Aleksinac 002, Aranđelovac 003,
Bačka Palanka 205. Коды 2xx — Воеводина, 5xx — города.

### 0.5 Справочник счетов (Prilog 1), нужных приложению

Источник для всех строк: paragraf.rs, "Računi za uplatu javnih prihoda"
(страница датирована 24.04.2026), повторяет Prilog 1 Pravilnik. [П-вторая
рука: юридическая база, а не trezor.gov.rs]
<https://www.paragraf.rs/baza-znanja/knjigovodstvo/racuni-za-uplatu-javnih-prihoda.html>

| Счёт | Назначение (кратко, по Prilog 1) | Kol. 8 |
|---|---|---|
| 840-711122843-32 | Porez na prihode od samostalnih delatnosti koji se plaća prema paušalno utvrđenom prihodu, po rešenju Poreske uprave | PU |
| 840-721313843-74 | Doprinos za PIO za lica koja obavljaju samostalnu delatnost… po rešenju Poreske uprave | PU |
| 840-721325843-61 | Doprinos za zdravstveno osiguranje za samostalnu delatnost kao osnovno zanimanje… po rešenju Poreske uprave | PU |
| 840-721331843-06 | Doprinos za osiguranje za slučaj nezaposlenosti za samostalnu delatnost… po rešenju Poreske uprave | PU |
| 840-713121843-57 | Porez na imovinu od fizičkih lica (obveznici koji ne vode poslovne knjige) | LPA |
| 840-711171843-84 | Godišnji porez na dohodak građana | PU |
| 840-742221843-57 | Republičke administrativne takse | — |
| 840-742229843-16 | Troškovi poreskog postupka | PU |
| 840-711111843-52 | Porez na zarade (пример из Član 5) | PU |

Похожие, но **не** для паушалиста: 721323-47 (zdravstvo, samostalna
delatnost, без пометки "po rešenju") — не путать с 721325-61.

`840-4848-37` (длинно 840-0000000004848-37) — по памяти это "jedinstveni
uplatni račun" для porez i doprinosi po odbitku (PPP-PD). Контрольное
число сходится, но в первичном источнике не найдено. **НЕ ПРОВЕРЕНО.**
Паушалисты на него **не** платят.

Сверить с trezor.gov.rs напрямую не удалось (поиск не выдал страниц
trezor.gov.rs). **Открытый вопрос.**

---

## 1. Паушалист (paušalno oporezivi preduzetnik): ежемесячные платежи

### 1.1 Сколько платежей: по-прежнему четыре

Единого счёта для паушалистов нет. NALED только **предлагает** перейти на
один счёт ("umesto četiri odvojene transakcije preduzetnici bi uplaćivali
sredstva na jedan račun") — это предложение, а не действующее правило.
[В, пересказ поисковой выдачи; первичного акта о едином счёте нет]

PURS (новость от 19.01.2026): паушальная модель продлена, способ расчёта не
меняется; модель действует "najmanje do kraja 2027". [П]
<https://purs.gov.rs/en/Bureau-for-Information/News/4608477/delivery-of-tax-decisions-for-2026-to-flat-rate-entrepreneurs-has-begun.html>
и [В] <https://biznis.rs/preduzetnik/pausalcima-stizu-nova-poreska-resenja-za-2026/>

### 1.2 Пресеты

| # | Primalac (текст) | Račun | Model | Šifra | Svrha (обычная формулировка) |
|---|---|---|---|---|---|
| 1 | Republika Srbija (НЕ ПРОВЕРЕНО: точный текст печатается в образце uplatnice) | 840-711122843-32 | 97 | 253 | Porez na prihode od samostalne delatnosti za MM/GGGG |
| 2 | Republika Srbija | 840-721313843-74 | 97 | 253 | Doprinos za PIO za MM/GGGG |
| 3 | Republika Srbija | 840-721325843-61 | 97 | 253 | Doprinos za zdravstveno osiguranje za MM/GGGG |
| 4 | Republika Srbija | 840-721331843-06 | 97 | 253 | Doprinos za osiguranje za slučaj nezaposlenosti za MM/GGGG |

- Счета: [П] Prilog 1 (см. 0.5), актуально на 24.04.2026. Совпадают с [В]
  <https://preduzmi.com/rs/articles/tax-payments> (обновлено в августе 2026).
- Šifra 253 / 153: см. 0.3.
- Svrha: формулировка свободная. Предложенный вариант — [В] preduzmi.com
  ("Porez na prihode od sam. delatnosti za [mesec] [godina]"). Обязательного
  текста в Pravilnik нет.
- Платёж от имени: имя предпринимателя и адрес (как в регистре APR) — общая
  практика, НЕ ПРОВЕРЕНО по первичному источнику.

### 1.3 Poziv na broj: BOP

- PURS: месячные авансы за год платятся "sa pozivom na broj" со **BOP
  (broj odobrenja za plaćanje)**, который присваивается на каждый год. На
  2026 год выдан новый BOP. [П] PURS 19.01.2026 (ссылка выше).
- Вместе с rešenjem в ePorezi кладутся "primeri popunjenih uplatnica sa QR
  kodom". [П] PURS 19.01.2026.
- Внутренняя структура BOP: в первичных источниках **не найдена.** По
  Član 11/12 это должно быть `97` + KK + шифра территории (3) + идентификатор
  (до 18 знаков). Вторичные источники противоречат друг другу: одни пишут,
  что внутри есть PIB, другие — что PIB использовать нельзя. **НЕ ПРОВЕРЕНО.**
  Для приложения: пользователь вводит BOP целиком из образца uplatnice,
  приложение проверяет KK по MOD 97. Поле поменяется в январе.
- Скорее всего, один и тот же BOP указывается на всех четырёх платежах
  (так в образцах). **НЕ ПРОВЕРЕНО.**

### 1.4 Срок

- До **15-го числа следующего месяца**. Если 15-е — выходной или праздник,
  срок переносится на следующий рабочий день. PURS: первый аванс за январь
  2026 — до 18.02.2026, "zbog praznika" (обычный срок 15.02). [П] PURS
  19.01.2026. Для 2024 года: 19.02.2024. [В] biznis.rs
  <https://biznis.rs/vesti/srbija/pausalcima-stizu-nova-poreska-resenja-za-2024-godinu/>
- Правовое основание (ZPPPA / ZPDG, номер статьи) — НЕ ПРОВЕРЕНО по тексту
  закона; [В] preduzmi.com ссылается на ZPDG čl. 110.
- Рекомендация для приложения: дедлайн = 15-е число месяца M+1 с переносом
  на следующий рабочий день (нужен календарь праздников РС).

### 1.5 Суммы

- Суммы налога и каждого взноса стоят в **rešenju** Poreske uprave, которое
  выдаётся ежегодно в конце января в "poresko sanduče" портала **ePorezi**
  (<https://eporezi.purs.gov.rs/>). Решение считается врученным в день
  размещения. [П] PURS 19.01.2026.
- Суммы меняются **каждый год** (средняя зарплата в общине, вид
  деятельности, место регистрации, возраст). [В] biznis.rs 2026.
- До получения нового решения январские данные взять неоткуда, поэтому
  шаблон приложения в январе должен требовать обновить суммы и BOP.

---

## 2. Porez na imovinu (физические лица)

### 2.1 Счёт и реквизиты

| Поле | Значение | Источник |
|---|---|---|
| Račun | `840-713121843-57` (одинаков по всей стране, см. 0.1) | [П] Prilog 1, paragraf 24.04.2026 |
| Model | 97 | [П] Član 11 |
| Poziv na broj | `KK` + шифра общины (3) + идентификатор из rešenja | [П] Član 11/12; конкретный идентификатор — см. 2.3 |
| Šifra plaćanja | 253 (e-banking) / 153 (окошко) | [П] Član 7 + osnov 53 (см. 0.3) |
| Primalac | в Белграде: Gradska uprava Grada Beograda — Sekretarijat za javne prihode | [В] uplatnica.in.rs; точный текст — НЕ ПРОВЕРЕНО |

### 2.2 Сроки (закон) [П]

Zakon o porezima na imovinu ("Sl. glasnik RS", br. 26/2001 … 92/2023 i
94/2024), **Član 39 st. 1**: "Porez na imovinu obveznik koji ne vodi poslovne
knjige plaća tromesečno, … u roku od 45 dana od dana početka tromesečja, na
propisani uplatni račun javnih prihoda."
<https://www.paragraf.rs/propisi/zakon_o_porezima_na_imovinu.html>

45 дней от начала квартала:

| Квартал | Начало | Срок (45-й день) |
|---|---|---|
| I | 1 янв | **14 фев** |
| II | 1 апр | **15 мая** |
| III | 1 июл | **14 авг** |
| IV | 1 окт | **14 ноя** |

Обычно пишут "15 фев / 15 мая / 15 авг / 15 ноя" — это **неточно** для
I, III и IV кварталов. Если день нерабочий, срок переносится. Пример: IV
квартал 2026 — "do 16. novembra" (14.11.2026 — суббота). [В-новость со
ссылкой на Sekretarijat za javne prihode] <https://www.danubeogradu.rs/2026/11/uplata-cetvrtog-kvartala-poreza-na-imovinu-do-16-novembra-2026/>
(09.11.2026).

Прочее из Član 39:

- st. 2: до получения rešenja за текущий год платится аванс в размере
  последнего квартала прошлого года;
- st. 3: разница по rešenju доплачивается в течение 15 дней после его
  вручения;
- st. 10: можно платить меньшим числом частей, в том числе сразу всю
  сумму.

### 2.3 Белград: как формируется poziv na broj

- Налог платится в бюджет **по месту нахождения недвижимости**; в Белграде
  его администрирует Sekretarijat za javne prihode Grada Beograda (Trg Nikole
  Pašića 6, 011 3216497). [П] <https://www.beograd.rs/lat/gradska-uprava/a88215/sekretarijat-za-javne-prihode.html>
  (27.11.2024)
- Rešenje за 2026 год с "pratećom instrukcijom za plaćanje (uplatnica)"
  можно получить в Pošta Srbije (с 12.05.2026). [П] <https://www.beograd.rs/lat/beoinfo-vesti/a113695/Kopija-resenja-o-porezu-na-salterima-Poste.html>
- Состояние долга: портал LPA (<https://lpa.gov.rs>), вход через eID. [П]
  страница Sekretarijat (выше).
- **Структура poziva na broj в Белграде: НЕ ПРОВЕРЕНО.** Известно:
  - по Pravilnik: `97 KK OOO ID`;
  - выдача поиска по "Sl. list grada Beograda" 28/2020 (документ открыть не
    удалось): идентификатор = "PIB obveznika i dvocifreni broj godine" (для
    физлица PIB = JMBG, плюс две цифры года rešenja) — **НЕ ПРОВЕРЕНО**;
  - [В] uplatnica.in.rs: poziv na broj "menja se iz rate u ratu" —
    противоречит предыдущему пункту, **НЕ ПРОВЕРЕНО**.
- **Какую шифру общины ставить в Белграде** — код городской общины по месту
  недвижимости (например, 013 Novi Beograd) или 501 Grad Beograd —
  первичным источником **не подтверждено**. Для приложения: брать poziv na
  broj из rešenja целиком; при ручном вводе предупреждать, что шифра
  общины — 3 цифры после KK, и показывать название общины по таблице 0.4
  (подсказка, а не проверка).
- QR-код на белградском rešenju: в первичных источниках не упоминается.
  **НЕ ПРОВЕРЕНО.**

---

## 3. Другие налоги и сборы физлиц (обзор, низкий приоритет)

| Платёж | Счёт | Poziv na broj | Источник |
|---|---|---|---|
| Godišnji porez na dohodak građana (по годовой декларации PP GPDG) | 840-711171843-84 | 97 + из rešenja / ePorezi (PU) | [П] Prilog 1 via paragraf; poziv — НЕ ПРОВЕРЕНО |
| Republičke administrativne takse | 840-742221843-57 | 97 + KK + шифра общины + идентификатор/JB KJS органа (с 2025 — по таблице органа) | [П] Prilog 1; структура — Član 11/12 |
| Takse за услуги Poreske uprave (uverenja, žalbe) | 840-742221843-57 (НЕ ПРОВЕРЕНО) | единый poziv na broj `1302110522` | [В] knjigovodstvoonline.rs, unija.com — **НЕ ПРОВЕРЕНО** |
| Troškovi poreskog postupka | 840-742229843-16 | PU | [П] Prilog 1 |

Общее правило после 03.01.2025: у каждого органа свой "Pregled poziva na
broj odobrenja" для такс. Пример — Uprava za šume: юрлица `97` + KK + шифра
общины + PIB; физлица — poziv na broj из колонки 4 таблицы органа. [П]
(ссылка в 0.2). Для приложения таксы лучше не делать пресетами, а давать
поле "poziv na broj из инструкции органа".

---

## 4. Коммунальные счета

Не выдумывал ни одного счёта. Ниже только то, что опубликовали сами
компании.

### 4.1 Infostan (JKP Infostan tehnologije, Белград, objedinjena naplata)

- Поля на uplatnice/счёте (официальное "Objašnjenje računa"): "Broj tekućeg
  računa sistema objedinjene naplate za uplatu"; "Model poziva na broj i poziv
  na broj (obavezno navođenje pri svim vrstama plaćanja)"; "**QR kod za
  plaćanje tekućeg zaduženja**"; "Broj računa, datumi isporuke, izdavanja i
  dospeća". [П] <https://infostan.rs/%D0%BE%D0%B1%D1%98%D0%B0%D1%88%D1%9A%D0%B5%D1%9A%D0%B5_%D1%80%D0%B0%D1%87%D1%83%D0%BD%D0%B0/>
- Срок: uplatnica за прошлый месяц рассылается в начале месяца; оплата "do
  kraja tekućeg meseca za prethodni mesec"; скидка 5% при оплате до "roka
  dospeća za popust" (дата напечатана на uplatnice). [П] <https://infostan.rs/placanje-racuna/?pismo=lat>.
  Пример переноса: скидку за январский счёт 2026 продлили до 18.02.2026. [П]
- Номер счёта получателя на сайте **не опубликован** — брать с uplatnice.
  **Открытый вопрос.**
- Модель: [В] ipsuplatnica.com — model 97, poziv = KK + 7-значный "broj
  Infostan" (правый верхний угол, постоянный), šifra 221, primalac "JKP
  INFOSTAN TEHNOLOGIJE BEOGRAD". Другой [В] источник пишет о model 11.
  **НЕ ПРОВЕРЕНО** — брать с uplatnice / из QR.
- Для приложения: лучший путь — распознать IPS QR со счёта; poziv na broj
  постоянный, меняется только сумма.

### 4.2 EPS (Elektroprivreda Srbije, snabdevanje)

- **Срок:** "Rok dospeća računa je 28. u mesecu za prethodni mesec (primer:
  račun za februar mesec dospeva do 28. marta tekuće godine)." [П]
  <https://www.eps.rs/lat/snabdevanje/Stranice/pitanja-odgovori.aspx>.
  На счёте — "Datum dospeća računa na naplatu (valuta)". [П] <https://www.eps.rs/lat/snabdevanje/Stranice/objasnjenje-racuna-ks.aspx>
- **QR:** "Račune za električnu energiju možete platiti … očitavanjem QR koda
  koji se nalazi na računu." Также IPS Skeniraj и карты на portal.eps.rs. [П]
  <https://www.eps.rs/lat/snabdevanje/Stranice/kako-platiti-racun.aspx>
- **Счёт для Белграда (гарантированное снабжение, домохозяйства и мелкие
  потребители):** новый текущий счёт **200-75409-96** (длинная форма
  200-0000000075409-96, KK сходится) — "počev od oktobarskog računa"; старый
  долг платить на новый счёт со **старым** pozivom na broj. Нови-Сад, Ниш,
  Кралево, Крагуевац платят по-прежнему. [П] новость EPS 31.10.2026
  <https://www.eps.rs/lat/vesti/Stranice/nov-racun.aspx>.
  Важно: если в приложении был сохранён старый белградский счёт EPS, его
  нужно обновить.
- Model и poziv na broj: на сайте EPS не описаны. По реальному счёту
  (real-bills.md): model 97, poziv = KK + наплатни број, дополненный
  нулём до 11 цифр, + YYMM расчётного периода. Версия ipsuplatnica.com
  (ED-broj или šifra kupca) не подтвердилась.

### 4.3 Telekom Srbija (mts)

- IPS QR на счетах есть: новость от 05.08.2020 — QR "od sada je na
  raspolaganju i svim mts poslovnim korisnicima" ("и всем бизнес-клиентам",
  то есть частным — раньше). [П]
  <https://mts.rs/Poslovni/Korisnicka-zona/Vesti/a89670-Platite-racun-sigurno-i-lako-putem-IPS-QR-koda.html>
- На первой странице: данные клиента (в т.ч. "jedinstvena šifra korisnika"),
  сумма и "informacije za realizaciju uplate". Šifra korisnika — в левом
  верхнем углу (используется и для оплаты через SMS на 8686). [П] mts.rs FAQ
  <https://mts.rs/Privatni/Korisnicka-zona/Cesta-pitanja/mts-racun>
- Номер счёта, модель, структура poziva na broj, срок оплаты: **на сайте
  не опубликованы, НЕ ПРОВЕРЕНО.** Срок — "datum definisan za plaćanje
  računa" на самом счёте (жалобу можно подать в течение 30 дней после этой
  даты). [П]

---

## 5. Выводы для модели данных приложения

1. Счёт публичного дохода = `840-{konto6}843-{KK}`. Можно хранить
   справочник konto → название и проверять KK. Община в счёт **не** входит.
2. Poziv na broj (модель 97) = `KK` + `OOO` (шифра общины по Prilog 3) +
   идентификатор. Пресеты должны хранить его как пользовательское значение
   из rešenja и только валидировать KK. Генерировать "общий" poziv (только
   шифра территории) нельзя с 03.01.2025.
3. Пресет "Paušal" = 4 платежа, общий BOP, суммы на год, срок 15-е M+1 с
   переносом, ежегодный сброс в январе.
4. Пресет "Porez na imovinu" = 4 квартальных платежа, сроки 14.02 / 15.05 /
   14.08 / 14.11 (с переносом), счёт 840-713121843-57, poziv из rešenja.
5. Коммунальные: основной путь — импорт из IPS QR со счёта. Сроки по
   умолчанию: Infostan — конец месяца (скидка — до даты на uplatnice), EPS —
   28-е, mts — дата со счёта.

## Открытые вопросы

- Внутренняя структура BOP паушалиста (входит ли PIB, какая шифра
  территории) — нужен реальный образец uplatnice из ePorezi.
- Белград, porez na imovinu: шифра городской общины или 501, и что именно
  стоит в идентификаторе (JMBG + год?). Нужен образец rešenja / uplatnice.
- Сверка Prilog 1 с trezor.gov.rs и содержание изменений 115/2025 и
  30/2026.
- Номер счёта и модель Infostan; реквизиты mts.
- Счёт 840-4848-37 (PPP-PD) — подтвердить или удалить.
