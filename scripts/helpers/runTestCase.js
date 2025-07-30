/**
 * FLUX Framework UAT Test Case Execution Helper - GREEN FOR PASS, LIGHT RED FOR FAIL, BLUE HEADER, ROW BORDERS, SINGLE-LINE JSON, ALWAYS RUN
 * @module @voilajsx/flux/scripts/helpers/runTestCase
 * @file scripts/helpers/runTestCase.js
 */

import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { createLogger } from '../logger.js';
import { chromium } from 'playwright';
import ExcelJS from 'exceljs';

const log = createLogger('run-testcase');

// Color definitions
const ROW_COLORS = {
  PASS: 'FFC6EFCE', // Light Green - Entire row for successful test cases
  FAIL: 'FFFF9999', // Light Red - Entire row for failed test cases
  HEADER: 'FF4DA8FF', // Blue - Header row
};

// Text color
const TEXT_COLOR = {
  DEFAULT: 'FF000000', // Black text for all cells
};

/**
 * Run UAT tests for all features
 * @returns {Promise<Array>} Array of execution results
 */
export async function runAllFeatureTests() {
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
      const result = await runFeatureTests(feature);
      results.push(result);
    }

    return results;
  } catch (error) {
    throw new Error(
      `Failed to discover features for UAT execution: ${error.message}`
    );
  }
}

/**
 * Run UAT tests for all test cases, update successful (green) and failed (red) rows in new Excel file
 * @param {string} feature - Feature name
 * @returns {Promise<Object>} Execution result
 */
