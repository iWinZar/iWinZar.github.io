# CLAUDE.md : portfolio evanbonhoure.me

Site portfolio d'Evan Bonhoure (étudiant admin systèmes, réseaux, cybersécurité ; fait aussi des jeux). Public visé : recruteurs. Hébergé sur GitHub Pages, domaine `evanbonhoure.me` (fichier `CNAME`, ne pas le supprimer).

## Stack et règles

- HTML / CSS / JS statique. Pas de framework, pas de build, pas de backend, pas de dépendance npm.
- Bilingue FR / EN. Responsive avec un vrai menu mobile. Respecter `prefers-reduced-motion` : dans ce cas, pas de démarrage, pas de bulles, pas de parallaxe, tout s'affiche directement.
- Animations uniquement sur `transform` (y compris les propriétés `rotate`, `scale` et `translate`) et `opacity`. Exceptions assumées, à ne pas multiplier : l'iris de fin de démarrage (rayon d'un masque, une seconde, une fois), et la couleur du texte de la nav et des titres quand le fond change (sous l'eau, la nuit).
- Flou d'arrière-plan (`backdrop-filter`) limité à la nav et aux boutons posés sur le décor.
- Police : Source Sans 3 (hébergée dans `assets/fonts/`). Pas d'appel à Google Fonts ni à un CDN. Le terminal et l'écran de démarrage utilisent la police à chasse fixe du système (aucun fichier à charger).
- Pas d'emojis, pas de témoignages inventés, pas de compteur ou jauge, pas de poissons cartoon.
- Les textes affichés ne doivent jamais contenir de champ à remplir (`[...]`) : les pages sont publiques dès le push.

## Direction artistique

Frutiger Aero mélangé à du verre liquide : ciel, horizon, surface de l'eau, puis sous l'eau (descente au scroll). Boutons capsule en verre avec reflet, cartes en verre, nuages, montagnes, collines, vagues et bulles dessinés en SVG.

Premier écran : deux éléments seulement, le titre avec ses deux boutons et le terminal, plus les rayons du soleil (`.fa-sun`). Ne pas y rajouter de carte ni de liste : Evan trouvait la page éparpillée.

Goûts d'Evan (novembre 2026), à respecter :

- Pas de petits textes séparés par des points médians (« Réseau · Sécurité »), qu'il trouve « trop IA ». Dans les schémas, le sous-titre d'un nœud passe à la ligne (« vpn » puis « OpenVPN »).
- Pas de pastilles numérotées (« Lab 01 », « Jeu 03 »).
- Peu de texte : la ligne en majuscules et la phrase sous le titre, le compteur « 4 projets · 2 familles », la ligne « Contexte · Schéma · … » et la mention du pied de page ont été retirés à sa demande.
- Il veut un effet à l'arrivée, mais sobre : un seul effet fort plutôt qu'une accumulation (voir Démarrage).

À ne pas introduire : dégradé violet/noir, fond blanc pur, néon, arc-en-ciel, bande colorée en haut, grille bento, trois cartes de features identiques, étoiles scintillantes, flèches animées, hover animé partout (les effets de survol sont réservés aux boutons et aux cartes), puces à checks verts, paliers de pricing.

## Fichiers

- `index.html` : version française. `en/index.html` : version anglaise.
- Chaque fichier contient deux mises en page : `<div class="desk">` (bureau) et `<div class="mob">` (mobile, affiché sous 760 px). Un changement de texte ou de contenu se fait donc à 4 endroits : FR bureau, FR mobile, EN bureau, EN mobile. Chaque mise en page tient sur une seule très longue ligne : pour une modification répétée, un petit script Python qui remplace des chaînes exactes aux 4 endroits est plus sûr qu'une édition à la main.
- Les ids de la version mobile sont préfixés par `m-` (`#m-labs`, etc.) pour éviter les doublons. Les ancres mobiles pointent vers ces ids.
- Hors des deux mises en page, donc une seule fois par fichier : le script en ligne du `<head>` et l'écran de démarrage `.fa-boot` juste après `<body>`.
- `assets/style.css` : les règles des composants sont préfixées `.desk` ou `.mob`, et une règle qui concerne les deux mises en page doit être écrite des deux côtés. Les keyframes d'origine ont le suffixe `-d` ou `-m` ; celles des blocs ajoutés ensuite (communs aux deux mises en page) n'en ont pas. Ne sont pas préfixés : le démarrage (`.fa-boot…`), les calques créés par le script (`.fa-fx`, `.fa-rip`) et les règles `html[data-sky=…]`.
- `assets/main.js` : tout le comportement, sans dépendance. Sections numérotées dans le fichier.
- `assets/fonts.css`, `assets/writeup.css` : polices et styles du modèle de write-up.
- `_modeles/writeup.html` : modèle de page de write-up (contexte, schéma, étapes, galères, bilan). Le dossier commence par `_`, donc GitHub Pages ne le publie pas.

## Page, de haut en bas

- **Nav** : sur bureau, `main.js` injecte une pastille de verre (`.fa-nav-pill`) qui glisse vers le lien de la section en cours ; sur mobile, le lien actif du menu reçoit `aria-current`. Le lien de changement de langue garde la section en cours (`/en/#labs`), et le passage FR / EN se fait en fondu (`@view-transition`). La nav passe en verre sombre (`.fa-deep`) sous la surface de l'eau et la nuit.
- **Haut de page** : titre sur deux lignes, deux boutons, terminal.
- **Labs** : deux cartes, chacune avec son schéma, son texte, ses étiquettes `.fa-tag` et un bouton « Write-up bientôt » désactivé.
- **Surface de l'eau** : bloc des vagues (`.fa-heave`), entre le ciel et le fond.
- **Jeux** : carte du jeu de zombies avec lecteur (`.fa-demo`), carte du RPG en pleine largeur.
- **Fin de page** : à propos et contact dans une même carte de verre sombre (`.fa-pane-dark`), puis le bouton « Remonter à la surface ».

## Comportements (`main.js` et `style.css`)

### Démarrage

- `.fa-boot` : l'écran s'allume comme un vieux moniteur, dix lignes défilent au centre, l'orbe apparaît seul avec le nom, puis l'écran s'ouvre en iris sur le site. Durée : 6,4 s.
- Historique des essais, pour ne pas y revenir : la version à 2,7 s était trop rapide pour lire ; la version avec rayons, voiles colorés et bulles autour de l'orbe a été jugée « super moche ». Rester sobre.
- Le script en ligne du `<head>` pose `fa-booting` sur `<html>` une fois par session (`sessionStorage`, clé `fa-boot`), jamais si `prefers-reduced-motion`. Pas rejoué au rechargement ni au changement de langue.
- Toute l'animation est en CSS (repères de temps en tête du bloc). `main.js` gère « Passer » (bouton, clic, touche) et pose `fa-booted` à la fin. `--fa-b` retarde les apparitions `.fa-up` du haut de page jusqu'à l'ouverture.
- Les libellés sont dans le HTML (FR et EN). Pas de barre de progression (règle « pas de jauge »).
- Attention aux noms de classes : une classe posée sur `<html>` ne doit pas porter le nom d'un composant. `fa-boot-skip` est le bouton ; l'état « on passe » s'appelle `fa-boot-out` (la confusion avait bloqué le défilement).

### Terminal en verre

- `<section data-term>` (`#terminal` et `#m-terminal`) dans le haut de page. Sur bureau il est posé en 3D (`.fa-hero-term`) et se remet à plat au survol ou à la saisie ; il est exclu de l'inclinaison des cartes.
- La coquille est dans le HTML aux 4 endroits, `termOn()` fait le reste. À l'arrivée à l'écran il tape tout seul `whoami` puis `ls`.
- Rien n'est inventé : les réponses sont lues dans la page (titre `h3`, paragraphe suivant, `.fa-tag`, `#apropos`, `#contact`). Un texte modifié dans le HTML change aussi dans le terminal.
- L'arborescence (`FILES` dans `termOn`) associe un nom à l'id d'une carte : une nouvelle carte doit y être ajoutée.
- Commandes : `help`, `whoami`, `ls`, `cat`, `cd` (fait défiler jusqu'à la carte), `play` (lance la démo), `contact`, `theme`, `clear`, `reboot` (rejoue le démarrage), plus `sudo`, `pwd`, `echo`. Tab complète, ↑ rappelle. Garder la liste courte et les boutons de commandes visibles : tout le monde ne tape pas.

### Apparitions et relief

- `.fa-up` : apparition au chargement (haut de page). `.fa-in` / `.fa-wait` : apparition au scroll, une seule fois. Les deux se font en 3D (`perspective` + `rotateX`).
- Cartes : un reflet traverse le verre une fois à l'apparition (`.fa-pane::after`), les étiquettes `.fa-tag` arrivent en cascade. Les grands titres de section sont découpés en lettres (`.fa-ch`) qui se redressent.
- Souris : `main.js` incline les cartes `.fa-win` (propriété `rotate`, classe `.fa-tilt`, reflet `.fa-glare` injecté), fait basculer les boutons `.fa-btn` (variables `--rx`, `--ry`, `--mx`, `--my`) et décale le décor selon le pointeur.
- Tactile : les cartes basculent selon leur place à l'écran pendant le défilement (`tilts` dans `motionOn`), le décor suit le gyroscope (`deviceorientation`, sans demande d'autorisation, donc pas sur iOS), le reflet d'un bouton naît sous le doigt.
- Boutons en verre : la couleur d'un `.fa-btn` est dans `--fa-fill` (posée sur `::before`) et s'efface à moitié au survol pour laisser voir le verre (`--fa-clear`). Un nouveau variant de bouton doit définir ces deux variables.
- Parallaxe lissée sur les éléments `data-px`, calculée sur le temps écoulé (même rendu à 60, 120 ou 144 Hz). Les boucles du décor (nuages, bulles, vagues, algues, rayons, particules) sont mises en pause hors écran (`.fa-off`).
- Ancres : un lien `#id` vers une carte pas encore apparue passe par `jump()`, qui vise sa place finale (sans le décalage de l'apparition).

### Schémas vivants

- Chaque fil d'un schéma est un `<span class="fa-wire fa-wire-h|fa-wire-v" data-pk="flux:étape:départ:arrivée">` (positions en % du fil, plusieurs flux séparés par un espace). Un nouveau schéma doit porter ces attributs dans les 4 mises en page.
- `flowsOn()` y fait circuler des paquets (`.fa-pk`, flux `a` bleu, les suivants verts) et fait pulser le nœud d'arrivée. Nœuds, zones et fils se montent un par un à l'apparition (`--fa-i`).
- Flux actuels : migration et connexion des joueurs (Minecraft) ; Internet vers la DMZ et LAN vers Internet (maquette réseau). Ces deux derniers sont une hypothèse de configuration classique, pas les vraies règles Shorewall d'Evan : à confirmer avec lui.

### Ciel selon l'heure

- Le script du `<head>` pose `data-sky` sur `<html>` selon l'heure du visiteur : `night` de 21 h à 6 h, `dusk` de 18 h à 21 h et de 6 h à 8 h, `day` sinon.
- `.fa-sky` remplace le ciel le soir. `.fa-tint` (trois calques : ciel, vagues, fond) teinte tout le décor par multiplication, le soir et la nuit. `.fa-stars` et `.fa-moon` n'apparaissent que la nuit ; les étoiles sont fixes, sans scintillement.
- La teinte du ciel s'arrête là où commence le bloc des vagues (84 px sur bureau, 58 px sur mobile) : sinon les deux teintes se superposent et font une bande sombre à l'horizon.
- La nuit, le titre et l'intro des labs passent en clair et la nav en verre sombre.
- Pour voir les trois ciels : commande `theme jour | soir | nuit | auto` du terminal (non mémorisée, un rechargement revient à l'heure réelle).

### Eau

- Bulles du décor : elles éclatent au clic puis se reforment (`.fa-drop` = gouttelettes).
- Surface : les trois plans de vagues glissent avec le pointeur, le passage du pointeur sur les vagues laisse de petites ondes, un clic fait partir trois anneaux et des gouttes (`ripple()`, calque `.fa-rip`).
- Bulles libres (`bubble()`, calque fixe `.fa-fx`) : gerbe quand la surface traverse le milieu de l'écran, sillage du pointeur ou du doigt sous l'eau (hors cartes et boutons), colonne de bulles au clic sur `[data-rise]`.
- `.fa-snow` : particules en suspension sous l'eau (un élément, des `box-shadow`).
- Lampe des profondeurs (`.fa-lamp`, dernier enfant du décor sous-marin) : voile sombre fixe percé d'un rond de lumière, au-dessus du décor et sous le contenu, donc les cartes restent lisibles. Son opacité suit la profondeur, le rond suit le pointeur ; sur tactile il reste au centre de l'écran.

### Démo jouable

- `data-demo` (`play`, `stop`, `restart`, `full`) dans le lecteur, `data-demo-go` pour un bouton placé hors du lecteur. Le jeu n'est chargé qu'au clic, et seulement si `jeux/zombie/index.html` existe ; sinon le lecteur affiche « Démo en préparation » (et la console signale un 404, c'est attendu).

## Journal

### Novembre 2026

- Relief 3D : cartes inclinées avec reflet, boutons en verre qui basculent, décor qui suit le pointeur.
- Retrait du jeu d'horreur DWELL (pages, README). La carte RPG prend toute la largeur sur bureau.
- Retrait de textes à la demande d'Evan (voir Goûts), des pastilles numérotées et de la carte « Projets » du haut de page.
- Schémas vivants, pastille de nav, changement de langue en fondu qui garde la section, bulles qui éclatent, reflet et cascades à l'apparition, pause du décor hors écran.
- Recherche sur ce qui fait un bon portfolio (une quinzaine de sources). À retenir : le premier écran décide ; en cybersécurité, c'est le write-up avec schéma et méthode qui compte ; une seule idée forte tenue partout ; une intro animée doit être passable et jouée une fois ; un terminal doit garder peu de commandes et rester doublé d'un site classique.
- Terminal en verre et écran de démarrage (trois versions, voir Démarrage).
- Haut de page refait : titre agrandi et terminal côte à côte, rayons du soleil.
- Plongée : nav en verre sombre, gerbe de bulles à la surface, sillage, particules, carte de fin, bouton « Remonter à la surface ».
- Effets tactiles : cartes qui basculent au défilement, gyroscope, reflet sous le doigt.
- Ciel selon l'heure, lampe des profondeurs, surface de l'eau vivante.
- Corrections au passage : le second bouton « Lancer la démo » ne faisait rien ; un lien vers une carte pas encore apparue s'arrêtait environ 130 px trop bas.

## À faire

Contenu (en attente d'Evan) :

- Jeu de zombies : déposer le build dans `jeux/zombie/index.html`. Tant qu'il n'y est pas, le bouton principal « Lancer une démo » mène à « Démo en préparation ».
- Write-ups : Minecraft modé sur Oracle Cloud (Always Free, Crafty, migration depuis le PC portable) et maquette réseau VirtualBox (Shorewall, DMZ, OpenVPN, Squid). Copier le modèle dans `writeups/`, puis remplacer les boutons « Write-up bientôt » de l'accueil par un lien, en FR et en EN.
- RPG façon Undertale : build web et visuel à ajouter (le cadre affiche « Visuel à venir »).
- Email pro : ajouter un bouton dans la section Contact des deux pages, bureau et mobile.
- Confirmer les flux du schéma réseau avec les vraies règles Shorewall.

Technique :

- Aucune image d'aperçu pour le partage du lien (`og:image`) : à générer à partir du premier écran.
- Page 404 : nue, sans icône d'onglet, hors du style du site.
- Jamais testé sur un vrai téléphone, ni dans Firefox ou Safari ; vitesse et accessibilité non mesurées. Tout a été vérifié dans Chrome, le mobile en simulation.
- CSS mort depuis les retraits : `.fa-chip`, `.fa-row`, `.fa-thumb`, `.fa-t1` à `.fa-t5`, `.fa-link-l`.
- Deux mises en page complètes par fichier : chaque changement se fait à 4 endroits et la page contient deux `h1`. Les fusionner en une seule page adaptative est un gros chantier, à faire avant d'ajouter beaucoup de contenu.
- Le démarrage dure 6,4 s à chaque nouvel onglet : envisager une version courte pour les visiteurs qui reviennent.

Idées gardées de côté : pare-feu interactif (un paquet passe ou éclate selon les vraies règles), commandes du terminal qui agissent sur la page (`ping`, `dive`), extinction (`shutdown`) en pendant du démarrage, tunnel VPN dans le schéma, aperçus de gameplay dans les cartes de jeux, son discret coupé par défaut.

## Tester

```
python -m http.server 8000
```

Ouvrir `http://localhost:8000` (ne pas ouvrir `index.html` en double-cliquant : les chemins `/assets/...` sont absolus). Vérifier à 1440, 900, 390 px, en FR et en EN, menu mobile ouvert, et sans erreur dans la console.

- Après une modification de `style.css` ou `main.js`, recharger avec Ctrl + F5 : le navigateur garde volontiers l'ancienne version en cache.
- Le démarrage ne joue qu'une fois par onglet. Pour le revoir : taper `reboot` dans le terminal du site, ou ouvrir un nouvel onglet.
- Les trois ciels : `theme jour`, `theme soir`, `theme nuit` dans le terminal du site.

## Publier

`git push` sur `main` : GitHub Pages met le site à jour en une à deux minutes.
