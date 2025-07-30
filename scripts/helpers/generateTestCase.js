/**
 * FLUX Framework UAT Test Case Generation Helper
 * @module @voilajsx/flux/scripts/helpers/generateTestCase
 * @file scripts/helpers/generateTestCase.js
 *
 * @llm-rule WHEN: Generating comprehensive UAT test cases in Excel format
 * @llm-rule AVOID: Monolithic functions - keep each function focused and testable
 * @llm-rule NOTE: Creates specification-driven test cases with essential security tests
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { createLogger } from '../logger.js';
import ExcelJS from 'exceljs';

const log = createLogger('generate-testcase');

/**
 * Generate UAT test cases for all features
 * @param {boolean} overwrite - Whether to overwrite existing files
 * @returns {Promise<Array>} Array of generation results
 */
export async function generateAllFeatureTestCases(overwrite) {
  const results = [];
  const apiPath = join(process.cwd(), 'src', 'api');

  try {
    const features = await readdir(apiPath);

    const enabledFeatures = [];
    for (const feature of features) {
      if (feature.startsWith('_') || feature.startsWith('.')) continue;

      const featurePath = join(apiPath, feature);
      const featureStat = await stat(featurePath);
      if (featureStat.isDirectory()) {
        enabledFeatures.push(feature);
      }
    }

    for (const feature of enabledFeatures) {
      const result = await generateFeatureTestCases(feature, overwrite);
      results.push(result);
    }

    return results;
  } catch (error) {
    throw new Error(
      `Failed to discover features for test case generation: ${error.message}`
    );
  }
}

/**
 * Generate Excel test cases for specific feature
 * @param {string} feature - Feature name
 * @param {boolean} overwrite - Whether to overwrite existing files
 * @returns {Promise<Object>} Generation result with success status and file info
 */
export async function generateFeatureTestCases(feature, overwrite) {
  try {
    const timestamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:-]/g, '');
    const baseFilename = `${feature}.testcases`;
    const featurePath = join(process.cwd(), 'src', 'api', feature);

    // Create __uat__ folder within feature
    const uatPath = join(featurePath, '__uat__');
    try {
      await stat(uatPath);
    } catch (error) {
      // Create __uat__ folder if it doesn't exist
      const { mkdir } = await import('fs/promises');
      await mkdir(uatPath, { recursive: true });
    }

    let excelFilename;
    let wasOverwritten = false;

    if (overwrite) {
      excelFilename = `${baseFilename}.xlsx`;
      wasOverwritten = true;
    } else {
      excelFilename = `${baseFilename}_${timestamp}.xlsx`;
    }

    const excelPath = join(uatPath, excelFilename); // Place in __uat__ folder

    // Load feature data
    const featureData = await loadFeatureForUAT(feature);

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();

    workbook.creator = 'FLUX Framework UAT Generator';
    workbook.lastModifiedBy = 'FLUX Framework';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Generate worksheets
    await createTestCasesWorksheet(workbook, feature, featureData);
    await createEnvironmentConfigWorksheet(workbook, feature, featureData);
    await createSummaryWorksheet(workbook, feature, featureData);

    // Save Excel file
    await workbook.xlsx.writeFile(excelPath);

    const testCasesGenerated = countGeneratedTestCases(featureData);

    return {
      feature,
      success: true,
      excelFile: `__uat__/${excelFilename}`, // Include folder in file path
      testCasesGenerated,
      wasOverwritten,
      error: null,
    };
  } catch (error) {
    return {
      feature,
      success: false,
      excelFile: null,
      testCasesGenerated: 0,
      wasOverwritten: false,
      error: error.message,
    };
  }
}

/**
 * Create Test Cases worksheet with comprehensive test scenarios
 * @param {ExcelJS.Workbook} workbook - Excel workbook instance
 * @param {string} feature - Feature name
 * @param {Object} featureData - Feature data with endpoints and specifications
 * @returns {Promise<ExcelJS.Worksheet>} Created worksheet
 */
