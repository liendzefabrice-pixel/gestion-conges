# ARCHITECTURE.md

# Architecture Technique du Projet

## Présentation

Ce document décrit l'architecture technique de l'application de gestion des congés et permissions.

L'objectif est de garantir une architecture moderne, modulaire, évolutive et facilement maintenable.

---

# Architecture générale

L'application repose sur une architecture en plusieurs couches.

```text
                Utilisateur
                     │
                     ▼
           Frontend React + TypeScript
                     │
             Requêtes HTTP (REST API)
                     │
                     ▼
          Backend NestJS + TypeScript
                     │
               Prisma ORM
                     │
                     ▼
             PostgreSQL Database
```

Chaque couche possède une responsabilité bien définie.

---

# Technologies utilisées

## Frontend

- React
- TypeScript
- Vite

### Bibliothèques prévues

- React Router
- Axios
- React Hook Form
- Zod
- TanStack Query
- Tailwind CSS
- Shadcn/UI
- Lucide React

---

## Backend

- NestJS
- TypeScript

### Bibliothèques prévues

- Prisma ORM
- JWT
- Passport
- Bcrypt
- Class Validator
- Class Transformer

---

## Base de données

- PostgreSQL

---

## ORM

- Prisma ORM (version 6)

---

# Architecture Frontend

Le frontend est organisé par modules fonctionnels.

```text
frontend/

src/

├── assets/
├── components/
├── layouts/
├── pages/
├── routes/
├── services/
├── hooks/
├── contexts/
├── types/
├── utils/
├── styles/
└── main.tsx
```

## Principe

Chaque module doit être indépendant.

Exemple :

```text
pages/

Authentication/

Dashboard/

Leave/

Employee/

Administration/
```

---

# Architecture Backend

Le backend suit l'architecture modulaire recommandée par NestJS.

```text
backend/

src/

├── modules/
│
├── common/
│
├── config/
│
├── prisma/
│
├── guards/
│
├── interceptors/
│
├── decorators/
│
├── filters/
│
├── pipes/
│
└── main.ts
```

---

# Modules Backend

Chaque module possède sa propre structure.

Exemple :

```text
modules/

users/

users.module.ts

users.controller.ts

users.service.ts

dto/

entities/
```

Tous les modules respecteront cette organisation.

---

# Architecture de la Base de Données

Le projet utilise PostgreSQL.

Les accès aux données sont réalisés exclusivement via Prisma ORM.

Aucune requête SQL directe ne devra être utilisée sauf nécessité exceptionnelle.

---

# API REST

Le backend expose une API REST.

Préfixe global :

```text
/api/v1
```

Exemple :

```text
GET /api/v1/users

POST /api/v1/auth/login

POST /api/v1/leaves

GET /api/v1/employees
```

---

# Authentification

L'application utilise :

- JWT

Les mots de passe sont chiffrés avec :

- bcrypt

---

# Gestion des rôles

Les rôles disponibles sont :

- ADMIN
- EMPLOYEE
- HR
- DIRECTOR

Les autorisations seront contrôlées au niveau du backend.

---

# Gestion des erreurs

Le backend doit toujours retourner :

- un code HTTP approprié ;
- un message clair ;
- une réponse JSON cohérente.

Exemple :

```json
{
    "statusCode": 404,
    "message": "Utilisateur introuvable"
}
```

---

# Validation

Toutes les données reçues par l'API doivent être validées.

Les validations utiliseront :

- ValidationPipe
- class-validator
- class-transformer

---

# Conventions de développement

## Langue

Le code est écrit en anglais.

Les commentaires et la documentation sont rédigés en français.

---

## Nommage

### Variables

camelCase

Exemple :

```ts
leaveRequest
employeeId
```

---

### Classes

PascalCase

Exemple :

```text
UserService

LeaveController

EmployeeModule
```

---

### Fichiers

kebab-case

Exemple :

```text
leave-request.service.ts

employee.controller.ts
```

---

# Sécurité

Les principes suivants doivent être respectés :

- Authentification obligatoire
- Autorisation par rôle
- Validation des données
- Protection des mots de passe
- Gestion des erreurs
- Journalisation des actions importantes

---

# Performance

L'application doit être optimisée pour :

- rapidité
- lisibilité
- maintenabilité
- évolutivité

---

# Tests

Le projet prévoit :

- tests unitaires
- tests d'intégration

---

# Déploiement futur

L'application pourra être déployée sur :

- Docker
- VPS
- Cloud

---

# Principe fondamental

Toute nouvelle fonctionnalité devra respecter :

- l'architecture existante ;
- les conventions de développement ;
- les règles métier définies dans PROJECT_CONTEXT.md.

Aucune implémentation ne devra contourner ces principes.