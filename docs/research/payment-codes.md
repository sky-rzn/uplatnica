# Šifre plaćanja (коды платежа) — исследование

Дата исследования: 2026-11-13.

## 0. Источник и актуальность

Старая «Odluka o obliku, sadržini i načinu korišćenja jedinstvenih instrumenata platnog prometa» (Sl. glasnik RS 57/2004, 82/2004, 98/2013) **утратила силу**. Действующий акт:

**Odluka o obliku, sadržini i načinu korišćenja obrazaca platnih naloga za izvršenje platnih transakcija u dinarima**
("Sl. glasnik RS", br. 55/2015, 78/2015, 82/2017, 65/2018, 78/2018, 22/2019, 125/2020 i 82/2024).

Коды платежа — это **Prilog 3** этого решения. Пункт 8 решения (дословно):

> Šifre plaćanja iz tačke 3. odredba pod 7), tačke 4. odredba pod 7) i tačke 5. odredba pod 9) ove odluke utvrđene su u Prilogu 3, koji je odštampan uz ovu odluku i njen je sastavni deo. Šifre plaćanja propisuje Narodna banka Srbije na predlog ministarstva nadležnog za poslove finansija.

Версия списка:
- Последняя поправка — Sl. glasnik RS **82/2024**. На странице NBS «Propisi iz oblasti platnih usluga i platnih sistema» решение отмечено «NOVO» и перечислены те же номера, последний — 82/2024 (проверено 2026-11-13).
- Файл Prilog 3 на nbs.rs (`..._2019_p_p3.doc`) в метаданных датирован 15.10.2024, т.е. соответствует редакции 82/2024. Кириллический текст NBS и латинский консолидированный текст Paragraf совпадают по набору кодов.
- Точная дата публикации и вступления в силу 82/2024 и что именно она изменила в Prilog 3 — **НЕ ПРОВЕРЕНО** (судя по neobilten.com, около 11.10.2024).
- Поиск поправок за 2025–2026 годы ничего не нашёл; страница NBS тоже их не показывает.

Источники (первичные):
- NBS, список нормативных актов: https://www.nbs.rs/sr/drugi-nivo-navigacije/propisi/propisi-ps/
- NBS, Prilog 3 (кириллица, .doc): https://www.nbs.rs/export/sites/NBS_site/documents/propisi/propisi-ps/obrasci_platnih_naloga_u_dinarima_2019_p_p3.doc
- NBS, консолидированный текст решения (PDF): https://www.nbs.rs/export/sites/NBS_site/documents/propisi/propisi-ps/obrasci_platnih_naloga_u_dinarima_2019_p.pdf
- Paragraf, консолидированный текст (латиница, с 82/2024): https://www.paragraf.rs/propisi_download/odluka_o_obliku_sadrzini_i_nacinu_koriscenja_obrazaca_platnih_naloga_za_izvrsenje_platnih_transakcija_u_dinarima.pdf

Сербский текст ниже дословно взят из латинской редакции Paragraf. В оригинале NBS в названиях стоит тире «–» («Promet robe i usluga – finalna potrošnja»), у Paragraf — дефис «-». В JSON оставлен дефис (ASCII).

## 1. Структура трёхзначного кода

Prilog 2, т. 6 (дословно):

> U element šifra plaćanja upisuje se numerički podatak od tri cifre koje su date u Prilogu 3, i to tako što se najpre unosi cifra klasifikacije prema obliku plaćanja, a zatim dve cifre klasifikacije prema osnovu plaćanja.

Т.е. код = 1 цифра формы платежа + 2 цифры основания платежа (например, `2` + `89` = `289`).

### Klasifikacija prema obliku plaćanja (первая цифра)

| Šifra | Oblik plaćanja | Opis (дословно) | Перевод |
|---|---|---|---|
| 1 | Gotovinski | Gotovinske uplate na tekući račun i isplate s tekućeg računa | Наличные: внесение на текущий счёт и снятие с него |
| 2 | Bezgotovinski | Prenos (plaćanje i drugi transferi) s jednog tekućeg računa na drugi tekući račun | Безналичные: перевод с одного текущего счёта на другой |
| 3 | Obračunski | Obračunska plaćanja | Расчётные (клиринговые/зачётные) платежи |
| 9 | Preknjižavanje | Povraćaj po osnovu više uplaćenih ili pogrešno uplaćenih sredstava | Перепроводка: возврат излишне или ошибочно уплаченного |

