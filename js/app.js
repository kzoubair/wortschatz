/* ==========================================================================
   app.js — Interface et boucle de jeu
   --------------------------------------------------------------------------
   S'appuie sur : vocabulaire.js (données), srs.js (moteur), answer.js
   (correction), store.js (progression), sound.js (sons).
   Le moteur SRS n'est appelé QUE depuis les sessions de révision ;
   le mode Sprint n'y touche jamais.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- Raccourcis DOM ---------- */
  const $ = function (s) { return document.querySelector(s); };
  const $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  const esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };

  /* ==========================================================================
     1. DONNÉES
     ========================================================================== */
  const LANG = LANGUES[LANGUE_CIBLE];
  const THEME = {}; THEMES.forEach(function (t) { THEME[t.code] = t; });
  const ENTRIES = VOCABULAIRE.map(function (e) { e.t = e[LANGUE_CIBLE]; return e; });
  const BY_ID = {}; ENTRIES.forEach(function (e) { BY_ID[e.id] = e; });
  const GROUPS = {};          // « thème|nature » → entrées (pour les QCM)
  const BY_THEME = {};
  ENTRIES.forEach(function (e) {
    (GROUPS[e.theme + '|' + e.nature] = GROUPS[e.theme + '|' + e.nature] || []).push(e);
    (BY_THEME[e.theme] = BY_THEME[e.theme] || []).push(e);
  });
  const LEVELS = ['B1', 'B2', 'C1'];
  const NATURE_LABEL = { nom: 'nom', verbe: 'verbe', adjectif: 'adjectif', adverbe: 'adverbe', expression: 'expression' };

  /* ---------- Récompenses ---------- */
  const XP_PER_CARD = 10;
  const XP_PER_LEVEL = 1000;
  function multiplier(c) { return c >= 20 ? 3 : c >= 10 ? 2.5 : c >= 5 ? 2 : c >= 3 ? 1.5 : 1; }
  function comboTier(c) { return c >= 20 ? 4 : c >= 10 ? 3 : c >= 5 ? 2 : c >= 3 ? 1 : 0; }
  function levelOf(xp) { return Math.floor(xp / XP_PER_LEVEL) + 1; }

  let D = Store.load();
  Sound.setEnabled(D.settings.sound);

  const now = function () { return Date.now(); };
  const todayKey = function () { return SRS.dayKey(now()); };
  const daily = function () { return Store.rollDay(todayKey()); };
  const limits = function () {
    return { newPerDay: D.settings.newPerDay + daily().extraNew, reviewsPerDay: D.settings.reviewsPerDay };
  };
  const reducedMotion = function () {
    return D.settings.reduceMotion || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  };

  /* ---------- Ordre d'introduction des cartes neuves ----------
     B1 d'abord, puis B2, puis C1 ; à l'intérieur d'un niveau, les thèmes
     actifs alternent par paquets de 5 (sessions variées mais cohérentes). */
  let POOL = [];
  function activeThemes() { return D.settings.themes || THEMES.map(function (t) { return t.code; }); }
  function buildPool() {
    const th = activeThemes(), lv = D.settings.levels;
    POOL = [];
    LEVELS.forEach(function (L) {
      if (lv.indexOf(L) < 0) return;
      const lists = THEMES.filter(function (t) { return th.indexOf(t.code) >= 0; })
        .map(function (t) { return (BY_THEME[t.code] || []).filter(function (e) { return e.niveau === L; }); });
      for (let i = 0, more = true; more; i += 5) {
        more = false;
        lists.forEach(function (l) { if (i < l.length) { more = true; POOL.push.apply(POOL, l.slice(i, i + 5)); } });
      }
    });
  }

  /* ==========================================================================
     2. NAVIGATION ENTRE ÉCRANS
     ========================================================================== */
  let screen = 'home';
  function show(name) {
    screen = name;
    ['home', 'session', 'summary', 'sprint', 'settings'].forEach(function (s) { $('#' + s).hidden = s !== name; });
    window.scrollTo(0, 0);
    if (name === 'home') renderHome();
    if (name === 'settings') renderSettings();
  }

  function toast(html, ms) {
    const t = $('#toast');
    t.innerHTML = html; t.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { t.hidden = true; }, ms || 3200);
  }

  /* ==========================================================================
     3. ACCUEIL
     ========================================================================== */
  function renderHome() {
    const dl = daily();
    // Niveau et XP
    const lvl = levelOf(D.xp), inLvl = D.xp % XP_PER_LEVEL;
    $('#home-level').textContent = 'Niv. ' + lvl;
    $('#home-xp').textContent = inLvl + ' / ' + XP_PER_LEVEL;
    requestAnimationFrame(function () { $('#home-xpfill').style.transform = 'scaleX(' + (inLvl / XP_PER_LEVEL) + ')'; });

    // Objectif du jour
    const goal = D.settings.dailyGoal, done = dl.answered;
    $('#goal-count').textContent = done;
    $('#goal-total').textContent = '/ ' + goal;
    const frac = Math.min(1, done / goal);
    requestAnimationFrame(function () { $('#goal-ring').style.strokeDashoffset = String(326.73 * (1 - frac)); });
    $('.ring-wrap').classList.toggle('done', done >= goal);

    // Cartes disponibles
    const c = SRS.counts(D.cards, POOL, now(), dl, limits());
    $('#due-review').textContent = c.review;
    $('#due-new').textContent = c.fresh;
    $('#due-learning').textContent = c.learning;
    const nothing = c.review + c.fresh + c.learning === 0;
    $('#btn-start').disabled = nothing || POOL.length === 0;
    const hint = $('#home-hint');
    if (POOL.length === 0) {
      hint.hidden = false; hint.textContent = 'Aucun thème ou niveau actif : choisis-en dans les paramètres.';
    } else if (nothing && c.freshTotal > 0) {
      hint.hidden = false;
      hint.innerHTML = 'Tout est à jour pour aujourd\'hui.<button class="link" id="btn-more">+10 nouvelles cartes</button>';
      $('#btn-more').onclick = function () { daily().extraNew += 10; Store.save(); renderHome(); };
    } else if (nothing) {
      hint.hidden = false; hint.textContent = 'Tout est à jour pour aujourd\'hui.';
    } else hint.hidden = true;

    $('#sprint-best').textContent = 'record ' + D.sprintBest;
    renderSoundBtn();
    renderStreak();
    renderCollection();
  }

  /* ---------- Série de jours (1 jour de tolérance par semaine) ---------- */
  function addDays(key, n) {
    const p = key.split('-').map(Number);
    return new Date(Date.UTC(p[0], p[1] - 1, p[2] + n)).toISOString().slice(0, 10);
  }
  function weekId(key) {           // lundi de la semaine
    const p = key.split('-').map(Number);
    const wd = (new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay() + 6) % 7;
    return addDays(key, -wd);
  }
  function streakInfo() {
    const t = todayKey(), days = D.days;
    let d = days[t] ? t : addDays(t, -1);
    let streak = 0, pending = [];
    const tolerated = [], used = {};
    for (let i = 0; i < 5000; i++) {
      if (days[d]) { streak++; tolerated.push.apply(tolerated, pending); pending = []; }
      else {
        const w = weekId(d);
        if (used[w]) break;
        used[w] = true; pending.push(d);
      }
      d = addDays(d, -1);
    }
    const tolSet = {}; tolerated.forEach(function (k) { tolSet[k] = true; });
    const thisWeek = weekId(t);
    return { streak: streak, tolerated: tolSet, available: !tolerated.some(function (k) { return weekId(k) === thisWeek; }) };
  }
  function renderStreak() {
    const s = streakInfo(), t = todayKey();
    $('#streak-days').textContent = s.streak;
    $('#streak-label').textContent = s.streak > 1 ? 'jours' : 'jour';
    let html = '';
    for (let i = 29; i >= 0; i--) {
      const k = addDays(t, -i);
      const cls = (D.days[k] ? 'on' : s.tolerated[k] ? 'tol' : '') + (i === 0 ? ' today' : '');
      html += '<i class="' + cls + '" title="' + k + (D.days[k] ? ' · ' + D.days[k] + ' cartes' : '') + '"></i>';
    }
    $('#calendar').innerHTML = html;
    $('#streak-note').textContent = s.streak === 0
      ? 'Une session aujourd\'hui lance ta série. Un jour de pause par semaine ne la casse pas.'
      : 'Un jour de pause par semaine est toléré — ' + (s.available ? 'encore disponible cette semaine.' : 'déjà utilisé cette semaine.');
  }

  /* ---------- Collection regroupée par thème ---------- */
  const TIER_COLORS = ['var(--t0)', 'var(--t1)', 'var(--t2)', 'var(--t3)', 'var(--t4)'];
  const openThemes = {};
  function themeStats(code) {
    const list = BY_THEME[code] || [];
    const tiers = [0, 0, 0, 0, 0];
    let ivlSum = 0, ivlN = 0, seen = 0;
    list.forEach(function (e) {
      const c = D.cards[e.id], ti = SRS.tier(c);
      tiers[ti]++;
      if (ti > 0) seen++;
      if (c && c.s === SRS.STATE.REVIEW) { ivlSum += c.ivl; ivlN++; }
    });
    const avgIvl = ivlN ? ivlSum / ivlN : 0;
    // Couleur selon le palier moyen : gris → coloré → doré au-delà de 21 jours
    const color = !seen ? TIER_COLORS[0] : !ivlN ? TIER_COLORS[1] : avgIvl < 7 ? TIER_COLORS[2] : avgIvl < 21 ? TIER_COLORS[3] : TIER_COLORS[4];
    const progress = list.length ? (tiers[1] + tiers[2] * 2 + tiers[3] * 3 + tiers[4] * 4) / (4 * list.length) : 0;
    return { total: list.length, tiers: tiers, mastered: tiers[4], color: color, progress: progress, gold: avgIvl >= 21 };
  }
  function renderCollection() {
    const act = activeThemes();
    let html = '', mastered = 0;
    ['medical', 'general'].forEach(function (dom) {
      html += '<p class="domain-title">' + (dom === 'medical' ? 'Médical et hospitalier' : 'Allemand général') + '</p>';
      THEMES.filter(function (t) { return t.domaine === dom && BY_THEME[t.code]; }).forEach(function (t) {
        const s = themeStats(t.code);
        mastered += s.mastered;
        const off = 87.96 * (1 - s.progress);
        let bar = '';
        for (let k = 1; k <= 4; k++) if (s.tiers[k]) bar += '<i style="width:' + (100 * s.tiers[k] / s.total) + '%;background:' + TIER_COLORS[k] + '"></i>';
        html += '<div class="theme-row' + (s.gold ? ' gold' : '') + (act.indexOf(t.code) < 0 ? ' inactive' : '') + '" data-theme="' + t.code + '">' +
          '<button class="theme-toggle" aria-expanded="' + (!!openThemes[t.code]) + '">' +
          '<svg class="mini-ring" viewBox="0 0 34 34" aria-hidden="true"><circle class="bgc" cx="17" cy="17" r="14"/><circle class="fgc" cx="17" cy="17" r="14" style="stroke:' + s.color + ';stroke-dashoffset:' + off + '"/></svg>' +
          '<span><span class="theme-name">' + esc(t.nom) + '</span><span class="theme-bar">' + bar + '</span></span>' +
          '<span class="theme-count num"><b>' + s.mastered + '</b> / ' + s.total + '</span></button>' +
          (openThemes[t.code] ? renderTiles(t.code) : '') + '</div>';
      });
    });
    $('#collection').innerHTML = html;
    $('#coll-mastered').textContent = mastered;
    $('#coll-total').textContent = ENTRIES.length;
  }
  function renderTiles(code) {
    let html = '<div class="theme-grid">';
    LEVELS.forEach(function (L) {
      const list = BY_THEME[code].filter(function (e) { return e.niveau === L; });
      if (!list.length) return;
      html += '<h4>' + L + ' · ' + list.length + '</h4><div class="tiles">';
      list.forEach(function (e) {
        const c = D.cards[e.id];
        html += '<span class="tile t' + SRS.tier(c) + (c && c.leech ? ' leech' : '') + '" title="' + esc(e.fr + ' — ' + e.t) + '">' + esc(e.t) + '</span>';
      });
      html += '</div>';
    });
    return html + '</div>';
  }
  $('#collection').addEventListener('click', function (ev) {
    const btn = ev.target.closest('.theme-toggle');
    if (!btn) return;
    const code = btn.parentNode.getAttribute('data-theme');
    openThemes[code] = !openThemes[code];
    renderCollection();
    const row = $('#collection [data-theme="' + code + '"] .theme-toggle');
    if (row) row.focus();
  });

  /* ==========================================================================
     4. EFFETS : combo, particules, vibration, pulsation, niveau
     ========================================================================== */
  function updateCombo(scope, combo, scoreOverride) {
    const isSprint = scope === 'sprint';
    const root = isSprint ? $('#sprint') : $('#session');
    const box = isSprint ? $('#sprint-combo') : $('#combo');
    const num = isSprint ? $('#sprint-score') : $('#combo-num');
    num.textContent = isSprint ? scoreOverride : combo;
    (isSprint ? $('#sprint-mult') : $('#combo-mult')).textContent = '×' + String(multiplier(combo)).replace('.', ',');
    box.classList.toggle('hot', combo >= 3);
    root.classList.toggle('combo-3', combo >= 3);
    document.body.classList.toggle('combo-20', combo >= 20 && !reducedMotion());
    num.classList.remove('bump'); void num.offsetWidth; num.classList.add('bump');
  }
  function comboFx(prev, cur, particlesEl) {
    if (reducedMotion()) return;
    if (cur >= 5) burst(particlesEl, cur >= 10 ? 22 : 14);
    if (prev < 10 && cur >= 10) {
      const app = $('#app');
      app.classList.remove('screen-shake'); void app.offsetWidth; app.classList.add('screen-shake');
      if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(35);
    }
  }
  function burst(el, n) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      const a = Math.random() * Math.PI * 2, r = 90 + Math.random() * 120;
      p.style.setProperty('--dx', Math.cos(a) * r + 'px');
      p.style.setProperty('--dy', Math.sin(a) * r * 0.8 + 'px');
      p.style.setProperty('--rot', (Math.random() * 360 | 0) + 'deg');
      p.style.animationDelay = (Math.random() * 80 | 0) + 'ms';
      if (i % 3 === 0) p.style.background = 'var(--card)';
      frag.appendChild(p);
    }
    el.appendChild(frag);
    setTimeout(function () { el.innerHTML = ''; }, 1100);
  }
  function addXP(amount) {
    const before = levelOf(D.xp);
    D.xp += amount;
    const after = levelOf(D.xp);
    if (after > before) showLevelUp(after);
  }
  function showLevelUp(n) {
    const el = $('#levelup');
    $('#levelup-num').textContent = n;
    el.hidden = true; void el.offsetWidth; el.hidden = false;
    Sound.levelUp();
    clearTimeout(showLevelUp.t);
    showLevelUp.t = setTimeout(function () { el.hidden = true; }, 1500);
  }
  function animateCard(card, cls, cb, ms) {
    card.classList.remove('enter', 'exit-right', 'exit-down', 'shake');
    void card.offsetWidth;
    card.classList.add(cls);
    if (cb) setTimeout(cb, reducedMotion() ? 0 : ms);
  }

  /* ==========================================================================
     5. CONSTRUCTION DES QUESTIONS
     ========================================================================== */
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  const lc = function (s) { return String(s).toLowerCase(); };
  /* 3 distracteurs : même thème ET même nature grammaticale, de préférence même niveau */
  function distractors(e) {
    const bad = {}; [e.t].concat(e.alt || []).forEach(function (s) { bad[lc(s)] = true; });
    let group = (GROUPS[e.theme + '|' + e.nature] || []).filter(function (x) {
      return x.id !== e.id && !bad[lc(x.t)] && x.fr !== e.fr;
    });
    const li = LEVELS.indexOf(e.niveau);
    group = shuffle(group.slice()).sort(function (a, b) {
      return Math.abs(LEVELS.indexOf(a.niveau) - li) - Math.abs(LEVELS.indexOf(b.niveau) - li);
    });
    const out = [], seen = {};
    for (let i = 0; i < group.length && out.length < 3; i++) {
      if (seen[lc(group[i].t)]) continue;
      seen[lc(group[i].t)] = true; out.push(group[i]);
    }
    return out;
  }
  function splitNoun(e) {
    if (e.nature === 'nom' && e.article && e.t.indexOf(e.article + ' ') === 0) return { article: e.article, word: e.t.slice(e.article.length + 1) };
    return { article: '', word: e.t };
  }
  function targetHTML(e) {
    const n = splitNoun(e);
    return (n.article ? '<span class="article">' + esc(n.article) + '</span> ' : '') + esc(n.word);
  }
  function renderChoices(container, e, onPick) {
    const opts = shuffle([e].concat(distractors(e)));
    container.innerHTML = opts.map(function (o, i) {
      return '<button class="choice" data-id="' + o.id + '" lang="de"><kbd>' + (i + 1) + '</kbd><span>' + targetHTML(o).replace('class="article"', 'class="de-article"') + '</span></button>';
    }).join('');
    $$('.choice', container).forEach(function (b, i) { b.onclick = function () { onPick(i); }; });
    return opts;
  }
  /* Met en gras le mot dans les phrases d'exemple (heuristique sur le radical) */
  function highlight(sentence, e) {
    const n = splitNoun(e);
    const words = n.word.replace(/^sich /, '').split(/\s+/).filter(function (w) { return w.length >= 3; });
    if (e.pluriel) words.push(e.pluriel.replace(/^die /, ''));
    const stems = words.map(function (w) {
      w = lc(w).replace(/[^a-zäöüß]/g, '');
      if (e.nature === 'verbe') w = w.replace(/(e?n)$/, '');
      return w.slice(0, Math.max(3, Math.min(w.length, w.length > 6 ? w.length - 2 : w.length)));
    }).filter(function (s) { return s.length >= 3; });
    return sentence.split(/(\s+)/).map(function (tok) {
      const bare = lc(tok).replace(/[^a-zäöüß]/g, '');
      const hit = bare.length >= 3 && stems.some(function (s) { return bare.indexOf(s) === 0 || (s.length >= 5 && bare.indexOf(s) > 0); });
      return hit ? '<mark>' + esc(tok) + '</mark>' : esc(tok);
    }).join('');
  }
  function fillBack(prefix, e) {
    $('#' + prefix + 'de').innerHTML = targetHTML(e);
    const g = [];
    if (e.nature === 'nom') g.push(e.genre);
    else g.push(NATURE_LABEL[e.nature]);
    if (e.pluriel) g.push('pl. ' + esc(e.pluriel));
    if (e.info) g.push(esc(e.info));
    $('#card-grammar').innerHTML = g.join(' · ');
    $('#card-examples').innerHTML = [e.exemple1, e.exemple2].map(function (s) { return '<li>' + highlight(s, e) + '</li>'; }).join('');
  }
  /* Indice pour les cartes « en cours » : 1re lettre de chaque mot + tirets */
  function typingHint(e) {
    const n = splitNoun(e);
    const mask = n.word.split(' ').map(function (w) {
      return Array.from(w).map(function (ch, i) { return /[\s.,!?'’-]/.test(ch) ? ch : i === 0 ? ch : '_'; }).join('');
    }).join('  ');
    return (n.article && D.settings.requireArticle ? '___  ' : '') + mask;
  }

  /* ==========================================================================
     6. SESSION DE RÉVISION (seul endroit qui appelle le moteur SRS)
     ========================================================================== */
  const S = {};
  const MODE_LABEL = { 'qcm': 'Choix', 'ecrit': 'Écrire', 'ecrit-renforce': 'Rappel renforcé' };

  function startSession() {
    Sound.unlock();
    Object.assign(S, { count: 0, correct: 0, xp: 0, combo: 0, maxCombo: 0, acquired: [], lastId: null,
                       entry: null, card: null, format: 'qcm', phase: 'front', ok: false, pending: 0, busy: false });
    show('session');
    updateCombo('session', 0);
    $('#session-xp').textContent = '+0';
    nextCard(true);
  }

  function nextCard(first) {
    if (screen !== 'session') return;
    if (S.count >= D.settings.sessionLength) return endSession();
    const pick = SRS.pickNext(D.cards, POOL, now(), daily(), limits(), { count: S.count, lastId: S.lastId });
    if (!pick) return endSession();
    const e = BY_ID[pick.id];
    S.entry = e;
    S.card = D.cards[e.id] || SRS.newCard();
    S.format = SRS.questionFormat(S.card);
    S.phase = 'front'; S.ok = false; S.pending = 0; S.busy = false; S.check = null; S.picked = null;

    const card = $('#card');
    card.classList.remove('flipped');
    $('#card-level').textContent = $('#back-level').textContent = e.niveau;
    $('#card-theme').textContent = $('#back-theme').textContent = THEME[e.theme].nom;
    $('#card-mode').textContent = MODE_LABEL[S.format];
    $('#card-fr').textContent = e.fr;
    $('#card-nature').textContent = NATURE_LABEL[e.nature];
    $('#card-hint').textContent = S.format === 'ecrit' ? typingHint(e) : S.format === 'ecrit-renforce' ? 'sans indice' : '';
    $('#session-bar').style.transform = 'scaleX(' + (S.count / D.settings.sessionLength) + ')';
    // Le dos est rempli à l'avance mais n'apparaît qu'au retournement
    setTimeout(function () { if (S.entry === e) fillBack('card-', e); }, first ? 0 : 60);

    $('#verdict').hidden = true;
    $('#ratings').hidden = true;
    $('#btn-reveal').hidden = false;
    if (S.format === 'qcm') {
      $('#write').hidden = true;
      $('#choices').hidden = false;
      S.options = renderChoices($('#choices'), e, pickChoice);
    } else {
      $('#choices').hidden = true;
      $('#write').hidden = false;
      const input = $('#answer');
      input.value = '';
      input.placeholder = e.nature === 'nom' && D.settings.requireArticle ? 'article + nom' : 'en allemand';
      $('#write-help').textContent = LANG.clavier.length ? 'Alt + A / O / U / S, ou ' + LANG.aideSaisie : '';
      setTimeout(function () { input.focus({ preventScroll: true }); }, 30);
    }
    animateCard(card, 'enter');
  }

  function pickChoice(i) {
    if (S.phase !== 'front' || screen !== 'session' || !S.options[i]) return;
    const chosen = S.options[i];
    const ok = chosen.id === S.entry.id;
    S.picked = chosen;
    reveal(ok);
  }

  function submitWritten() {
    if (S.phase !== 'front') return;
    const val = $('#answer').value;
    if (!val.trim()) return reveal(false, null);
    S.check = Answer.check(val, S.entry, { articles: LANG.articles, requireArticle: D.settings.requireArticle });
    S.typed = val.trim();
    reveal(S.check.ok);
  }

  /* Retournement de la carte et verdict */
  function reveal(ok) {
    S.phase = 'back';
    S.ok = ok;
    $('#answer').blur();
    $('#btn-reveal').hidden = true;
    $('#write').hidden = true;
    $('#choices').hidden = true;
    const card = $('#card');
    fillBack('card-', S.entry);
    card.classList.add('flipped');
    Sound.flip();

    const prev = S.combo;
    if (ok) {
      S.combo++;
      S.maxCombo = Math.max(S.maxCombo, S.combo);
      S.pending = Math.round(XP_PER_CARD * multiplier(S.combo));
      S.xp += S.pending;
      Sound.correct(comboTier(S.combo));
      comboFx(prev, S.combo, $('#particles'));
    } else {
      S.combo = 0;
      Sound.wrong();
      setTimeout(function () { animateCard(card, 'shake'); }, reducedMotion() ? 0 : 420);
    }
    updateCombo('session', S.combo);
    $('#session-xp').textContent = '+' + S.xp;
    renderVerdict(ok);

    // Notation : en cas d'erreur, seul « Encore » est possible
    const preview = SRS.preview(S.card, now());
    const suggested = !ok ? 1 : (S.check && (!S.check.exact || S.check.note)) ? 2 : 3;
    S.suggested = suggested;
    $$('#ratings .rate').forEach(function (b) {
      const r = +b.getAttribute('data-r');
      b.querySelector('small').textContent = SRS.formatDelay(preview[r]);
      b.disabled = !ok && r !== 1;
      b.classList.toggle('suggested', r === suggested);
    });
    $('#ratings').hidden = false;
  }

  function expectedHTML(chk) {
    // Forme exacte attendue, avec la lettre erronée ou manquante soulignée
    const e = S.entry;
    if (!chk || chk.distance > 3) return targetHTML(e);
    const art = chk.expectedArticle;
    const chars = Array.from(chk.word);
    let html = '';
    chars.forEach(function (ch, i) {
      if (chk.extras.indexOf(i) >= 0) html += '<i class="extra"></i>';
      html += chk.marks[i] === 'sub' ? '<span class="bad">' + esc(ch) + '</span>' : chk.marks[i] === 'miss' ? '<span class="miss">' + esc(ch) + '</span>' : esc(ch);
    });
    if (chk.extras.indexOf(chars.length) >= 0) html += '<i class="extra"></i>';
    const artHTML = art ? (chk.articleOk ? esc(art) : '<span class="bad">' + esc(art) + '</span>') + ' ' : '';
    return artHTML + (chk.prefix ? '<span class="miss">sich</span> ' : '') + html;
  }
  function renderVerdict(ok) {
    const v = $('#verdict'), chk = S.check;
    let cls, title, body = '';
    if (S.format === 'qcm') {
      cls = ok ? 'ok' : 'ko';
      title = ok ? 'Juste' : 'Ce n\'était pas ça';
      if (!ok && S.picked) body = '<p>Tu as choisi <span class="typed" lang="de">' + esc(S.picked.t) + '</span> (' + esc(S.picked.fr) + ')</p>';
      if (!ok && !S.picked) body = '<p class="diff" lang="de">' + targetHTML(S.entry) + '</p>';
    } else if (!chk) {
      cls = 'ko'; title = 'La réponse';
      body = '<p class="diff" lang="de">' + targetHTML(S.entry) + '</p>';
    } else if (ok && chk.exact && !chk.note) {
      cls = 'ok'; title = 'Juste';
      body = '<p class="diff" lang="de">' + targetHTML(S.entry) + '</p>';
    } else if (ok) {
      cls = 'near';
      title = chk.note === 'sich' && chk.exact ? 'Juste — n\'oublie pas « sich »' : 'Presque parfait — une lettre d\'écart';
      body = '<p class="diff" lang="de">' + expectedHTML(chk) + '</p><p class="small muted">Tu as écrit : <span lang="de">' + esc(S.typed) + '</span></p>';
    } else if (chk.wordOk && !chk.articleOk) {
      cls = 'ko'; title = chk.givenArticle ? 'Mauvais article' : 'Il manque l\'article';
      body = '<p class="diff" lang="de">' + expectedHTML(chk) + '</p><p class="small muted">Le mot est juste ; l\'article fait partie de la réponse (' + esc(S.entry.genre) + ').</p>';
    } else {
      cls = 'ko'; title = 'Pas tout à fait';
      body = '<p class="diff" lang="de">' + expectedHTML(chk) + '</p><p class="small muted">Tu as écrit : <span class="typed" lang="de">' + esc(S.typed) + '</span></p>';
    }
    v.className = 'verdict ' + cls;
    v.innerHTML = '<p class="verdict-title">' + title + '</p>' + body;
    v.hidden = false;
  }

  function rate(r) {
    if (S.phase !== 'back' || S.busy) return;
    const btn = $('#ratings .rate-' + r);
    if (!btn || btn.disabled) return;
    S.busy = true;
    const e = S.entry, before = S.card;
    // « Encore » volontaire sur une bonne réponse : le combo retombe, les points sont annulés
    if (S.ok && r === 1) {
      S.xp -= S.pending; S.pending = 0; S.combo = 0;
      updateCombo('session', 0);
      $('#session-xp').textContent = '+' + S.xp;
    }
    const res = SRS.answer(before, r, now());
    D.cards[e.id] = res.card;

    const dl = daily();
    if (res.wasNew) dl.newSeen++;
    if (before.s === SRS.STATE.REVIEW) dl.reviewsDone++;
    dl.answered++;
    dl.xp += S.pending;
    const tk = todayKey();
    D.days[tk] = (D.days[tk] || 0) + 1;
    S.count++;
    if (r > 1) S.correct++;
    if (res.graduated) S.acquired.push(e);
    if (S.combo > D.bestCombo) D.bestCombo = S.combo;
    addXP(S.pending);
    if (dl.answered === D.settings.dailyGoal) {
      setTimeout(function () { Sound.goal(); toast('Objectif du jour atteint : ' + D.settings.dailyGoal + ' cartes.'); }, 350);
    }
    if (res.becameLeech) {
      toast('« ' + esc(e.fr) + ' » résiste : 8 échecs. Une reformulation aiderait — voir Paramètres.', 5000);
    }
    Store.save();
    S.lastId = e.id;

    animateCard($('#card'), r > 1 ? 'exit-right' : 'exit-down', function () { nextCard(); }, r > 1 ? 380 : 300);
  }

  function endSession() {
    S.phase = 'done';
    Store.saveNow();
    document.body.classList.remove('combo-20');
    $('#session').classList.remove('combo-3');
    show('summary');
    const rateV = S.count ? Math.round(100 * S.correct / S.count) : 0;
    $('#summary-title').textContent = S.count === 0 ? 'Rien à réviser pour l\'instant.' : rateV >= 90 ? 'Superbe session.' : rateV >= 70 ? 'Bien joué.' : 'Chaque carte compte.';
    countUp($('#summary'), { seen: S.count, rate: rateV, xp: S.xp, combo: S.maxCombo });
    $('#acquired-count').textContent = S.acquired.length;
    $('#acquired').innerHTML = S.acquired.map(function (e, i) {
      return '<span lang="de" style="animation-delay:' + (0.4 + i * 0.05) + 's">' + esc(e.t) + '</span>';
    }).join('') || '<span class="muted small" style="animation-delay:.4s">Les nouvelles cartes deviennent « acquises » après leurs deux étapes d\'apprentissage.</span>';
    const c = SRS.counts(D.cards, POOL, now(), daily(), limits());
    const left = c.review + c.fresh + c.learning;
    $('#summary-note').textContent = left ? left + ' cartes encore disponibles aujourd\'hui.' : 'Tout est à jour. Rendez-vous demain pour les prochaines révisions.';
    $('#btn-again').disabled = !left;
  }

  /* Chiffres qui défilent en montant */
  function countUp(root, values) {
    $$('[data-count]', root).forEach(function (el) {
      const key = el.getAttribute('data-count'), target = values[key] || 0;
      const pre = el.getAttribute('data-prefix') || '', suf = el.getAttribute('data-suffix') || '';
      if (reducedMotion() || target === 0) { el.textContent = pre + target + suf; return; }
      const t0 = performance.now(), dur = 900 + Math.min(700, target * 4);
      el.textContent = pre + '0' + suf;
      (function step(t) {
        const p = Math.min(1, (t - t0) / dur), eased = 1 - Math.pow(1 - p, 3);
        el.textContent = pre + Math.round(target * eased) + suf;
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  }

  /* ==========================================================================
     7. MODE SPRINT — 60 s, QCM uniquement, aucun effet sur le moteur SRS
     ========================================================================== */
  const SP = { running: false };
  const SPRINT_MS = 60000;

  function startSprint() {
    Sound.unlock();
    let known = POOL.filter(function (e) { const c = D.cards[e.id]; return c && c.reps > 0; });
    let note = '';
    if (known.length < 12) {
      const extra = POOL.filter(function (e) { return !D.cards[e.id]; }).slice(0, 40 - known.length);
      known = known.concat(extra);
      note = 'Encore peu de cartes connues : le sprint pioche aussi parmi les prochaines nouvelles.';
    }
    if (known.length < 4) { toast('Active au moins un thème pour lancer un sprint.'); return; }
    Object.assign(SP, { running: true, score: 0, combo: 0, maxCombo: 0, xp: 0, list: known, queue: [], locked: false,
                        start: performance.now(), lastTick: 60 });
    show('sprint');
    $('#sprint-end').hidden = true;
    updateCombo('sprint', 0, 0);
    if (note) toast(note, 3500);
    nextSprintCard();
    requestAnimationFrame(sprintTick);
  }
  function sprintTick(t) {
    if (!SP.running) return;
    const left = Math.max(0, SPRINT_MS - (t - SP.start));
    $('#sprint-timer').style.transform = 'scaleX(' + (left / SPRINT_MS) + ')';
    const sec = Math.ceil(left / 1000);
    $('#sprint-clock').textContent = sec;
    if (sec !== SP.lastTick) { SP.lastTick = sec; if (sec <= 5 && sec > 0) Sound.tick(); }
    if (left <= 0) return endSprint();
    requestAnimationFrame(sprintTick);
  }
  function nextSprintCard() {
    if (!SP.queue.length) SP.queue = shuffle(SP.list.slice());
    const e = SP.queue.pop();
    SP.entry = e; SP.locked = false;
    $('#sprint-level').textContent = e.niveau;
    $('#sprint-theme').textContent = THEME[e.theme].nom;
    $('#sprint-fr').textContent = e.fr;
    $('#sprint-nature').textContent = NATURE_LABEL[e.nature];
    SP.options = renderChoices($('#sprint-choices'), e, pickSprint);
    animateCard($('#sprint-card'), 'enter');
  }
  function pickSprint(i) {
    if (!SP.running || SP.locked || !SP.options[i]) return;
    SP.locked = true;
    const ok = SP.options[i].id === SP.entry.id;
    $$('#sprint-choices .choice').forEach(function (b, k) {
      b.disabled = true;
      if (SP.options[k].id === SP.entry.id) b.classList.add('right');
      else if (k === i) b.classList.add('wrong'); else b.classList.add('dim');
    });
    const prev = SP.combo;
    if (ok) {
      SP.score++; SP.combo++; SP.maxCombo = Math.max(SP.maxCombo, SP.combo);
      SP.xp += Math.round(XP_PER_CARD * multiplier(SP.combo));
      Sound.correct(comboTier(SP.combo));
      comboFx(prev, SP.combo, $('#sprint-particles'));
      updateCombo('sprint', SP.combo, SP.score);
      animateCard($('#sprint-card'), 'exit-right', function () { if (SP.running) nextSprintCard(); }, 300);
    } else {
      SP.combo = 0;
      Sound.wrong();
      updateCombo('sprint', 0, SP.score);
      animateCard($('#sprint-card'), 'shake', function () { if (SP.running) nextSprintCard(); }, 800);
    }
  }
  function endSprint(aborted) {
    if (!SP.running) return;
    SP.running = false;
    document.body.classList.remove('combo-20');
    $('#sprint').classList.remove('combo-3');
    const record = SP.score > D.sprintBest && !aborted;
    if (record) D.sprintBest = SP.score;
    if (SP.maxCombo > D.bestCombo) D.bestCombo = SP.maxCombo;
    addXP(SP.xp);
    Store.saveNow();
    $('#sprint-end-title').textContent = aborted ? 'Sprint interrompu.' : record ? 'Nouveau record !' : 'Temps écoulé.';
    $('#sprint-end').hidden = false;
    countUp($('#sprint-end'), { score: SP.score, best: D.sprintBest, xp: SP.xp, combo: SP.maxCombo });
    setTimeout(function () { $('#btn-sprint-again').focus(); }, 50);
  }

  /* ==========================================================================
     8. PARAMÈTRES
     ========================================================================== */
  function renderSettings() {
    const st = D.settings;
    $('#set-levels').innerHTML = LEVELS.map(function (L) {
      return '<button aria-pressed="' + (st.levels.indexOf(L) >= 0) + '" data-l="' + L + '">' + L + '</button>';
    }).join('');
    const act = activeThemes();
    let html = '';
    ['medical', 'general'].forEach(function (dom) {
      html += '<p class="domain-title">' + (dom === 'medical' ? 'Médical et hospitalier' : 'Allemand général') + '</p>';
      THEMES.filter(function (t) { return t.domaine === dom; }).forEach(function (t) {
        html += '<label><input type="checkbox" data-t="' + t.code + '"' + (act.indexOf(t.code) >= 0 ? ' checked' : '') + '>' +
          esc(t.nom) + '<small class="num">' + ((BY_THEME[t.code] || []).length) + '</small></label>';
      });
    });
    $('#set-themes').innerHTML = html;
    $('#set-goal').value = st.dailyGoal;
    $('#set-session').value = st.sessionLength;
    $('#set-new').value = st.newPerDay;
    $('#set-reviews').value = st.reviewsPerDay;
    $('#set-article').checked = st.requireArticle;
    $('#set-sound').checked = st.sound;
    $('#set-motion').checked = st.reduceMotion;
    renderLeeches();
    $('#reset-confirm').hidden = true;
    $('#about').textContent = ENTRIES.length + ' entrées · ' + THEMES.length + ' thèmes · format de sauvegarde v' + Store.FORMAT;
  }
  function renderLeeches() {
    const list = ENTRIES.filter(function (e) { return D.cards[e.id] && D.cards[e.id].leech; });
    $('#leech-list').innerHTML = list.length ? list.map(function (e) {
      return '<li><span>' + esc(e.fr) + '<small lang="de">' + esc(e.t) + ' · ' + D.cards[e.id].fails + ' échecs · ' + esc(e.id) + '</small></span>' +
        '<button class="link" data-reset="' + e.id + '">Remettre à zéro</button></li>';
    }).join('') : '<li><span class="muted">Aucune pour l\'instant.</span></li>';
  }
  function setThemes(codes) {
    D.settings.themes = codes.length === THEMES.length ? null : codes;
    Store.save(); buildPool(); renderSettings();
  }
  $('#set-levels').addEventListener('click', function (ev) {
    const b = ev.target.closest('button'); if (!b) return;
    const L = b.getAttribute('data-l'), lv = D.settings.levels.slice();
    const i = lv.indexOf(L);
    if (i >= 0) lv.splice(i, 1); else lv.push(L);
    D.settings.levels = LEVELS.filter(function (x) { return lv.indexOf(x) >= 0; });
    Store.save(); buildPool(); renderSettings();
  });
  $('#set-themes').addEventListener('change', function () {
    setThemes($$('#set-themes input:checked').map(function (i) { return i.getAttribute('data-t'); }));
  });
  $('#themes-all').onclick = function () { setThemes(THEMES.map(function (t) { return t.code; })); };
  $('#themes-none').onclick = function () { setThemes([]); };
  $('#themes-med').onclick = function () { setThemes(THEMES.filter(function (t) { return t.domaine === 'medical'; }).map(function (t) { return t.code; })); };
  function numberSetting(sel, key, min, max) {
    $(sel).addEventListener('change', function () {
      const v = Math.round(+this.value);
      D.settings[key] = isFinite(v) ? Math.min(max, Math.max(min, v)) : D.settings[key];
      this.value = D.settings[key];
      Store.save();
    });
  }
  numberSetting('#set-goal', 'dailyGoal', 5, 500);
  numberSetting('#set-session', 'sessionLength', 5, 200);
  numberSetting('#set-new', 'newPerDay', 0, 500);
  numberSetting('#set-reviews', 'reviewsPerDay', 0, 5000);
  $('#set-article').onchange = function () { D.settings.requireArticle = this.checked; Store.save(); };
  $('#set-sound').onchange = function () { setSound(this.checked); };
  $('#set-motion').onchange = function () { D.settings.reduceMotion = this.checked; applyMotion(); Store.save(); };
  $('#leech-list').addEventListener('click', function (ev) {
    const id = ev.target.getAttribute('data-reset');
    if (!id) return;
    delete D.cards[id];
    Store.save(); buildPool(); renderLeeches();
    toast('Carte remise à zéro : elle reviendra comme une carte neuve.');
  });

  /* Sauvegarde : export / import JSON */
  $('#btn-export').onclick = function () {
    const blob = new Blob([Store.exportJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'wortschatz-progression-' + todayKey() + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast('Progression exportée.');
  };
  $('#file-import').onchange = function () {
    const f = this.files[0]; this.value = '';
    if (!f) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        if (!confirm('Remplacer la progression actuelle par celle du fichier « ' + f.name + ' » ?')) return;
        D = Store.importJSON(reader.result);
        Sound.setEnabled(D.settings.sound); applyMotion(); buildPool(); renderSettings();
        toast('Progression importée : ' + Object.keys(D.cards).length + ' cartes.');
      } catch (err) { toast('Import impossible : ' + esc(err.message)); }
    };
    reader.readAsText(f);
  };

  /* Remise à zéro en deux étapes */
  $('#btn-reset').onclick = function () { $('#reset-confirm').hidden = false; $('#reset-input').value = ''; $('#btn-reset-confirm').disabled = true; $('#reset-input').focus(); };
  $('#reset-input').oninput = function () { $('#btn-reset-confirm').disabled = this.value.trim().toUpperCase() !== 'EFFACER'; };
  $('#btn-reset-confirm').onclick = function () {
    D = Store.reset();
    Sound.setEnabled(D.settings.sound); applyMotion(); buildPool(); renderSettings();
    toast('Progression effacée.');
  };

  /* ---------- Son et animations ---------- */
  const ICON_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
  const ICON_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
  function renderSoundBtn() {
    const b = $('#btn-sound');
    b.innerHTML = D.settings.sound ? ICON_ON : ICON_OFF;
    b.classList.toggle('off', !D.settings.sound);
    b.setAttribute('aria-label', D.settings.sound ? 'Couper le son' : 'Activer le son');
  }
  function setSound(v) {
    D.settings.sound = v; Sound.setEnabled(v); Store.save(); renderSoundBtn();
    if (v) Sound.correct(0);
  }
  function applyMotion() { document.documentElement.classList.toggle('reduce-motion', !!D.settings.reduceMotion); }

  /* ==========================================================================
     9. ÉVÉNEMENTS ET CLAVIER (tout est jouable sans souris)
     ========================================================================== */
  $('#btn-start').onclick = startSession;
  $('#btn-sprint').onclick = startSprint;
  $('#btn-settings').onclick = function () { show('settings'); };
  $('#btn-settings-back').onclick = function () { show('home'); };
  $('#btn-sound').onclick = function () { setSound(!D.settings.sound); };
  $('#btn-quit').onclick = function () { endSession(); };
  $('#btn-again').onclick = startSession;
  $('#btn-home').onclick = function () { show('home'); };
  $('#btn-sprint-quit').onclick = function () { if (SP.running) endSprint(true); else show('home'); };
  $('#btn-sprint-again').onclick = startSprint;
  $('#btn-sprint-home').onclick = function () { $('#sprint-end').hidden = true; show('home'); };
  $('#btn-reveal').onclick = function () { if (S.phase === 'front') { S.picked = null; reveal(false); } };
  $('#ratings').addEventListener('click', function (ev) {
    const b = ev.target.closest('.rate'); if (b) rate(+b.getAttribute('data-r'));
  });
  $('#write').addEventListener('submit', function (ev) { ev.preventDefault(); submitWritten(); });

  /* Clavier spécial ä ö ü ß (boutons + Alt+lettre) */
  function insertChar(ch) {
    const input = $('#answer');
    const s = input.selectionStart, en = input.selectionEnd;
    input.value = input.value.slice(0, s) + ch + input.value.slice(en);
    input.setSelectionRange(s + ch.length, s + ch.length);
    input.focus();
  }
  $('#special-keys').innerHTML = LANG.clavier.map(function (ch) { return '<button type="button" tabindex="-1" data-ch="' + ch + '">' + ch + '</button>'; }).join('');
  $('#special-keys').addEventListener('mousedown', function (ev) { ev.preventDefault(); });
  $('#special-keys').addEventListener('click', function (ev) {
    const b = ev.target.closest('button'); if (b) insertChar(b.getAttribute('data-ch'));
  });
  const ALT_KEYS = { KeyA: 'ä', KeyO: 'ö', KeyU: 'ü', KeyS: 'ß' };
  $('#answer').addEventListener('keydown', function (ev) {
    if (ev.altKey && !ev.ctrlKey && ALT_KEYS[ev.code] && LANGUE_CIBLE === 'de') {
      ev.preventDefault();
      const ch = ALT_KEYS[ev.code];
      insertChar(ev.shiftKey && ch !== 'ß' ? ch.toUpperCase() : ch);
    }
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const k = ev.key;
    const inField = ev.target && (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA');
    if (screen === 'session') {
      if (k === 'Escape') { ev.preventDefault(); return endSession(); }
      if (S.phase === 'front') {
        if (S.format === 'qcm') {
          if (k >= '1' && k <= '4') { ev.preventDefault(); pickChoice(+k - 1); }
          else if (k === ' ') { ev.preventDefault(); S.picked = null; reveal(false); }
        }
        // en écrit : Entrée valide (géré par le formulaire)
      } else if (S.phase === 'back') {
        if (k >= '1' && k <= '4') { ev.preventDefault(); rate(+k); }
        else if (k === 'Enter' || k === ' ') { ev.preventDefault(); rate(S.suggested); }
      }
      return;
    }
    if (screen === 'sprint') {
      if (k === 'Escape') { ev.preventDefault(); if (SP.running) endSprint(true); else { $('#sprint-end').hidden = true; show('home'); } return; }
      if (SP.running && k >= '1' && k <= '4') { ev.preventDefault(); pickSprint(+k - 1); }
      else if (!SP.running && k === 'Enter') { ev.preventDefault(); startSprint(); }
      return;
    }
    if (inField) return;
    if (screen === 'home') {
      if (k === 'Enter' && document.activeElement === document.body && !$('#btn-start').disabled) { ev.preventDefault(); startSession(); }
      else if (k === 's' || k === 'S') startSprint();
      else if (k === 'm' || k === 'M') setSound(!D.settings.sound);
    } else if (screen === 'summary') {
      if (k === 'Enter' && document.activeElement === document.body) { ev.preventDefault(); if (!$('#btn-again').disabled) startSession(); else show('home'); }
      else if (k === 'Escape') show('home');
    } else if (screen === 'settings' && k === 'Escape') show('home');
  });

  /* ==========================================================================
     10. PWA : service worker et état hors ligne
     ========================================================================== */
  function setupPWA() {
    const status = $('#offline-status');
    if (!('serviceWorker' in navigator) || !window.isSecureContext) {
      status.textContent = 'Mode hors ligne indisponible ici (ouvrir via http://localhost ou en HTTPS).';
      return;
    }
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('./service-worker.js').then(function () {
      return navigator.serviceWorker.ready;
    }).then(function () {
      status.textContent = 'Disponible hors ligne · ' + ENTRIES.length + ' entrées';
    }).catch(function (err) {
      status.textContent = 'Service worker non installé : ' + err.message;
    });
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!hadController) return;
      const t = $('#toast');
      t.innerHTML = 'Nouvelle version installée.<button class="link" id="btn-reload">Recharger</button>';
      t.hidden = false;
      $('#btn-reload').onclick = function () { location.reload(); };
    });
  }

  /* ---------- Démarrage ---------- */
  applyMotion();
  buildPool();
  show('home');
  setupPWA();
})();