export async function runFeatureTests(feature) {
  const featurePath = join(process.cwd(), 'src', 'api', feature);
  const uatPath = join(featurePath, '__uat__');

  try {
    // Find the latest Excel file to use as input
    const inputExcelFile = await findLatestExcelFile(uatPath, feature);
    if (!inputExcelFile) {
      throw new Error(
        `No Excel test file found. Run: npm run flux:uat generate:${feature}`
      );
    }

    const inputExcelPath = join(uatPath, inputExcelFile);

    // Generate new output file name with timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .split('.')[0];
    const outputExcelFile = `${feature}.testcases_results_${timestamp}.xlsx`;
    const outputExcelPath = join(uatPath, outputExcelFile);

    // Load input Excel workbook
    const inputWorkbook = new ExcelJS.Workbook();
    await inputWorkbook.xlsx.readFile(inputExcelPath);
    const inputWorksheet = inputWorkbook.getWorksheet('Test Cases');

    if (!inputWorksheet) {
      throw new Error('Test Cases worksheet not found in input Excel file');
    }

    // Create new output workbook and copy structure/data
    const outputWorkbook = new ExcelJS.Workbook();
    const outputWorksheet = outputWorkbook.addWorksheet('Test Cases');
    outputWorksheet.columns = inputWorksheet.columns; // Copy column headers
    inputWorksheet.eachRow((row, rowNumber) => {
      outputWorksheet.addRow(row.values); // Copy all rows
    });

    // Style header row (row 1) with blue background, black text, bold
    const headerRow = outputWorksheet.getRow(1);
    for (let col = 1; col <= 16; col++) {
      const cell = headerRow.getCell(col);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: ROW_COLORS.HEADER }, // Blue background
      };
      cell.font = {
        color: { argb: TEXT_COLOR.DEFAULT }, // Black text
        bold: true,
        size: 11,
      };
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FF000000' } }, // Black bottom border
      };
    }
    headerRow.commit();
    console.log(
      `   🎨 Header row styled: Blue background, black bold text, bottom border`
    );

    // Copy other worksheets (Environment Config, Summary)
    inputWorkbook.eachSheet((sheet, sheetId) => {
      if (sheet.name !== 'Test Cases') {
        const newSheet = outputWorkbook.addWorksheet(sheet.name);
        newSheet.columns = sheet.columns;
        sheet.eachRow((row) => newSheet.addRow(row.values));
      }
    });

    // Extract test cases from input worksheet
    const testCases = extractTestCasesFromExcel(inputWorksheet);

    console.log(`🧪 Starting UAT execution for ${feature}`);
    console.log(`   Input Excel file: ${inputExcelFile}`);
    console.log(`   Output Excel file: ${outputExcelFile}`);
    console.log(`   Total tests: ${testCases.length}`);
    console.log(`   Browser: Visible Chromium with 2s delays\n`);

    // Initialize browser
    const browser = await chromium.launch({
      headless: false,
      slowMo: 500, // Slow down for visual feedback
    });

    const context = await browser.newContext({
      userAgent: 'FLUX-UAT-Execution/1.0.0',
    });
    const page = await context.newPage();

    let testsPassed = 0;
    let testsFailed = 0;

    try {
      // Execute all test cases
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const rowIndex = i + 2; // Excel rows start from 2 (after header)

        console.log(
          `🧪 [${i + 1}/${testCases.length}] Testing: ${testCase.method} ${testCase.path}`
        );

        // Set browser title for visual feedback
        await page.setExtraHTTPHeaders({
          'X-Test-Case': `${i + 1}/${testCases.length}: ${testCase.name}`,
        });

        // Update Excel row to RUNNING status (no background color)
        await updateExcelRow(
          outputWorksheet,
          rowIndex,
          {
            actualStatus: 'RUNNING',
            actualResponse: 'Test in progress...',
            result: 'RUNNING',
            duration: '',
            errorDetails: '',
            testData: testCase.testData,
          },
          null
        );

        // Execute the test case
        const testResult = await executeTestCase(testCase, page);

        // Update row based on test result
        const colorCode = testResult.passed ? ROW_COLORS.PASS : ROW_COLORS.FAIL;
        await updateExcelRow(
          outputWorksheet,
          rowIndex,
          {
            actualStatus: testResult.status,
            actualResponse: testResult.response
              ? JSON.stringify(testResult.response)
              : String(testResult.error),
            result: testResult.passed ? 'PASS' : 'FAIL',
            duration: testResult.duration,
            errorDetails: testResult.error || '',
            testData: testCase.testData,
          },
          colorCode
        );

        // Log result
        const statusEmoji = testResult.passed ? '✅' : '❌';
        const resultText = testResult.passed ? 'PASS' : 'FAIL';
        console.log(
          `   ${statusEmoji} Status: ${testResult.status} | Duration: ${testResult.duration}ms | ${resultText}`
        );

        if (testResult.passed) {
          testsPassed++;
          console.log(
            `   ✅ Row ${rowIndex}: UPDATED → Green background (PASS)`
          );
        } else {
          testsFailed++;
          console.log(
            `   ❌ Row ${rowIndex}: UPDATED → Light red background (FAIL)`
          );
          console.log(`   ❌ Error: ${testResult.error}`);
        }

        // Wait 2 seconds before next test (unless it's the last test)
        if (i < testCases.length - 1) {
          console.log(`   ⏱️  Waiting 2 seconds before next test...\n`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      // Save to new output Excel file
      await outputWorkbook.xlsx.writeFile(outputExcelPath);
      console.log(`   💾 New Excel file saved: ${outputExcelFile}`);

      console.log(`\n✅ UAT execution completed for ${feature}`);
      console.log(`   Total tests: ${testCases.length}`);
      console.log(`   Passed: ${testsPassed}`);
      console.log(`   Failed: ${testsFailed}`);
      console.log(`   Output Excel: ${outputExcelFile}`);

      if (testsFailed > 0) {
        console.log(
          `\n⚠️  ${testsFailed} test(s) failed - check output Excel for details`
        );
        console.log(`   Run again to re-test: npm run flux:uat run:${feature}`);
      } else {
        console.log(`\n🎉 All tests passed successfully!`);
      }
      await browser.close();

      return {
        feature,
        success: true,
        status: 'completed',
        testsRun: testCases.length,
        testsPassed,
        testsFailed,
        excelFile: outputExcelFile,
      };
    } catch (error) {
      console.log(`\n💥 SYSTEM ERROR - UAT execution halted`);
      console.log(`   Error: ${error.message}`);
      console.log(`   This is a system error, not a test failure`);
      console.log(
        `\n💡 Fix the system issue and run: npm run flux:uat run:${feature}`
      );

      // Save to new output Excel file before halting
      await outputWorkbook.xlsx.writeFile(outputExcelPath);
      console.log(`   💾 New Excel file saved: ${outputExcelFile}`);

      await browser.close();
      throw error;
    }
  } catch (error) {
    return {
      feature,
      success: false,
      status: 'error',
      testsRun: 0,
      testsPassed: 0,
      testsFailed: 0,
      error: error.message,
      excelFile: null,
    };
  }
}

