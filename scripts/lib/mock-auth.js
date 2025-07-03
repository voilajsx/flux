/**
 * Flux Framework - Mock Authentication Generator
 * @file scripts/lib/mock-auth.js
 *
 * @llm-rule WHEN: Need to generate mock users and JWT tokens for development/testing
 * @llm-rule AVOID: Using in production - this is for development only
 * @llm-rule NOTE: Integrates with AppKit auth and generates real JWT tokens with tenant_id
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import {
  logSuccess,
  logError,
  logBox,
  log,
  colors,
  symbols,
  Timer,
} from './utils.js';

// AppKit default role hierarchy with tenant context
const APPKIT_ROLES = {
  'user.basic': {
    level: 1,
    permissions: ['manage:own'],
    email: 'user.basic@dev.local',
    name: 'Basic User',
    tenant_id: 'tenant_123', // Regular users need tenant context
  },
  'user.pro': {
    level: 2,
    permissions: ['manage:own'],
    email: 'user.pro@dev.local',
    name: 'Pro User',
    tenant_id: 'tenant_123',
  },
  'user.max': {
    level: 3,
    permissions: ['manage:own'],
    email: 'user.max@dev.local',
    name: 'Max User',
    tenant_id: 'tenant_123',
  },
  'moderator.review': {
    level: 4,
    permissions: ['view:tenant'],
    email: 'moderator.review@dev.local',
    name: 'Review Moderator',
    tenant_id: 'tenant_123',
  },
  'moderator.approve': {
    level: 5,
    permissions: ['view:tenant', 'create:tenant', 'edit:tenant'],
    email: 'moderator.approve@dev.local',
    name: 'Approve Moderator',
    tenant_id: 'tenant_123',
  },
  'moderator.manage': {
    level: 6,
    permissions: ['view:tenant', 'create:tenant', 'edit:tenant'],
    email: 'moderator.manage@dev.local',
    name: 'Manage Moderator',
    tenant_id: 'tenant_123',
  },
  'admin.tenant': {
    level: 7,
    permissions: ['manage:tenant'],
    email: 'admin.tenant@dev.local',
    name: 'Tenant Admin',
    tenant_id: 'tenant_123', // Tenant admins work within specific tenant
  },
  'admin.org': {
    level: 8,
    permissions: ['manage:tenant', 'manage:org'],
    email: 'admin.org@dev.local',
    name: 'Organization Admin',
    tenant_id: null, // Org admins can work across tenants
  },
  'admin.system': {
    level: 9,
    permissions: ['manage:tenant', 'manage:org', 'manage:system'],
    email: 'admin.system@dev.local',
    name: 'System Admin',
    tenant_id: null, // System admins have no tenant restriction
  },
};

/**
 * Main mock auth command handler
 * @llm-rule WHEN: Called from flux CLI with mock-auth command
 * @llm-rule AVOID: Running without JWT_SECRET in environment
 */
export async function runMockAuth(args) {
  const timer = new Timer();

  // Handle subcommands
  if (args.length > 0) {
    if (args[0] === 'copy') {
      await handleCopyCommand(args.slice(1));
      return;
    }
    if (args[0] === 'tenant') {
      await handleTenantCommand(args.slice(1));
      return;
    }
  }

  // Generate all tokens
  console.clear();

  logBox(`${symbols.security} Flux Mock Authentication Generator`, [
    `${symbols.lightning} Generate JWT tokens for all AppKit roles`,
    `${symbols.target} Append to .env file for immediate use`,
    `${symbols.sparkles} Copy specific tokens with: flux:mock-auth copy`,
    `${symbols.fire} Set tenant ID: flux:mock-auth tenant <tenant-id>`,
  ]);

  try {
    // Ensure VOILA_AUTH_SECRET exists
    await ensureVOILAAuthSecret();

    // Generate all mock tokens
    const tokens = await generateAllTokens();

    // Write to .env file
    await writeToEnvFile(tokens);

    // Success message
    console.clear();
    timer.endWithMessage(`${symbols.check} Mock authentication generated!`);

    logBox(
      `${symbols.security} Mock Auth Ready!`,
      [
        `${symbols.sparkles} ${Object.keys(tokens).length} tokens generated in .env`,
        `${symbols.lightning} Copy tokens: npm run flux:mock-auth copy`,
        `${symbols.target} Use in REST Client: {{USER_BASIC_TOKEN}}`,
        `${symbols.fire} Start server: npm run flux:dev`,
        `${symbols.info} Update tenant: npm run flux:mock-auth tenant <id>`,
      ],
      'green'
    );

    // Show quick examples
    showUsageExamples();
  } catch (error) {
    console.clear();
    logError(`Mock auth generation failed: ${error.message}`);

    if (process.env.DEBUG) {
      console.error('Full error:', error);
    }

    process.exit(1);
  }
}

/**
 * Handle copy command to clipboard
 * @llm-rule WHEN: User wants to copy specific token to clipboard
 * @llm-rule AVOID: Copying if token doesn't exist in .env file
 */
