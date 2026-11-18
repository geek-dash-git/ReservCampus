# ADR-001 — Une stack unique front + back + base (React / TanStack Start, PostgreSQL)

- **Statut :** accepté
- **Date :** [à compléter]
- **Contributeurs :** [Prénom 1], [Prénom 2], [Prénom 3]

## Contexte

Le sujet exige de montrer **toute la chaîne** : interface, serveur, base de
données, avec un MVP limité dans le temps (un semestre, groupe de 3 à 4
personnes). Il faut donc une stack qui :

- permette de livrer vite sans maintenir deux dépôts et deux déploiements ;
- donne un vrai serveur (pas seulement du JavaScript dans le navigateur) ;
- repose sur une base relationnelle, parce que le cœur du métier est une
  contrainte entre intervalles de temps ;
- reste lisible par un jury qui doit vérifier la cohérence besoin → code.

## Options envisagées

| Option | Avantages | Inconvénients |
| --- | --- | --- |
| **A. React + TanStack Start + PostgreSQL (retenu)** | Un seul dépôt, un seul déploiement ; le code serveur et le code client partagent le même langage et les mêmes types ; pages servies côté serveur (premier écran rapide) ; écosystème React pour l'interface | Moins « classique » qu'un duo HTML/PHP ; la frontière client/serveur doit être respectée consciemment |
| B. HTML/CSS/JS statique + API PHP ou Node séparée | Très explicite, proche du cours | Deux projets à câbler, authentification et sécurité à réécrire à la main, lenteur de développement |
| C. Framework monolithique côté serveur (PHP/Laravel, Django) | Un seul langage, beaucoup de fonctionnalités prêtes | Moins adapté à une interface très interactive (grille de créneaux), et moins de réutilisation de composants |

## Décision

**Option A.** Front-end et back-end dans une seule application
**React 19 + TypeScript + TanStack Start**, interface stylée avec **Tailwind
CSS**, base **PostgreSQL** (Lovable Cloud) avec **Row Level Security**.

Concrètement :

- les écrans sont des fichiers de route (`src/routes/`) ;
- la logique serveur passe par des **fonctions de serveur**
  (`createServerFn`) et des routes HTTP sous `src/routes/api/` ;
- l'accès aux données passe par le client généré, donc **les politiques de
  sécurité s'appliquent à chaque requête** ;
- les règles de réservation sont écrites une fois, **dans la base**
  (voir ADR-002), et non dupliquées dans l'interface.

## Conséquences

**Positives**

- Un seul dépôt à rendre, un seul bouton de déploiement.
- Le type de la base est partagé : une erreur de champ est visible à la
  compilation, pas en production.
- L'authentification, les rôles et la sécurité sont gérés par la base, donc
  pas de code maison à faire relire et à tester.
- Les pages sont rendues côté serveur : le premier écran s'affiche sans
  attente de téléchargement de tout le JavaScript.

**Négatives / coûts**

- Il faut maîtriser la frontière client/serveur : une bibliothèque uniquement
  navigateur ne doit pas être importée dans un module évalué côté serveur.
- TanStack Start est moins connu du jury que PHP : l'ADR sert de justification,
  et la structure du dépôt (voir `docs/architecture.md`) rend la lecture facile.

## Comment cette décision est vérifiable dans le dépôt

- `package.json` : dépendances `@tanstack/react-start`, `react`,
  `@supabase/supabase-js`, `tailwindcss`.
- `src/routes/` : un fichier par écran.
- `src/integrations/supabase/` : client généré, client serveur, attacheur
  d'authentification.
- `src/lib/slots.ts` + `src/lib/slots.test.ts` : la logique de créneaux, isolée
  et testée.
