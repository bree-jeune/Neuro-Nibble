# NeuroNibble

An ADHD-friendly productivity app that breaks tasks into bite-sized pieces and matches workflows to your energy capacity.

## Overview

NeuroNibble is a mobile-first application built with Expo and React Native. It helps users with ADHD or executive function challenges by:
- Breaking large tasks into 2-10 minute "bites"
- Matching task difficulty to current energy levels
- Providing weekly "rooms" to focus on one life area at a time
- Offering gentle, permission-based microcopy that reduces shame and anxiety

## Project Architecture

### Frontend (Expo/React Native)
- **client/screens/**: All app screens (HomeScreen, TasksScreen, TaskDetailScreen, ReflectScreen, ProfileScreen, BreakItDownScreen)
- **client/components/**: Reusable UI components (EnergyCard, WeeklyRoomBadge, TaskCard, etc.)
- **client/navigation/**: React Navigation setup with tab navigator and stack navigators
- **client/lib/**: Zustand store for state management, types, and query client
- **client/constants/theme.ts**: Design tokens (colors, spacing, typography)

### Backend (Express)
- **server/index.ts**: Express server entry point
- **server/routes.ts**: API routes
- **server/storage.ts**: Data storage interface

### Key Files
- **design_guidelines.md**: Complete design specifications
- **app.json**: Expo configuration with branding

## Design System

### Colors
- Primary: Dusty Teal (#7B9EA8)
- Secondary: Warm Taupe (#D4B5A0)
- Background: Soft Cream (#F7F4F1)

### Design Principles
- 70% white space for visual calm
- No emojis
- Permission-based microcopy ("You're allowed to stop")
- iOS 26 liquid glass interface aesthetic

## Running the App

The app runs with `npm run all:dev` which starts both the Expo dev server (port 8081) and the Express server (port 5000).

To test on a physical device, scan the QR code from Replit's URL bar menu using Expo Go.

## Key Features

### Home Screen
- Energy level selector (low/medium/high)
- Weekly room badge showing current focus area
- Recent tasks for quick access
- Daily bookend for morning/evening check-ins

### Tasks Screen
- FlatList of all tasks with progress indicators
- Ability to view and manage task steps

### Break It Down (Modal)
- Create new tasks
- Break tasks into micro-steps (2-10 minutes each)
- Edit existing tasks

### Reflect Screen
- Weekly rooms selection (Gentle Week, Focus Week, Adventure Week, Rest Week)
- Brain dump for capturing thoughts
- Dopamine menu for listing enjoyable activities
- One tiny thing for the day's smallest win

### Profile Screen
- Avatar picker
- Settings (haptics, notifications)
- Stats display
- Reset option

## State Management

Uses Zustand with AsyncStorage persistence. State includes:
- Energy level
- Weekly room
- Tasks array with steps
- Brain dump text
- Dopamine menu items
- User preferences

## User Preferences

- Gentle, non-judgmental language throughout
- Haptic feedback for interactions
- Automatic daily bookend reset
- Persistent data across sessions
