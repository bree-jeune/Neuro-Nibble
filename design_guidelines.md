# NeuroNibble™ Mobile App - Design Guidelines (Compacted)

## Core Architecture

### Authentication & Data
- **No auth in MVP** - Local-first, single-user app using AsyncStorage
- **Profile required**: Avatar presets (3-4 soft, calming options), optional display name, app preferences (theme, notifications, timer sounds, haptics)
- Future-proof for optional cloud sync (invisible in MVP)

### Navigation: 4 Tabs + FAB

1. **Home** (house): Daily dashboard, energy selector, recent tasks (3), Weekly Room context, bookends
2. **Tasks** (list): All NeuroNibbles with micro-steps, energy filters, "Save Your Spot" indicators
3. **Reflect** (edit): Brain Dump, Dopamine Menu, Weekly Room selector
4. **Profile** (user): Avatar, settings, gentle progress insights

**FAB** (center, elevated): "Break It Down" action - Rounded square 56x56px, dusty teal, shadow (0,2,0.10,2)

## Screen Layouts

### Safe Area Insets
- **Transparent headers**: Top = `headerHeight + 32px`, Bottom = `tabBarHeight + 32px`
- **Modal/opaque headers**: Top = `32px`, Bottom = `insets.bottom + 32px`

### 1. Home (Dashboard)
- **Header**: Date format "Friday, feeling okay" (left), settings gear (right)
- **Content**: Energy cards (3 large, Low/Medium/High) → Weekly Room badge → Recent tasks (3) → Daily Bookend prompt
- **Components**: Soft CTA buttons ("Resume"), permission microcopy

### 2. Tasks (All NeuroNibbles)
- **Header**: Title "Your Bites", filter icon (no search)
- **Content**: FlatList of expandable cards (title, progress "2/6 bites", energy tag, left border 4px energy color)
- **Interaction**: Tap to expand micro-steps, single-tap to complete, swipe-to-delete (confirm)

### 3. Break It Down (Full-screen Modal)
- **Header**: Cancel (left), "Break It Down" title, Save (right, disabled until task name entered)
- **Content**: Task name input ("What's freezing you?") → Micro-step builder (add step, 2-10min stepper, reorderable list) → Energy selector → Permission text
- **Gestures**: Drag-to-reorder steps

### 4. Reflect
- **Header**: "Reflect" title, Weekly Room icon (right)
- **Content**: Weekly Room cards (4: Chaos/Gentle/Build/Repair with mantras) → Brain Dump (multiline, min 120px) → Dopamine Menu → One Tiny Thing (evening)

### 5. Profile/Settings
- **Header**: "You" title only
- **Content**: Avatar grid (tappable presets) → Display name → Settings sections (notifications, timers, haptics, theme) → About

## Design System

### Colors
**Light Mode**:
- Primary: `#7B9EA8` (Dusty Teal), Secondary: `#D4B5A0` (Warm Taupe), Accent: `#C9A690` (Terracotta)
- Background: `#F7F4F1`, Surface: `#FFFFFF`
- Text: `#3E3E3E` (Primary), `#6B6B6B` (Secondary)

**Dark Mode**:
- Primary: `#8AAFB8`, Secondary: `#8A7A6B`
- Background: `#1E1E1E`, Surface: `#2A2A2A`
- Text: `#E8E8E8` (Primary), `#A8A8A8` (Secondary)

**Energy Levels**: Low `#A8B4BA`, Medium `#B8A89A`, High `#A8BAA8`

**Weekly Rooms**: Chaos `#C9A690`, Gentle `#B8C9D4`, Build `#A8BAA8`, Repair `#D4C9B8`

### Typography (Inter, fallback system)
- H1: 28px Semi-Bold, H2: 22px Semi-Bold, H3: 18px Medium
- Body: 16px Regular, Caption: 14px, Micro: 12px
- **Line height**: 1.5x, **Letter spacing**: 0.5px
- **Accent font** (Caveat): 16-18px for permission statements/mantras, Text Secondary color

### Spacing
`xs:4, sm:8, md:16, lg:24, xl:32, xxl:48`
**Layout**: 70% white space to prevent overstimulation

### Components

**Buttons**:
- Primary: BG `#7B9EA8`, white text 16px Medium, padding 12/24, radius 12px, press opacity 0.7
- Secondary: Transparent, 1px Primary border, Primary text, press BG Primary 10%
- Text: Transparent, Primary text, press opacity 0.7
- FAB: See Navigation section

**Cards**:
- Standard: Surface BG, 16px padding, 16px radius, no shadow, press BG Secondary 20%
- Weekly Room: Room color BG, 20px padding, 16px radius, Caveat mantra
- Task: Surface BG, 16px padding, 12px radius, 4px left border (energy color), progress indicator

**Inputs**:
- Text: Surface + 5% Primary tint BG, 1px transparent border, focus 2px Primary, 12px padding, 8px radius, 16px font
- Multiline: Same, min 120px height, grows with content

**Lists**: Item spacing 16px, section 32px, no separators, gentle pull-to-refresh

### Visual Principles
1. **Progressive disclosure** - Show only necessary info
2. **Gentle feedback** - Subtle haptics/visuals, no harsh animations
3. **Permission microcopy** - "You're allowed to stop", "That still counts"
4. **No emojis** - Feather icons only (@expo/vector-icons)
5. **No drop shadows** - Except FAB (subtle)
6. **Low contrast** - Never pure black, use `#3E3E3E`
7. **Rounded corners** - 8-16px for softness

### Interactions
- **Feedback**: Buttons opacity 0.7, cards BG change (Secondary 20%), lists highlight (Primary 5%), FAB scale 0.95
- **Animations**: 200-300ms, ease-out, no bounces/elastic
- **Gestures**: Swipe-to-delete (confirm), long-press (context menu), drag-to-reorder

## Accessibility (Critical)

1. **Dyslexia**: Inter font only, 1.5x line height, left-aligned (never justified), 0.5px letter spacing
2. **Low Cognitive Load**: One action/screen, clear hierarchy, short sentences, no jargon/ableist language
3. **ADHD**: Pre-selected defaults, permission to pause, object permanence support, gentle reminders
4. **iOS Standards**: VoiceOver labels, Dynamic Type, high contrast mode, Reduce Motion support

## Assets

**Avatars (3-4)**: Soft abstract shapes (circles, blobs), colors (dusty teal, warm taupe, soft sage, terracotta), minimalist style

**Weekly Room Icons (4)**: Chaos (flame/swirl), Gentle (moon/cloud), Build (stack/plant), Repair (tool/patch) - all rounded, soft

**Energy Icons (3)**: Low (1 wave), Medium (2 waves), High (3 waves) - rounded, never sharp

**System**: Feather icons (home, list, edit, user, settings, plus-circle, check-circle) - never harsh (no lightning/alerts)

## Microcopy Tone

**DO**: "What's freezing you?", "You're allowed to stop", "That still counts", "Less bad is good enough", "Your brain is just loud right now"

**DON'T**: "You got this!", "Stop procrastinating", "Just focus", "Be productive!"

**Examples**: 
- Home: "How's your energy today?" 
- Tasks: "Your bites"
- Reflect: "Dump the heavy stuff"