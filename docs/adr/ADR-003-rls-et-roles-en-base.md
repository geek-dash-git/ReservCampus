# ADR-003 — Sécurité en base : Row Level Security et rôles dans une table dédiée

- **Statut :** accepté
- **Date :** [à compléter]
- **Contributeurs :** [Prénom 1], [Prénom 2], [Prénom 3]

## Contexte

Deux profils : l'**utilisateur** (étudiant, enseignant) et le **gestionnaire**.
Le gestionnaire crée, modifie et retire des ressources ; l'utilisateur consulte
le catalogue, réserve pour lui et annule ses propres réservations.

Le point sensible : **qui a le droit de faire quoi ne doit pas dépendre d'une
information que l'utilisateur peut modifier**. Or les metadata de connexion
(`raw_user_meta_data`) sont fournies par le client.

## Options envisagées

| Option | Principe | Problème |
| --- | --- | --- |
| A. Rôle dans les metadata de connexion | `user_metadata.role = 'admin'` | Modifiable depuis le navigateur : n'importe qui devient gestionnaire |
| B. Contrôle uniquement dans le code de l'interface | Cacher les boutons d'administration | Un appel direct à l'API passe outre l'interface |
| C. **Rôles dans une table + Row Level Security (retenu)** | La base connaît le rôle et filtre elle-même chaque requête | Écriture de politiques à maintenir, et toute table sans politique est inaccessible |

## Décision

**Option C.**

- Table `user_roles (user_id, role)` avec `role` de type énuméré
  `app_role ('admin','user')`, contrainte `unique (user_id, role)`, et **aucune
  politique d'écriture** : un utilisateur ne peut pas se promouvoir.
- Fonction `has_role(user_id, role)` en `security definer`, utilisée par les
  politiques.
- **Row Level Security activée sur les quatre tables** ; sans politique, aucune
  lecture ni écriture n'est possible.
- Le déclencheur `handle_new_user` crée le profil et le rôle `user` à
  l'inscription, et attribue `admin` au **premier** compte du système (pas de
  compte gestionnaire à créer à la main pour la démo).

Politiques en place :

| Table | Politique | Effet |
| --- | --- | --- |
| `resources` | `read` pour tout utilisateur connecté | Le catalogue est consultable |
| `resources` | `admin insert / update / delete` | Seul un gestionnaire modifie le catalogue |
| `reservations` | `insert own` (`with check user_id = auth.uid()`) | On ne réserve pas au nom d'un autre |
| `reservations` | `read` pour tout utilisateur connecté | Indispensable pour calculer les disponibilités |
| `reservations` | `update own or admin` | On annule la sienne ; un gestionnaire peut corriger |
| `profiles` | `read` (soi ou admin), `update own` | Coordonnées protégées |
| `user_roles` | `select` (soi ou admin), **aucune écriture** | Personne ne peut se donner un rôle |

Le `DELETE` sur `reservations` n'est **volontairement pas ouvert** : annuler
revient à passer `status = 'annulee'`, ce qui conserve la traçabilité.

## Conséquences

**Positives**

- Le contrôle d'accès est **au même endroit que la donnée** : il s'applique à
  toutes les voies d'accès, y compris un appel direct à l'API.
- L'interface n'a qu'à cacher ce qui est déjà interdit, jamais à le garantir.
- Les rôles sont auditables d'une simple requête.

**Négatives / coûts**

- Toute nouvelle table demande ses politiques, sinon elle est muette.
- Les politiques doivent être relues à chaque évolution du métier (par exemple
  si une validation manuelle des demandes est ajoutée).

## Comment cette décision est vérifiable dans le dépôt

- `database/schema.sql` : `enable row level security`, les `create policy`,
  `has_role`, `handle_new_user`.
- `src/lib/auth.ts` : `useAuth()` qui lit le rôle depuis `user_roles` et
  expose `isAdmin`.
- `src/routes/_authenticated/route.tsx` : la route exige une session, et le
  lien vers le tableau de bord n'apparaît que pour un gestionnaire.
