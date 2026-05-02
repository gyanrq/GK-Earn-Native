# JavaScript → TypeScript Migration Guide
## GK Earn Native App

---

## ✅ Kya Badla (Files Converted)

### Core Files
| Old File | New File | Changes |
|----------|----------|---------|
| `src/core/api/api.js` | `src/core/api/api.ts` | `AxiosInstance`, `InternalAxiosRequestConfig` types added |
| `src/core/auth/AuthContext.js` | `src/core/auth/AuthContext.tsx` | `UserInfo`, `LoginPayload`, `AuthContextType` interfaces added |
| `src/core/theme/colors.js` | `src/core/theme/colors.ts` | `ShadowStyle` interface, `as const` assertions |
| `src/core/ui/index.js` | `src/core/ui/index.tsx` | Full typed props for Button, Input, Card, Badge, etc. |
| `src/core/ui/ToastContext.js` | `src/core/ui/ToastContext.tsx` | `ToastContextType`, `ToastState` interfaces |
| `src/core/ui/ErrorBoundary.js` | `src/core/ui/ErrorBoundary.tsx` | Class component typed with `Props`, `State` |
| `src/core/ui/Spinner.js` | `src/core/ui/Spinner.tsx` | `SpinnerProps` interface |

### Navigation
| Old File | New File | Changes |
|----------|----------|---------|
| `src/AppNavigator.js` | `src/AppNavigator.tsx` | `AuthStackParamList` type exported |
| `src/layouts/MainLayout.js` | `src/layouts/MainLayout.tsx` | `MainStackParamList`, `TabConfig` interfaces, typed `BottomTabBarProps` |

### Auth Screens (Fully Typed)
| Old File | New File | Changes |
|----------|----------|---------|
| `src/features/auth/LoginScreen.js` | `src/features/auth/LoginScreen.tsx` | `MfaChallenge`, `MfaStep` types, navigation prop typed |
| `src/features/auth/RegisterScreen.js` | `src/features/auth/RegisterScreen.tsx` | `RegisterForm` interface |
| `src/features/auth/ForgotPasswordScreen.js` | `src/features/auth/ForgotPasswordScreen.tsx` | Step state typed as `1 \| 2` |

### Feature Screens (Renamed to .tsx)
All feature screens renamed with basic TypeScript:
- `DashboardScreen.tsx`, `TasksScreen.tsx`, `SpinScreen.tsx`
- `RewardsScreen.tsx`, `SettingsScreen.tsx`, `ReferralScreen.tsx`
- `NotificationsScreen.tsx`, `PayoutScreen.tsx`, `CampaignScreen.tsx`

### Components
- `LeadCaptureModal.tsx` — `Task` and `Props` interfaces
- `TaskCard.tsx` — `Task` and `Props` interfaces, typed `CATEGORY_COLORS`

### API Files
- `taskApi.ts`, `rewardApi.ts` — `AxiosPromise` return types

---

## 🔧 Root Level Changes
- `index.js` → `index.ts`
- `tsconfig.json` updated with proper settings
- `package.json` unchanged (TypeScript already in devDependencies)

---

## 🚀 Apne Machine Pe Kaise Use Karein

### Step 1: Dependencies install karo
```bash
npm install
# ya
yarn install
```

### Step 2: Type check karo
```bash
npm run type-check
# ya
npx tsc --noEmit
```

### Step 3: Android run karo
```bash
npm run android
```

---

## ⚠️ Agar Koi Error Aaye

### Axios types missing
```bash
npm install --save-dev @types/axios
```

### Navigation types missing
```bash
npm install --save-dev @types/react-navigation
```

### "Cannot find module" errors
Make sure `tsconfig.json` ka `moduleResolution` "bundler" hai.

---

## 📁 Final Structure

```
src/
├── AppNavigator.tsx              ← Root navigator (typed)
├── core/
│   ├── api/api.ts                ← Axios instance (typed)
│   ├── auth/AuthContext.tsx      ← Auth context (fully typed)
│   └── theme/colors.ts           ← Design tokens (typed)
│   └── ui/
│       ├── index.tsx             ← All UI components (typed)
│       ├── ToastContext.tsx      ← Toast system (typed)
│       ├── ErrorBoundary.tsx     ← Error boundary (typed)
│       └── Spinner.tsx           ← Spinner (typed)
├── features/
│   ├── auth/
│   │   ├── LoginScreen.tsx       ← FULLY TYPED ⭐
│   │   ├── RegisterScreen.tsx    ← FULLY TYPED ⭐
│   │   └── ForgotPasswordScreen.tsx ← FULLY TYPED ⭐
│   ├── dashboard/DashboardScreen.tsx
│   ├── tasks/
│   │   ├── TasksScreen.tsx
│   │   ├── api/taskApi.ts
│   │   └── components/
│   │       ├── TaskCard.tsx      ← FULLY TYPED ⭐
│   │       └── LeadCaptureModal.tsx ← FULLY TYPED ⭐
│   ├── campaign/CampaignScreen.tsx
│   ├── notifications/NotificationsScreen.tsx
│   ├── payout/PayoutScreen.tsx
│   ├── referral/
│   │   ├── ReferralScreen.tsx
│   │   └── pages/MilestonePage.tsx
│   ├── rewards/
│   │   ├── RewardsScreen.tsx
│   │   └── api/rewardApi.ts
│   ├── settings/SettingsScreen.tsx
│   └── spin/SpinScreen.tsx
└── layouts/MainLayout.tsx        ← FULLY TYPED ⭐
```
