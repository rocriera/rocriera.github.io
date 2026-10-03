// Sistema de ressenyes (nom, data i estrelles) amb Firebase Firestore (SDK compat).
// Es carrega com a script normal, així funciona també obrint index.html directament.

const firebaseConfig = {
  apiKey: "AIzaSyBzya9u7HLzXJ1ptHSJ06y62c6XU_6Skn4",
  authDomain: "roc-riera-barberia.firebaseapp.com",
  projectId: "roc-riera-barberia",
  storageBucket: "roc-riera-barberia.firebasestorage.app",
  messagingSenderId: "775166125531",
  appId: "1:775166125531:web:a3f84a5688f7f5c2d3f3fe",
};

const MAX_NAME_LENGTH = 40;
const MAX_REVIEWS = 100;
const COOLDOWN_MS = 168 * 60 * 60 * 1000; // 1 ressenya per dispositiu cada 168 h
const STORAGE_KEY = "lastReviewAt";

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const reviewsCol = db.collection("reviews");

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

// ---------- Llistat ----------
function renderSummary(reviews) {
  if (!reviews.length) {
    summaryEl.textContent = "";
    return;
  }
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  summaryEl.innerHTML = "";

  const big = document.createElement("span");
  big.className = "summary-score";
  big.textContent = avg.toFixed(1).replace(".", ",");

  const stars = document.createElement("span");
  stars.className = "review-stars";
  stars.textContent = starsText(Math.round(avg));

  const count = document.createElement("span");
  count.className = "summary-count";
  count.textContent = `${reviews.length} ${reviews.length === 1 ? "ressenya" : "ressenyes"}`;

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
  try {
    const snap = await reviewsCol.orderBy("createdAt", "desc").limit(MAX_REVIEWS).get();
    const reviews = snap.docs.map((d) => d.data());
    renderSummary(reviews);
    renderReviews(reviews);
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
    await reviewsCol.add({
      name,
      rating: selectedRating,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
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
nameInput.maxLength = MAX_NAME_LENGTH;
buildStarInput();
loadReviews();