export async function createTestCasesWorksheet(workbook, feature, featureData) {
  const worksheet = workbook.addWorksheet('Test Cases');

  const columns = [
    { header: 'Test ID', key: 'testId', width: 25 },
    { header: 'Endpoint', key: 'endpoint', width: 15 },
    { header: 'Test Case Name', key: 'testName', width: 45 },
    { header: 'Category', key: 'category', width: 18 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Method', key: 'method', width: 10 },
    { header: 'Path', key: 'path', width: 30 },
    { header: 'Test Data (JSON)', key: 'testData', width: 35 },
    { header: 'Expected Status', key: 'expectedStatus', width: 15 },
    { header: 'Expected Response', key: 'expectedResponse', width: 40 },
    { header: 'Actual Status', key: 'actualStatus', width: 15 },
    { header: 'Actual Response', key: 'actualResponse', width: 40 },
    { header: 'Result', key: 'result', width: 12 },
    { header: 'Duration (ms)', key: 'duration', width: 15 },
    { header: 'Error Details', key: 'errorDetails', width: 40 },
    { header: 'Notes', key: 'notes', width: 50 },
  ];

  worksheet.columns = columns;

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '366092' },
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 25;

  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  let rowIndex = 2;

  for (const endpoint of featureData.endpoints) {
    const { name, contract, specification } = endpoint;

    for (const [route, handler] of Object.entries(contract?.routes || {})) {
      const [method, path] = route.split(' ');

      // Generate test cases based on specification test cases
      const testCases = generateTestCasesFromSpecification(
        feature,
        name,
        method,
        path,
        specification
      );

      for (const testCase of testCases) {
        const row = worksheet.getRow(rowIndex++);

        row.values = {
          testId: testCase.id,
          endpoint: name,
          testName: testCase.name,
          category: testCase.category,
          priority: testCase.priority,
          method: method.toUpperCase(),
          path: testCase.testPath, // Use the resolved path with actual values
          testData: testCase.testData
            ? JSON.stringify(testCase.testData, null, 2)
            : '{}',
          expectedStatus: testCase.expectedStatus,
          expectedResponse: testCase.expectedResponse,
          actualStatus: '',
          actualResponse: '',
          result: '',
          duration: '',
          errorDetails: '',
          notes: '',
        };

        // Clean white background for generate phase
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFF' },
        };

        // Add borders
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });

        // Format test data cell
        if (row.getCell('testData')) {
          row.getCell('testData').alignment = {
            wrapText: true,
            vertical: 'top',
          };
        }
      }
    }
  }

  // Auto-filter and freeze panes
  worksheet.autoFilter = 'A1:P1';
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

  // Add data validation for Result column
  const resultColumn = worksheet.getColumn('result');
  resultColumn.eachCell((cell, rowNumber) => {
    if (rowNumber > 1) {
      cell.dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"PASS,FAIL,SKIP,BLOCKED"'],
      };
    }
  });

  return worksheet;
}

/**
 * Generate test cases from specification test cases with parameter replacement
 * @param {string} feature - Feature name
 * @param {string} endpoint - Endpoint name
 * @param {string} method - HTTP method
 * @param {string} path - Endpoint path with parameters
 * @param {Object} specification - Endpoint specification
 * @returns {Array} Array of test case objects
 */