/**
 * Execute individual test case against localhost:3000
 */
async function executeTestCase(testCase, page) {
  const startTime = Date.now();

  try {
    console.log(`   ⏳ Navigating to http://localhost:3000${testCase.path}...`);

    let response;
    let responseBody;

    // Build full URL
    const fullUrl = `http://localhost:3000${testCase.path}`;

    // Add query parameters if test data contains them
    const url = new URL(fullUrl);
    if (testCase.testData && typeof testCase.testData === 'object') {
      Object.entries(testCase.testData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          url.searchParams.append(key, value);
        }
      });
    }

    // Execute request based on method
    if (testCase.method === 'GET') {
      response = await page.goto(url.toString(), {
        waitUntil: 'networkidle',
        timeout: 10000,
      });

      // Try to get JSON response from page content
      try {
        const pageContent = await page.content();
        const preElement = await page.$('pre');
        if (preElement) {
          const text = await preElement.textContent();
          responseBody = JSON.parse(text);
        } else {
          // Try to extract JSON from page content
          const jsonMatch = pageContent.match(/{.*}/s);
          if (jsonMatch) {
            responseBody = JSON.parse(jsonMatch[0]);
          } else {
            responseBody = {
              error: 'No JSON response found',
              content: pageContent.slice(0, 200) + '...',
            };
          }
        }
      } catch (parseError) {
        responseBody = {
          error: 'Failed to parse response as JSON',
          parseError: parseError.message,
        };
      }
    } else {
      // For POST/PUT/DELETE, use fetch API
      const fetchOptions = {
        method: testCase.method,
        headers: { 'Content-Type': 'application/json' },
      };

      if (testCase.testData && Object.keys(testCase.testData).length > 0) {
        fetchOptions.body = JSON.stringify(testCase.testData);
      }

      const fetchResult = await page.evaluate(
        async ({ url, options }) => {
          try {
            const res = await fetch(url, options);
            return {
              status: res.status,
              text: await res.text(),
            };
          } catch (error) {
            return {
              status: null,
              error: error.message,
            };
          }
        },
        { url: url.toString(), options: fetchOptions }
      );

      response = { status: () => fetchResult.status };

      try {
        responseBody = JSON.parse(fetchResult.text);
      } catch {
        responseBody = { error: 'Non-JSON response', text: fetchResult.text };
      }
    }

    const status = response.status?.() || response.status || 0;
    const duration = Date.now() - startTime;

    // Determine if test passed based on expected status
    const expectedStatus = parseInt(testCase.expectedStatus) || 200;
    const passed = status === expectedStatus;

    return {
      passed,
      status,
      duration,
      response: responseBody,
      error: passed
        ? null
        : `Expected status ${expectedStatus} but got ${status}`,
    };
  } catch (error) {
    return {
      passed: false,
      status: null,
      duration: Date.now() - startTime,
      response: null,
      error: error.message,
    };
  }
}

/**
 * Update Excel row - Green for PASS, light red for FAIL, black text, bottom border, single-line JSON
 * @param {Worksheet} worksheet - Excel worksheet
 * @param {number} rowIndex - Row number to update
 * @param {Object} results - Test results
 * @param {string|null} colorCode - Background color code (green for PASS, light red for FAIL)
 */