По инструкции Poreska uprava (табл. 2), код 3 применяется при асигнации/цессии, а код 9 «користи само Министарство финансија Управа за трезор»: https://purs.gov.rs/upload/media/2025/2/4/612651/SifreplacanjaiobaveznostupisaBOP-v4.pdf

## 2. Klasifikacija prema osnovu plaćanja (две последние цифры)

Колонка «Opis» дословно. Пустая ячейка — в оригинале описания нет. Кодов 32–39, 43, 50–52, 55, 56, 59, 67–69, 74 и выше 90 в списке **нет**.

### Transakcije po osnovu prometa robe i usluga

| Код | Osnov plaćanja | Opis | RU |
|---|---|---|---|
| 20 | Promet robe i usluga - međufazna potrošnja | Plaćanja za robu, sirovine, materijal, proizvodne usluge, gorivo, mazivo, energiju, otkup poljoprivrednih proizvoda, članarine, uplate obaveza javnim preduzećima koje nisu propisane, kao i za drugu robu i usluge | Товары и услуги — промежуточное потребление (B2B) |
| 21 | Promet robe i usluga - finalna potrošnja | Plaćanja za robu, sirovine, materijal, proizvodne usluge, gorivo, mazivo, energiju, otkup poljoprivrednih proizvoda, članarine, uplate obaveza javnim preduzećima koje nisu propisane, kao i za drugu robu i usluge (uključujući i plaćanje svih provizija i naknada), izuzev za investicije - finalna potrošnja | Товары и услуги — конечное потребление |
| 22 | Usluge javnih preduzeća | Uplate propisanih obaveza javnim preduzećima | Услуги государственных/коммунальных предприятий (установленные обязательства) |
| 23 | Investicije u objekte i opremu | Plaćanja po osnovu izgradnje objekata i nabavke opreme (nabavna cena, doprema, montaža i dr.) | Инвестиции в объекты и оборудование |
| 24 | Investicije - ostalo | Plaćanja po osnovu investicija, osim investicija u objekte i opremu | Инвестиции — прочее |
| 25 | Zakupnine stvari u javnoj svojini | Zakupnine za korišćenje nepokretnosti i pokretnih stvari u javnoj svojini, naknade za druge usluge koje imaju karakter javnih prihoda | Аренда публичного имущества |
| 26 | Zakupnine | Zakupnine za korišćenje nepokretnosti i pokretnih stvari na koje se plaća porez prema zakonu | Аренда (облагаемая налогом) |
| 27 | Subvencije, regresi i premije s posebnih računa | Isplata, naplata, prenos i obračun po osnovu subvencija, regresa i premija s konsolidovanog računa trezora, odnosno fondova i organizacija obaveznog socijalnog osiguranja | Субсидии и премии с особых счетов казначейства/фондов |
| 28 | Subvencije, regresi i premije sa ostalih računa | Isplata, naplata, prenos i obračun po osnovu subvencija, regresa i premija sa ostalih računa | Субсидии и премии с прочих счетов |
| 29 | Digitalna imovina | Plaćanja po osnovu transakcija s virtuelnim valutama, digitalnim tokenima i digitalnom imovinom koja ima odlike finansijskih instrumenata (uključujući i plaćanje svih provizija, naknada i drugih troškova po osnovu tih transakcija) | Цифровые активы |
| 30 | Promet nepokretnosti | Plaćanja po osnovu prometa zemljišta (poljoprivredno i građevinsko zemljište, šume i šumsko zemljište), zgrada (poslovne, stambene, stambeno-poslovne, ekonomske i dr.) i drugih građevinskih objekata, kao i posebnih delova zgrada (stanovi, poslovne prostorije, garaže i garažna mesta) na kojima može postojati zasebno pravo svojine | Сделки с недвижимостью |
| 31 | Carine i druge uvozne dažbine | Uplata, naplata, prenos i obračun po osnovu izmirenja carina i drugih uvoznih dažbina (carine i drugi javni prihodi koje Uprava carina naplati objedinjeno na svoj evidentni račun) | Таможенные пошлины и импортные сборы |

