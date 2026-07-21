# RAPPORT D'AUDIT FINAL — SIAP PHARMA Gestion des Congés

**Date :** 20 juillet 2026  
**Version audité :** 0.0.1  
**Périmètre :** Backend NestJS 11 + Frontend React 19 / Vite 8 + PostgreSQL / Prisma  
**Type d'audit :** Fonctionnel, structurel, sécurité, conformité métier

---

## A. Architecture & Structure du code

**État : ⚠️ À améliorer**

**Analyse détaillée :**
- L'architecture globale suit bien le pattern NestJS (Module → Controller → Service → ORM), avec 20 modules métier bien découpés.
- Le principe de séparation des responsabilités est globalement respecté. Cependant, on observe une duplication de logique entre `LeaveService` et `LeaveTypesService` (toutes deux exposent `createLeaveType`, `findAllLeaveTypes`, etc.) alors que `LeaveTypesService` délègue à `NotificationsService` et que `LeaveService` fait de même via ses propres méthodes. `LeaveController` expose les endpoints CRUD des types de congés, mais `LeaveTypesController` (absent) n'existe pas — la logique est divisée entre `leave/` et `leave-types/` sans cohérence.
- Le module `leave-balance-engine` recalcule tous les soldes au démarrage (`onApplicationBootstrap` → `syncAllBalances()`), ce qui est un anti-pattern pour une application de production (coût O(n) au démarrage, lock contention possible).
- Les interfaces sont bien typées, mais `DecisionContext` expose `prisma: PrismaService` aux règles de décision, ce qui crée un couplage fort et un risque de sécurité.

**Anomalies :**

| # | Anomalie | Gravité |
|---|----------|---------|
| A1 | Duplication de logique entre `LeaveService` et `LeaveTypesService` pour les types de congés | Mineure |
| A2 | `LeaveBalanceEngine.syncAllBalances()` au démarrage sans mécanisme de cache ou de lazy loading | Majeure |
| A3 | `DecisionContext` expose `PrismaService` complet (pas de repository layer) | Majeure |

**Recommandations :**
- Fusionner les méthodes CRUD des types de congés dans un seul service (`LeaveTypesService`) et faire appel à lui depuis `LeaveService`.
- Remplacer `syncAllBalances()` au démarrage par un trigger manuel (admin) ou une sync par utilisateur à la connexion.
- Créer des interfaces Repository pour limiter les accès Prisma dans les contextes décisionnels.

---

## B. Authentification & Autorisation

**État : ⚠️ À améliorer**

**Analyse détaillée :**
- JWT auth via Passport avec gardes `JwtAuthGuard` et `RolesGuard`.
- La stratégie JWT valide que l'utilisateur existe et est actif à chaque requête (bon point).
- `@Roles()` est utilisé sur la majorité des endpoints.
- Gestion de mot de passe robuste : bcrypt avec salt 10, validation de force (8+ caractères, majuscule, minuscule, chiffre).
- Reset de mot de passe via OTP à 6 chiffres avec expiration (10 min), limite de tentatives (3 requêtes / 15 min).
- `mustChangePassword` correctement implémenté.
- `validatePasswordStrength` ne requiert PAS de caractère spécial, ce qui est contraire aux recommandations OWASP et à la plupart des référentiels (ANSSI, NIST).

**Anomalies :**

