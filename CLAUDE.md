# CLAUDE.md

This file provides guidance for Claude Code when working with this codebase.

## Project Overview

A fitness tracking application built with Next.js 16, TypeScript, Effect-TS, React, and Drizzle ORM. Users can follow workout programs, log sets/reps/weight, track progress, and view analytics.

**Design Philosophy**: We follow [Revolut's design principles](https://www.revolut.com/)—dark-first, radically minimal, premium fintech aesthetics. When building UI, always ask: "How would Revolut design this?"

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

We emulate Revolut's design language because it exemplifies modern fintech aesthetics: premium, trustworthy, and effortlessly usable. Key principles we follow:

1. **Radical Simplicity**: Every element must earn its place. Remove anything that doesn't directly serve the user's goal. When in doubt, leave it out.

2. **Dark-First, Premium Feel**: Pure black backgrounds create depth and make content pop. This isn't just aesthetic—it reduces eye strain and feels native on OLED screens.

3. **Information Density Done Right**: Show users what they need without overwhelming them. Use progressive disclosure—surface key info immediately, details on demand.

4. **Motion with Purpose**: Animations should feel natural and guide attention. No gratuitous effects—every transition communicates something.

5. **Typography as UI**: Strong typographic hierarchy reduces the need for visual clutter. Let font weight, size, and color do the heavy lifting.

6. **Touch-Optimized**: Generous tap targets, swipe gestures, and thumb-friendly layouts. Design for one-handed mobile use first.

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
