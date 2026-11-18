# Maquettes basse fidélité — ReservCampus

Wireframes des écrans principaux, avant la réalisation. Les écrans réels (haute
fidélité) sont dans ce dossier au format `*.png`.

Légende : `[ ]` champ, `( )` bouton, `≡` liste, `▦` grille.

---

## 1. Accueil `/`

```text
┌────────────────────────────────────────────────────┐
│  ▤ ReservCampus                    (Se connecter)  │
├────────────────────────────────────────────────────┤
│  Fini les cahiers papier et les salles occupées    │
│                                                    │
│  La bonne salle, au     ┌──────────────────────┐   │
│  bon moment,            │ Aujourd'hui · B12    │   │
│  en 3 clics.            │ ▦ 08 09 10 11        │   │
│                         │ ▦ 12 13 14 15        │   │
│  [Créer mon compte]     │ ▦ 16 17 18 19        │   │
│  (Voir les ressources)  │ ● libre  ● réservé   │   │
│                         └──────────────────────┘   │
├────────────────────────────────────────────────────┤
│  Comment ça marche                                 │
│  ① Choisissez    ② Réservez     ③ Gérez            │
├────────────────────────────────────────────────────┤
│  Temps réel │ Zéro conflit │ Pilotage              │
├────────────────────────────────────────────────────┤
│  ▤ ReservCampus                    Projet Web MIAGE│
└────────────────────────────────────────────────────┘
```

## 2. Inscription / connexion `/auth`

```text
┌───────────────────────┬────────────────────────────┐
│                       │  Créer mon compte          │
│   ▤ ReservCampus      │                            │
│                       │  Nom     [______________]  │
│   La bonne salle,     │  Email   [______________]  │
│   au bon moment,      │  Mot de passe [_________]  │
│   en 3 clics.         │                            │
│                       │  (Créer mon compte)        │
│                       │  J'ai déjà un compte →     │
├───────────────────────┴────────────────────────────┤
│  Après inscription : lien de confirmation envoyé   │
└────────────────────────────────────────────────────┘
```

## 3. Catalogue `/ressources`

```text
┌────────────────────────────────────────────────────┐
│ ▤  Ressources  Mes réservations  Tableau de bord   │
├────────────────────────────────────────────────────┤
│ Que voulez-vous réserver ?                         │
│ (Tout)(Salles)(Matériel)      [Rechercher…][capac.]│
├────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│ │ ▦ Salle      │ │ ▦ Salle      │ │ ▧ Matériel   │ │
│ │ Amphi A      │ │ Salle B12    │ │ Vidéoproj.   │ │
│ │ 📍 Bât. A    │ │ 📍 Bât. B    │ │ 📍 Accueil   │ │
│ │ 👥 200       │ │ 👥 30        │ │ HDMI VGA     │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ │
└────────────────────────────────────────────────────┘
```

## 4. Ressource et disponibilités `/ressources/:id`

```text
┌────────────────────────────────────────────────────┐
│ ← Ressources   Salle B12        Salle · Bât. B 1er │
│   30 places · Vidéoprojecteur, Tableau blanc       │
├────────────────────────────────────────────────────┤
│ Date [ 12/11/2026 ]   Durée (1)(2)(3)(4) heures    │
├────────────────────────────────────────────────────┤
│ ▦ 08 ●   ▦ 09 ●   ▦ 10 ○   ▦ 11 ●                 │
│ ▦ 12 ●   ▦ 13 ●   ▦ 14 ○   ▦ 15 ○   ← pris        │
│ ▦ 16 ●   ▦ 17 ●   ▦ 18 ●   ▦ 19 ●                 │
│      ● libre (clicable)   ○ réservé                │
├────────────────────────────────────────────────────┤
│ Motif [_________________________]                  │
│            (Réserver ce créneau)                   │
└────────────────────────────────────────────────────┘
```

## 5. Refus et alternatives (écran le plus important)

