// Empty loading component - workout page renders in ~150ms so no skeleton needed
// This prevents the root loading.tsx (homepage skeleton) from showing during navigation
export default function WorkoutLoading() {
  return null;
}
