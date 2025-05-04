# Halloween Discord Bot 🎃

Un bot Discord « Halloween » :
- Système de monnaie (bonbons 🍬)  
- Boutique interactive  
- Aventure narrative avec chapitres quotidiens  
- Notifications opt-in  
- Classement des collectionneurs  
- Mini-commandes utilitaires  

---

## 🚀 Installation

1. **Cloner le dépôt**  
   ```bash
   git clone https://github.com/Shinyfr/halloween.git
   cd halloween
   ```

2. **Installer les dépendances**  
   ```bash
   npm install
   ```

3. **Configurer l’environnement**  
   Crée un fichier `.env` à la racine du projet :
   ```ini
   DISCORD_TOKEN=TON_TOKEN_ICI
   CLIENT_ID=ID_DE_L_APP
   GUILD_ID=ID_DE_TON_SERVER
   ADMIN_ROLE_ID=ID_DU_ROLE_ADMIN
   DAILY_REWARD=5           # (facultatif) nombre de bonbons quotidiens
   STORY_TEST_MODE=false    # true pour dérouler l’histoire sans délai
   ```

4. **Déployer les slash-commands**  
   ```bash
   node deploy-commands.js
   ```

5. **Démarrer le bot** (avec PM2, Docker, systemd…)  
   ```bash
   pm2 start index.js --name halloween
   pm2 save
   ```

---

## 🛠️ Configuration

- **`.env`**  
  - `DISCORD_TOKEN` : token de ton bot Discord  
  - `CLIENT_ID` / `GUILD_ID` : IDs pour le déploiement des slash-commands  
  - `ADMIN_ROLE_ID` : rôle autorisé aux commandes admin  
  - `DAILY_REWARD` : bonbons distribués par `/daily`  
  - `STORY_TEST_MODE` : `true` pour désactiver les délais entre chapitres  

- **`story.json`**  
  - Structure narrative  
  - `delayDays` : jours avant déblocage du chapitre suivant  
  - `image` (facultatif) : URL ou chemin local (`assets/story/...`)  
  - `ending: "death"|"success"` + `reward` pour les fins réussites  

- **`shop.json`**  
  - Catalogue d’articles achetables (id, nom, prix, description, emoji)  

---

## 📜 Commandes

### Utilisateur

| Commande        | Description                                                  |
|-----------------|--------------------------------------------------------------|
| `/daily`        | Récupère tes bonbons quotidiens                              |
| `/balance`      | Affiche ton solde de bonbons 🍬                              |
| `/shop`         | Affiche la boutique                                         |
| `/buy <item>`   | Achète un article                                           |
| `/inventory`    | Montre ta liste d’achats                                    |
| `/story`        | Lance ou continue l’aventure (chapitres quotidiens)         |
| `/notify`       | Active/désactive les notifications de nouveaux chapitres    |
| `/top`          | Affiche le classement des meilleurs collectionneurs         |
| `/help`         | Affiche l’aide et la liste des commandes                    |

### Admin / Rôle Spécifique

| Commande         | Description                                      |
|------------------|--------------------------------------------------|
| `/givebonbons`   | Donne des bonbons à un membre                   |
| `/setbonbons`    | Fixe le solde de bonbons d’un membre            |
| `/resetdaily`    | Réinitialise le cooldown du `/daily`              |
| `/announce`      | Envoie une annonce dans un salon spécifié         |
| `/resettop`      | Réinitialise tous les soldes de bonbons (leaderboard) |

> Seuls les admins ou le rôle `ADMIN_ROLE_ID` peuvent utiliser les commandes admin.

---

## 📂 Structure du projet

```
halloween/
├─ assets/
│   └─ story/           # Images/GIFs pour l’aventure
├─ commands/
│   ├─ admin/           # Commandes réservées aux admins
│   ├─ balance.js
│   ├─ buy.js
│   ├─ daily.js
│   ├─ help.js
│   ├─ inventory.js
│   ├─ notify.js
│   ├─ shop.js
│   ├─ story.js
│   └─ top.js
├─ data/                # Stockage node-persist (états, balances, prefs…)
├─ db.js                # Wrapper node-persist
├─ deploy-commands.js   # Script de déploiement des slash-commands
├─ index.js             # Point d’entrée principal
├─ package.json
├─ shop.json            # Catalogue de la boutique
└─ story.json           # Scénario interactif et chapitres
```

*Bon Halloween et amuse-toi bien avec tes bonbons ! 🍬👻*