async function updateExcelRow(worksheet, rowIndex, results, colorCode) {
  const row = worksheet.getRow(rowIndex);

  console.log(`   🎨 Updating row ${rowIndex} - Result: ${results.result}`);

  // Validate ARGB color codes
  function isValidArgb(color) {
    return /^FF[0-9A-F]{6}$/i.test(color);
  }

  try {
    // Clear existing cell styles for all columns (A-P, 1-16)
    for (let col = 1; col <= 16; col++) {
      const cell = row.getCell(col);
      cell.fill = null;
      cell.font = null;
      cell.border = null;
    }

    // Update result columns
    if (results.testData !== undefined) {
      const testDataStr =
        typeof results.testData === 'object'
          ? JSON.stringify(results.testData, null, 2)
          : String(results.testData);
      row.getCell(8).value = testDataStr;
    }

    row.getCell(11).value = results.actualStatus; // Actual Status
    row.getCell(12).value = results.actualResponse; // Actual Response (single-line)
    row.getCell(14).value = results.duration; // Duration (ms)
    row.getCell(15).value = results.errorDetails; // Error Details

    // Result column (M)
    const resultCell = row.getCell(13);
    resultCell.value = results.result;

    if (
      (results.result === 'PASS' || results.result === 'FAIL') &&
      colorCode &&
      isValidArgb(colorCode)
    ) {
      // Apply green (PASS) or light red (FAIL) background to entire row (A-P)
      for (let col = 1; col <= 16; col++) {
        const cell = row.getCell(col);
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: colorCode }, // Green or light red background
        };
        cell.font = {
          color: { argb: TEXT_COLOR.DEFAULT }, // Black text
          size: 11,
        };
        cell.border = {
          bottom: { style: 'medium', color: { argb: 'FF000000' } }, // Black bottom border
        };
      }
      resultCell.value = results.result === 'PASS' ? 'PASS ✅' : 'FAIL ❌';
      console.log(
        `   ✅ Applied ${results.result === 'PASS' ? 'green' : 'light red'} background to entire row for ${results.result}`
      );
    } else if (results.result === 'RUNNING') {
      // Apply black text, no background for RUNNING
      for (let col = 1; col <= 16; col++) {
        const cell = row.getCell(col);
        cell.font = {
          color: { argb: TEXT_COLOR.DEFAULT },
          size: 11,
        };
        cell.border = {
          bottom: { style: 'medium', color: { argb: 'FF000000' } }, // Black bottom border
        };
      }
      resultCell.value = 'RUNNING ⏳';
      console.log(`   ⏳ Applied black text for RUNNING (no background)`);
    } else {
      // For unexpected results, apply bottom border only
      for (let col = 1; col <= 16; col++) {
        row.getCell(col).border = {
          bottom: { style: 'medium', color: { argb: 'FF000000' } },
        };
      }
      console.log(
        `   ⚠️ No style update for result: ${results.result}, added bottom border`
      );
      return;
    }

    // Format text columns for better readability
    row.getCell(12).alignment = { wrapText: true, vertical: 'top' }; // Actual Response
    row.getCell(15).alignment = { wrapText: true, vertical: 'top' }; // Error Details

    row.commit();
    console.log(`   ✅ Row ${rowIndex} updated successfully`);
  } catch (error) {
    console.error(`   ❌ Error updating row ${rowIndex}:`, error.message);
    throw error;
  }
}

/**
 * Extract test cases from Excel worksheet
 */