### Transakcije raspodele

| Код | Osnov plaćanja | Opis | RU |
|---|---|---|---|
| 40 | Zarade i druga primanja zaposlenih | Zarada; lična zarada preduzetnika; razlika zarade lica postavljenih na javnu funkciju za vreme obavljanja te funkcije; ugovorena naknada za privremene i povremene poslove, kao i oporeziva primanja zaposlenih po osnovu: naknade troškova prevoza u javnom saobraćaju, dnevnice i naknade troškova prevoza i smeštaja za službeno putovanje u zemlji ili inostranstvu, dnevne naknade pripadnika Vojske Srbije, solidarne pomoći za slučaj bolesti, rehabilitacije ili invalidnosti zaposlenog ili člana njegove porodice, novogodišnjih i božićnih poklona deci zaposlenog i jubilarne nagrade zaposlenog | Зарплаты и прочие облагаемые выплаты работникам |
| 41 | Neoporeziva primanja zaposlenih, socijalna i druga davanja izuzeta od oporezivanja | Neoporeziva primanja zaposlenih po osnovu: naknade troškova prevoza u javnom saobraćaju, dnevnice i naknade troškova prevoza i smeštaja za službeno putovanje u zemlji ili inostranstvu, dnevne naknade pripadnika Vojske Srbije, solidarne pomoći za slučaj bolesti, rehabilitacije ili invalidnosti zaposlenog ili člana njegove porodice, novogodišnjih i božićnih poklona deci zaposlenog i jubilarne nagrade zaposlenog; socijalna i druga davanja izuzeta iz oporezivanja u skladu sa zakonom kojim se uređuje porez na dohodak građana, izuzev naknade troškova volontiranja; | Необлагаемые выплаты работникам, соцвыплаты |
| 42 | Naknade zarada na teret poslodavca | Naknada zarade zbog privremene sprečenosti za rad zbog povrede na radu ili profesionalne bolesti, a koja za sve vreme trajanja sprečenosti tereti sredstva poslodavca; naknada zarade za slučaj privremene sprečenosti za rad do 30 dana usled bolesti ili povrede van rada, zbog bolesti ili komplikacija u vezi sa održavanjem trudnoće, zbog propisane mere obavezne izolacije, zbog nege bolesnog člana uže porodice, izuzev deteta mlađeg od tri godine, zbog određivanja za pratioca bolesnog lica u skladu sa zakonom kojim se uređuje zdravstveno osiguranje; naknada zarade za vreme plaćenog odsustva za vreme prekida rada, odnosno smanjenja obima rada do kog je došlo bez krivice zaposlenog prema članu 116. Zakona o radu | Больничные и т.п. за счёт работодателя |
| 44 | Isplate preko omladinskih i studentskih zadruga | Isplata članovima zadruge s računa zadruge | Выплаты через молодёжные/студенческие кооперативы |
| 45 | Penzije | Iznos penzija koji se isplaćuje penzionerima ili prenosi na njihove tekuće račune u banci, osim isplata u gotovom novcu | Пенсии |
| 46 | Obustave od penzija i zarada | Obustave po osnovu administrativne zabrane za kredite, članarine i ostale zakonske, administrativne i druge obustave | Удержания из пенсий и зарплат |
| 47 | Naknade zarada na teret drugih isplatilaca | Naknada zarade za bolovanje preko 30 dana za slučaj privremene sprečenosti za rad preko 30 dana, zbog bolesti ili povreda van rada, bolesti ili komplikacija u vezi sa održavanjem trudnoće, propisane mere obavezne izolacije, nege bolesnog člana uže porodice, izuzev deteta mlađeg od tri godine, kao i zbog određivanja za pratioca bolesnog lica; naknada zarade za bolovanje preko 30 dana za slučaj privremene sprečenosti za rad zbog davanja tkiva i organa i zbog nege bolesnog deteta do 3 godine; naknada zarade za vreme porodiljskog odsustva, odsustva s rada radi nege deteta i odsustva s rada radi posebne nege deteta | Больничные свыше 30 дней, декретные (за счёт других плательщиков) |
| 48 | Prihodi fizičkih lica od kapitala i drugih imovinskih prava | Kamata, dividenda i učešće u dobiti, prinos od investicione jedinice otvorenog investicionog fonda, prihod od izdavanja nepokretnosti i pokretnih stvari, prihod od imovinskog prava nad autorskim delom, odnosno od prava industrijske svojine, prihodi od osiguranja | Доходы физлиц от капитала и имущественных прав |
| 49 | Ostali prihodi fizičkih lica | Prihod od ugovorene naknade za stvaranje autorskog dela, prihod sportista i sportskih stručnjaka, prihod od ugovora o delu i drugi prihodi fizičkih lica nepomenuti u šiframa od 40 do 48 | Прочие доходы физлиц |
| 53 | Uplata javnih prihoda izuzev poreza i doprinosa po odbitku | Uplata javnih prihoda, i to poreza, izuzev poreza po odbitku, taksi, naknada i dr. | Уплата налогов, пошлин, сборов (кроме удерживаемых у источника) |
| 54 | Uplata poreza i doprinosa po odbitku | Uplata poreza i doprinosa koje je isplatilac prihoda dužan da obračuna, obustavi i uplati na propisani jedinstveni uplatni račun najkasnije na dan isplate prihoda fizičkom licu po odbitku | Налоги и взносы, удерживаемые у источника выплаты |
| 57 | Povraćaj više naplaćenih ili pogrešno naplaćenih tekućih prihoda | Prenos sredstava sa uplatnog računa tekućeg prihoda u korist poreskog obveznika na ime više naplaćenih ili pogrešno naplaćenih tekućih prihoda | Возврат излишне/ошибочно взысканного |
| 58 | Preknjižavanje više uplaćenih ili pogrešno uplaćenih tekućih prihoda | Prenos sredstava s jednog uplatnog računa tekućeg prihoda u korist drugog, a na ime više uplaćenih ili pogrešno uplaćenih tekućih prihoda | Перенос излишне/ошибочно уплаченного на другой счёт |

