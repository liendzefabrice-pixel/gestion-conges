# Améliorations du projet — Gestion des congés

Ce fichier documente toutes les améliorations techniques et fonctionnelles apportées au projet, dans l'ordre chronologique. Chaque entrée décrit le problème, la solution appliquée et les fichiers impactés.

---

## 2026-07-28 — 01 : Simplification de la navigation et uniformisation du CRUD

### Problème
La sidebar était trop chargée (entrées redondantes, pages rarement utilisées), les droits CRUD n'étaient pas cohérents entre ADMIN et DIRECTOR, et les couleurs vives dans `MyCampaignPage` nuisaient à la lisibilité.

### Solution
- Sidebar restructurée en 5 sections (Accueil / Demandes / Gestion / Administration / Notifications)
- Entrées supprimées : Événements internes, Calendrier RH, Décision RH, Ma Campagne, Compétences
- « Journal d'audit » renommé « historique des activités »
- `DepartmentsController` / `SkillsController` / `UsersController` : `@Roles` élargi pour inclure DIRECTOR
- `DepartmentsPage` / `PositionsPage` / `EmployeesPage` : `canManage` (ADMIN || DIRECTOR) pour les actions CRUD
- `MyCampaignPage.tsx` : uniformisation des couleurs en gris neutre, retrait des icônes décoratives superflues

### Fichiers impactés
- `frontend/src/layouts/MainLayout.tsx`
- `frontend/src/pages/DepartmentsPage.tsx`
- `frontend/src/pages/PositionsPage.tsx`
- `frontend/src/pages/EmployeesPage.tsx`
- `frontend/src/pages/MyCampaignPage.tsx`
- `frontend/src/pages/SoldesPage.tsx`
- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/pages/LeavePage.tsx`
- `backend/src/departments/departments.controller.ts`
- `backend/src/skills/skills.controller.ts`
- `backend/src/users/users.controller.ts`
- `backend/src/leave-campaign/leave-campaign.service.ts`

---

## 2026-07-28 — 02 : Correction du solde de congé annuel (solde unique partagé)

### Problème
Le solde de congé « annuel » était déduit immédiatement à l'approbation d'une proposition de campagne, empêchant l'employé d'utiliser son solde pour d'autres demandes avant la période programmée. Le dashboard affichait tous les types de congés au lieu du seul solde annuel.

### Solution
- La proposition de campagne approuvée **ne déduit plus** `usedDays` du solde (suppression du bloc `balance.usedDays + proposal.duration` dans `createLeaveRequestFromProposal`)
- Le dashboard (`DashboardPage.tsx`) filtre uniquement le type « annuel » sans ventilation
- `SoldesPage.tsx` n'affiche plus que le solde annuel
- `LeavePage.tsx` ne filtre plus les congés annuels

### Fichiers impactés
- `backend/src/leave-campaign/leave-campaign.service.ts`
- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/pages/SoldesPage.tsx`
- `frontend/src/pages/LeavePage.tsx`

---

## 2026-07-28 — 03 : Alerte solde insuffisant à la création d'une demande de congé

### Problème
Un employé pouvait créer une demande de congé « Annuel » sans aucun contrôle de solde. Le dépassement n'était détecté qu'à l'approbation par la Direction, trop tard.

### Solution
- Ajout d'une vérification du solde disponible (`totalDays + adjustedDays - usedDays - pendingDays`) après l'incrémentation de `pendingDays`
- Si le solde restant est négatif, une **alerte** est retournée dans la réponse : `{ request, warning: "Attention : votre demande dépasse votre solde disponible de X jour(s)." }`
- La demande est tout de même créée (comportement non-bloquant)

### Fichiers impactés
- `backend/src/leave/leave.service.ts`

---

## 2026-07-28 — 04 : Correction des jours ouvrés (dimanche exclu, samedi inclus)

### Problème
Le calcul des jours ouvrés (`WorkingDaysService`) excluait correctement les dimanches mais le `computeReturnDate` (date de retour) ne les excluait pas de la même manière. Les calendriers RH ne filtraient pas correctement les dimanches dans l'affichage des congés.

### Solution
- `WorkingDaysService.calculate()` : seul `dayOfWeek === 0` (dimanche) est exclu du calcul. Samedi est un jour ouvré (lundi–samedi).
- `computeReturnDate()` : aligné pour ne sauter que les dimanches
- `CalendarRhPage.tsx` : les propositions de campagne sautent les dimanches
- `CalendarPage.tsx` / `CalendarRhPage.tsx` : les cellules du dimanche sont grisées (`opacity-40 bg-gray-50`) sans contenu (congés, événements, jours fériés masqués)

