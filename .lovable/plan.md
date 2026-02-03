

## College Community App - Implementation Plan

### Overview
A clean, minimal college community platform where students can chat together and view their peers. The app uses predefined credentials managed exclusively by admins.

---

### 🔐 Phase 1: Authentication & User Management

**Admin-Only Login System**
- Custom authentication using Supabase with predefined credentials
- Login page with username/password fields (e.g., `20891A1202 / 20891A1202`)
- No self-registration - only admin can create accounts

**Admin Dashboard**
- Create individual student accounts (username + password)
- Bulk import students via CSV/Excel file upload
- View and manage all registered students

**User Roles**
- **Admin**: Can create/import users, moderate content
- **Student**: Can chat and view directory

---

### 💬 Phase 2: Community Chat

**Single Community Chat Room**
- Real-time messaging using Supabase Realtime
- All students share one community space
- Messages show sender name and timestamp
- Clean message bubbles with sender differentiation

**Chat Features**
- Send text messages
- See new messages appear instantly
- Scroll through message history

---

### 👥 Phase 3: Student Directory & Presence

**Student Directory**
- List of all registered students
- Show student name and online status indicator
- Clean, searchable/scrollable list

**Online Status**
- Show green dot for online students
- Gray dot for offline students
- Real-time presence updates using Supabase Presence

---

### 🎨 Phase 4: Design & Polish

**Clean & Minimal UI**
- Professional, distraction-free interface
- Light color scheme with subtle accents
- Responsive design for mobile and desktop

**App Structure**
- Login page (public)
- Main chat area (authenticated)
- Student directory sidebar
- Admin panel (admin-only)

---

### 🔧 Technical Setup Required

**Supabase Connection**
- You'll need to connect your existing Supabase project
- We'll create tables for: users, messages, user sessions
- Set up Row Level Security for data protection
- Enable Realtime for chat and presence features

