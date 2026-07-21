# RAPPORT D'AUDIT COMPLET — Gestion des Congés SIAP PHARMA

**Date :** 20 juillet 2026  
**Portée :** Application complète (backend NestJS + frontend React/TypeScript)  
**Contexte :** Audit pré-livraison / présoutenance

---

## TABLE DES MATIÈRES

- [A. Authentification et Sécurité](#a-authentification-et-sécurité)
- [B. Gestion des Utilisateurs](#b-gestion-des-utilisateurs)
- [C. Employés](#c-employés)
- [D. Départements](#d-départements)
- [E. Postes](#e-postes)
- [F. Types de Congés](#f-types-de-congés)
- [G. Soldes](#g-soldes)
- [H. Demandes de Congés](#h-demandes-de-congés)
- [I. Permissions](#i-permissions)
- [J. Campagnes Annuelles](#j-campagnes-annuelles)
- [K. Calendrier RH](#k-calendrier-rh)
- [L. Moteur Intelligent](#l-moteur-intelligent)
- [M. Notifications](#m-notifications)
- [N. Journal d'Audit](#n-journal-daudit)
- [O. Interface Utilisateur](#o-interface-utilisateur)
- [P. Performances](#p-performances)
- [Q. Qualité du Code](#q-qualité-du-code)
- [R. Cas Limites](#r-cas-limites)
- [S. Cohérence Globale](#s-cohérence-globale)
- [T. Préparation de la Soutenance](#t-préparation-de-la-soutenance)

---

## A. AUTHENTIFICATION ET SÉCURITÉ

### A.1 Connexion / Déconnexion
- **Connexion** : `POST /api/v1/auth/login` — public, sans rate limiting, sans CAPTCHA. L'authentification est stateless (JWT).
- **Déconnexion** : Côté frontend uniquement (suppression du token du localStorage). Aucun endpoint backend d'invalidation de session.
- **Verdict** : ✅ Fonctionnel. ❌ Aucune révocation possible des tokens côté serveur.

### A.2 Expiration JWT
- Durée de vie : 1 jour (`JWT_EXPIRES_IN=1d` dans `.env`).
- `ignoreExpiration: false` dans la stratégie JWT — les tokens expirés sont rejetés.
- **Verdict** : ✅ Correct.

### A.3 Rafraîchissement des tokens
- **Aucun mécanisme de refresh token** dans toute l'application.
- Un seul `access_token` JWT avec 1 jour de validité. Après expiration, l'utilisateur est redirigé vers `/login`.
- **Verdict** : ❌ **Absence critique** — après 1 jour, tous les utilisateurs doivent se reconnecter.

### A.4 Mot de passe oublié / OTP
- **ForgotPassword** (`POST /auth/forgot-password`) : Génère un OTP avec `Math.random()` (**non cryptographique** — `auth.service.ts:157`). L'OTP est stocké **en clair** en base (`auth.service.ts:163`). Taux de limitation : 3 requêtes max par fenêtre de 15 minutes.
- **VerifyOTP** (`POST /auth/verify-otp`) : **Aucun rate limiting** sur la vérification. Un attaquant peut tenter les 1 000 000 combinaisons sans restriction avant l'expiration de l'OTP (10 min).
- **Enumération d'utilisateurs** : `forgot-password` retourne `NotFoundException` si l'email n'existe pas (`auth.service.ts:127-130`).
- **Verdict** : 🔴 **CRITIQUE** — OTP non cryptographique, stocké en clair, sans rate limiting sur la vérification, avec fuite d'information par énumération.

### A.5 Premier mot de passe
- `mustChangePassword: true` défini à la création. Le frontend redirige vers `/change-password`.
- Mais **aucune vérification côté backend** — un utilisateur avec `mustChangePassword=true` peut accéder à tous les endpoints protégés sans changer son mot de passe.
- **Verdict** : ⚠️ Le flag est présent mais non enforce côté backend.

### A.6 Changement de mot de passe
- `POST /auth/change-password` (protégé JWT). Vérifie l'ancien mot de passe, applique `validatePasswordStrength()` (8+ chars, 1 majuscule, 1 minuscule, 1 chiffre — mais **aucun caractère spécial requis**).
- **Verdict** : ✅ Fonctionnel, mais politique de mot de passe perfectible (pas de caractère spécial).

### A.7 Utilisateurs désactivés
- `isActive: false` bloque la connexion (`auth.service.ts:34-38`).
- La stratégie JWT vérifie `user.isActive` à chaque requête (`jwt.strategy.ts:22`). ✅
- **Verdict** : ✅ Correct.

### A.8 Utilisateurs supprimés
- Suppression physique (hard delete). Après suppression, `findUnique` retourne `null` → accès refusé.
- Mais le JWT existant reste valide jusqu'à expiration (1 jour max). **Aucune blacklist de tokens**.
- **Verdict** : ⚠️ Partiellement correct — suppression efficace mais JWT orphelin possible.

### A.9 Contrôle des rôles
- `RolesGuard` combiné avec `@Roles()` sur chaque endpoint. Vérifie `user.role?.name` depuis la requête. Fails closed si rôle manquant.
- **Verdict** : ✅ Correct et cohérent.

### A.10 Contrôle des permissions
- Basé sur le rôle uniquement (RBAC simple). Pas de permissions granulaires par ressource.
- **Verdict** : ✅ Satisfaisant pour le périmètre fonctionnel.

### A.11 Routes protégées
- Backend : JwtAuthGuard + RolesGuard sur tous les endpoints sensibles.
- Frontend : ProtectedRoute + RoleRoute. ✅
- **Verdict** : ✅ Correct.

### A.12 Validation des entrées
- `ValidationPipe` global avec `whitelist: true`, `transform: true`, `forbidNonWhitelisted: true` (`main.ts:14-20`). ✅
- DTOs utilisant `class-validator` avec des décorateurs. ⚠️ Incohérence de `MinLength(1)` vs `MinLength(6)` vs `validatePasswordStrength()` (8).
- **Verdict** : ✅ Globalement bon, quelques incohérences mineures.

### A.13 Protection contre les injections
- Prisma ORM — toutes les requêtes SQL sont paramétrées. ✅
- **Verdict** : ✅ Protégé.

### A.14 Protection XSS
- **Aucun middleware Helmet** — pas de CSP, X-Frame-Options, X-Content-Type-Options.
- Les templates Handlebars utilisent le triple moustache `{{{body}}}` dans `layout.hbs:115` qui **n'échappe PAS le HTML**. Risque XSS potentiel.
- **Verdict** : ❌ Absence de Helmet + output non échappé dans le template email.

### A.15 Protection CSRF
- L'authentification est basée sur le header `Authorization: Bearer <token>` (pas de cookie). Les navigateurs n'envoient pas automatiquement ce header cross-origin.
- **Verdict** : ✅ Atténué par l'architecture JWT.

### A.16 Gestion CORS
- `app.enableCors({ origin: 'http://localhost:5173', credentials: true })` dans `main.ts:23-26`.
- **Verdict** : ⚠️ Uniquement configuré pour le développement local.

### Synthèse Sécurité

| Criticité | Nombre | Détails |
|-----------|--------|---------|
| 🔴 Critique | 4 | OTP non cryptographique (`Math.random()`), stocké en clair, pas de rate limiting sur verifyOTP, JWT_SECRET par défaut dans le code source |
| 🟠 Haute | 5 | Pas de refresh token, pas de Helmet, pas de rate limiting sur les endpoints publics, `.env` commité dans le repo, JWT non révocable |
| 🟡 Moyenne | 3 | Énumération d'utilisateurs (forgot-password), CORS hardcodé pour dev, mustChangePassword non enforce backend |
| 🟢 Basse | 2 | Pas de caractère spécial requis pour le mot de passe, bcrypt à 10 rounds (minimum acceptable en 2026) |

---

## B. GESTION DES UTILISATEURS

### B.1 Création
- `POST /api/v1/users` (ADMIN) — crée l'utilisateur + notification `USER_CREATED` + email aux admins. Vérification : `bcrypt.hash(password, 10)`, `mustChangePassword: true`, création conditionnelle d'un employé (si rôle ≠ ADMIN et departmentId fourni).
- **Verdict** : ✅ Correct.

### B.2 Modification
- `PATCH /api/v1/users/:id` (ADMIN) — champs éditables : email, firstName, lastName, gender, roleId, isActive. Pas de champ `password` (géré par auth).
- **Verdict** : ✅ Correct.

### B.3 Activation / Désactivation
- Via `PATCH /users/:id { isActive: boolean }`. Auto-désactivation interdite. Notifications `USER_ACTIVATED` / `USER_DEACTIVATED` aux admins + email. ❌ **Aucun cascade vers l'employé** — l'enregistrement Employee reste actif.
- **Verdict** : ⚠️ Pas de cascade vers Employee.

### B.4 Recherche
- **Aucun paramètre de recherche ou de filtre** (email, nom, rôle, statut). La méthode `findAll()` retourne tous les utilisateurs sans `skip`/`take`.
- **Verdict** : ❌ Pas de pagination, pas de recherche.

### B.5 Pagination
- Absente de tous les endpoints utilisateurs.
- **Verdict** : ❌ Impossible à utiliser avec > 100 utilisateurs.

### B.6 Validations
- DTO : `@IsEmail()`, `@Matches(namePattern)` pour firstName/lastName (lettres uniquement, max 10 caractères), `@IsIn(['Homme', 'Femme'])`. ✅
- **Verdict** : ✅ Bonnes validations.

### B.7 Notifications
- `USER_CREATED`, `USER_ACTIVATED`, `USER_DEACTIVATED` → tous dans `EMAIL_TYPES` → notification DB + email aux admins. ✅
- `USER_MODIFIED` → **PAS** dans `EMAIL_TYPES` → notification DB uniquement. ✅ (Par conception)
- **Verdict** : ✅ Correct.

### B.8 E-mails
- Les emails sont envoyés via `MailChannel` → `MailService`. Pour `USER_CREATED`, le message de notification est envoyé aux admins. **Aucun email de bienvenue n'est envoyé au nouvel utilisateur** (`sendWelcomeEmail()` existe mais n'est jamais appelé).
- **Verdict** : ⚠️ L'utilisateur créé ne reçoit jamais ses identifiants par email.

### B.9 Journal d'audit
- `USER_CREATED`, `USER_MODIFIED`/`ACTIVATED`/`DEACTIVATED`, `USER_DELETED` — tous enregistrés avec `oldValue`/`newValue` en JSON. ✅
- **Verdict** : ✅ Satisfaisant.

### B.10 Cohérence avec les employés
- La mise à jour du nom/prénom dans User **synchronise** Employee (users.service.ts:248-256). ✅
- La désactivation de User **ne désactive pas** Employee. ⚠️
- **Verdict** : ⚠️ Synchronisation partielle.

---

## C. EMPLOYÉS

### C.1 Création
- `POST /api/v1/employees` (ADMIN, HR) — crée User + Employee en transaction. Génère matricule, notification `EMPLOYEE_CREATED`.
- **Verdict** : ✅ Correct.

### C.2 Modification
- `PATCH /api/v1/employees/:id` (ADMIN, HR) — synchronise le prénom/nom vers User, peut changer le rôle (roleId). Gère le changement de département/département avec cascade sur poste.
- **Verdict** : ✅ Correct.

### C.3 Désactivation
- **Pas de champ `isActive`** sur Employee. Seul le User peut être désactivé.
- **Verdict** : ⚠️ Pas de désactivation indépendante de l'employé.

### C.4 Rattachement utilisateur
- Relation 1:1 via `userId`. Création simultanée User + Employee. ✅
- **Verdict** : ✅ Correct.

### C.5 Département
- `departmentId` requis. Vérification d'existence + rattachement. ✅
- **Verdict** : ✅ Correct.

### C.6 Poste
- `positionId` optionnel. Vérification d'appartenance au département. ✅
- **Verdict** : ✅ Correct.

### C.7 Compétences
- `POST /employees/:id/skills` — remplacement complet (pas d'ajout incrémental).
- **Verdict** : ⚠️ Stratégie "replace all" sans validation DTO des skillIds.

### C.8 Remplaçants
- `GET/POST /employees/:id/replacements` — gestion complète avec `confidence`, auto-exclusion de soi-même. Endpoint `eligible-replacements` (même `positionId`). ✅
- **Verdict** : ✅ Correct.

### C.9 Validations
- `@IsDateString()` + `validateHireDate()` (pas dans le futur, pas avant 1900). ✅
- **Verdict** : ✅ Satisfaisant.

### C.10 Recherche
- **Aucun paramètre de filtre** (nom, département, matricule, poste).
- **Verdict** : ❌ Pas de recherche.

### C.11 Pagination
- Absente — retourne tous les employés. ❌
- **Verdict** : ❌ Pas de pagination.

### C.12 Statistiques
- **Aucun endpoint de statistiques** (comptes par département, actifs/inactifs, etc.).
- **Verdict** : ❌ Manquant.

---

## D. DÉPARTEMENTS

### D.1 CRUD complet
- `POST/GET/:id/PATCH/DELETE /api/v1/departments` (ADMIN pour écritures, tous pour lectures). ✅
- **Verdict** : ✅ Correct.

### D.2 Effectif minimum (`minEmployees`)
- Stocké mais **aucune enforcement métier** dans le module. Utilisé uniquement par le moteur de décision (operational-risk.rule.ts) pour évaluer le risque des congés.
- **Verdict** : ⚠️ Champ présent, logique uniquement dans le moteur intelligent.

### D.3 Statistiques
- **Aucun endpoint de statistiques**. ❌
- **Verdict** : ❌ Manquant.

### D.4 Désactivation
- `isActive: false` via PATCH. Aucun cascade vers les postes ou employés. Les employés/postes restent rattachés au département désactivé.
- **Verdict** : ⚠️ Pas de cascade.

### D.5 Impact sur les postes
- La création d'un poste est bloquée si le département est inactif (positions.service.ts:31). ✅
- La désactivation d'un département ne désactive pas les postes. ⚠️
- **Verdict** : ⚠️ Protection partielle.

### D.6 Impact sur les employés
- Aucun impact direct. Les employés restent dans un département désactivé.
- **Verdict** : ⚠️ Pas de cascade.

### D.7 Moteur intelligent
- `minEmployees` est lu par la règle `operational-risk.rule.ts:52` pour évaluer le risque de sous-effectif.
- **Verdict** : ✅ Intégration correcte.

---

## E. POSTES

### E.1 CRUD
- `POST/GET/:id/PATCH/DELETE /api/v1/positions` (ADMIN pour écritures). Endpoint dédié `GET /positions/active`. ✅
- **Verdict** : ✅ Correct.

### E.2 Poste critique (`isCritical`)
- Stocké, utilisé uniquement par le moteur de décision. ✅
- **Verdict** : ✅ Correct.

### E.3 Remplaçable (`canBeReplaced`)
- Stocké, utilisé par la règle `operational-risk.rule.ts:97` (pénalité si non remplaçable). ✅
- **Verdict** : ✅ Correct.

### E.4 Désactivation
- Via `PATCH /positions/:id { isActive: false }`. Aucun cascade vers les employés.
- **Verdict** : ⚠️ Pas de cascade.

### E.5 Suppression
- Bloquée si des employés sont rattachés (ConflictException). ✅
- **Verdict** : ✅ Correct.

### E.6 Impact sur les employés
- Les employés conservent leur `positionId` même si le poste est désactivé.
- **Verdict** : ⚠️ Absence de mise à jour lors de la désactivation.

---

## F. TYPES DE CONGÉS

### F.1 CRUD
- **⚠️ DOUBLON CRITIQUE** : Deux ensembles d'endpoints existent :
  - `/api/v1/leave-types/…` (LeaveTypesController, module dédié) — avec notification
  - `/api/v1/leave/types/…` (LeaveController, module legacy) — sans notification, logique plus simple
- Les deux implémentations divergent. Le module `leave-types` est plus complet.
- **Verdict** : 🔴 **Critique** — duplication fonctionnelle avec comportements différents.

### F.2 Création / Modification
- DTO : `name`, `description`, `defaultDays`, `requiresRhValidation`, `requiresDirectorValidation`, `requiresJustification`, `deductsFromAnnualBalance`, `maxDuration`, `minDuration`, `color`, `icon`, `isActive`.
- **Verdict** : ✅ Satisfaisant.

### F.3 Validations
- `name` : `@MinLength(2) @MaxLength(100)`. ✅
- `color` : **Aucune validation de format** (n'importe quel string accepté). ❌
- `icon` : **Aucune validation de format**. ❌
- `minDuration` / `maxDuration` : **Aucune validation croisée** (`min > max` possible). ❌
- **Verdict** : ⚠️ Validations incomplètes.

### F.4 Durée minimale
- Vérifiée lors de la création d'une demande (`leave.service.ts:167-171`). ❌ Calcul basé sur `86400000` (non DST-safe, mais acceptable).
- **Verdict** : ✅ Correct.

### F.5 Durée maximale
- Vérifiée avec `Math.ceil((end - start) / 86400000) + 1`. ✅
- **Verdict** : ✅ Correct.

### F.6 Couleur
- Stockée dans la base, retournée au frontend pour le calendrier. **Aucune validation de format hexadécimal**.
- **Verdict** : ⚠️ Absence de validation.

### F.7 Icône
- Stockée mais jamais validée de format.
- **Verdict** : ⚠️ Absence de validation.

### F.8 Workflow RH
- `requiresRhValidation` — si true, la demande passe en `EN_ATTENTE_RH` à la création. ✅
- **Verdict** : ✅ Correct.

### F.9 Workflow Direction
- `requiresDirectorValidation` — si le type nécessite validation RH + Direction, le workflow complet est : `EN_ATTENTE_RH → AVIS_RH_RENDU → EN_ATTENTE_DIRECTION → APPROUVE/REFUSE`.
- **Verdict** : ✅ Correct.

---

## G. SOLDES

### G.1 Calcul
- Formule : `totalDays + adjustedDays - usedDays - pendingDays` (`leave-balances.service.ts:97`). ✅
- **Verdict** : ✅ Correct.

### G.2 Ajustements
- `POST /leave-balances/:id/adjust` (ADMIN). `delta` peut être positif ou négatif. **Aucune vérification de plancher** → un solde peut devenir négatif. ❌
- **Verdict** : ⚠️ Pas de protection de plancher négatif.

### G.3 Consommation
- `pendingDays` incrémenté à la création, décrémenté à l'annulation ou à la décision. `usedDays` incrémenté à l'approbation. ✅
- **Verdict** : ✅ Correct.

### G.4 Recalcul
- `LeaveBalanceEngineService.onApplicationBootstrap()` recalcule tous les soldes **à chaque démarrage de l'application**. Stratégies : `default` (defaultDays), `annual/annuel/congé annuel` (18 jours + bonus d'ancienneté, **ignorant** `defaultDays`).
- **⚠ Le recalcul annuel ignore `defaultDays`** et utilise 18 jours hardcodés (annual-leave-balance.strategy.ts:18). Incohérence avec `initLeaveBalance()` qui utilise `leaveType.defaultDays`.
- **Verdict** : 🔴 **Critique** — incohérence entre initialisation et recalcul annuel.

### G.5 Cohérence annuelle
- Les congés chevauchant deux années (25 déc → 5 jan) sont **exclus des deux années** par le filtre `sumDurations()` du moteur de calcul (`leave-balance-engine.service.ts:188-195`). ❌
- **Aucun mécanisme de report des jours non pris** d'une année à l'autre. ❌
- **Verdict** : ❌ Problèmes de cohérence annuelle.

---

## H. DEMANDES DE CONGÉS

### H.1 Workflow complet
- `EN_ATTENTE_RH → AVIS_RH_RENDU → EN_ATTENTE_DIRECTION → APPROUVE/REFUSE` ✅
- **Verdict** : ✅ Correct.

### H.2 RH
- Avis RH : `PATCH /leave/requests/:id/hr-review` (HR, ADMIN). Statut requis : `EN_ATTENTE_RH`. ✅
- **Verdict** : ✅ Correct.

### H.3 Direction
- Décision : `PATCH /leave/requests/:id/decide` (DIRECTOR, ADMIN). Statut requis : `EN_ATTENTE_DIRECTION`. Non-bloquant : l'analyse du moteur intelligent n'empêche pas la décision. ✅
- **Verdict** : ✅ Correct.

### H.4 Historique
- `LeaveRequestHistory` enregistré à chaque transition de statut. ✅
- **Verdict** : ✅ Correct.

### H.5 Notifications
- Toutes les étapes produisent des notifications. Types : `LEAVE_CREATED`, `LEAVE_RH_REVIEWED`, `LEAVE_TRANSMITTED`, `LEAVE_DECIDED`, `LEAVE_CANCELLED`. ✅
- **Verdict** : ✅ Correct.

### H.6 E-mails
- Tous les types de notification de congé sont dans `EMAIL_TYPES` → emails envoyés. ✅
- **Verdict** : ✅ Correct.

### H.7 Recalcul des soldes
- `pendingDays` mis à jour à chaque étape. Création de `BalanceAdjustment` lors de l'approbation (`DEDUCTION_CONGES`). ✅
- **Verdict** : ✅ Correct.

### H.8 Calendrier RH
- Les congés approuvés/pending sont visibles dans le calendrier RH. ✅
- **Verdict** : ✅ Correct.

### H.9 Moteur intelligent
- Analyse déclenchée lors de la décision direction (non bloquante, uniquement pour les types avec `deductsFromAnnualBalance`). ✅
- **Verdict** : ✅ Correct.

---

## I. PERMISSIONS

### I.1 Workflow complet
- Même workflow que les congés : `EN_ATTENTE_RH → AVIS_RH_RENDU → EN_ATTENTE_DIRECTION → APPROUVE/REFUSE`. ✅
- **Verdict** : ✅ Correct.

### I.2 Annulation — Bug d'historique
- `permissions.service.ts:427` : L'historique enregistre `'ANNULEE'` (avec un 'E' final) au lieu de `'ANNULE'` (valeur de l'enum Prisma). Incohérence avec le statut réel stocké dans `PermissionRequest.status`.
- **Verdict** : 🔴 **Bug** — valeur incohérente dans l'historique.

### I.3 Annulation — Audit manquant
- `cancelRequest()` n'appelle PAS `recordAuditLog()`. Aucune trace d'audit pour l'annulation.
- **Verdict** : 🔴 **Bug** — audit manquant.

### I.4 Annulation — Garde d'accès incohérente
- Le contrôleur autorise `@Roles('EMPLOYEE', 'HR', 'ADMIN')` mais le service vérifie l'appartenance (`request.employeeId === employeeId`). HR/ADMIN ne peuvent en réalité annuler que leurs propres demandes.
- **Verdict** : ⚠️ Incohérence guard / logique métier.

### I.5 Historique
- `PermissionRequestHistory` enregistré à chaque transition. ✅
- **Verdict** : ✅ Correct.

### I.6 Notifications
- Types : `PERMISSION_CREATED`, `PERMISSION_RH_REVIEWED`, `PERMISSION_TRANSMITTED`, `PERMISSION_DECIDED`, `PERMISSION_CANCELLED`. Tous dans `EMAIL_TYPES`. ✅
- **Verdict** : ✅ Correct.

### I.7 E-mails
- Tous les types déclenchent des emails. ✅
- **Verdict** : ✅ Correct.

### I.8 Recalcul des soldes
- `PermissionBalance` : `pendingDays -= duration` (avec `Math.max(0, ...)` comme filet de sécurité). ❌ Pas de création de `BalanceAdjustment`. Pas de vérification préalable `pendingDays >= duration` (contrairement aux congés).
- **Verdict** : ⚠️ Filet de sécurité moins robuste que les congés.

### I.9 Différences avec les congés
| Aspect | Congés | Permissions |
|--------|--------|-------------|
| Table de soldes | `LeaveBalance` (par type) | `PermissionBalance` (global) |
| Planning annuel requis | Oui | Non |
| Annulation possible depuis | `EN_ATTENTE_RH`, `BROUILLON` | `EN_ATTENTE_RH`, `AVIS_RH_RENDU`, `EN_ATTENTE_DIRECTION` |
| Moteur intelligent | Oui | Non |
| `BalanceAdjustment` | Oui | Non |
| `recordAuditLog` sur annulation | Oui | Non |
| Statut historique sur annulation | `ANNULE` | `ANNULEE` (bug) |

---

## J. CAMPAGNES ANNUELLES

### J.1 Ouverture
- `PATCH /leave-campaigns/:id/open` (ADMIN, HR). Vérifie : statut `BROUILLON`, pas d'autre campagne ouverte simultanément. ✅
- Notification fire-and-forget aux employés éligibles. ✅
- **Verdict** : ✅ Correct.

### J.2 Fermeture
- `PATCH /leave-campaigns/:id/close`. Statut requis : `OUVERTE`. ✅
- **Verdict** : ✅ Correct.

### J.3 Propositions
- Soumission (`POST /leave-campaigns/my/proposal`) : vérifie éligibilité, unicité, campagne ouverte. Durée auto-calculée depuis le solde si non fournie. ✅
- Statuts : `RECUE → EN_ANALYSE → ACCEPTEE/REPROGRAMMEE/REFUSEE`. ⚠️ **Aucune validation des transitions** — tout vers tout possible.
- **Verdict** : ✅ Correct, ⚠️ transitions non validées.

### J.4 Analyse
- Analyse du `LeavePlanningEngine` déclenchée en fire-and-forget après soumission. ✅
- **Verdict** : ✅ Correct.

### J.5 Notifications
- `CAMPAIGN_OPENED`, `PROPOSAL_SUBMITTED` dans `EMAIL_TYPES`. ✅
- Notifications de clôture, modification, acceptation — également envoyées. ✅
- **Verdict** : ✅ Correct.

### J.6 E-mails
- `CAMPAIGN_OPENED` → email aux employés éligibles. ✅
- **Verdict** : ✅ Correct.

### J.7 Éligibilité
- `isEligible()` : `hireDate + 12 mois`, actif, non ADMIN. ⚠️ **Requête N+1** : pour chaque employé, une requête DB individuelle.
- **Verdict** : ✅ Logique correcte, ⚠️ performance N+1.

---

## K. CALENDRIER RH

### K.1 Jours fériés
- CRUD complet. Notification `HOLIDAY_ADDED`. ✅
- **Aucun audit log** dans holidays.service.ts. ❌
- **Verdict** : ✅ Fonctionnel, ⚠️ audit manquant.

### K.2 Événements internes
- CRUD avec soft delete (archive). Filtres : année, type, priorité, statut, département, recherche.
- **Aucune validation `endDate >= startDate`**. ❌
- **Notifications stubs** : `notifyCreated`/`notifyUpdated`/`notifyArchived` ne font que logger (TODO commenté). ❌
- **Verdict** : ⚠️ Plusieurs manques.

### K.3 Congés
- Visibles dans le calendrier RH avec les couleurs des types de congés. ✅
- **Verdict** : ✅ Correct.

### K.4 Permissions
- Visibles dans le calendrier ("permission" dans leaveType). ✅
- **Verdict** : ✅ Correct.

### K.5 Conflits
- Détection automatique : `LEAVE_EVENT` et `LEAVE_LEAVE` avec niveaux de sévérité. ⚠️ Détection `LEAVE_LEAVE` en O(n²).
- **Verdict** : ✅ Fonctionnel, ⚠️ performance quadratique.

### K.6 Affichage
- Recherche post-filtre (fetch tous les mois, puis filtre en mémoire). ⚠️ Inefficace pour grands volumes.
- **Verdict** : ⚠️ Filtrage en mémoire.

---

## L. MOTEUR INTELLIGENT

### L.1 Calcul du score
- 6 règles pondérées : conflit département (25), conflit événement (25), solde suffisant (30), validation campagne (20), risque opérationnel (30), disponibilité remplaçant (20). Score = `(somme scores / somme poids) × 100`.
- **Verdict** : ✅ Architecture extensible.

### L.2 Règles
| Règle | Poids | Logique |
|-------|-------|---------|
| `department_conflict` | 25 | -5 par chevauchement (min 0) |
| `internal_event_conflict` | 25 | 0 si événement CRITIQUE ou HAUTE |
| `balance_sufficiency` | 30 | 0 si solde insuffisant |
| `campaign_validation` | 20 | 5 si pas de planning annuel |
| `operational_risk` | 30 | -15 si sous-effectif, -10 si poste critique sans remplaçant |
| `replacement_availability` | 20 | 5 si pas de remplaçant disponible |

- **Verdict** : ✅ Règles pertinentes et pondérées.

### L.3 Conflits
- Détecte les chevauchements de congés dans le même département (department-conflict.rule.ts). ✅
- **Verdict** : ✅ Correct.

### L.4 Effectif minimum
- Vérifie `department.minEmployees` contre le nombre d'employés non absents. Pénalité de 15 points si en dessous. ✅
- **Verdict** : ✅ Correct.

### L.5 Postes critiques
- Vérifie si le poste de l'employé est marqué `isCritical`. Si oui, vérifie les absences simultanées. Pénalité de 10 points. ✅
- **Verdict** : ✅ Correct.

### L.6 Remplaçants
- Vérifie la disponibilité des remplaçants configurés, leur niveau de compétence, leur département, et la confiance. Score basé sur le meilleur remplaçant disponible. ✅
- **Verdict** : ✅ Correct.

### L.7 Suggestions
- Les suggestions sont stockées dans `DecisionAnalysis` mais le service ne fournit pas de suggestions textuelles explicites — uniquement un score. ⚠️
- **Verdict** : ⚠️ Pas de suggestions exploitables directement.

### L.8 Alertes
- Seuil de 50 dans `leave.service.ts:508` : `if (analysis.score < 50)` → alerte envoyée. **Mais aucune logique de seuil dans le moteur lui-même** — c'est le module congé qui implémente le seuil.
- **Verdict** : ⚠️ Seuil implémenté dans le consommateur, pas dans le moteur.

---

## M. NOTIFICATIONS

### M.1 Notifications internes
- `DatabaseChannel` : écriture via `prisma.notification.createMany()`. ❌ Aucune gestion d'erreur.
- Controller : `GET /notifications`, `GET /notifications/unread/count`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`. ✅
- **Verdict** : ✅ Correct, ⚠️ pas de gestion d'erreur DB.

### M.2 Notifications e-mail
- `MailChannel` : try/catch par destinataire. ✅
- `NotificationsService.sendEmailIfNeeded()` : try/catch global. ✅
- `MailService.sendMail()` : catch l'erreur SMTP et logge sans re-throw. ✅
- **Verdict** : ✅ Résilient.

### M.3 Whitelist
- `EMAIL_TYPES` = 15 types : `LEAVE_CREATED`, `LEAVE_RH_REVIEWED`, `LEAVE_TRANSMITTED`, `LEAVE_DECIDED`, `LEAVE_CANCELLED`, `PERMISSION_CREATED`, `PERMISSION_RH_REVIEWED`, `PERMISSION_TRANSMITTED`, `PERMISSION_DECIDED`, `PERMISSION_CANCELLED`, `CAMPAIGN_OPENED`, `PROPOSAL_SUBMITTED`, `USER_CREATED`, `USER_ACTIVATED`, `USER_DEACTIVATED`.
- **Verdict** : ✅ Tous les types pertinents sont inclus.

### M.4 SMTP
- Configuration via `.env` : `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`. Timeouts configurés (10s connexion, 10s greeting, 15s socket). ✅
- Fallback console en mode développement. ✅
- **Verdict** : ✅ Correct.

### M.5 Templates
- Handlebars : `layout.hbs` (structure HTML), `welcome.hbs`, `forgot-password.hbs`, `notification.hbs`. Templates compilés au démarrage. ⚠️ `layout.hbs:115` utilise le triple moustache `{{{body}}}` (HTML non échappé). 
- **Verdict** : ✅ Templates complets, ⚠️ risque XSS potentiel.

### M.6 Résilience
- L'échec SMTP est catché à 3 niveaux : `MailService` → `MailChannel` → `NotificationsService`. L'action métier n'est jamais bloquée. ✅
- **Verdict** : ✅ Excellente résilience.

---

## N. JOURNAL D'AUDIT

### N.1 Actions sensibles
- Tous les CRUD majeurs sont audités : utilisateurs, employés, départements, postes, congés, permissions, campagnes, événements internes, OTP/auth. ✅
- ❌ **Absences** : `holidays.service.ts` (pas d'audit), `permissions.service.ts` (annulation non auditée), `mail.service.ts` (envois non audités).
- **Verdict** : ⚠️ Audit quasi complet, 3 manques.

### N.2 Utilisateur
- `userId` enregistré dans chaque entrée d'audit. ✅
- **Verdict** : ✅ Correct.

### N.3 Date
- `createdAt` auto-généré. ✅
- **Verdict** : ✅ Correct.

### N.4 Ancienne valeur
- `oldValue: Json?` renseigné pour les modifications avec état précédent. ✅
- **Verdict** : ✅ Correct.

### N.5 Nouvelle valeur
- `newValue: Json?` renseigné pour toutes les actions. ✅
- **Verdict** : ✅ Correct.

---

## O. INTERFACE UTILISATEUR

### O.1 Cohérence graphique
- Thème vert (#0B6B3A) cohérent, palette Tailwind personnalisée. Design system utilisant `class-variance-authority` et `tailwind-merge`. ✅
- **Verdict** : ✅ Bonne cohérence.

### O.2 Responsive
- Breakpoints `sm/md/lg/xl` utilisés. Layout fluide avec `grid-cols-1 sm:grid-cols-2 lg:grid-cols-5`. ❌ **Sidebar toujours visible** (pas de masquage mobile). **Pas de hamburger menu**.
- **Verdict** : ⚠️ Adaptatif desktop d'abord, mobile perfectible.

### O.3 Dark mode
- `.dark` class + localStorage. Thème manuel (pas de `prefers-color-scheme`). Surcharges CSS avec `!important` agressif (fragile). Mode présent sur AuthLayout et Topbar. ✅
- **Verdict** : ✅ Fonctionnel, ⚠️ `!important` fragilise la maintenance.

### O.4 Tooltips
- Composant `Tooltip` React avec portal, positions top/bottom/right, animation `tooltip-in`. ✅
- **Verdict** : ✅ Correct.

### O.5 Spinners / Loaders
- `<Loader2 className="size-8 animate-spin" />` utilisé dans la plupart des pages. Dashboard utilise du texte "Chargement..." sans spinner. ⚠️ Incohérent.
- **Verdict** : ⚠️ Présent mais incohérent.

### O.6 Messages / Confirmations
- Messages d'erreur cohérents (français). Toasts avec auto-dismiss (5s). ✅
- **Verdict** : ✅ Correct.

### O.7 États vides
- "Aucune demande", "Aucune notification", etc. — gérés dans toutes les pages. ✅
- **Verdict** : ✅ Correct.

### O.8 Pagination
- **Uniquement dans `LeavePage.tsx`**. Absente de toutes les autres listes (employés, utilisateurs, permissions, etc.). ❌
- **Verdict** : ❌ Très insuffisant.

### O.9 Recherche / Filtres
- Recherche en temps réel (sans debounce) sur la plupart des pages. Calendar RH utilise une recherche post-filtre. ❌ Pas de debounce.
- **Verdict** : ⚠️ Recherche sans optimisation.

### O.10 Alignements / Icônes / Couleurs
- Icônes Lucide cohérentes. Couleurs Tailwind sémantiques. Alignements CSS flex/grid cohérents. ✅
- **Verdict** : ✅ Bon.

### O.11 Accessibilité
- `aria-label` : AuthLayout thème, password-input show/hide. `sr-only` : dialog close. `focus-visible:ring-*`. ✅ Présent sur quelques éléments.
- **Absences** : `aria-current`, `role="alert"`, `aria-live`, skip-to-content, `aria-expanded` sur dropdowns. ❌
- **Verdict** : ⚠️ Partiellement accessible.

---

## P. PERFORMANCES

### P.1 Requêtes inutiles
- `LeaveBalanceEngineService.syncAllBalances()` appelé **à chaque démarrage** de l'application (`onApplicationBootstrap`). Sans cache, sans condition.
- **Verdict** : ⚠️ Recalcul global au démarrage.

### P.2 N+1 queries
- **Campagnes** : `notifyEligibleEmployees()` et `getEligibleCount()` itèrent sur tous les employés et font une requête DB par employé (`isEligible()`).
- **Calendrier RH** : Détection de conflit `LEAVE_LEAVE` en O(n²).
- **Verdict** : ❌ N+1 dans les campagnes, O(n²) dans le calendrier.

### P.3 Index Prisma
- Index présents : `[employeeId]` sur LeaveRequest, `[status]` sur LeaveRequest, `[entityType, entityId]` sur AuditLog, `[userId, isRead]` sur Notification, `[name, date]` sur Holiday, `[startDate, endDate]` sur InternalEvent.
- Index manquants potentiels : `[leaveTypeId]` sur LeaveRequest, `[employeeId, year]` sur PermissionBalance, `[campaignId, employeeId]` sur LeaveProposal.
- **Verdict** : ✅ Index de base présents, ⚠️ quelques index supplémentaires recommandés.

### P.4 Lazy loading
- **Aucun** — tous les composants sont importés de manière statique. Pas de `React.lazy()`, pas de code splitting par route.
- **Verdict** : ❌ Aucun code splitting.

### P.5 Pagination
- Absente de la plupart des endpoints. Impossible de charger > 100 enregistrements sans problème. ❌
- **Verdict** : ❌ Pas de pagination.

### P.6 Optimisations
- `computeReturnDate()` appelle `workingDaysService.isHoliday()` qui fait une requête DB à chaque itération (sans cache). ⚠️
- `WorkingDaysService.calculate()` fetch **tous** les jours fériés sans filtre d'année. ⚠️
- **Verdict** : ⚠️ Quelques points d'optimisation.

---

## Q. QUALITÉ DU CODE

### Q.1 Duplication
- **Endpoints de types de congés dupliqués** : `/api/v1/leave-types/...` et `/api/v1/leave/types/...` avec implémentations divergentes. 🔴
- **Configuration de statuts dupliquée** : `statusConfig` dans LeavePage, PermissionsPage, MyPlanningPage, RequestDetailModal. ⚠️
- **Composant sidebar** : code dupliqué pour les états collapsed/expanded ("Mon compte"). ⚠️
- **Verdict** : 🔴 Duplication critique des types de congés.

### Q.2 Dette technique
- `any` utilisé > 100 fois dans le frontend. TypeScript largement contourné. 🔴
- `PermissionRequest.status` utilise `LeaveStatus` enum (mauvaise abstraction). ⚠️
- `operationType: 'AJUSTEMENT_MANUAL'` mélange français/anglais. ⚠️
- **Verdict** : 🔴 `any` massif dans le frontend.

### Q.3 TODO / FIXME
- **Aucun trouvé** dans le frontend. ✅
- **Un TODO** dans `internal-events.service.ts:164` : `// TODO: implémenter l'envoi de notification`. ⚠️
- **Verdict** : ✅ Propre côté frontend, ⚠️ TODO dans le backend.

### Q.4 `any`
- Voir Q.2 — > 100 occurrences dans les composants React. 🔴
- **Verdict** : 🔴 Problème majeur de qualité.

### Q.5 `console.log`
- **Aucun trouvé**. ✅
- **Verdict** : ✅ Excellent.

### Q.6 Architecture
- Modules NestJS bien structurés (controllers, services, DTOs, guards). ✅
- `@Global()` utilisé pour NotificationsModule et MailModule (pratique mais crée des dépendances implicites). ⚠️
- **Verdict** : ✅ Architecture globalement saine.

### Q.7 Factorisation
- Composant `Tooltip` réutilisable. Composants UI factorisés (`Card`, `Button`, `Input`, `Dialog`, etc.). ✅
- **Pas de composant Pagination réutilisable** malgré le besoin dans toutes les listes. ❌
- **Verdict** : ⚠️ Factorisation partielle.

### Q.8 Cohérence des services
- Les services emploient le même pattern général, mais les notifications et les audits ne sont pas parfaitement homogènes (ex: permissions vs congés pour l'annulation). ⚠️
- **Verdict** : ⚠️ Légères disparités.

---

## R. CAS LIMITES

### R.1 Double clic
- Les boutons de soumission sont désactivés pendant le traitement (`disabled={isSubmitting}`). ✅
- **Verdict** : ✅ Protégé.

### R.2 Plusieurs onglets
- Token stocké dans `localStorage` → partagé entre onglets. ✅
- `mustChangePassword` stocké dans `localStorage` → partagé. ✅
- **Verdict** : ✅ Compatible multi-onglets.

### R.3 Rafraîchissement navigateur
- AuthContext lit `localStorage` au démarrage → l'utilisateur reste connecté après F5. ✅
- **Verdict** : ✅ Correct.

### R.4 Utilisateur désactivé
- Bloqué à la connexion. Bloqué par JwtStrategy pour les endpoints protégés. ✅
- **Verdict** : ✅ Correct.

### R.5 Département désactivé
- Masqué aux non-ADMINs. Reste accessible par ID. ✅
- **Verdict** : ✅ Correct.

### R.6 Poste désactivé
- Masqué aux non-ADMINs. Reste accessible par ID. ✅
- **Verdict** : ✅ Correct.

### R.7 Suppression impossible
- Département : bloqué si employés ou postes existent. ✅
- Poste : bloqué si employés rattachés. ✅
- Type de congé : **NON BLOQUÉ** si des demandes de congé existent → viol de clé étrangère (Prisma). 🔴
- **Verdict** : 🔴 Suppression de type de congé non protégée.

### R.8 Données invalides
- `ValidationPipe` global avec `whitelist`, `forbidNonWhitelisted`, `transform`. ✅
- **Verdict** : ✅ Correct.

### R.9 Concurrence
- Les transactions Prisma (`$transaction`) sont utilisées pour les opérations critiques (création de congé, décision, annulation). ✅
- **Pas de mécanisme d'optimistic locking** (pas de version field, pas de timestamp check). ⚠️
- **Verdict** : ⚠️ Transactions présentes, pas de versioning.

---

## S. COHÉRENCE GLOBALE

### S.1 Dépendances entre modules

| Module | Dépend de | Problème |
|--------|-----------|----------|
| Employés | Départements, Postes, Utilisateurs | ✅ Cohérent |
| Congés | Types de congés, Soldes, Employés, Notifications, Moteur | ✅ Cohérent |
| Permissions | Employés, Soldes permissions, Notifications | ✅ Cohérent (2 bugs) |
| Campagnes | Soldes, Moteur planification, Notifications | ✅ Cohérent |
| Moteur intelligent | Départements, Postes, Employés, Congés | ✅ Cohérent |
| Notifications | Mail, Prisma | ✅ Cohérent |
| Calendrier RH | Congés, Permissions, Événements, Jours fériés, Campagnes | ✅ Cohérent |
| Audit | Tous les modules | ⚠️ 3 modules sans audit |

### S.2 Problèmes d'intégration détectés
1. **Types de congés dupliqués** : deux séries d'endpoints avec des comportements différents 🔴
2. **Permissions vs Congés** : workflow similaire mais implémentations qui divergent sur les détails (annulation, audit, soldes) ⚠️
3. **Moteur intelligent** : non intégré aux permissions (absence délibérée, mais notable) ⚠️
4. **Recalcul des soldes** : incohérence entre initialisation (defaultDays) et recalcul moteur (18 jours annuel) 🔴

---

## T. PRÉPARATION DE LA SOUTENANCE

### 1. L'application est-elle prête pour une démonstration devant un jury ?

**Oui, sous réserves.** L'application est fonctionnelle et démontrable. Tous les workflows métier principaux (connexion, congés, permissions, campagnes, notifications, calendrier) sont opérationnels et peuvent être présentés. Cependant, les anomalies critiques identifiées ci-dessous devront être soit corrigées avant la soutenance, soit mentionnées explicitement comme des axes d'amélioration identifiés.

### 2. Les fonctionnalités sont-elles complètes ?

**Oui, à 95 %.** Toutes les fonctionnalités planifiées sont implémentées :
- ✅ Workflow complet des congés (création, validation RH, transmission, décision direction, annulation)
- ✅ Workflow complet des permissions
- ✅ Gestion des utilisateurs, employés, départements, postes
- ✅ Campagnes annuelles avec propositions
- ✅ Moteur intelligent avec 6 règles d'analyse
- ✅ Notifications internes + emails
- ✅ Calendrier RH avec détection de conflits
- ✅ Dark mode, tooltips
- ❌ **Pas de refresh token**
- ❌ **Pas de pagination sur les listes**
- ❌ **Pas de statistiques employés**
- ❌ **Pas de code splitting**

### 3. Les règles métier sont-elles cohérentes ?

**Oui, avec des incohérences mineures entre modules parallèles :**
- Congés et permissions partagent le même workflow mais diffèrent sur les détails (annulation, audit, soldes)
- Le calcul des soldes annuels est incohérent entre `initLeaveBalance` (utilise `defaultDays`) et le moteur de recalcul (utilise 18 jours hardcodés)
- Les congés chevauchant deux années sont ignorés par le moteur de calcul
- **Pas d'incohérence métier bloquante**, mais plusieurs disparités techniques

### 4. Existe-t-il encore des anomalies critiques ?

| # | Anomalie | Module | Impact |
|---|----------|--------|--------|
| 1 | **OTP généré avec `Math.random()`** (non cryptographique) | Auth | Un attaquant peut prédire les OTP |
| 2 | **OTP stocké en clair** en base | Auth | Fuite de données en cas de brèche DB |
| 3 | **Aucun rate limiting sur verify-otp** | Auth | Brute-force de l'OTP (1M combinaisons) |
| 4 | **JWT_SECRET par défaut dans le code** | Auth | Forge de tokens possible |
| 5 | **Endpoints de types de congés dupliqués** | Leave Types | Comportements divergents |
| 6 | **Suppression de type de congé non protégée** | Leave Types | Violation FK → erreur 500 |
| 7 | **Recalcul annuel ignore `defaultDays`** | Soldes | Incohérence d'allocation |
| 8 | **Congés chevauchant deux années exclus** | Soldes | Perte de suivi des soldes |
| 9 | **Historique d'annulation des permissions : `ANNULEE`** | Permissions | Incohérence de données |

### 5. Existe-t-il des anomalies majeures ?

| # | Anomalie | Module | Impact |
|---|----------|--------|--------|
| 1 | Pas de refresh token | Auth | Reconnexion forcée toutes les 24h |
| 2 | Pas de Helmet (sécurité HTTP) | App | Pas de CSP, HSTS, X-Frame-Options |
| 3 | Pas de rate limiting sur les endpoints publics | Auth | Brute-force login possible |
| 4 | `.env` commité avec secrets (DB, SMTP) | Repo | Exposition des identifiants |
| 5 | `mustChangePassword` non enforce côté backend | Auth | Contournement possible |
| 6 | `any` utilisé > 100 fois dans le frontend | Frontend | TypeScript inefficace |
| 7 | Pas de pagination sur la plupart des listes | Tous modules | Scaling impossible |
| 8 | Audit manquant : permissions (annulation), jours fériés, emails | Audit | Traçabilité incomplète |
| 9 | Aucune gestion d'erreur sur `DatabaseChannel` | Notifications | Perte de notification silencieuse |
| 10 | Calendar RH : recherche post-filtre + O(n²) | Calendrier | Performances dégradées |

### 6. Existe-t-il des anomalies mineures ?

| # | Anomalie | Module |
|---|----------|--------|
| 1 | `color` et `icon` des types de congés sans validation de format | Leave Types |
| 2 | `minDuration` / `maxDuration` sans validation croisée | Leave Types |
| 3 | Ajustement de solde sans plancher (solde négatif possible) | Soldes |
| 4 | Incohérence guard/check pour l'annulation des permissions (HR/ADMIN) | Permissions |
| 5 | Pas de `BalanceAdjustment` pour les permissions | Permissions |
| 6 | Pas de `oldValue` dans l'audit des événements internes | Audit |
| 7 | `operationType: 'AJUSTEMENT_MANUAL'` mélange français/anglais | Soldes |
| 8 | Notification stubs dans les événements internes (TODO) | Événements |
| 9 | Sidebar toujours visible (pas de masquage mobile) | UI |
| 10 | Pas de debounce sur la recherche | UI |
| 11 | `!important` agressif dans les surcharges dark mode | UI |
| 12 | Layout d'email : triple moustache `{{{body}}}` (XSS potentiel) | Mail |
| 13 | `sendWelcomeEmail()` existe mais n'est jamais appelé | Mail |
| 14 | `resetToken`/`resetTokenExpires` dans le schéma Prisma (jamais utilisés) | Schema |
| 15 | Pas d'environnement de test (aucun test unitaire ou e2e) | Global |

### 7. Quels sont les risques restants ?

| Risque | Probabilité | Impact | Atténuation possible |
|--------|-------------|--------|---------------------|
| **Comptes compromis** par OTP faible ou rate limiting absent | Élevée | Critique | Corriger l'OTP + rate limiting (1-2 jours de travail) |
| **Fuites de données** via `.env` commité | Faible (repo privé) | Critique | Ajouter `.env` au `.gitignore` + rotation des secrets |
| **Déni de service** via endpoints publics sans rate limiting | Moyenne | Élevé | Ajouter `@nestjs/throttler` (1 jour) |
| **Perturbation de démo** par double endpoint leave-types | Élevée | Moyen | Supprimer le duplicate legacy (1 heure) |
| **Perte de données** en cas d'erreur DB sans transaction | Faible | Élevé | Ajouter `$transaction()` manquantes (départements, postes) |
| **Mauvaise expérience mobile** (sidebar fixe) | Élevée | Faible | Masquer la sidebar sur mobile (1 heure) |

### 8. Quelles améliorations recommandes-tu avant la livraison ?

**Blocage (à corriger impérativement) :**
1. Remplacer `Math.random()` par `crypto.randomInt()` pour l'OTP
2. Hasher l'OTP avant stockage
3. Ajouter du rate limiting sur `verify-otp` (max 5 tentatives par OTP)
4. Supprimer l'endpoint duplicate `/api/v1/leave/types/...`
5. Protéger la suppression des types de congés (vérifier les demandes actives)
6. Corriger l'historique `'ANNULEE'` → `'ANNULE'` dans permissions
7. Ajouter l'audit pour l'annulation des permissions
8. Changer `JWT_SECRET` pour une valeur forte en production

**Recommandé (avant soutenance) :**
9. Ajouter la pagination sur les listes (au moins employés, utilisateurs, permissions)
10. Remplacer les `any` par des types stricts dans les composants critiques
11. Corriger l'incohérence du recalcul annuel des soldes (utiliser `defaultDays`)
12. Ajouter la gestion des congés chevauchant deux années
13. Ajouter `@nestjs/throttler` pour le rate limiting global
14. Ajouter Helmet pour les en-têtes de sécurité
15. Ajouter le `AuditLog` pour les jours fériés
16. Ajouter un `AuditLog` pour l'envoi d'email (au moins le déclenchement)

**Souhaitable :**
17. Implémenter un refresh token JWT
18. Ajouter le code splitting (`React.lazy`)
19. Créer un composant Pagination réutilisable
20. Ajouter des tests unitaires sur les services critiques (auth, leave, notifications)
21. Cacher la sidebar sur mobile (responsive)
22. Ajouter le debounce sur les champs de recherche

### 9. Note globale sur 100

| Critère | Note (/100) | Commentaire |
|---------|-------------|-------------|
| **Fonctionnalités** | **85** | Tous les workflows sont implémentés. Manque : pagination, statistiques, refresh token |
| **Qualité du code** | **60** | Duplication critique des leave-types, `any` massif dans le frontend, pas de tests |
| **Sécurité** | **55** | OTP non cryptographique, pas de rate limiting, pas de Helmet, secrets dans le repo |
| **Interface** | **75** | Cohérente et fonctionnelle. Points faibles : responsive mobile, accessibilité |
| **Architecture** | **80** | Modules NestJS bien structurés. Points faibles : dépendances globales, pas de code splitting |
| **Expérience utilisateur** | **75** | Navigation fluide, dark mode, tooltips. Points faibles : pas de pagination, pas de debounce |
| **Maintenabilité** | **65** | `any` massif, duplication, absence de tests, assertions CSS `!important` |

**Moyenne pondérée : 71/100**

### 10. Verdict final

## ✅ PRÊT POUR LA SOUTENANCE AVEC RÉSERVES

**L'application est fonctionnelle et démontrable.** Tous les workflows métier principaux sont opérationnels. Les règles de gestion sont cohérentes dans l'ensemble. L'interface est propre et le dark mode est appréciable.

**Cependant, les 9 anomalies critiques et les 10 anomalies majeures identifiées dans ce rapport doivent être impérativement corrigées avant une mise en production réelle.** Pour la soutenance, il est acceptable de :
1. **Corriger les 3 bugs bloquants** (OTP, endpoints dupliqués, historique ANNULEE)
2. **Présenter les autres anomalies comme des axes d'amélioration identifiés** dans le cadre d'une démarche d'amélioration continue
3. **Démontrer avec des données de test restreintes** (éviter de charger 100+ employés pour masquer l'absence de pagination)

**Recommandation pour le jury :** Présenter l'application comme un produit fonctionnel avec une roadmap d'amélioration claire. Mettre en avant la richesse fonctionnelle (workflow complet, moteur intelligent, campagnes, notifications email, dark mode) et la qualité architecturale (NestJS modulaire, TypeScript, Prisma ORM). Assumer les défauts de sécurité et de performance comme des axes d'amélioration identifiés et planifiés.
