/**
 * IT & Mantiqiy Savollar Sayti - Asosiy JavaScript
 * Viktorina, Admin Panel, Doimiy Foydalanuvchilar, Reyting va Standart Ballar Tizimi
 */

// ==========================================================
// 1. STATE & STORAGE MANAGEMENT
// ==========================================================
const DB_STORAGE_KEY = 'questions_db';
const TOURNAMENT_SCORES_KEY = 'infologik_tournament_scores';
const ADMIN_AUTH_KEY = 'infologik_admin_auth'; // Admin sessiyasi (doimiy)
const USER_STORAGE_KEY = 'infologik_user_data'; // Joriy foydalanuvchi (doimiy)
const ALL_USERS_STORAGE_KEY = 'infologik_registered_users'; // Barcha ro'yxatdan o'tgan odamlar

let currentQuestions = [];
let currentIndex = 0;
let userScore = 0; // to'g'ri javoblar soni
let userEarnedPoints = 0; // test davomida to'plangan ballar
let timerInterval = null;
let timeLeft = 30; // soniya
let isAnswered = false;
let userAnswersLog = [];

// Savol qiyinlik darajasiga ko'ra standart ballar
function getQuestionPoints(difficulty) {
  switch (difficulty) {
    case 'oson': return 10;
    case 'orta': return 20;
    case 'qiyin': return 30;
    default: return 15;
  }
}

// Boshlang'ich namunaviy foydalanuvchilar (Reyting bo'sh ko'rinmasligi uchun)
const defaultDemoUsers = [
  { id: 'usr_demo_1', name: 'Jasur Bekmurodov', phone: '+998 90 111 22 33', googleEmail: 'jasur.dev@gmail.com', joinedAt: '2026-11-01', testsCount: 15, totalCorrect: 85, totalPoints: 1750 },
  { id: 'usr_demo_2', name: 'Madina Karimova', phone: '+998 93 444 55 66', googleEmail: 'madina.k@gmail.com', joinedAt: '2026-11-03', testsCount: 12, totalCorrect: 70, totalPoints: 1420 },
  { id: 'usr_demo_3', name: 'Bobur Mirzayev', phone: '+998 97 777 88 99', googleEmail: 'bobur_it@gmail.com', joinedAt: '2026-11-05', testsCount: 10, totalCorrect: 58, totalPoints: 1180 },
  { id: 'usr_demo_4', name: 'Laylo Umarova', phone: '+998 99 222 33 44', googleEmail: 'laylo.u@gmail.com', joinedAt: '2026-11-08', testsCount: 8, totalCorrect: 45, totalPoints: 920 },
  { id: 'usr_demo_5', name: 'Diyorbek Toshmatov', phone: '+998 91 555 66 77', googleEmail: 'diyor.coder@gmail.com', joinedAt: '2026-11-10', testsCount: 6, totalCorrect: 32, totalPoints: 650 }
];

// Barcha foydalanuvchilarni olish (dublikatlardan tozalangan holda)
function getAllUsers() {
  const data = localStorage.getItem(ALL_USERS_STORAGE_KEY);
  if (data) {
    try {
      let users = JSON.parse(data);
      if (Array.isArray(users)) {
        // Bir xil telefon raqamiga ega dublikat akkauntlarni birlashtirish
        const deduped = [];
        const seenPhones = new Map();

        for (const u of users) {
          const rawPhone = (u.phone || '').replace(/[\s\-\(\)]/g, '');
          if (!rawPhone) {
            deduped.push(u);
            continue;
          }
          if (seenPhones.has(rawPhone)) {
            const existingIdx = seenPhones.get(rawPhone);
            const prev = deduped[existingIdx];
            // Eng to'liq ma'lumotlarni bitta foydalanuvchida birlashtiramiz
            const cleanName = u.name.replace(/\s*\(Admin\)/gi, '').trim() || prev.name.replace(/\s*\(Admin\)/gi, '').trim();
            const realPoints = (prev.totalPoints === 9999 ? u.totalPoints : (u.totalPoints === 9999 ? prev.totalPoints : Math.max(prev.totalPoints || 0, u.totalPoints || 0))) || 0;
            
            deduped[existingIdx] = {
              ...prev,
              ...u,
              id: (prev.id && !prev.id.startsWith('usr_admin_')) ? prev.id : u.id,
              name: cleanName,
              avatarBase64: prev.avatarBase64 || u.avatarBase64 || null,
              totalPoints: realPoints,
              testsCount: Math.max(prev.testsCount || 0, u.testsCount || 0),
              totalCorrect: Math.max(prev.totalCorrect || 0, u.totalCorrect || 0),
              isAdmin: Boolean(prev.isAdmin || u.isAdmin)
            };
          } else {
            seenPhones.set(rawPhone, deduped.length);
            deduped.push(u);
          }
        }

        if (deduped.length !== users.length) {
          localStorage.setItem(ALL_USERS_STORAGE_KEY, JSON.stringify(deduped));
        }
        return deduped;
      }
    } catch (e) {
      console.error("Users parsing error", e);
    }
  }
  // Boshlang'ich foydalanuvchilarni saqlash
  localStorage.setItem(ALL_USERS_STORAGE_KEY, JSON.stringify(defaultDemoUsers));
  return [...defaultDemoUsers];
}

// Barcha foydalanuvchilarni saqlash
function saveAllUsers(users) {
  localStorage.setItem(ALL_USERS_STORAGE_KEY, JSON.stringify(users));
  renderLeaderboard();
  renderAdminUsersTable();
}

// Savollar bazasini olish
function getAllQuestions() {
  const stored = localStorage.getItem(DB_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Questions parsing error", e);
    }
  }
  if (typeof questionsData !== 'undefined') {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(questionsData));
    return [...questionsData];
  }
  return [];
}

// Savollar bazasini saqlash
function saveAllQuestions(newList) {
  localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(newList));
  updateHomeStats();
  if (isAdminLoggedIn()) {
    renderAdminTable();
  }
}

// ==========================================================
// 2. USER AUTH & PERSISTENCE (ESLAB QOLISH TIZIMI)
// ==========================================================
function getCurrentUser() {
  const data = localStorage.getItem(USER_STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }
  return null;
}

function saveCurrentUser(user) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

  // Barcha ro'yxatdan o'tgan foydalanuvchilar bazasida ham yangilash
  const allUsers = getAllUsers();
  const index = allUsers.findIndex(u => u.id === user.id);
  if (index !== -1) {
    allUsers[index] = { ...allUsers[index], ...user };
  } else {
    allUsers.push(user);
  }
  saveAllUsers(allUsers);

  updateUserUI();
  renderLeaderboard();
}

function logoutUser() {
  const confirmed = confirm("Haqiqatan ham hisobingizdan chiqmoqchimisiz?");
  if (!confirmed) return;

  localStorage.removeItem(USER_STORAGE_KEY); // Joriy sessiyani o'chirish (ballar saqlanib qoladi)
  closeProfileModal();
  updateUserUI();
  renderLeaderboard();

  // Kirish formasini tozalash — yangi odam kirishi uchun
  const authForm = document.getElementById('auth-form');
  if (authForm) authForm.reset();

  showToast("Hisobdan chiqildi. Boshqa hisob bilan kirish mumkin.");
  checkAuthEnforcement(); // Darhol majburiy ro'yxatdan o'tish modalini ochish
}

function checkAuthEnforcement() {
  const user = getCurrentUser();
  const closeBtn = document.getElementById('btn-close-auth-modal');
  if (!user) {
    if (closeBtn) closeBtn.classList.add('hidden'); // Majburiy bo'lgani uchun yopish tugmasi ko'rinmaydi
    openAuthModal();
  } else {
    if (closeBtn) closeBtn.classList.remove('hidden');
    closeAuthModal();
    updateUserUI();
  }
}

function updateUserUI() {
  const user = getCurrentUser();
  const authBtn = document.getElementById('btn-header-auth');
  const userBadge = document.getElementById('header-user-badge');
  const userInitial = document.getElementById('user-badge-initial');
  const userName = document.getElementById('user-badge-name');

  if (user) {
    if (authBtn) authBtn.classList.add('hidden');
    if (userBadge) {
      userBadge.classList.remove('hidden');
      if (userName) userName.textContent = user.name;
      // Header avatarini yangilash (rasm yoki harf)
      updateUserAvatarInHeader(user);
    }
  } else {
    if (authBtn) authBtn.classList.remove('hidden');
    if (userBadge) userBadge.classList.add('hidden');
    if (userInitial) {
      userInitial.style.backgroundImage = '';
      userInitial.textContent = 'U';
    }
  }
  // Foydalanuvchi o'zgarganda statistikani yangilash (har kim o'z testsCount ini ko'rsin)
  updateHomeStats();
  // Admin tugmalarini ko'rsatish/yashirish
  updateAdminUI();
}

// Admin panelini ko'rsatish/yashirish (faqat admin bo'lib kirganlarga ko'rinadi)
function updateAdminUI() {
  const isAdmin = isAdminLoggedIn();
  const headerAdminBtn = document.getElementById('btn-header-admin');
  const tabAdminBtn = document.getElementById('tab-btn-admin');

  if (headerAdminBtn) {
    if (isAdmin) headerAdminBtn.classList.remove('hidden');
    else headerAdminBtn.classList.add('hidden');
  }

  if (tabAdminBtn) {
    if (isAdmin) tabAdminBtn.classList.remove('hidden');
    else tabAdminBtn.classList.add('hidden');
  }
}

