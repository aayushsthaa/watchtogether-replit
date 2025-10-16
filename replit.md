# WatchTogether

## Overview

WatchTogether is a real-time collaborative streaming platform that enables users to watch videos together and share screens with live chat functionality. The application supports two primary modes: **screen sharing** for presentations and demonstrations, and **watch parties** for synchronized video viewing (YouTube integration). Built with a modern tech stack, it features real-time WebSocket communication, user authentication, room management, and dynamic ownership controls.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server
- **Wouter** for client-side routing (lightweight alternative to React Router)
- **TanStack Query (React Query)** for server state management and caching
- **Tailwind CSS** with shadcn/ui component library for styling

**Design System:**
- Hybrid approach inspired by Discord (chat UX), Linear (clean interface), and Twitch (streaming features)
- Dark-first design with light mode support via theme provider
- Custom color palette with HSL values for both themes
- Typography using Inter (UI) and JetBrains Mono (monospace for codes)
- Responsive design with mobile-first considerations

**State Management:**
- React Context API for authentication state (`AuthContext`)
- Theme management via `ThemeProvider` context
- Server state handled by React Query with custom hooks
- Real-time updates managed through WebSocket connections

**Key UI Components:**
- Room video player with YouTube embed support
- Real-time chat panel with message history
- Room controls for mode switching and settings
- Ownership transfer dialogs for room management
- Sidebar navigation with room listings

### Backend Architecture

**Technology Stack:**
- **Express.js** server with TypeScript
- **MongoDB** with Mongoose ODM for data persistence
- **WebSocket** (ws library) for real-time communication
- **JWT** for authentication with HTTP-only cookies
- **bcrypt** for password hashing

**API Design:**
- RESTful endpoints for CRUD operations
- Cookie-based authentication for stateful sessions
- Middleware chain: logging → cookie parsing → authentication → validation
- Express-validator for request validation with Zod schemas

**Database Models (MongoDB/Mongoose):**
1. **User Model**: Authentication and profile data with admin flags
2. **Room Model**: Room metadata, ownership, mode (screenshare/watchparty), participants array, video URLs
3. **Message Model**: Chat messages linked to rooms and users with type indicators (text/gif/system)

**Real-time Communication:**
- WebSocket server on `/ws` path with token-based authentication
- Room-based message broadcasting (messages only sent to room participants)
- Heartbeat mechanism (30s intervals) to detect disconnected clients
- Event types: message, user_joined, user_left, mode_changed, ownership_transferred, room_updated

**Authentication Flow:**
1. Login via POST `/api/auth/login` returns JWT token in HTTP-only cookie
2. Token validated on protected routes via `authenticateToken` middleware
3. Admin routes protected with additional `requireAdmin` middleware
4. WebSocket connections authenticated via token query parameter

### External Dependencies

**Database:**
- MongoDB (local or cloud-hosted via `MONGODB_URI` environment variable)
- Mongoose ODM for schema definition and queries
- Connection managed in `backend/db.ts` with error handling and reconnection logic

**Third-party Services:**
- **YouTube Embed API**: For watch party video playback with iframe embedding
- **Google Fonts**: Inter and JetBrains Mono fonts loaded via CDN

**UI Component Library:**
- **Radix UI** primitives for accessible, unstyled components (dialogs, dropdowns, etc.)
- **shadcn/ui** configuration for styled component variants
- Tailwind CSS for utility-first styling with custom design tokens

**Development Tools:**
- **Vite plugins**: Runtime error overlay, Replit cartographer (dev mode), dev banner
- **Drizzle Kit**: Database migration tooling (configured but using Mongoose for actual ORM)
- **esbuild**: Production server bundling

**Authentication & Security:**
- JWT tokens (jsonwebtoken) with 7-day expiration
- bcrypt for password hashing (10 salt rounds)
- Cookie-parser for session management
- CORS handled through Vite proxy in development

**Real-time Communication:**
- **ws (WebSocket)** library for bidirectional client-server communication
- Custom room-based message routing and connection management
- Automatic reconnection logic on client side

**Note on Database Configuration:**
The codebase shows Drizzle configuration files (`drizzle.config.ts`) pointing to PostgreSQL, but the actual implementation uses MongoDB with Mongoose. This suggests either:
- A migration path from PostgreSQL to MongoDB
- Unused configuration files from template setup
- Future intention to support multiple database backends