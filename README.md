# 🏎️ Super Kart Champions 3D

> **Réalisé par ANTON NELCON Steve**  
> Un jeu de course arcade 3D complet inspiré de Mario Kart, propulsé par **Three.js** et **TypeScript**.  
> **100% jouable directement dans votre navigateur web sans rien installer** et prêt à être déployé sur **GitHub Pages** en 2 clics !

---
 https://an-steve.github.io/SuperKart-Champion-3D/
## 🚀 Comment Lancer et Jouer au Jeu

### Option 1 : Le plus simple (En 1 clic)
👉 **Double-cliquez sur le fichier `Lancer_le_Jeu.bat`**  
Il lance automatiquement le jeu et ouvre votre navigateur à l'adresse `http://localhost:3000`.

### Option 2 : Jouer hors-ligne sans serveur
👉 **Double-cliquez sur le fichier `dist/index.html`**  
Ce fichier est 100% autonome et intègre tout le jeu (aucun serveur ni installation requis).

### Option 3 : En ligne de commande
```bash
npm run dev
```

---

## 🌐 Comment Publier sur GitHub Pages (Gratuit & Jouable par Tous)

Le projet est préconfiguré pour être publié en 2 minutes sur GitHub Pages afin que vos amis et joueurs du monde entier puissent y jouer sur leur PC, Mac, tablette ou smartphone sans rien installer.

### Étape 1 : Créer votre dépôt sur GitHub
1. Connectez-vous sur votre compte GitHub et allez sur [github.com/new](https://github.com/new).
2. Nommez votre projet (par exemple `mario-kart-3d` ou `super-kart-champions`).
3. Laissez le dépôt en **Public** et cliquez sur **Create repository**.

### Étape 2 : Envoyer le code
Dans le dossier du jeu sur votre ordinateur, ouvrez PowerShell ou un terminal et tapez :
```powershell
git remote add origin https://github.com/VOTRE_NOM_UTILISATEUR/VOTRE_DEPOT.git
git push -u origin main
```

### Étape 3 : Activer GitHub Pages
1. Dans votre dépôt GitHub, allez dans l'onglet **Settings** (Paramètres).
2. Dans le menu à gauche, cliquez sur **Pages**.
3. Sous **Build and deployment** > **Source**, sélectionnez **GitHub Actions**.

🎉 Votre jeu sera automatiquement compilé et accessible en ligne pour tout le monde à l'adresse :
```
https://VOTRE_NOM_UTILISATEUR.github.io/VOTRE_DEPOT/
```

---

## 🎮 Commandes de Jeu

| Action | Clavier | Manette (Xbox / PS) | Écran Tactile (Mobile) |
|---|---|---|---|
| **Accélérer** | `Z` / `W` / `Flèche Haut` | Gâchette `RT` / Bouton `A` | Bouton **GAZ** |
| **Frein / Marche Arrière** | `S` / `Flèche Bas` | Gâchette `LT` / Bouton `B` | Bouton **FREIN** |
| **Diriger Gauche / Droite** | `Q` / `A` / `D` / `Flèches` | Stick Gauche | Boutons **◀** et **▶** |
| **Saut & Dérapage (Drift)** | `Espace` | `RB` / `R1` | Bouton **DRIFT** |
| **Lancer Objet Bonus** | `E` / `Shift` / `F` | `LB` / `L1` / Bouton `X` | Bouton **🎁** |
| **Regarder en Arrière** | `C` | Stick Droit | - |
| **Replacer Kart sur la Piste** | `R` | Bouton `Y` | - |
| **Mettre en pause / Reprendre** | `P` / `Échap` | Bouton **PAUSE** à l'écran | Bouton **PAUSE** à l'écran |

---

## 🌟 Fonctionnalités du Jeu

- **4 Pilotes personnalisés** :
  - 🦖 **Dashy Dino** (Équilibré)
  - 🦊 **Turbo Fox** (Vitesse max)
  - 🐱 **Cyber Cat** (Accélération et virages)
  - 🤖 **Mecha Bot** (Poids lourd invincible et gros turbo)
- **4 Châssis de Karts 3D** : Classic Roadster, Streamliner F1, Monster Buggy, Hover Rocket.
- **3 Circuits 3D originaux** :
  - 🌈 **Rainbow Nebula** (Cosmique cyberpunk néon)
  - 🏜️ **Sunset Canyon** (Canyon rougeoyant et chicanes)
  - 🌋 **Lava Volcano** (Volcan en fusion et tremplins magmatiques)
- **6 Objets Bonus** : Carapace rouge (tête chercheuse), Carapace verte (ricochets), Peaux de banane, Super Champi, Étoile d'invincibilité, Éclair magique (rétrécit les rivaux).
- **Audio Procédural (Web Audio API)** : Bruits de moteur dynamiques, crissements de pneus, explosions et musique rétro-chiptune arcade.
- **Grille de 8 coureurs** : 1 joueur contre 7 IA compétitives avec minicarte en temps réel.

---

*Projet développé par **ANTON NELCON Steve**.*
