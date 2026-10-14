// Sistema de ressenyes (nom, data i estrelles) amb Firebase Firestore (SDK modular via import() dinàmic).
// Script normal: funciona també obrint index.html directament.

const firebaseConfig = {
  apiKey: "AIzaSyBzya9u7HLzXJ1ptHSJ06y62c6XU_6Skn4",
  authDomain: "roc-riera-barberia.firebaseapp.com",
  projectId: "roc-riera-barberia",
  storageBucket: "roc-riera-barberia.firebasestorage.app",
  messagingSenderId: "775166125531",
  appId: "1:775166125531:web:a3f84a5688f7f5c2d3f3fe",
};

const MAX_NAME_LENGTH = 40;
const SHOW_LATEST = 3; // reseñas que es mostren
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 1 ressenya per dispositiu cada 24 h
const STORAGE_KEY = "lastReviewAt";
const SDK = "https://www.gstatic.com/firebasejs/10.14.1";

// ---------- Elements ----------
const form = document.getElementById("reviewForm");
const nameInput = document.getElementById("reviewName");
const honeypot = document.getElementById("reviewWeb");
const starInput = document.getElementById("starInput");
const statusEl = document.getElementById("reviewStatus");
const submitBtn = document.getElementById("reviewSubmit");
const listEl = document.getElementById("reviewList");
const summaryEl = document.getElementById("reviewSummary");

let selectedRating = 0;
let fb = null; // SDK de Firebase (es carrega a init())
let reviewsCol = null;

// ---------- Helpers ----------
function starsText(n) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = "review-status" + (type ? " " + type : "");
}

function formatDate(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== "function") return "";
  return timestamp.toDate().toLocaleDateString("ca-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function safeStorage(action, key, value) {
  try {
    return action === "get" ? localStorage.getItem(key) : localStorage.setItem(key, value);
  } catch {
    return null;
  }
}

// ---------- Selector d'estrelles ----------
function buildStarInput() {
  starInput.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "star-btn";
    btn.dataset.value = i;
    btn.textContent = "★";
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", "false");
    btn.setAttribute("aria-label", `${i} ${i === 1 ? "estrella" : "estrelles"}`);
    btn.addEventListener("click", () => selectRating(i));
    btn.addEventListener("mouseenter", () => paintStars(i));
    starInput.appendChild(btn);
  }
  starInput.addEventListener("mouseleave", () => paintStars(selectedRating));
}

function paintStars(value) {
  starInput.querySelectorAll(".star-btn").forEach((btn) => {
    btn.classList.toggle("on", Number(btn.dataset.value) <= value);
  });
}

function selectRating(value) {
  selectedRating = value;
  paintStars(value);
  starInput.querySelectorAll(".star-btn").forEach((btn) => {
    btn.setAttribute("aria-checked", String(Number(btn.dataset.value) === value));
  });
}

// ---------- Resum i llistat ----------
function renderSummary(avg, total) {
  summaryEl.innerHTML = "";
  if (!total || avg === null) return;

  const big = document.createElement("span");
  big.className = "summary-score";
  big.textContent = avg.toFixed(1).replace(".", ",");

  const stars = document.createElement("span");
  stars.className = "review-stars";
  stars.textContent = starsText(Math.round(avg));

  const count = document.createElement("span");
  count.className = "summary-count";
  count.textContent = `${total} ${total === 1 ? "ressenya" : "ressenyes"}`;

  summaryEl.append(big, stars, count);
}

function renderReviews(reviews) {
  listEl.innerHTML = "";

  if (!reviews.length) {
    const empty = document.createElement("p");
    empty.className = "review-empty";
    empty.textContent = "Encara no hi ha cap ressenya. Sigues el primer!";
    listEl.appendChild(empty);
    return;
  }

  reviews.forEach((r) => {
    const card = document.createElement("article");
    card.className = "review-card";

    const name = document.createElement("strong");
    name.className = "review-name";
    name.textContent = r.name; // textContent: evita injecció d'HTML

    const stars = document.createElement("span");
    stars.className = "review-stars";
    stars.textContent = starsText(r.rating);
    stars.setAttribute("aria-label", `${r.rating} de 5 estrelles`);

    const date = document.createElement("time");
    date.className = "review-date";
    date.textContent = formatDate(r.createdAt);

    card.append(name, stars, date);
    listEl.appendChild(card);
  });
}

async function loadReviews() {
  const { query, orderBy, limit, getDocs, getAggregateFromServer, count, average } = fb;
  try {
    // Les últimes N ressenyes + total i mitjana reals, calculats pel servidor
    const [latestSnap, statsSnap] = await Promise.all([
      getDocs(query(reviewsCol, orderBy("createdAt", "desc"), limit(SHOW_LATEST))),
      getAggregateFromServer(reviewsCol, { total: count(), avg: average("rating") }),
    ]);

    const { total, avg } = statsSnap.data();
    renderSummary(avg, total);
    renderReviews(latestSnap.docs.map((d) => d.data()));
  } catch (err) {
    console.error("No s'han pogut carregar les ressenyes:", err);
    listEl.innerHTML = "";
    const msg = document.createElement("p");
    msg.className = "review-empty";
    msg.textContent = "No s'han pogut carregar les ressenyes.";
    listEl.appendChild(msg);
  }
}

// ---------- Enviament ----------
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (honeypot.value) return; // bot
  if (!fb) return setStatus("Encara s'està carregant. Prova-ho d'aquí un moment.", "error");

  const name = nameInput.value.trim().replace(/\s+/g, " ");

  if (!name) return setStatus("Escriu el teu nom.", "error");
  if (name.length > MAX_NAME_LENGTH) return setStatus(`El nom és massa llarg (màx. ${MAX_NAME_LENGTH}).`, "error");
  if (!selectedRating) return setStatus("Tria quantes estrelles dones.", "error");

  const last = Number(safeStorage("get", STORAGE_KEY));
  if (last && Date.now() - last < COOLDOWN_MS) {
    return setStatus("Ja has enviat una ressenya fa poc. Gràcies!", "error");
  }

  submitBtn.disabled = true;
  setStatus("Enviant…");

  try {
    await fb.addDoc(reviewsCol, {
      name,
      rating: selectedRating,
      createdAt: fb.serverTimestamp(),
    });
    safeStorage("set", STORAGE_KEY, String(Date.now()));
    form.reset();
    selectRating(0);
    setStatus("Gràcies per la teva ressenya!", "ok");
    await loadReviews();
  } catch (err) {
    console.error("Error enviant la ressenya:", err);
    setStatus("No s'ha pogut enviar. Torna-ho a provar.", "error");
  } finally {
    submitBtn.disabled = false;
  }
});

// ---------- Inici ----------
async function init() {
  nameInput.maxLength = MAX_NAME_LENGTH;
  buildStarInput(); // les estrelles apareixen encara que Firebase trigui

  try {
    const [app, fs] = await Promise.all([
      import(`${SDK}/firebase-app.js`),
      import(`${SDK}/firebase-firestore.js`),
    ]);
    fb = fs;
    const db = fs.getFirestore(app.initializeApp(firebaseConfig));
    reviewsCol = fs.collection(db, "reviews");
    await loadReviews();
  } catch (err) {
    console.error("No s'ha pogut carregar Firebase:", err);
    listEl.textContent = "No s'han pogut carregar les ressenyes.";
  }
}

init();
