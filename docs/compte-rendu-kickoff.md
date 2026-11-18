# Compte-rendu de Kick-Off — ReservCampus

**Date :** [à compléter] &nbsp;•&nbsp; **Durée :** [à compléter]
**Présents :** [Prénom 1], [Prénom 2], [Prénom 3] *(à compléter)*

## 1. Objet de la réunion

Valider l'idée, délimiter le MVP, répartir les rôles et fixer le planning
jusqu'à la soutenance.

## 2. Décisions prises

| # | Décision | Conséquence |
| --- | --- | --- |
| 1 | Le sujet retenu est la **réservation de salles et de matériel** | Le besoin est réel et vérifiable auprès des camarades et enseignants |
| 2 | Le MVP est **catalogue + réservation + annulation + tableau de bord** | Ni validation manuelle, ni prêt/retour matériel dans un premier temps |
| 3 | Les **doubles réservations sont bloquées en base de données** | Voir ADR-002 ; l'interface ne fait que présenter l'information |
| 4 | **Rôles stockés en base**, jamais dans les metadata de connexion | Voir ADR-003 |
| 5 | Le **premier compte créé devient gestionnaire** | Permet de démontrer l'administration sans script |

## 3. Répartition des rôles

| Rôle | Personne | Responsable de |
| --- | --- | --- |
| Chef de projet / cadrage | [Prénom 1] | Note de cadrage, planning, relation avec le jury, relecture des livrables |
| Développement interface | [Prénom 2] | Pages, parcours d'onboarding, maquettes, accessibilité et responsive |
| Développement base et logique | [Prénom 3] | Schéma, contraintes, politiques de sécurité, fonctions et règles d'équité |
| Tests et documentation | [tout le groupe] | Jeu d'essai des règles, README, ADR, préparation de la démo |

> Chaque personne garde la main sur son périmètre mais relit le travail des
> autres : la cohérence entre besoin, conception et code est un critère
> d'évaluation.

## 4. Planning prévisionnel

| Étape | Contenu | Livrables | Quand |
| --- | --- | --- | --- |
| S1 — Cadrage | Besoin, cible, MVP, indicateurs | Note de cadrage, enquête auprès de 5 à 10 personnes | Semaine 1 |
| S2 — Conception | Parcours d'onboarding, écrans, choix techniques | Wireframes basse fidélité, ADR-001 et ADR-002 | Semaine 2 |
| S3 — Starter kit | Dépôt Git, arborescence, linter, `.env.example`, README, jeu de données | Dépôt initialisé, `schema.sql`, `seed.sql` | Semaine 3 |
| S4 — Développement | Catalogue, disponibilités, réservation, annulation, tableau de bord | Application fonctionnelle | Semaines 4-5 |
| S5 — Durcissement | Règles d'équité, refus de conflit + alternatives, tests | Tests des règles, correctifs | Semaine 6 |
| S6 — Finalisation | Maquettes haute fidélité, relecture, préparation de la démo | Livrables complets, soutenance | Semaine 7 |

> Dates à caler sur le calendrier réel du groupe ; la soutenance est la date
> butoir de toutes les étapes.

## 5. Points de vigilance relevés dès le kick-off

1. Le **conflit de réservation** doit être démontrable en direct : prévoir deux
   comptes.
2. Les **règles d'équité** doivent être visibles dans le code et testées, pas
   seulement annoncées.
3. La **démonstration** doit tenir en 10 minutes : accueil → inscription →
   catalogue → réservation → conflit refusé avec alternative → annulation →
   tableau de bord.

## 6. Prochaine réunion

Date : [à compléter] — Ordre du jour : revue des wireframes et validation du
schéma de base.