### Transferi

| Код | Osnov plaćanja | Opis | RU |
|---|---|---|---|
| 60 | Premije osiguranja i nadoknada štete | Premija osiguranja, reosiguranje, nadoknada štete | Страховые премии, возмещение ущерба |
| 61 | Raspored tekućih prihoda | Raspored poreza, doprinosa i drugih tekućih prihoda uplaćenih korisnicima | Распределение налоговых и др. доходов |
| 62 | Transferi u okviru državnih organa | Prenos u okviru računa i podračuna trezora, prenos sredstava budžetskim korisnicima, isplate po socijalnom programu Vlade | Трансферы внутри госорганов |
| 63 | Ostali transferi | Prenos u okviru istog pravnog lica i drugi transferi, raspored zajedničkog prihoda | Прочие трансферы |
| 64 | Prenos sredstava iz budžeta za obezbeđenje povraćaja više naplaćenih tekućih prihoda | Prenos sredstava iz budžeta na uplatni račun tekućeg prihoda s kog je potrebno izvršiti povraćaj sredstava obvezniku | Перевод из бюджета для возврата переплаты |
| 65 | Uplata pazara | Uplata dnevnog pazara | Сдача дневной выручки |
| 66 | Isplata gotovine | Sve gotovinske isplate s računa pravnog lica i preduzetnika | Выдача наличных со счёта юрлица/ИП |

### Finansijske transakcije

