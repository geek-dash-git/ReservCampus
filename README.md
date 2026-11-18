# ReservCampus
Gestions des salles et materiaux d'un domaine, (universiter, colleges, lycee, entropots, etc..)

# ReservCampus

Application web de réservation de **salles et de matériel** pour un campus :
voir en temps réel ce qui est libre, réserver en quelques clics, annuler quand
on n'a plus besoin du créneau, et piloter l'ensemble depuis un tableau de bord.

Le besoin et la cible sont décrits dans
[`docs/note-de-cadrage.md`](docs/note-de-cadrage.md), les choix techniques dans
[`docs/adr/`](docs/adr/), les écrans dans
[`docs/maquettes/`](docs/maquettes/).

## Ce que fait l'application

- **Accueil** : présentation du projet et des trois étapes « Choisissez /
  Réservez / Gérez ».
- **Inscription et connexion** par email et mot de passe.
- **Catalogue** : salles (capacité, équipements, localisation) et matériel,
  filtrables par type, recherche et capacité minimale.
- **Disponibilités** : grille horaire de 8h à 20h, créneaux libres et pris,
  durée de 1 à 4 heures.
- **Réservation garantie** : les doubles réservations sont bloquées **par la
  base de données**. Quand un créneau est pris, l'application propose d'autres
  horaires le même jour et d'autres ressources libres à la même heure.
- **Règles d'équité** : 4 heures maximum par réservation, 3 réservations
  actives par personne, aucune réservation dans le passé.
- **Mes réservations** : réservations à venir avec annulation en un clic, et
  historique.
- **Tableau de bord gestionnaire** : chiffres clés, ressources les plus
  demandées, qui a réservé quoi, ajout / désactivation / suppression de
  ressources.

## Stack

| Partie | Choix | Justification |
| --- | --- | --- |
| Interface et serveur | React 19 + TypeScript + TanStack Start | [ADR-001](docs/adr/ADR-001-stack-fullstack-integree.md) |
| Style | Tailwind CSS v4, design system dans `src/styles.css` | — |
| Base de données | PostgreSQL, Row Level Security | [ADR-002](docs/adr/ADR-002-postgres-contrainte-exclude.md), [ADR-003](docs/adr/ADR-003-rls-et-roles-en-base.md) |
| Anti double réservation | Contrainte `EXCLUDE USING gist` | [ADR-002](docs/adr/ADR-002-postgres-contrainte-exclude.md) |

## Installation et lancement

Prérequis : Node.js 22+ (Node 20 fonctionne encore mais affiche un
avertissement de dépréciation) et [Bun](https://bun.sh) (ou npm).

```sh
git clone <url-du-depot>
cd reservcampus
bun install            # ou npm install

cp .env.example .env   # puis renseigner les valeurs
bun run dev            # ou npm run dev
```

L'application est alors visible sur `http://localhost:8080`.

> Procédures détaillées (prérequis, ports, vérifications, problèmes
> fréquents) : [`docs/tester-sur-linux.md`](docs/tester-sur-linux.md) et
> [`docs/tester-sur-windows.md`](docs/tester-sur-windows.md).

### Variables d'environnement

`.env.example` décrit les variables attendues (URL de l'instance, clé
publiable, identifiant). Le `.env` réel est ignoré par Git.

## Scripts

| Commande | Effet |
| --- | --- |
| `bun run dev` | serveur de développement |
| `bun run build` | build de production |
| `bun run preview` | sert le build de production |
| `bun run lint` | règles de style et de qualité (ESLint) |
| `bun run format` | formatage du code (Prettier) |
| `bun test` | tests des règles de réservation |

## Base de données

- `database/schema.sql` : tables, contraintes (dont l'anti-chevauchement),
  fonctions, déclencheurs et politiques de sécurité.
- `database/seed.sql` : 10 ressources d'exemple (5 salles, 5 matériels).

## Structure du dépôt

Voir [`docs/architecture.md`](docs/architecture.md) pour la correspondance avec
l'arborescence demandée par le sujet (frontend / backend / database / docs).

```text
src/routes/         les écrans (accueil, auth, catalogue, réservation,
                    mes réservations, tableau de bord)
src/components/     interface réutilisable
src/integrations/   accès à la base de données
src/lib/            règles métier (créneaux) et tests
database/           schema.sql, seed.sql
docs/               cadrage, kick-off, ADR, onboarding, maquettes
```

## Scénario de démonstration

1. **Créer le compte gestionnaire en premier** : le premier compte du système
   reçoit le rôle gestionnaire. Créer ensuite un second compte « étudiant ».
2. Accueil → *Créer mon compte* → inscription → connexion.
3. Catalogue → choisir une salle → grille horaire → durée → *Réserver*.
4. **Démontrer le conflit** : avec le second compte, tenter le même créneau →
   refus « Ce créneau est déjà réservé » + créneaux et ressources alternatifs.
5. « Mes réservations » → *Annuler* → le créneau redevient libre.
6. *Tableau de bord* → chiffres, ressource la plus demandée, ajout d'une
   ressource.

## Livraison

| Livrable du sujet | Fichier |
| --- | --- |
| Note de cadrage | `docs/note-de-cadrage.md` |
| Compte-rendu de kick-off | `docs/compte-rendu-kickoff.md` |
| Parcours d'onboarding | `docs/parcours-onboarding.md` |
| Wireframes et maquettes | `docs/maquettes/` |
| ADR | `docs/adr/` (3 fiches) |
| Starter kit (architecture, linter, `.env.example`, README) | ce dépôt |
| Application fonctionnelle | `src/` |


## Résumé IA des réservations

Dans le tableau de bord gestionnaire (onglet Réservations), le bouton **« Résumer avec l'IA »** génère pour chaque réservation une phrase reprenant la ressource, le créneau et le motif. L'appel se fait côté serveur (`src/lib/summaries.functions.ts`), après vérification du rôle gestionnaire ; la clé `LOVABLE_API_KEY` n'est jamais exposée au navigateur.
