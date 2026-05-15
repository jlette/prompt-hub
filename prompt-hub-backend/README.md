# Prompt Hub — Backend

API REST (NestJS) pour **Prompt Hub**. Sert de backend réaliste pour apprendre Angular moderne dans un contexte proche de l’entreprise (auth, CRUD, JWT, CORS).

- **Port** : 3000
- **Données** : fichier JSON local (`data/db.json`)

## Modes auth (tutoriel)

| Commande | Mode |
|----------|------|
| `npm run start` / `npm run start:dev` | Sans auth : créer / modifier / voter sans connexion (utilisateur « Système ») |
| `npm run start:auth` / `npm run start:auth:dev` | Avec auth : JWT requis pour créer, modifier, voter |

## Lancer le projet

```bash
npm install
npm run start          # sans auth
# ou
npm run start:auth     # avec auth
```

Le frontend Angular (port 4200) consomme cette API ; lancer les deux pour développer.

**Frontend :** [prompt-hub-frontend](https://github.com/GaetanRouzies/prompt-hub-frontend)
