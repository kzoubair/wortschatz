/* ==========================================================================
   store.js — Progression de l'apprenant (localStorage, format versionné)
   --------------------------------------------------------------------------
   La progression vit dans localStorage, totalement séparée du cache du
   service worker : vider le cache de l'application n'efface rien ici.
   Les écritures sont regroupées (debounce) pour rester rapides même avec
   des milliers de cartes.
   ========================================================================== */
(function (root) {
  'use strict';

  const KEY = 'wortschatz-progression';
  const FORMAT = 1;                 // à incrémenter si la structure change (voir migrate)

  const DEFAULT_SETTINGS = {
    themes: null,                   // null = tous les thèmes actifs
    levels: ['B1', 'B2', 'C1'],
    dailyGoal: 40,
    sessionLength: 20,
    newPerDay: 30,
    reviewsPerDay: 300,
    requireArticle: true,
    sound: true,
    reduceMotion: false,
    uiLang: 'fr',                   // langue de l'interface : 'fr' | 'de'
    appearance: 'dark',             // 'system' | 'dark' | 'light'
    answerMode: 'flip',             // 'flip' (carte à retourner) | 'engine' (QCM puis saisie)
    shuffle: false,                 // nouvelles cartes mélangées entre thèmes
    shuffleSeed: 1
  };

  function blank() {
    return {
      format: FORMAT,
      created: Date.now(),
      cards: {},                    // { id: carte du moteur SRS }
      daily: { day: '', newSeen: 0, reviewsDone: 0, answered: 0, xp: 0, extraNew: 0 },
      days: {},                     // { 'AAAA-MM-JJ': nombre de cartes révisées }
      xp: 0,
      bestCombo: 0,
      sprintBest: 0,
      settings: Object.assign({}, DEFAULT_SETTINGS)
    };
  }

  /* Migrations successives : data.format N → N+1 */
  const MIGRATIONS = {
    // 1: function (d) { … d.format = 2; return d; }
  };
  function migrate(d) {
    while (d.format < FORMAT && MIGRATIONS[d.format]) d = MIGRATIONS[d.format](d);
    const b = blank();
    d.settings = Object.assign({}, DEFAULT_SETTINGS, d.settings || {});
    d.daily = Object.assign(b.daily, d.daily || {});
    ['cards', 'days'].forEach(function (k) { if (!d[k] || typeof d[k] !== 'object') d[k] = {}; });
    ['xp', 'bestCombo', 'sprintBest'].forEach(function (k) { if (typeof d[k] !== 'number') d[k] = 0; });
    return d;
  }

  let data = null, timer = null;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      data = raw ? migrate(JSON.parse(raw)) : blank();
    } catch (e) {
      console.warn('Progression illisible, nouveau départ', e);
      data = blank();
    }
    return data;
  }
  function saveNow() {
    clearTimeout(timer); timer = null;
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch (e) { console.error('Enregistrement impossible', e); }
  }
  function save() { if (!timer) timer = setTimeout(saveNow, 250); }

  /* Remise à zéro du compteur quotidien quand la journée change */
  function rollDay(key) {
    if (data.daily.day !== key) data.daily = { day: key, newSeen: 0, reviewsDone: 0, answered: 0, xp: 0, extraNew: 0 };
    return data.daily;
  }

  function exportJSON() {
    return JSON.stringify(Object.assign({ app: 'wortschatz', exported: new Date().toISOString() }, data), null, 1);
  }
  function importJSON(text) {
    const d = JSON.parse(text);
    if (!d || typeof d !== 'object' || typeof d.format !== 'number' || !d.cards) throw new Error('Fichier non reconnu');
    if (d.format > FORMAT) throw new Error('Fichier créé par une version plus récente');
    delete d.app; delete d.exported;
    data = migrate(d);
    saveNow();
    return data;
  }
  function reset() {
    const keepSound = data && data.settings ? data.settings.sound : true;
    data = blank();
    data.settings.sound = keepSound;
    saveNow();
    return data;
  }

  // Ne jamais perdre la dernière réponse si l'onglet est fermé
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', function () { if (document.hidden && timer) saveNow(); });
    root.addEventListener('pagehide', function () { if (timer) saveNow(); });
  }

  root.Store = { load: load, save: save, saveNow: saveNow, rollDay: rollDay, exportJSON: exportJSON,
                 importJSON: importJSON, reset: reset, get data() { return data; }, FORMAT: FORMAT };
})(self);
