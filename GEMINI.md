# AGENTS.md

This file provides guidance for AI agents when working with this codebase.

## AI Agent Expertise
The AI agent is an **expert in Next.js, TypeScript, Effect-TS, Tailwind CSS, shadcn/ui, and building scalable Next.js solutions**. It specializes in functional programming patterns using Effect, highly performant React Query integration, and premium UI development following minimalist design systems.

## Project Overview

A fitness tracking application built with Next.js 16, TypeScript, Effect-TS, React, and Drizzle ORM. Users can follow workout programs, log sets/reps/weight, track progress, and view analytics.

**Design Philosophy**: We follow [Revolut's design principles](https://www.revolut.com/)—dark-first, radically minimal, premium fintech aesthetics. When building UI, always ask: "How would Revolut design this?" Every UI change must embody their strong UI/UX standards.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Runtime | Bun |
| Database | PostgreSQL + Drizzle ORM |
| Effect System | Effect-TS |
| Styling | Tailwind CSS 4 + Radix UI + shadcn/ui |
| State Management | React Query (client), Effect services (server) |
| Authentication | better-auth + GitHub OAuth |
| Charts | Recharts |

## Commands

```bash
bun dev          # Start development server
bun build        # Build for production
bun db:generate  # Generate Drizzle migrations
bun db:migrate   # Run Drizzle migrations
bun db:push      # Push schema changes directly
bun db:studio    # Open Drizzle Studio
```

## Architecture

### Directory Structure

```
/app                 # Next.js app router pages and API routes
  /api               # API route handlers
  /workout           # Workout session pages
  /history           # Workout history
  /program           # Program details
  /progress          # Progress tracking
  /onboarding        # User onboarding flow
/components          # React components
  /ui                # shadcn/ui base components
/lib
  /db                # Drizzle schema and database
  /services          # Effect-TS service layer
  /queries           # React Query hooks and query keys
  /utils.ts          # Utility functions (cn helper)
  /auth.ts           # better-auth server config
  /auth-client.ts    # better-auth client hooks
/drizzle             # Database migrations
```

### Effect-TS Service Layer

Services use Effect-TS for dependency injection and error handling. All database operations go through the service layer.

**Service Definition Pattern:**
```typescript
export class MyService extends Context.Tag("MyService")<
  MyService,
  { method: (args: Args) => Effect.Effect<Result, Error, DatabaseService> }
>() {}
```

**Service Implementation Pattern:**
```typescript
export const MyServiceLive = Layer.effect(
  MyService,
  Effect.gen(function* () {
    return {
      method: (args) =>
        Effect.gen(function* () {
          const db = yield* DatabaseService;
          return yield* Effect.tryPromise({
            try: () => db.query...,
            catch: (e) => new Error(String(e)),
          });
        }),
    };
  })
);
```

**Executing Effects:**
```typescript
import { runEffect } from "@/lib/services";

// In API routes or server components:
const result = await runEffect(
  Effect.gen(function* () {
    const service = yield* MyService;
    return yield* service.method(args);
  })
);
```

### React Query Patterns

**Query Keys:**
```typescript
export const workoutKeys = {
  all: ["workouts"] as const,
  history: () => [...workoutKeys.all, "history"] as const,
  detail: (id: string) => [...workoutKeys.all, id] as const,
};
```

**Custom Hooks:**
```typescript
export function useWorkoutHistory() {
  return useQuery({
    queryKey: workoutKeys.history(),
    queryFn: fetchWorkoutHistory,
  });
}

export function useStartWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startWorkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.history() });
    },
  });
}
```

**Server-Side Hydration:**
```typescript
// In server components
const queryClient = new QueryClient();
queryClient.setQueryData(queryKeys.data(), serverData);

return (
  <HydrationBoundary state={dehydrate(queryClient)}>
    <ClientComponent />
  </HydrationBoundary>
);
```

### API Route Pattern

```typescript
import { auth } from "@/lib/auth";
import { runEffect } from "@/lib/services";
import { Effect } from "effect";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const result = await runEffect(
    Effect.gen(function* () {
      const service = yield* SomeService;
      return yield* service.method(session.user.id, body);
    })
  );

  return NextResponse.json(result);
}
```

### Authentication

**Server-side (API routes/server components):**
```typescript
import { auth } from "@/lib/auth";
const session = await auth.api.getSession({ headers: req.headers });
const userId = session?.user?.id;
```

**Client-side:**
```typescript
import { useSession, signIn, signOut } from "@/lib/auth-client";
const { data: session } = useSession();
```

## Design System

This project follows **Revolut's design principles** as our primary design inspiration. When building UI, always reference how Revolut approaches similar problems in their app.

### Revolut Design Philosophy

We emulate Revolut's design language because it exemplifies modern fintech aesthetics: premium, trustworthy, and effortlessly usable. Every UI change should feel like it belongs in a high-end app.

1. **Radical Simplicity (The "Revolut Way")**: 
   - Every screen should have **one clear primary action**. 
   - Remove visual noise: no unnecessary borders, shadows, or background colors. 
   - If a feature isn't essential for the current task, hide it behind a "More" menu or progressive disclosure.

2. **Dark-First, Premium Depth**: 
   - Use **True Black (#000000)** for the main background to achieve infinite contrast on OLED screens. 
   - Create depth using subtle gray surfaces (`#0A0A0A`, `#171717`) and **1px borders (#262626)** rather than heavy shadows.
   - Use vibrant accents (Revolut Blue `#0078FF`) sparingly to draw attention to high-value actions.

3. **Information Density & Progressive Disclosure**:
   - Surfaces should feel clean at a glance but powerful on interaction.
   - Use **Bottom Sheets (Drawers)** for secondary actions and detailed inputs to keep the main context visible.
   - Summarize data first (e.g., total volume, weekly progress) and allow drilling down into specifics.

4. **Motion as a Signal**:
   - Animations must be **physics-based and snappy** (lean towards `duration-200` or `duration-300` with ease-out).
   - Use shared element transitions where possible to maintain user context.
   - Feedback is non-negotiable: every tap should have a subtle visual response.

5. **Typography as the Primary UI**:
   - Rely on **font weight and scale** to create hierarchy, not color.
   - Use `font-mono` for all numerical data (sets, reps, weights, timers) to prevent layout shift during updates and give a precision-tool feel.
   - Headlines should be bold and impactful; body text should be highly legible with generous line height.

6. **Touch-Optimized Interactions**:
   - Design for **one-handed use**. Place primary actions (e.g. Start Workout, Log Set) within the "thumb zone" (bottom half of the screen).
   - Leverage native-feeling gestures: swipe-to-delete, pull-to-refresh, and edge-swipes for navigation.
   - Use haptic-feedback-inspired visual cues for successful actions.

7. **The "Precision-Tool" Aesthetic**:
   - Every input should feel deliberate. Use custom numeric keypads or specialized pickers instead of generic browser inputs where possible.
   - Accuracy is key: use high-precision charts (Recharts) with clean, minimal axes.

### Core Principles (Implementation)

- **Dark-first**: Black background (#000000), dark grays for surfaces
- **Minimal**: Clean interfaces with purposeful whitespace
- **Bold typography**: Strong hierarchy, system fonts
- **Subtle depth**: Cards with soft borders, no harsh shadows
- **Smooth interactions**: Ease transitions, micro-animations

### Color Palette

```css
--background: #000000;        /* Pure black background */
--foreground: #FAFAFA;        /* Near-white text */
--card: #0A0A0A;              /* Elevated surfaces */
--muted: #171717;             /* Secondary surfaces */
--muted-foreground: #A3A3A3;  /* Secondary text */
--primary: #0078FF;           /* Bright blue accent */
--destructive: #DC2626;       /* Error/danger red */
--border: #262626;            /* Subtle borders */
```

### Component Styling

**Use CVA (class-variance-authority) for component variants:**
```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-border bg-transparent hover:bg-muted",
        ghost: "hover:bg-muted",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

**Use the cn() helper for conditional classes:**
```typescript
import { cn } from "@/lib/utils";

<div className={cn("base-class", isActive && "active-class", className)} />
```

### Spacing & Layout

- Use consistent spacing scale: 4, 8, 12, 16, 24, 32, 48, 64
- Cards: `rounded-xl` or `rounded-2xl` with `border border-border`
- Page padding: `p-4` on mobile, `p-6` on larger screens
- Section gaps: `space-y-6` or `gap-6`

### Typography

- Headings: `font-semibold` or `font-bold`
- Body: `text-sm` or `text-base`
- Muted text: `text-muted-foreground`
- Numbers/stats: `font-mono` for tabular data

### Animations

- Transitions: `transition-colors` or `transition-all duration-200`
- Hover states: Subtle opacity or background changes
- Loading: Use skeleton components or subtle pulse animations

## Code Conventions

### TypeScript

- Strict mode enabled
- Use Drizzle's `$inferSelect` and `$inferInsert` for DB types
- Prefer `interface` for object shapes, `type` for unions/aliases
- Path alias: `@/*` maps to project root

### Code Quality

- **Minimal Comments**: Avoid explaining "what" the code does. Code should be self-documenting. Use comments only for "why" (complex business logic or non-obvious decisions).
- **Clean Code**: Favor readable variable names and small, focused functions over inline comments.

### Components

- Client components: Add `"use client"` directive
- Server components: Default, no directive needed
- UI components live in `/components/ui`
- Feature components live in `/components`

### Naming

- Files: kebab-case (`workout-card.tsx`)
- Components: PascalCase (`WorkoutCard`)
- Hooks: camelCase with `use` prefix (`useWorkoutHistory`)
- Services: PascalCase with `Service` suffix (`WorkoutsService`)

### Error Handling

- API routes: Return appropriate HTTP status codes
- Effects: Use `Effect.tryPromise` with explicit error mapping
- Client: Handle errors in mutation `onError` callbacks
- Display errors with `sonner` toast notifications

## Database

### Schema Location

`/lib/db/schema.ts` contains all Drizzle table definitions and relations.

### Key Tables

- `user`, `session`, `account` - Authentication (better-auth)
- `user_preferences` - User settings and active program
- `programs`, `program_weeks`, `workout_days`, `day_exercises` - Program structure
- `exercises`, `muscle_groups`, `exercise_alternatives` - Exercise library
- `workout_logs`, `exercise_logs`, `set_logs` - User workout data

### Migrations

```bash
bun db:generate  # Generate migration from schema changes
bun db:migrate   # Apply pending migrations
bun db:push      # Push schema directly (dev only)
```

## Common Patterns

### Creating a New API Endpoint

1. Create route file in `/app/api/[resource]/route.ts`
2. Check authentication with `auth.api.getSession()`
3. Execute business logic through Effect services
4. Return JSON response with appropriate status

### Creating a New Service Method

1. Add method signature to service interface in `/lib/services/index.ts`
2. Implement method using `Effect.gen` and `Effect.tryPromise`
3. Access database via `yield* DatabaseService`

### Creating a New React Query Hook

1. Add query key to the appropriate keys object in `/lib/queries/`
2. Create query/mutation hook using `useQuery` or `useMutation`
3. Handle cache invalidation in mutation `onSuccess`

### Adding a New UI Component

1. Create component in `/components/ui/` following shadcn patterns
2. Use Radix UI primitives when needed
3. Style with Tailwind + CVA for variants
4. Export from component file
