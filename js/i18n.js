/* ==========================================================================
   i18n.js — Textes de l'interface (français / allemand)
   --------------------------------------------------------------------------
   Seule l'interface est traduite : la face « question » des cartes reste en
   français (c'est la langue de départ de l'apprenant).
   Utilisation : I18N.t('cle', { n: 3 }) → remplace {n} dans le texte.
   ========================================================================== */
(function (root) {
  'use strict';

  const STR = {
    fr: {
      settings: 'Paramètres', back: 'Retour', soundOff: 'Couper le son', soundOn: 'Activer le son',
      goalToday: 'Objectif du jour', toReview: 'à revoir', newCards: 'nouvelles', inProgress: 'en cours',
      review: 'Réviser', enterKey: 'Entrée', spaceKey: 'Espace', sprint: 'Sprint 60 s', record: 'record {n}',
      streak: 'Série', day: 'jour', days: 'jours', collection: 'Situations cliniques', mastered: 'ancrés',
      tierNew: 'neuve', tierLearn: 'en cours', tierYoung: 'jeune', tierSolid: 'solide', tierMastered: 'ancrée (≥ 21 j)',
      domMedical: 'Médical et hospitalier', domGeneral: 'Allemand général',
      noPool: 'Aucun thème ou niveau actif : choisis-en dans les paramètres.',
      allDone: 'Tout est à jour pour aujourd\'hui.', moreNew: '+10 nouvelles cartes',
      streakZero: 'Une session aujourd\'hui lance ta série. Un jour de pause par semaine ne la casse pas.',
      streakTol: 'Un jour de pause par semaine est toléré — {s}', tolAvail: 'encore disponible cette semaine.', tolUsed: 'déjà utilisé cette semaine.',
      calCards: '{n} cartes',
      endSession: 'Terminer la session', combo: 'combo', dontKnow: 'Je ne sais pas', validate: 'Valider',
      answerAria: 'Réponse en allemand', choicesAria: 'Choisis la traduction allemande',
      rate1: 'Encore', rate2: 'Difficile', rate3: 'Correct', rate4: 'Facile',
      tapToFlip: 'Touche la carte pour voir le verso', tapAria: 'Retourner la carte',
      modeQcm: 'Choix', modeWrite: 'Écrire', modeStrong: 'Rappel renforcé', modeFlip: 'Retourner',
      noHint: 'sans indice', phArticle: 'article + nom', phTarget: 'en allemand', altHelp: 'Alt + A / O / U / S, ou {s}',
      vRight: 'Juste', vWrongQcm: 'Ce n\'était pas ça', vYouChose: 'Tu as choisi', vAnswer: 'La réponse',
      vSich: 'Juste — n\'oublie pas « sich »', vNear: 'Presque parfait — une lettre d\'écart', vYouWrote: 'Tu as écrit :',
      vBadArticle: 'Mauvais article', vNoArticle: 'Il manque l\'article', vArticleNote: 'Le mot est juste ; l\'article fait partie de la réponse ({g}).',
      vNotQuite: 'Pas tout à fait',
      goalReached: 'Objectif du jour atteint : {n} cartes.', leech: '« {w} » résiste : 8 échecs. Une reformulation aiderait — voir Paramètres.',
      sessionDone: 'Session terminée', sumEmpty: 'Rien à réviser pour l\'instant.', sumGreat: 'Superbe session.', sumGood: 'Bien joué.', sumOk: 'Chaque carte compte.',
      cardsSeen: 'cartes vues', successRate: 'de réussite', anchoredToday: 'mots ancrés', longestCombo: 'plus long combo',
      acquired: 'nouveaux mots appris', acquiredNone: 'Une nouvelle carte compte comme apprise après ses deux étapes d\'apprentissage (1 min puis 10 min).',
      leftToday: '{n} cartes encore disponibles aujourd\'hui.', allDoneTomorrow: 'Tout est à jour. Rendez-vous demain pour les prochaines révisions.',
      continue: 'Continuer', home: 'Accueil',
      stopSprint: 'Arrêter le sprint', score: 'bonnes réponses', accuracy: 'de précision', sprintNote: 'Le sprint rapporte des points sans toucher à tes intervalles de révision.',
      sprintDone: 'Sprint terminé', best: 'record', replay: 'Rejouer', sprintAborted: 'Sprint interrompu.', sprintRecord: 'Nouveau record !', sprintTime: 'Temps écoulé.',
      sprintFewKnown: 'Encore peu de cartes connues : le sprint pioche aussi parmi les prochaines nouvelles.', sprintNoTheme: 'Active au moins un thème pour lancer un sprint.',
      display: 'Affichage', uiLang: 'Langue de l\'interface', appearance: 'Apparence', apSystem: 'Système', apDark: 'Sombre', apLight: 'Clair',
      revision: 'Révision', answerMode: 'Mode de réponse', modeFlipSet: 'Carte à retourner', modeEngineSet: 'QCM et saisie',
      modeFlipHelp: 'Tu touches la carte pour voir l\'allemand et les exemples, puis tu t\'évalues toi-même.',
      modeEngineHelp: 'Le moteur choisit : QCM pour les cartes neuves, saisie écrite ensuite.',
      shuffle: 'Mode Shuffle : thèmes mélangés', shuffleHelp: 'Les nouvelles cartes arrivent dans un ordre aléatoire, tous thèmes actifs confondus (B1 avant B2 avant C1).',
      levelsActive: 'Niveaux actifs', themesActive: 'Thèmes actifs', all: 'Tous', medShort: 'Médical', none: 'Aucun',
      goalSetting: 'Objectif du jour', cardsUnit: 'cartes', sessionLen: 'Longueur de session', newPerDay: 'Nouvelles cartes / jour', reviewsPerDay: 'Révisions / jour',
      requireArticle: 'Article exigé dans les réponses écrites', sounds: 'Sons', reduceMotion: 'Réduire les animations',
      leeches: 'Cartes problématiques', leechHelp: 'Une carte ratée 8 fois est signalée ici. Le plus efficace : la reformuler (ajouter un indice ou une phrase plus parlante dans vocabulaire.js), ou se créer un moyen mnémotechnique, puis la remettre à zéro.',
      leechNone: 'Aucune pour l\'instant.', leechFails: '{n} échecs', leechReset: 'Remettre à zéro', leechDone: 'Carte remise à zéro : elle reviendra comme une carte neuve.',
      backup: 'Sauvegarde', backupHelp: 'La progression est stockée sur cet appareil. Exporte-la régulièrement pour ne jamais la perdre.',
      export: 'Exporter (JSON)', import: 'Importer', exported: 'Progression exportée.',
      importConfirm: 'Remplacer la progression actuelle par celle du fichier « {f} » ?', imported: 'Progression importée : {n} cartes.', importFail: 'Import impossible : {e}',
      resetTitle: 'Remise à zéro', resetBtn: 'Tout effacer…', resetWord: 'EFFACER',
      resetHelp: 'Toute la progression (cartes, points, série) sera effacée définitivement. Tape <b>{w}</b> pour confirmer.', erase: 'Effacer', resetDone: 'Progression effacée.',
      about: '{n} entrées · {t} thèmes · format de sauvegarde v{v}',
      rankUp: 'Nouveau rang', anchoredCount: '{a} / {b} mots ancrés', anchoredTotal: '{a} mots ancrés',
      nextRank: 'Prochain rang : {r} dans {n} mots ancrés', nextRank1: 'Prochain rang : {r} dans 1 mot ancré', topRank: 'Rang le plus élevé atteint.',
      rankHelp: 'Un mot est ancré quand il revient à 21 jours ou plus. Le rang ne redescend jamais.',
      ready: 'prête', readyPct: '{p} % prête', sumRankNext: 'Prochain rang : {r} dans {n} mots ancrés.', sumRankNext1: 'Prochain rang : {r} dans 1 mot ancré.',
      sumProgress: '{s} : {a} % → {b} %', sessionCount: '{a} / {b}',
      offlineNo: 'Mode hors ligne indisponible ici (ouvrir via http://localhost ou en HTTPS).', offlineOk: 'Disponible hors ligne · {n} entrées',
      swFail: 'Service worker non installé : {e}', newVersion: 'Nouvelle version installée.', reload: 'Recharger',
      u_min: 'min', u_h: 'h', u_d: 'j', u_mo: 'mois', u_y: 'an',
      nat_nom: 'nom', nat_verbe: 'verbe', nat_adjectif: 'adjectif', nat_adverbe: 'adverbe', nat_expression: 'expression',
      g_masculin: 'masculin', g_féminin: 'féminin', g_neutre: 'neutre', g_pluriel: 'pluriel', pl: 'pl.'
    },
    de: {
      settings: 'Einstellungen', back: 'Zurück', soundOff: 'Ton aus', soundOn: 'Ton an',
      goalToday: 'Tagesziel', toReview: 'fällig', newCards: 'neu', inProgress: 'im Lernen',
      review: 'Lernen', enterKey: 'Enter', spaceKey: 'Leertaste', sprint: 'Sprint 60 s', record: 'Rekord {n}',
      streak: 'Lernserie', day: 'Tag', days: 'Tage', collection: 'Klinische Situationen', mastered: 'verankert',
      tierNew: 'neu', tierLearn: 'im Lernen', tierYoung: 'jung', tierSolid: 'solide', tierMastered: 'verankert (≥ 21 T.)',
      domMedical: 'Medizin und Klinik', domGeneral: 'Allgemeinwortschatz',
      noPool: 'Kein Thema oder Niveau aktiv: Wähle welche in den Einstellungen.',
      allDone: 'Für heute ist alles erledigt.', moreNew: '+10 neue Karten',
      streakZero: 'Eine Sitzung heute startet deine Serie. Ein Pausentag pro Woche unterbricht sie nicht.',
      streakTol: 'Ein Pausentag pro Woche ist erlaubt — {s}', tolAvail: 'diese Woche noch verfügbar.', tolUsed: 'diese Woche schon genutzt.',
      calCards: '{n} Karten',
      endSession: 'Sitzung beenden', combo: 'Kombo', dontKnow: 'Weiß ich nicht', validate: 'Prüfen',
      answerAria: 'Antwort auf Deutsch', choicesAria: 'Wähle die deutsche Übersetzung',
      rate1: 'Nochmal', rate2: 'Schwer', rate3: 'Gut', rate4: 'Einfach',
      tapToFlip: 'Tippe auf die Karte, um die Rückseite zu sehen', tapAria: 'Karte umdrehen',
      modeQcm: 'Auswahl', modeWrite: 'Schreiben', modeStrong: 'Aktiver Abruf', modeFlip: 'Umdrehen',
      noHint: 'ohne Hinweis', phArticle: 'Artikel + Nomen', phTarget: 'auf Deutsch', altHelp: 'Alt + A / O / U / S oder ae · oe · ue · ss',
      vRight: 'Richtig', vWrongQcm: 'Das war es nicht', vYouChose: 'Deine Wahl:', vAnswer: 'Die Antwort',
      vSich: 'Richtig — vergiss „sich“ nicht', vNear: 'Fast perfekt — ein Buchstabe Abweichung', vYouWrote: 'Deine Eingabe:',
      vBadArticle: 'Falscher Artikel', vNoArticle: 'Der Artikel fehlt', vArticleNote: 'Das Wort ist richtig; der Artikel gehört zur Antwort ({g}).',
      vNotQuite: 'Nicht ganz',
      goalReached: 'Tagesziel erreicht: {n} Karten.', leech: '„{w}“ ist hartnäckig: 8 Fehler. Eine Umformulierung würde helfen — siehe Einstellungen.',
      sessionDone: 'Sitzung beendet', sumEmpty: 'Gerade gibt es nichts zu lernen.', sumGreat: 'Großartige Sitzung.', sumGood: 'Gut gemacht.', sumOk: 'Jede Karte zählt.',
      cardsSeen: 'Karten gesehen', successRate: 'richtig', anchoredToday: 'Wörter verankert', longestCombo: 'längste Kombo',
      acquired: 'neu gelernte Wörter', acquiredNone: 'Neue Karten gelten nach ihren zwei Lernschritten als gelernt.',
      leftToday: 'Heute noch {n} Karten verfügbar.', allDoneTomorrow: 'Alles erledigt. Bis morgen zu den nächsten Wiederholungen.',
      continue: 'Weiter', home: 'Start',
      stopSprint: 'Sprint beenden', score: 'richtige Antworten', accuracy: 'Trefferquote', sprintNote: 'Der Sprint bringt Punkte, ohne deine Wiederholungsintervalle zu verändern.',
      sprintDone: 'Sprint beendet', best: 'Rekord', replay: 'Nochmal', sprintAborted: 'Sprint abgebrochen.', sprintRecord: 'Neuer Rekord!', sprintTime: 'Zeit abgelaufen.',
      sprintFewKnown: 'Noch wenige bekannte Karten: Der Sprint nimmt auch die nächsten neuen Karten dazu.', sprintNoTheme: 'Aktiviere mindestens ein Thema für einen Sprint.',
      display: 'Anzeige', uiLang: 'Sprache der Oberfläche', appearance: 'Darstellung', apSystem: 'System', apDark: 'Dunkel', apLight: 'Hell',
      revision: 'Lernen', answerMode: 'Antwortmodus', modeFlipSet: 'Karte umdrehen', modeEngineSet: 'Auswahl und Eingabe',
      modeFlipHelp: 'Du tippst auf die Karte, siehst das deutsche Wort mit Beispielen und bewertest dich selbst.',
      modeEngineHelp: 'Der Algorithmus wählt: Auswahl für neue Karten, danach schriftliche Eingabe.',
      shuffle: 'Shuffle-Modus: Themen gemischt', shuffleHelp: 'Neue Karten kommen in zufälliger Reihenfolge aus allen aktiven Themen (B1 vor B2 vor C1).',
      levelsActive: 'Aktive Niveaus', themesActive: 'Aktive Themen', all: 'Alle', medShort: 'Medizin', none: 'Keine',
      goalSetting: 'Tagesziel', cardsUnit: 'Karten', sessionLen: 'Sitzungslänge', newPerDay: 'Neue Karten / Tag', reviewsPerDay: 'Wiederholungen / Tag',
      requireArticle: 'Artikel bei schriftlichen Antworten verlangen', sounds: 'Töne', reduceMotion: 'Animationen reduzieren',
      leeches: 'Problemkarten', leechHelp: 'Eine Karte mit 8 Fehlern erscheint hier. Am besten formulierst du sie um (Hinweis oder treffenderes Beispiel in vocabulaire.js) oder suchst dir eine Eselsbrücke und setzt sie dann zurück.',
      leechNone: 'Bisher keine.', leechFails: '{n} Fehler', leechReset: 'Zurücksetzen', leechDone: 'Karte zurückgesetzt: Sie kommt wie eine neue Karte wieder.',
      backup: 'Sicherung', backupHelp: 'Der Fortschritt wird auf diesem Gerät gespeichert. Exportiere ihn regelmäßig, damit nichts verloren geht.',
      export: 'Exportieren (JSON)', import: 'Importieren', exported: 'Fortschritt exportiert.',
      importConfirm: 'Aktuellen Fortschritt durch die Datei „{f}“ ersetzen?', imported: 'Fortschritt importiert: {n} Karten.', importFail: 'Import nicht möglich: {e}',
      resetTitle: 'Zurücksetzen', resetBtn: 'Alles löschen…', resetWord: 'LÖSCHEN',
      resetHelp: 'Der gesamte Fortschritt (Karten, Punkte, Serie) wird endgültig gelöscht. Tippe <b>{w}</b> zur Bestätigung.', erase: 'Löschen', resetDone: 'Fortschritt gelöscht.',
      about: '{n} Einträge · {t} Themen · Speicherformat v{v}',
      rankUp: 'Neuer Rang', anchoredCount: '{a} / {b} verankerte Wörter', anchoredTotal: '{a} verankerte Wörter',
      nextRank: 'Nächster Rang: {r} in {n} verankerten Wörtern', nextRank1: 'Nächster Rang: {r} in 1 verankerten Wort', topRank: 'Höchster Rang erreicht.',
      rankHelp: 'Ein Wort gilt als verankert, wenn es erst nach 21 Tagen oder später wiederkommt. Der Rang sinkt nie.',
      ready: 'bereit', readyPct: '{p} % bereit', sumRankNext: 'Nächster Rang: {r} in {n} verankerten Wörtern.', sumRankNext1: 'Nächster Rang: {r} in 1 verankerten Wort.',
      sumProgress: '{s}: {a} % → {b} %', sessionCount: '{a} / {b}',
      offlineNo: 'Offline-Modus hier nicht verfügbar (über http://localhost oder HTTPS öffnen).', offlineOk: 'Offline verfügbar · {n} Einträge',
      swFail: 'Service Worker nicht installiert: {e}', newVersion: 'Neue Version installiert.', reload: 'Neu laden',
      u_min: 'Min.', u_h: 'Std.', u_d: 'T.', u_mo: 'Mon.', u_y: 'J.',
      nat_nom: 'Nomen', nat_verbe: 'Verb', nat_adjectif: 'Adjektiv', nat_adverbe: 'Adverb', nat_expression: 'Ausdruck',
      g_masculin: 'maskulin', g_féminin: 'feminin', g_neutre: 'neutral', g_pluriel: 'Plural', pl: 'Pl.'
    }
  };

  /* Noms des thèmes en allemand (le français vient de vocabulaire.js) */
  const THEME_DE = {
    anamnese: 'Anamnese und Symptome', anatomie: 'Anatomie und Körper', examens: 'Untersuchung und Diagnose',
    traitements: 'Therapie und Medikamente', urgences: 'Notfall- und Intensivmedizin', patient: 'Kommunikation mit Patienten',
    equipe: 'Team und Übergabe', chirurgie: 'Chirurgie', maladies: 'Krankheiten und Fachgebiete', admin: 'Klinikverwaltung',
    travail: 'Arbeit und Kollegen', logement: 'Wohnen und Behörden', quotidien: 'Alltag', transports: 'Verkehr und Unterwegs',
    sentiments: 'Gefühle und Meinungen', temps: 'Zeit und Mengen', connecteurs: 'Konnektoren und Wendungen'
  };

  /* Rangs hospitaliers : seuil = nombre de mots ancrés (intervalle ≥ 21 jours) */
  const RANKS = [
    { name: 'Hospitant', min: 0 }, { name: 'Famulant', min: 50 }, { name: 'PJ-Student', min: 150 },
    { name: 'Assistenzarzt', min: 350 }, { name: 'Facharzt', min: 700 }, { name: 'Oberarzt', min: 1200 },
    { name: 'Chefarzt', min: 1800 }
  ];

  /* Chaque thème correspond à une situation concrète ; « prête » à 80 % de mots ancrés */
  const SITUATIONS = {
    fr: {
      anamnese: 'Mener un interrogatoire complet', anatomie: 'Localiser et décrire précisément',
      examens: 'Demander et commenter des examens', traitements: 'Prescrire et expliquer un traitement',
      urgences: 'Gérer une urgence en allemand', patient: 'Informer et rassurer un patient',
      equipe: 'Faire une transmission', chirurgie: 'Suivre un patient opéré',
      maladies: 'Discuter d’un diagnostic avec un collègue', admin: 'Gérer les formalités de l’hôpital',
      travail: 'Échanger avec ses collègues', logement: 'Se loger et faire ses démarches',
      quotidien: 'Vivre au quotidien en Allemagne', transports: 'Se déplacer sans souci',
      sentiments: 'Exprimer son ressenti et son avis', temps: 'Parler de durées et de chiffres',
      connecteurs: 'Argumenter avec nuance'
    },
    de: {
      anamnese: 'Eine vollständige Anamnese erheben', anatomie: 'Befunde anatomisch genau beschreiben',
      examens: 'Untersuchungen anordnen und besprechen', traitements: 'Therapien verordnen und erklären',
      urgences: 'Einen Notfall auf Deutsch managen', patient: 'Patienten aufklären und beruhigen',
      equipe: 'Eine Übergabe machen', chirurgie: 'Operierte Patienten betreuen',
      maladies: 'Diagnosen mit Kollegen besprechen', admin: 'Klinikformalitäten erledigen',
      travail: 'Sich mit Kollegen austauschen', logement: 'Wohnung finden und Behördengänge erledigen',
      quotidien: 'Den Alltag in Deutschland meistern', transports: 'Problemlos unterwegs sein',
      sentiments: 'Gefühle und Meinungen ausdrücken', temps: 'Über Zeiten und Zahlen sprechen',
      connecteurs: 'Differenziert argumentieren'
    }
  };

  let lang = 'fr';
  const I18N = {
    setLang: function (l) { lang = STR[l] ? l : 'fr'; },
    get lang() { return lang; },
    t: function (key, vars) {
      let s = (STR[lang] && STR[lang][key]) || STR.fr[key] || key;
      if (vars) Object.keys(vars).forEach(function (k) { s = s.split('{' + k + '}').join(vars[k]); });
      return s;
    },
    RANKS: RANKS,
    situation: function (code) { return (SITUATIONS[lang] || SITUATIONS.fr)[code] || ''; },
    theme: function (t) { return lang === 'de' && THEME_DE[t.code] ? THEME_DE[t.code] : t.nom; },
    /* Applique les attributs data-i18n du HTML */
    apply: function (rootEl) {
      const r = rootEl || document;
      r.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = I18N.t(el.getAttribute('data-i18n')); });
      r.querySelectorAll('[data-i18n-html]').forEach(function (el) { el.innerHTML = I18N.t(el.getAttribute('data-i18n-html'), { w: I18N.t('resetWord') }); });
      r.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
        const v = I18N.t(el.getAttribute('data-i18n-aria'));
        el.setAttribute('aria-label', v); el.setAttribute('title', v);
      });
      document.documentElement.lang = lang;
    }
  };
  root.I18N = I18N;
})(self);