// Ro'yxatdan o'tish oynasida Foydalanuvchi va Admin rejimini almashtirish
function switchAuthMode(mode) {
  const tabUser = document.getElementById('tab-auth-user');
  const tabAdmin = document.getElementById('tab-auth-admin');
  const panelUser = document.getElementById('auth-panel-user');
  const panelAdmin = document.getElementById('auth-panel-admin');
  const title = document.getElementById('auth-modal-title');

  if (mode === 'admin') {
    tabUser?.classList.remove('active');
    tabAdmin?.classList.add('active');
    panelUser?.classList.add('hidden');
    panelAdmin?.classList.remove('hidden');
    if (title) title.textContent = "🔐 Admin Kirish";
    setTimeout(() => {
      document.getElementById('auth-admin-name')?.focus();
    }, 100);
  } else {
    tabAdmin?.classList.remove('active');
    tabUser?.classList.add('active');
    panelAdmin?.classList.add('hidden');
    panelUser?.classList.remove('hidden');
    if (title) title.textContent = "Ro'yxatdan o'tish / Kirish";
  }
}

// Ro'yxatdan o'tish oynasidan Admin sifatida kirish
function handleAuthAdminLogin(e) {
  e.preventDefault();
  const name = document.getElementById('auth-admin-name')?.value.trim();
  const phone = document.getElementById('auth-admin-phone')?.value.trim();
  const pass = document.getElementById('auth-admin-password')?.value || '';

  if (!name || !phone) {
    showToast("❌ Admin ismi va telefon raqamini kiritish majburiy!");
    return;
  }

  // O'zbekiston telefon raqami validatsiyasi
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  const uzPhoneRegex = /^(\+998|998|0)?(33|50|55|71|77|88|90|91|93|94|95|97|98|99)\d{7}$/;
  if (!uzPhoneRegex.test(cleanPhone)) {
    showToast("❌ Telefon raqam noto'g'ri! Masalan: +998 90 123 45 67");
    return;
  }

  // Standart telefon formati: +998 XX XXX XX XX
  let normalizedPhone = cleanPhone;
  if (normalizedPhone.startsWith('0')) {
    normalizedPhone = '+998' + normalizedPhone.slice(1);
  } else if (normalizedPhone.startsWith('998')) {
    normalizedPhone = '+' + normalizedPhone;
  } else if (!normalizedPhone.startsWith('+')) {
    normalizedPhone = '+998' + normalizedPhone;
  }
  const displayPhone = normalizedPhone.replace(/(\+998)(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');

  if (pass !== getAdminPassword()) {
    const input = document.getElementById('auth-admin-password');
    if (input) {
      input.value = '';
      input.focus();
    }
    showToast("❌ Admin paroli noto'g'ri! Qayta urinib ko'ring.");
    return;
  }

  localStorage.setItem(ADMIN_AUTH_KEY, 'true');

  // Shu telefon raqamli mavjud foydalanuvchini qidiramiz (ikkita bo'lib qolmasligi uchun)
  const allUsers = getAllUsers();
  const foundUser = allUsers.find(u =>
    u.phone && u.phone.replace(/[\s\-\(\)]/g, '') === cleanPhone
  );

  let activeAdminUser;
  if (foundUser) {
    // Mavjud foydalanuvchi — uning barcha ballari va profil rasmi saqlanadi, faqat admin huquqi beriladi
    foundUser.name = name;
    foundUser.phone = displayPhone;
    foundUser.isAdmin = true;
    activeAdminUser = foundUser;
  } else {
    // Yangi foydalanuvchi — yangi yagona hisob ochiladi
    activeAdminUser = {
      id: 'usr_' + Date.now(),
      name: name,
      phone: displayPhone,
      isAdmin: true,
      joinedAt: new Date().toISOString().split('T')[0],
      testsCount: 0,
      bestScore: 0,
      totalCorrect: 0,
      totalPoints: 0
    };
  }

  saveCurrentUser(activeAdminUser);

  // Modalni yopish va tozalash
  const closeBtn = document.getElementById('btn-close-auth-modal');
  if (closeBtn) closeBtn.classList.remove('hidden');
  document.getElementById('auth-modal')?.classList.add('hidden');
  document.getElementById('auth-admin-form')?.reset();

  updateUserUI();
  updateAdminUI();
  showToast(`👑 Xush kelibsiz, ${name}! Boshqaruv paneli ochildi.`);
  switchTab('admin');
}

function openAuthModal() {
  const modal = document.getElementById('auth-modal');
  const user = getCurrentUser();
  const closeBtn = document.getElementById('btn-close-auth-modal');
  if (closeBtn) {
    if (!user && !isAdminLoggedIn()) {
      closeBtn.classList.add('hidden');
    } else {
      closeBtn.classList.remove('hidden');
    }
  }
  switchAuthMode('user');
  if (modal) modal.classList.remove('hidden');
}

function closeAuthModal() {
  // Agar foydalanuvchi hali kirmagan bo'lsa va admin ham bo'lmasa, oynani yopishga ruxsat yo'q (majburiy)
  if (!getCurrentUser() && !isAdminLoggedIn()) {
    showToast("Saytdan foydalanish uchun ro'yxatdan o'tish majburiy!");
    return;
  }
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.add('hidden');
}

function handleRegisterSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('auth-name').value.trim();
  const phone = document.getElementById('auth-phone').value.trim();
  const email = document.getElementById('auth-email').value.trim();

  if (!name || !phone) {
    showToast("❌ Iltimos, ism va telefon raqamingizni kiriting!");
    return;
  }

  // O'zbekiston telefon raqami validatsiyasi
  // Qabul qilinuvchi formatlar: +998901234567, 998901234567, 0901234567, 901234567
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  const uzPhoneRegex = /^(\+998|998|0)?(33|50|55|71|77|88|90|91|93|94|95|97|98|99)\d{7}$/;
  if (!uzPhoneRegex.test(cleanPhone)) {
    showToast("❌ Telefon raqam noto'g'ri! Masalan: +998 90 123 45 67");
    document.getElementById('auth-phone').focus();
    document.getElementById('auth-phone').style.borderColor = 'var(--error)';
    setTimeout(() => { document.getElementById('auth-phone').style.borderColor = ''; }, 2500);
    return;
  }

  // Raqamni standart formatga o'tkazish: +998XXXXXXXXX
  let normalizedPhone = cleanPhone;
  if (normalizedPhone.startsWith('0')) {
    normalizedPhone = '+998' + normalizedPhone.slice(1);
  } else if (normalizedPhone.startsWith('998')) {
    normalizedPhone = '+' + normalizedPhone;
  } else if (!normalizedPhone.startsWith('+')) {
    normalizedPhone = '+998' + normalizedPhone;
  }
  // Ko'rinadigan format: +998 XX XXX XX XX
  const displayPhone = normalizedPhone.replace(/(\+998)(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');

  // Telefon raqami bo'yicha mavjud foydalanuvchini qidirish
  const allUsers = getAllUsers();
  const foundUser = allUsers.find(u =>
    u.phone && u.phone.replace(/[\s\-\(\)]/g, '') === normalizedPhone.replace(/[\s\-\(\)]/g, '')
  );

  if (foundUser) {
    // Mavjud foydalanuvchi — uning hisobiga kirish (ballar saqlanadi)
    foundUser.name = name;
    foundUser.googleEmail = email || foundUser.googleEmail || null;
    foundUser.phone = displayPhone;
    saveCurrentUser(foundUser);
    closeAuthModal();
    showToast(`Xush kelibsiz yana, ${name}! Hisobingiz topildi ✅`);
  } else {
    // Yangi foydalanuvchi — yangi hisob yaratish
    const newUser = {
      id: 'usr_' + Date.now(),
      name: name,
      phone: displayPhone,
      googleEmail: email || null,
      joinedAt: new Date().toISOString().split('T')[0],
      testsCount: 0,
      bestScore: 0,
      totalCorrect: 0,
      totalPoints: 0
    };
    saveCurrentUser(newUser);
    closeAuthModal();
    showToast(`Xush kelibsiz, ${name}! Yangi hisob yaratildi 🎉`);
  }
}

function handleGoogleAuth() {
  const googleEmail = prompt("Google hisobingiz email manzilini kiriting (ixtiyoriy):", "foydalanuvchi@gmail.com");
  if (googleEmail === null) return;

  let autoName = "Foydalanuvchi";
  if (googleEmail && googleEmail.includes('@')) {
    autoName = googleEmail.split('@')[0];
    autoName = autoName.charAt(0).toUpperCase() + autoName.slice(1);
  }

  const phonePrompt = prompt("Telefon raqamingizni kiriting:", "+998 ");
  const phone = phonePrompt || "Kiritilmagan";

  const newUser = {
    id: 'usr_g_' + Date.now(),
    name: autoName,
    phone: phone,
    googleEmail: googleEmail || 'google_user@gmail.com',
    joinedAt: new Date().toISOString().split('T')[0],
    testsCount: 0,
    bestScore: 0,
    totalCorrect: 0,
    totalPoints: 0
  };

  saveCurrentUser(newUser);
  closeAuthModal();
  showToast(`Google hisobi orqali kirdingiz: ${autoName}!`);
}

function openProfileModal() {
  const user = getCurrentUser();
  if (!user) {
    openAuthModal();
    return;
  }

  // Reytingdagi o'rnini hisoblash
  const allUsers = getAllUsers().sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
  const myRank = allUsers.findIndex(u => u.id === user.id) + 1;

  document.getElementById('profile-view-name').textContent = user.name;
  // Telefon va email faqat admin ko'radi — oddiy foydalanuvchi profilida ko'rsatilmaydi
  if (document.getElementById('profile-view-phone')) {
    document.getElementById('profile-view-phone').textContent = user.phone || '';
  }
  if (document.getElementById('profile-view-email')) {
    document.getElementById('profile-view-email').textContent = user.googleEmail || '';
  }
  if (document.getElementById('profile-view-date')) {
    document.getElementById('profile-view-date').textContent = user.joinedAt || 'Bugun';
  }

  // Profil rasmini yuklash
  const avatarImg = document.getElementById('profile-avatar-img');
  const avatarEmoji = document.getElementById('profile-avatar-emoji');
  if (user.avatarBase64 && avatarImg && avatarEmoji) {
    avatarImg.src = user.avatarBase64;
    avatarImg.style.display = 'block';
    avatarEmoji.style.display = 'none';
  } else if (avatarImg && avatarEmoji) {
    avatarImg.style.display = 'none';
    avatarEmoji.style.display = 'block';
    avatarEmoji.textContent = (user.name || 'U').charAt(0).toUpperCase();
  }

  // Header da ham rasmni yangilash
  updateUserAvatarInHeader(user);

  document.getElementById('profile-stat-tests').textContent = user.testsCount || 0;
  document.getElementById('profile-stat-best').textContent = (user.totalPoints || 0) + ' ball';
  document.getElementById('profile-stat-correct').textContent = `${myRank > 0 ? myRank : '-'}-o'rin`;

  document.getElementById('profile-modal').classList.remove('hidden');
}

// Profil rasmini yuklash funksiyasi
function handleAvatarUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Fayl hajmini tekshirish (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    showToast("❌ Rasm hajmi 2MB dan katta bo'lmasin!");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const base64 = e.target.result;

    // Foydalanuvchi profiliga saqlash
    const user = getCurrentUser();
    if (user) {
      user.avatarBase64 = base64;
      saveCurrentUser(user);

      // Modalni yangilash
      const avatarImg = document.getElementById('profile-avatar-img');
      const avatarEmoji = document.getElementById('profile-avatar-emoji');
      if (avatarImg && avatarEmoji) {
        avatarImg.src = base64;
        avatarImg.style.display = 'block';
        avatarEmoji.style.display = 'none';
      }

      // Header avatarini yangilash
      updateUserAvatarInHeader(user);
      renderLeaderboard();
      if (typeof renderAdminUsersTable === 'function') renderAdminUsersTable();
      if (typeof renderTournamentLeaderboard === 'function') renderTournamentLeaderboard();
      showToast("✅ Profil rasmi muvaffaqiyatli o'zgartirildi!");
    }
  };
  reader.readAsDataURL(file);
}

// Header da avatar rasmini yangilash
function updateUserAvatarInHeader(user) {
  const userInitial = document.getElementById('user-badge-initial');
  if (!userInitial) return;

  if (user && user.avatarBase64) {
    userInitial.style.backgroundImage = `url('${user.avatarBase64}')`;
    userInitial.style.backgroundSize = 'cover';
    userInitial.style.backgroundPosition = 'center';
    userInitial.textContent = '';
  } else {
    userInitial.style.backgroundImage = '';
    userInitial.textContent = user ? (user.name || 'U').charAt(0).toUpperCase() : 'U';
  }
}

// Barcha avatar doiralarini bir xil render qilish uchun yordamchi funksiya
// user — foydalanuvchi ob'ekti (name, avatarBase64 bo'lishi mumkin)
// size — px miqdori (masalan: '28px', '32px')
function renderAvatarHTML(user, size = '32px') {
  const fontSize = `calc(${size} * 0.4)`;
  const initial = ((user && user.name) || 'U').charAt(0).toUpperCase();
  if (user && user.avatarBase64) {
    return `<div class="user-avatar-circle" style="width:${size};height:${size};font-size:${fontSize};background-image:url('${user.avatarBase64}');background-size:cover;background-position:center;"></div>`;
  }
  return `<div class="user-avatar-circle" style="width:${size};height:${size};font-size:${fontSize};">${initial}</div>`;
}

function closeProfileModal() {
  document.getElementById('profile-modal').classList.add('hidden');
}

// Toast bildirishnoma
function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>⚡</span> <span>${escapeHtml(message)}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 2800);
}