| # | Anomalie | Gravité |
|---|----------|---------|
| B1 | Aucun caractère spécial exigé dans le mot de passe | Mineure |
| B2 | `OTP_RESEND_DELAY_SECONDS=60` défini dans `.env` mais jamais lu par le code (`auth.service.ts` n'y fait pas référence) — violation de rate limiting | Majeure |
| B3 | Les endpoints `GET /leave-campaigns/current`, `POST /leave-campaigns/my/proposal`, `GET /leave-campaigns/my/proposal`, `PATCH /leave-campaigns/my/proposal` n'ont PAS de décorateur `@Roles()` — accessibles sans contrôle de rôle (bien que protégés par JWT via le guard global du contrôleur) | Majeure |
| B4 | `JWT_SECRET=change_this_secret_key` en dur dans `.env` — secret faible | Critique |
| B5 | Aucune limitation de taux (rate limiting) sur `/auth/login` — risque de brute force | Majeure |
| B6 | Aucun mécanisme de refresh token — expiration JWT à 1d, session perdue sans recréation | Mineure |

**Recommandations :**
- Ajouter une règle de caractère spécial dans `validatePasswordStrength()`.
- Implémenter le `OTP_RESEND_DELAY_SECONDS` dans le service d'auth pour espacer les envois d'OTP.
- Systématiser `@Roles()` sur tous les endpoints exposés.
- Générer un secret JWT fort (≥ 256 bits) et le passer via variable d'environnement.
- Ajouter `@nestjs/throttler` pour protéger `/auth/login`.
- Implémenter des refresh tokens JWT.

---

## C. Gestion des Congés (Leave Management)

**État : ⚠️ À améliorer**

**Analyse détaillée :**
- Workflow complet implémenté : Création → Avis RH → Transmission → Décision Direction. Historique complet via `LeaveRequestHistory`.
- Validation des dates (pas de date passée, endDate > startDate, durée min/max, chevauchement) correctement effectuée.
- Gestion des jours ouvrés via `WorkingDaysService` qui exclut dimanches et jours fériés.
- Calcul de la date de reprise (`computeReturnDate`) fonctionnel.
- Contrôle d'ancienneté pour congés annuels (1 an) et restriction maternité (genre femme).
- `cancelRequest()` ne permet l'annulation que pour `BROUILLON` et `EN_ATTENTE_RH`, contrairement aux permissions qui acceptent aussi `AVIS_RH_RENDU` et `EN_ATTENTE_DIRECTION` — incohérence métier.
- `LeaveController` n'a pas d'endpoint `GET /leave/requests/hr-reviewed` clairement distinct — l'endpoint `GET /leave/requests/hr-reviewed` retourne à la fois `AVIS_RH_RENDU` et `EN_ATTENTE_DIRECTION`, ce qui mélange deux statuts différents.

**Anomalies :**

| # | Anomalie | Gravité |
|---|----------|---------|
| C1 | Incohérence entre l'annulation des congés (seulement EN_ATTENTE_RH/BROUILLON) et des permissions (jusqu'à EN_ATTENTE_DIRECTION) | Majeure |
| C2 | L'endpoint `leave/requests/hr-reviewed` retourne des statuts mélangés (AVIS_RH_RENDU + EN_ATTENTE_DIRECTION) | Mineure |
| C3 | `computeReturnDate` recalcule à chaque appel sans cache des jours fériés | Mineure |
| C4 | Aucune vérification que l'employé a bien une `AnnualLeavePlanning` avant de créer la demande pour les congés annuels (uniquement vérifié pour les types annuels) — correct mais pourrait être élargi | Mineure |
| C5 | `removeRequest()` supprime physiquement (hard delete) les demandes — perte de traçabilité | Majeure |

**Recommandations :**
- Uniformiser les règles d'annulation entre congés et permissions.
- Créer des endpoints spécialisés pour chaque statut.
- Remplacer le hard delete par un soft delete (`isDeleted` ou statut `SUPPRIME`).
- Optimiser le cache des jours fériés (requests réutilisées pour une même paire de dates).

---

## D. Gestion des Permissions

**État : ✅ Conforme**

**Analyse détaillée :**
- Workflow complet : Création → Avis RH → Transmission → Décision Direction. Historique complet via `PermissionRequestHistory`.
- Validation des chevauchements correcte.
- Gestion des soldes de permission (`PermissionBalance`) avec suivi `totalDays`, `adjustedDays`, `usedDays`, `pendingDays`.
- `cancelRequest()` accepte `EN_ATTENTE_RH`, `AVIS_RH_RENDU`, `EN_ATTENTE_DIRECTION` — correct.
- Endpoint `PATCH /permissions/requests/:id/cancel` bien configuré.
- Enum `PermissionType` bien défini : PERMISSION, MARIAGE, NAISSANCE, DECES, FAMILIAL.
- `initPermissionBalance()` crée un solde par défaut de 10 jours, mais sans notification.

**Anomalies :** Aucune anomalie bloquante détectée.

| # | Anomalie | Gravité |
|---|----------|---------|
| D1 | `initPermissionBalance()` ne déclenche pas de notification ni d'audit log | Mineure |

**Recommandations :**
- Ajouter un audit log lors de l'initialisation des soldes de permission.
- Envisager un paramétrage du nombre de jours par défaut (via `Setting`).

---

## E. Moteur de Décision (Decision Engine)

**État : ⚠️ À améliorer**

