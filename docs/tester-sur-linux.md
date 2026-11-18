# Tester l'application sous Linux

Fiche pratique pour installer, lancer et vérifier ReservCampus sur une machine
Linux (Debian/Ubuntu, Fedora, Arch). Le projet est une application full-stack
unique : le même code sert l'interface et le serveur.

---

## 1. Prérequis

| Outil | Version | Vérifier avec |
| --- | --- | --- |
| Node.js | 22 ou plus (recommandé) | `node --version` |
| Bun | dernière | `bun --version` (ou `npm --version`) |

> Node 20 fonctionne encore, mais la bibliothèque de base de données affiche
> un avertissement de dépréciation et cessera de le prendre en charge.
> Préférez Node 22 (version LTS actuelle).

Installer Bun :

```sh
curl -fsSL https://bun.sh/install | bash
# puis ouvrir un nouveau terminal, ou :
source ~/.bashrc
```

Sans Bun, `npm` fonctionne partout (`npm install`, `npm run dev`).

---

## 2. Récupérer le code

Depuis le ZIP livré :

```sh
unzip reservcampus.zip
cd reservcampus
```

Le ZIP ne contient **ni `node_modules` ni `.env`** : ils se recréent sur place.

---

## 3. Installer les dépendances

```sh
bun install          # ou : npm install
```

---

## 4. Configurer l'environnement

```sh
cp .env.example .env
```

Puis remplir `.env` avec les valeurs de votre instance de base de données
(URL, clé publiable, identifiant). Ces valeurs se lisent dans les réglages
d'environnement du projet (Lovable Cloud). Sans elles, le site s'ouvre mais
ne peut ni inscrire ni charger de données.

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
SUPABASE_URL=...            # mêmes valeurs, côté serveur
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_PROJECT_ID=...
LOVABLE_API_KEY=...         # utile uniquement pour « Résumer avec l'IA »
```

`.env` est ignoré par Git : ne jamais le committer.

---

## 5. Lancer

```sh
bun run dev          # ou : npm run dev
```

L'application répond sur **http://localhost:8080**.

Si le port est déjà pris, le message est `Port 8080 is already in use` :

```sh
bun run dev --port 3000
```

---

## 6. Vérifier

```sh
bun test             # 8 tests : créneaux, chevauchements, règles d'équité
bun run lint         # style et erreurs de code
bun run build        # compilation de production
bun run preview      # sert le build sur http://localhost:8080
```

---

## 7. Scénario de démonstration

1. **Créer le compte gestionnaire en premier** : le premier compte reçoit le
   rôle gestionnaire. Créer ensuite un second compte « étudiant ».
2. Accueil → *Créer mon compte* → inscription → connexion.
3. Catalogue → une salle → grille horaire 8h–20h → durée 1 à 4h → *Réserver*.
4. **Conflit** : avec le second compte, retenter le même créneau → refus
   « Ce créneau est déjà réservé » + créneaux et ressources alternatifs.
5. *Mes réservations* → *Annuler* → le créneau redevient libre.
6. *Tableau de bord* → chiffres clés, ressource la plus demandée,
   bouton **« Résumer avec l'IA »** (nécessite `LOVABLE_API_KEY`).

---

## 8. Problèmes fréquents

| Message | Cause | Solution |
| --- | --- | --- |
| `bun: command not found` | Bun absent ou terminal non rouvert | installer Bun, rouvrir le terminal, ou utiliser `npm` |
| `Port 8080 is already in use` | un autre serveur occupe le port | `bun run dev --port 3000` |
| `Cannot find module ...` | dépendances incomplètes | supprimer `node_modules` puis `bun install` |
| Site ouvert mais données absentes | `.env` manquant ou incomplet | `cp .env.example .env` et renseigner les valeurs |
| `EACCES` sur un port < 1024 | port réservé | lancer sur 8080 ou 3000 |
| Inscription sans accès | confirmation par email attendue | cliquer le lien reçu, ou demander à désactiver la confirmation |
| Version de Node trop ancienne | Node < 20 | `nvm install 20 && nvm use 20` |

---

## 9. Test rapide sans installation

Ouvrir simplement l'adresse de l'aperçu du projet dans un navigateur : aucune
installation n'est nécessaire, mais le code ne peut pas y être modifié.