// Sound Effects (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
  try {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'wrong') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, audioCtx.currentTime);
      osc.frequency.setValueAtTime(160, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    }
  } catch (e) {
    console.log("Audio not supported or blocked");
  }
}

// ==========================================================
// 3. THEME SWITCHER
// ==========================================================
function initTheme() {
  const savedTheme = localStorage.getItem('site_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('site_theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

// ==========================================================
// 4. STATS UPDATE
// ==========================================================
function updateHomeStats() {
  const all = getAllQuestions();
  const infoCount = all.filter(q => q.category === 'informatika').length;
  const logicCount = all.filter(q => q.category === 'mantiq').length;

  // Bajarilgan testlar — joriy foydalanuvchining o'z statistikasi (har kim alohida)
  const currentUser = getCurrentUser();
  const playedCount = currentUser ? (currentUser.testsCount || 0) : 0;

  const infoEl = document.getElementById('stat-info-count');
  const logicEl = document.getElementById('stat-logic-count');
  const playedEl = document.getElementById('stat-played-count');

  if (infoEl) infoEl.textContent = infoCount;
  if (logicEl) logicEl.textContent = logicCount;
  if (playedEl) playedEl.textContent = playedCount;
}

// ==========================================================
// 5. TAB NAVIGATION & ADMIN ACCESS
// ==========================================================
function switchTab(tabId) {
  if (tabId === 'admin') {
    if (!isAdminLoggedIn()) {
      openAuthModal();
      switchAuthMode('admin');
      return;
    }
  } else if (tabId === 'tournament') {
    if (!getCurrentUser()) {
      openAuthModal();
      return;
    }
  } else if (!getCurrentUser()) {
    openAuthModal();
    return;
  }

  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.view-section').forEach(s => s.classList.add('hidden'));

  const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  const targetSection = document.getElementById(`section-${tabId}`);
  if (targetSection) targetSection.classList.remove('hidden');

  if (tabId === 'riddles') {
    renderRiddles();
  } else if (tabId === 'leaderboard') {
    renderLeaderboard();
  } else if (tabId === 'admin') {
    renderAdminTable();
    renderAdminUsersTable();
  } else if (tabId === 'tournament') {
    // Ensure intro view is visible (not mid-game)
    if (!document.getElementById('tournament-quiz-view').classList.contains('hidden')) {
      // Game is running, don't reset
    } else {
      document.getElementById('tournament-intro-view').classList.remove('hidden');
      document.getElementById('tournament-results-view').classList.add('hidden');
    }
    renderTournamentLeaderboard();
  }
}

// ==========================================================
// 6. QUIZ ENGINE (STANDART BALLAR BILAN)
// ==========================================================
function startQuiz(category = 'all', difficulty = 'all') {
  if (!getCurrentUser()) {
    openAuthModal();
    return;
  }

  let list = getAllQuestions().filter(q => q.type === 'quiz');

  if (category !== 'all') {
    list = list.filter(q => q.category === category);
  }
  if (difficulty !== 'all') {
    list = list.filter(q => q.difficulty === difficulty);
  }

  if (list.length === 0) {
    alert("Kechirasiz, tanlangan toifada hozircha test savollari mavjud emas!");
    return;
  }

  currentQuestions = [...list].sort(() => 0.5 - Math.random());
  currentIndex = 0;
  userScore = 0;
  userEarnedPoints = 0;
  userAnswersLog = [];

  document.getElementById('home-view').classList.add('hidden');
  document.getElementById('quiz-view').classList.remove('hidden');
  document.getElementById('results-view').classList.add('hidden');

  loadQuestion();
}

function loadQuestion() {
  isAnswered = false;
  clearInterval(timerInterval);

  const q = currentQuestions[currentIndex];
  const total = currentQuestions.length;
  const pts = getQuestionPoints(q.difficulty);

  const progressPercent = ((currentIndex + 1) / total) * 100;
  document.getElementById('quiz-progress').style.width = `${progressPercent}%`;
  document.getElementById('question-counter').textContent = `${currentIndex + 1} / ${total}`;
  
  const catLabel = q.category === 'informatika' ? '💻 Informatika' : '🧠 Mantiq';
  document.getElementById('quiz-cat-badge').textContent = `${catLabel} • ${q.subcategory || 'Umumiy'} (+${pts} ball)`;

  document.getElementById('quiz-question-text').textContent = q.question;

  const explBox = document.getElementById('quiz-explanation');
  explBox.classList.add('hidden');

  const nextBtn = document.getElementById('btn-next-question');
  nextBtn.disabled = true;
  nextBtn.style.opacity = '0.5';
  nextBtn.textContent = (currentIndex === total - 1) ? "Natijalarni ko'rish" : "Keyingi savol ➔";

  const container = document.getElementById('quiz-options-container');
  container.innerHTML = '';

  const labels = ['A', 'B', 'C', 'D'];
  q.options.forEach((optText, idx) => {
    const btn = document.createElement('button');
    btn.className = 'opt-btn';
    btn.innerHTML = `
      <span class="opt-index">${labels[idx] || (idx + 1)}</span>
      <span class="opt-text">${escapeHtml(optText)}</span>
    `;
    btn.addEventListener('click', () => selectAnswer(idx));
    container.appendChild(btn);
  });

  startTimer();
}

function startTimer() {
  timeLeft = 30;
  const timerEl = document.getElementById('timer-seconds');
  timerEl.textContent = timeLeft;

  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timeOver();
    }
  }, 1000);
}

