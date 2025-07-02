/**
 * Flux Framework - CLI Help System
 * @file scripts/lib/help.js
 */

import { colors, symbols, logBox, log } from "./utils.js";

export function showHelp() {
  console.clear();

  logBox(`${symbols.flux} Flux Framework CLI`, [
    `${symbols.sparkles} Contract-driven TypeScript backend framework`,
    `${symbols.lightning} LLM-accelerated development`,
    `${symbols.rocket} Build microservices faster`,
  ]);

  log(
    `${colors.bright}${colors.blue}Development Commands:${colors.reset}`,
    "white",
  );
  console.log(
    `  ${colors.cyan}flux:dev${colors.reset}        ${colors.gray}Start development server with hot reload${colors.reset}`,
  );
  console.log(
    `  ${colors.cyan}flux:build${colors.reset}      ${colors.gray}Build production TypeScript bundle${colors.reset}`,
  );
  console.log();

  log(
    `${colors.bright}${colors.green}Feature Commands:${colors.reset}`,
    "white",
  );
  console.log(
    `  ${colors.cyan}flux:create${colors.reset}     ${colors.gray}Create new feature with templates${colors.reset}`,
  );
  console.log();

  log(
    `${colors.bright}${colors.yellow}Quality Commands:${colors.reset}`,
    "white",
  );
  console.log(
    `  ${colors.cyan}flux:check${colors.reset}      ${colors.gray}Run all checks (contracts + format)${colors.reset}`,
  );
  console.log(
    `  ${colors.cyan}flux:contracts${colors.reset}  ${colors.gray}Validate feature contracts${colors.reset}`,
  );
  console.log(
    `  ${colors.cyan}flux:format${colors.reset}     ${colors.gray}Format code to Flux patterns${colors.reset}`,
  );
  console.log();

  log(`${colors.bright}Examples:${colors.reset}`, "white");
  console.log(`  ${colors.gray}npm run flux:create user-auth${colors.reset}`);
  console.log(
    `  ${colors.gray}npm run flux:create email-service${colors.reset}`,
  );
  console.log(`  ${colors.gray}npm run flux:dev${colors.reset}`);
  console.log(`  ${colors.gray}npm run flux:check${colors.reset}`);
  console.log();

  log(`${colors.bright}Options:${colors.reset}`, "white");
  console.log(
    `  ${colors.cyan}--help, -h${colors.reset}     ${colors.gray}Show this help message${colors.reset}`,
  );
  console.log(
    `  ${colors.cyan}--version, -v${colors.reset}  ${colors.gray}Show version information${colors.reset}`,
  );
  console.log(
    `  ${colors.cyan}--debug${colors.reset}        ${colors.gray}Show detailed debug information${colors.reset}`,
  );
  console.log();

  log(
    `${symbols.flux} ${colors.bright}Happy coding with Flux!${colors.reset}`,
    "white",
  );
}

export function showCreateHelp() {
  console.clear();

  logBox(`${symbols.magic} flux:create - Feature Creation`, [
    "Create new backend features with smart templates",
    "Choose from API or Service-only patterns",
  ]);

  log(`${colors.bright}Usage:${colors.reset}`, "white");
  console.log(
    `  ${colors.cyan}npm run flux:create <feature-name>${colors.reset}`,
  );
  console.log();

  log(`${colors.bright}Interactive Mode:${colors.reset}`, "white");
  console.log(
    `  ${colors.gray}• Choose template (API_FEATURE or SERVICE_ONLY)${colors.reset}`,
  );
  console.log(
    `  ${colors.gray}• Auto-generate contracts and file structure${colors.reset}`,
  );
  console.log(
    `  ${colors.gray}• TypeScript types and validation included${colors.reset}`,
  );
  console.log(
    `  ${colors.gray}• AppKit integration for authentication${colors.reset}`,
  );
  console.log();

  log(`${colors.bright}Templates:${colors.reset}`, "white");
  console.log(
    `  ${colors.cyan}API_FEATURE${colors.reset}     ${colors.gray}CRUD routes + service + database + auth${colors.reset}`,
  );
  console.log(
    `  ${colors.cyan}SERVICE_ONLY${colors.reset}    ${colors.gray}Background services and utilities${colors.reset}`,
  );
  console.log();

  log(`${colors.bright}Examples:${colors.reset}`, "white");
  console.log(
    `  ${colors.cyan}npm run flux:create user-management${colors.reset}`,
  );
  console.log(`  ${colors.cyan}npm run flux:create blog-posts${colors.reset}`);
  console.log(
    `  ${colors.cyan}npm run flux:create email-service${colors.reset}`,
  );
  console.log(
    `  ${colors.cyan}npm run flux:create file-processor${colors.reset}`,
  );
}

export function showContractsHelp() {
  console.clear();

  logBox(`${symbols.contracts} flux:contracts - Contract Validation`, [
    "Validate feature contracts and dependencies",
    "Ensure architecture integrity and consistency",
  ]);

  log(`${colors.bright}What it validates:${colors.reset}`, "white");
  console.log(
    `  ${symbols.target} ${colors.gray}Service dependencies are satisfied${colors.reset}`,
  );
  console.log(
    `  ${symbols.security} ${colors.gray}Platform services are correctly used${colors.reset}`,
  );
  console.log(
    `  ${symbols.contracts} ${colors.gray}Contract definitions are valid${colors.reset}`,
  );
  console.log(
    `  ${symbols.lightning} ${colors.gray}No circular dependencies exist${colors.reset}`,
  );
  console.log();

  log(`${colors.bright}Usage:${colors.reset}`, "white");
  console.log(`  ${colors.cyan}npm run flux:contracts${colors.reset}`);
  console.log();

  log(`${colors.bright}Contract System:${colors.reset}`, "white");
  console.log(
    `  ${colors.gray}• Features declare what they provide and need${colors.reset}`,
  );
  console.log(
    `  ${colors.gray}• Platform services are automatically available${colors.reset}`,
  );
  console.log(
    `  ${colors.gray}• Dependencies are validated at build time${colors.reset}`,
  );
  console.log(
    `  ${colors.gray}• LLM-friendly patterns ensure consistency${colors.reset}`,
  );
}

export function showCheckHelp() {
  console.clear();

  logBox(`${symbols.target} flux:check - Quality Assurance`, [
    "Run comprehensive checks on your Flux application",
    "Contracts, formatting, and architecture validation",
  ]);

  log(`${colors.bright}What it checks:${colors.reset}`, "white");
  console.log(
    `  ${symbols.contracts} ${colors.gray}Contract validation and dependencies${colors.reset}`,
  );
  console.log(
    `  ${symbols.code} ${colors.gray}Code formatting and LLM patterns${colors.reset}`,
  );
  console.log(
    `  ${symbols.target} ${colors.gray}Feature structure and consistency${colors.reset}`,
  );
  console.log(
    `  ${symbols.lightning} ${colors.gray}TypeScript compilation errors${colors.reset}`,
  );
  console.log();

  log(`${colors.bright}Usage:${colors.reset}`, "white");
  console.log(`  ${colors.cyan}npm run flux:check${colors.reset}`);
  console.log();

  log(`${colors.bright}Individual Checks:${colors.reset}`, "white");
  console.log(
    `  ${colors.cyan}npm run flux:contracts${colors.reset} ${colors.gray}(contracts only)${colors.reset}`,
  );
  console.log(
    `  ${colors.cyan}npm run flux:format${colors.reset}    ${colors.gray}(formatting only)${colors.reset}`,
  );
}