function extractTestCasesFromExcel(worksheet) {
  const testCases = [];

  // Start from row 2 (skip header)
  for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex++) {
    const row = worksheet.getRow(rowIndex);

    // Skip empty rows - check first column (testId)
    if (!row.getCell(1).value) continue;

    const testCase = {
      testId: row.getCell(1).value, // Column A
      endpoint: row.getCell(2).value, // Column B
      name: row.getCell(3).value, // Column C
      category: row.getCell(4).value, // Column D
      priority: row.getCell(5).value, // Column E
      method: row.getCell(6).value, // Column F
      path: row.getCell(7).value, // Column G
      testData: parseTestData(row.getCell(8).value), // Column H
      expectedStatus: row.getCell(9).value, // Column I
      expectedResponse: row.getCell(10).value, // Column J
    };

    // DEBUGGING: Log test data extraction
    console.log(`   📊 Extracted test case ${testCase.testId}:`, {
      method: testCase.method,
      path: testCase.path,
      testData: testCase.testData,
      hasTestData:
        !!testCase.testData && Object.keys(testCase.testData).length > 0,
    });

    testCases.push(testCase);
  }

  return testCases;
}

/**
 * Parse test data from Excel cell
 */
function parseTestData(testDataString) {
  if (
    !testDataString ||
    testDataString.trim() === '' ||
    testDataString.trim() === '{}'
  ) {
    return {};
  }

  try {
    // Handle case where it's already an object
    if (typeof testDataString === 'object') {
      return testDataString;
    }

    return JSON.parse(testDataString);
  } catch (error) {
    log.warn(`Failed to parse test data: ${testDataString}`);
    return {};
  }
}

/**
 * Find the latest Excel file in UAT directory
 */
async function findLatestExcelFile(uatPath, feature) {
  try {
    const files = await readdir(uatPath);
    const excelFiles = files.filter(
      (file) =>
        file.startsWith(`${feature}.testcases`) &&
        file.endsWith('.xlsx') &&
        !file.includes('_results_')
    );

    if (excelFiles.length === 0) {
      return null;
    }

    // Sort by modification time, newest first
    const filesWithStats = await Promise.all(
      excelFiles.map(async (file) => {
        const filePath = join(uatPath, file);
        const stats = await stat(filePath);
        return { file, mtime: stats.mtime };
      })
    );

    filesWithStats.sort((a, b) => b.mtime - a.mtime);
    return filesWithStats[0].file;
  } catch (error) {
    return null;
  }
}

/**
 * DEBUGGING HELPER: Test color values and generate sample Excel
 */
export async function debugColorTest() {
  console.log('🎨 Color Debug Test:');
  console.log('ROW_COLORS:', ROW_COLORS);
  console.log('TEXT_COLOR:', TEXT_COLOR);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Color Test');
  worksheet.columns = [
    { header: 'Test Data', key: 'testData' },
    { header: 'Actual Status', key: 'actualStatus' },
    { header: 'Actual Response', key: 'actualResponse' },
    { header: 'Result', key: 'result' },
    { header: 'Duration', key: 'duration' },
    { header: 'Error Details', key: 'errorDetails' },
  ];

  // Style header row
  const headerRow = worksheet.getRow(1);
  for (let col = 1; col <= 6; col++) {
    const cell = headerRow.getCell(col);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: ROW_COLORS.HEADER },
    };
    cell.font = {
      color: { argb: TEXT_COLOR.DEFAULT },
      bold: true,
      size: 11,
    };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FF000000' } },
    };
  }
  headerRow.commit();

  // Test PASS row with green background, black text, single-line JSON
  await updateExcelRow(
    worksheet,
    2,
    {
      testData: { city: 'mumbai' },
      actualStatus: '200',
      actualResponse: {
        success: true,
        data: { city: 'mumbai', temperature: 28 },
      },
      result: 'PASS',
      duration: 300,
      errorDetails: '',
    },
    ROW_COLORS.PASS
  );

  // Test FAIL row with light red background, black text, single-line JSON
  await updateExcelRow(
    worksheet,
    3,
    {
      testData: { city: 'invalid' },
      actualStatus: '400',
      actualResponse: { error: 'Invalid city' },
      result: 'FAIL',
      duration: 1000,
      errorDetails: 'Expected status 200 but got 400',
    },
    ROW_COLORS.FAIL
  );

  await workbook.xlsx.writeFile('color_test.xlsx');
  console.log(
    '📝 Created color_test.xlsx to verify colors and single-line JSON'
  );
}
