#!/usr/bin/env node

/**
 * Flux Framework - Simplified CLI Entry Point
 * @description Essential Flux tools only - dev/build use standard Node.js patterns
 * @file scripts/index.js
 */

import { fileURLToPath } from "url";
import path from "path";
import { showHelp } from "./lib/help.js";
import { runCreate } from "./lib/create.js";
import { runContracts } from "./lib/contracts.js";
import { runCheck } from "./lib/check.js";
import { logError, logBox } from "./lib/utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simplified command mapping - only essential Flux tools
const commands = {
  create: runCreate, // Feature generator
  contracts: runContracts, // Contract validation
  check: runCheck, // Quality checks
  help: showHelp, // Help system
};

/**
 * Main CLI entry point
 */
async function main() {
  const [, , command, ...args] = process.argv;

  // Show help if no command or help requested
  if (
    !command ||
    command === "help" ||
    command === "--help" ||
    command === "-h"
  ) {
    showHelp();
    return;
  }

  // Version flag
  if (command === "--version" || command === "-v") {
    console.log("Flux Framework v1.0.0");
    console.log("Contract-driven TypeScript backend framework");
    console.log("");
    console.log("Essential commands:");
    console.log("  flux:create   - Generate features");
    console.log("  flux:check    - Quality validation");
    console.log("  flux:help     - Show help");
    console.log("");
    console.log("Development:");
    console.log("  npm run dev   - Start development (tsx watch)");
    console.log("  npm run build - Build production (tsc)");
    return;
  }

  // Check if command exists
  if (!commands[command]) {
    console.clear();
    logBox(
      "⚡ Unknown Command",
      [
        `Command "${command}" not recognized`,
        "",
        "Available Flux commands:",
        "  flux:create   - Generate new features",
        "  flux:check    - Run quality checks",
        "  flux:contracts- Validate contracts only",
        "  flux:help     - Show detailed help",
        "",
        "Development commands:",
        "  npm run dev   - Start development server",
        "  npm run build - Build for production",
      ],
      "red",
    );
    process.exit(1);
  }

  try {
    // Run the command
    await commands[command](args);
  } catch (error) {
    logError(`Command failed: ${error.message}`);

    if (process.env.DEBUG) {
      console.error("Full error:", error);
    }

    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logError(`Unhandled rejection: ${reason}`);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logError(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

// Run the CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
