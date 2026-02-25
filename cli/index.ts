#!/usr/bin/env bun

import inquirer from "inquirer";
import { runLogCommand } from "./commands/log";
import { runPlanCommand } from "./commands/plan";
import { runExercisesCommand } from "./commands/exercises";

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case "log":
      await runLogCommand();
      break;
    case "plan":
      await runPlanCommand();
      break;
    case "exercises":
      await runExercisesCommand();
      break;
    case "help":
    case undefined:
      console.log(`
CLI for Fitness App

Usage:
  bun cli <command>

Commands:
  log         Log historical workout data
  plan        Manage workout plan defaults
  exercises   Browse exercise library

Examples:
  bun cli exercises
  bun cli exercises --search bench
  bun cli plan
  bun cli log
`);
      break;
    default:
      console.log(`Unknown command: ${command}`);
      console.log(`Run 'bun cli help' for usage information.`);
      process.exit(1);
  }
}

main().catch(console.error);