function timeOver() {
  if (isAnswered) return;
  isAnswered = true;
  playSound('wrong');

  const q = currentQuestions[currentIndex];
  const optionButtons = document.querySelectorAll('.opt-btn');
  optionButtons.forEach(btn => btn.disabled = true);

  if (optionButtons[q.correctIndex]) {
    optionButtons[q.correctIndex].classList.add('correct');
  }

  showExplanation(q.explanation || "Izoh mavjud emas.", "Vaqt tugadi! (0 ball)");
  enableNextBtn();
}

function selectAnswer(selectedIndex) {
  if (isAnswered) return;
  isAnswered = true;
  clearInterval(timerInterval);

  const q = currentQuestions[currentIndex];
  const pts = getQuestionPoints(q.difficulty);
  const optionButtons = document.querySelectorAll('.opt-btn');
  optionButtons.forEach(btn => btn.disabled = true);

  const isCorrect = (selectedIndex === q.correctIndex);

  if (isCorrect) {
    userScore++;
    userEarnedPoints += pts;
    playSound('correct');
    optionButtons[selectedIndex].classList.add('correct');
    showExplanation(q.explanation || "Izoh berilmagan.", `To'g'ri javob! (+${pts} ball)`);
  } else {
    playSound('wrong');
    optionButtons[selectedIndex].classList.add('incorrect');
    if (optionButtons[q.correctIndex]) {
      optionButtons[q.correctIndex].classList.add('correct');
    }
    showExplanation(q.explanation || "Izoh berilmagan.", "Noto'g'ri javob! (0 ball)");
  }

  enableNextBtn();
}

function showExplanation(text, statusTitle) {
  const explBox = document.getElementById('quiz-explanation');
  const titleEl = document.getElementById('expl-title');
  const textEl = document.getElementById('expl-text');

  titleEl.textContent = statusTitle;
  textEl.textContent = text;
  explBox.classList.remove('hidden');
}

function enableNextBtn() {
  const nextBtn = document.getElementById('btn-next-question');
  nextBtn.disabled = false;
  nextBtn.style.opacity = '1';
}

function nextQuestion() {
  if (currentIndex < currentQuestions.length - 1) {
    currentIndex++;
    loadQuestion();
  } else {
    showResults();
  }
}

function showResults() {
  clearInterval(timerInterval);

  const total = currentQuestions.length;
  const percent = Math.round((userScore / total) * 100);

  // Foydalanuvchi ma'lumotlariga natijani va to'plangan ballarni qo'shish
  const currentUser = getCurrentUser();
  if (currentUser) {
    currentUser.testsCount = (currentUser.testsCount || 0) + 1;
    currentUser.totalCorrect = (currentUser.totalCorrect || 0) + userScore;
    currentUser.totalPoints = (currentUser.totalPoints || 0) + userEarnedPoints;
    if (percent > (currentUser.bestScore || 0)) {
      currentUser.bestScore = percent;
    }
    saveCurrentUser(currentUser);
  }

  document.getElementById('quiz-view').classList.add('hidden');
  document.getElementById('results-view').classList.remove('hidden');

  document.getElementById('res-percent').textContent = `+${userEarnedPoints} ball`;
  document.getElementById('res-correct').textContent = `${userScore} ta`;
  document.getElementById('res-wrong').textContent = `${total - userScore} ta`;
  document.getElementById('res-total').textContent = `${percent}%`;

  const msgEl = document.getElementById('res-status-msg');
  if (percent === 100) {
    msgEl.textContent = "🏆 Mukammal natija! Barcha savollar to'g'ri topildi!";
  } else if (percent >= 80) {
    msgEl.textContent = `🌟 Ajoyib natija! Siz ${userEarnedPoints} ball to'pladingiz!`;
  } else if (percent >= 50) {
    msgEl.textContent = `👍 Yaxshi natija! Siz ${userEarnedPoints} ball jamg'ardingiz.`;
  } else {
    msgEl.textContent = `💪 Harakatdan to'xtamang! Siz ${userEarnedPoints} ball oldingiz.`;
  }

  updateHomeStats();
}

function exitQuiz() {
  clearInterval(timerInterval);
  document.getElementById('quiz-view').classList.add('hidden');
  document.getElementById('results-view').classList.add('hidden');
  document.getElementById('home-view').classList.remove('hidden');
  updateHomeStats();
}

// ==========================================================
// 7. RIDDLES & LOGIC PUZZLES
// ==========================================================
function renderRiddles() {
  const container = document.getElementById('riddles-container');
  if (!container) return;

  const filterCategory = document.getElementById('riddle-filter-cat')?.value || 'all';
  const filterDifficulty = document.getElementById('riddle-filter-diff')?.value || 'all';
  const searchText = document.getElementById('riddle-search')?.value.toLowerCase().trim() || '';

  const list = getAllQuestions().filter(q => q.type === 'riddle');

  const filtered = list.filter(item => {
    const matchesCat = (filterCategory === 'all' || item.category === filterCategory);
    const matchesDiff = (filterDifficulty === 'all' || item.difficulty === filterDifficulty);
    const matchesSearch = (item.question.toLowerCase().includes(searchText) || 
                           (item.subcategory && item.subcategory.toLowerCase().includes(searchText)));
    return matchesCat && matchesDiff && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: var(--text-muted); background: var(--card-bg); border-radius: 16px;">
        🔍 Hech qanday mantiqiy jumboq topilmadi.
      </div>
    `;
    return;
  }

  const isAdmin = isAdminLoggedIn();

  container.innerHTML = filtered.map(r => `
    <div class="riddle-card" id="riddle-${r.id}">
      <div class="riddle-header">
        <span class="quiz-badge">${r.category === 'informatika' ? '💻 IT' : '🧠 Mantiq'} • ${r.subcategory || 'Umumiy'}</span>
        <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: capitalize;">Daraja: ${r.difficulty}</span>
      </div>
      <div class="riddle-title">${escapeHtml(r.question)}</div>

      <div class="riddle-actions">
        ${r.hint ? `<button class="btn-secondary" onclick="toggleHint(${r.id})">💡 Maslahat (Hint)</button>` : ''}
        ${isAdmin 
          ? `<button class="btn-primary" onclick="toggleAnswer(${r.id})">🔓 Javobni ko'rish (Admin)</button>`
          : `<button class="btn-secondary" onclick="requestAdminAnswer()" style="opacity: 0.85; border-color: rgba(236, 72, 153, 0.4);"><span style="color: var(--accent);">🔒</span> Javob faqat adminlar uchun</button>`
        }
      </div>

      ${r.hint ? `<div id="hint-${r.id}" class="riddle-hint-box hidden"><strong>Maslahat:</strong> ${escapeHtml(r.hint)}</div>` : ''}
      ${isAdmin ? `
        <div id="ans-${r.id}" class="riddle-answer-box hidden">
          <strong>To'g'ri yechim va javob (Faqat Admin):</strong><br>${escapeHtml(r.answer)}
        </div>
      ` : ''}
    </div>
  `).join('');
}

function toggleHint(id) {
  const box = document.getElementById(`hint-${id}`);
  if (box) box.classList.toggle('hidden');
}

function toggleAnswer(id) {
  if (!isAdminLoggedIn()) {
    requestAdminAnswer();
    return;
  }
  const box = document.getElementById(`ans-${id}`);
  if (box) box.classList.toggle('hidden');
}

function requestAdminAnswer() {
  const wantLogin = confirm("🔒 Mantiqiy jumboqlarning to'liq javobi faqat ADMINLAR uchun ochiq!\n\nAdmin sifatida kirishni xohlaysizmi?");
  if (wantLogin) {
    openAdminLoginModal();
  }
}

// ==========================================================
// 8. LEADERBOARD (REYTING TIZIMI)
// ==========================================================
function renderLeaderboard() {
  const allUsers = getAllUsers();
  // Ballar bo'yicha kamayish tartibida saralash
  const sorted = [...allUsers].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));

  // Joriy foydalanuvchining o'rni
  const currentUser = getCurrentUser();
  const myRankBanner = document.getElementById('my-rank-banner-box');
  if (myRankBanner) {
    if (currentUser) {
      const myRank = sorted.findIndex(u => u.id === currentUser.id) + 1;
      myRankBanner.innerHTML = `
        <div class="my-rank-info">
          ${renderAvatarHTML(currentUser, '44px')}
          <div>
            <div style="font-weight: 800; font-size: 1.1rem;">${escapeHtml(currentUser.name)} (Siz)</div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">Jami to'plangan: <strong>${currentUser.totalPoints || 0} ball</strong> • Yechilgan savollar: ${currentUser.totalCorrect || 0} ta</div>
          </div>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 0.85rem; color: var(--text-muted); display: block;">Reytingdagi o'rningiz:</span>
          <span class="my-rank-num">#${myRank > 0 ? myRank : sorted.length + 1}</span>
        </div>
      `;
      myRankBanner.classList.remove('hidden');
    } else {
      myRankBanner.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div>
            <strong>Reytingda o'z o'rningizni ko'rmoqchimisiz?</strong>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.2rem;">Hisobingizga kiring va testlarni yechib yuqori o'rinlarni egallang!</p>
          </div>
          <button class="btn-primary" onclick="openAuthModal()" style="padding: 0.5rem 1.2rem;">Kirish ➔</button>
        </div>
      `;
      myRankBanner.classList.remove('hidden');
    }
  }

  // Top 3 Podium
  const top1 = sorted[0];
  const top2 = sorted[1];
  const top3 = sorted[2];

  const podiumEl = document.getElementById('leaderboard-podium');
  if (podiumEl) {
    podiumEl.innerHTML = `
      <!-- 2-o'rin -->
      ${top2 ? `
        <div class="podium-card second">
          <div class="podium-rank-badge">🥈</div>
          <div class="podium-name">${escapeHtml(top2.name)}</div>
          <div class="podium-points">${top2.totalPoints || 0} ball</div>
          <div class="podium-sub">${top2.testsCount || 0} ta test • ${top2.totalCorrect || 0} ta to'g'ri</div>
        </div>
      ` : ''}

      <!-- 1-o'rin (Oltin) -->
      ${top1 ? `
        <div class="podium-card first">
          <div class="podium-rank-badge">🥇</div>
          <div class="podium-name">${escapeHtml(top1.name)}</div>
          <div class="podium-points">${top1.totalPoints || 0} ball</div>
          <div class="podium-sub">${top1.testsCount || 0} ta test • ${top1.totalCorrect || 0} ta to'g'ri</div>
        </div>
      ` : ''}

      <!-- 3-o'rin -->
      ${top3 ? `
        <div class="podium-card third">
          <div class="podium-rank-badge">🥉</div>
          <div class="podium-name">${escapeHtml(top3.name)}</div>
          <div class="podium-points">${top3.totalPoints || 0} ball</div>
          <div class="podium-sub">${top3.testsCount || 0} ta test • ${top3.totalCorrect || 0} ta to'g'ri</div>
        </div>
      ` : ''}
    `;
  }

  // To'liq jadval
  const tableBody = document.getElementById('leaderboard-table-body');
  if (tableBody) {
    tableBody.innerHTML = sorted.map((user, idx) => {
      const rank = idx + 1;
      let medal = `#${rank}`;
      if (rank === 1) medal = '🥇 1-o\'rin';
      else if (rank === 2) medal = '🥈 2-o\'rin';
      else if (rank === 3) medal = '🥉 3-o\'rin';

      const isCurrent = (currentUser && currentUser.id === user.id);

      return `
        <tr style="${isCurrent ? 'background: rgba(99, 102, 241, 0.12); font-weight: 700;' : ''}">
          <td style="font-weight: 800; font-size: 1.05rem;">${medal}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.65rem;">
              ${renderAvatarHTML(user, '28px')}
              <span>${escapeHtml(user.name)} ${isCurrent ? '<span style="color: var(--primary); font-size: 0.8rem;">(Siz)</span>' : ''}</span>
            </div>
          </td>
          <td>${user.testsCount || 0} ta</td>
          <td>${user.totalCorrect || 0} ta</td>
          <td><span class="points-pill">${user.totalPoints || 0} ball</span></td>
        </tr>
      `;
    }).join('');
  }
}

