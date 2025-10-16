# WatchTogether Design Guidelines

## Design Approach

**Selected Approach:** Hybrid Design System  
Drawing inspiration from **Discord** (real-time chat UX), **Linear** (clean professional interface), and **Twitch** (streaming/watch party features)

**Key Principles:**
- Dark-first design for comfortable viewing experiences
- Clear hierarchy for room controls and permissions
- Seamless mobile-to-desktop responsive patterns
- Real-time feedback for all collaborative actions

---

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary):**
- Background Base: 220 15% 8%
- Surface: 220 15% 12%
- Surface Elevated: 220 15% 16%
- Primary Brand: 250 70% 60% (vibrant purple for CTAs and active states)
- Text Primary: 0 0% 98%
- Text Secondary: 220 10% 65%
- Border: 220 15% 20%
- Success (online): 142 70% 50%
- Warning (owner controls): 38 90% 60%
- Error: 0 70% 60%

**Light Mode (Secondary):**
- Background Base: 220 15% 98%
- Surface: 0 0% 100%
- Primary Brand: 250 70% 55%
- Text Primary: 220 15% 12%
- Text Secondary: 220 10% 45%
- Border: 220 10% 88%

### B. Typography

**Font Families:**
- Primary: 'Inter' (Google Fonts) - UI text, chat, forms
- Monospace: 'JetBrains Mono' - Room codes, technical info

**Hierarchy:**
- Headings: 600-700 weight, tight letter-spacing
- Body: 400-500 weight, comfortable line-height (1.6)
- Chat Messages: 400 weight, 14-16px
- Room Codes/Links: Monospace, 500 weight
- Buttons: 500-600 weight

### C. Layout System

**Spacing Primitives:** Use Tailwind units of **2, 3, 4, 6, 8, 12, 16**
- Micro spacing: p-2, gap-3
- Component spacing: p-4, p-6, gap-4
- Section spacing: p-8, py-12, gap-8
- Page margins: px-4 (mobile), px-8 (desktop)

**Grid System:**
- Mobile: Single column, full-width video/screen
- Tablet: 2-column (video + chat sidebar)
- Desktop: 3-column (sidebar navigation, main video, chat panel)

### D. Component Library

**Navigation:**
- Persistent left sidebar (collapsible on mobile)
- Room list with status indicators (active, owner badge)
- Admin panel access (crown icon for admins)
- User profile dropdown with quick settings

**Room Interface:**
- Full-width video/screen share container (16:9 aspect ratio preserved)
- Floating room controls (only owner sees mode toggle)
- Owner badge and transfer ownership button
- Room invite link with copy-to-clipboard
- Mode indicator (screen share vs watch party)

**Chat System:**
- Fixed right panel (slide-in on mobile)
- Message bubbles with user avatars (32px circle)
- Emoji picker button (inline with input)
- GIF search integration (Giphy)
- Timestamp on hover
- Join/leave notifications (muted style)
- Typing indicators

**Admin Dashboard:**
- Card-based user management grid
- Search and filter controls
- Inline edit for password reset
- Action buttons (edit, delete) with confirmation modals
- User statistics and activity logs

**Forms & Inputs:**
- Consistent input styling with focus states (border: primary color)
- Dark mode inputs with 220 15% 16% background
- Clear validation states (green border for success, red for error)
- Password strength indicators
- Auto-complete for user invites

**Buttons:**
- Primary: Filled with brand color, 500 weight
- Secondary: Outline with border
- Ghost: Transparent with hover background
- Icon buttons: 40px x 40px touch target
- Destructive actions: Red outline/fill

**Data Display:**
- Room cards with thumbnail, title, participant count
- User status pills (online/offline/in-room)
- Owner crown icon (gold 45 90% 55%)
- Admin badge (distinct from owner)

**Modals & Overlays:**
- Centered modals with backdrop blur
- Slide-up drawers on mobile
- Confirmation dialogs for ownership transfer
- Toast notifications for real-time events

### E. Interaction Patterns

**Real-time Feedback:**
- Instant chat message delivery with optimistic UI
- Live participant list updates
- Connection status indicators (pulsing dot)
- Synced video playback indicator

**Mobile Optimizations:**
- Bottom sheet for quick actions
- Swipe gestures (chat drawer, room list)
- Large touch targets (min 44px)
- Sticky video player during scroll
- Collapsible sections to maximize video space

**Animations:** Minimal and purposeful
- Smooth transitions: 150-200ms ease-out
- Chat message slide-in: 100ms
- Modal/drawer: 250ms cubic-bezier
- Avoid animations during video playback (performance)

---

## Images

**Hero Section (Landing/Login):**
- Background: Abstract gradient mesh with screens/devices showing watch party concept
- Overlay: Dark gradient (opacity 70%) for text legibility
- Central focus: WatchTogether logo and tagline

**Admin Dashboard:**
- User avatars: Circular, 48px for list view, 32px for compact
- Empty states: Illustrative graphics for "No rooms" or "No users"

**Room Thumbnails:**
- Video preview or screen share snapshot (16:9)
- Fallback: Gradient background with room initials

**Feature Illustrations:**
- Screen sharing icon: Monitor with sharing symbol
- Watch party icon: Multiple user avatars around play button
- Chat icon: Speech bubbles with emoji