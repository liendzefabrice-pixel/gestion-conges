# Application Web Moderne de Gestion des Congés et Permissions

## Présentation

Ce projet est une application web moderne développée dans le cadre d'un stage académique effectué chez **SIAP PHARMA**.

L'application a pour objectif de moderniser la gestion des congés et des permissions d'absence en offrant un processus entièrement numérique, sécurisé et intuitif.

Les employés peuvent soumettre leurs demandes directement depuis l'application. Le service des Ressources Humaines analyse chaque demande et émet un avis, tandis que la Direction prend la décision finale d'approbation ou de refus. L'ensemble du processus est entièrement tracé afin de garantir la transparence et la fiabilité du système.

---

# Objectifs

L'application permet notamment de :

- Gérer les utilisateurs.
- Gérer les employés.
- Gérer les départements et services.
- Gérer les types de congés.
- Soumettre des demandes de congé.
- Soumettre des demandes de permission d'absence.
- Vérifier les demandes par le Service RH.
- Valider ou refuser les demandes par la Direction.
- Calculer automatiquement les soldes de congés.
- Générer des statistiques.
- Envoyer des notifications aux utilisateurs.

---

# Workflow fonctionnel

```text
Employé
    │
    ▼
Soumet une demande
    │
    ▼
Service RH
(Vérification + Avis)
    │
    ▼
Direction
(Décision finale)
    │
    ▼
Notification de l'employé
```

---

# Technologies utilisées

## Frontend

- React
- TypeScript
- Vite

## Backend

- NestJS
- TypeScript

## Base de données

- PostgreSQL
- Prisma ORM

---

# Architecture du projet

```
gestion-conges/

│

├── frontend/
│
├── backend/
│
├── README.md
├── PROJECT_CONTEXT.md
├── ARCHITECTURE.md
├── CONTRIBUTING.md
├── ROADMAP.md
├── CHANGELOG.md
└── DECISIONS.md
```

---

# Équipe

Projet réalisé par :

**Fabrice Liendze**

Stage académique 2026

Entreprise :

**SIAP PHARMA**

Établissement de formation :

**CIS Formation (Cameroon Institute of Specialization)**

---

# État actuel du projet

Le projet est actuellement en phase de développement.

Les travaux portent successivement sur :

- la conception fonctionnelle ;
- la conception technique ;
- le développement backend ;
- le développement frontend ;
- les tests ;
- le déploiement.

---

# Licence

Projet académique réalisé dans le cadre d'un stage de fin de formation.

Tous droits réservés.