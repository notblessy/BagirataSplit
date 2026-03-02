# Bagirata iOS Reference Document

> Reference documentation for implementing the Bagirata iOS app features in React Native.
> Source: `/Users/blesi/projects/Bagirata/`

---

## Table of Contents

1. [App Overview](#1-app-overview)
2. [Navigation Architecture](#2-navigation-architecture)
3. [Screen Inventory & Layouts](#3-screen-inventory--layouts)
4. [UX Flows](#4-ux-flows)
5. [Data Schema](#5-data-schema)
6. [API Reference](#6-api-reference)
7. [Features Checklist](#7-features-checklist)
8. [UI Components Library](#8-ui-components-library)
9. [Color System & Styling](#9-color-system--styling)
10. [State Management](#10-state-management)
11. [Currencies](#11-currencies)
12. [Ads Integration](#12-ads-integration)

---

## 1. App Overview

**Bagirata** is an expense-splitting/bill-splitting app. Users scan receipts via camera or upload photos, the app uses OCR + backend AI to extract line items, then users assign items to friends and generate a payment split with bank transfer details. Splits can be shared via link, organized into groups, and viewed in history.

**Core Value Prop**: Scan receipt → Review items → Assign to friends → Share split with bank info

---

## 2. Navigation Architecture

### Root Flow

```
App Entry
└─ RootView (Auth Gate)
   ├─ Loading → Spinner ("Loading...")
   ├─ Not Authenticated → LoginView
   └─ Authenticated → ContentView (Main App)
```

### Main App (ContentView) - 3 Tabs + Result Flow Overlay

```
ContentView
├─ TabView (Bottom Navigation - 3 tabs)
│   ├─ Tab 1: HomeView (Home/Dashboard)
│   ├─ Tab 2: BagirataTabView (History + Groups)
│   └─ Tab 3: ProfileView (Profile + Friends)
│
└─ Result Flow Overlay (Full-screen, appears on scan/upload)
    ├─ Step 1: ScanResultView (Review scanned items)
    ├─ Step 2: AssignView (Assign items to people)
    └─ Step 3: SplitView (Final breakdown + Share)
```

### Tab Enum

```
MainTab: home | bagirata | profile
```

### Sub-Tab Enum (Result Flow Steps)

```
SubTabs: review | assign | split
```

### BagirataTab Internal Navigation (Stack-based)

```
BagirataTabView
├─ History List (default)
├─ → GroupsView (Groups list)
│   └─ → GroupDetailView (Single group)
└─ → HistoryDetailView (Full-screen cover, by slug)
```

---

## 3. Screen Inventory & Layouts

### 3.1 HomeView (Tab 1 - Dashboard)

**Purpose**: Main dashboard with quick actions and recent splits

**Layout** (ScrollView > VStack):
- **Nav Bar**: Title "Hello, {displayName}" (large) | Leading: + button (new empty split) | Trailing: Profile avatar
- **Create Bagirata Card** (white card, rounded 20px, shadow):
  - Title: "Create Bagirata"
  - Two buttons side-by-side:
    - "Scan" (filled blue) → Opens camera scanner
    - "Upload" (outlined blue) → Opens photo picker
- **Recent Bagirata Section**:
  - Header: "Recent" + "See All" link
  - States:
    - Not logged in → Lock icon + "Log in to view history" + CTA
    - Empty → Book icon + "No bagirata yet"
    - Has data → List of up to 5 `BagirataCard` items
  - Each card tap → HistoryDetailView (fullScreenCover)

---

### 3.2 BagirataTabView (Tab 2 - History)

**Purpose**: Full history list with search, pagination, groups entry

**Layout** (NavigationStack > List):
- **Groups Entry Card** → Button navigating to GroupsView
- **Search Bar** (in navigation bar drawer, real-time filtering)
- **History List**:
  - `BagirataCard` rows
  - Swipe-to-delete (destructive red)
  - "Load More" button at bottom (pagination, size=10)
  - Pull-to-refresh
- **Not Logged In State**: Book icon + message + "Log In" button

---

### 3.3 ProfileView (Tab 3)

**Purpose**: User info, friends management, account settings

**Layout** (NavigationStack > List):

**Logged-In State**:
- **Profile Card Section**:
  - Avatar (80x80 circular, photo or gradient+initials)
  - Name + Email
  - Tap → EditProfileView
- **Friends Section**:
  - List of local friends (avatar 40x40, name, "(You)" badge if self, date)
  - Swipe-to-delete
  - Tap friend → EditFriend sheet
  - Plus (+) button → AddFriend sheet

**Not Logged-In State**:
- Person icon + "Not Logged In" + "Log in to save and share" + "Log In" button

---

### 3.4 LoginView

**Layout** (VStack in NavigationStack):
- Lock icon (large)
- "Welcome Back" title
- "Log in to continue" subtitle
- Email TextField (gray bg, rounded 10px)
- Password SecureField (same style)
- Error message (red text, conditional)
- Login button (blue, full width, shows spinner when loading, disabled if empty)
- "Don't have an account?" + "Register" link → RegisterView sheet
- X button in toolbar to dismiss

---

### 3.5 RegisterView

**Layout** (ScrollView > VStack):
- Same styling as LoginView
- Fields: Name, Email, Password, Confirm Password
- Password mismatch validation (red text under field)
- Register button
- "Already have an account?" + "Log In" link

---

### 3.6 EditProfileView

**Layout** (Form with sections):
- **Avatar Section**: 80x80 circular photo, tap to change via PhotosPicker → AvatarCropView
- **Profile Section**: Name TextField (editable), Email (read-only)
- **Actions Section**: "Log Out" button, "Delete Account" button (destructive red)
- Toolbar: "Save" button (disabled if name empty)
- Loading overlay when saving

---

### 3.7 ScanResultView (Result Flow Step 1 - Review)

**Purpose**: Review OCR results, add/edit items and friends

**Layout** (List in NavigationStack):
- **Header Card** (white, rounded, shadow):
  - Editable title TextField (split name)
  - Date with calendar icon
  - Divider
  - "TOTAL AMOUNT" label with formatted total
- **Friends Section** (horizontal scroll):
  - Friend avatars (55x55) with names
  - Plus (+) button → FriendSheet
- **Items Section**:
  - List of scanned items (name, qty, price, currency)
  - Discount display (orange) with strikethrough original price
  - Swipe-to-delete
  - "Add Item" button → AddItem sheet
- **Other Payments Section** (tax, service charge, etc.):
  - Similar row structure
  - "Add Other Payment" button → AddOtherItem sheet
- **Toolbar**:
  - Left: Trash icon (delete all with confirmation)
  - Center: Currency selector (dropdown menu)
  - Right: "Continue" button (disabled if no items or no friends)

---

### 3.8 AssignView (Result Flow Step 2 - Assign)

**Purpose**: Assign each item to specific friends, add bank info

**Layout** (List in NavigationStack):
- **Header Card** (same as ScanResultView)
- **Transfer Section**:
  - Empty: "Transfer" label + "Add Bank" button
  - Filled: Bank name, number, account name (tap to edit)
  - → AddBank sheet
- **Items Section**:
  - Status indicator per item:
    - Red exclamation = No friends assigned
    - Orange clock = Partially assigned
    - Green checkmark = Fully assigned
  - Shows qty/price, discount, assigned friend badges
  - Tap → AssignItem sheet
- **Other Payments** (if any)
- **Toolbar**:
  - Left: Back arrow
  - Right: "Continue" button → SplitView

---

### 3.9 SplitView (Result Flow Step 3 - Split)

**Purpose**: Final split summary, bank details, share

**Layout** (GeometryReader > ScrollView > VStack):
- **Header Card** (title, date, total amount)
- **Bank Information Card** (if bank info provided):
  - "Transfer Information" label
  - Bank name, number, account name
  - Copy button (changes to "Copied!" for 1.5s with green border)
- **Split Breakdown Section**:
  - Header with people count badge
  - **ParticipantCard** per friend (expandable):
    - Avatar + name + "(You)" badge
    - Total amount
    - Item count
    - Expand: detailed item breakdown + other charges
  - Self is listed first
- **Add to Group** (if logged in): Group picker dropdown (filters by matching currency)
- **Toolbar**:
  - Left: Menu (Back to Assign | Edit Items & Friends | Edit Assignments)
  - Right: "Share" button (or spinner)
- **Share Flow**: Save to API → Copy link to clipboard → Success alert → Close result flow → Show interstitial ad

---

### 3.10 HistoryDetailView

**Purpose**: View previously created split (read-only or editable)

**Layout**: Same structure as SplitView with:
- Banner ad at top
- HistoryParticipantCard (slightly different styling)
- Group picker
- Toolbar: X to close (read-only) or Menu with edit options
- Right: "Share" button

---

### 3.11 GroupsView

**Purpose**: List and manage groups

**Layout** (NavigationStack > List):
- Not authenticated → ContentUnavailableView
- No groups → Empty state ("No groups yet")
- List of groups: name + split count subtitle
- Swipe-to-delete
- Toolbar: Plus (+) → CreateGroupSheet

---

### 3.12 GroupDetailView

**Purpose**: Group summary with aggregated participant totals

**Layout** (ScrollView > VStack):
- **Group Header Card**: Name (bold), split count, tap → EditGroupSheet
- **Bank Info Card**: Bank details or placeholder, tap → EditGroupSheet
- **View Bagiratas Button**: Shows split count, navigates to list
- **Participants Summary**: Sorted by name, avatar + name + aggregated total
- **Toolbar**: Share link button (generates/copies group share link)

---

## 4. UX Flows

### 4.1 Core Flow: Create a Split (Scan)

```
1. HomeView → Tap "Scan" button
2. ScannerView (camera opens, VNDocumentCameraViewController)
3. Camera scans receipt → TextRecognizer extracts text
4. Text sent to POST /v1/recognize → Returns structured items
5. Result Flow overlay appears (slides from right)
6. ScanResultView (Review):
   - Review extracted items (edit name/qty/price)
   - Add missing items manually
   - Add friends (from local DB or create new)
   - Set currency
   - Tap "Continue"
7. AssignView (Assign):
   - Add bank transfer info
   - Tap each item → AssignItem sheet
   - Choose "Split Equally" or manual qty assignment
   - All items must be fully assigned (green check)
   - Tap "Continue"
8. SplitView (Split):
   - Review per-person breakdown
   - Copy bank details
   - Optionally add to group
   - Tap "Share"
9. POST /v1/splits saves the split
10. Link copied to clipboard
11. Success alert shown
12. Result flow closes → Back to HomeView
13. Interstitial ad shown (if available)
14. History refreshes via NotificationCenter
```

### 4.2 Core Flow: Create a Split (Upload)

```
Same as Scan flow but:
1. HomeView → Tap "Upload" button
2. PhotosPicker opens (select image from library)
3. Selected image processed by TextRecognizer
4. Rest of flow identical from step 4
```

### 4.3 Core Flow: Create Empty Split

```
1. HomeView → Tap "+" button in nav bar
2. Result Flow opens with empty SplitItem
3. User manually adds all items and friends
4. Rest of flow identical from step 6
```

### 4.4 View Existing Split

```
A. From Home:
   HomeView → Tap BagirataCard → HistoryDetailView (fullScreenCover)

B. From History Tab:
   BagirataTabView → Tap card → HistoryDetailView (fullScreenCover by slug)

C. From Group:
   GroupDetailView → View Bagiratas → Tap card → HistoryDetailView
```

### 4.5 Edit Existing Split

```
HistoryDetailView → Toolbar Menu:
  - "Edit Items & Friends" → Opens ScanResultView with loaded data
  - "Edit Assignments" → Opens AssignView with loaded data
  - Re-save creates updated split
```

### 4.6 Authentication Flow

```
1. App Launch → RootView checks Keychain for token
2. If token found:
   - Set isAuthenticated = true
   - GET /v1/auth/me to fetch user profile
   - If 401 → logout (clear token)
   - If success → show ContentView
3. If no token:
   - Show LoginView
4. Login:
   - POST /auth/login → Save token to Keychain → Fetch profile → Show ContentView
5. Register:
   - POST /auth/register → Same as login flow
6. Logout:
   - Delete token from Keychain → Clear user data → Show LoginView
```

### 4.7 Friends Management Flow

```
ProfileView:
  - View all friends (SwiftData local query)
  - Tap "+" → AddFriend sheet (name only, auto-generates color)
  - Tap friend → EditFriend sheet
  - Swipe → Delete friend

During Split Creation (ScanResultView):
  - Tap "+" in friends section → FriendSheet
  - Shows existing friends + option to create new
  - Selected friends added to current split
```

### 4.8 Groups Flow

```
1. BagirataTabView → Tap Groups card → GroupsView
2. GroupsView → Tap "+" → CreateGroupSheet:
   - Name, bank info, currency
3. GroupsView → Tap group → GroupDetailView:
   - View summary, participants, totals
   - Edit group details
   - View all bagiratas in group
   - Share group link
4. SplitView → Add to Group dropdown:
   - Associates split with a group (must match currency)
```

### 4.9 Profile Edit Flow

```
ProfileView → Tap profile card → EditProfileView:
  - Change avatar (PhotosPicker → AvatarCropView with pinch/drag)
  - Change name
  - Save → PATCH /v1/auth/me
  - Log Out → Clear session
  - Delete Account → DELETE /v1/auth/me with confirmation
```

---

## 5. Data Schema

### 5.1 Local Models (SwiftData → equivalent for local DB)

#### Friend
```typescript
interface Friend {
  id: string           // UUID
  name: string
  me: boolean          // Is this the current user?
  accentColor: string  // Hex color (e.g., "#FF5733")
  createdAt: Date
}
```

#### Bank
```typescript
interface Bank {
  id: string           // UUID
  name: string         // Bank name (e.g., "BCA", "Mandiri")
  number: string       // Account number
  accountName: string  // Account holder name
  createdAt: Date
}
```

### 5.2 Split Item Models (In-memory during split creation)

#### SplitItem (Main container during creation flow)
```typescript
interface SplitItem {
  id: string                    // UUID
  name: string                  // Split name (e.g., "Lunch at Restaurant")
  status: string
  friends: AssignedFriend[]
  items: AssignedItem[]
  otherPayments: OtherItem[]
  currency: Currency
  createdAt: Date
}
// Computed: subTotal(), grandTotal(), itemTotal(), otherTotal()
// Computed: hasUnassignedItem(), friendNames()
```

#### AssignedItem
```typescript
interface AssignedItem {
  id: string                      // UUID
  name: string                    // Item name
  qty: number                     // Quantity
  price: number                   // Unit price
  equal: boolean                  // True if split equally among friends
  friends: AssignedFriend[]       // Friends assigned to this item
  discount: number                // Discount amount (default 0)
  discountIsPercentage: boolean   // Is discount a percentage? (default false)
  createdAt: Date
}
// Computed: subTotal() = qty * price - discountAmount
// Computed: baseSubTotal() = qty * price
// Computed: discountAmount() = discountIsPercentage ? baseSubTotal * discount/100 : discount
// Computed: getTakenQty() = sum of all friend qtys
// Methods: assignFriend(), equalAssign(), unEqualAssign()
```

#### AssignedFriend
```typescript
interface AssignedFriend {
  id: string           // UUID
  friendId: string     // References Friend.id
  name: string
  me: boolean
  accentColor: string
  qty: number          // Quantity assigned to this friend
  subTotal: number     // Amount this friend pays for the item
  createdAt: Date
}
```

#### OtherItem (Tax, Service Charge, Discount, Addition)
```typescript
interface OtherItem {
  id: string
  name: string                // e.g., "PB1 Tax", "Service Charge"
  type: PaymentType           // "addition" | "deduction" | "tax" | "discount"
  usePercentage: boolean      // If true, amount is a percentage
  amount: number              // Value (percentage or fixed)
  createdAt: Date
}
// Computed: subTotal()
// Computed: isDeduction(), isTax(), isDiscount(), isServiceCharge()
```

#### PaymentType Enum
```typescript
type PaymentType = "addition" | "deduction" | "tax" | "discount"
```

### 5.3 Splitted Models (Final result, sent to API and stored)

#### Splitted
```typescript
interface Splitted {
  id: string
  slug: string
  name: string
  bankName: string
  bankAccount: string
  bankNumber: string
  createdAt: string          // ISO8601
  subTotal: number
  grandTotal: number
  friends: SplittedFriend[]
  currencyCode: string       // e.g., "IDR"
  originalSplitItemData?: string  // Encoded SplitItem for re-editing
  groupId?: string           // Optional group reference
}
```

#### SplittedFriend
```typescript
interface SplittedFriend {
  id: string
  friendId: string
  name: string
  accentColor: string
  total: number              // Final total this friend owes
  subTotal: number           // Subtotal before other charges
  items: FriendItem[]
  others: FriendOther[]
  me: boolean
  createdAt: string          // ISO8601
}
```

#### FriendItem
```typescript
interface FriendItem {
  id: string
  name: string
  price: number              // Unit price
  qty: number                // Quantity assigned
  equal: boolean
  friendSubTotal: number     // Amount after discount
  discount: number
  discountIsPercentage: boolean
}
// Computed: formattedQuantity(), splittedPrice(), baseSubTotal(), discountAmount()
```

#### FriendOther
```typescript
interface FriendOther {
  id: string
  name: string
  amount: number             // Percentage or amount value
  price: number              // Calculated price
  type: string               // "tax" | "addition" | "deduction" | "discount"
  usePercentage: boolean
}
// Computed: hasFormula(), getFormula(), getPrice()
```

### 5.4 API Response Models

#### User
```typescript
interface User {
  id: string
  email: string
  name: string
  avatar?: string            // Base64 compressed image
}
```

#### AuthResponse
```typescript
interface AuthResponse {
  success: boolean
  message: string
  data: {
    token: string
    user: User
  }
}
```

#### BagirataSummary (History list item)
```typescript
interface BagirataSummary {
  id: string
  name: string
  slug?: string
  grandTotal: number
  createdAt: string          // ISO8601/RFC3339
  friendCount: number
  currencyCode?: string
}
```

#### ListSplitsResponse
```typescript
interface ListSplitsResponse {
  success: boolean
  message: string
  data: BagirataSummary[]
}
```

#### GroupListItem
```typescript
interface GroupListItem {
  id: string
  name: string
  bankName?: string
  bankAccount?: string
  bankNumber?: string
  shareSlug?: string
  createdAt: string
  splitCount?: number
  currencyCode?: string
}
```

#### GroupSummary
```typescript
interface GroupSummary {
  id: string
  name: string
  currencyCode?: string
  bankName?: string
  bankAccount?: string
  bankNumber?: string
  shareSlug?: string
  participants: GroupSummaryParticipant[]
  splits: GroupSummarySplit[]
}

interface GroupSummaryParticipant {
  friendId: string
  name: string
  accentColor?: string
  me: boolean
  total: number
}

interface GroupSummarySplit {
  id: string
  slug: string
  name: string
  grandTotal: number
  createdAt: string
}
```

#### GroupDetail
```typescript
interface GroupDetail {
  id: string
  name: string
  currencyCode?: string
  bankName?: string
  bankAccount?: string
  bankNumber?: string
  shareSlug?: string
  createdAt: string
  splits: GroupSummarySplit[]
}
```

### 5.5 Grand Total Calculation Logic

```
1. itemTotal = SUM(each item's subTotal)
   where item.subTotal = (qty * price) - discountAmount

2. For each otherPayment:
   - if type == "addition" && !usePercentage → add amount
   - if type == "deduction" && !usePercentage → subtract amount
   - if type == "tax" && usePercentage → add (itemTotal * amount/100)
   - if type == "discount" && usePercentage → subtract (itemTotal * amount/100)
   - if type == "discount" && !usePercentage → subtract amount

3. grandTotal = itemTotal + otherPaymentsTotal
```

### 5.6 Per-Friend Split Calculation

```
For each friend:
1. friendItemSubTotal = SUM(each assigned item's friend portion)
   where friendPortion = (friendQty / totalQty) * item.subTotal
2. friendOtherTotal = proportional share of each otherPayment
   based on (friendItemSubTotal / totalItemSubTotal) ratio
3. friendTotal = friendItemSubTotal + friendOtherTotal
```

---

## 6. API Reference

### Base Configuration

| Env | Base URL |
|-----|----------|
| Development | `http://localhost:3000` |
| Staging | `https://staging.bagirapi.notblessy.com` |
| Production | `https://bagirapi.notblessy.com` |

**Default Headers**: `Content-Type: application/json`
**Auth Header**: `Authorization: Bearer {token}`
**Timeout**: 30 seconds

### 6.1 Authentication

#### POST /auth/login
```
Request:  { email: string, password: string }
Response: { success: bool, message: string, data: { token: string, user: User } }
```

#### POST /auth/register
```
Request:  { email: string, password: string, name: string }
Response: Same as login
Status:   200/201=success, 400=invalid format, 409=email exists, 500+=error
```

#### GET /v1/auth/me
```
Auth:     Required
Response: { success: bool, message: string, data: User }
```

#### PATCH /v1/auth/me
```
Auth:     Required
Request:  { name?: string, avatar?: string (base64) }
Response: { success: bool, message: string, data: User }
```

#### DELETE /v1/auth/me
```
Auth:     Required
Response: 200 on success
```

### 6.2 Recognition (OCR)

#### POST /v1/recognize
```
Request:  { model: string }  (ML model identifier / extracted text)
Response: { success: bool, message: string, data: SplitItem }
```

### 6.3 Splits

#### GET /v1/splits
```
Auth:     Required
Query:    ?page={int}&size={int}&search={string}
Response: { success: bool, message: string, data: BagirataSummary[] }
```

#### GET /v1/splits/:slug
```
Auth:     NOT required (public)
Response: { success: bool, message: string, data: Splitted }
```

#### POST /v1/splits
```
Auth:     Optional (included if available)
Request:  Splitted object (full JSON body)
Response: { success: bool, message: string, data: string (slug) }
```

#### DELETE /v1/splits/:id
```
Auth:     Required
Response: 200=success, 401=unauthorized, 404=not found
```

### 6.4 Groups

#### GET /v1/groups
```
Auth:     Required
Response: { success: bool, message: string, data: GroupListItem[] }
```

#### POST /v1/groups
```
Auth:     Required
Request:  { name: string, bankName?: string, bankAccount?: string,
            bankNumber?: string, currencyCode?: string }
Response: { success: bool, message: string, data: GroupCreateData }
```

#### GET /v1/groups/:id
```
Auth:     Required
Response: { success: bool, message: string, data: GroupDetail }
```

#### GET /v1/groups/:id/summary
```
Auth:     Required
Response: { success: bool, message: string, data: GroupSummary }
```

#### PATCH /v1/groups/:id
```
Auth:     Required
Request:  { name?: string, bankName?: string, bankAccount?: string,
            bankNumber?: string, currencyCode?: string, generateShareSlug?: bool }
Response: { success: bool, message: string, data: GroupDetail }
```

#### DELETE /v1/groups/:id
```
Auth:     Required
Response: 200 on success
```

---

## 7. Features Checklist

### Authentication
- [ ] Login (email + password)
- [ ] Register (name + email + password + confirm password)
- [ ] Token persistence (secure storage)
- [ ] Auto-login on app launch (restore token → fetch profile)
- [ ] Logout
- [ ] Delete account (with confirmation)
- [ ] Profile view (avatar, name, email)
- [ ] Edit profile (name, avatar with crop)
- [ ] Handle 401 unauthorized (auto-logout)

### Receipt Scanning & OCR
- [ ] Camera scanner (document camera)
- [ ] Photo upload from gallery
- [ ] On-device text recognition (Vision/ML Kit)
- [ ] Send text to backend for structured extraction (POST /v1/recognize)
- [ ] Loading state during recognition ("Scanning Text...")

### Split Creation (Result Flow)
- [ ] Step 1 - Review (ScanResultView):
  - [ ] Editable split name
  - [ ] Display date and total
  - [ ] Friends horizontal scroll with avatars
  - [ ] Add/remove friends
  - [ ] Items list with qty, price, discount
  - [ ] Add/edit/delete items (sheet modals)
  - [ ] Other payments (tax, discount, service charge, addition, deduction)
  - [ ] Add/edit/delete other payments
  - [ ] Currency selector
  - [ ] Delete all (trash with confirmation)
- [ ] Step 2 - Assign (AssignView):
  - [ ] Bank transfer info (add/edit)
  - [ ] Per-item assignment status (red/orange/green indicators)
  - [ ] Assign item sheet with "Split Equally" toggle
  - [ ] Manual qty assignment per friend with +/- buttons
  - [ ] Remaining qty display
  - [ ] Validation: all items must be assigned
- [ ] Step 3 - Split (SplitView):
  - [ ] Header with title, date, total
  - [ ] Bank transfer card with copy-to-clipboard
  - [ ] Per-participant expandable breakdown card
  - [ ] Item details (qty, price, discount, subtotal)
  - [ ] Other charges per person
  - [ ] Add to group (picker, filtered by currency)
  - [ ] Share button → Save to API → Copy link → Success alert
  - [ ] Back/Edit menu options

### History
- [ ] List all splits (paginated, size=10)
- [ ] Search splits by name
- [ ] Pull-to-refresh
- [ ] Load more (pagination)
- [ ] View split detail (HistoryDetailView)
- [ ] Delete split (swipe-to-delete with confirmation)
- [ ] Edit existing split (re-open in result flow)
- [ ] Copy share link for existing split
- [ ] Empty state handling (not logged in / no data)

### Friends Management
- [ ] List friends (from local DB)
- [ ] Add friend (name only, auto-generate accent color)
- [ ] Edit friend
- [ ] Delete friend (swipe-to-delete)
- [ ] "Me" friend (self-identification)
- [ ] Friend selection during split creation
- [ ] Avatar with initials + accent color

### Groups
- [ ] List groups
- [ ] Create group (name, bank info, currency)
- [ ] View group detail
- [ ] Group summary (aggregated participant totals)
- [ ] Edit group (name, bank info, currency, share slug)
- [ ] Delete group (with confirmation)
- [ ] View bagiratas in group
- [ ] Share group link
- [ ] Associate split with group (from SplitView)

### UI Components
- [ ] Custom tab bar (3 tabs)
- [ ] BagirataCard (reusable split card)
- [ ] BagirataAvatar (circular initials with color)
- [ ] BagirataAvatarGroup (overlapping avatars)
- [ ] ParticipantCard (expandable)
- [ ] InputText component
- [ ] ItemRowView (with status indicators)
- [ ] Copy button with "Copied!" feedback
- [ ] Sheet modals with presentation detents
- [ ] Confirmation dialogs for destructive actions
- [ ] Loading spinners (full screen, button, toolbar)
- [ ] Empty states with icons and CTAs
- [ ] Error state displays

### Other
- [ ] Multi-currency support (14 currencies)
- [ ] Currency formatting per locale
- [ ] Slug generation for sharing
- [ ] NotificationCenter equivalent for cross-component refresh
- [ ] Random color generation for avatars
- [ ] Deep link handling (share links)

---

## 8. UI Components Library

### BagirataCard
- White card with subtle shadow
- Document icon in colored circle
- Title (bold), formatted date, participant count
- Total amount in primary blue (right-aligned)
- Tap handler

### BagirataAvatar
- Circular badge with initials (first letter of name)
- Configurable: width, height, fontSize, backgroundColor (hex)
- Styles: plain | active (green border) | inactive (gray border)
- Shows photo if available (User avatar)

### BagirataAvatarGroup
- Overlapping horizontal stack of BagirataAvatar
- Configurable overlap offset
- Used in lists and cards

### ParticipantCard (SplitView)
- Expandable card
- Collapsed: Avatar + name + "(You)" + total + item count
- Expanded: Divider + list of CompactItemRow + Other charges
- Smooth expand/collapse animation (easeInOut 0.3s)

### CompactItemRow (inside ParticipantCard)
- Quantity badge (rounded bg)
- Item name
- Price with discount indicator (strikethrough + final price)

### ItemRowView (AssignView)
- Status circle (red/orange/green)
- Item name + qty + price
- Discount info (orange text)
- Assigned friends avatars
- Subtotal

### InputText
- TextField wrapper
- Border styles: success (blue), error (red), default (light gray)
- Optional label
- 10px corner radius

### Copy Button
- Tap to copy text to clipboard
- Changes to "Copied!" with green border for 1.5 seconds
- Returns to default state automatically

---

## 9. Color System & Styling

### Brand Colors
```
Primary Blue:      #4994CF (main CTAs, highlights, active states)
OK Blue:           #4A93CF (confirmation, success actions)
White:             #F9F9F9 (backgrounds)
Dimmed:            #CACED0 (secondary text, disabled)
Dimmed Light:      #F4F4F4 (light backgrounds, cards)
Link Blue:         #1971c2 (link text)
Secondary Text:    #868e96 (muted text, captions)
Error Red:         #FADAD6 (error backgrounds)
Danger Red:        Destructive button color
```

### Avatar Color Palette (Random Generation)
Pre-defined set of harmonious colors assigned randomly to friends.

### Typography
- Large Titles: System bold (nav bar titles)
- Headlines: System semibold (section headers)
- Body: System regular
- Captions: System small (dates, labels)
- Monospaced Digits: For amounts (consistent width)

### Spacing & Layout
- Standard padding: 16px
- Item padding: 8-12px
- Card corner radius: 10-20px (mostly 12px)
- Card shadow: black @ 5-8% opacity, radius 4-8
- Dividers: separator color @ 50-70% opacity

### Animations
- Result flow transition: slide from right (`.move(edge: .trailing)`)
- Tab switch: spring (response 0.3, damping 0.7)
- Card expand/collapse: easeInOut 0.3s
- Button press: 0.95 scale
- Copy feedback: smooth color transition

---

## 10. State Management

### AuthState (Global Observable)
```typescript
// Equivalent to React Context or Zustand store
interface AuthState {
  isAuthenticated: boolean
  currentUser: User | null
  token: string | null
  isLoading: boolean
  errorMessage: string | null
}
// Actions: login(), register(), fetchUserProfile(), logout()
// Token stored in Keychain (→ SecureStore/EncryptedStorage in RN)
```

### ContentView State (Main App)
```typescript
interface ContentViewState {
  selectedTab: MainTab           // home | bagirata | profile
  showScanner: boolean
  showResultFlow: boolean
  currentSubTab: SubTabs         // review | assign | split
  split: SplitItem               // Current split being created/edited
  splitted: Splitted             // Final computed split result
  scannerResultActive: boolean
}
```

### AssignViewModel
```typescript
interface AssignViewModel {
  bankForm: Bank
  selectedItem: AssignedItem | null
  showBankSheet: boolean
  showAssignItemSheet: boolean
  isProcessing: boolean
}
```

### Local Data (SwiftData → AsyncStorage/SQLite/WatermelonDB)
- Friends list (persisted locally)
- Bank info (persisted locally)
- Draft splits (persisted locally)
- Completed splits (persisted locally + synced to API)

### Cross-Component Communication
- iOS uses `NotificationCenter.default.post(name: .bagirataRefreshHistory)`
- RN equivalent: EventEmitter, Zustand subscription, or React Context update

---

## 11. Currencies

```typescript
enum Currency {
  IDR = "IDR",  // Indonesian Rupiah - 0 decimals, "." grouping, "," decimal
  JPY = "JPY",  // Japanese Yen - 0 decimals
  CNY = "CNY",  // Chinese Yuan - 2 decimals
  KRW = "KRW",  // South Korean Won - 0 decimals
  USD = "USD",  // US Dollar - 2 decimals
  SGD = "SGD",  // Singapore Dollar - 2 decimals
  MYR = "MYR",  // Malaysian Ringgit - 2 decimals
  THB = "THB",  // Thai Baht - 2 decimals
  PHP = "PHP",  // Philippine Peso - 2 decimals
  VND = "VND",  // Vietnamese Dong - 0 decimals
  MMK = "MMK",  // Myanmar Kyat - 0 decimals
  BND = "BND",  // Brunei Dollar - 2 decimals
  KHR = "KHR",  // Cambodian Riel - 0 decimals
  LAK = "LAK",  // Lao Kip - 0 decimals
}

// Currency symbols and formatting rules per currency
// Default currency stored in user preferences
```

---

## 12. Ads Integration

### Google Mobile Ads (AdMob)
- **Banner Ads**: Displayed at top of HistoryDetailView
- **Interstitial Ads**: Shown after sharing a split (SplitView)
- **Initialization**: In AppDelegate on app launch
- **Ad Unit IDs**: Configured per environment

### Ad Placement Rules
- Banner: Non-intrusive, top of read-only detail views
- Interstitial: After completing a split share action (natural break point)
- No ads during active creation flow (scan → review → assign → split)

---

## Appendix: Sheet Modal Heights

| Sheet | Height |
|-------|--------|
| AddItem | 400px |
| EditItem | 400px |
| AddOtherItem | 300px |
| EditOtherItem | 300px |
| AddFriend | 250px |
| EditFriend | 250px |
| AddBank | 400px |
| Me (Initial Setup) | 500px |
| AssignItem | 600px |
| FriendSheet | Medium (50%) |
| CreateGroupSheet | Auto |
| EditGroupSheet | Auto |
| LoginView | Full Sheet |
| RegisterView | Full Sheet |
