# CONTRIBUTING.md

# Guide de Développement

## Présentation

Ce document décrit les règles de développement du projet.

Toute personne (développeur ou agent IA) intervenant sur ce projet doit respecter les conventions définies ci-dessous afin de garantir un code cohérent, maintenable et de qualité.

---

# Principe fondamental

Avant toute modification importante :

1. Comprendre le besoin.
2. Vérifier les règles métier dans PROJECT_CONTEXT.md.
3. Vérifier l'architecture dans ARCHITECTURE.md.
4. Proposer la solution.
5. Valider la solution.
6. Implémenter.
7. Tester.
8. Documenter si nécessaire.

Aucune fonctionnalité importante ne doit être développée sans validation préalable.

---

# Technologies utilisées

## Frontend

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Tailwind CSS
- Shadcn/UI

---

## Backend

- NestJS
- Prisma ORM
- PostgreSQL
- JWT

---

# Langue

## Code

Le code est écrit en anglais.

Exemple :

```ts
createLeaveRequest()

employeeService

leaveRepository
```

---

## Documentation

Toute la documentation est rédigée en français.

---

# Organisation des modules Backend

Chaque module doit respecter cette structure :

```text
module-name/

module-name.module.ts

module-name.controller.ts

module-name.service.ts

dto/

entities/
```

Exemple :

```text
users/

users.module.ts

users.controller.ts

users.service.ts

dto/

entities/
```

---

# DTO

Tous les endpoints doivent utiliser des DTO.

Exemple :

```text
CreateUserDto

UpdateUserDto

LoginDto
```

---

# Validation

Toutes les entrées utilisateur doivent être validées.

Utiliser :

- class-validator
- class-transformer
- ValidationPipe

Aucune donnée ne doit être enregistrée sans validation.

---

# Gestion des erreurs

Toutes les erreurs doivent retourner :

- un code HTTP approprié ;
- un message clair ;
- un format JSON cohérent.

---

# Conventions de nommage

## Variables

camelCase

Exemple :

```ts
employeeId

leaveType

createdAt
```

---

## Fonctions

camelCase

Exemple :

```ts
createUser()

findAll()

approveLeave()
```

---

## Classes

PascalCase

Exemple :

```text
EmployeeService

LeaveController

UserModule
```

---

## Fichiers

kebab-case

Exemple :

```text
employee.service.ts

leave.controller.ts

user.module.ts
```

---

# Commentaires

Les commentaires doivent expliquer :

- pourquoi une logique existe ;
- jamais ce que fait une instruction évidente.

Les commentaires inutiles sont à éviter.

---

# Base de données

Toutes les opérations passent par Prisma ORM.

Les requêtes SQL directes sont interdites sauf justification technique.

---

# API

Toutes les routes utilisent le préfixe :

```text
/api/v1
```

---

# Git

Les commits doivent être courts et explicites.

Exemples :

```text
feat: add authentication module

feat: create employee module

fix: validate leave dates

refactor: simplify leave service

docs: update architecture
```

---

# Tests

Avant toute validation :

- vérifier que le backend compile ;
- vérifier que le frontend compile ;
- vérifier les nouvelles fonctionnalités ;
- corriger les erreurs éventuelles.

Aucun code cassant l'application ne doit être intégré.

---

# Documentation

Toute décision importante doit être reportée dans :

- DECISIONS.md
- CHANGELOG.md

si nécessaire.

---

# Bonnes pratiques

Toujours privilégier :

- la simplicité ;
- la lisibilité ;
- la modularité ;
- la réutilisabilité.

Éviter :

- le code dupliqué ;
- les dépendances inutiles ;
- les fonctions trop longues ;
- les variables ambiguës.

---

# Rôle des agents IA

Avant de modifier le projet, un agent IA doit consulter :

1. README.md
2. PROJECT_CONTEXT.md
3. ARCHITECTURE.md
4. CONTRIBUTING.md
5. DECISIONS.md
6. ROADMAP.md

Ces documents constituent la référence officielle du projet.

---

# Objectif

L'objectif n'est pas seulement de produire une application fonctionnelle, mais également un projet professionnel, cohérent, documenté et facilement maintenable.