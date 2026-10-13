// Sistema de punts de fidelització (v1).
// Els punts es guarden al navegador del client (localStorage).
// Ajustos a config.js -> SITE_CONFIG.loyalty. Ha de carregar-se DESPRÉS de config.js.

(() => {
  const DEFAULTS = {
    enabled: true,
    pointsPerBooking: 10,
    pointsPerReview: 2,
    rewardThreshold: 100,
    requireConfirmation: true,
    visitCode: 'ROC',
    rewardValidDays: 60,
  };

  const userCfg = (typeof SITE_CONFIG !== 'undefined' && SITE_CONFIG.loyalty) || {};
  const cfg = { ...DEFAULTS, ...userCfg };
  if (!cfg.enabled) return;

  const KEY = 'roc_loyalty_v1';
  const DAY_MS = 24 * 60 * 60 * 1000;

  const emptyState = () => ({ points: 0, pending: [], seen: [], rewards: [] });

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY));
      if (data && typeof data === 'object') return { ...emptyState(), ...data };
    } catch {
      // storage bloquejat o JSON corrupte
    }
    return emptyState();
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // ignorar
    }
  }

  let state = load();
  let formMessage = '';

  function h(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function formatDate(ms) {
    return new Date(ms).toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function toast(big, small) {
    const old = document.querySelector('.loyalty-toast');
    if (old) old.remove();

    const el = h('div', 'loyalty-toast');
    el.setAttribute('role', 'status');
    el.append(h('span', 'loyalty-toast-big', big), h('span', 'loyalty-toast-small', small));
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }

  function award(id, points, reason) {
    if (state.seen.includes(id)) return false;

    state.seen.push(id);
    if (state.seen.length > 200) state.seen.shift();

    const pendingBooking = reason === 'booking' && cfg.requireConfirmation;
    if (pendingBooking) state.pending.push({ id, points, date: Date.now() });
    else state.points += points;

    save();
    render();
    toast(`+${points}`, pendingBooking ? 'R-Coins pendents de confirmar' : 'R-Coins');
    return true;
  }

  function confirmVisit(code) {
    if (!state.pending.length) return;
    if (code.trim().toUpperCase() !== String(cfg.visitCode).toUpperCase()) {
      formMessage = 'Codi incorrecte. Demana-li a en Roc.';
      render();
      return;
    }
    const total = state.pending.reduce((sum, p) => sum + p.points, 0);
    state.points += total;
    state.pending = [];
    formMessage = '';
    save();
    render();
    toast(`+${total}`, 'R-Coins confirmats');
  }

  function redeem() {
    if (state.points < cfg.rewardThreshold) return;
    state.points -= cfg.rewardThreshold;
    state.rewards.push({
      code: 'ROC-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      expires: Date.now() + cfg.rewardValidDays * DAY_MS,
    });
    save();
    render();
  }

  function render() {
    const root = document.getElementById('loyalty');
    if (!root) return;
    root.innerHTML = '';

    const card = h('div', 'loyalty-card');
    const threshold = cfg.rewardThreshold;
    const points = state.points;
    const pct = Math.min(100, Math.round((points / threshold) * 100));
    const ready = points >= threshold;

    card.appendChild(h('h2', 'loyalty-title', 'Els teus R-Coins'));

    const score = h('p', 'loyalty-score');
    score.append(h('strong', '', String(points)), h('span', '', ` / ${threshold}`));
    card.appendChild(score);

    const bar = h('div', 'loyalty-bar');
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', String(threshold));
    bar.setAttribute('aria-valuenow', String(Math.min(points, threshold)));
    const fill = h('div', 'loyalty-bar-fill');
    fill.style.width = pct + '%';
    bar.appendChild(fill);
    card.appendChild(bar);

    if (ready) {
      card.appendChild(h('p', 'loyalty-msg', 'Tens un tall gratis!'));
      const btn = h('button', 'loyalty-btn', 'Canviar per un tall gratis');
      btn.type = 'button';
      btn.addEventListener('click', redeem);
      card.appendChild(btn);
    } else {
      const left = threshold - points;
      card.appendChild(h('p', 'loyalty-msg', `Et falten ${left} R-Coins per a un tall gratis.`));
    }

    if (state.pending.length) {
      const total = state.pending.reduce((sum, p) => sum + p.points, 0);
      const box = h('div', 'loyalty-pending');
      box.appendChild(h('p', '', `Tens ${total} R-Coins pendents. Quan vinguis a la cita, escriu el codi que et donarà en Roc.`));

      const row = h('div', 'loyalty-row');
      const input = h('input', 'loyalty-input');
      input.type = 'text';
      input.placeholder = 'Codi de visita';
      input.setAttribute('aria-label', 'Codi de visita');
      input.autocomplete = 'off';
      const ok = h('button', 'loyalty-btn', 'Confirmar visita');
      ok.type = 'button';
      ok.addEventListener('click', () => confirmVisit(input.value));
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') confirmVisit(input.value); });
      row.append(input, ok);
      box.appendChild(row);

      if (formMessage) box.appendChild(h('p', 'loyalty-error', formMessage));
      card.appendChild(box);
    }

    const active = state.rewards.filter((r) => r.expires > Date.now());
    active.forEach((r) => {
      const box = h('div', 'loyalty-reward');
      box.appendChild(h('p', '', "El teu codi de tall gratis (ensenya'l a la perruqueria):"));
      box.appendChild(h('strong', 'loyalty-code', r.code));
      box.appendChild(h('small', '', `Vàlid fins al ${formatDate(r.expires)}`));
      card.appendChild(box);
    });

    card.appendChild(
      h('p', 'loyalty-note',
        `${cfg.pointsPerBooking} R-Coins per cita i ${cfg.pointsPerReview} per cada ressenya. ` +
        'Els R-Coins es guarden en aquest dispositiu.')
    );

    root.appendChild(card);
  }

  window.addEventListener('message', (e) => {
    if (e.origin !== 'https://calendly.com') return;
    if (!e.data || e.data.event !== 'calendly.event_scheduled') return;

    const payload = e.data.payload || {};
    const uri = (payload.invitee && payload.invitee.uri) || (payload.event && payload.event.uri);
    award('booking:' + (uri || Date.now()), cfg.pointsPerBooking, 'booking');
  });

  window.Loyalty = {
    awardReview(reviewId) {
      return award('review:' + reviewId, cfg.pointsPerReview, 'review');
    },
  };

  document.addEventListener('DOMContentLoaded', render);
})();