export function generateTestCasesFromSpecification(
  feature,
  endpoint,
  method,
  path,
  specification
) {
  const testCases = [];

  // First, add specification-based test cases
  if (
    specification?.test?.test_cases &&
    specification.test.test_cases.length > 0
  ) {
    specification.test.test_cases.forEach((testCase, index) => {
      const testId = `${feature}_${endpoint}_${method.toLowerCase()}_${String(index + 1).padStart(3, '0')}`;

      // Extract test data and resolve path parameters
      const { testData, resolvedPath } = extractTestDataAndResolvePath(
        testCase,
        path
      );

      // Determine category based on test case content
      const category = categorizeTestCase(testCase);

      // Determine priority
      const priority =
        testCase.expected_status === 200
          ? 'high'
          : category === 'validation'
            ? 'high'
            : 'medium';

      testCases.push({
        id: testId,
        name: testCase.name,
        category: category,
        priority: priority,
        testData: testData,
        testPath: resolvedPath, // Use resolved path with actual values
        expectedStatus: testCase.expected_status,
        expectedResponse: generateExpectedResponseFromTestCase(testCase),
      });
    });
  } else {
    // Fallback: create basic happy path test if no specification test cases
    const testId = `${feature}_${endpoint}_${method.toLowerCase()}_001`;
    const apiPath = path.startsWith('/api') ? path : `/api${path}`;

    testCases.push({
      id: testId,
      name: `${method.toUpperCase()} ${path} - Successful Request`,
      category: 'happy_path',
      priority: 'high',
      testData: {},
      testPath: apiPath,
      expectedStatus: 200,
      expectedResponse: 'success=true, data object, requestId, timestamp',
    });
  }

  // Add essential security and validation tests for endpoints with parameters
  if (path.includes(':')) {
    const securityTests = generateSecurityTests(
      feature,
      endpoint,
      method,
      path
    );
    testCases.push(...securityTests);
  }

  return testCases;
}

/**
 * Extract test data and resolve path parameters with actual values
 * @param {Object} testCase - Test case from specification
 * @param {string} endpointPath - Endpoint path template
 * @returns {Object} Object with testData and resolvedPath
 */
export function extractTestDataAndResolvePath(testCase, endpointPath) {
  let testData = {};
  let resolvedPath = endpointPath;

  // Add /api prefix
  if (!resolvedPath.startsWith('/api')) {
    resolvedPath = `/api${resolvedPath}`;
  }

  if (testCase.path) {
    const testPath = testCase.path;

    // Extract path parameters and replace them in the resolved path
    const pathParams = endpointPath.match(/:(\w+)/g);
    if (pathParams) {
      pathParams.forEach((param) => {
        const paramName = param.slice(1); // Remove ':'

        if (paramName === 'city') {
          if (testPath.includes('/weather/')) {
            const pathParts = testPath.split('/weather/');
            if (pathParts[1]) {
              let cityValue = pathParts[1];

              // Handle URL encoded values
              if (cityValue.includes('%')) {
                try {
                  cityValue = decodeURIComponent(cityValue);
                } catch (e) {
                  // Keep original if decode fails
                }
              }

              // Replace parameter in resolved path
              resolvedPath = resolvedPath.replace(param, cityValue);

              // Don't add to testData since it's in the path
            }
          }
        } else {
          // Generic parameter extraction for other param types
          const pathRegex = endpointPath.replace(/:(\w+)/g, '([^/]+)');
          const match = testPath.match(new RegExp(pathRegex));
          if (match) {
            const paramIndex = endpointPath
              .split('/')
              .findIndex((part) => part === param);
            if (paramIndex > 0 && match[paramIndex]) {
              const value = decodeURIComponent(match[paramIndex]);
              resolvedPath = resolvedPath.replace(param, value);
            }
          }
        }
      });
    }

    // Extract query parameters if present (these go in testData)
    if (testPath.includes('?')) {
      const [, queryString] = testPath.split('?');
      const queryParams = new URLSearchParams(queryString);

      queryParams.forEach((value, key) => {
        testData[key] = value;
      });
    }
  }

  return { testData, resolvedPath };
}

/**
 * Generate security and validation tests for parameterized endpoints
 * @param {string} feature - Feature name
 * @param {string} endpoint - Endpoint name
 * @param {string} method - HTTP method
 * @param {string} path - Endpoint path
 * @returns {Array} Array of security test cases
 */
