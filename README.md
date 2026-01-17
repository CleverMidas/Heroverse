# HeroVerse

A mobile idle game where players collect heroes, earn SuperCash, and compete on leaderboards.

Built with **React Native + Expo** and **Supabase**.

## Features

- 🦸 **Hero Collection** - Collect and stack heroes of different rarities
- 💰 **Passive Earnings** - Heroes generate SuperCash automatically
- 🏆 **Leaderboards** - Compete with other players globally
- 🎁 **Mystery Boxes** - Open boxes to discover new heroes
- 👥 **Referral System** - Invite friends and earn bonus SuperCash
- 💸 **Send SuperCash** - Transfer SC to other players
- 🔐 **MFA Support** - Two-factor authentication with TOTP
- 🌙 **Dark/Light Theme** - Toggle between themes

---

## Tech Stack

### Frontend Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.81.4 | Cross-platform mobile framework |
| Expo | 54.0.10 | Development platform & build tools |
| React | 19.1.0 | UI component library |
| TypeScript | 5.9.2 | Static type checking |

### Navigation & Routing
| Library | Version | Purpose |
|---------|---------|---------|
| expo-router | 6.0.8 | File-based routing system |
| @react-navigation/native | 7.0.14 | Navigation core |
| @react-navigation/bottom-tabs | 7.2.0 | Tab navigation |
| react-native-screens | 4.16.0 | Native screen optimization |

### UI & Styling
| Library | Version | Purpose |
|---------|---------|---------|
| lucide-react-native | 0.544.0 | Icon library (500+ icons) |
| expo-linear-gradient | 15.0.7 | Gradient backgrounds |
| expo-blur | 15.0.7 | Blur effects |
| react-native-svg | 15.12.1 | SVG rendering |
| react-native-reanimated | 4.1.1 | Advanced animations |
| react-native-gesture-handler | 2.28.0 | Touch gestures |

### Backend & Database
| Technology | Version | Purpose |
|------------|---------|---------|
| Supabase | 2.58.0 | Backend-as-a-Service |
| PostgreSQL | 15+ | Relational database |
| Row Level Security | - | Data access control |
| PL/pgSQL | - | Server-side functions |

### Authentication
| Feature | Implementation |
|---------|----------------|
| Email/Password | Supabase Auth |
| Google OAuth | Supabase + Google Cloud |
| MFA (TOTP) | Supabase MFA API |
| Session Management | JWT + AsyncStorage |

### Storage & Utilities
| Library | Version | Purpose |
|---------|---------|---------|
| @react-native-async-storage | 2.2.0 | Local data persistence |
| expo-clipboard | 8.0.8 | Copy to clipboard |
| expo-haptics | 15.0.7 | Haptic feedback |
| expo-web-browser | 15.0.7 | OAuth browser flow |
| expo-constants | 18.0.9 | App configuration |

### Web Support
| Library | Version | Purpose |
|---------|---------|---------|
| react-native-web | 0.21.0 | Web compatibility layer |
| react-dom | 19.1.0 | DOM rendering |

### Development Tools
| Tool | Version | Purpose |
|------|---------|---------|
| TypeScript | 5.9.2 | Type checking |
| Babel | 7.25.2 | JavaScript transpiler |
| ESLint | - | Code linting |

---

## Architecture

### State Management
```
┌─────────────────────────────────────────────────────────┐
│                    React Context API                    │
├─────────────────┬─────────────────┬─────────────────────┤
│   AuthContext   │  GameContext    │   ThemeContext      │
│  - session      │  - stackedHeroes│   - isDark          │
│  - user         │  - refreshHeroes│   - theme           │
│  - profile      │  - collectSC    │   - toggleTheme     │
│  - mfaVerified  │                 │                     │
└─────────────────┴─────────────────┴─────────────────────┘
```

### Data Flow
```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  UI      │────▶│ Context  │────▶│ Supabase │
│Components│◀────│ Provider │◀────│   API    │
└──────────┘     └──────────┘     └──────────┘
                      │
                      ▼
              ┌──────────────┐
              │ AsyncStorage │
              │   (Local)    │
              └──────────────┘
```

### Authentication Flow
```
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│ Login   │──▶│ Verify  │──▶│  MFA    │──▶│  Home   │
│ Screen  │   │Password │   │ Check   │   │  Page   │
└─────────┘   └─────────┘   └─────────┘   └─────────┘
                                │
                                ▼ (if MFA enabled)
                          ┌─────────┐
                          │  TOTP   │
                          │  Modal  │
                          └─────────┘
```

---

## Backend Architecture (Supabase)

