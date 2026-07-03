# DECISIONS.md

# Journal des Décisions du Projet

## Présentation

Ce document recense toutes les décisions importantes prises au cours du développement du projet.

Contrairement au CHANGELOG qui décrit les réalisations, ce document explique **pourquoi** certaines décisions ont été prises.

Chaque décision possède :

- un identifiant unique ;
- une date ;
- un contexte ;
- une décision ;
- une justification ;
- un impact sur le projet.

---

# DECISION-001

## Date

18 Juin 2026

## Sujet

Choix du thème du projet

## Contexte

Le stage nécessite la réalisation d'une application répondant à un besoin réel de l'entreprise.

## Décision

Développer une application web moderne de gestion des congés et des permissions d'absence.

## Justification

- Répond à un besoin réel.
- Sujet pertinent.
- Projet suffisamment riche pour un stage de fin de formation.
- Permet d'appliquer les connaissances acquises.

## Impact

Cette décision constitue la base de tout le projet.

---

# DECISION-002

## Date

18 Juin 2026

## Sujet

Architecture générale

## Décision

Adopter une architecture Frontend / Backend séparée.

## Technologies retenues

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

- Prisma ORM

## Justification

Cette architecture est moderne, évolutive et largement utilisée dans les applications professionnelles.

## Impact

Tous les développements devront respecter cette architecture.

---

# DECISION-003

## Date

18 Juin 2026

## Sujet

Workflow de validation

## Décision

Le workflow officiel est :

Employé

↓

Service RH

↓

Direction

## Justification

Le Service RH vérifie la conformité de la demande.

La Direction reste la seule autorité de décision.

## Impact

Toutes les fonctionnalités devront respecter ce workflow.

---

# DECISION-004

## Date

18 Juin 2026

## Sujet

Suppression du Responsable Hiérarchique

## Contexte

Le premier cahier des charges prévoyait un Responsable Hiérarchique.

## Décision

Le Responsable Hiérarchique est retiré du processus.

## Nouveau workflow

Employé

↓

Service RH

↓

Direction

## Justification

Décision validée avec les besoins réels du projet.

## Impact

Tous les diagrammes UML, les écrans et les développements utilisent désormais ce workflow.

---

# DECISION-005

## Date

01 Juillet 2026

## Sujet

Base de données

## Décision

Utiliser PostgreSQL.

## Justification

- Base robuste.
- Open Source.
- Très bonne intégration avec NestJS.
- Très bonne intégration avec Prisma.

## Impact

Toute la persistance des données repose sur PostgreSQL.

---

# DECISION-006

## Date

02 Juillet 2026

## Sujet

Version de Prisma ORM

## Contexte

Les premiers essais ont été réalisés avec Prisma 7.

Des différences importantes de configuration ont été constatées par rapport aux versions précédentes.

## Décision

Standardiser le projet sur Prisma ORM 6.

## Justification

- Version stable.
- Documentation abondante.
- Excellente compatibilité avec NestJS.
- Réduction des risques liés aux changements récents.

## Impact

Toutes les migrations et le développement utiliseront Prisma ORM 6.

---

# DECISION-007

## Date

02 Juillet 2026

## Sujet

Documentation du projet

## Décision

Créer une documentation technique complète dès le début du développement.

## Documents officiels

- README.md
- PROJECT_CONTEXT.md
- ARCHITECTURE.md
- CONTRIBUTING.md
- ROADMAP.md
- CHANGELOG.md
- DECISIONS.md

## Justification

- Faciliter le développement.
- Assurer la continuité du projet.
- Aider les futurs développeurs ou agents IA.
- Améliorer la qualité de la documentation.

## Impact

Toute évolution importante devra être documentée.

---

# DECISION-008

## Date

02 Juillet 2026

## Sujet

Méthode de développement

## Décision

Adopter un processus de développement par validation progressive.

## Processus

1. Analyse du besoin.
2. Proposition de la solution.
3. Validation.
4. Développement.
5. Vérification.
6. Tests.
7. Documentation.

## Justification

Cette méthode réduit les erreurs et garantit la cohérence du projet.

## Impact

Aucune évolution importante ne sera développée sans validation préalable.

---

# Règle générale

Chaque nouvelle décision importante devra être ajoutée dans ce document.

Les décisions ne doivent jamais être supprimées.

Si une décision évolue, une nouvelle décision devra être créée afin de conserver l'historique du projet.