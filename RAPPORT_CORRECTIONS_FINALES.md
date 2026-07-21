# RAPPORT DES CORRECTIONS FINALES

**Date :** 20 juillet 2026  
**Objet :** Sprint final de stabilisation — corrections des anomalies critiques

---

## 1. Fichiers modifiés

| Fichier | Type de correction |
|---------|--------------------|
| `backend/src/decision-engine/rules/replacement-availability.rule.ts` | Statuts inexistants + `desiredEndDate` |
| `backend/src/decision-engine/decision-engine.service.ts` | Division par zéro |
| `backend/.env` | JWT_SECRET renforcé |
| `backend/src/app.module.ts` | Import + configuration ThrottlerModule |
| `backend/src/auth/auth.controller.ts` | Rate limiting sur login et forgot-password |
| `backend/package.json` | Ajout dépendance `@nestjs/throttler` |
| `backend/package-lock.json` | Lockfile mis à jour |

---

## 2. Détail des corrections

### 2.1 ReplacementAvailabilityRule — statuts inexistants

**Fichier :** `replacement-availability.rule.ts:204`

**Avant :**
```typescript
status: { in: ['SOUMISE', 'ACCEPTEE_RH', 'ACCEPTEE_DIRECTION'] },
OR: [
  { desiredEndDate: { gte: startDate } },
  { desiredEndDate: null, duration: { not: null }, desiredStartDate: { lte: endDate } },
],
```

**Problème :**
- `SOUMISE`, `ACCEPTEE_RH`, `ACCEPTEE_DIRECTION` n'existent pas dans l'enum `ProposalStatus`
- `desiredEndDate` n'existe pas dans le modèle `LeaveProposal` (seulement `desiredStartDate` + `duration`)

**Après :**
```typescript
status: { in: ['ACCEPTEE', 'RECUE', 'EN_ANALYSE'] },
```
La vérification de chevauchement des propositions est désormais faite en mémoire : chargement des propositions actives, calcul de la date de fin via `startDate + duration - 1`, puis comparaison avec `startDate/endDate` du congé.

---

### 2.2 DecisionEngineService — division par zéro

**Fichier :** `decision-engine.service.ts:56`

**Avant :**
```typescript
const score = Math.round((totalScore / maxScore) * 100);
```

**Problème :** Si `maxScore = 0` (toutes les règles échouent avec score 0), le calcul produit `NaN`.

**Après :**
```typescript
const score = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
```

---

### 2.3 JWT_SECRET renforcé

**Fichier :** `.env:16`

**Avant :** `JWT_SECRET=change_this_secret_key`  
**Après :** Secret cryptographique de 512 bits généré via `crypto.randomBytes(64).toString('hex')`

Le secret de développement est désormais robuste. Pour la production, il doit être passé via variable d'environnement système (hors du fichier `.env` versionné).

---

### 2.4 Rate limiting sur les endpoints d'authentification

**Package installé :** `@nestjs/throttler` (compatible NestJS 11)

**Configuration globale** (`app.module.ts`) :
- `ttl: 60000` (fenêtre de 60 secondes)
- `limit: 100` (100 requêtes par fenêtre par défaut)
- `ThrottlerGuard` enregistré comme `APP_GUARD` global

**Endpoints protégés** (`auth.controller.ts`) :

| Endpoint | Limite | Fenêtre |
|----------|--------|---------|
| `POST /auth/login` | 5 requêtes | 60 secondes |
| `POST /auth/forgot-password` | 3 requêtes | 60 secondes |

---

### 2.5 Anomalie api.ts (ligne 27)

**Fichier :** `frontend/src/services/api.ts:27`

**Verdict : FAUX POSITIF**

Le caractère `}` fermant l'objet `httpErrorMessages` n'est pas suivi d'un point-virgule. Cependant, en JavaScript/TypeScript, l'ASI (Automatic Semicolon Insertion) insère correctement le point-virgule après l'instruction `const httpErrorMessages = { ... }`. La ligne suivante commence par un identifiant (`api`), ce qui ne crée aucune ambiguïté. Aucune modification nécessaire.

---

## 3. Compilation

| Commande | Résultat |
|----------|----------|
| `backend > npx tsc --noEmit` | ✅ Aucune erreur |
| `frontend > npx tsc --noEmit` | ✅ Aucune erreur |

---

## 4. Anomalies restantes (non corrigées dans ce sprint)

Les anomalies suivantes de l'audit restent ouvertes mais n'ont pas été demandées pour ce sprint :

| ID | Description | Gravité |
|----|-------------|---------|
| B1 | Caractère spécial non exigé dans le mot de passe | Mineure |
| B2 | `OTP_RESEND_DELAY_SECONDS` défini mais jamais lu | Majeure |
| B4 | `JWT_SECRET` toujours versionné dans `.env` (le secret est fort mais l'approche reste risquée) | Critique |
| B5 | Aucun refresh token — session perdue après 1d | Mineure |
| C1 | Incohérence annulation congés vs permissions | Majeure |
| C5 | `removeRequest()` hard delete — perte de traçabilité | Majeure |
| E3 | `score -= score` dans `BalanceSufficiencyRule` (syntaxe trompeuse) | Mineure |
| E4 | Aucun test unitaire sur les règles de décision | Majeure |
| F2 | Notifications événements internes non implémentées | Majeure |
| F3 | `APP_URL` vs `BASE_URL` incohérence dans `.env` | Majeure |
| H2 | `SMTP_PASSWORD` toujours en clair dans le `.env` versionné | Critique |
| H4 | Helmet non installé (en-têtes de sécurité absents) | Majeure |
| L3 | `syncAllBalances()` au démarrage sans optimisation | Majeure |
| L4 | Congés chevauchant deux années mal comptabilisés | Majeure |
| O1-O4 | Absence quasi totale de tests | Critique |
| P1 | `.env` versionné avec secrets | Critique |
| P3 | CORS dur à `localhost:5173` | Majeure |
| Q1-Q4 | Problèmes de performance (N+1, pagination absente) | Majeure |

---

## 5. Résumé

| Item | Statut |
|------|--------|
| ReplacementAvailabilityRule — statuts | ✅ Corrigé |
| ReplacementAvailabilityRule — desiredEndDate | ✅ Corrigé |
| DecisionEngineService — division par zéro | ✅ Corrigé |
| JWT_SECRET — renforcement | ✅ Corrigé |
| Rate limiting — login (5 req/min) | ✅ Ajouté |
| Rate limiting — forgot-password (3 req/min) | ✅ Ajouté |
| api.ts — anomalie ligne 27 | ✅ Faux positif documenté |
| Compilation backend | ✅ Passe |
| Compilation frontend | ✅ Passe |

**Le développement est terminé.** Aucune nouvelle fonctionnalité n'a été introduite — uniquement des corrections ciblées sur les anomalies critiques demandées.
