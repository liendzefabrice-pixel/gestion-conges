# PROJECT_CONTEXT.md

# Contexte du projet

## Informations générales

**Nom du projet :**
Application Web Moderne de Gestion des Congés et Permissions

**Entreprise d'accueil :**
SIAP PHARMA

**Établissement de formation :**
CIS Formation (Cameroon Institute of Specialization)

**Auteur :**
Fabrice Liendze

**Année :**
2026

---

# Objectif du projet

Développer une application web moderne permettant la gestion numérique des congés et des permissions d'absence des employés de SIAP PHARMA.

L'application vise à remplacer les procédures papier par un processus entièrement informatisé, sécurisé et traçable.

---

# Workflow officiel

Le workflow de validation retenu est le suivant :

```text
Employé
    │
    ▼
Soumet une demande
    │
    ▼
Service RH
Analyse la demande
Rédige un avis
    │
    ▼
Direction
Décision finale
(Approbation ou Refus)
    │
    ▼
Notification automatique de l'employé
```

⚠️ Ce workflow est définitif.

Le Responsable Hiérarchique ne fait plus partie du processus de validation.

---

# Acteurs de l'application

## Employé

Peut :

- Se connecter
- Modifier son profil
- Consulter son solde
- Effectuer une demande de congé
- Effectuer une demande de permission
- Consulter l'historique de ses demandes
- Télécharger les décisions
- Recevoir des notifications

---

## Service RH

Peut :

- Consulter toutes les demandes
- Vérifier les informations
- Contrôler les règles métier
- Rédiger un avis
- Transmettre la demande à la Direction

Le Service RH ne valide jamais une demande.

---

## Direction

Peut :

- Consulter les demandes
- Lire l'avis RH
- Approuver
- Refuser
- Ajouter un commentaire

La Direction est la seule autorité pouvant prendre la décision finale.

---

## Administrateur

Peut gérer :

- les utilisateurs
- les rôles
- les départements
- les services
- les paramètres
- les jours fériés
- les types de congés

---

# Modules prévus

## Authentification

- Connexion
- Déconnexion
- JWT
- Gestion des rôles

---

## Gestion des utilisateurs

- Comptes utilisateurs
- Rôles
- Activation / Désactivation

---

## Gestion des employés

- Informations personnelles
- Informations professionnelles
- Affectation
- Solde de congés

---

## Gestion des départements

- Création
- Modification
- Suppression

---

## Gestion des services

- Création
- Modification
- Suppression

---

## Gestion des congés

- Types de congés
- Demandes
- Calcul automatique
- Validation

---

## Gestion des permissions

- Demandes
- Validation

---

## Tableau de bord

Statistiques adaptées au rôle connecté.

---

## Notifications

Notifications automatiques lors :

- d'une demande
- d'un avis RH
- d'une décision
- d'une modification importante

---

# Technologies retenues

## Frontend

- React
- TypeScript
- Vite

## Backend

- NestJS
- TypeScript

## Base de données

- PostgreSQL

## ORM

- Prisma ORM (version 6)

---

# Architecture technique

Frontend

↓

API REST

↓

Backend NestJS

↓

Prisma ORM

↓

PostgreSQL

---

# Diagrammes UML réalisés

Le projet est entièrement modélisé en UML.

Diagrammes disponibles :

- Diagramme de cas d'utilisation
- Diagramme de classes
- Diagramme de séquence

Merise n'est plus utilisée.

---

# Principales règles métier

- Un employé ne peut soumettre que ses propres demandes.
- Une demande suit obligatoirement le workflow RH → Direction.
- Le Service RH ne valide jamais une demande.
- La Direction est seule décisionnaire.
- Les soldes sont automatiquement mis à jour après validation.
- Toutes les actions importantes sont historisées.
- Les utilisateurs sont authentifiés avant tout accès.

---

# Objectif de qualité

Le projet doit respecter les principes suivants :

- Architecture modulaire
- Code propre
- Séparation Frontend / Backend
- API REST
- Sécurité
- Validation des données
- Évolutivité
- Maintenabilité

---

# Convention importante

Toute évolution importante du projet doit être :

1. discutée ;
2. validée ;
3. documentée ;
4. implémentée.

Cette règle s'applique à toute modification fonctionnelle ou technique.

---

# État actuel

Le projet est actuellement en phase de développement.

Les fondations techniques sont installées :

- React
- NestJS
- PostgreSQL
- Prisma
- Git

Les prochains travaux concernent :

- la conception de la base de données ;
- le développement du backend ;
- le développement du frontend.