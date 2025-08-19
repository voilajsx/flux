/**
 * FLUX Framework Version Management Commands
 * @file scripts/commands/version.js
 *
 * @llm-rule WHEN: Managing API versions and backward compatibility
 * @llm-rule AVOID: Breaking changes without deprecation period
 * @llm-rule NOTE: Supports creation, copying, deprecation, and migration
 */

import { readdir, stat, mkdir, cp, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { createLogger } from '../logger.js';

const log = createLogger('version');
console.log(`🔢 FLUX Version Management Commands Initialized`);
/**
 * Version management command handler
 *
 * Commands:
 * - npm run flux:version create v2
 * - npm run flux:version copy v1 v2 weather
 * - npm run flux:version list
 * - npm run flux:version deprecate v1
 * - npm run flux:version migrate v1 v2
 */
export default async function version(args) {
  console.log(`🔍 DEBUG: version() function called`);
  console.log(`🔍 DEBUG: args received:`, args);
  console.log(`🔍 DEBUG: args type:`, typeof args);
  console.log(`🔍 DEBUG: args length:`, args?.length);
  if (!args || args.length === 0) {
    showVersionHelp();
    return false;
  }

  const command = args[0];
  console.log(
    `🔢 Running version command: ${command} with args: ${args.slice(1).join(' ')}`
  );

  try {
    switch (command) {
      case 'create':
        return await handleCreateVersion(args.slice(1));
      case 'copy':
        return await handleCopyFeature(args.slice(1));
      case 'list':
        return await handleListVersions();
      case 'deprecate':
        return await handleDeprecateVersion(args.slice(1));
      case 'migrate':
        return await handleMigrateVersion(args.slice(1));
      default:
        console.log(`❌ Unknown version command: ${command}`);
        showVersionHelp();
        return false;
    }
  } catch (error) {
    console.log(`❌ Version command error: ${error.message}`);
    return false;
  }
}

/**
 * Create a new API version
 * Usage: npm run flux:version create v2
 */
async function handleCreateVersion(args) {
  if (args.length !== 1) {
    console.log('❌ Usage: npm run flux:version create v2');
    return false;
  }

  const newVersion = args[0];

  if (!newVersion.match(/^v\d+$/)) {
    console.log('❌ Version must be in format v1, v2, v3, etc.');
    return false;
  }

  const apiPath = join(process.cwd(), 'src', 'api');
  const versionPath = join(apiPath, newVersion);

  // Check if version already exists
  try {
    await stat(versionPath);
    console.log(`❌ Version ${newVersion} already exists`);
    return false;
  } catch {
    // Version doesn't exist - good to create
  }

  // Create version directory
  await mkdir(versionPath, { recursive: true });

  // Create version info file
  const versionInfo = {
    version: newVersion,
    created_at: new Date().toISOString(),
    status: 'active',
    features: [],
    breaking_changes: [],
    deprecation_date: null,
    migration_guide: `Migration guide for ${newVersion}`,
  };

  await writeFile(
    join(versionPath, 'version.json'),
    JSON.stringify(versionInfo, null, 2)
  );

  // Create README for the version
  const readme = `# API ${newVersion.toUpperCase()}

## Overview
This is API version ${newVersion} of the FLUX Framework.

## Features
- No features yet - use \`flux:version copy\` to migrate features from previous versions

## Breaking Changes
- Document any breaking changes from previous versions here

## Migration Guide
- Add migration instructions for developers here

## Deprecation Timeline
- This version will be supported for at least 3 major versions
- Deprecation date: TBD
`;

  await writeFile(join(versionPath, 'README.md'), readme);

  console.log(`✅ Created API version ${newVersion}`);
  console.log(`   Directory: ${versionPath}`);
  console.log(`   Status: Active`);
  console.log(`\n💡 Next steps:`);
  console.log(
    `   1. Copy features: npm run flux:version copy v1 ${newVersion} weather`
  );
  console.log(`   2. Update specifications for breaking changes`);
  console.log(`   3. Test the new version thoroughly`);

  return true;
}

/**
 * Copy a feature from one version to another
 * Usage: npm run flux:version copy v1 v2 weather
 */
async function handleCopyFeature(args) {
  if (args.length !== 3) {
    console.log('❌ Usage: npm run flux:version copy v1 v2 weather');
    return false;
  }

  const [sourceVersion, targetVersion, featureName] = args;
  const apiPath = join(process.cwd(), 'src', 'api');

  const sourcePath = join(apiPath, sourceVersion, featureName);
  const targetPath = join(apiPath, targetVersion, featureName);

  // Validate source exists
  try {
    await stat(sourcePath);
  } catch {
    console.log(
      `❌ Source feature ${sourceVersion}/${featureName} does not exist`
    );
    return false;
  }

  // Validate target version exists
  try {
    await stat(join(apiPath, targetVersion));
  } catch {
    console.log(`❌ Target version ${targetVersion} does not exist`);
    console.log(
      `   Create it first: npm run flux:version create ${targetVersion}`
    );
    return false;
  }

  // Check if target feature already exists
  try {
    await stat(targetPath);
    console.log(
      `⚠️  Target feature ${targetVersion}/${featureName} already exists`
    );
    console.log(`   Use --force to overwrite`);
    return false;
  } catch {
    // Target doesn't exist - good to copy
  }

  // Copy the feature
  await cp(sourcePath, targetPath, { recursive: true });

  // Update manifest with new version info
  const manifestPath = join(targetPath, `${featureName}.manifest.json`);
  try {
    const manifestContent = await readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    manifest.api_version = targetVersion;
    manifest.copied_from = sourceVersion;
    manifest.copied_at = new Date().toISOString();
    manifest.version_notes = `Copied from ${sourceVersion}, ready for ${targetVersion} enhancements`;

    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  } catch {
    // Create manifest if it doesn't exist
    const defaultManifest = {
      feature: featureName,
      api_version: targetVersion,
      copied_from: sourceVersion,
      copied_at: new Date().toISOString(),
      active: true,
      version_notes: `Copied from ${sourceVersion} for ${targetVersion} development`,
    };

    await writeFile(manifestPath, JSON.stringify(defaultManifest, null, 2));
  }

  // Update version info
  const versionInfoPath = join(apiPath, targetVersion, 'version.json');
  try {
    const versionContent = await readFile(versionInfoPath, 'utf-8');
    const versionInfo = JSON.parse(versionContent);

    if (!versionInfo.features.includes(featureName)) {
      versionInfo.features.push(featureName);
      await writeFile(versionInfoPath, JSON.stringify(versionInfo, null, 2));
    }
  } catch {
    // Version info doesn't exist - skip update
  }

  console.log(
    `✅ Copied feature ${sourceVersion}/${featureName} → ${targetVersion}/${featureName}`
  );
  console.log(`   Source: ${sourcePath}`);
  console.log(`   Target: ${targetPath}`);
  console.log(`\n💡 Next steps:`);
  console.log(
    `   1. Update ${targetVersion}/${featureName} specifications for new version`
  );
  console.log(
    `   2. Test the copied feature: npm run flux:test ${targetVersion}/${featureName}`
  );
  console.log(`   3. Update breaking changes if any`);

  return true;
}

/**
 * List all API versions and their status
 * Usage: npm run flux:version list
 */
async function handleListVersions() {
  const apiPath = join(process.cwd(), 'src', 'api');
  console.log(`📋 Listing API versions in ${apiPath}`);
  const versions = [];

  try {
    const items = await readdir(apiPath);

    for (const item of items) {
      if (item.match(/^v\d+$/)) {
        const versionPath = join(apiPath, item);
        const versionStat = await stat(versionPath);

        if (versionStat.isDirectory()) {
          // Load version info
          let versionInfo = { version: item, status: 'active', features: [] };
          try {
            const infoContent = await readFile(
              join(versionPath, 'version.json'),
              'utf-8'
            );
            versionInfo = JSON.parse(infoContent);
          } catch {
            // Use default info
          }

          // Count features
          const features = await readdir(versionPath);
          const featureCount = features.filter(
            (f) =>
              !f.startsWith('.') &&
              !f.startsWith('_') &&
              f !== 'version.json' &&
              f !== 'README.md'
          ).length;

          versions.push({
            ...versionInfo,
            feature_count: featureCount,
          });
        }
      }
    }

    // Sort versions
    versions.sort((a, b) => {
      const numA = parseInt(a.version.substring(1));
      const numB = parseInt(b.version.substring(1));
      return numA - numB;
    });

    console.log(`\n📋 API Versions Overview:`);
    console.log(`   Total versions: ${versions.length}`);
    console.log(`   API path: ${apiPath}\n`);

    versions.forEach((version, index) => {
      const isLatest = index === versions.length - 1;
      const isDeprecated = index < versions.length - 3;

      let statusEmoji = '🟢';
      if (isDeprecated) statusEmoji = '🔴';
      else if (!isLatest) statusEmoji = '🟡';

      console.log(`${statusEmoji} ${version.version.toUpperCase()}`);
      console.log(`   Features: ${version.feature_count}`);
      console.log(
        `   Status: ${version.status}${isLatest ? ' (Latest)' : ''}${isDeprecated ? ' (Deprecated)' : ''}`
      );
      if (version.created_at) {
        console.log(
          `   Created: ${new Date(version.created_at).toLocaleDateString()}`
        );
      }
      if (version.deprecation_date) {
        console.log(
          `   Deprecation: ${new Date(version.deprecation_date).toLocaleDateString()}`
        );
      }
      console.log('');
    });

    return true;
  } catch (error) {
    console.log(`❌ Failed to list versions: ${error.message}`);
    return false;
  }
}

/**
 * Show version management help
 */
function showVersionHelp() {
  console.log(`
🔢 FLUX Version Management

COMMANDS:
  npm run flux:version create v2              # Create new API version
  npm run flux:version copy v1 v2 weather     # Copy feature between versions
  npm run flux:version list                   # List all versions and status
  npm run flux:version deprecate v1           # Mark version as deprecated
  npm run flux:version migrate v1 v2          # Migrate all features v1→v2

VERSION STRATEGY:
  ✅ Backward Compatibility: Last 3 versions supported
  ✅ Gradual Migration: Copy and enhance features incrementally
  ✅ Clear Deprecation: 6-month deprecation cycle
  ✅ Version Headers: All responses include version info

FOLDER STRUCTURE:
  src/api/v1/weather/    # Version 1 weather API
  src/api/v2/weather/    # Version 2 weather API (enhanced)
  src/api/v3/weather/    # Version 3 weather API (latest)

URL PATTERNS:
  GET /api/v1/weather           # Version 1 endpoint
  GET /api/v2/weather/current   # Version 2 endpoint (enhanced)
  GET /api/v3/weather/current   # Version 3 endpoint (latest)

WORKFLOW:
  1. Create new version: flux:version create v2
  2. Copy existing features: flux:version copy v1 v2 weather
  3. Enhance specifications for breaking changes
  4. Test thoroughly before release
  5. Deprecate old versions after 3 releases

VALIDATION:
  All existing FLUX commands work with versions:
  - npm run flux:check v2/weather        # Check specific version
  - npm run flux:test v2/weather/main    # Test specific endpoint
  - npm run flux:uat v2                  # UAT test version
`);
}
