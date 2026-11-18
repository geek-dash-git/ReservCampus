# ADR-002 — Blocage des doubles réservations par une contrainte d'exclusion PostgreSQL

- **Statut :** accepté
- **Date :** [à compléter]
- **Contributeurs :** [Prénom 1], [Prénom 2], [Prénom 3]

## Contexte

La règle centrale du projet est : **deux personnes ne peuvent pas réserver le
même créneau de la même ressource**. Cette règle doit tenir même si deux
demandes arrivent en même temps, même si un écran est obsolète, et même si un
développeur oublie une vérification.

Trois façons de l'implémenter :

| Option | Principe | Problème |
| --- | --- | --- |
| A. Vérification dans le code de l'application | « je lis les réservations, puis j'insère si libre » | **Course** : deux requêtes peuvent lire « libre » en même temps puis insérer toutes les deux. Il faut des verrous, et la règle est contournable par n'importe quel appel à l'API |
| B. Contrainte d'exclusion PostgreSQL (`EXCLUDE USING gist`) | La base refuse l'insertion si deux intervalles se chevauchent | Nécessite l'extension `btree_gist` et un index de type gist |
| C. File d'attente / verrou applicatif | Une seule réservation traitée à la fois | Complexe à opérer, lent, et ne protège toujours pas contre un accès direct à la base |

## Décision

**Option B.** La table `reservations` porte une contrainte d'exclusion :

```sql
constraint no_overlap exclude using gist (
  resource_id with =,
  tstzrange(starts_at, ends_at, '[)') with &&
) where (status = 'confirmee');
```

Lecture de la contrainte :

- `resource_id with =` → on compare uniquement les réservations **de la même
  ressource** ;
- `tstzrange(starts_at, ends_at, '[)') with &&` → les intervalles
  **début inclus, fin exclusive** ne doivent **pas se chevaucher** ; le format
  `[)` fait que finir à 10h et commencer à 10h n'est **pas** un conflit ;
- `where (status = 'confirmee')` → une réservation annulée ne bloque rien :
  annuler libère immédiatement le créneau.

L'index gist créé avec la contrainte rend la vérification rapide, et la
contrainte est appliquée **par le serveur de base**, donc par toutes les voies
d'accès.

Les règles d'équité sont appliquées de la même façon, côté serveur, par un
déclencheur `validate_reservation` :

- durée maximale **4 heures** ;
- **3 réservations actives maximum** par personne ;
- **aucune réservation dans le passé**.

## Conséquences

**Positives**

- **Zéro double réservation, par construction.** Même deux requêtes simultanées
  ne peuvent pas toutes deux aboutir : la seconde est refusée à l'insertion.
- La règle n'est pas dupliquée : elle n'existe qu'à un seul endroit, donc
  ne peut pas se désynchroniser de l'interface.
- Le refus est **détectable** : l'application intercepte l'erreur de contrainte
  (`no_overlap`) et affiche un message clair, plus des **créneaux alternatifs**
  le même jour et d'autres ressources libres à la même heure.
- L'annulation (`status = 'annulee'`) libère le créneau sans effacer
  l'historique.

**Négatives / coûts**

- Dependance à PostgreSQL et à l'extension `btree_gist` : un changement de base
  imposerait de réécrire la règle.
- Le message d'erreur brut de la base n'est pas compréhensible : il faut une
  traduction côté application (`friendlyError` dans `src/lib/auth.ts`).
- Les tests de la logique de créneaux doivent être écrits à deux niveaux :
  la logique pure en TypeScript (`src/lib/slots.test.ts`) et la contrainte en
  base.

## Comment cette décision est vérifiable dans le dépôt

- `database/schema.sql` : la contrainte `no_overlap`, le déclencheur
  `trg_validate_reservation`, la fonction `validate_reservation`.
- `src/lib/slots.ts` : `overlaps`, `isSlotFree`, `freeSlots`, `validateRequest`
  — la même règle, version lisible et testée.
- `src/routes/_authenticated/ressources.$id.tsx` : affichage des alternatives
  quand la réservation est refusée.

## Démonstration prévue en soutenance

1. Compte A réserve Salle B12 de 14h à 16h → succès.
2. Compte B tente Salle B12 de 15h à 17h → **refusé**, message
   « Ce créneau est déjà réservé », et propositions d'horaires ou de salles
   libres.
3. Compte A annule → le créneau redevient libre pour le compte B.
