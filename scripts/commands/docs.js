/**
 * FLUX Framework Auto Documentation Generator - Generate API docs from specifications
 * @module @voilajsx/flux/scripts/commands/docs
 * @file scripts/commands/docs.js
 *
 * @llm-rule WHEN: Generating API documentation for features automatically
 * @llm-rule AVOID: Manual documentation that gets out of sync with code
 * @llm-rule NOTE: Uses specification as primary source, contract as secondary, requirements for context
 */

import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { join } from 'path';
import { createLogger } from '../logger.js';

const log = createLogger('docs');

/**
 * Auto documentation generator for FLUX Framework
 * @llm-rule WHEN: Building documentation for API endpoints and agent integration
 * @llm-rule AVOID: Stale documentation - regenerate on every build
 * @llm-rule NOTE: npm run flux:docs [target]
 *
 * Examples:
 * - npm run flux:docs                    # All features
 * - npm run flux:docs weather            # Weather feature only
 * - npm run flux:docs weather/main       # Specific endpoint only
 */
export default async function docs(args) {
  const startTime = Date.now();
  const target = args[0];

  try {
    log.info('📚 Starting auto documentation generation');

    const results = [];

    if (!target) {
      // Generate docs for all features
      results.push(...(await generateAllFeatureDocs()));
    } else if (target.includes('/')) {
      // Generate docs for specific endpoint
      const [feature, endpoint] = target.split('/');
      results.push(await generateEndpointDocs(feature, endpoint));
    } else {
      // Generate docs for specific feature
      results.push(...(await generateFeatureDocs(target)));
    }

    // Report results
    const duration = Date.now() - startTime;
    const successful = results.filter((r) => r.success).length;
    const total = results.length;

    if (successful === total) {
      console.log(
        `✅ Documentation generated (${successful}/${total}) ${duration}ms`
      );

      // Show what was generated
      results.forEach((result) => {
        console.log(`   📄 ${result.file}`);
      });

      return true;
    } else {
      console.log(
        `❌ Documentation generation failed (${successful}/${total}) ${duration}ms`
      );

      // Show failures
      results
        .filter((r) => !r.success)
        .forEach((result) => {
          console.log(`   ❌ ${result.feature}: ${result.error}`);
        });

      return false;
    }
  } catch (error) {
    console.log(`❌ Documentation generation error: ${error.message}`);
    return false;
  }
}

/**
 * Generate documentation for all features
 * @llm-rule WHEN: Building complete project documentation
 * @llm-rule AVOID: Processing disabled features (underscore prefix)
 * @llm-rule NOTE: Discovers all features and generates docs for each
 */
async function generateAllFeatureDocs() {
  const results = [];
  const apiPath = join(process.cwd(), 'src', 'api');

  try {
    const features = await readdir(apiPath);

    // Filter enabled features
    const enabledFeatures = [];
    for (const feature of features) {
      if (feature.startsWith('_') || feature.startsWith('.')) continue;

      const featurePath = join(apiPath, feature);
      const featureStat = await stat(featurePath);
      if (featureStat.isDirectory()) {
        enabledFeatures.push(feature);
      }
    }

    // Generate docs for each feature
    for (const feature of enabledFeatures) {
      const featureResults = await generateFeatureDocs(feature);
      results.push(...featureResults);
    }

    return results;
  } catch (error) {
    throw new Error(`Failed to discover features: ${error.message}`);
  }
}

/**
 * Generate documentation for specific feature
 * @llm-rule WHEN: Generating docs for one feature and all its endpoints
 * @llm-rule AVOID: Partial documentation - include all endpoints in feature
 * @llm-rule NOTE: Generates both markdown and JSON docs per feature
 */
async function generateFeatureDocs(feature) {
  const results = [];

  try {
    // Load feature data
    const featureData = await loadFeatureData(feature);

    // Generate markdown documentation
    const markdownResult = await generateMarkdownDocs(feature, featureData);
    results.push(markdownResult);

    // Generate JSON API specification
    const jsonResult = await generateApiJson(feature, featureData);
    results.push(jsonResult);

    return results;
  } catch (error) {
    return [
      {
        feature,
        success: false,
        error: error.message,
        file: null,
      },
    ];
  }
}

/**
 * Generate documentation for specific endpoint
 * @llm-rule WHEN: Generating docs for single endpoint during development
 * @llm-rule AVOID: Full feature regeneration when only one endpoint changed
 * @llm-rule NOTE: Updates feature-level docs with single endpoint changes
 */
async function generateEndpointDocs(feature, endpoint) {
  try {
    // For now, regenerate entire feature when endpoint changes
    // Future optimization: incremental endpoint documentation
    const featureResults = await generateFeatureDocs(feature);

    return {
      feature,
      endpoint,
      success: featureResults.every((r) => r.success),
      error: featureResults.find((r) => !r.success)?.error || null,
      file: `${feature}.readme.md + ${feature}.api.json`,
    };
  } catch (error) {
    return {
      feature,
      endpoint,
      success: false,
      error: error.message,
      file: null,
    };
  }
}

