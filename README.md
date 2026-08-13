# ChessMaster

ChessMaster est une application d'échecs en français conçue pour apprendre, s'entraîner et progresser seul, directement depuis son navigateur.

## Ce que fait l'application aujourd'hui

- **Partie contre l'IA** : affrontez une intelligence artificielle réglable sur 5 niveaux de difficulté (Amateur, Débutant, Intermédiaire, Avancé, Expert).
- **ELO personnel** : un score ELO local suit votre progression après chaque partie gagnée, perdue ou nulle.
- **Coach IA en partie** : après chacun de vos coups, l'IA peut commenter votre choix et vous orienter.
- **Bouton indice** : demandez un indice à tout moment ; la case de départ et la case d'arrivée sont mises en évidence.
- **Analyse post-partie** : à la fin de la partie, consultez une revue détaillée de chaque coup classé (meilleur coup, excellent, bon, imprécision, erreur, gaffe) avec le meilleur coup suggéré et un score de précision.
- **Section Apprendre** : guides sur chaque pièce, règles essentielles, concepts clés des échecs et explications du système ELO.
- **Techniques et ouvertures** : 10 leçons illustrées (mat du berger, gambit italien, défense sicilienne, etc.) avec mini-échiquiers interactifs.
- **Puzzles tactiques** : 12 puzzles classés par difficulté, dont un **puzzle du jour** qui change automatiquement chaque jour.
- **Sauvegarde de partie** : la partie en cours est conservée dans le navigateur pour reprendre après un rechargement accidentel.

> L'application est actuellement en solo : aucun multijoueur, aucun classement en ligne, aucun compte utilisateur et aucun mécanisme "spécial" ou "révolutionnaire" n'est présent.

## Technologies utilisées

- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [chess.js](https://github.com/jhlywa/chess.js)

## Comment modifier ce projet ?

### Avec Lovable

Visitez votre projet sur [Lovable](https://lovable.dev/projects/f6d9c263-5521-4054-b79a-516781cd69a6) et commencez à prompt. Les modifications sont automatiquement commitées dans ce dépôt.

### Dans votre IDE préféré

```sh
# 1. Cloner le dépôt
git clone <URL_DU_DEPOT>

# 2. Se rendre dans le dossier
cd <NOM_DU_PROJET>

# 3. Installer les dépendances
npm i

# 4. Lancer le serveur de développement
npm run dev
```

### Directement sur GitHub

- Ouvrez le fichier souhaité.
- Cliquez sur le bouton **Edit** (icône crayon) en haut à droite.
- Modifiez le fichier et committez vos changements.

### Avec GitHub Codespaces

- Rendez-vous sur la page principale du dépôt.
- Cliquez sur le bouton vert **Code**.
- Sélectionnez l'onglet **Codespaces**.
- Cliquez sur **New codespace** pour lancer un environnement.
- Modifiez, puis committez et poussez vos changements.

## Déploiement

Ouvrez [Lovable](https://lovable.dev/projects/f6d9c263-5521-4054-b79a-516781cd69a6), puis cliquez sur **Share → Publish** pour publier l'application.

## Domaine personnalisé

Vous pouvez connecter un domaine personnalisé depuis **Project → Settings → Domains**. Plus d'informations : [documentation Lovable sur les domaines personnalisés](https://docs.lovable.dev/features/custom-domain#custom-domain).
