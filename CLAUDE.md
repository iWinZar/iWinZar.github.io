# CLAUDE.md : portfolio evanbonhoure.me

Site portfolio d'Evan Bonhoure (étudiant admin systèmes, réseaux, cybersécurité ; fait aussi des jeux). Public visé : recruteurs. Hébergé sur GitHub Pages, domaine `evanbonhoure.me` (fichier `CNAME`, ne pas le supprimer).

## Stack et règles

- HTML / CSS / JS statique. Pas de framework, pas de build, pas de backend, pas de dépendance npm.
- Bilingue FR / EN. Responsive avec un vrai menu mobile. Respecter `prefers-reduced-motion`.
- Animations uniquement sur `transform` et `opacity`. Flou d'arrière-plan (`backdrop-filter`) limité à la nav et aux boutons posés sur le décor.
- Police : Source Sans 3 (hébergée dans `assets/fonts/`). Pas d'appel à Google Fonts ni à un CDN.
- Pas d'emojis, pas de témoignages inventés, pas de compteur ou jauge, pas de poissons cartoon.

## Direction artistique

Frutiger Aero mélangé à du verre liquide : ciel, horizon, surface de l'eau, puis sous l'eau (descente au scroll). Boutons capsule en verre avec reflet, cartes en verre, nuages, montagnes, collines, vagues et bulles dessinés en SVG.

À ne pas introduire : dégradé violet/noir, fond blanc pur, néon, arc-en-ciel, bande colorée en haut, grille bento, trois cartes de features identiques, étoiles scintillantes, flèches animées, hover animé partout, puces à checks verts, paliers de pricing.

## Structure

- `index.html` : version française. `en/index.html` : version anglaise.
- Chaque fichier contient deux mises en page : `<div class="desk">` (bureau) et `<div class="mob">` (mobile, affiché sous 760 px). Un changement de texte ou de contenu se fait donc à 4 endroits : FR bureau, FR mobile, EN bureau, EN mobile.
- Les ids de la version mobile sont préfixés par `m-` (`#m-labs`, etc.) pour éviter les doublons. Les ancres mobiles pointent vers ces ids.
- `assets/style.css` : toutes les règles sont préfixées `.desk` ou `.mob`. Les keyframes ont le suffixe `-d` ou `-m`. Une règle à modifier doit l'être des deux côtés si elle concerne les deux mises en page.
- `assets/main.js` : apparition au scroll (`.fa-in` / `.fa-wait`), parallaxe lissée (`data-px`), menu mobile (`data-menu-btn`), démo jouable (`data-demo`).
- `assets/fonts.css`, `assets/writeup.css` : polices et styles du modèle de write-up.
- `_modeles/writeup.html` : modèle de page de write-up (contexte, schéma, étapes, galères, bilan). Le dossier commence par `_`, donc GitHub Pages ne le publie pas.

## À faire

- Jeu de zombies : déposer le build dans `jeux/zombie/index.html`. Le bouton « Jouer » le charge dans la page dès que le fichier existe (sinon il affiche « Démo en préparation »).
- Write-ups : Minecraft modé sur Oracle Cloud (Always Free, Crafty, migration depuis le PC portable) et maquette réseau VirtualBox (Shorewall, DMZ, OpenVPN, Squid). Copier le modèle dans `writeups/`, puis remplacer les boutons « Write-up bientôt » de l'accueil par un lien, en FR et en EN.
- DWELL (UE5) : vidéo et captures à ajouter. RPG façon Undertale : build web à ajouter.
- Email pro : ajouter un bouton dans la section Contact des deux pages, bureau et mobile.
- Les textes affichés ne doivent jamais contenir de champ à remplir (`[...]`) : les pages sont publiques dès le push.

## Tester

```
python -m http.server 8000
```

Ouvrir `http://localhost:8000` (ne pas ouvrir `index.html` en double-cliquant : les chemins `/assets/...` sont absolus). Vérifier à 1440, 900, 390 px, en FR et en EN, menu mobile ouvert, et sans erreur dans la console.

## Publier

`git push` sur `main` : GitHub Pages met le site à jour en une à deux minutes.