/**
 * Load feature data from specification, contracts, and requirements
 * @llm-rule WHEN: Gathering all data needed for documentation generation
 * @llm-rule AVOID: Missing data - collect from all available sources
 * @llm-rule NOTE: Specification primary, contract secondary, requirements context
 */
async function loadFeatureData(feature) {
  const featurePath = join(process.cwd(), 'src', 'api', feature);
  const data = {
    feature,
    specification: null,
    requirements: null,
    endpoints: [],
  };

  try {
    // Load specification (primary source)
    const specPath = join(featurePath, `${feature}.specification.json`);
    const specContent = await readFile(specPath, 'utf-8');
    data.specification = JSON.parse(specContent);
  } catch (error) {
    log.warn(`No specification found for ${feature}: ${error.message}`);
  }

  try {
    // Load requirements (context source)
    const reqPath = join(featurePath, `${feature}.requirements.yml`);
    const reqContent = await readFile(reqPath, 'utf-8');
    const yaml = await import('js-yaml');
    data.requirements = yaml.load(reqContent);
  } catch (error) {
    log.warn(`No requirements found for ${feature}: ${error.message}`);
  }

  // Discover endpoints and load contracts
  try {
    const items = await readdir(featurePath);

    for (const item of items) {
      const itemPath = join(featurePath, item);
      const itemStat = await stat(itemPath);

      if (itemStat.isDirectory() && !item.startsWith('_')) {
        // Look for contract file
        const contractFile = `${item}.contract.ts`;
        const contractPath = join(itemPath, contractFile);

        try {
          await stat(contractPath);
          const contractContent = await readFile(contractPath, 'utf-8');
          const contract = parseContractFile(contractContent);

          data.endpoints.push({
            name: item,
            contract,
            specification: data.specification?.endpoints?.[item] || null,
          });
        } catch (contractError) {
          log.warn(
            `No contract found for ${feature}/${item}: ${contractError.message}`
          );
        }
      }
    }
  } catch (error) {
    log.warn(`Failed to discover endpoints for ${feature}: ${error.message}`);
  }

  return data;
}

/**
 * Parse contract file to extract CONTRACT object
 * @llm-rule WHEN: Extracting route and metadata info from contract files
 * @llm-rule AVOID: Complex parsing - use simple regex extraction
 * @llm-rule NOTE: Contract files are pure objects, no imports allowed
 */
function parseContractFile(content) {
  try {
    // Extract CONTRACT object using regex
    const contractMatch = content.match(
      /export\s+const\s+CONTRACT\s*=\s*({[\s\S]*?});/
    );
    if (!contractMatch) {
      throw new Error('No CONTRACT export found');
    }

    // Parse the contract object
    const contractString = contractMatch[1];
    const contract = eval(`(${contractString})`);

    return contract;
  } catch (error) {
    throw new Error(`Failed to parse contract: ${error.message}`);
  }
}

/**
 * Generate markdown documentation for feature
 * @llm-rule WHEN: Creating human-readable API documentation
 * @llm-rule AVOID: Technical jargon - make it readable for developers
 * @llm-rule NOTE: Combines specification data with contract routes for complete docs
 */
