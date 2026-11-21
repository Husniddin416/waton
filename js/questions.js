// Informatika va Mantiqiy savollar bazasi
const questionsData = [
  // ================= INFORMATIKA (QUIZ) =================
  {
    id: 1,
    category: "informatika",
    subcategory: "Sanoq sistemalari",
    difficulty: "oson",
    type: "quiz",
    question: "O'nlik sanoq sistemasidagi 25 soni ikkilik (binary) sanoq sistemasida qanday yoziladi?",
    options: ["11001", "10101", "11100", "10011"],
    correctIndex: 0,
    explanation: "25 sonini 2 ga bo'lib qoldiqlarni teskari yozsak: 25 = 16 + 8 + 1 = 11001₂."
  },
  {
    id: 2,
    category: "informatika",
    subcategory: "Dasturlash asoslari",
    difficulty: "oson",
    type: "quiz",
    question: "Python tilida 'type([])' buyrug'i qanday natija qaytaradi?",
    options: ["<class 'tuple'>", "<class 'dict'>", "<class 'list'>", "<class 'set'>"],
    correctIndex: 2,
    explanation: "Kvadrat qavslar '[]' Python tilida ro'yxat (list) ma'lumot turini ifodalaydi."
  },
  {
    id: 3,
    category: "informatika",
    subcategory: "Xotira birliklari",
    difficulty: "oson",
    type: "quiz",
    question: "1 Megabayt (MB) necha Kilobaytga (KB) teng?",
    options: ["1000 KB", "1024 KB", "2048 KB", "512 KB"],
    correctIndex: 1,
    explanation: "Informatikada ikkilik darajalari asosida: 1 MB = 2¹⁰ KB = 1024 KB."
  },
  {
    id: 4,
    category: "informatika",
    subcategory: "Algoritmlar",
    difficulty: "orta",
    type: "quiz",
    question: "Tartiblangan massivda elementni qidirishning eng samarali algoritmi qaysi va uning murakkabligi nima?",
    options: [
      "Linear Search — O(n)",
      "Binary Search — O(log n)",
      "Bubble Sort — O(n²)",
      "Hash Search — O(n log n)"
    ],
    correctIndex: 1,
    explanation: "Ikkilik qidiruv (Binary search) tartiblangan ro'yxatni har qadamda ikkiga bo'ladi, murakkabligi O(log n)."
  },
  {
    id: 5,
    category: "informatika",
    subcategory: "Tarmoqlar",
    difficulty: "orta",
    type: "quiz",
    question: "Veb-brauzer va server o'rtasida xavfsiz (shifrlangan) aloqani ta'minlaydigan protokol qaysi?",
    options: ["HTTP", "FTP", "HTTPS", "SMTP"],
    correctIndex: 2,
    explanation: "HTTPS (Hypertext Transfer Protocol Secure) SSL/TLS sertifikati orqali ma'lumotlarni shifrlangan holda uzatadi."
  },
  {
    id: 6,
    category: "informatika",
    subcategory: "Ma'lumotlar tuzilmasi",
    difficulty: "orta",
    type: "quiz",
    question: "LIFO (Last In, First Out — Oxirgi kirgan birinchi chiqadi) tamoyili qaysi ma'lumotlar tuzilmasiga tegishli?",
    options: ["Queue (Navbat)", "Stack (Stek)", "Tree (Daraxt)", "Graph (Graf)"],
    correctIndex: 1,
    explanation: "Stack idishdagi likopchalar taxlamiga o'xshaydi: eng oxirgi qo'yilgani birinchi olinadi (LIFO)."
  },
  {
    id: 7,
    category: "informatika",
    subcategory: "Kiberxavfsizlik",
    difficulty: "orta",
    type: "quiz",
    question: "Foydalanuvchilarni soxta veb-saytlar yoki havolalar orqali aldab parolini qo'lga kiritish hujumi qanday ataladi?",
    options: ["DDoS", "Phishing (Fishing)", "SQL Injection", "Brute Force"],
    correctIndex: 1,
    explanation: "Phishing — ijtimoiy muhandislik usuli bo'lib, odamlarni soxta xabarlar va saytlar bilan aldashdir."
  },
  {
    id: 8,
    category: "informatika",
    subcategory: "Dasturlash",
    difficulty: "qiyin",
    type: "quiz",
    question: "JavaScript tilida: console.log(typeof NaN) kodi konsolga nima chiqaradi?",
    options: ["'undefined'", "'null'", "'number'", "'NaN'"],
    correctIndex: 2,
    explanation: "JavaScript-da NaN ('Not a Number') bo'lsa ham, texnik jihatdan uning turi raqam ('number') hisoblanadi."
  },
  {
    id: 9,
    category: "informatika",
    subcategory: "Kompyuter arxitekturasi",
    difficulty: "qiyin",
    type: "quiz",
    question: "Protsessor ichidagi eng tez ishlaydigan juda kichik hajmdagi xotira qanday nomlanadi?",
    options: ["Kesh (L3 Cache)", "Registr (Register)", "Operativ xotira (RAM)", "ROM"],
    correctIndex: 1,
    explanation: "Registrlar to'g'ridan-to'g'ri protsessor yadrosining ichida joylashgan bo'lib, eng tezkor xotira turidir."
  },
  {
    id: 10,
    category: "informatika",
    subcategory: "Algoritmlar",
    difficulty: "qiyin",
    type: "quiz",
    question: "Eng yomon holatda (Worst-case) QuickSort algoritmining vaqt murakkabligi qanday bo'ladi?",
    options: ["O(n log n)", "O(n²)", "O(n)", "O(log n)"],
    correctIndex: 1,
    explanation: "Agar tayanch element (pivot) har doim eng kichik yoki eng katta bo'lib qolsa, QuickSort O(n²) vaqt oladi."
  },
  {
    id: 11,
    category: "informatika",
    subcategory: "Ma'lumotlar bazasi",
    difficulty: "orta",
    type: "quiz",
    question: "SQL tilida jadvallar orasidagi munosabatni va chet kalitni ifodalovchi tushuncha nima?",
    options: ["Primary Key", "Foreign Key", "Index", "Trigger"],
    correctIndex: 1,
    explanation: "Foreign Key (tashqi kalit) ikki jadval o'rtasidagi bog'liqlikni ta'minlaydi."
  },
  {
    id: 12,
    category: "informatika",
    subcategory: "Dasturlash asoslari",
    difficulty: "oson",
    type: "quiz",
    question: "Dasturlashda o'z-o'zini chaqiruvchi funksiya qanday nomlanadi?",
    options: ["Iteratsiya", "Rekursiya", "Polimorfizm", "Inkapsulyatsiya"],
    correctIndex: 1,
    explanation: "O'zini o'zi qayta chaqiradigan funksiyalar rekursiv funksiyalar (Recursion) deyiladi."
  },

  // ================= MANTIQIY SAVOLLAR (QUIZ) =================
  {
    id: 13,
    category: "mantiq",
    subcategory: "Matematik mantiq",
    difficulty: "oson",
    type: "quiz",
    question: "Tayoqchaning 2 ta uchi bor. Yarimta tayoqchaning nechta uchi bor?",
    options: ["1 ta", "2 ta", "0 ta", "3 ta"],
    correctIndex: 1,
    explanation: "Tayoqchani yarmidan sindirsangiz ham, har bir yarimta bo'lakning baribir 2 ta uchi bo'ladi!"
  },
  {
    id: 14,
    category: "mantiq",
    subcategory: "Ketma-ketlik",
    difficulty: "orta",
    type: "quiz",
    question: "Ketma-ketlikdagi keyingi sonni toping: 2, 6, 12, 20, 30, ?",
    options: ["36", "40", "42", "44"],
    correctIndex: 2,
    explanation: "Farqlar ketma-ket oshib bormoqda: +4, +6, +8, +10, keyingisi +12 bo'ladi. 30 + 12 = 42 (yoki 1x2, 2x3, 3x4, 4x5, 5x6, 6x7=42)."
  },
  {
    id: 15,
    category: "mantiq",
    subcategory: "Nostandart fikrlash",
    difficulty: "oson",
    type: "quiz",
    question: "Bir shifokor bemorga 3 ta tabletka berdi va har yarim soatda bittadan ichishni buyurdi. Bemor barcha tabletkalarni necha soatda ichib tugatadi?",
    options: ["1.5 soat", "1 soat", "2 soat", "30 daqiqa"],
    correctIndex: 1,
    explanation: "1-tabletka darhol (0-daqiqa), 2-si 30-daqiqada, 3-si 60-daqiqada (1 soatda) ichiladi. Jami 1 soat!"
  },
  {
    id: 16,
    category: "mantiq",
    subcategory: "Deduktiv mantiq",
    difficulty: "orta",
    type: "quiz",
    question: "Ota va o'g'il birgalikda 110 yoshda. Ota o'g'lidan 100 yosh katta bo'lsa, o'g'il necha yoshda?",
    options: ["10 yosh", "5 yosh", "15 yosh", "1 yosh"],
    correctIndex: 1,
    explanation: "Tenglama: x + (x + 100) = 110 => 2x = 10 => x = 5 yosh. Ota esa 105 yoshda."
  },
  {
    id: 17,
    category: "mantiq",
    subcategory: "Vaqt va hisob",
    difficulty: "orta",
    type: "quiz",
    question: "Soat 03:15 da soat mili va daqiqa mili orasidagi burchak necha gradus bo'ladi?",
    options: ["0°", "7.5°", "15°", "30°"],
    correctIndex: 1,
    explanation: "15 daqiqada soat mili 15 × 0.5° = 7.5° siljiydi. Daqiqa mili aniq 3 raqamida, oradagi burchak 7.5° bo'ladi."
  },
  {
    id: 18,
    category: "mantiq",
    subcategory: "Fazoviy mantiq",
    difficulty: "qiyin",
    type: "quiz",
    question: "Bir poyezd 120 km/soat tezlikda shimoldan janubga qarab harakatlanmoqda. Shamol sharqdan g'arbga 10 m/s tezlikda esmoqda. ELEKTR poyezdining tutuni qaysi tomonga yo'naladi?",
    options: ["Janubi-g'arbga", "G'arbga", "Tutun bo'lmaydi", "Shimolga"],
    correctIndex: 2,
    explanation: "Elektr poyezdida tutun umuman chiqmaydi!"
  },
  {
    id: 19,
    category: "mantiq",
    subcategory: "Ehtimollik va mantiq",
    difficulty: "qiyin",
    type: "quiz",
    question: "Qorong'i xonadagi tortmada 10 ta qora va 10 ta oq paypoq bor. Ko'rmasdan bir xil rangdagi bir juft paypoq olish uchun eng kamida nechta paypoq chiqarish kerak?",
    options: ["2 ta", "3 ta", "11 ta", "20 ta"],
    correctIndex: 1,
    explanation: "Dirixle tamoyili: bor-yo'g'i 2 xil rang bor. Agar 3 ta paypoq olsangiz, ulardan kamida ikkitasi albatta bir xil rangda bo'ladi."
  },
  {
    id: 20,
    category: "mantiq",
    subcategory: "Matematik mantiq",
    difficulty: "qiyin",
    type: "quiz",
    question: "Ko'lda nilufar guli o'smoqda. U har kuni o'z maydonini 2 baravar kattalashtiradi. Agar ko'l 48 kunda to'liq qoplansa, ko'lning yarmi necha kunda qoplangan?",
    options: ["24 kunda", "47 kunda", "12 kunda", "40 kunda"],
    correctIndex: 1,
    explanation: "Har kuni hajm 2 baravar oshsa, 48-kundan oldingi kuni, ya'ni 47-kunda ko'lning aynan yarmi qoplangan bo'ladi."
  },

  // ================= MANTIQIY JUMBOQLAR (RIDDLES - JAVOBNI KO'RISH USULI) =================
  {
    id: 101,
    category: "mantiq",
    subcategory: "Mashhur jumboq",
    difficulty: "orta",
    type: "riddle",
    question: "3 ta chiroq va 3 ta o'chirgich: Pastki qavatda 3 ta o'chirgich bor, yuqori xonada esa 3 ta oddiy lampochka. Siz faqat bir marta yuqoriga chiqishingiz mumkin. Qaysi o'chirgich qaysi lampochkaniki ekanini qanday aniqlaysiz?",
    hint: "Lampochkaning faqat yorug'ligiga emas, issiqligiga ham e'tibor bering.",
    answer: "1-o'chirgichni yoqib, 5-10 daqiqa kutasiz. So'ng uni o'chirib, darhol 2-o'chirgichni yoqasiz va yuqoriga chiqasiz. Yoniq turgan chiroq — 2-o'chirgichniki; o'chiq lekin issiq chiroq — 1-o'chirgichniki; sovuq va o'chiq chiroq — 3-o'chirgichniki bo'ladi."
  },
  {
    id: 102,
    category: "mantiq",
    subcategory: "Daryodan o'tish",
    difficulty: "orta",
    type: "riddle",
    question: "Bo'ri, echki va karam: Dehqon daryodan bo'ri, echki va karamni qayiqda olib o'tishi kerak. Qayiqqa faqat dehqon va uning bitta narsasi sig'adi. Bo'ri echkini, echki esa karamni yolg'iz qoldirilsa yeb qo'yadi. Dehqon ularni qanday tartibda bexatar olib o'tadi?",
    hint: "Echki asosiy xavf tug'diruvchi 'vositachi'. Uni qaytarib olib kelishga to'g'ri kelishi mumkin.",
    answer: "1) Dehqon avval echkini olib o'tadi (bo'ri karamni yemaydi). 2) Qaytib kelib bo'rini olib o'tadi, bo'rini qoldirib, echkini o'zi bilan ortga qaytaradi! 3) Echkini qoldirib, karamni olib o'tadi va bo'ri yoniga qo'yadi. 4) Ortga qaytib, oxirida echkini olib o'tadi."
  },
  {
    id: 103,
    category: "informatika",
    subcategory: "Kriptografik jumboq",
    difficulty: "qiyin",
    type: "riddle",
    question: "Alice va Bob xavfsiz quti orqali qimmatbaho xat almashmoqchi. Lekin pochta xizmatidagi kuryer qulfsiz har qanday qutini ochib o'g'irlaydi. Alice va Bobning bir xil kaliti yo'q. Ular xatni qanday yetkazishadi?",
    hint: "Ikki tomonlama qulflash (Diffie-Hellman protokolining jismoniy analogi).",
    answer: "Alice xatni qutiga solib o'zining qulfi bilan qulflaydi va Bobga yuboradi. Bob qutini olgach, o'zining qulfini ham unga ilib, Alicega qaytaradi (qutida 2 ta qulf bo'ladi). Alice o'z qulfini yechib Bobga qaytaradi. Bob endi o'z qulfini ochib xatni o'qiydi!"
  },
  {
    id: 104,
    category: "mantiq",
    subcategory: "Og'irlik va tarozi",
    difficulty: "qiyin",
    type: "riddle",
    question: "Sizda 8 ta tanga bor, ularning 7 tasi bir xil og'irlikda, 1 tasi esa soxta va boshqalaridan yengilroq. Ikki pallali tarozida atigi 2 marta tortib, soxta tangani qanday topasiz?",
    hint: "Tangalarni 3 guruhga bo'ling: 3, 3 va 2.",
    answer: "Tangalarni 3, 3 va 2 ga ajratamiz. 1-tortish: 3 ta tangani 3 ta tanga bilan tortamiz. Agar ular teng kelsa, soxta tanga qolgan 2 tasining ichida (2-tortishda o'sha 2 tani o'zaro solishtirib yengilini topamiz). Agar 3 taliklardan biri yengil chiqsa, o'sha yengil 3 tadan 2 tasini taroziga qo'yamiz: yengili chiqsa shu, teng bo'lsa tortilmagan uchinchisi soxta!"
  },
  {
    id: 105,
    category: "mantiq",
    subcategory: "Nostandart fikrlash",
    difficulty: "oson",
    type: "riddle",
    question: "U nimaki: yoshligida baland bo'yli, qariganida esa past bo'yli bo'ladi?",
    hint: "U olov bilan do'st.",
    answer: "Sham (yoki qalam). U yongani sari qisqarib, past bo'lib boradi."
  }
];

// Saqlash uchun yordamchi funksiya
if (typeof module !== 'undefined') {
  module.exports = questionsData;
}