```text
┌────────────────────────────────────────────────────┐
│ ⚠  Ce créneau est déjà réservé.                    │
├────────────────────────────────────────────────────┤
│ Autres horaires libres le 12/11 pour Salle B12 :   │
│   (08h-10h)  (10h-12h)  (16h-18h)  (18h-20h)      │
├────────────────────────────────────────────────────┤
│ Autres ressources libres à 14h :                   │
│   ≡ Salle B14        (24 places, Bât. B)           │
│   ≡ Salle de réunion D1 (12 places, Bât. D)        │
│   ≡ Vidéoprojecteur Epson #1                       │
└────────────────────────────────────────────────────┘
```

## 6. Mes réservations `/mes-reservations`

```text
┌────────────────────────────────────────────────────┐
│ Mes réservations                                   │
├────────────────────────────────────────────────────┤
│ À VENIR                                            │
│ ┌────────────────────────────────────────────────┐ │
│ │ Salle B12 · 12/11 14h-16h · confirmée          │ │
│ │ motif : projet groupé          (Annuler)       │ │
│ └────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────┤
│ HISTORIQUE (passées et annulées)                   │
│ ≡ Salle B14 · 05/11 09h-11h · annulée              │
└────────────────────────────────────────────────────┘
```

## 7. Tableau de bord gestionnaire `/admin`

```text
┌────────────────────────────────────────────────────┐
│ Tableau de bord                                    │
├────────────────────────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│ │Ressources│ │Réserv. │ │Réserv. │ │  Jours │       │
│ │  10     │ │ actives│ │  tot.  │ │d'affluence│     │
│ └────────┘ └────────┘ └────────┘ └────────┘        │
├────────────────────────────────────────────────────┤
│ Ressources les plus demandées                      │
│ Salle B12       ████████████████ 12                │
│ Amphi A         ██████████ 8                       │
│ Vidéoproj. #1   █████ 4                            │
├────────────────────────────────────────────────────┤
│ Qui a réservé quoi                                 │
│ ≡ julian@… · Salle B12 · 12/11 14h-16h · confirmée │
├────────────────────────────────────────────────────┤
│ Ajouter une ressource                              │
│ Nom [______] Type (Salle)(Matériel) Capacité [___] │
│ Équipements [______]   Localisation [______]       │
│                (Ajouter la ressource)              │
│ Gestion des ressources existantes : (désactiver)(supprimer) │
└────────────────────────────────────────────────────┘
```

## 8. Principes de conception retenus

1. **La disponibilité est l'objet central** : la grille horaire est le premier
   élément de l'écran de réservation, jamais un détail.
2. **Un refus n'est jamais une impasse** : il est toujours suivi d'alternatives
   cliquables.
3. **Une action par écran** : réserver, annuler, ajouter. Pas de formulaire
   à rallonges.
4. **Le gestionnaire ne déplace pas l'utilisateur** : le tableau de bord est
   un écran séparé, réservé au rôle `admin`.
5. **Mobile d'abord** : grilles et listes en une colonne sur petit écran.

---

## Maquettes haute fidélité (captures de l'application réelle)

Les écrans ci-dessous sont des captures directes de l'application en cours d'exécution
(`bun run dev`, http://localhost:8080), dans le thème définitif
(sarcelle profonde `oklch(0.42 0.09 195)`, ambre `oklch(0.8 0.15 70)`, Space Grotesk + DM Sans).

| Fichier | Écran | Points à commenter |
| --- | --- | --- |
| `1_accueil.png` | Page d'accueil | Promesse en une phrase, aperçu des disponibilités, 2 appels à l'action (créer un compte / voir les ressources), les 3 étapes. |
| `2_auth.png` | Inscription / connexion | Formulaire minimal : nom, email, mot de passe ; bascule « J'ai déjà un compte ». |
| `3_catalogue.png` | Catalogue | Filtres (Tout / Salles / Matériel), recherche, capacité minimale, cartes avec lieu, capacité et équipements. |
| `4_disponibilites.png` | Réservation | Grille horaire 8h–20h (vert = libre, rouge = pris), sélection 14h–16h en teal, durée 1–4h, rappel des règles. |
| `5_mes_reservations.png` | Mes réservations | Réservations à venir avec annulation en un clic, historique séparé. |
| `6_admin.png` | Tableau de bord gestionnaire | Chiffres clés, graphique des ressources les plus demandées, table des réservations, gestion du catalogue. |

