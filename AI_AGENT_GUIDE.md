# AI_AGENT_GUIDE.md

# Guide des Agents IA

## Présentation

Ce document est destiné aux assistants de développement assistés par intelligence artificielle (ChatGPT, Codex, GitHub Copilot, Claude Code, Cursor AI, etc.).

Son objectif est de fournir toutes les informations nécessaires afin que les interventions automatiques respectent l'architecture, les règles métier et les conventions du projet.

---

# Objectif du projet

Développer une application web moderne de gestion des congés et des permissions d'absence pour SIAP PHARMA.

Le projet est réalisé dans le cadre d'un stage académique à CIS Formation.

---

# Avant toute intervention

Avant de modifier le projet, lire impérativement les documents suivants dans cet ordre :

1. README.md
2. PROJECT_CONTEXT.md
3. ARCHITECTURE.md
4. CONTRIBUTING.md
5. DECISIONS.md
6. ROADMAP.md
7. CHANGELOG.md

Ne jamais intervenir sans avoir pris connaissance de ces documents.

---

# Architecture

Le projet utilise une architecture Frontend / Backend séparée.

Frontend :

- React
- TypeScript
- Vite

Backend :

- NestJS
- TypeScript

Base de données :

- PostgreSQL

ORM :

- Prisma ORM version 6

---

# Workflow métier

Le workflow officiel est :

Employé

↓

Service RH

↓

Direction

Le Responsable Hiérarchique ne fait plus partie du projet.

Cette règle est définitive.

---

# Technologies imposées

Frontend

- React
- TypeScript
- Vite
- React Router
- Axios
- TanStack Query
- Tailwind CSS
- Shadcn/UI

Backend

- NestJS
- Prisma ORM
- PostgreSQL
- JWT
- Passport
- Bcrypt

---

# Règles importantes

Toujours :

- respecter l'architecture existante ;
- utiliser TypeScript ;
- créer un code modulaire ;
- écrire un code lisible ;
- éviter les duplications ;
- utiliser Prisma ORM pour les accès aux données.

Ne jamais :

- modifier le workflow métier ;
- supprimer une règle métier ;
- casser la structure des dossiers ;
- modifier les technologies sans validation.

---

# Avant toute modification importante

Toute évolution importante doit suivre ce processus :

1. Comprendre le besoin.
2. Vérifier PROJECT_CONTEXT.md.
3. Vérifier ARCHITECTURE.md.
4. Vérifier DECISIONS.md.
5. Proposer la solution.
6. Attendre la validation.
7. Implémenter.
8. Tester.
9. Mettre à jour la documentation si nécessaire.

---

# Convention de développement

Le code est écrit en anglais.

La documentation est rédigée en français.

---

# API

Préfixe obligatoire :

/api/v1

---

# Sécurité

Respecter systématiquement :

- Validation des données.
- Authentification.
- Autorisation par rôle.
- Chiffrement des mots de passe.
- Gestion correcte des erreurs.

---

# Qualité du code

Le code généré doit être :

- lisible ;
- maintenable ;
- documenté lorsque nécessaire ;
- réutilisable ;
- cohérent avec le reste du projet.

---

# Documentation

Si une intervention modifie :

- l'architecture ;
- une règle métier ;
- une convention ;
- une technologie ;
- le workflow ;

les documents concernés doivent être mis à jour.

---

# Philosophie du projet

La priorité n'est pas seulement de produire une application fonctionnelle.

L'objectif est de développer une application :

- professionnelle ;
- moderne ;
- robuste ;
- sécurisée ;
- évolutive ;
- documentée ;
- facilement maintenable.

Toute proposition d'amélioration est bienvenue, mais aucune décision majeure ne doit être appliquée sans validation préalable.