### Fichiers impactés
- `backend/src/working-days/working-days.service.ts`
- `backend/src/leave/leave.service.ts`
- `frontend/src/pages/CalendarRhPage.tsx`
- `frontend/src/pages/CalendarPage.tsx`
- `frontend/src/pages/MyCampaignPage.tsx`

---

## 2026-07-28 — 05 : Suppression des demandes de congé avec ajustement du solde

### Problème
La suppression d'une demande de congé (`removeRequest`) ne décrémentait ni `usedDays` (si approuvée) ni `pendingDays` (si en attente). Les soldes restaient corrompus après suppression.

### Solution
- `removeRequest` inclut désormais `leaveType` dans la requête
- Si le statut était `APPROUVE` : décrémente `usedDays`
- Si le statut était `EN_ATTENTE_RH` ou `EN_ATTENTE_DIRECTION` : décrémente `pendingDays`
- Le tout dans une transaction Prisma pour garantir l'intégrité

### Fichiers impactés
- `backend/src/leave/leave.service.ts`

---

## 2026-07-28 — 06 : Réconciliation automatique des soldes (Priorité Critique n°1)

### Problème
Aucun mécanisme ne garantissait la cohérence entre `LeaveBalance.usedDays`/`pendingDays` et les `LeaveRequest` réelles. Des opérations comme la suppression de campagne ou les ajustements manuels pouvaient laisser des soldes incohérents.

### Solution
Création d'un module dédié `LeaveBalanceReconciliation` avec :

#### Service
- Parcourt tous les employés × types de congé (à déduction annuelle) × années présentes en base
- Recalcule **intégralement** `usedDays` (statut `APPROUVE`) et `pendingDays` (statuts `EN_ATTENTE_RH`, `EN_ATTENTE_DIRECTION`, `AVIS_RH_RENDU`) via `sum(duration)` sur les `LeaveRequest`
- **Ne modifie jamais** `totalDays` / `adjustedDays`
- Crée automatiquement un `LeaveBalance` s'il n'existe pas
- Audit log pour chaque correction (ancienne/nouvelle valeur, raison, date)

#### Verrouillage anti-concourance
- `isRunning` (mutex mémoire) interdit les exécutions parallèles
- Cron : log warning + return silencieux
- Manuel : `ConflictException` (HTTP 409)
- `try/finally` garantit la libération même en cas d'exception

#### Optimisation du parcours des années
- `collectAllYears()` : 2 requêtes DB au total (au lieu de N×M queries)
- Seules les années réellement présentes dans `LeaveBalance` ou `LeaveRequest` sont traitées

#### Audit explicite
- Anciennes et nouvelles valeurs clairement distinctes (ex : `usedDays: "15 -> 12"`)
- Raison : `Automatic Leave Balance Reconciliation — Nightly automatic reconciliation`

#### Exécution
- **Automatique** : cron `EVERY_DAY_AT_2AM` via `@nestjs/schedule`
- **Manuelle** : `POST /leave-balances/reconcile` (réservé ADMIN)

#### Idempotence
Le calcul part toujours de zéro (somme des durées filtrées). Exécuté 1, 10 ou 100 fois → résultat identique.

### Fichiers créés
- `backend/src/leave-balance-reconciliation/leave-balance-reconciliation.service.ts`
- `backend/src/leave-balance-reconciliation/leave-balance-reconciliation.module.ts`

### Fichiers modifiés
- `backend/src/app.module.ts`
- `backend/src/leave-balances/leave-balances.controller.ts`
- `backend/src/leave-balances/leave-balances.module.ts`
- `backend/package.json` (ajout dépendance `@nestjs/schedule`)

### Tests manuels
```bash
# Lancer la réconciliation
curl -X POST http://localhost:3000/api/leave-balances/reconcile \
  -H "Authorization: Bearer TOKEN_ADMIN"

# Vérifier l'idempotence (2e appel = unchanged partout)
curl -X POST http://localhost:3000/api/leave-balances/reconcile \
  -H "Authorization: Bearer TOKEN_ADMIN"

# Vérifier le verrouillage (2e appel simultané = 409)
curl -X POST http://localhost:3000/api/leave-balances/reconcile \
  -H "Authorization: Bearer TOKEN_ADMIN" &
curl -X POST http://localhost:3000/api/leave-balances/reconcile \
  -H "Authorization: Bearer TOKEN_ADMIN"
```

---

## Conventions appliquées

- **Idempotence** : toutes les opérations de correction/recalcul sont conçues pour être exécutées plusieurs fois sans effet de bord
- **Audit trail** : chaque modification de solde est tracée dans `AuditLog` (avant/après, auteur, raison, date)
- **Transactions** : les opérations critiques (création + mise à jour + audit) sont encapsulées dans des transactions Prisma
- **Verrouillage** : les jobs concurrents sont protégés par mutex mémoire
- **Non-régression** : aucun workflow existant n'est modifié ; les nouvelles fonctions sont additives
