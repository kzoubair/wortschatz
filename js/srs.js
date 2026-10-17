/* ==========================================================================
   srs.js — Moteur de répétition espacée (logique Anki)
   --------------------------------------------------------------------------
   Ce fichier ne touche JAMAIS au DOM : il ne fait que calculer.
   Il est utilisable dans le navigateur (window.SRS) et dans Node (tests).

   États d'une carte :
     0 = neuve        (jamais vue)
     1 = apprentissage (étapes 1 min puis 10 min)
     2 = révision      (intervalle en jours)
     3 = réapprentissage (après un « Encore » sur une carte en révision)

   Notes : 1 = Encore · 2 = Difficile · 3 = Correct · 4 = Facile

   Comme dans Anki, le facteur de facilité n'est modifié que lors des
   réponses données à une carte en révision (pas pendant l'apprentissage).
   ========================================================================== */
(function (root) {
  'use strict';

  const MIN_MS = 60 * 1000;
  const HOUR_MS = 60 * MIN_MS;
  const DAY_MS = 24 * HOUR_MS;

  /* ---------- Paramètres du moteur (conformes au cahier des charges) ---------- */
  const CONFIG = {
    easeStart: 2.5,
    easeMin: 1.3,
    easeDelta: { 1: -0.20, 2: -0.15, 3: 0, 4: +0.15 },
    learningSteps: [1, 10],       // minutes
    relearningSteps: [10],        // minutes
    graduatingInterval: 1,        // jours (sortie d'apprentissage par Correct)
    easyInterval: 4,              // jours (sortie d'apprentissage par Facile)
    hardFactor: 1.2,
    easyBonus: 1.3,
    lapseFactor: 0.5,             // nouvel intervalle = moitié de l'ancien…
    lapseMinInterval: 1,          // … avec un minimum de 1 jour
    fuzz: 0.05,                   // ± 5 %
    maxInterval: 36500,
    matureDays: 21,               // carte « mûre » à partir de 21 jours
    leechFails: 8,                // carte problématique après 8 échecs
    rolloverHour: 4,              // la « journée » de révision change à 4 h
    learnAheadMin: 20             // cartes en apprentissage montrées en avance si plus rien d'autre
  };

  const STATE = { NEW: 0, LEARNING: 1, REVIEW: 2, RELEARNING: 3 };
  const RATING = { AGAIN: 1, HARD: 2, GOOD: 3, EASY: 4 };

  /* ---------- Calendrier : numéro de jour local avec bascule à 4 h ---------- */
  function dayNumber(ts) {
    const d = new Date(ts - CONFIG.rolloverHour * HOUR_MS);
    return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS);
  }
  function dayKey(ts) {
    const d = new Date(ts - CONFIG.rolloverHour * HOUR_MS);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const j = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + j;
  }

  /* ---------- Création et copie d'une carte ---------- */
  function newCard() {
    return { s: STATE.NEW, step: 0, ivl: 0, ease: CONFIG.easeStart, due: 0, dueDay: 0,
             reps: 0, lapses: 0, fails: 0, leech: false, last: 0 };
  }
  function clone(c) { return Object.assign(newCard(), c || {}); }

  /* ---------- Variation aléatoire ± 5 % ---------- */
  function fuzz(ivl, rand) {
    const delta = ivl * CONFIG.fuzz;
    const v = Math.round(ivl + (rand() * 2 - 1) * delta);
    return Math.min(CONFIG.maxInterval, Math.max(1, v));
  }
  function clampEase(e) { return Math.max(CONFIG.easeMin, Math.round(e * 1000) / 1000); }

  /* ---------- Coeur du moteur : appliquer une note ----------
     Renvoie { card, graduated, lapsed, becameLeech } sans modifier l'original. */
  function answer(original, rating, now, rand) {
    rand = rand || Math.random;
    const c = clone(original);
    const today = dayNumber(now);
    const info = { graduated: false, lapsed: false, becameLeech: false, wasNew: c.s === STATE.NEW };

    if (rating === RATING.AGAIN) c.fails += 1;
    c.reps += 1;
    c.last = now;

    if (c.s === STATE.NEW || c.s === STATE.LEARNING) {
      /* --- Apprentissage : 1 min → 10 min → 1 jour (ou 4 jours si Facile) --- */
      const steps = CONFIG.learningSteps;
      if (c.s === STATE.NEW) { c.s = STATE.LEARNING; c.step = 0; }
      if (rating === RATING.AGAIN) {
        c.step = 0;
        c.due = now + steps[0] * MIN_MS;
      } else if (rating === RATING.HARD) {
        // Comme Anki : sur la 1re étape, délai = moyenne des deux premières étapes
        const delay = (c.step === 0 && steps.length > 1) ? (steps[0] + steps[1]) / 2 : steps[c.step];
        c.due = now + delay * MIN_MS;
      } else if (rating === RATING.GOOD) {
        if (c.step + 1 < steps.length) {
          c.step += 1;
          c.due = now + steps[c.step] * MIN_MS;
        } else {
          graduate(c, CONFIG.graduatingInterval, today, rand);
          info.graduated = true;
        }
      } else if (rating === RATING.EASY) {
        graduate(c, CONFIG.easyInterval, today, rand);
        info.graduated = true;
      }
    } else if (c.s === STATE.REVIEW) {
      /* --- Révision --- */
      const oldEase = c.ease;
      c.ease = clampEase(c.ease + CONFIG.easeDelta[rating]);
      if (rating === RATING.AGAIN) {
        // Oubli : réapprentissage à 10 min, prochain intervalle = moitié (min 1 j)
        c.lapses += 1;
        c.ivl = Math.max(CONFIG.lapseMinInterval, fuzz(c.ivl * CONFIG.lapseFactor, rand));
        c.s = STATE.RELEARNING;
        c.step = 0;
        c.due = now + CONFIG.relearningSteps[0] * MIN_MS;
        info.lapsed = true;
      } else {
        c.ivl = nextReviewInterval(c.ivl, oldEase, rating, rand);
        c.dueDay = today + c.ivl;
      }
    } else if (c.s === STATE.RELEARNING) {
      /* --- Réapprentissage (étape de 10 min) --- */
      const steps = CONFIG.relearningSteps;
      if (rating === RATING.AGAIN || rating === RATING.HARD) {
        c.step = 0;
        c.due = now + steps[0] * MIN_MS;
      } else if (rating === RATING.GOOD && c.step + 1 < steps.length) {
        c.step += 1;
        c.due = now + steps[c.step] * MIN_MS;
      } else {
        // Retour en révision avec l'intervalle réduit calculé au moment de l'oubli
        c.s = STATE.REVIEW;
        c.step = 0;
        c.dueDay = today + c.ivl;
      }
    }

    if (c.fails >= CONFIG.leechFails && !c.leech) { c.leech = true; info.becameLeech = true; }
    info.card = c;
    return info;
  }

  function graduate(c, days, today, rand) {
    c.s = STATE.REVIEW;
    c.step = 0;
    c.ivl = fuzz(days, rand);
    c.dueDay = today + c.ivl;
  }

  /* Intervalles de révision : Difficile ×1,2 · Correct ×facilité · Facile ×facilité×1,3
     (chaque bouton donne au moins 1 jour de plus que le précédent, comme Anki) */
  function nextReviewInterval(ivl, ease, rating, rand) {
    const base = Math.max(1, ivl);
    const hard = Math.max(base + 1, Math.round(base * CONFIG.hardFactor));
    const good = Math.max(hard + 1, Math.round(base * ease));
    const easy = Math.max(good + 1, Math.round(base * ease * CONFIG.easyBonus));
    const raw = rating === RATING.HARD ? hard : rating === RATING.GOOD ? good : easy;
    return fuzz(raw, rand);
  }

  /* ---------- Aperçu des délais affichés sous les boutons (sans aléa) ---------- */
  function preview(card, now) {
    const noFuzz = function () { return 0.5; };
    const out = {};
    [1, 2, 3, 4].forEach(function (r) {
      const res = answer(card, r, now, noFuzz).card;
      out[r] = (res.s === STATE.REVIEW) ? { days: res.dueDay - dayNumber(now) }
                                        : { minutes: Math.round((res.due - now) / MIN_MS) };
    });
    return out;
  }
  function formatDelay(p, u) {
    u = u || { min: 'min', h: 'h', d: 'j', mo: 'mois', y: 'an' };
    const dec = function (x) { return x.toFixed(1).replace('.', ',').replace(',0', ''); };
    if (p.minutes !== undefined) return p.minutes < 60 ? p.minutes + ' ' + u.min : Math.round(p.minutes / 60) + ' ' + u.h;
    const d = p.days;
    if (d < 30) return d + ' ' + u.d;
    if (d < 365) return dec(d / 30) + ' ' + u.mo;
    return dec(d / 365) + ' ' + u.y;
  }

  /* ---------- Format de question choisi par le moteur ---------- */
  function questionFormat(card) {
    if (!card || card.s === STATE.NEW || card.s === STATE.LEARNING) return 'qcm';
    if (card.s === STATE.REVIEW && card.ivl >= CONFIG.matureDays) return 'ecrit-renforce';
    return 'ecrit';
  }

  /* ---------- Palier de maîtrise (pour la collection) ----------
     0 neuve · 1 en apprentissage · 2 jeune (<7 j) · 3 solide (<21 j) · 4 maîtrisée (≥21 j) */
  function tier(card) {
    if (!card || card.s === STATE.NEW) return 0;
    if (card.s === STATE.LEARNING || card.s === STATE.RELEARNING) return 1;
    if (card.ivl < 7) return 2;
    if (card.ivl < CONFIG.matureDays) return 3;
    return 4;
  }

  /* ==========================================================================
     Ordonnanceur : choisit la prochaine carte à présenter
     --------------------------------------------------------------------------
     cards     : objet { id: carte } (progression)
     pool      : tableau des entrées actives, dans l'ordre d'introduction des neuves
     daily     : { newSeen, reviewsDone } du jour
     limits    : { newPerDay, reviewsPerDay }
     ctx       : { count, lastId } de la session en cours
     ========================================================================== */
  function pickNext(cards, pool, now, daily, limits, ctx) {
    const today = dayNumber(now);
    let learnDue = null, learnAhead = null, reviewDue = null, firstNew = null;
    const aheadLimit = now + CONFIG.learnAheadMin * MIN_MS;
    const canReview = daily.reviewsDone < limits.reviewsPerDay;
    const canNew = daily.newSeen < limits.newPerDay;

    for (let i = 0; i < pool.length; i++) {
      const id = pool[i].id;
      const c = cards[id];
      if (!c || c.s === STATE.NEW) {
        if (canNew && !firstNew) firstNew = id;
        continue;
      }
      if (c.s === STATE.LEARNING || c.s === STATE.RELEARNING) {
        if (id === ctx.lastId) continue;
        if (c.due <= now && (!learnDue || c.due < cards[learnDue].due)) learnDue = id;
        else if (c.due <= aheadLimit && (!learnAhead || c.due < cards[learnAhead].due)) learnAhead = id;
      } else if (c.s === STATE.REVIEW && canReview && c.dueDay <= today && id !== ctx.lastId) {
        // Les plus en retard d'abord ; à égalité, ordre mélangé mais stable
        if (!reviewDue || c.dueDay < cards[reviewDue].dueDay ||
            (c.dueDay === cards[reviewDue].dueDay && hash(id + today) < hash(reviewDue + today))) reviewDue = id;
      }
    }

    if (learnDue) return { id: learnDue, kind: 'learning' };
    // Une carte neuve toutes les 4 cartes quand il y a aussi des révisions
    if (reviewDue && firstNew) {
      return (ctx.count % 4 === 3) ? { id: firstNew, kind: 'new' } : { id: reviewDue, kind: 'review' };
    }
    if (reviewDue) return { id: reviewDue, kind: 'review' };
    if (firstNew) return { id: firstNew, kind: 'new' };
    if (learnAhead) return { id: learnAhead, kind: 'learning' };
    // Dernier recours : la seule carte en apprentissage restante est celle qu'on vient de voir
    if (ctx.lastId && cards[ctx.lastId] && cards[ctx.lastId].s % 2 === 1 && cards[ctx.lastId].due <= aheadLimit) {
      return { id: ctx.lastId, kind: 'learning' };
    }
    return null;
  }

  /* Compteurs affichés sur l'accueil */
  function counts(cards, pool, now, daily, limits) {
    const today = dayNumber(now);
    let learning = 0, review = 0, fresh = 0;
    for (let i = 0; i < pool.length; i++) {
      const c = cards[pool[i].id];
      if (!c || c.s === STATE.NEW) fresh++;
      else if (c.s === STATE.REVIEW) { if (c.dueDay <= today) review++; }
      else if (c.due <= now + CONFIG.learnAheadMin * MIN_MS) learning++;
    }
    return {
      learning: learning,
      review: Math.min(review, Math.max(0, limits.reviewsPerDay - daily.reviewsDone)),
      fresh: Math.min(fresh, Math.max(0, limits.newPerDay - daily.newSeen)),
      freshTotal: fresh
    };
  }

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  const SRS = { CONFIG, STATE, RATING, dayNumber, dayKey, newCard, answer, preview, formatDelay,
                questionFormat, tier, pickNext, counts, hash };
  if (typeof module !== 'undefined' && module.exports) module.exports = SRS;
  else root.SRS = SRS;
})(typeof self !== 'undefined' ? self : this);
