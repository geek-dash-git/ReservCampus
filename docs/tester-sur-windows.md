# Tester ReservCampus sous Windows

Guide pas à pas pour lancer le projet sur un PC Windows 10/11.

## 1. Prérequis

- **Node.js 22** : téléchargez l'installateur sur <https://nodejs.org> (version LTS) et installez-le avec les options par défaut.
- **Bun** (recommandé) : ouvrez **PowerShell** et exécutez :

  ```powershell
  powershell -c "irm bun.sh/install.ps1 | iex"
  ```

  Fermez puis rouvrez PowerShell pour que la commande `bun` soit reconnue.

> Sans Bun, `npm` (fourni avec Node.js) fonctionne aussi : remplacez `bun install` par `npm install` et `bun run dev` par `npm run dev` partout dans ce guide.

## 2. Récupérer le code

1. Décompressez `reservcampus.zip` (clic droit → **Extraire tout…**).
2. Ouvrez PowerShell dans le dossier extrait : dans l'explorateur, `Shift` + clic droit dans le dossier → **Ouvrir dans le Terminal** (ou tapez `powershell` dans la barre d'adresse).

## 3. Installer les dépendances

```powershell
bun install
```

## 4. Configurer l'environnement

Copiez le modèle de configuration :

```powershell
copy .env.example .env
```

Ouvrez `.env` avec le Bloc-notes et renseignez les trois valeurs publiques du projet (URL de la base, clé publiable, identifiant). Elles se lisent dans les réglages d'environnement du projet Lovable. Sans elles, le site s'ouvre mais rien ne se réserve.

> La clé `LOVABLE_API_KEY` (résumé IA) est secrète : elle n'est pas partageable. Sans elle, tout fonctionne sauf le bouton « Résumer avec l'IA » du tableau de bord.

## 5. Lancer l'application

```powershell
bun run dev
```

Ouvrez <http://localhost:8080> dans votre navigateur.

Si le port 8080 est déjà occupé :

```powershell
bun run dev --port 3000
```

Pour arrêter le serveur : `Ctrl+C` dans le terminal.

## 6. Vérifier que tout est en ordre

```powershell
bun test          # 8 tests sur les règles de réservation
bun run lint      # règles de style
bun run build     # construction de production
```

## 7. Scénario de démonstration

1. Créez un compte étudiant, confirmez l'email (vérifiez les spams).
2. Faites une demande de réservation (filière + groupe de TD obligatoires).
3. Connectez-vous à la console gestionnaire sur `/console-connexion` avec le compte admin.
4. Validez la demande dans l'onglet **À valider**.
5. Testez la réinitialisation : lien « Mot de passe oublié ? » sur la page de connexion.

## 8. Problèmes fréquents

| Problème | Solution |
|---|---|
| `bun` n'est pas reconnu | Fermez et rouvrez PowerShell après l'installation de Bun |
| « This page didn't load » | Le fichier `.env` est absent ou vide : refaites l'étape 4 |
| Port 8080 occupé | `bun run dev --port 3000` |
| Avertissement Node.js 20 | Installez Node.js 22 (étape 1) |
| Email de confirmation introuvable | Vérifiez le dossier Spam / Courrier indésirable |
| Erreur de script PowerShell | Exécutez `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` puis relancez |
| Pare-feu Windows demande une autorisation | Autorisez Node.js sur les réseaux privés |