| Код | Osnov plaćanja | Opis | RU |
|---|---|---|---|
| 70 | Kratkoročni krediti | Prenos sredstava po osnovu odobrenih kratkoročnih kredita | Краткосрочные кредиты |
| 71 | Dugoročni krediti | Prenos sredstava po osnovu odobrenih dugoročnih kredita | Долгосрочные кредиты |
| 72 | Aktivna kamata | Plaćanje kamate po kreditima | Проценты по кредитам |
| 73 | Polaganje oročenih depozita | | Размещение срочных депозитов |
| 75 | Ostali plasmani | Kupoprodaja vlasničkih hartija od vrednosti, kupovina kapitala u postupku privatizacije u smislu zakona kojim se uređuje privatizacija i kupovina udela iz Akcionarskog fonda Republike Srbije, međubankarski plasmani (hartije od vrednosti, krediti) | Прочие размещения (акции, приватизация, межбанк) |
| 76 | Otplata kratkoročnih kredita | | Погашение краткосрочных кредитов |
| 77 | Otplata dugoročnih kredita | | Погашение долгосрочных кредитов |
| 78 | Povraćaj oročenih depozita | | Возврат срочных депозитов |
| 79 | Pasivna kamata | Plaćanje kamate po depozitima i drugim novčanim polozima | Проценты по депозитам |
| 80 | Eskont hartija od vrednosti | | Учёт ценных бумаг |
| 81 | Pozajmice osnivača za likvidnost | Uplata pozajmice osnivača - fizičkog lica pravnom licu | Заём учредителя-физлица компании |
| 82 | Povraćaj pozajmice za likvidnost osnivaču | Povraćaj pozajmice pravnog lica osnivaču - fizičkom licu | Возврат займа учредителю |
| 83 | Naplata čekova građana | | Инкассо чеков граждан |
| 84 | Platne kartice | | Платёжные карты |
| 85 | Menjački poslovi | | Обменные операции |
| 86 | Kupoprodaja deviza | | Купля-продажа валюты |
| 87 | Donacije i sponzorstva | Plaćanja iz sredstava banaka i drugih pravnih lica po osnovu interne regulative | Пожертвования и спонсорство (банки/юрлица) |
| 88 | Donacije | Donacije iz međunarodnih ugovora | Пожертвования по международным договорам |
| 89 | Transakcije po nalogu građana | | Операции по поручению граждан |
| 90 | Druge transakcije | | Прочие операции |

Машиночитаемая версия (только код + название): `docs/research/payment-codes.json`.

## 3. Что обычно используют физлица

### Первая цифра: онлайн против наличных

- **Онлайн/мобильный банкинг, перевод со счёта → `2`** (bezgotovinski: перевод с одного текущего счёта на другой).
- **Наличные на почте/в банке по nalog za uplatu → `1`** (gotovinski: «gotovinske uplate na tekući račun»).
- `3` и `9` физлицо на обычной uplatnica не использует (см. табл. 2 инструкции PURS выше).

### IPS QR, тег `SF`

NBS, «Preporuke — validacija» (https://ips.nbs.rs/PDF/pdfPreporukeValidacijaLat.pdf), дословно:

> 14) „SF" – šifra plaćanja (obavezan), označava numerički podatak od tri cifre.
>
> prva cifra može biti 1 ili 2 (189-gotovinsko ili 289-bezgotovinsko plaćanje);
>
> šifra plaćanja 189 ili 289 propisana je samo za transakcije po nalogu građana. Ako su korisnici usluge pravna lica ili preduzetnici mora se uneti druga šifra plaćanja; da nije unet razmak pa zatim dve cifre;
>
> da sadržaj taga nije razdvojen novom linijom;

> Najčešće korišćene šifre plaćanja u NBS IPS QR kôdovima bez obzira da li su korisnici usluge građani/pravna lica/preduzetnici:
> 121 ili 221 – Promet robe i usluga – finalna potrošnja
> 122 ili 222 – Usluge javnih preduzeća

Та же формулировка есть в https://ips.nbs.rs/PDF/pdfPreporukeNovoLat.pdf (поле «ŠIFRA PLAĆANJA»). Пример NBS для генератора/валидатора: `K:PR|...|N:JP EPS BEOGRAD...|SF:189|S:UPLATA PO RAČUNU ZA EL. ENERGIJU|RO:97...` (https://ips.nbs.rs/PDF/Smernice_Generator_Validator_latinica.pdf).

Для приложения это значит: в `SF` ровно 3 цифры, без пробела и переноса строки, первая цифра 1 или 2.

### Типичные коды по видам платежей