async function handleCopyCommand(args) {
  try {
    const roleLevel = args[0] || 'user.basic'; // Default to basic user
    const envVarName = convertRoleToEnvVar(roleLevel);

    // Read .env file
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      logError('No .env file found. Run: npm run flux:mock-auth');
      return;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const tokenMatch = envContent.match(new RegExp(`${envVarName}=(.+)`));

    if (!tokenMatch) {
      logError(`Token for ${roleLevel} not found. Run: npm run flux:mock-auth`);
      return;
    }

    const token = tokenMatch[1].trim();

    // Copy to clipboard using system command
    await copyToClipboard(token);

    logSuccess(`${roleLevel} token copied to clipboard!`);
    log(
      `Use: ${colors.gray}Authorization: Bearer <paste-token>${colors.reset}`,
      'white'
    );
  } catch (error) {
    logError(`Copy failed: ${error.message}`);
  }
}

/**
 * Handle tenant command to update tenant IDs
 * @llm-rule WHEN: User wants to set real tenant ID for testing
 * @llm-rule AVOID: Updating admin.org and admin.system - they should stay null
 */
async function handleTenantCommand(args) {
  try {
    const tenantId = args[0];

    if (!tenantId) {
      logError(
        'Tenant ID required. Usage: npm run flux:mock-auth tenant <tenant-id>'
      );
      return;
    }

    // Update APPKIT_ROLES with new tenant ID (except for org/system admins)
    for (const [roleLevel, userData] of Object.entries(APPKIT_ROLES)) {
      if (roleLevel !== 'admin.org' && roleLevel !== 'admin.system') {
        userData.tenant_id = tenantId;
      }
    }

    // Regenerate tokens with new tenant ID
    const tokens = await generateAllTokens();
    await writeToEnvFile(tokens);

    logSuccess(`Updated tenant ID to: ${tenantId}`);
    log(
      `${symbols.fire} All tokens regenerated with new tenant context`,
      'green'
    );
    log(
      `${symbols.info} admin.org and admin.system remain tenant_id: null`,
      'yellow'
    );
  } catch (error) {
    logError(`Tenant update failed: ${error.message}`);
  }
}

/**
 * Ensure JWT_SECRET exists in environment
 */
async function ensureVOILAAuthSecret() {
  const envPath = path.join(process.cwd(), '.env');

  // Check if VOILA_AUTH_SECRET already exists
  if (process.env.VOILA_AUTH_SECRET) {
    return;
  }

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('VOILA_AUTH_SECRET=')) {
      return;
    }
  }

  // Generate new secret
  const secret = crypto.randomBytes(64).toString('hex');

  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Add VOILA_AUTH_SECRET at top
  envContent = `VOILA_AUTH_SECRET=${secret}\n${envContent}`;
  fs.writeFileSync(envPath, envContent);

  logSuccess('Generated VOILA_AUTH_SECRET in .env file');
}

/**
 * Generate JWT tokens for all AppKit roles
 */
async function generateAllTokens() {
  const authSecret = getVOILAAuthSecret();
  const tokens = {};

  for (const [roleLevel, userData] of Object.entries(APPKIT_ROLES)) {
    const [role, level] = roleLevel.split('.');

    // Create JWT payload with tenant context
    const payload = {
      userId: `${role}_${level}_001`,
      email: userData.email,
      role: role,
      level: level,
      tenant_id: userData.tenant_id, // Include tenant_id (null for org/system admins)
      permissions: userData.permissions,
      active: true,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    };

    // Generate token using simplified JWT implementation
    const token = generateJWTToken(payload, authSecret);

    tokens[roleLevel] = {
      token,
      user: {
        id: payload.userId,
        name: userData.name,
        email: userData.email,
        role: roleLevel,
        tenant_id: userData.tenant_id,
        permissions: userData.permissions,
      },
    };
  }

  return tokens;
}

/**
 * Simplified JWT token generation for development
 */