**Analyse détaillée :**
- Architecture à 6 règles avec design strategy pattern : `department-conflict`, `internal-event-conflict`, `balance-sufficiency`, `campaign-validation`, `operational-risk`, `replacement-availability`.
- Chaque règle produit un score partiel ; le score final est ramené sur 100.
- La décision finale (ACCEPT/REJECT/MODIFY) est enregistrée séparément (`recordDecision`).
- `DecisionAnalysis` persiste l'évaluation complète (règles, score, suggestion).
- **Anomalie critique :** `ReplacementAvailabilityRule` utilise des statuts de proposition (`SOUMISE`, `ACCEPTEE_RH`, `ACCEPTEE_DIRECTION`) qui n'existent PAS dans l'enum `ProposalStatus` (seulement `RECUE`, `EN_ANALYSE`, `ACCEPTEE`, `REPROGRAMMEE`, `REFUSEE`). La requête ne matchera jamais rien → le check d'indisponibilité par proposition est toujours vide.
- **Anomalie critique :** `ReplacementAvailabilityRule` référence `desiredEndDate` sur `LeaveProposal` — ce champ n'existe PAS dans le schéma Prisma (seulement `desiredStartDate` et `duration`). La requête échoue silencieusement (catch générique dans `analyze()` → statut `FAIL` avec score 0).
- `BalanceSufficiencyRule` fait `score -= score` (ligne 71) pour solder insuffisant — revient à `score = 0`, mais la syntaxe est incorrecte (devrait être `score = 0`).
- La règle `campaign-validation` n'a pas été lue mais existe dans le module.

**Anomalies :**

| # | Anomalie | Gravité |
|---|----------|---------|
| E1 | `ReplacementAvailabilityRule` utilise des statuts de proposition inexistants (`SOUMISE`, `ACCEPTEE_RH`, `ACCEPTEE_DIRECTION`) au lieu de `RECUE`, `ACCEPTEE` | Critique |
| E2 | `ReplacementAvailabilityRule` référence `desiredEndDate` qui n'existe pas sur `LeaveProposal` | Critique |
| E3 | `BalanceSufficiencyRule`: `score -= score` syntaxe trompeuse (résultat correct = 0, mais expression à risque) | Mineure |
| E4 | Aucun test unitaire sur les règles de décision | Majeure |
| E5 | Si TOUTES les règles échouent, le score est NaN (division par zéro si maxScore = 0) | Critique |

**Recommandations :**
- Corriger les statuts de proposition dans `ReplacementAvailabilityRule` et remplacer `desiredEndDate` par le calcul `startDate + duration`.
- Remplacer `score -= score` par `score = 0`.
- Ajouter une garde contre la division par zéro dans `analyze()`.
- Écrire des tests unitaires pour chaque règle.

---

## F. Notifications & Email

**État : ✅ Conforme**

**Analyse détaillée :**
- Architecture double canal (Database + Mail) via `NotificationChannel` interface.
- `MailChannel` avec per-recipient try/catch — résilience SMTP assurée.
- `sendEmailIfNeeded()` avec whitelist `EMAIL_TYPES` (15 types) — seuls les types listés génèrent des emails.
- `sendMail()` dans `MailService` ne re-throw pas l'erreur SMTP — résilience validée fonctionnellement.
- 4 templates Handlebars : `layout.hbs`, `notification.hbs`, `welcome.hbs`, `forgot-password.hbs`.
- Timeouts SMTP configurés (10s connection, 10s greeting, 15s socket).
- Fallback console en développement (quand transporter = null).
- `notifyCampaignOpened()` et `notifyProposalSubmitted()` fonctionnels.

**Anomalies :**

| # | Anomalie | Gravité |
|---|----------|---------|
| F1 | Template `layout.hbs` utilise un placeholder `placehold.co` pour le logo au lieu du logo réel | Mineure |
| F2 | `notifyCreated/Updated/Archived` dans `InternalEventsService` sont des stubs vides (TODO + simple log) | Majeure |
| F3 | `APP_URL` utilisé dans `notifications.service.ts` (line 57) mais la variable `.env` s'appelle `BASE_URL` — lien d'action des emails potentiellement vide | Majeure |
| F4 | `getAdminUserIds()` et `getHrUserIds()` chargent tous les administrateurs/RH à chaque notification sans cache | Mineure |

**Recommandations :**
- Remplacer le placeholder par le vrai logo ou charger l'image en base64 inline.
- Implémenter les notifications pour les événements internes.
- Aligner `APP_URL` / `BASE_URL` dans le `.env` ou uniformiser la clé.
- Optimiser les requêtes utilisateurs récurrentes avec un cache court (par ex. InMemoryCache 5s).

---

## G. Base de Données & Prisma

**État : ✅ Conforme**

**Analyse détaillée :**
- Schéma Prisma complet avec 26 modèles, 8 enums, relations bien définies.
- Migrations versionnées (init + add_balance_adjustment).
- Contraintes d'unicité correctement définies (ex: `@@unique([employeeId, year])` sur `AnnualLeavePlanning`, `@@unique([employeeId, leaveTypeId, year])` sur `LeaveBalance`).
- Index présents sur les colonnes de recherche fréquentes (employeeId, status, date ranges).
- `onDelete: Cascade` sur les relations enfants appropriées.
- Transactions Prisma utilisées ($transaction) pour les opérations critiques (création de demande, décision, mise à jour de solde).
- Aucune injection SQL possible (Prisma ORM).

