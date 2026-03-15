# CareLink

CareLink is a React Native mobile app built with Expo and TypeScript for family caregiving coordination. The app is designed as a caregiver dashboard with medication tracking, family activity updates, room-based caregiver grouping, theme switching, and a dynamic medication reminder surface inspired by the Dynamic Island pattern.

This README is written as a current-state handoff so another model or designer can make stronger visual and interaction changes without losing existing functionality.

## Stack

- Expo SDK 54
- React Native 0.81
- React 19
- TypeScript
- React Navigation bottom tabs
- React Native Reanimated
- Expo Haptics
- AsyncStorage for local persistence

## Product Summary

The app is meant to help caregivers and family members coordinate around one person’s daily care. The current build is not connected to a backend. It uses mock care data and local device persistence for room and auth state.

The experience currently centers around four main tabs:

1. Dashboard
2. Medications
3. Family Activity
4. Rooms

## Current Features

### 1. Dashboard

- Greeting and daily overview
- Patient status card with heart, hydration, and sleep metrics
- Emergency readiness card with animated pulse emphasis
- CareScore card showing medication completion progress
- Today’s medications preview
- Upcoming appointments section
- Recent family activity feed
- Quick action for voice log
- Floating add/check-in action button
- Theme toggle button in the top bar

### 2. Medications

- Medication list view
- Reusable medication cards
- Medication states such as pending and taken
- Explicit action cues using strong red/green semantics
- Icon and text labels for medication actions

### 3. Family Activity

- Live-style activity timeline
- Animated entry transitions for activity items
- Family/caregiver action feed based on mock data

### 4. Rooms

- Login and signup screen states
- Local persistent user state via AsyncStorage
- Room creation flow
- Persistent room state after creation
- Generated room code shown as a secure room access code
- Member list inside the room
- Add member flow
- Member role selection
- Supported roles:
  - Elder
  - Guardian
  - Patient
- Online/offline status indicators
- Sign out action

### 5. Theme System

- Light mode and dark mode
- Full app color theming through a theme provider
- Animated crossfade-style theme transition overlay
- Shared color tokens and shadow tokens

### 6. Floating Navigation Bar

- Custom floating bottom tab bar
- Animated lift/scale behavior on focused tab
- Haptic tap feedback on tab press
- Glass/translucent visual treatment

### 7. Medication Island Reminder

- Floating top reminder surface that appears during medication sessions
- Session-based reminder logic:
  - Morning
  - Afternoon
  - Night
- Compact and expanded states
- Reminder count for repeated reminders
- Session-specific medication list inside the alert
- Actions for:
  - Taken
  - Skip
- Completion state after interaction

## Visual Direction Currently Implemented

The current UI is no longer in the original calm teal healthcare direction. It has already been shifted into a warm red and deep-orange palette.

### Current visual characteristics

- Warm red/deep orange palette
- Light mode background is soft off-white with peach tones
- Dark mode background is deep brown-red
- Bold orange primary color
- Red used for accent and alert emphasis
- Strong green and red action states for success and danger
- Rounded cards and large corner radii
- Soft shadow-based depth
- Glassy floating bottom navigation

### Theme token direction

Color tokens live in [constants/theme.ts](constants/theme.ts).

The current palette intentionally avoids:

- Blue-heavy medical UI
- Purple-heavy gradients
- Muted green overall brand tones

## Interaction Patterns Already Present

- Reanimated motion on cards and indicators
- Animated CareScore fill
- Pulsing alert emphasis on the dashboard
- Animated timeline entry on family activity items
- Floating tab button motion
- Theme transition overlay when switching light/dark mode
- Dynamic medication reminder card that expands and collapses
- Haptics on bottom tab presses

## Data and State Model

### Care data

Mock care data is provided through a shared context.

Includes:

- Medications
- Activities
- Appointments
- Derived care score

### Theme state

The app theme is managed centrally and provides:

- Current mode
- Current color palette
- Next color palette during transitions
- Shadow tokens
- Transition state

### Room/auth state

Room and auth state is persisted locally.

Includes:

- User name
- User email
- Authenticated state
- Room name
- Room code
- Created room state
- Room members

Important: this is local-only persistence and not a real authentication or encrypted backend system.

## Important Constraints

- No backend yet
- No real authentication service
- No real encrypted transport or storage
- Room code is currently a locally generated secure-style access code, not actual cryptographic encryption
- Care data is mock data, not synced from a server
- Design changes should preserve the current behavior and navigation structure unless intentionally refactoring them

## Files That Matter Most For UI Redesign

- [App.tsx](App.tsx)
- [constants/theme.ts](constants/theme.ts)
- [navigation/RootNavigator.tsx](navigation/RootNavigator.tsx)
- [screens/DashboardScreen.tsx](screens/DashboardScreen.tsx)
- [screens/MedicationsScreen.tsx](screens/MedicationsScreen.tsx)
- [screens/FamilyActivityScreen.tsx](screens/FamilyActivityScreen.tsx)
- [screens/RoomsScreen.tsx](screens/RoomsScreen.tsx)
- [components/MedicationIslandAlert.tsx](components/MedicationIslandAlert.tsx)
- [components/MedicationCard.tsx](components/MedicationCard.tsx)
- [components/CareScoreIndicator.tsx](components/CareScoreIndicator.tsx)
- [components/StatusCard.tsx](components/StatusCard.tsx)

## What Aesthetic Improvements Can Safely Change

- Overall art direction
- Typography choices
- Card shapes and layout density
- Color palette refinement
- Background treatments and gradients
- Tab bar visual design
- Dashboard hierarchy and spacing
- Icon styling
- Motion timing and transitions
- Empty states, section headers, and visual polish
- Medication reminder presentation
- Room screen layout and visual hierarchy

## What Should Be Preserved Unless Explicitly Reworked

- Four-tab structure
- Light/dark theming support
- Medication session reminder concept
- Room creation and role management flow
- Local persistence for room/auth information
- Clear green/red action semantics for medicine-related actions
- Caregiving focus of the product

## Suggested Prompt Context For Claude

Use this when asking Claude to redesign the app visually:

"I have an Expo React Native TypeScript app called CareLink. It is a caregiver coordination app with 4 tabs: Dashboard, Medications, Family Activity, and Rooms. The app already has light/dark mode, a floating animated bottom navigation bar with haptics, a dynamic medication reminder island at the top, medication cards, a care score progress card, room creation with member roles, and local persistence for login/room data.

The current visual direction is warm red/deep orange with rounded cards, soft shadows, and a translucent floating nav bar. I want you to improve the app aesthetically without removing existing functionality. Redesign the UI to feel more premium, intentional, and modern. Keep the caregiving purpose clear. Preserve the current navigation structure, theme support, reminder system, and room/member flow unless there is a strong UX reason to improve them.

Please propose and implement a stronger design system, better spacing, better typography, better information hierarchy, more polished motion, and more elegant card/tab treatments. Avoid generic templates and avoid purple-heavy or blue-heavy healthcare styling unless justified." 

## Run Commands

From the project folder:

```bash
npm run start -- --tunnel -c
```

Type check:

```bash
npm run typecheck
```

## Current Status

- The app structure is in place
- The major caregiver flows are implemented
- The app is ready for a visual redesign pass
- The next best improvements are design quality, layout refinement, polish, and clearer premium branding