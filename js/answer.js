/* ==========================================================================
   answer.js — Correction des réponses écrites
   --------------------------------------------------------------------------
   Tolérés : majuscules, espaces superflus, ponctuation, accents autres que
   l'Umlaut, saisie « ae / oe / ue / ss » pour « ä / ö / ü / ß ».
   Une seule lettre d'écart est acceptée (mots de 4 lettres et plus), mais
   l'écart est signalé lettre par lettre pour l'affichage.
   Aucune dépendance au DOM (testable dans Node).
   ========================================================================== */
(function (root) {
  'use strict';

  const PUNCT = /[.,!?;:'’"„“«»()\-–]/;
  const UMLAUT_BASE = { 'ä': 'a', 'ö': 'o', 'ü': 'u' };

  /* Lettre « de base » : minuscule, accents retirés SAUF l'Umlaut */
  function base(ch) {
    const l = ch.toLowerCase();
    if (UMLAUT_BASE[l] || l === 'ß') return l;
    return l.normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  function isPunct(ch) { return PUNCT.test(ch); }
  function clean(s) { return String(s || '').replace(/\s*(\.{2,}|…)\s*/g, ' ').replace(/\s+/g, ' ').trim(); }

  /* ---------- Alignement (distance d'édition pondérée) ----------
     Renvoie la distance et, pour chaque lettre attendue, son statut :
     'ok' | 'sub' (erronée) | 'miss' (manquante) ; plus les positions où
     l'apprenant a tapé une lettre en trop ('extra' avant l'indice k). */
  function align(expected, input) {
    const E = Array.from(expected), I = Array.from(input.toLowerCase());
    const n = E.length, m = I.length;
    const D = [];
    for (let i = 0; i <= n; i++) { D.push(new Array(m + 1).fill(Infinity)); }
    D[0][0] = 0;
    for (let i = 0; i <= n; i++) {
      for (let j = 0; j <= m; j++) {
        const cur = D[i][j];
        if (cur === Infinity) continue;
        if (i < n && j < m) {
          const cost = base(E[i]) === base(I[j]) ? 0 : 1;
          if (cur + cost < D[i + 1][j + 1]) D[i + 1][j + 1] = cur + cost;
        }
        if (i < n) {           // lettre attendue absente de la saisie
          const cost = (isPunct(E[i]) ? 0 : 1);
          if (cur + cost < D[i + 1][j]) D[i + 1][j] = cur + cost;
        }
        if (j < m) {           // lettre en trop dans la saisie
          const cost = (isPunct(I[j]) || (I[j] === ' ' && (j === 0 || I[j - 1] === ' '))) ? 0 : 1;
          if (cur + cost < D[i][j + 1]) D[i][j + 1] = cur + cost;
        }
        if (i + 1 < n && j + 1 < m && base(E[i]) !== base(I[j]) &&
            base(E[i]) === base(I[j + 1]) && base(E[i + 1]) === base(I[j])) { // deux lettres inversées
          if (cur + 1 < D[i + 2][j + 2]) D[i + 2][j + 2] = cur + 1;
        }
        if (i < n && j + 1 < m) { // ä ↔ ae, ö ↔ oe, ü ↔ ue, ß ↔ ss
          const e = E[i].toLowerCase(), pair = I[j] + I[j + 1];
          if ((UMLAUT_BASE[e] && pair === UMLAUT_BASE[e] + 'e') || (e === 'ß' && pair === 'ss')) {
            if (cur < D[i + 1][j + 2]) D[i + 1][j + 2] = cur;
          }
        }
      }
    }
    // Remontée du chemin pour annoter chaque lettre
    const marks = new Array(n).fill('ok');
    const extras = [];
    let i = n, j = m;
    while (i > 0 || j > 0) {
      const cur = D[i][j];
      if (i > 0 && j > 1) {
        const e = E[i - 1].toLowerCase(), pair = I[j - 2] + I[j - 1];
        if (((UMLAUT_BASE[e] && pair === UMLAUT_BASE[e] + 'e') || (e === 'ß' && pair === 'ss')) && D[i - 1][j - 2] === cur) {
          i -= 1; j -= 2; continue;
        }
      }
      if (i > 1 && j > 1 && base(E[i - 2]) !== base(I[j - 2]) && base(E[i - 2]) === base(I[j - 1]) &&
          base(E[i - 1]) === base(I[j - 2]) && D[i - 2][j - 2] + 1 === cur) {
        marks[i - 2] = 'sub'; marks[i - 1] = 'sub'; i -= 2; j -= 2; continue;
      }
      if (i > 0 && j > 0) {
        const cost = base(E[i - 1]) === base(I[j - 1]) ? 0 : 1;
        if (D[i - 1][j - 1] + cost === cur) { if (cost) marks[i - 1] = 'sub'; i--; j--; continue; }
      }
      if (i > 0) {
        const cost = isPunct(E[i - 1]) ? 0 : 1;
        if (D[i - 1][j] + cost === cur) { if (cost) marks[i - 1] = 'miss'; i--; continue; }
      }
      if (D[i][j - 1] !== cur) extras.push(i);
      j--;
    }
    return { distance: D[n][m], marks: marks, extras: extras };
  }

  /* Sépare l'article éventuel du reste de la saisie */
  function splitArticle(text, articles) {
    const t = clean(text);
    const sp = t.indexOf(' ');
    if (sp > 0) {
      const first = t.slice(0, sp).toLowerCase();
      if (articles.indexOf(first) >= 0) return { article: first, word: t.slice(sp + 1) };
    }
    return { article: null, word: t };
  }

  function letters(s) { return Array.from(s).filter(function (c) { return !isPunct(c) && c !== ' '; }).length; }

  /* ---------- Vérification d'une réponse ----------
     entry  : entrée du vocabulaire (de, article, nature, alt)
     opts   : { articles: ['der','die','das'], requireArticle: true } */
  function check(input, entry, opts) {
    opts = opts || {};
    const articles = opts.articles || [];
    const typed = clean(input);
    const forms = [entry.t || entry.de].concat(entry.alt || []);
    let best = null;

    forms.forEach(function (form) {
      const exp = (entry.nature === 'nom') ? splitArticle(form, articles) : { article: null, word: clean(form) };
      let given = { article: null, word: typed };
      if (exp.article) given = splitArticle(typed, articles);

      let word = exp.word, note = null;
      // « sich » oublié devant un verbe pronominal : accepté mais signalé
      if (/^sich /i.test(word) && !/^sich /i.test(given.word)) {
        const a0 = align(word.slice(5), given.word);
        if (a0.distance === 0) { note = 'sich'; word = word.slice(5); }
      }
      const a = align(word, given.word);
      const tolerance = letters(word) >= 4 ? 1 : 0;
      const articleOk = !exp.article || given.article === exp.article ||
                        (given.article === null && !opts.requireArticle);
      const res = {
        form: form,
        word: word,
        prefix: note === 'sich' ? 'sich ' : '',
        expectedArticle: exp.article,
        givenArticle: given.article,
        articleOk: articleOk,
        distance: a.distance,
        wordOk: a.distance <= tolerance,
        exact: a.distance === 0,
        marks: a.marks,
        extras: a.extras,
        note: note,
        empty: typed.length === 0
      };
      res.ok = res.wordOk && res.articleOk && !res.empty;
      const score = (res.ok ? 0 : 100) + res.distance + (res.articleOk ? 0 : 10);
      if (!best || score < best.score) { res.score = score; best = res; }
    });
    return best;
  }

  const Answer = { check: check, align: align, base: base };
  if (typeof module !== 'undefined' && module.exports) module.exports = Answer;
  else root.Answer = Answer;
})(typeof self !== 'undefined' ? self : this);
