# Architecture du dépôt — ReservCampus

## 1. Ce que le sujet attend, ce qui a été fait

Le sujet propose une arborescence type :

```text
mon-projet/
├── frontend/   (src, public, assets)
├── backend/    (routes, controllers, models, config)
├── database/   (schema.sql, seed.sql)
├── docs/       (note de cadrage, ADR, maquettes)
├── .env.example
├── .gitignore  (.env, node_modules...)
├── .eslintrc
└── README.md
```

Le projet garde **les mêmes responsabilités**, mais réparties dans une
application unique : le front et le back sont écrits dans le même langage et
le même dépôt, parce que le serveur est rendu par le framework (TanStack
Start) et non par un second programme. La correspondance est donc la suivante.

| Rôle attendu | Où c'est réellement | Pourquoi ici |
| --- | --- | --- |
| `frontend/` (src, public, assets) | `src/routes/` (écrans), `src/components/` (interface réutilisable), `public/` (fichiers servis) | Un écran = un fichier de route ; le navigateur ne charge que ce dont il a besoin |
| `backend/` (routes, controllers, models, config) | `src/routes/api/` (routes HTTP), fonctions de serveur `createServerFn`, `src/integrations/supabase/` (accès aux données), `src/lib/` (règles métier) | La frontière est explicite : ce qui s'exécute sur le serveur est séparé de ce qui s'exécute dans le navigateur |
| `database/` (schema.sql, seed.sql) | `database/schema.sql`, `database/seed.sql` (+ migrations réellement appliquées) | Schéma et jeu de données recopiés et commentés, lisibles sans outil |
| `docs/` (cadrage, ADR, maquettes) | `docs/` | Voir la liste des livrables plus bas |
| `.env.example` | `.env.example` | Modèle sans valeur secrète |
| `.gitignore` | `.gitignore` (`.env`, `node_modules`, dossier de build) | Rien de sensible ne part au dépôt |
| `.eslintrc` | `eslint.config.js` + `.prettierrc` | Le format de configuration a changé : l'ancien `.eslintrc` est remplacé par la « flat config » `eslint.config.js`. Rôles identiques : règles de style et de qualité |
| `README.md` | `README.md` | Installation, lancement, structure, démo |

## 2. Arborescence réelle

```text
.
├── .env.example              modèle de variables (sans valeurs secrètes)
├── .gitignore                .env, node_modules, dossier de build
├── eslint.config.js          règles de style et de qualité (flat config)
├── .prettierrc               formatage automatique
├── README.md                 installation, lancement, structure, démo
├── package.json              dépendances et scripts
├── vite.config.ts            configuration du build et du serveur
│
├── database/
│   ├── schema.sql            tables, contraintes, fonctions, sécurité
│   └── seed.sql              10 ressources d'exemple
│
├── docs/
│   ├── note-de-cadrage.md     besoin, cible, MVP, indicateurs
│   ├── compte-rendu-kickoff.md rôles et planning
│   ├── parcours-onboarding.md premiers écrans d'un nouvel utilisateur
│   ├── architecture.md        ce fichier
│   ├── adr/
│   │   ├── ADR-001-stack-fullstack-integree.md
│   │   ├── ADR-002-postgres-contrainte-exclude.md
│   │   └── ADR-003-rls-et-roles-en-base.md
│   └── maquettes/
│       ├── maquettes-basse-fidelite.md   wireframes
│       └── *.png                         écrans réels (haute fidélité)
│
├── public/                   fichiers servis tels quels (favicon, robots.txt)
│
└── src/
    ├── routes/               ── les écrans (une route = un fichier)
    │   ├── __root.tsx        squelette commun (en-tête, styles, erreurs)
    │   ├── index.tsx         /                  accueil
    │   ├── auth.tsx          /auth              inscription et connexion
    │   ├── _authenticated/   ── parcours connecté
    │   │   ├── route.tsx     barre de navigation + contrôle de session
    │   │   ├── ressources.tsx            /ressources        catalogue
    │   │   ├── ressources.$id.tsx        /ressources/:id    disponibilités et réservation
    │   │   ├── mes-reservations.tsx      /mes-reservations  mes réservations et annulation
    │   │   └── admin.tsx                 /admin             tableau de bord gestionnaire
    │   └── api/              routes HTTP exposées
    │
    ├── components/           interface réutilisable (boutons, champs, cartes)
    ├── integrations/supabase/ client de base de données (généré) + client serveur
    ├── lib/
    │   ├── slots.ts          règles des créneaux (chevauchement, créneaux libres)
    │   ├── slots.test.ts     tests de ces règles
    │   └── auth.ts           session courante, rôle, messages d'erreur lisibles
    ├── hooks/                comportements réutilisables
    ├── test/                 configuration des tests
    └── styles.css            design system (couleurs, typographies, ombres)
```

## 3. Les trois étages, en une phrase chacun

- **Interface** (`src/routes`, `src/components`) : affiche les écrans, envoie
  les demandes, traduit les erreurs de la base en messages compréhensibles.
- **Serveur** (fonctions de serveur, `src/routes/api`, `src/lib`) : vérifie les
  règles d'équité, calcule les créneaux libres et les alternatives.
- **Base de données** (`database/schema.sql`) : stocke, protège (sécurité par
  ligne) et **garantit** l'absence de double réservation.

## 4. Scripts

| Commande | Effet |
| --- | --- |
| `bun install` | installe les dépendances |
| `bun run dev` | serveur de développement |
| `bun run build` | build de production |
| `bun run lint` | règles de style et de qualité |
| `bun run format` | formatage du code |
| `bun test` | tests des règles de réservation |
