---
name: ui-ux
description: UI/UX guidance for the Ask Deeny app. Use when building or modifying screens, components, or styles across the mobile (React Native/Expo) or admin (React/Vite) surfaces. Keywords: screen, component, style, layout, color, theme, RTL, Arabic, i18n, mobile, admin dashboard.
---

# Ask Deeny — UI/UX Guidelines

Apply these rules whenever building or editing UI in this project.

---

## Mobile (React Native / Expo 52)

### Colors — Always use tokens, never hardcode hex
Import from `mobile/theme/colors.ts`:
```ts
import { colors } from "../../theme/colors";
```

| Token | Value | Use |
|---|---|---|
| `colors.primary` | `#0F503A` | Buttons, headers, highlights |
| `colors.primaryDark` | `#0A3828` | Pressed states |
| `colors.primaryLight` | `#1A7A58` | Secondary accents |
| `colors.secondary` | `#C8A951` | Gold accent |
| `colors.background` | `#F6F9F7` | Screen backgrounds |
| `colors.surface` | `#FFFFFF` | Cards, modals |
| `colors.surfaceAlt` | `#EBF2EE` | Assistant chat bubble, subtle surfaces |
| `colors.userBubble` | `#0F503A` | User chat bubble background |
| `colors.assistantBubble` | `#EBF2EE` | Assistant chat bubble background |
| `colors.text` | `#1A1A1A` | Primary text |
| `colors.textSecondary` | `#5A6B63` | Secondary/muted text |
| `colors.textLight` | `#94A39B` | Placeholder, disabled text |
| `colors.border` | `#D4E3DB` | Borders, dividers |
| `colors.error` | `#DC3545` | Error states |
| `colors.success` | `#28A745` | Success states |

### RTL & Internationalization
- Get language state from Zustand: `useLanguage()` in `mobile/hooks/useLanguage.ts`
- Get translation object: `getT(lang)` from `mobile/i18n/index.ts`
- **Never hardcode English strings** — always use translation keys from `getT(lang)`
- Apply RTL layout with the `isRTL` flag:
  ```ts
  const { lang, isRTL } = useLanguage();
  const t = getT(lang);

  // In StyleSheet:
  flexDirection: isRTL ? "row-reverse" : "row",
  textAlign: isRTL ? "right" : "left",
  ```
- RTL direction is set via `I18nManager.forceRTL()` — requires app restart to take effect
- If `needsRestart` is returned from a language change, prompt the user to restart

### Routing (expo-router)
- Screens live in `mobile/app/`
- Auth-gated screens: `mobile/app/(app)/`
- Onboarding screens: `mobile/app/(onboarding)/`
- To go back to settings instead of navigating to chat, pass `?from=settings` as a query param — the screen calls `router.back()` when this is present

### Architecture constraints
- **Old architecture** (`newArchEnabled: false`) — do not use new arch APIs or Fabric components
- Auth tokens: `expo-secure-store`
- API calls: `mobile/services/api.ts` (API_URL is the local Wi-Fi IP — update when network changes)
- App name: **Ask Deeny** / bundle ID: `com.deenyai.app`

---

## Admin Dashboard (React / Vite)

- Source: `admin/` workspace
- Standard React functional components + hooks
- Connects to the Express API at port **3005** (`server/`)
- Admin-only API routes: `/api/admin/*`
- Requires valid JWT (same auth as mobile)

---

## Shared Conventions

- **TypeScript everywhere** — no plain JS files
- **Bilingual fields**: `name`/`nameAr`, `title`/`titleAr` — always populate both when creating content
- **Server port**: 3005 (not 3000)
- **Primary color**: Islamic green `#0F503A` — use `colors.primary`, never the raw hex