async function generateMarkdownDocs(feature, featureData) {
  try {
    const { specification, requirements, endpoints } = featureData;

    // Build markdown content
    let markdown = `# ${feature.charAt(0).toUpperCase() + feature.slice(1)} API\n\n`;

    // Feature overview from requirements
    if (requirements) {
      markdown += `## Overview\n\n`;
      markdown += `${requirements.description || 'API endpoints for ' + feature}\n\n`;

      if (requirements.purpose) {
        markdown += `**Purpose:** ${requirements.purpose}\n\n`;
      }

      if (requirements.user_stories) {
        markdown += `## User Stories\n\n`;
        requirements.user_stories.forEach((story) => {
          markdown += `- **${story.story}**\n`;
          markdown += `  - Acceptance: ${story.acceptance}\n`;
          if (story.example) {
            markdown += `  - Example: \`${story.example}\`\n`;
          }
          markdown += `\n`;
        });
      }
    }

    // API Endpoints
    if (endpoints.length > 0) {
      markdown += `## API Endpoints\n\n`;

      endpoints.forEach((endpoint) => {
        const { name, contract, specification: endpointSpec } = endpoint;

        markdown += `### ${name}\n\n`;

        // Routes from contract
        if (contract?.routes) {
          Object.entries(contract.routes).forEach(([route, handler]) => {
            const [method, path] = route.split(' ');
            markdown += `**${method.toUpperCase()}** \`${path}\`\n\n`;
          });
        }

        // Description from specification
        if (endpointSpec?.purpose) {
          markdown += `${endpointSpec.purpose}\n\n`;
        }

        // Request schema
        if (endpointSpec?.request_schema) {
          markdown += `**Request:**\n\`\`\`json\n${JSON.stringify(endpointSpec.request_schema, null, 2)}\n\`\`\`\n\n`;
        }

        // Response schema
        if (endpointSpec?.response_schemas?.success_format) {
          markdown += `**Response:**\n\`\`\`json\n${JSON.stringify(endpointSpec.response_schemas.success_format, null, 2)}\n\`\`\`\n\n`;
        }

        // Business rules
        if (endpointSpec?.logic?.business_rules) {
          markdown += `**Business Rules:**\n`;
          endpointSpec.logic.business_rules.forEach((rule) => {
            markdown += `- ${rule}\n`;
          });
          markdown += `\n`;
        }

        // Error scenarios
        if (endpointSpec?.response_schemas?.error_types) {
          markdown += `**Error Responses:**\n`;
          Object.entries(endpointSpec.response_schemas.error_types).forEach(
            ([code, description]) => {
              markdown += `- **${code}:** ${description}\n`;
            }
          );
          markdown += `\n`;
        }
      });
    }

    // Authentication
    if (specification?.authentication?.required) {
      markdown += `## Authentication\n\n`;
      markdown += `This API requires authentication.\n\n`;

      if (specification.authentication.method) {
        markdown += `**Method:** ${specification.authentication.method}\n\n`;
      }

      if (specification.authentication.headers) {
        markdown += `**Required Headers:**\n`;
        specification.authentication.headers.forEach((header) => {
          markdown += `- \`${header}\`\n`;
        });
        markdown += `\n`;
      }
    }

    // External integrations
    if (specification?.external_integrations) {
      markdown += `## External Integrations\n\n`;
      Object.entries(specification.external_integrations).forEach(
        ([name, config]) => {
          markdown += `### ${name}\n`;
          markdown += `- **Base URL:** ${config.base_url}\n`;
          if (config.timeout) {
            markdown += `- **Timeout:** ${config.timeout}ms\n`;
          }
          markdown += `\n`;
        }
      );
    }

    // Add generation timestamp
    markdown += `---\n*Generated automatically on ${new Date().toISOString()}*\n`;

    // Write markdown file
    const markdownPath = join(
      process.cwd(),
      'src',
      'api',
      feature,
      `${feature}.readme.md`
    );
    await writeFile(markdownPath, markdown, 'utf-8');

    return {
      feature,
      success: true,
      file: `${feature}.readme.md`,
      error: null,
    };
  } catch (error) {
    return {
      feature,
      success: false,
      file: `${feature}.readme.md`,
      error: error.message,
    };
  }
}

/**
 * Generate JSON API specification for agents
 * @llm-rule WHEN: Creating machine-readable API specs for agent consumption
 * @llm-rule AVOID: Human-readable content - focus on structured data
 * @llm-rule NOTE: OpenAPI-style format optimized for LLM agents
 */
async function generateApiJson(feature, featureData) {
  try {
    const { specification, requirements, endpoints } = featureData;

    // Build JSON API specification
    const apiSpec = {
      feature,
      version: specification?.version || requirements?.version || '1.0.0',
      generated: new Date().toISOString(),
      description:
        requirements?.description ||
        specification?.purpose ||
        `API endpoints for ${feature}`,

      // Base configuration
      base_url: '/api',
      authentication: specification?.authentication || null,

      // Endpoints specification
      endpoints: {},
    };

    // Process each endpoint
    endpoints.forEach((endpoint) => {
      const { name, contract, specification: endpointSpec } = endpoint;

      apiSpec.endpoints[name] = {
        // Routes from contract
        routes: contract?.routes || {},

        // Specifications
        purpose: endpointSpec?.purpose || null,
        request_schema: endpointSpec?.request_schema || null,
        response_schema: endpointSpec?.response_schemas?.success_format || null,
        error_types: endpointSpec?.response_schemas?.error_types || {},

        // Business logic
        business_rules: endpointSpec?.logic?.business_rules || [],
        validations: endpointSpec?.logic?.validations || [],

        // Dependencies
        imports: contract?.imports || { appkit: [], external: [] },

        // Test information
        test_cases: contract?.tests || [],
      };
    });

    // External integrations
    if (specification?.external_integrations) {
      apiSpec.external_integrations = specification.external_integrations;
    }

    // Environment requirements
    if (specification?.environment_requirements) {
      apiSpec.environment_requirements = specification.environment_requirements;
    }

    // Write JSON file
    const jsonPath = join(
      process.cwd(),
      'src',
      'api',
      feature,
      `${feature}.api.json`
    );
    await writeFile(jsonPath, JSON.stringify(apiSpec, null, 2), 'utf-8');

    return {
      feature,
      success: true,
      file: `${feature}.api.json`,
      error: null,
    };
  } catch (error) {
    return {
      feature,
      success: false,
      file: `${feature}.api.json`,
      error: error.message,
    };
  }
}