**Anomalies :**

| # | Anomalie | Gravité |
|---|----------|---------|
| G1 | `AnnualLeavePlanning` a une contrainte `@@unique([employeeId, year])` mais stocke `month` — un employé ne peut avoir qu'un seul mois de planning par an, ce qui limite la flexibilité | Mineure |
| G2 | `PermissionBalance` n'a pas d'index sur `(employeeId, year)` pour la recherche | Mineure |

**Recommandations :**
- Envisager de rendre `month` optionnel ou de permettre plusieurs plannings par an.
- Ajouter un index composé sur `PermissionBalance(employeeId, year)`.

---

## H. Sécurité

**État : ❌ Non conforme**

**Analyse détaillée :**
- Authentification JWT avec secret faible et en dur (`change_this_secret_key`).
- Aucune protection CSRF (bien que les API stateless JWT soient moins exposées).
- Aucun rate limiting sur les endpoints critiques (login, forgot-password, verify-otp).
- Mot de passe SMTP exposé en clair dans le fichier `.env` versionné.
- Validation généreuse des mots de passe (pas de caractère spécial exigé).
- CORS ouvert uniquement vers `localhost:5173`, mais pas de validation d'en-têtes de sécurité (`helmet` non utilisé).
- JWT stocké dans `localStorage` (vulnérable XSS) — acceptable pour SPA interne.
- Aucun en-tête HTTP de sécurité (HSTS, X-Frame-Options, X-Content-Type-Options).
- L'application tourne en HTTP, pas HTTPS.

**Anomalies :**

| # | Anomalie | Gravité |
|---|----------|---------|
| H1 | `JWT_SECRET=change_this_secret_key` dans `.env` versionné | Critique |
| H2 | SMTP `SMTP_PASSWORD` en clair dans le `.env` versionné | Critique |
| H3 | Aucun rate limiting sur `/auth/login`, `/auth/forgot-password` | Critique |
| H4 | Aucun en-tête de sécurité HTTP (Helmet non installé) | Majeure |
| H5 | Aucune validation de format d'email côté backend | Mineure |
| H6 | Aucune protection CSRF sur les endpoints POST/PATCH/DELETE | Majeure |

**Recommandations :**
- Générer un JWT_SECRET fort (openssl rand -hex 64) et le passer via variable d'environnement système (hors .env).
- Déplacer les secrets SMTP vers une variable d'environnement système ou Azure Key Vault.
- Ajouter `@nestjs/throttler` avec des limites différenciées par endpoint.
- Installer `helmet` pour les en-têtes de sécurité.
- Ajouter une validation de format d'email avec `class-validator` (`@IsEmail()`).
- Envisager double-submit cookie pattern ou SameSite=Strict pour CSRF.

---

## I. Frontend — Routing & UI

**État : ✅ Conforme**

**Analyse détaillée :**
- Routing bien structuré avec `ProtectedRoute`, `PublicRoute`, `RoleRoute`.
- Navigation latérale complète avec section par rôle, icônes Lucide, Tooltips.
- Dark/Light mode fonctionnel avec persistance localStorage.
- Layout AuthLayout avec thème toggle (Sun/Moon) ajouté.
- Toutes les pages métier ont une route dédiée (28 pages).
- `RoleRoute` montre une page `AccessDeniedPage` si l'utilisateur n'a pas le rôle requis.
- Changement de mot de passe forcé à la première connexion via `mustChangePassword`.
- `ProtectedRoute` redirige vers `/change-password` si `mustChangePassword === true`.

**Anomalies :**

