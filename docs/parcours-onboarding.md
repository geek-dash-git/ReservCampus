# Parcours d'onboarding — ReservCampus

Comment un nouvel utilisateur découvre et prend en main l'application.

## 1. Vue d'ensemble du parcours

```text
Accueil (sans compte)
   │  « Créer mon compte »            « Voir les ressources »
   ▼                                        ▼
Inscription (email + mot de passe)    Catalogue consultable
   │  lien de confirmation reçu                │
   ▼                                        ▼
Connexion ────────────────────────► Catalogue ──► Ressource
                                               │
                                     créneaux libres / pris
                                               │
                                        réservation confirmée
                                               │
                              ┌────────────────┴───────────────┐
                              ▼                                ▼
                      « Mes réservations »            (conflit)
                       annulation en 1 clic     autres créneaux +
                                                autres ressources libres
```

## 2. Les étapes clés, écran par écran

### Étape 1 — Accueil (`/`)

- **Ce que l'utilisateur comprend :** le projet résout le problème « je ne sais
  pas quelle salle est libre ».
- **Éléments visibles :** promesse en titre, une grille de créneaux d'exemple
  (vert = libre, rouge = pris) qui montre immédiatement le principe, les trois
  étapes « Choisissez / Réservez / Gérez », trois bénéfices.
- **Actions proposées :** *Créer mon compte*, *Voir les ressources*,
  *Se connecter*.
- **Choix d'onboarding :** aucune inscription n'est exigée pour comprendre le
  principe ; l'exemple de grille fait comprendre la valeur avant de demander un
  compte.

### Étape 2 — Inscription (`/auth?mode=signup`)

- **Ce qui est demandé :** nom, email, mot de passe. Rien de plus.
- **Ce qui se passe côté serveur :** le profil est créé, le rôle `user` est
  attribué automatiquement, et **le premier compte du système devient
  gestionnaire** (utile pour la démonstration de l'administration).
- **Message affiché :** confirmation de l'envoi du lien d'activation, avec
  l'adresse email concernée.

### Étape 3 — Connexion et entrée dans l'application

- Après la session, l'utilisateur arrive directement sur le **catalogue** :
  c'est l'écran où l'action est possible immédiatement.
- La barre de navigation n'affiche que ce qui le concerne : *Ressources*,
  *Mes réservations*, et *Tableau de bord* uniquement pour un gestionnaire.
- L'adresse email de la session est visible, donc l'utilisateur sait qui il est
  dans l'application.

### Étape 4 — Première réservation

- Le catalogue est filtrable (salles / matériel, recherche, capacité minimale),
  donc la première ressource se trouve en quelques secondes.
- Sur la ressource, la **grille horaire 8h–20h** montre en vert ce qui est
  libre ; la durée se choisit de 1 à 4 heures.
- La réservation est confirmée à l'écran : c'est la première victoire de
  l'utilisateur, et elle est atteinte en 3 clics.

### Étape 5 — Découverte de la règle (conflit)

- Si le créneau est pris, la réservation est **refusée** et l'écran propose
  aussitôt : d'autres horaires le même jour, et d'autres ressources libres à la
  même heure.
- Ce moment est volontairement mis en avant en soutenance : il prouve que le
  système protège l'utilisateur au lieu de le bloquer.

### Étape 6 — Reprise et gestion

- « Mes réservations » : réservations à venir avec **annulation en un clic**,
  et historique des réservations passées ou annulées.
- Annuler libère immédiatement le créneau pour les autres.

## 3. Ce qui a été volontairement simplifié pour un nouvel utilisateur

1. **Un seul chemin d'entrée** : email + mot de passe, pas de formulaire à
   rallonges.
2. **Aucune décision à prendre au premier écran** : le catalogue s'ouvre sur
   des ressources réelles et filtrables.
3. **Les règles sont expliquées au moment où elles bloquent**, pas avant :
   l'utilisateur lit « durée maximale 4 heures » ou « 3 réservations actives
   maximum » quand la règle s'applique, avec l'alternative.
4. **Le rôle est invisible** : un utilisateur normal ne voit jamais le mot
   « gestionnaire », il ne voit que le lien du tableau de bord s'il l'est.

## 4. Accessibilité et téléphone

- Grille de créneaux utilisable au pouce, cibles larges.
- Pages légères : une requête par écran, aucune bibliothèque lourde chargée au
  premier affichage.
- Messages d'erreur en français, formulés pour l'utilisateur
  (« Ce créneau est déjà réservé ») et non en message technique de base.