| Платёж | Обычный код (онлайн / наличные) | Статус |
|---|---|---|
| Коммунальные услуги: Infostan, EPS (электричество), вода | 289 / 189 (поручение гражданина); на счёте-квитанции поставщика часто стоят 221/121 или 222/122 | Пример NBS с EPS использует `189`. Конкретные коды на текущих квитанциях Infostan/EPS — **НЕ ПРОВЕРЕНО**. Неофициально (biznis.rs) банки фиксируют такие платежи под 121, «a neretko i 189»: https://biznis.rs/novac/pogresna-sifra-placanja-moze-da-iskomplikuje-procese-uplate-i-isplate/ |
| Телеком (мобильная связь, интернет, ТВ) | 289 / 189 или 221 / 121 | **НЕ ПРОВЕРЕНО** по первичному источнику; выведено из описаний кодов 21 и 89 |
| Налог на имущество (porez na imovinu, местная налоговая администрация) | 253 / 153 | По тексту Prilog 3 код 53 охватывает «Uplata javnih prihoda, i to poreza, izuzev poreza po odbitku, taksi, naknada». Конкретная инструкция ЛПА со «253» — **НЕ ПРОВЕРЕНО** |
| Налог и взносы паушального ИП (по rešenju Poreske uprave) | 253 / 153 | Паушальный налог и взносы платятся по решению, а не «po odbitku», поэтому по тексту Prilog 3 подходит 53, а не 54. Прямое подтверждение «253» от PURS для паушалистов — **НЕ ПРОВЕРЕНО** |
| Административные сборы (takse) | 253 / 153 | В документе на uis.gov.rs (государственный сайт, но не NBS/PURS) — 253 безналично и 153 наличными: https://www.uis.gov.rs/static/uploads/3029_2633_Uplatni_racuni_za_republicke_administrativne_takse_i_naknade_za_igre_na_srecu-dodato_13.02.pdf (частично **НЕ ПРОВЕРЕНО**: найдено поиском, PDF не открывался) |
| Налоги/взносы по odbitku (работодатель за работника, ППП-ПД) | 254 | Prilog 3 + инструкция PURS (для кодов 40–54 нужен BOP в pozivu na broj) |

Примечания:
- Коды 189/289 — универсальные «по поручению гражданина», если получатель не указал ничего другого. NBS прямо запрещает их для юрлиц и предпринимателей, так что **паушальный ИП, который платит со своего предпринимательского счёта, не может использовать 189/289**.
- Правило NBS: «Primaoci plaćanja koriste šifre plaćanja u zavisnosti od osnova po kojem naplaćuju obavezu». Если на квитанции или в QR от получателя указан код, его и надо использовать.
- Публичные доходы (налоги, взносы, сборы) платятся по модели 97 в pozivu na broj; структура с 03.01.2025 обновлена Управой за трезор: https://www.trezor.gov.rs/sr/news/2025_01_15/ (к кодам платежа отношения не имеет, указано для контекста).

## 4. Сводка источников

Первичные:
- https://www.nbs.rs/sr/drugi-nivo-navigacije/propisi/propisi-ps/
- https://www.nbs.rs/export/sites/NBS_site/documents/propisi/propisi-ps/obrasci_platnih_naloga_u_dinarima_2019_p_p3.doc
- https://www.nbs.rs/export/sites/NBS_site/documents/propisi/propisi-ps/obrasci_platnih_naloga_u_dinarima_2019_p.pdf
- https://www.paragraf.rs/propisi_download/odluka_o_obliku_sadrzini_i_nacinu_koriscenja_obrazaca_platnih_naloga_za_izvrsenje_platnih_transakcija_u_dinarima.pdf
- https://ips.nbs.rs/PDF/pdfPreporukeValidacijaLat.pdf
- https://ips.nbs.rs/PDF/pdfPreporukeNovoLat.pdf
- https://ips.nbs.rs/PDF/Smernice_Generator_Validator_latinica.pdf
- https://purs.gov.rs/upload/media/2025/2/4/612651/SifreplacanjaiobaveznostupisaBOP-v4.pdf (инструкция PURS о BOP; в ней ещё ссылка на старое решение 57/2004, но таблица кодов 40–58 совпадает с действующей)

Вторичные / для сверки:
- https://biznis.rs/novac/pogresna-sifra-placanja-moze-da-iskomplikuje-procese-uplate-i-isplate/
- https://www.uis.gov.rs/static/uploads/3029_2633_Uplatni_racuni_za_republicke_administrativne_takse_i_naknade_za_igre_na_srecu-dodato_13.02.pdf
