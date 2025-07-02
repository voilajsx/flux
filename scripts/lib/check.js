/**
 * Flux Framework - Simplified Quality Check
 * @file scripts/lib/check.js
 */

import { execSync } from "child_process";
import {
  logSuccess,
  logError,
  logBox,
  log,
  colors,
  symbols,
  Timer,
} from "./utils.js";
import { runContracts } from "./contracts.js";

/**
 * Simplified check - contracts + typescript + prettier
 */
export async function runCheck(args) {
  const timer = new Timer();

  console.clear();

  logBox(`${symbols.target} Flux Quality Check`, [
    `${symbols.contracts} Contract validation`,
    `${symbols.lightning} TypeScript compilation`,
    `${symbols.sparkles} Code formatting check`,
  ]);

  const results = {
    contracts: { passed: false, errors: [] },
    typescript: { passed: false, errors: [] },
    formatting: { passed: false, errors: [] },
  };

  let allPassed = true;

  try {
    // 1. Contract Validation
    log(`${symbols.contracts} Validating contracts...`, "white");
    try {
      await runContracts([]);
      results.contracts.passed = true;
      logSuccess("Contract validation passed");
    } catch (error) {
      results.contracts.passed = false;
      results.contracts.errors.push(error.message);
      allPassed = false;
      logError("Contract validation failed");
    }

    // 2. TypeScript Check
    log(`${symbols.lightning} Checking TypeScript...`, "white");
    try {
      execSync("npx tsc --noEmit", { stdio: "pipe" });
      results.typescript.passed = true;
      logSuccess("TypeScript check passed");
    } catch (error) {
      results.typescript.passed = false;
      const output = error.stdout?.toString() || error.stderr?.toString() || "";
      const errors = output
        .split("\n")
        .filter((line) => line.includes("error TS"))
        .slice(0, 3); // Show first 3 errors

      results.typescript.errors =
        errors.length > 0 ? errors : ["TypeScript compilation failed"];
      allPassed = false;
      logError(`TypeScript check failed (${errors.length} errors)`);
    }

    // 3. Prettier Check
    log(`${symbols.sparkles} Checking code formatting...`, "white");
    try {
      execSync("npx prettier --check .", { stdio: "pipe" });
      results.formatting.passed = true;
      logSuccess("Code formatting check passed");
    } catch (error) {
      results.formatting.passed = false;
      results.formatting.errors.push("Code formatting issues found");
      allPassed = false;
      logError("Code formatting check failed");
    }

    // Display Results
    console.clear();
    timer.endWithMessage(`${symbols.check} Quality check completed!`);

    if (allPassed) {
      logBox(
        "✅ All Checks Passed",
        [
          "🎯 Contract validation: PASSED",
          "⚡ TypeScript compilation: PASSED",
          "✨ Code formatting: PASSED",
          "",
          "Ready for deployment! 🚀",
        ],
        "green",
      );
    } else {
      logBox(
        "❌ Quality Issues Found",
        [
          `🎯 Contracts: ${results.contracts.passed ? "PASSED" : "FAILED"}`,
          `⚡ TypeScript: ${results.typescript.passed ? "PASSED" : "FAILED"}`,
          `✨ Formatting: ${results.formatting.passed ? "PASSED" : "FAILED"}`,
          "",
          "Fix issues before deployment",
        ],
        "red",
      );

      // Show specific errors
      console.log();
      if (!results.contracts.passed) {
        log("Contract Errors:", "red");
        results.contracts.errors.forEach((error) => {
          log(`  • ${error}`, "red");
        });
      }

      if (!results.typescript.passed) {
        log("TypeScript Errors:", "red");
        results.typescript.errors.forEach((error) => {
          log(`  • ${error}`, "red");
        });
      }

      if (!results.formatting.passed) {
        log("Formatting Issues:", "red");
        log("  • Run: npm run format", "cyan");
      }
    }

    console.log();
    log("Individual commands:", "gray");
    log("  npm run flux:contracts  # Contract validation only", "gray");
    log("  npx tsc --noEmit        # TypeScript check only", "gray");
    log("  npm run format:check    # Prettier check only", "gray");
    log("  npm run format          # Fix formatting", "gray");
  } catch (error) {
    logError(`Quality check failed: ${error.message}`);
    process.exit(1);
  }
}