export function generateSecurityTests(feature, endpoint, method, path) {
  const testCases = [];
  const baseId = `${feature}_${endpoint}_${method.toLowerCase()}`;
  let securityIndex = 900; // Start from 900 for security tests

  // Extract parameter names for replacement
  const pathParams = path.match(/:(\w+)/g) || [];

  // Security test payloads
  const securityPayloads = [
    // XSS Protection Tests (Essential ⭐⭐⭐)
    {
      name: 'XSS Script Tag Protection',
      category: 'security',
      priority: 'high',
      payload: '<script>alert("xss")</script>',
      expectedStatus: 400,
      expectedResponse: 'Malicious input rejected, XSS attempt blocked',
    },
    {
      name: 'XSS Image Tag Protection',
      category: 'security',
      priority: 'high',
      payload: '<img src=x onerror=alert(1)>',
      expectedStatus: 400,
      expectedResponse: 'Malicious input rejected, XSS attempt blocked',
    },
    // SQL Injection Tests (Essential ⭐⭐⭐)
    {
      name: 'SQL Injection DROP TABLE Protection',
      category: 'security',
      priority: 'high',
      payload: "'; DROP TABLE users; --",
      expectedStatus: 400,
      expectedResponse: 'Malicious input rejected, SQL injection blocked',
    },
    {
      name: 'SQL Injection UNION Protection',
      category: 'security',
      priority: 'high',
      payload: "' OR '1'='1",
      expectedStatus: 400,
      expectedResponse: 'Malicious input rejected, SQL injection blocked',
    },
    // Input Length Validation Tests (Essential ⭐⭐⭐)
    {
      name: 'Empty Input Validation',
      category: 'validation',
      priority: 'high',
      payload: '',
      expectedStatus: 400,
      expectedResponse: 'Empty input rejected with clear error message',
    },
    {
      name: 'Extremely Long Input Validation',
      category: 'validation',
      priority: 'high',
      payload: 'A'.repeat(1000),
      expectedStatus: 400,
      expectedResponse: 'Input too long rejected with length limit error',
    },
    // Special Character Handling Tests (Essential ⭐⭐)
    {
      name: 'Null Byte Protection',
      category: 'security',
      priority: 'medium',
      payload: 'test\0null',
      expectedStatus: 400,
      expectedResponse: 'Invalid characters rejected',
    },
    {
      name: 'Control Characters Protection',
      category: 'security',
      priority: 'medium',
      payload: 'test\n\r\tcontrol',
      expectedStatus: 400,
      expectedResponse: 'Invalid characters rejected',
    },
    // Unicode/Encoding Tests (Important ⭐⭐)
    {
      name: 'Unicode Character Support',
      category: 'edge_cases',
      priority: 'medium',
      payload: '测试数据',
      expectedStatus: 200,
      expectedResponse: 'Unicode characters handled correctly',
    },
    {
      name: 'URL Encoding Bypass Protection',
      category: 'security',
      priority: 'medium',
      payload: '%3Cscript%3Ealert%281%29%3C%2Fscript%3E',
      expectedStatus: 400,
      expectedResponse: 'Encoded malicious input rejected',
    },
    // Boundary Values Tests (Important ⭐)
    {
      name: 'Negative Number Handling',
      category: 'edge_cases',
      priority: 'low',
      payload: '-1',
      expectedStatus: 400,
      expectedResponse: 'Invalid negative value rejected',
    },
    {
      name: 'Integer Overflow Protection',
      category: 'edge_cases',
      priority: 'low',
      payload: '2147483648',
      expectedStatus: 400,
      expectedResponse: 'Integer overflow handled gracefully',
    },
  ];

  // Generate test cases for each security payload
  securityPayloads.forEach((securityTest) => {
    // Create resolved path by replacing parameters with the payload
    let resolvedPath = path.startsWith('/api') ? path : `/api${path}`;

    pathParams.forEach((param) => {
      resolvedPath = resolvedPath.replace(
        param,
        encodeURIComponent(securityTest.payload)
      );
    });

    testCases.push({
      id: `${baseId}_${securityIndex++}_${securityTest.name.toLowerCase().replace(/\s+/g, '_')}`,
      name: `${method.toUpperCase()} ${path} - ${securityTest.name}`,
      category: securityTest.category,
      priority: securityTest.priority,
      testData: {}, // Empty since parameters are in the path
      testPath: resolvedPath,
      expectedStatus: securityTest.expectedStatus,
      expectedResponse: securityTest.expectedResponse,
    });
  });

  return testCases;
}