### Database Schema
```sql
profiles          hero_rarities       heroes
├── id (FK)       ├── id              ├── id
├── username      ├── name            ├── name
├── supercash     ├── supercash/hr    ├── rarity_id (FK)
├── referral_code └── drop_rate       ├── image_url
└── referred_by                       └── is_active

user_heroes                    transactions
├── id                         ├── id
├── user_id (FK)               ├── user_id (FK)
├── hero_id (FK)               ├── type
├── is_active                  ├── amount
└── acquired_at                └── created_at
```

### RPC Functions (Server-Side Logic)
| Function | Parameters | Returns | Security |
|----------|------------|---------|----------|
| `calculate_pending_supercash` | - | number | SECURITY DEFINER |
| `collect_supercash` | - | {success, collected, new_balance} | SECURITY DEFINER |
| `send_supercash` | recipient, amount | {success, message} | SECURITY DEFINER |
| `apply_referral_code` | code | {success, bonus_given} | SECURITY DEFINER |
| `get_referral_stats` | - | {invite_count, total_earned} | SECURITY DEFINER |
| `get_transaction_history` | limit | transaction[] | SECURITY DEFINER |
| `check_email_exists` | email | boolean | SECURITY DEFINER |
| `check_username_exists` | username | boolean | SECURITY DEFINER |

### Row Level Security (RLS) Policies
```sql
-- Users can only read/update their own profile
profiles: SELECT/UPDATE WHERE auth.uid() = id

-- Users can only read/modify their own heroes  
user_heroes: SELECT/INSERT/UPDATE WHERE auth.uid() = user_id

-- Users can only view their own transactions
transactions: SELECT WHERE auth.uid() = user_id

-- Everyone can read heroes and rarities
heroes: SELECT (public)
hero_rarities: SELECT (public)
```

---

## Security Features

| Feature | Implementation |
|---------|----------------|
| **Authentication** | Supabase Auth with JWT tokens |
| **MFA** | TOTP-based (RFC 6238 compliant) |
| **Password Hashing** | bcrypt via Supabase |
| **SQL Injection Prevention** | Parameterized queries |
| **XSS Prevention** | React's built-in escaping |
| **CORS** | Configured in Supabase |
| **RLS** | Row-level security on all tables |
| **Secure Storage** | AsyncStorage for sessions |
| **Function Security** | `SECURITY DEFINER SET search_path = ''` |

---

## API Integration

### Supabase Client Setup
```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
  },
});
```

### MFA API Usage
```typescript
// Enroll in MFA
await supabase.auth.mfa.enroll({ factorType: 'totp' });

// Challenge & Verify
const { data } = await supabase.auth.mfa.challenge({ factorId });
await supabase.auth.mfa.verify({ factorId, challengeId, code });

// Check AAL Level
const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
// currentLevel: 'aal1' | 'aal2'
```

### Real-time Subscriptions (Available)
```typescript
supabase
  .channel('leaderboard')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, 
      payload => { /* handle update */ })
  .subscribe();
```

---

## Performance Optimizations

| Optimization | Implementation |
|--------------|----------------|
| **Memoization** | `useMemo`, `useCallback` for expensive computations |
| **Lazy Loading** | Expo Router's automatic code splitting |
| **Image Caching** | Expo's Image component with caching |
| **Debouncing** | Input validation with debounced API calls |
| **Pagination** | Transaction history limited to 100 items |
| **Native Screens** | `react-native-screens` for native stack |

---

## Code Quality

### TypeScript Configuration
- Strict mode enabled
- No implicit any
- Strict null checks

### Linting Rules
- ESLint with Expo preset
- React hooks rules
- Import ordering

### Code Organization
- Feature-based file structure
- Shared utilities in `/lib`
- Reusable components in `/components/ui`
- Type definitions in `/types`

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Supabase](https://supabase.com/) account


### App Store Requirements

**Android:**
- Package name: `com.heroverse.app`
- SHA-1 fingerprint for Google Sign-in
- Signed APK/AAB

**iOS:**
- Bundle ID: `com.heroverse.app`
- Apple Developer account
- Provisioning profiles

## Google OAuth Setup

### Web
1. Create OAuth 2.0 Client ID (Web application)
2. Add authorized origins: `https://your-project.supabase.co`
3. Add redirect URI: `https://your-project.supabase.co/auth/v1/callback`

### Android
1. Create OAuth 2.0 Client ID (Android)
2. Add package name: `com.heroverse.app`
3. Add SHA-1 fingerprint from your keystore

### iOS
1. Create OAuth 2.0 Client ID (iOS)
2. Add bundle ID: `com.heroverse.app`

## MFA (Two-Factor Authentication)

Users can enable TOTP-based MFA in Settings:

1. Click "Enable 2FA"
2. Copy secret key to authenticator app (Google Authenticator, Authy)
3. Enter 6-digit code to verify
4. MFA is now required on login

## License

MIT License

## Support
