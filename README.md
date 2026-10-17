# Wortschatz Klinik

Webapp de révision du vocabulaire allemand **B1 · B2 · C1** pour médecins francophones partant travailler dans un hôpital en Allemagne.
Moteur de répétition espacée façon Anki, habillage et récompenses d'un jeu, **100 % hors ligne** et installable sur téléphone (PWA).

- **2391 entrées** réparties en 17 thèmes : 61 % médical/hospitalier (anamnèse, anatomie, examens, traitements, urgences, communication patient, équipe, chirurgie, maladies, administratif), 39 % allemand général (travail, logement et démarches, vie quotidienne, transports, sentiments, temps, connecteurs).
- Chaque entrée : mot allemand avec article et genre (pluriel pour les noms), niveau, thème, nature, deux phrases d'exemple en allemand en contexte hospitalier.
- HTML + CSS + JavaScript, sans framework, sans dépendance, sans compte, sans clé API.

## Réglages principaux

- **Langue de l'interface** : français ou allemand (la face « question » des cartes reste en français).
- **Apparence** : système, sombre (par défaut) ou clair.
- **Mode de réponse** : *carte à retourner* (par défaut : on touche la carte pour voir l'allemand et les exemples, puis on s'auto-évalue) ou *QCM et saisie* (le moteur choisit QCM pour les cartes neuves, saisie écrite ensuite).
- **Mode Shuffle** : nouvelles cartes dans un ordre aléatoire, tous thèmes actifs confondus (B1 avant B2 avant C1).

## Lancer l'app en local

Le service worker exige `http://localhost` (ou HTTPS) : n'ouvrez pas `index.html` par double-clic.

```bash
python -m http.server 8080
```

puis ouvrez <http://localhost:8080>. (Alternative sans Python : `npx serve .`)

## Déployer gratuitement

### GitHub Pages
1. Poussez le dossier dans un dépôt GitHub.
2. *Settings → Pages → Build and deployment* : source **Deploy from a branch**, branche `main`, dossier `/ (root)`.
3. L'app est publiée sur `https://<utilisateur>.github.io/<dépôt>/`. Tous les chemins sont relatifs : le sous-dossier fonctionne tel quel.

### Netlify
Glissez-déposez le dossier sur <https://app.netlify.com/drop>. Aucune configuration de build n'est nécessaire.

## Installer sur un téléphone (puis utiliser hors ligne)

Ouvrez l'URL HTTPS une fois avec une connexion, puis :
- **Android (Chrome)** : menu ⋮ → *Installer l'application* / *Ajouter à l'écran d'accueil* ;
- **iPhone (Safari)** : bouton Partager → *Sur l'écran d'accueil*.

Lancée depuis l'icône, l'app fonctionne ensuite entièrement sans réseau, même après fermeture complète.

## Mettre à jour le vocabulaire ou le code

1. Modifiez `vocabulaire.js` (ajoutez des entrées avec un **id inédit** ; ne renumérotez jamais un id existant, la progression y est rattachée).
2. Incrémentez `CACHE_VERSION` dans `service-worker.js` (ex. `v1.0.1`).
3. Redéployez. Au prochain lancement en ligne, la nouvelle version est mise en cache et l'ancienne supprimée ; un message propose de recharger.

La progression est stockée dans `localStorage`, indépendamment du cache : une mise à jour ou un vidage du cache ne l'efface pas. Pensez tout de même à **Exporter (JSON)** de temps en temps depuis les Paramètres (bouton **Importer** pour restaurer, par exemple sur un autre appareil).

## Organisation du code

| Fichier | Rôle |
|---|---|
| `index.html` | Structure des écrans, métadonnées PWA |
| `css/app.css` | Charte graphique, animations (transform/opacity uniquement), mobile d'abord |
| `vocabulaire.js` | Corpus, commenté par thème et par niveau ; `LANGUE_CIBLE` en tête de fichier |
| `js/srs.js` | Moteur de répétition espacée et ordonnanceur, sans aucun accès au DOM |
| `js/answer.js` | Correction des réponses écrites (tolérances, une lettre d'écart, diff lettre à lettre) |
| `js/store.js` | Progression en `localStorage`, format versionné, export/import |
| `js/sound.js` | Sons synthétisés avec Web Audio (aucun fichier audio) |
| `js/i18n.js` | Textes de l'interface en français et en allemand |
| `js/app.js` | Interface : sessions, combos, niveaux, série, collection, sprint, paramètres |
| `service-worker.js` | Cache complet à l'installation, stratégie cache-first, nettoyage des anciens caches |
| `fonts/`, `icons/` | Polices Inter et Space Grotesk servies en local, icônes de l'app |

## Règles du moteur (résumé)

- Facteur de facilité initial 2,5 (minimum 1,3) : Encore −0,20, Difficile −0,15, Correct 0, Facile +0,15 (appliqué aux cartes en révision, comme Anki).
- Carte neuve : étapes 1 min puis 10 min ; sortie à 1 jour (Correct) ou 4 jours (Facile).
- Révision : Difficile ×1,2, Correct ×facilité, Facile ×facilité×1,3 ; variation aléatoire ±5 %.
- Encore sur une carte en révision : réapprentissage à 10 min, prochain intervalle = moitié de l'ancien (minimum 1 jour).
- Plafonds par défaut : 30 neuves et 300 révisions par jour ; carte signalée comme problématique après 8 échecs.
- En mode *QCM et saisie*, format choisi par le moteur : QCM pour les cartes neuves (distracteurs du même thème et de la même nature), saisie écrite ensuite, rappel renforcé sans indice au-delà de 21 jours.
- Le mode Sprint (60 s, QCM) ne modifie jamais les intervalles : il rapporte uniquement des points.

## Clavier

`Espace` / `Entrée` ou toucher la carte : retourner la carte · `1`–`4` : notation (et choix du QCM) · `Entrée` : valider ou appliquer la note suggérée · `Échap` : terminer · `Alt+A/O/U/S` : ä ö ü ß (la saisie `ae oe ue ss` est aussi acceptée).

## Licences

Polices Inter et Space Grotesk : SIL Open Font License 1.1.