| # | Anomalie | Gravité |
|---|----------|---------|
| I1 | Auth routes dupliquées (chaque page d'auth crée son propre AuthLayout) — correct car chaque route déclare AuthLayout comme élément parent | Mineure |
| I2 | `NotificationsBadge` positionné dans la sidebar mais l'appel API n'est visible qu'après montage complet du layout | Mineure |
| I3 | Tooltip implémenté manuellement (portal React) — fonctionnel mais pas testé avec les lecteurs d'écran | Mineure |

**Recommandations :**
- Utiliser un provider de notifications global pour le badge (éviter le fetch tardif).
- Ajouter des attributs `aria-label` aux icônes de navigation.

---

## J. Frontend — API & State Management

**État : ⚠️ À améliorer**

**Analyse détaillée :**
- Axios configuré avec interception JWT : en-tête `Authorization: Bearer` automatique.
- Gestion des erreurs 401 : déconnexion automatique et redirection vers `/login`.
- Messages d'erreur HTTP en français (`httpErrorMessages`).
- `@tanstack/react-query` utilisé pour la gestion d'état serveur.
- `Zod` pour la validation des formulaires côté client.
- `react-hook-form` pour la gestion des formulaires.

**Anomalies :**

| # | Anomalie | Gravité |
|---|----------|---------|
| J1 | `httpErrorMessages` est un objet `const` déclaré avec `Record<number, string>` mais PAS de point-virgule après (ligne 27) — erreur de syntaxe potentielle JS (manque `;` après l'objet) | Critique |
| J2 | Aucun intercepteur de timeout global sur Axios | Mineure |
| J3 | Pas de gestion de cache react-query avancée (staleTime, gcTime par défaut) | Mineure |

**Recommandations :**
- Ajouter le point-virgule manquant dans `api.ts` ligne 27.
- Configurer un timeout global Axios (ex: 30s).
- Configurer `staleTime` et `gcTime` dans `QueryClient` par défaut.

---

## K. Campagnes & Planification

**État : ⚠️ À améliorer**

**Analyse détaillée :**
- Workflow complet de campagne : Création (BROUILLON) → Ouverture (OUVERTE) → Clôture (CLOTUREE) → Archive (ARCHIVEE).
- Une seule campagne ouverte à la fois (contrôle dans `openCampaign()`).
- Éligibilité : 12 mois d'ancienneté minimum.
- Soumission de proposition par l'employé avec analyse automatique via `PlanningEngine`.
- `updateProposalStatus()` peut créer automatiquement un `LeaveRequest` en `APPROUVE` si la proposition est acceptée avec une date.
- `getEligibleCount()` itère TOUS les employés pour compter les éligibles — pas de cache, pas d'optimisation.

**Anomalies :**

| # | Anomalie | Gravité |
|---|----------|---------|
| K1 | `getEligibleCount()` boucle sur tous les employés avec une requête asynchrone par employé (N+1 queries) | Majeure |
| K2 | `notifyEligibleEmployees()` itère aussi sur tous les employés — N+1 potentiel pour de grands effectifs | Majeure |
| K3 | `SubmitProposalDto.desiredStartDate` non validé (peut être dans le passé) | Mineure |
| K4 | `createLeaveRequestFromProposal()` cherche le type de congé annuel avec `contains: 'annuel'` — dépendant du libellé exact, fragile | Mineure |

**Recommandations :**
- Remplacer les boucles N+1 par des requêtes Prisma optimisées (agrégation avec SQL natif).
- Ajouter une validation Zod/class-validator sur `desiredStartDate` (doit être >= aujourd'hui).
- Utiliser un ID de type de congé stocké en configuration (`Setting`) plutôt qu'une recherche par nom.

---

## L. Soldes & Compteurs (Balances)

**État : ⚠️ À améliorer**

**Analyse détaillée :**
- Deux moteurs : `LeaveBalanceEngine` (strategy pattern) et `LeaveBalanceService` (CRUD + ajustements).
- Stratégies : `AnnualLeaveBalanceStrategy` (18j + bonus 2j/5ans) et `DefaultBalanceStrategy`.
- `BalanceAdjustment` avec historique complet (opération, valeurs avant/après, auteur, commentaire).
- `syncAllBalances()` au démarrage (déjà mentionné en A2).
- `initLeaveBalance()` et `initPermissionBalance()` upsert les soldes.
- La formule de calcul `available = acquired - consumed - reserved + adjusted` est correcte.
- Aucune gestion de solde négatif — si un admin ajuste à la baisse après approbation, le solde peut passer en négatif.

**Anomalies :**

| # | Anomalie | Gravité |
|---|----------|---------|
| L1 | Aucune vérification de solde négatif possible (ex: `adjustedDays` négatif) | Mineure |
| L2 | `initPermissionBalance()` prend `year` mais ne l'utilise pas pour déterminer l'année en cours | Mineure |
| L3 | `syncAllBalances()` au démarrage peut prendre plusieurs minutes pour de grands volumes | Majeure |
| L4 | `sumDurations()` dans `LeaveBalanceEngine` filtre `startDate >= startOfYear` et `endDate <= endOfYear` — les congés chevauchant plusieurs années sont mal comptabilisés | Majeure |

**Recommandations :**
- Ajouter une validation empêchant les ajustements qui rendraient le solde négatif.
- Calculer pro-rata temporis pour les congés chevauchant deux années.
- Déplacer `syncAllBalances()` vers une tâche planifiée (cron job) et/ou déclenchée manuellement.

---

## M. Événements Internes & Calendrier

**État : ⚠️ À améliorer**

**Analyse détaillée :**
- Modèle `InternalEvent` complet : type (8 valeurs), priorité (4 niveaux), statut (3 états), département optionnel, `allCompany`.
- Deux calendriers : `CalendarService` (simple) et `CalendarRhService` (avec filtres, recherche, détection de conflits).
- Détection de conflits LEAVE_EVENT et LEAVE_LEAVE correcte dans `CalendarRhService`.
- Stats du calendrier RH disponibles (`getStats`).

**Anomalies :**

| # | Anomalie | Gravité |
|---|----------|---------|
| M1 | `InternalEventsService.notifyCreated/Updated/Archived` sont des stubs vides (aucune notification DB/email) | Majeure |
| M2 | Les événements ne sont pas reportés dans le calendrier simple (`CalendarService` ne détecte pas les conflits) | Mineure |

**Recommandations :**
- Implémenter les notifications pour les événements internes (création, modification, archivage).
- Ajouter une détection de conflits basique dans `CalendarService`.

---

## N. Audit & Traçabilité

**État : ✅ Conforme**

**Analyse détaillée :**
- Modèle `AuditLog` avec action, entité, ancienne et nouvelle valeur (JSON), utilisateur, date.
- Audit présent dans la majorité des opérations CRUD (création, modification, activation/désactivation) et dans le moteur de décision.
- Actions typées : `USER_CREATED`, `DEPARTMENT_CREATED`, `LEAVE_REQUEST_APPROVED`, etc.
- `LeaveRequestHistory` et `PermissionRequestHistory` tracent les changements de statut avec commentaire.
- `BalanceAdjustment` trace les ajustements de solde.
- `ProposalAnalysisLog` trace les actions RH sur les propositions.
- `writeAuditLog()` dans `LeaveCampaignService` a son propre try/catch.

**Anomalies :**

| # | Anomalie | Gravité |
|---|----------|---------|
| N1 | `InternalEventsService.audit()` a son propre try/catch — les échecs d'audit sont silencieux | Mineure |
| N2 | `LeaveCampaignService.writeAuditLog()` a aussi un try/catch — pas idéal pour l'intégrité de la traçabilité | Mineure |
| N3 | `Notification` n'a pas de `updatedAt` (pas bloquant pour une table d'historique) | Mineure |

**Recommandations :**
- Centraliser l'audit dans un service dédié (`AuditService`) avec file d'attente pour garantir la persistance.
- Ajouter `updatedAt` à la table `Notification` pour permettre le suivi des lectures.

---

## O. Tests

**État : ❌ Non conforme**

**Analyse détaillée :**
- Un seul fichier de test unitaire : `app.controller.spec.ts` (test Hello World).
- Un seul fichier de test E2E : `app.e2e-spec.ts` (scénario basique).
- Aucun test pour :
  - Les services métier (auth, leave, permissions, notifications, etc.)
  - Les règles du moteur de décision (6 règles)
  - Les contrôleurs
  - Les guards (JwtAuthGuard, RolesGuard)
  - Les DTOs (validation class-validator)
  - Les composants frontend
- La couverture de test est quasi nulle (< 1%).

**Anomalies :**

| # | Anomalie | Gravité |
|---|----------|---------|
| O1 | Aucun test unitaire des services métier | Critique |
| O2 | Aucun test des règles du moteur de décision | Critique |
| O3 | Aucun test frontend (ni unitaire, ni d'intégration) | Critique |
| O4 | Aucune exécution automatique des tests (CI pipeline) | Majeure |

**Recommandations :**
- Écrire des tests unitaires pour chaque service (AuthService, LeaveService, PermissionsService, NotificationsService, DecisionEngineService, etc.).
- Écrire des tests unitaires pour chaque règle du moteur de décision (6 règles × scénarios).
- Écrire des tests E2E pour les workflows critiques (création congé → avis RH → décision direction).
- Ajouter des tests de validation de DTO.
- Mettre en place un pipeline CI (GitHub Actions) avec `npm run test` et `npm run lint`.

---

## P. Déploiement & Configuration

**État : ❌ Non conforme**

**Analyse détaillée :**
- Fichier `.env` versionné avec secrets en clair.
- Pas de Dockerfile pour le backend ni le frontend.
- Pas de fichier `docker-compose.yml` pour l'environnement complet.
- Pas de configuration de reverse proxy (nginx, Caddy).
- CORS dur à `http://localhost:5173` — non configurable pour la production.
- Pas de script de déploiement (shell, azd, etc.).
- Pas de configuration d'health check.
- `BASE_URL` défini dans `.env` mais non utilisé par le code (qui utilise `APP_URL`).

**Anomalies :**

| # | Anomalie | Gravité |
|---|----------|---------|
| P1 | `.env` versionné contenant des secrets (JWT_SECRET, SMTP_PASSWORD) | Critique |
| P2 | Aucune conteneurisation (Dockerfile, docker-compose) | Majeure |
| P3 | CORS dur à `localhost:5173` — inadapté pour la production | Majeure |
| P4 | Aucune configuration d'health check endpoint | Mineure |
| P5 | Pas de configuration de déploiement automatisé (CI/CD) | Majeure |

**Recommandations :**
- Ne PAS versionner le fichier `.env`. Utiliser `.env.example` comme template et charger les vrais secrets via les variables d'environnement système ou un vault.
- Créer un Dockerfile multi-stage pour le backend et un pour le frontend.
- Rendre l'URL CORS configurable via une variable d'environnement.
- Ajouter un endpoint `GET /api/v1/health` avec statut de la base de données.
- Configurer un pipeline CI/CD (GitHub Actions, Azure DevOps, etc.).

---

## Q. Performances

**État : ⚠️ À améliorer**

**Analyse détaillée :**
- `syncAllBalances()` parcourt tous les employés séquentiellement au démarrage.
- `getEligibleCount()` et `notifyEligibleEmployees()` font des boucles N+1 sur les employés.
- `WorkingDaysService.calculate()` recharge tous les jours fériés à chaque appel (pas de cache).
- Aucune pagination sur les endpoints de liste (employés, utilisateurs, permissions, événements).
- `DashboardService` fait plusieurs requêtes indépendantes mais en parallèle (Promise.all).
- `getAdminUserIds()`, `getHrUserIds()`, `getDirectorUserIds()` sont appelés à chaque notification sans cache.

**Anomalies :**

| # | Anomalie | Gravité |
|---|----------|---------|
| Q1 | `syncAllBalances()` synchrone et séquentielle au démarrage | Majeure |
| Q2 | Boucles N+1 dans `getEligibleCount()`, `notifyEligibleEmployees()` | Majeure |
| Q3 | Aucun cache des jours fériés dans `WorkingDaysService` | Mineure |
| Q4 | Aucune pagination sur la plupart des endpoints de liste | Majeure |
| Q5 | Requêtes utilisateurs récurrentes sans cache dans `NotificationsService` | Mineure |

**Recommandations :**
- Utiliser des requêtes agrégées Prisma (SQL natif ou `groupBy`) au lieu de boucles.
- Ajouter un cache in-memory (ex: `node-cache`) pour les jours fériés et les utilisateurs par rôle, avec TTL court.
- Ajouter la pagination sur tous les endpoints de liste (`page`, `pageSize`).
- Remplacer `syncAllBalances()` par une tâche cron (`@nestjs/schedule`) en dehors des heures de pointe.

---

## R. Maintenance & Extensibilité

**État : ✅ Conforme**

**Analyse détaillée :**
- Code propre et lisible, conventions NestJS respectées.
- Décorateurs personnalisés (`@CurrentUser()`, `@Roles()`) bien implémentés.
- Strategy pattern pour le moteur de décision — facile d'ajouter une règle.
- Strategy pattern pour le calcul des soldes — facile d'ajouter une stratégie.
- Interface `NotificationChannel` — facile d'ajouter un canal (ex: SMS, Slack).
- Templates d'email séparés par template — facile d'en ajouter.
- Zod schemas côté frontend bien séparés.
- Configuration branding externalisée (`branding.ts`).

**Anomalies :** Aucune anomalie détectée.

---

## S. Gestion des Erreurs & Résilience

**État : ✅ Conforme**

**Analyse détaillée :**
- ValidationPipe global avec `whitelist: true`, `transform: true`, `forbidNonWhitelisted: true`.
- Exceptions métier correctement typées (NotFoundException, BadRequestException, UnauthorizedException, ConflictException).
- Transactions Prisma utilisées pour les opérations critiques.
- `MailChannel` avec try/catch par destinataire — résilience SMTP.
- `sendMail()` ne re-throw pas — validé fonctionnellement.
- `DecisionEngineService.analyze()` catch les erreurs de règles individuellement.
- `LeaveCampaignService.notifyEligibleEmployees()` et `notifyClosureToParticipants()` avec catch (fire-and-forget).

**Anomalies :** Aucune anomalie détectée.

---

## Synthèse générale

### Statistiques

| Section | État | Anomalies |
|---------|------|-----------|
| A. Architecture & Structure | ⚠️ À améliorer | 3 (0C, 2M, 1m) |
| B. Authentification & Autorisation | ⚠️ À améliorer | 6 (1C, 3M, 2m) |
| C. Gestion des Congés | ⚠️ À améliorer | 5 (0C, 2M, 3m) |
| D. Gestion des Permissions | ✅ Conforme | 1 (0C, 0M, 1m) |
| E. Moteur de Décision | ⚠️ À améliorer | 5 (3C, 1M, 1m) |
| F. Notifications & Email | ✅ Conforme | 4 (0C, 2M, 2m) |
| G. Base de Données & Prisma | ✅ Conforme | 2 (0C, 0M, 2m) |
| H. Sécurité | ❌ Non conforme | 6 (3C, 2M, 1m) |
| I. Frontend — Routing & UI | ✅ Conforme | 3 (0C, 0M, 3m) |
| J. Frontend — API & State | ⚠️ À améliorer | 3 (1C, 0M, 2m) |
| K. Campagnes & Planification | ⚠️ À améliorer | 4 (0C, 2M, 2m) |
| L. Soldes & Compteurs | ⚠️ À améliorer | 4 (0C, 2M, 2m) |
| M. Événements & Calendrier | ⚠️ À améliorer | 2 (0C, 1M, 1m) |
| N. Audit & Traçabilité | ✅ Conforme | 3 (0C, 0M, 3m) |
| O. Tests | ❌ Non conforme | 4 (3C, 1M, 0m) |
| P. Déploiement & Configuration | ❌ Non conforme | 5 (1C, 3M, 1m) |
| Q. Performances | ⚠️ À améliorer | 5 (0C, 3M, 2m) |
| R. Maintenance & Extensibilité | ✅ Conforme | 0 |
| S. Gestion des Erreurs & Résilience | ✅ Conforme | 0 |

**Total anomalies :** 65  
- **Critiques :** 12  
- **Majeures :** 24  
- **Mineures :** 29  

### Points forts
- Architecture modulaire NestJS bien structurée (20 modules métier)
- Workflow congés + permissions complet avec historique et traçabilité
- Moteur de décision paramétrable (6 règles, strategy pattern)
- Double canal de notification (DB + Email) avec résilience SMTP
- Gestion des soldes avec stratégies différenciées et historique d'ajustements
- Détection de conflits (département, événements internes)
- Validation des entrées rigoureuse (ValidationPipe, Zod, class-validator)
- Dark/Light mode, responsive layout, navigation par rôles
- Templates email professionnels en Handlebars

### Points faibles
- **Absence quasi totale de tests** (1 test unitaire, 1 test E2E)
- **Secrets en clair dans le dépôt Git** (JWT_SECRET, SMTP_PASSWORD)
- **Aucune protection contre le brute force** (rate limiting absent)
- **Anomalies critiques dans le moteur de décision** (statuts et champs inexistants dans 2 règles)
- **Sync totale des soldes au démarrage** (N+1 queries, pas de pagination)
- **Aucune conteneurisation** (pas de Dockerfile)
- **Division par zéro potentielle** dans le moteur de décision

### Risques restants
1. **Sécurité :** L'exposition des secrets dans le dépôt Git est le risque le plus immédiat. En l'état, un attaquant ayant accès au dépôt peut forger des tokens JWT valides et envoyer des emails frauduleux.
2. **Fiabilité :** Les règles du moteur de décision E1 et E2 produisent des résultats incorrects (statuts inexistants) — l'analyse de décision peut être faussement rassurante ou faussement alarmiste.
3. **Disponibilité :** `syncAllBalances()` au démarrage peut retarder le déploiement de plusieurs minutes pour des effectifs de 500+ employés.
4. **Maintenabilité :** L'absence de tests rend chaque modification risquée (pas de filet de sécurité).
5. **Dé consistance des données :** Les congés chevauchant deux années sont mal comptabilisés (L4).

### Note sur 100

| Domaine | Note pondérée |
|---------|---------------|
| Architecture (10%) | 7/10 |
| Sécurité (20%) | 3/10 |
| Fonctionnalités métier (25%) | 8/10 |
| Qualité du code & tests (20%) | 3/10 |
| Déploiement & DevOps (10%) | 3/10 |
| Frontend & UX (10%) | 8/10 |
| Performance (5%) | 5/10 |

**Note moyenne pondérée : 53/100**

### Verdict final

**Prêt pour la soutenance avec réserves majeures**

L'application couvre l'ensemble du périmètre fonctionnel demandé (gestion des congés, permissions, campagnes, planification, soldes, moteur de décision, notifications email, calendriers, audit). Les workflows métier sont complets et opérationnels.

Cependant, 12 anomalies critiques doivent être corrigées avant une mise en production, notamment :
1. Remplacer le JWT_SECRET faible et supprimer les secrets du .env versionné
2. Ajouter un rate limiting sur les endpoints d'authentification
3. Corriger les statuts et champs inexistants dans `ReplacementAvailabilityRule` (E1, E2)
4. Protéger contre la division par zéro dans le moteur de décision (E5)
5. Écrire les tests manquants (au minimum pour les services critiques et les règles)
6. Corriger la syntaxe dans `api.ts` (J1)
7. Dockeriser l'application pour la production

La soutenance est envisageable si l'auditoire comprend qu'il s'agit d'une version de démonstration/validation. **Non recommandé pour un déploiement en production sans les corrections critiques.**
