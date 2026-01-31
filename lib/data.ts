import { Program, Exercise } from './types';

export const exercises: Record<string, Exercise> = {
  'bench-press': { id: 'bench-press', name: 'Barbell Bench Press', targetSets: 3, targetReps: '8-12', restSeconds: 90 },
  'incline-db-press': { id: 'incline-db-press', name: 'Incline Dumbbell Press', targetSets: 3, targetReps: '10-12', restSeconds: 90 },
  'pec-deck': { id: 'pec-deck', name: 'Pec Deck Fly', targetSets: 3, targetReps: '12-15', restSeconds: 60 },
  'hammer-strength-press': { id: 'hammer-strength-press', name: 'Hammer Strength Press', targetSets: 3, targetReps: '8-12', restSeconds: 90 },
  
  'pull-up': { id: 'pull-up', name: 'Pull Up', targetSets: 3, targetReps: 'AMRAP', restSeconds: 90 },
  'lat-pulldown': { id: 'lat-pulldown', name: 'Lat Pulldown', targetSets: 3, targetReps: '10-12', restSeconds: 90 },
  'db-row': { id: 'db-row', name: 'Dumbbell Row', targetSets: 3, targetReps: '10-12', restSeconds: 90 },
  
  'squat': { id: 'squat', name: 'Barbell Squat', targetSets: 3, targetReps: '6-8', restSeconds: 120 },
  'leg-press': { id: 'leg-press', name: 'Leg Press', targetSets: 3, targetReps: '10-12', restSeconds: 90 },
  'leg-extension': { id: 'leg-extension', name: 'Leg Extension', targetSets: 3, targetReps: '12-15', restSeconds: 60 },
  
  'shoulder-press': { id: 'shoulder-press', name: 'Dumbbell Shoulder Press', targetSets: 3, targetReps: '8-12', restSeconds: 90 },
  'lateral-raise': { id: 'lateral-raise', name: 'Lateral Raise', targetSets: 3, targetReps: '12-15', restSeconds: 60 },
  
  'tricep-pushdown': { id: 'tricep-pushdown', name: 'Tricep Pushdown', targetSets: 3, targetReps: '12-15', restSeconds: 60 },
  'bicep-curl': { id: 'bicep-curl', name: 'Barbell Curl', targetSets: 3, targetReps: '10-12', restSeconds: 60 },
};

exercises['bench-press'].alternatives = ['hammer-strength-press', 'incline-db-press'];
exercises['squat'].alternatives = ['leg-press'];

const createProgram = (days: 3 | 4 | 5): Program => {
  return {
    id: `thrst-vol-1-${days}day`,
    isSystem: true,
    name: `Thrst Volume 1 (${days} Day)`,
    description: 'A comprehensive hypertrophy program designed to build muscle mass.',
    daysPerWeek: days,
    weeks: Array.from({ length: 4 }).map((_, i) => ({
      weekNumber: i + 1,
      days: days === 3 ? [
        { id: `w${i+1}-push`, title: 'Push', exercises: [exercises['bench-press'], exercises['shoulder-press'], exercises['tricep-pushdown']] },
        { id: `w${i+1}-pull`, title: 'Pull', exercises: [exercises['pull-up'], exercises['db-row'], exercises['bicep-curl']] },
        { id: `w${i+1}-legs`, title: 'Legs', exercises: [exercises['squat'], exercises['leg-extension'], exercises['lateral-raise']] }
      ] : days === 4 ? [
        { id: `w${i+1}-upper1`, title: 'Upper A', exercises: [exercises['bench-press'], exercises['db-row']] },
        { id: `w${i+1}-lower1`, title: 'Lower A', exercises: [exercises['squat'], exercises['leg-extension']] },
        { id: `w${i+1}-upper2`, title: 'Upper B', exercises: [exercises['shoulder-press'], exercises['pull-up']] },
        { id: `w${i+1}-lower2`, title: 'Lower B', exercises: [exercises['leg-press'], exercises['lateral-raise']] }
      ] : [
        { id: `w${i+1}-push`, title: 'Push', exercises: [exercises['bench-press'], exercises['pec-deck'], exercises['tricep-pushdown']] },
        { id: `w${i+1}-pull`, title: 'Pull', exercises: [exercises['lat-pulldown'], exercises['bicep-curl']] },
        { id: `w${i+1}-legs`, title: 'Legs', exercises: [exercises['squat'], exercises['leg-extension']] },
        { id: `w${i+1}-upper`, title: 'Upper', exercises: [exercises['incline-db-press'], exercises['db-row']] },
        { id: `w${i+1}-arms`, title: 'Arms & Shoulders', exercises: [exercises['shoulder-press'], exercises['lateral-raise'], exercises['tricep-pushdown'], exercises['bicep-curl']] }
      ]
    }))
  };
};

export const programs: Program[] = [
  createProgram(3),
  createProgram(4),
  createProgram(5),
];
