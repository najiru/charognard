# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WXT browser extension for Instagram follow/unfollow functionality, built with React, TypeScript, and Tailwind CSS v4 (coss/ui components).

## Commands

```bash
pnpm dev              # Start development server (Chrome)
pnpm dev:firefox      # Start development server (Firefox)
pnpm build            # Build for production (Chrome)
pnpm build:firefox    # Build for production (Firefox)
pnpm zip              # Create distributable zip (Chrome)
pnpm zip:firefox      # Create distributable zip (Firefox)
pnpm compile          # TypeScript type checking
```

## Architecture

WXT browser extension with three entrypoints:

- **entrypoints/background.ts** - Relays messages from popup to content script, manages automation alarms
- **entrypoints/content/** - Main UI injected into `*.instagram.com/*` via Shadow DOM
- **entrypoints/popup/** - Simple launcher that opens Instagram and triggers the panel

### Message Flow
```
Popup → Background → Content Script → Instagram API
                  ←              ←
```

### Content Script Structure

The content script renders a floating button + side panel with three tabs:
- **Suggestions** - Discover and mass-follow new accounts
- **Followed** - Track who you followed and check follow-back status
- **Settings** - Configure daily limits and automation

Key patterns:
- `entrypoints/content/contexts/` - React contexts (AuthContext, HideButtonContext)
- `entrypoints/content/hooks/` - Custom hooks (useAuth, useHideButton, useSessionStorage)
- `entrypoints/content/side-panel/` - Tab components (suggestions, followed, settings)
- `entrypoints/content/components/` - Reusable UI components for content script

### Storage Architecture

Multi-account support via `lib/storage.ts`:
- Data scoped per Instagram user ID
- Tracks: followed profiles, daily action counts, automation settings
- Daily limits reset at midnight (follow/unfollow separately)

## Key Files

- `constants/app.ts` - Centralized app constants (name, developer info) - use `APP.NAME`, `APP.SHORT_NAME`, etc.
- `lib/types.ts` - Shared TypeScript types for API responses and messages
- `lib/instagram.ts` - Instagram API functions (fetchSuggestions, followUser, unfollowUser, checkFollowStatus)
- `lib/storage.ts` - Browser storage with multi-account support
- `lib/automation.ts` - Background automation logic
- `components/ui/` - coss/ui components (Button, Avatar, ScrollArea, etc.)
- `components/icons/` - Custom SVG icons (CharognardIcon)

## Instagram API

- **Suggestions**: `POST /api/v1/discover/ayml/`
- **Follow**: `POST /api/v1/friendships/create/{userId}/`
- **Unfollow**: `POST /api/v1/friendships/destroy/{userId}/`
- **User Info**: `GET /api/v1/users/{userId}/info/`
- **Friendship Status**: `GET /api/v1/friendships/show/{userId}/`

All requests require `x-csrftoken` header from cookies and `x-ig-app-id: 936619743392459`.
