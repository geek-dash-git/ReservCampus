# Note de cadrage — ReservCampus

**Projet :** application web de réservation de salles et de matériel
**Cadre :** TD Fondamentaux du Web — MIAGE 2
**Groupe :** [Prénom 1], [Prénom 2], [Prénom 3] *(à compléter)*

---

## 1. Besoin identifié

Réserver une salle ou du matériel se fait encore de manière informelle dans
l'établissement : cahier papier, message à un responsable, déplacement sur
place. Conséquences constatées :

- **doubles réservations** — deux personnes découvrent la même salle occupée ;
- **déplacements et appels inutiles** pour vérifier une disponibilité ;
- **aucune confirmation** pour l'étudiant ou l'enseignant qui a réservé ;
- **aucun suivi** : l'administration ne sait pas qui a emprunté quoi, ni
  quelles salles sont sous-utilisées ou saturées.

Le besoin est donc de **rendre la disponibilité visible en temps réel** et de
**garantir techniquement qu'un créneau ne peut pas être réservé deux fois**.

### Preuves du besoin (à joindre)

Interroger 5 à 10 camarades et enseignants avec trois questions :
« Comment réservez-vous une salle aujourd'hui ? », « Avez-vous déjà trouvé une
salle occupée alors qu'elle était réservée ? », « Avez-vous déjà perdu du temps
à chercher un créneau ? ». Reporter les réponses, par exemple :
*« 7 personnes sur 10 ont déjà trouvé une salle occupée »*.

## 2. Cible et bénéficiaires

| Bénéficiaire | Son problème aujourd'hui | Ce que le projet lui apporte |
| --- | --- | --- |
| Étudiants | Cherchent une salle au hasard, risquent de ne rien trouver avant une soutenance | Disponibilités visibles depuis le téléphone, réservation garantie |
| Enseignants | Ne savent pas à qui s'adresser, découvrent leur salle occupée | Réservation en quelques clics, confirmation claire |
| Administration / gestionnaires | Cahiers papier, appels, litiges « qui avait réservé ? » | Vue d'ensemble centralisée, historique fiable, moins de conflits |
| Responsable du matériel | Ne sait pas qui a emprunté quoi | Suivi des emprunts (renforcé en version avancée) |
| L'établissement | Salles sous-utilisées ou doublement réservées | Meilleur taux d'occupation, données pour décider |

## 3. Fonctionnalités clés du MVP

1. **Catalogue** des salles (capacité, équipements, localisation) et du matériel,
   avec filtres type / recherche / capacité minimale.
2. **Disponibilités en temps réel** : grille horaire 8h–20h, créneaux libres et
   créneaux pris.
3. **Réservation** en choisissant ressource, date, heure et durée (1 à 4h),
   avec **refus automatique de tout chevauchement** et **proposition de
   créneaux alternatifs** le même jour et sur d'autres ressources libres.
4. **Annulation** en un clic, qui libère immédiatement le créneau.
5. **Mes réservations** : réservations à venir + historique.
6. **Tableau de bord gestionnaire** : chiffres clés, ressources les plus
   demandées, qui a réservé quoi, ajout / désactivation / suppression de
   ressources.
7. **Comptes et rôles** : utilisateur connecté, rôle gestionnaire.

### Règles d'équité (MVP)

- durée maximale **4 heures** par réservation ;
- maximum **3 réservations actives** par personne ;
- **aucune réservation dans le passé** ;
- ces trois règles sont vérifiées **en base de données**, pas seulement dans
  l'interface.

### Hors MVP (version avancée)

Validation manuelle des demandes, files d'attente, prêt/retour du matériel avec
dates de retour, notifications par email, planning hebdomadaire par salle,
export CSV, multi-establishments.

## 4. Indicateurs de succès

| Indicateur | Objectif |
| --- | --- |
| Temps pour réserver une salle disponible | < 30 secondes, 3 clics |
| Doubles réservations | 0 (bloquées par la base de données) |
| Créneaux annulés remis en disponibilité | immédiat |
| Réservations refusées avec alternative proposée | 100 % des refus |
| Nombre de clics jusqu'à l'annulation | 1 depuis « Mes réservations » |

## 5. Contraintes et risques

- **Contrainte technique :** le blocage des conflits doit tenir malgré deux
  requêtes simultanées → solution en base (contrainte d'exclusion), pas en
  code applicatif.
- **Contrainte d'accès :** utilisation sur téléphone, parfois avec une
  connexion limitée → pages légères, une seule requête par écran.
- **Risque :** monopole d'un groupe sur les salles → règles de durée et de
  nombre de réservations actives.
- **Risque :** erreur de saisie d'une réservation → l'annulation est possible
  et libère le créneau ; l'historique est conservé.

## 6. Pitch (30 secondes)

> Dans notre établissement, réserver une salle ou du matériel se fait encore de
> manière informelle, ce qui provoque des doubles réservations, des déplacements
> inutiles et un manque de suivi. ReservCampus est une application web qui
> permet aux étudiants et aux enseignants de consulter les disponibilités en
> temps réel et de réserver en quelques clics, tandis que l'administration
> pilote l'ensemble depuis un tableau de bord. Résultat : moins de temps perdu,
> zéro conflit de réservation et une meilleure utilisation des ressources.
