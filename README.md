# QR & URL Studio

Application React + TypeScript + Vite et API Express, construite sur le dépôt initial. QR personnalisables en PNG/SVG ; QR de texte, URL, lien d'image, réseau Wi-Fi WPA/WPA2 et vCard ; générateur de mots de passe local ; liens courts et redirection. Une image doit être préalablement hébergée et accessible : elle ne peut pas être insérée comme fichier volumineux dans un QR. Le QR Wi-Fi contient le mot de passe du réseau en clair : ne le partager qu'avec les personnes autorisées.

## Installation locale

Prérequis : Node.js 22 à 24 et npm. Dans le dossier du projet :

```bash
npm ci
cp .env.example .env
npm run dev
```

Ouvrir http://localhost:3000. Sans base, les liens sont écrits dans `data/links.json` sur cette machine seulement ; ce mode sert au développement, est mono-instance et ne convient pas à la production. Pour utiliser PostgreSQL, renseigner `DATABASE_URL` dans `.env`. Une erreur de connexion ne déclenche aucun stockage de secours. Ne pas ajouter `.env` à GitHub.

```bash
npm test
npm run lint
npm run build
```

## Données et confidentialité

PostgreSQL stocke les liens, leurs alias uniques, les titres facultatifs et les clics. Le schéma est dans `schema.sql` et est initialisé au premier démarrage par l'application avec les droits CREATE nécessaires. Il peut aussi être exécuté avec `psql "$DATABASE_URL" -f schema.sql`. Les paramètres SQL sont transmis séparément des requêtes. Si l'index unique échoue sur une base existante, identifier les anciens alias qui ne diffèrent que par la casse puis les résoudre avant réinitialisation ; sauvegarder la base d'abord.

Les mots de passe aléatoires sont générés exclusivement dans le navigateur avec `crypto.getRandomValues`, sans journalisation ni stockage par l'application. L'estimation de robustesse est indicative. Les liens raccourcis peuvent être devinés ou partagés ; ne pas les utiliser pour protéger des données confidentielles. Une URL de QR Wi-Fi rend son secret accessible à toute personne qui scanne. Aucun panneau public de gestion, de liste ou de suppression n'est exposé : l'ancien panneau sans authentification a été retiré. Les compteurs existent en base mais ne sont pas exposés par une interface publique. Les liens déjà créés restent utilisables si la même base est conservée.

Une limite globale de 60 créations par minute est appliquée en base, partagée par toutes les instances. Elle peut ralentir tous les utilisateurs si un seul abuse du service : elle ne remplace pas un filtrage par client au niveau du fournisseur, une authentification ou une protection anti-abus avant une ouverture publique importante. Les destinations ne sont pas vérifiées contre les sites frauduleux. Les données de destination ne sont pas uniques : une même URL peut avoir plusieurs liens ; un alias personnalisé déjà utilisé renvoie une erreur 409. Tester la lisibilité des QR avec plusieurs appareils, surtout avec fonds, couleurs et logos personnalisés.

## Structure principale

```
src/components/      interface, générateurs et personnalisation QR
src/utils/           moteur QR et générateur de mots de passe
server/app.ts        API et redirection
server/db.ts         PostgreSQL, quota, stockage local de développement
server/url.ts        validation des destinations
api/index.ts         fonction Vercel
netlify/functions/   fonction Netlify
schema.sql           initialisation PostgreSQL
.env.example         variables attendues, sans secret
vercel.json          routes Vercel
netlify.toml         routes Netlify
tests/               tests automatisés
```

## Déploiement sur Vercel

1. Préparer une base PostgreSQL externe, par exemple Neon : créer ou sélectionner le projet et la base, puis utiliser **Connect** pour copier la chaîne PostgreSQL avec TLS. Choisir la connexion mutualisée (« pooled ») si proposée pour les fonctions. Ne jamais communiquer cette chaîne : elle contient un mot de passe. La fonction initialise les tables si le rôle possède les droits requis ; sinon, un administrateur exécute `schema.sql` et adapte les droits.
2. Dans GitHub, créer si nécessaire un dépôt vide, puis depuis ce dossier : `git init` seulement si ce n'est pas déjà un dépôt, `git add .`, `git commit -m "Application QR et liens courts"`, `git remote add origin URL_DU_DEPOT` si l'origine n'existe pas, et `git push -u origin main` (adapter le nom de branche). Pour le dépôt existant, privilégier une branche et une pull request avant fusion.
3. Dans Vercel, **Add New → Project**, importer le dépôt GitHub et choisir le projet. Le framework est **Vite** (pas Next.js), la compilation `npm run build` et la sortie `dist`. `vercel.json` configure les routes des fonctions.
4. Dans les variables d'environnement du projet, ajouter `DATABASE_URL` (chaîne PostgreSQL complète et secrète) et `APP_URL` (domaine public exact, par ex. `https://mon-projet.vercel.app`, sans slash final). Affecter à Production et, si nécessaire, à Preview avec des valeurs adaptées. Ne pas ajouter de préfixe `VITE_` : ces variables doivent rester côté serveur.
5. Lancer le déploiement. Si le domaine a été découvert après le premier déploiement, mettre à jour `APP_URL` puis redéployer. Ne pas partager une base de production avec un environnement de test sans le vouloir.
6. Vérifier `/api/health`, créer un lien test et ouvrir son URL `/s/...` dans une fenêtre privée ; vérifier la destination et le QR. En cas d'échec, examiner les journaux de la fonction, les variables et les permissions de la base, sans publier de secrets.

## Alternative Netlify

Importer le dépôt dans Netlify via **Add new project → Import an existing project**. Conserver `npm run build`, le répertoire `dist` et les paramètres de `netlify.toml`. Ajouter `DATABASE_URL` et `APP_URL` dans la configuration des variables, accessibles aux **Functions** pour le contexte choisi ; un changement exige un redéploiement. Utiliser la même base PostgreSQL externe : Netlify Database n'est pas nécessaire. Déployer puis effectuer les mêmes contrôles `/api/health` et création/redirection. `APP_URL` doit correspondre au domaine du contexte ; séparer les bases de test et de production.

Documentation officielle : https://vercel.com/docs/frameworks/frontend/vite ; https://vercel.com/docs/environment-variables ; https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/ ; https://docs.netlify.com/build/environment-variables/overview/ .