/**
 * Categorize test case based on its name and expected status
 * @param {Object} testCase - Test case object
 * @returns {string} Category name
 */
export function categorizeTestCase(testCase) {
  const name = testCase.name.toLowerCase();
  const status = testCase.expected_status;

  if (status === 200) {
    return 'happy_path';
  } else if (status === 400) {
    if (
      name.includes('empty') ||
      name.includes('required') ||
      name.includes('reject') ||
      name.includes('exceed')
    ) {
      return 'validation';
    } else if (
      name.includes('xss') ||
      name.includes('script') ||
      name.includes('dangerous')
    ) {
      return 'security';
    } else {
      return 'validation';
    }
  } else if (status === 404) {
    return 'error_handling';
  } else if (status === 503 || status === 504) {
    return 'error_handling';
  } else if (name.includes('performance') || name.includes('time')) {
    return 'performance';
  } else if (name.includes('unicode') || name.includes('encoded')) {
    return 'edge_cases';
  } else {
    return 'validation';
  }
}

/**
 * Generate expected response description from test case
 * @param {Object} testCase - Test case object
 * @returns {string} Expected response description
 */
export function generateExpectedResponseFromTestCase(testCase) {
  const status = testCase.expected_status;

  if (status === 200) {
    if (testCase.validation) {
      const validation = testCase.validation;
      if (validation.includes('.toBe(')) {
        const expectedMatch = validation.match(/\.toBe\(['"`]([^'"`]+)['"`]\)/);
        if (expectedMatch) {
          return `success=true, data contains: ${expectedMatch[1]}`;
        }
      }
      return 'success=true, data object with expected values';
    }
    return 'success=true, data object, requestId, timestamp';
  } else if (status === 400) {
    if (testCase.validation) {
      const validation = testCase.validation;
      if (validation.includes('error') && validation.includes('.toBe(')) {
        const errorMatch = validation.match(
          /error.*\.toBe\(['"`]([^'"`]+)['"`]\)/
        );
        if (errorMatch) {
          return `success=false, error: "${errorMatch[1]}"`;
        }
      }
    }
    return 'success=false, error message, requestId';
  } else if (status === 404) {
    return 'success=false, not found error';
  } else if (status === 503) {
    return 'success=false, service unavailable error';
  } else {
    return `success=false, appropriate error response`;
  }
}

/**
 * Create Environment Configuration worksheet
 * @param {ExcelJS.Workbook} workbook - Excel workbook instance
 * @param {string} feature - Feature name
 * @param {Object} featureData - Feature data
 * @returns {Promise<ExcelJS.Worksheet>} Created worksheet
 */
export async function createEnvironmentConfigWorksheet(
  workbook,
  feature,
  featureData
) {
  const worksheet = workbook.addWorksheet('Environment Config');

  const environments = [
    ['Setting', 'Development', 'Staging', 'Production'],
    [
      'Base URL',
      'http://localhost:3000',
      'https://staging.yourapp.com',
      'https://yourapp.com',
    ],
    ['Timeout (ms)', '10000', '15000', '10000'],
    ['Retries', '2', '3', '1'],
    ['Auth Required', 'false', 'true', 'true'],
    ['Auth Token', '(none)', 'Bearer staging-token', 'Bearer prod-token'],
    [
      'Description',
      'Local development',
      'Pre-production testing',
      'Live production',
    ],
  ];

  environments.forEach((row, index) => {
    const worksheetRow = worksheet.getRow(index + 1);
    worksheetRow.values = row;

    if (index === 0) {
      worksheetRow.font = { bold: true };
      worksheetRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '366092' },
      };
    }
  });

  worksheet.getColumn(1).width = 20;
  worksheet.getColumn(2).width = 25;
  worksheet.getColumn(3).width = 25;
  worksheet.getColumn(4).width = 25;

  return worksheet;
}

/**
 * Create Summary worksheet with test statistics
 * @param {ExcelJS.Workbook} workbook - Excel workbook instance
 * @param {string} feature - Feature name
 * @param {Object} featureData - Feature data
 * @returns {Promise<ExcelJS.Worksheet>} Created worksheet
 */
export async function createSummaryWorksheet(workbook, feature, featureData) {
  const worksheet = workbook.addWorksheet('Summary');

  const testCasesCount = countGeneratedTestCases(featureData);

  const summaryData = [
    ['FLUX Framework UAT Test Summary'],
    [''],
    ['Feature', feature],
    ['Generated At', new Date().toISOString()],
    ['Total Endpoints', featureData.endpoints.length],
    ['Total Test Cases', testCasesCount],
    [''],
    ['Test Categories'],
    ['Happy Path Tests', 'Verify successful scenarios'],
    ['Validation Tests', 'Test input validation rules'],
    ['Security Tests', 'XSS, SQL injection, malicious input protection'],
    ['Error Handling Tests', 'External API failures'],
    ['Edge Case Tests', 'Unicode, encoding, boundary conditions'],
  ];

  summaryData.forEach((row, index) => {
    const worksheetRow = worksheet.getRow(index + 1);
    worksheetRow.values = Array.isArray(row) ? row : [row];

    if (index === 0) {
      worksheetRow.font = { bold: true, size: 16 };
    } else if (index === 7) {
      worksheetRow.font = { bold: true };
    }
  });

  worksheet.getColumn(1).width = 25;
  worksheet.getColumn(2).width = 40;

  return worksheet;
}

/**
 * Count total test cases that will be generated
 * @param {Object} featureData - Feature data with endpoints
 * @returns {number} Total test case count
 */
export function countGeneratedTestCases(featureData) {
  let totalTests = 0;

  featureData.endpoints.forEach((endpoint) => {
    const testCasesCount =
      endpoint.specification?.test?.test_cases?.length || 0;
    const routeCount = Object.keys(endpoint.contract?.routes || {}).length;

    // Count specification-based test cases
    if (testCasesCount > 0) {
      totalTests += testCasesCount;
    } else {
      // Fallback: one test per route
      totalTests += routeCount;
    }

    // Add security and validation tests for endpoints with parameters
    for (const [route] of Object.entries(endpoint.contract?.routes || {})) {
      const [, path] = route.split(' ');
      if (path && path.includes(':')) {
        // Add 12 security/validation tests per parameterized endpoint
        totalTests += 12;
      }
    }
  });

  return totalTests;
}

/**
 * Load feature data for UAT processing
 * @param {string} feature - Feature name
 * @returns {Promise<Object>} Feature data with specification and endpoints
 */
export async function loadFeatureForUAT(feature) {
  const featurePath = join(process.cwd(), 'src', 'api', feature);
  const data = {
    feature,
    specification: null,
    endpoints: [],
  };

  // Load specification
  try {
    const specPath = join(featurePath, `${feature}.specification.json`);
    const specContent = await readFile(specPath, 'utf-8');
    data.specification = JSON.parse(specContent);
  } catch (error) {
    log.warn(`No specification found for ${feature}: ${error.message}`);
  }

  // Discover endpoints and contracts
  try {
    const items = await readdir(featurePath);

    for (const item of items) {
      const itemPath = join(featurePath, item);
      const itemStat = await stat(itemPath);

      if (itemStat.isDirectory() && !item.startsWith('_')) {
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
 * @param {string} content - Contract file content
 * @returns {Object} Parsed contract object
 */
export function parseContractFile(content) {
  try {
    const contractMatch = content.match(
      /export\s+const\s+CONTRACT\s*=\s*({[\s\S]*?});/
    );
    if (!contractMatch) {
      throw new Error('No CONTRACT export found');
    }

    const contractString = contractMatch[1];
    const contract = eval(`(${contractString})`);

    return contract;
  } catch (error) {
    throw new Error(`Failed to parse contract: ${error.message}`);
  }
}