// ==========================================================
// 9. ADMIN PANEL (SAVOLLAR & FOYDALANUVCHILARNI KO'RISH)
// ==========================================================
function isAdminLoggedIn() {
  return localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
}

function openAdminLoginModal() {
  const modal = document.getElementById('admin-login-modal');
  if (modal) {
    modal.classList.remove('hidden');
    document.getElementById('admin-password-input').value = '';
    document.getElementById('admin-password-input').focus();
  }
}

function closeAdminLoginModal() {
  const modal = document.getElementById('admin-login-modal');
  if (modal) modal.classList.add('hidden');
}

function getAdminPassword() {
  return localStorage.getItem('infologik_admin_pass') || '12345';
}

function setAdminPassword(newPass) {
  localStorage.setItem('infologik_admin_pass', newPass);
}

function handleAdminLogin(e) {
  e.preventDefault();
  const pass = document.getElementById('admin-password-input').value;
  if (pass === getAdminPassword()) {
    localStorage.setItem(ADMIN_AUTH_KEY, 'true');
    closeAdminLoginModal();
    showToast("Admin panelga muvaffaqiyatli kirdingiz!");
    // Riddles tab ochiq bo'lsa, javoblar ko'rsatilishi uchun qayta render
    const riddlesSection = document.getElementById('section-riddles');
    if (riddlesSection && !riddlesSection.classList.contains('hidden')) {
      renderRiddles();
    } else {
      switchTab('admin');
    }
  } else {
    document.getElementById('admin-password-input').value = '';
    document.getElementById('admin-password-input').focus();
    showToast("❌ Admin paroli noto'g'ri! Qayta urinib ko'ring.");
  }
}

function logoutAdmin() {
  const confirmed = confirm("Admin paneldan chiqmoqchimisiz?");
  if (!confirmed) return;

  localStorage.removeItem(ADMIN_AUTH_KEY);
  updateAdminUI();
  showToast("Admin paneldan chiqildi.");

  // Riddles tab ochiq bo'lsa, javoblar berkitilishi uchun qayta render
  const riddlesSection = document.getElementById('section-riddles');
  if (riddlesSection && !riddlesSection.classList.contains('hidden')) {
    renderRiddles();
  } else {
    switchTab('home');
  }
}

function changeAdminPassword() {
  const currentPass = prompt("Amaldagi admin parolini kiriting:");
  if (currentPass === null) return;

  if (currentPass !== getAdminPassword()) {
    alert("Amaldagi parol noto'g'ri kiritildi!");
    return;
  }

  const newPass = prompt("Yangi admin parolini kiriting (kamida 4 ta belgi):");
  if (!newPass || newPass.trim().length < 4) {
    alert("Parol bekor qilindi yoki juda qisqa!");
    return;
  }

  setAdminPassword(newPass.trim());
  showToast("Admin paroli muvaffaqiyatli o'zgartirildi!");
}

// Admin panel ichki tablarini almashtirish
function switchAdminSubtab(subtabId) {
  document.querySelectorAll('.admin-subtab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.admin-subtab-content').forEach(c => c.classList.add('hidden'));

  const activeBtn = document.querySelector(`[data-subtab="${subtabId}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  const content = document.getElementById(`admin-subtab-${subtabId}`);
  if (content) content.classList.remove('hidden');

  if (subtabId === 'questions') {
    renderAdminTable();
  } else if (subtabId === 'users') {
    renderAdminUsersTable();
  }
}

// Admin savollar jadvalini chizish
function renderAdminTable() {
  const tbody = document.getElementById('admin-table-body');
  if (!tbody) return;

  const all = getAllQuestions();
  const search = document.getElementById('admin-search-input')?.value.toLowerCase().trim() || '';
  const filterCat = document.getElementById('admin-filter-cat')?.value || 'all';
  const filterType = document.getElementById('admin-filter-type')?.value || 'all';

  const filtered = all.filter(q => {
    const matchSearch = q.question.toLowerCase().includes(search) || 
                        (q.subcategory && q.subcategory.toLowerCase().includes(search));
    const matchCat = (filterCat === 'all' || q.category === filterCat);
    const matchType = (filterType === 'all' || q.type === filterType);
    return matchSearch && matchCat && matchType;
  });

  const countEl = document.getElementById('admin-total-badge');
  if (countEl) countEl.textContent = `${all.length} ta savol`;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          Savollar topilmadi.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(q => {
    const isQuiz = q.type === 'quiz';
    const pts = getQuestionPoints(q.difficulty);
    const catBadge = q.category === 'informatika' 
      ? '<span class="badge-tag badge-info">💻 IT</span>' 
      : '<span class="badge-tag badge-logic">🧠 Mantiq</span>';
    const typeBadge = isQuiz 
      ? '<span class="badge-tag badge-quiz">Test (Quiz)</span>' 
      : '<span class="badge-tag badge-riddle">Jumboq</span>';

    const answerPreview = isQuiz 
      ? `To'g'ri: <strong>${escapeHtml(q.options ? q.options[q.correctIndex] : '')}</strong> (+${pts} ball)` 
      : `Yechim: <em>${escapeHtml(q.answer ? q.answer.substring(0, 35) + '...' : '')}</em>`;

    return `
      <tr>
        <td style="color: var(--text-muted); font-size: 0.85rem;">#${q.id}</td>
        <td>${catBadge}</td>
        <td>${typeBadge}</td>
        <td style="max-width: 380px;">
          <div style="font-weight: 600; margin-bottom: 0.25rem;">${escapeHtml(q.question)}</div>
          <div style="font-size: 0.85rem; color: var(--text-secondary);">${answerPreview}</div>
        </td>
        <td style="text-transform: capitalize; font-size: 0.85rem;">${escapeHtml(q.difficulty || 'orta')}</td>
        <td>
          <div class="table-actions">
            <button class="btn-sm-edit" onclick="openEditModal(${q.id})" title="Tahrirlash">✏️ Tahrirlash</button>
            <button class="btn-sm-danger" onclick="deleteQuestion(${q.id})" title="O'chirish">🗑️ O'chirish</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Admin: Foydalanuvchilarni ko'rish jadvali
function renderAdminUsersTable() {
  const tbody = document.getElementById('admin-users-table-body');
  if (!tbody) return;

  const allUsers = getAllUsers();
  const search = document.getElementById('admin-users-search')?.value.toLowerCase().trim() || '';

  const sorted = [...allUsers].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));

  const filtered = sorted.filter(u => {
    return (u.name && u.name.toLowerCase().includes(search)) ||
           (u.phone && u.phone.toLowerCase().includes(search)) ||
           (u.googleEmail && u.googleEmail.toLowerCase().includes(search));
  });

  const countBadge = document.getElementById('admin-users-total-badge');
  if (countBadge) countBadge.textContent = `${allUsers.length} ta foydalanuvchi`;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          Foydalanuvchilar topilmadi.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((u, idx) => {
    const rank = idx + 1;
    return `
      <tr>
        <td style="font-weight: 800;">#${rank}</td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            ${renderAvatarHTML(u, '30px')}
            <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
              <strong>${escapeHtml(u.name)}</strong>
              ${u.isAdmin ? '<span style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; font-size: 0.7rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(245, 158, 11, 0.4);">👑 ADMIN</span>' : ''}
            </div>
          </div>
        </td>
        <td>${escapeHtml(u.phone || 'Kiritilmagan')}</td>
        <td>
          ${u.googleEmail ? `<span style="color: var(--secondary); font-size: 0.9rem;">${escapeHtml(u.googleEmail)}</span>` : '<span style="color: var(--text-muted);">-</span>'}
        </td>
        <td><span class="points-pill">${u.totalPoints || 0} ball</span></td>
        <td>${u.testsCount || 0} ta</td>
        <td>
          <button class="btn-sm-danger" onclick="deleteUser('${u.id}')" title="O'chirish">🗑️ O'chirish</button>
        </td>
      </tr>
    `;
  }).join('');
}