function generateJWTToken(payload, secret) {
  const header = {
    typ: 'JWT',
    alg: 'HS256',
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Write tokens to .env file
 */
async function writeToEnvFile(tokens) {
  const envPath = path.join(process.cwd(), '.env');

  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Remove existing mock auth section if present
  envContent = envContent.replace(
    /# =+\n# Flux Mock Authentication Tokens[\s\S]*?# =+\n/,
    ''
  );

  // Create new mock auth section
  let mockSection = `\n# ${'='.repeat(77)}\n`;
  mockSection += `# Flux Mock Authentication Tokens (Auto-generated)\n`;
  mockSection += `# Generated: ${new Date().toISOString()}\n`;
  mockSection += `# Copy tokens: npm run flux:mock-auth copy [role.level]\n`;
  mockSection += `# Update tenant: npm run flux:mock-auth tenant <tenant-id>\n`;
  mockSection += `# ${'='.repeat(77)}\n\n`;

  // Add tokens with user info comments
  for (const [roleLevel, data] of Object.entries(tokens)) {
    const envVarName = convertRoleToEnvVar(roleLevel);

    mockSection += `# ${data.user.name}\n`;
    mockSection += `# ID: ${data.user.id} | Email: ${data.user.email} | Role: ${roleLevel}\n`;
    mockSection += `# Tenant: ${data.user.tenant_id || 'null (cross-tenant)'} | Permissions: ${data.user.permissions.join(', ')}\n`;
    mockSection += `${envVarName}=${data.token}\n\n`;
  }

  mockSection += `# Usage Examples:\n`;
  mockSection += `# REST Client: Authorization: Bearer {{USER_BASIC_TOKEN}}\n`;
  mockSection += `# cURL: curl -H "Authorization: Bearer $USER_BASIC_TOKEN" http://localhost:3000/api\n`;
  mockSection += `# Copy: npm run flux:mock-auth copy admin.tenant\n`;
  mockSection += `# Update tenant: npm run flux:mock-auth tenant your-tenant-id\n`;
  mockSection += `# ${'='.repeat(77)}\n`;

  // Append to env file
  envContent += mockSection;
  fs.writeFileSync(envPath, envContent);
}

/**
 * Convert role.level to environment variable name
 */
function convertRoleToEnvVar(roleLevel) {
  return roleLevel.toUpperCase().replace('.', '_') + '_TOKEN';
}

/**
 * Copy text to clipboard using system commands
 */
async function copyToClipboard(text) {
  try {
    // Try different clipboard commands based on platform
    if (process.platform === 'darwin') {
      // macOS
      execSync('pbcopy', { input: text });
    } else if (process.platform === 'linux') {
      // Linux
      try {
        execSync('xclip -selection clipboard', { input: text });
      } catch {
        execSync('xsel --clipboard --input', { input: text });
      }
    } else if (process.platform === 'win32') {
      // Windows
      execSync('clip', { input: text });
    } else {
      throw new Error('Clipboard not supported on this platform');
    }
  } catch (error) {
    // Fallback: just show the token
    console.log(`\n${colors.cyan}Token:${colors.reset}`);
    console.log(text);
    throw new Error('Could not copy to clipboard, but token is shown above');
  }
}

/**
 * Get JWT secret from environment or .env file
 */
function getVOILAAuthSecret() {
  if (process.env.VOILA_AUTH_SECRET) {
    return process.env.VOILA_AUTH_SECRET;
  }

  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/VOILA_AUTH_SECRET=(.+)/);
    if (match) {
      return match[1].trim();
    }
  }

  throw new Error('VOILA_AUTH_SECRET not found. Please set in .env file.');
}

/**
 * Show usage examples after generation
 */
function showUsageExamples() {
  console.log();
  log(`${colors.bright}Quick Commands:${colors.reset}`, 'white');
  console.log(
    `  ${colors.cyan}npm run flux:mock-auth copy${colors.reset}                ${colors.gray}# Copy basic user token${colors.reset}`
  );
  console.log(
    `  ${colors.cyan}npm run flux:mock-auth copy admin.tenant${colors.reset}   ${colors.gray}# Copy tenant admin token${colors.reset}`
  );
  console.log(
    `  ${colors.cyan}npm run flux:mock-auth copy admin.system${colors.reset}   ${colors.gray}# Copy system admin token${colors.reset}`
  );
  console.log(
    `  ${colors.cyan}npm run flux:mock-auth tenant <id>${colors.reset}         ${colors.gray}# Update tenant ID${colors.reset}`
  );

  console.log();
  log(`${colors.bright}REST Client Usage:${colors.reset}`, 'white');
  console.log(
    `  ${colors.green}Authorization: Bearer {{USER_BASIC_TOKEN}}${colors.reset}`
  );
  console.log(
    `  ${colors.green}Authorization: Bearer {{ADMIN_TENANT_TOKEN}}${colors.reset}`
  );
  console.log(
    `  ${colors.green}Authorization: Bearer {{ADMIN_SYSTEM_TOKEN}}${colors.reset}`
  );

  console.log();
  log(`${colors.bright}Available Roles:${colors.reset}`, 'white');
  Object.entries(APPKIT_ROLES).forEach(([role, data]) => {
    const tenantInfo = data.tenant_id
      ? `(tenant: ${data.tenant_id})`
      : `(cross-tenant)`;
    console.log(
      `  ${colors.gray}${role}${colors.reset} ${colors.dim}${tenantInfo}${colors.reset}`
    );
  });

  console.log();
  log(`${colors.bright}Tenant Context:${colors.reset}`, 'white');
  console.log(
    `  ${colors.gray}• Users & Moderators: Scoped to specific tenant${colors.reset}`
  );
  console.log(
    `  ${colors.gray}• admin.tenant: Works within assigned tenant${colors.reset}`
  );
  console.log(
    `  ${colors.gray}• admin.org & admin.system: Cross-tenant access (tenant_id: null)${colors.reset}`
  );

  console.log();
}