// Admin: Foydalanuvchini o'chirish
function deleteUser(userId) {
  const allUsers = getAllUsers();
  const target = allUsers.find(u => u.id === userId);
  if (!target) return;

  const confirmed = confirm(`Haqiqatan ham "${target.name}" foydalanuvchisini o'chirmoqchimisiz?`);
  if (!confirmed) return;

  const updated = allUsers.filter(u => u.id !== userId);
  saveAllUsers(updated);

  // Agar o'chirilgan foydalanuvchi joriy kirib turgan odam bo'lsa
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    localStorage.removeItem(USER_STORAGE_KEY);
    updateUserUI();
  }

  showToast("Foydalanuvchi muvaffaqiyatli o'chirildi!");
  renderAdminUsersTable();
  renderLeaderboard();
}

// Savolni o'chirish
function deleteQuestion(id) {
  const all = getAllQuestions();
  const target = all.find(q => q.id === id);
  if (!target) return;

  const confirmed = confirm(`Haqiqatan ham "${target.question.substring(0, 40)}..." savolini o'chirmoqchimisiz?`);
  if (!confirmed) return;

  const updated = all.filter(q => q.id !== id);
  saveAllQuestions(updated);
  showToast("Savol muvaffaqiyatli o'chirildi!");
}

// Standart savollarga qaytarish
function resetToDefaultQuestions() {
  const confirmed = confirm("Barcha savollarni dastlabki holatga qaytarishni xohlaysizmi?");
  if (!confirmed) return;

  localStorage.removeItem(DB_STORAGE_KEY);
  getAllQuestions();
  showToast("Savollar bazasi dastlabki holatga qaytarildi!");
  renderAdminTable();
  updateHomeStats();
}

// Savollarni JSON fayl sifatida yuklab olish
function exportQuestionsJSON() {
  const all = getAllQuestions();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(all, null, 2));
  const dlAnchorElem = document.createElement('a');
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", `infologik_savollar_${Date.now()}.json`);
  dlAnchorElem.click();
  showToast("Barcha savollar JSON fayl sifatida yuklab olindi!");
}

// ==========================================================
// 10. ADD & EDIT QUESTION MODAL
// ==========================================================
let editingQuestionId = null;

function openAddModal() {
  editingQuestionId = null;
  document.getElementById('modal-title').textContent = "Yangi savol qo'shish";
  document.getElementById('question-form').reset();
  document.getElementById('editing-id').value = '';
  toggleFormTypeFields();
  document.getElementById('question-modal').classList.remove('hidden');
}

function openEditModal(id) {
  const all = getAllQuestions();
  const q = all.find(item => item.id === id);
  if (!q) return;

  editingQuestionId = id;
  document.getElementById('modal-title').textContent = "Savolni tahrirlash (#" + id + ")";
  document.getElementById('editing-id').value = id;

  document.getElementById('form-type').value = q.type || 'quiz';
  document.getElementById('form-cat').value = q.category || 'informatika';
  document.getElementById('form-diff').value = q.difficulty || 'orta';
  document.getElementById('form-subcat').value = q.subcategory || '';
  document.getElementById('form-question-text').value = q.question || '';

  toggleFormTypeFields();

  if (q.type === 'quiz') {
    document.getElementById('form-opt-0').value = (q.options && q.options[0]) || '';
    document.getElementById('form-opt-1').value = (q.options && q.options[1]) || '';
    document.getElementById('form-opt-2').value = (q.options && q.options[2]) || '';
    document.getElementById('form-opt-3').value = (q.options && q.options[3]) || '';
    document.getElementById('form-correct-idx').value = q.correctIndex !== undefined ? q.correctIndex : 0;
    document.getElementById('form-explanation').value = q.explanation || '';
  } else {
    document.getElementById('form-hint').value = q.hint || '';
    document.getElementById('form-riddle-ans').value = q.answer || '';
  }

  document.getElementById('question-modal').classList.remove('hidden');
}

function closeQuestionModal() {
  document.getElementById('question-modal').classList.add('hidden');
}

function toggleFormTypeFields() {
  const type = document.getElementById('form-type').value;
  const quizFields = document.getElementById('quiz-specific-fields');
  const riddleFields = document.getElementById('riddle-specific-fields');

  if (type === 'quiz') {
    quizFields.classList.remove('hidden');
    riddleFields.classList.add('hidden');
    document.getElementById('form-opt-0').required = true;
    document.getElementById('form-opt-1').required = true;
    document.getElementById('form-opt-2').required = true;
    document.getElementById('form-opt-3').required = true;
    document.getElementById('form-riddle-ans').required = false;
  } else {
    quizFields.classList.add('hidden');
    riddleFields.classList.remove('hidden');
    document.getElementById('form-opt-0').required = false;
    document.getElementById('form-opt-1').required = false;
    document.getElementById('form-opt-2').required = false;
    document.getElementById('form-opt-3').required = false;
    document.getElementById('form-riddle-ans').required = true;
  }
}

function handleQuestionFormSubmit(e) {
  e.preventDefault();

  const type = document.getElementById('form-type').value;
  const category = document.getElementById('form-cat').value;
  const difficulty = document.getElementById('form-diff').value;
  const subcategory = document.getElementById('form-subcat').value.trim() || 'Umumiy';
  const question = document.getElementById('form-question-text').value.trim();

  let questionObject = {
    id: editingQuestionId ? editingQuestionId : Date.now(),
    type,
    category,
    difficulty,
    subcategory,
    question
  };

  if (type === 'quiz') {
    questionObject.options = [
      document.getElementById('form-opt-0').value.trim(),
      document.getElementById('form-opt-1').value.trim(),
      document.getElementById('form-opt-2').value.trim(),
      document.getElementById('form-opt-3').value.trim()
    ];
    questionObject.correctIndex = parseInt(document.getElementById('form-correct-idx').value, 10);
    questionObject.explanation = document.getElementById('form-explanation').value.trim() || "Izoh mavjud emas.";
  } else {
    questionObject.hint = document.getElementById('form-hint').value.trim();
    questionObject.answer = document.getElementById('form-riddle-ans').value.trim();
  }

  const all = getAllQuestions();

  if (editingQuestionId) {
    const index = all.findIndex(q => q.id === editingQuestionId);
    if (index !== -1) {
      all[index] = questionObject;
      showToast("Savol muvaffaqiyatli tahrirlandi!");
    }
  } else {
    all.unshift(questionObject);
    showToast("Yangi savol muvaffaqiyatli qo'shildi!");
  }

  saveAllQuestions(all);
  closeQuestionModal();
}

// ==========================================================
// 10b. TOURNAMENT MODE (MUSOBAQA REJIMI)
// ==========================================================

let tTotalSeconds = 180; // 3 daqiqa = 180 soniya
let tTimeLeft = 180;
let tTimerInterval = null;
let tQuestions = [];
let tCurrentIndex = 0;
let tScore = 0;
let tCorrectCount = 0;
let tStreak = 0;
let tMaxStreak = 0;
let tIsAnswered = false;
let tSelectedDiff = 'all';
let tQuestionStartTime = 0;

function selectTournamentDiff(el, diff) {
  tSelectedDiff = diff;
  document.querySelectorAll('.tdiff-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}

function getTournamentScores() {
  try {
    return JSON.parse(localStorage.getItem(TOURNAMENT_SCORES_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function saveTournamentScore(entry) {
  let scores = getTournamentScores();
  const existIdx = scores.findIndex(s => s.userId === entry.userId);
  if (existIdx !== -1) {
    if (entry.score > scores[existIdx].score) {
      scores[existIdx] = entry;
    }
  } else {
    scores.push(entry);
  }
  scores.sort((a, b) => b.score - a.score);
  localStorage.setItem(TOURNAMENT_SCORES_KEY, JSON.stringify(scores));
  renderTournamentLeaderboard();
}

function renderTournamentLeaderboard() {
  const container = document.getElementById('tournament-leaderboard-container');
  if (!container) return;

  const scores = getTournamentScores().slice(0, 10);
  const currentUser = getCurrentUser();

  if (scores.length === 0) {
    container.innerHTML = `
      <div class="t-lb-empty">
        <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🏆</div>
        <p>Hali hech kim musobaqada qatnashmagan.</p>
        <p style="color: var(--text-muted);">Birinchi bo'ling!</p>
      </div>`;
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  const allUsersList = getAllUsers();
  container.innerHTML = `
    <div class="t-lb-table">
      ${scores.map((s, i) => {
        const isMe = currentUser && s.userId === currentUser.id;
        const uObj = allUsersList.find(u => u.id === s.userId) || { name: s.name };
        return `
          <div class="t-lb-row ${isMe ? 't-lb-row-me' : ''}">
            <div class="t-lb-rank">${medals[i] || `#${i + 1}`}</div>
            <div class="t-lb-name">
              ${renderAvatarHTML(uObj, '32px')}
              <span>${escapeHtml(s.name)} ${isMe ? '<span style="color: var(--primary); font-size: 0.75rem;">(Siz)</span>' : ''}</span>
            </div>
            <div class="t-lb-score">${s.score} ball</div>
            <div class="t-lb-streak">🔥 ${s.maxStreak}</div>
          </div>`;
      }).join('')}
    </div>`;
}

function getStreakMultiplier(streak) {
  if (streak >= 7) return 2.5;
  if (streak >= 5) return 2.0;
  if (streak >= 3) return 1.5;
  return 1.0;
}

function showTournamentStreakPopup(streak, multiplier) {
  const popup = document.getElementById('t-streak-popup');
  if (!popup) return;

  let msg = '';
  if (streak >= 7) msg = `🔥🔥🔥 ${streak} ta ketma-ket! x${multiplier} Mega Bonus!`;
  else if (streak >= 5) msg = `🔥🔥 ${streak} ta ketma-ket! x${multiplier} Bonus!`;
  else if (streak >= 3) msg = `🔥 ${streak} ta ketma-ket! x${multiplier} Streak!`;
  if (!msg) return;

  popup.textContent = msg;
  popup.classList.remove('hidden');
  popup.classList.add('t-popup-animate');

  clearTimeout(popup._timeout);
  popup._timeout = setTimeout(() => {
    popup.classList.add('hidden');
    popup.classList.remove('t-popup-animate');
  }, 2000);
}

function startTournament() {
  if (!getCurrentUser()) {
    openAuthModal();
    return;
  }

  let list = getAllQuestions().filter(q => q.type === 'quiz');
  if (tSelectedDiff !== 'all') {
    list = list.filter(q => q.difficulty === tSelectedDiff);
  }

  if (list.length < 3) {
    showToast('Yetarli savollar mavjud emas. Avval savollar qo\'shilsin!');
    return;
  }

  // Savollarni aralashtirish
  tQuestions = [...list].sort(() => 0.5 - Math.random());
  tCurrentIndex = 0;
  tScore = 0;
  tCorrectCount = 0;
  tStreak = 0;
  tMaxStreak = 0;
  tIsAnswered = false;
  tTimeLeft = tTotalSeconds;

  // View switching
  document.getElementById('tournament-intro-view').classList.add('hidden');
  document.getElementById('tournament-quiz-view').classList.remove('hidden');
  document.getElementById('tournament-results-view').classList.add('hidden');

  // Update score display
  updateTournamentDisplay();

  // Start countdown timer
  startTournamentTimer();

  // Load first question
  loadTournamentQuestion();
}

function startTournamentTimer() {
  clearInterval(tTimerInterval);
  const circleEl = document.getElementById('t-timer-circle');
  const totalDash = 188.5;

  tTimerInterval = setInterval(() => {
    tTimeLeft--;
    updateTournamentTimerUI();

    // Circle animation
    if (circleEl) {
      const offset = totalDash * (1 - tTimeLeft / tTotalSeconds);
      circleEl.style.strokeDashoffset = offset;
      // Color change as time runs out
      if (tTimeLeft <= 30) {
        circleEl.style.stroke = 'var(--error, #ef4444)';
      } else if (tTimeLeft <= 60) {
        circleEl.style.stroke = '#f59e0b';
      } else {
        circleEl.style.stroke = 'var(--accent)';
      }
    }

    if (tTimeLeft <= 0) {
      clearInterval(tTimerInterval);
      endTournament();
    }
  }, 1000);
}

function updateTournamentTimerUI() {
  const el = document.getElementById('t-timer-seconds');
  if (!el) return;
  const mins = Math.floor(tTimeLeft / 60);
  const secs = tTimeLeft % 60;
  el.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updateTournamentDisplay() {
  const scoreEl = document.getElementById('t-score-val');
  const streakEl = document.getElementById('t-streak-count');
  const streakDisp = document.getElementById('t-streak-display');
  if (scoreEl) scoreEl.textContent = tScore;
  if (streakEl) streakEl.textContent = tStreak;
  if (streakDisp) {
    streakDisp.style.opacity = tStreak > 0 ? '1' : '0.4';
    if (tStreak >= 5) streakDisp.style.color = '#f59e0b';
    else if (tStreak >= 3) streakDisp.style.color = 'var(--accent)';
    else streakDisp.style.color = '';
  }
}

function loadTournamentQuestion() {
  tIsAnswered = false;
  tQuestionStartTime = Date.now();

  if (tCurrentIndex >= tQuestions.length) {
    // Savollar tugagan, qayta aralash
    tQuestions = [...getAllQuestions()
      .filter(q => q.type === 'quiz' && (tSelectedDiff === 'all' || q.difficulty === tSelectedDiff))]
      .sort(() => 0.5 - Math.random());
    tCurrentIndex = 0;
  }

  const q = tQuestions[tCurrentIndex];
  const pts = getQuestionPoints(q.difficulty);
  const mult = getStreakMultiplier(tStreak);

  // Question text
  document.getElementById('t-question-text').textContent = q.question;

  // Points badge
  const ptsBadge = document.getElementById('t-pts-badge');
  if (ptsBadge) {
    const displayPts = Math.round(pts * mult);
    ptsBadge.textContent = `+${displayPts}`;
    ptsBadge.style.background = mult >= 2 ? 'linear-gradient(135deg, #f59e0b, #ef4444)' :
                                mult >= 1.5 ? 'linear-gradient(135deg, var(--accent), #8b5cf6)' :
                                'linear-gradient(135deg, var(--primary), var(--accent))';
  }

  // Category badge
  const catBadge = document.getElementById('t-cat-badge');
  if (catBadge) {
    catBadge.textContent = `${q.category === 'informatika' ? '💻' : '🧠'} ${q.subcategory || 'Umumiy'}`;
  }

  // Question counter
  const numEl = document.getElementById('t-question-num');
  if (numEl) numEl.textContent = `${tCurrentIndex + 1} savol`;

  // Hide explanation
  const expl = document.getElementById('t-explanation');
  if (expl) expl.classList.add('hidden');

  // Build options
  const container = document.getElementById('t-options-container');
  container.innerHTML = '';
  const labels = ['A', 'B', 'C', 'D'];
  q.options.forEach((optText, idx) => {
    const btn = document.createElement('button');
    btn.className = 'opt-btn';
    btn.innerHTML = `
      <span class="opt-index">${labels[idx]}</span>
      <span class="opt-text">${escapeHtml(optText)}</span>
    `;
    btn.addEventListener('click', () => selectTournamentAnswer(idx));
    container.appendChild(btn);
  });

  // Progress bar (time-based, continuous)
  const pb = document.getElementById('t-progress-bar');
  if (pb) pb.style.width = `${(tTimeLeft / tTotalSeconds) * 100}%`;
}

function selectTournamentAnswer(selectedIndex) {
  if (tIsAnswered) return;
  tIsAnswered = true;

  const q = tQuestions[tCurrentIndex];
  const pts = getQuestionPoints(q.difficulty);
  const isCorrect = (selectedIndex === q.correctIndex);

  const optionBtns = document.querySelectorAll('#t-options-container .opt-btn');
  optionBtns.forEach(b => b.disabled = true);

  if (isCorrect) {
    tStreak++;
    tCorrectCount++;
    if (tStreak > tMaxStreak) tMaxStreak = tStreak;

    const mult = getStreakMultiplier(tStreak);

    // Speed bonus: answered within 10 seconds
    const elapsed = (Date.now() - tQuestionStartTime) / 1000;
    const speedBonus = elapsed <= 10 ? 1.5 : 1.0;
    const finalMult = mult * speedBonus;
    const earned = Math.round(pts * finalMult);

    tScore += earned;

    playSound('correct');
    optionBtns[selectedIndex].classList.add('correct');

    // Show streak popup
    showTournamentStreakPopup(tStreak, mult);

    let explMsg = `+${earned} ball`;
    if (mult > 1 && speedBonus > 1) explMsg += ` (x${mult} streak + ⚡ tez javob!)`;
    else if (mult > 1) explMsg += ` (x${mult} streak bonus!)`;
    else if (speedBonus > 1) explMsg += ` (⚡ tez javob +50%)`;

    showTournamentExplanation(q.explanation || '', `✅ To'g'ri! ${explMsg}`);
  } else {
    tStreak = 0;
    playSound('wrong');
    optionBtns[selectedIndex].classList.add('incorrect');
    if (optionBtns[q.correctIndex]) optionBtns[q.correctIndex].classList.add('correct');
    showTournamentExplanation(q.explanation || '', '❌ Noto\'g\'ri! Streak tiklandi.');
  }

  updateTournamentDisplay();
}

function showTournamentExplanation(text, statusTitle) {
  const expl = document.getElementById('t-explanation');
  const titleEl = document.getElementById('t-expl-title');
  const textEl = document.getElementById('t-expl-text');
  if (expl) expl.classList.remove('hidden');
  if (titleEl) titleEl.textContent = statusTitle;
  if (textEl) textEl.textContent = text;
}

function nextTournamentQuestion() {
  tCurrentIndex++;
  loadTournamentQuestion();
  updateTournamentDisplay();
}

function endTournament() {
  clearInterval(tTimerInterval);

  // Hide quiz view, show results
  document.getElementById('tournament-quiz-view').classList.add('hidden');
  document.getElementById('tournament-results-view').classList.remove('hidden');

  const currentUser = getCurrentUser();

  // Get old best score
  const prevScores = getTournamentScores();
  const prevBest = prevScores.find(s => currentUser && s.userId === currentUser.id);
  const isNewRecord = !prevBest || tScore > prevBest.score;

  // Update tournament leaderboard
  if (currentUser) {
    const entry = {
      userId: currentUser.id,
      name: currentUser.name,
      score: tScore,
      correctCount: tCorrectCount,
      maxStreak: tMaxStreak,
      date: new Date().toISOString().split('T')[0]
    };
    saveTournamentScore(entry);

    // Also add points to general profile
    currentUser.totalPoints = (currentUser.totalPoints || 0) + tScore;
    currentUser.totalCorrect = (currentUser.totalCorrect || 0) + tCorrectCount;
    currentUser.testsCount = (currentUser.testsCount || 0) + 1;
    saveCurrentUser(currentUser);
  }

  // Calculate rank
  const updatedScores = getTournamentScores();
  const rank = updatedScores.findIndex(s => currentUser && s.userId === currentUser.id) + 1;

  // Medal
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const medal = medals[rank] || (rank <= 10 ? '🏅' : '⚡');
  document.getElementById('t-medal-wrap').textContent = medal;

  // Results
  document.getElementById('t-res-score').textContent = tScore;
  document.getElementById('t-res-correct').textContent = tCorrectCount;
  document.getElementById('t-res-streak').textContent = tMaxStreak;
  document.getElementById('t-res-rank').textContent = rank > 0 ? `#${rank}` : '#-';

  // Subtitle messages
  const subtitleEl = document.getElementById('t-results-subtitle');
  if (tScore === 0) {
    subtitleEl.textContent = '😅 Keyingi safar yaxshiroq bo\'ladi!';
  } else if (rank === 1) {
    subtitleEl.textContent = '🏆 Siz 1-o\'rinsiz! Ajoyib musobaqa!';
  } else if (tCorrectCount >= 10) {
    subtitleEl.textContent = '🌟 Zo\'r natija! Siz musobaqa ustasisiz!';
  } else if (tCorrectCount >= 5) {
    subtitleEl.textContent = '👍 Yaxshi musobaqa! Davom eting!';
  } else {
    subtitleEl.textContent = '💪 Mashq qiling va rekord yangilang!';
  }

  // New record banner
  const recordBanner = document.getElementById('t-new-record-banner');
  if (isNewRecord && tScore > 0 && recordBanner) {
    recordBanner.classList.remove('hidden');
  } else if (recordBanner) {
    recordBanner.classList.add('hidden');
  }
}

function exitTournament() {
  clearInterval(tTimerInterval);
  document.getElementById('tournament-intro-view').classList.remove('hidden');
  document.getElementById('tournament-quiz-view').classList.add('hidden');
  document.getElementById('tournament-results-view').classList.add('hidden');
  renderTournamentLeaderboard();
  switchTab('home');
}

// Xavfsiz HTML escape

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}

// ==========================================================
// 11. EVENT LISTENERS INITIALIZATION
// ==========================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  getAllQuestions();
  getAllUsers();
  updateHomeStats();
  renderLeaderboard();
  checkAuthEnforcement(); // Majburiy tekshirish: kirmagan bo'lsa modal chiqadi, kirgan bo'lsa avto o'zinikiga kiradi

  // Theme toggle
  document.getElementById('btn-toggle-theme')?.addEventListener('click', toggleTheme);

  // Logo click
  document.getElementById('site-logo')?.addEventListener('click', () => {
    switchTab('home');
    exitQuiz();
  });

  // Tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  // Admin button in header
  document.getElementById('btn-header-admin')?.addEventListener('click', () => {
    switchTab('admin');
  });

  // User Auth & Profile buttons
  document.getElementById('btn-header-auth')?.addEventListener('click', openAuthModal);
  document.getElementById('header-user-badge')?.addEventListener('click', openProfileModal);
  document.getElementById('btn-close-auth-modal')?.addEventListener('click', closeAuthModal);
  document.getElementById('auth-form')?.addEventListener('submit', handleRegisterSubmit);
  document.getElementById('btn-google-signin')?.addEventListener('click', handleGoogleAuth);

  document.getElementById('btn-close-profile-modal')?.addEventListener('click', closeProfileModal);
  document.getElementById('btn-profile-logout')?.addEventListener('click', logoutUser);

  // Quiz navigation buttons
  document.getElementById('btn-next-question')?.addEventListener('click', nextQuestion);
  document.getElementById('btn-exit-quiz')?.addEventListener('click', exitQuiz);
  document.getElementById('btn-restart-quiz')?.addEventListener('click', () => {
    startQuiz('all', 'all');
  });
  document.getElementById('btn-back-home')?.addEventListener('click', exitQuiz);

  // Riddles filters
  document.getElementById('riddle-filter-cat')?.addEventListener('change', renderRiddles);
  document.getElementById('riddle-filter-diff')?.addEventListener('change', renderRiddles);
  document.getElementById('riddle-search')?.addEventListener('input', renderRiddles);

  // Admin subtabs
  document.querySelectorAll('.admin-subtab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sub = btn.getAttribute('data-subtab');
      switchAdminSubtab(sub);
    });
  });

  // Admin table filters
  document.getElementById('admin-search-input')?.addEventListener('input', renderAdminTable);
  document.getElementById('admin-filter-cat')?.addEventListener('change', renderAdminTable);
  document.getElementById('admin-filter-type')?.addEventListener('change', renderAdminTable);
  document.getElementById('admin-users-search')?.addEventListener('input', renderAdminUsersTable);

  // Admin actions
  document.getElementById('btn-admin-add-q')?.addEventListener('click', openAddModal);
  document.getElementById('btn-admin-change-pass')?.addEventListener('click', changeAdminPassword);
  document.getElementById('btn-admin-reset')?.addEventListener('click', resetToDefaultQuestions);
  document.getElementById('btn-admin-export')?.addEventListener('click', exportQuestionsJSON);
  document.getElementById('btn-admin-logout')?.addEventListener('click', logoutAdmin);

  // Question Modal actions
  document.getElementById('btn-close-modal')?.addEventListener('click', closeQuestionModal);
  document.getElementById('form-type')?.addEventListener('change', toggleFormTypeFields);
  document.getElementById('question-form')?.addEventListener('submit', handleQuestionFormSubmit);

  // Admin login modal
  document.getElementById('admin-login-form')?.addEventListener('submit', handleAdminLogin);
  document.getElementById('btn-close-login-modal')?.addEventListener('click', closeAdminLoginModal);

  // Yangi Auth Modal ichidagi Admin forma
  document.getElementById('auth-admin-form')?.addEventListener('submit', handleAuthAdminLogin);
  document.getElementById('btn-header-admin')?.addEventListener('click', () => switchTab('admin'));

  // Admin UI holatini tekshirish (faqat admin bo'lib kirganda ko'rinadi)
  updateAdminUI();

  // Tournament init
  renderTournamentLeaderboard();
});

// Muallif kartochkasiga silliq scroll qilish
function scrollToAuthor() {
  const el = document.getElementById('section-creator');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const card = el.querySelector('.creator-card');
    if (card) {
      card.style.borderColor = 'var(--primary)';
      card.style.boxShadow = '0 0 45px rgba(99, 102, 241, 0.6)';
      setTimeout(() => {
        card.style.borderColor = '';
        card.style.boxShadow = '';
      }, 1800);
    }
  }
}
