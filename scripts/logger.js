/**
 * ATOM Framework Custom Logger - Dual output system optimized for human developers and AI agents
 * @module @voilajsx/atom/scripts/logger
 * @file scripts/logger.js
 *
 * @llm-rule WHEN: Logging validation results for both human review and agent processing
 * @llm-rule AVOID: Mixing human and agent output formats - use separate methods for each audience
 * @llm-rule NOTE: Agents only see failures and important events, humans get full formatted output
 */

/**
 * ANSI color codes for enhanced human-readable terminal output
 * @llm-rule WHEN: Formatting console output for developer readability
 * @llm-rule AVOID: Using colors in CI environments - check NO_COLOR environment variable
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

/**
 * ATOM Framework logger with specialized dual output for human-agent collaboration
 * @llm-rule WHEN: Creating logger instances for ATOM validation commands
 * @llm-rule AVOID: Using console.log directly - use structured logging methods for consistency
 * @llm-rule NOTE: Designed for 95% agent + 5% human oversight workflow
 */
export class AtomLogger {
  /**
   * Creates logger instance for specific ATOM component
   * @llm-rule WHEN: Initializing loggers for validation commands (types, lint, contract, test)
   * @llm-rule AVOID: Generic component names - use specific command names for better debugging
   */
  constructor(component = 'atom') {
    this.component = component;
  }

  /**
   * Applies color formatting to text with environment awareness
   * @llm-rule WHEN: Formatting terminal output for human developers
   * @llm-rule AVOID: Colors in test environments or CI - respects NO_COLOR standard
   * @llm-rule NOTE: Automatically disabled in test/CI environments for clean output
   */
  colorize(text, color) {
    if (process.env.NO_COLOR || process.env.NODE_ENV === 'test') {
      return text;
    }
    return `${colors[color]}${text}${colors.reset}`;
  }

  /**
   * Human-friendly output with emojis and visual formatting for developer experience
   * @llm-rule WHEN: Displaying information that developers need to see and understand
   * @llm-rule AVOID: Agent data in human output - keep focused on developer needs
   * @llm-rule NOTE: Uses emojis and formatting to make validation results scannable
   */
  human(message) {
    console.log(message);
  }

  /**
   * Agent-precise JSON output for AI processing and decision making
   * @llm-rule WHEN: Communicating validation failures and important events to AI agents
   * @llm-rule AVOID: Success noise - agents only need failures and critical decision points
   * @llm-rule NOTE: Filters out success events to reduce agent noise and focus on actionable items
   */
  agent(action, data = {}) {
    // Skip all success noise - agents only need failures and important events
    if (
      action.includes('SUCCESS') ||
      action.includes('PASSED') ||
      action.includes('START')
    ) {
      return;
    }

    const logData = {
      action,
      timestamp: Date.now(),
      ...data,
    };

    const robotIcon = this.colorize('🤖', 'cyan');
    const jsonData = this.colorize(JSON.stringify(logData), 'gray');
    console.log(`${robotIcon} ATOM_DATA: ${jsonData}`);
  }

  /**
   * Pipeline step logging for validation sequence tracking
   * @llm-rule WHEN: Showing progress through multi-step validation pipeline (check command)
   * @llm-rule AVOID: Step logging for single validations - use only for multi-step processes
   * @llm-rule NOTE: Helps developers understand which validation is currently running
   */
  step(stepNum, total, name) {
    const stepText = this.colorize(
      `📋 Step ${stepNum}/${total}: Running ${name}`,
      'blue'
    );
    this.human(stepText);
  }

  /**
   * Validation start notification for pipeline initialization
   * @llm-rule WHEN: Beginning any ATOM validation command (types, lint, contract, test)
   * @llm-rule AVOID: Multiple start calls for same validation - call once per command
   * @llm-rule NOTE: Sets context for subsequent validation steps and results
   */
  validationStart(command) {
    const startText = this.colorize(
      `🔍 ATOM: ${command} validation starting...`,
      'cyan'
    );
    this.human(startText);
  }

  /**
   * Individual check start notification within validation
   * @llm-rule WHEN: Starting specific validation checks within a command
   * @llm-rule AVOID: Check start without corresponding checkPass/checkFail calls
   * @llm-rule NOTE: Creates expectation for completion status - always pair with result
   */
  checkStart(checkName) {
    const checkText = this.colorize(`📋 ${checkName}...`, 'blue');
    this.human(checkText);
  }

  /**
   * Check success notification with performance timing
   * @llm-rule WHEN: Validation check completes successfully with clean results
   * @llm-rule AVOID: Calling for failed checks - use checkFail for consistency
   * @llm-rule NOTE: Duration helps developers understand performance characteristics
   */
  checkPass(checkName, duration) {
    const successText = this.colorize(
      `✅ ${checkName} passed (${duration}ms)`,
      'green'
    );
    this.human(successText);
  }

  /**
   * Check failure notification with detailed error context for agent processing
   * @llm-rule WHEN: Validation check fails and needs both human and agent attention
   * @llm-rule AVOID: Generic error messages - provide specific errors and actionable suggestions
   * @llm-rule NOTE: Agent data includes fix suggestions and affected files for automated processing
   */
  checkFail(checkName, duration, errors = [], suggestions = []) {
    const failText = this.colorize(
      `❌ ${checkName} failed (${duration}ms)`,
      'red'
    );
    this.human(failText);

    // Agent gets detailed error info for processing
    const robotIcon = this.colorize('🤖', 'cyan');
    const errorData = {
      status: 'failed',
      check: checkName,
      duration,
      errors: errors.slice(0, 5), // Limit to prevent overwhelming output
      fix_suggestions: suggestions,
      affected_files: this.extractFileNames(errors),
      timestamp: Date.now(),
    };

    console.log(`${robotIcon} ERROR:`);
    console.log(this.colorize(JSON.stringify(errorData, null, 2), 'red'));
  }

  /**
   * Validation completion summary with overall status
   * @llm-rule WHEN: Completing any validation command with final status determination
   * @llm-rule AVOID: Multiple completion calls for same validation - call once at end
   * @llm-rule NOTE: Provides clear success/failure status for CI/CD integration
   */
  validationComplete(command, status, duration) {
    const emoji = status === 'success' ? '✅' : '❌';
    const color = status === 'success' ? 'green' : 'red';
    const statusText = status === 'success' ? 'passed' : 'failed';

    const completeText = this.colorize(
      `${emoji} ${command} validation ${statusText} (${duration}ms)`,
      color
    );

    this.human(completeText);
  }

  /**
   * Command completion with distinctive final status line for script termination
   * @llm-rule WHEN: Ending ATOM validation commands with clear success/failure indication
   * @llm-rule AVOID: Ambiguous completion messages - use clear success/failure indicators
   * @llm-rule NOTE: Provides process exit context and agent success notification
   */
  commandComplete(command, duration, success = true) {
    if (success) {
      const successText = this.colorize(
        `🚀 ${command} completed (${duration}ms)`,
        'bright'
      );
      this.human(successText);

      // Agent gets simple success indicator
      const robotIcon = this.colorize('🤖', 'cyan');
      console.log(`${robotIcon} SUCCESS: ${command}`);
    } else {
      const failText = this.colorize(
        `💥 ${command} failed (${duration}ms)`,
        'red'
      );
      this.human(failText);
    }
  }

  /**
   * Error logging with structured data for agent processing and human debugging
   * @llm-rule WHEN: Handling validation crashes, system errors, or critical failures
   * @llm-rule AVOID: Using for expected validation failures - use checkFail instead
   * @llm-rule NOTE: Includes fix suggestions and context for both human debugging and agent processing
   */
  error(humanMessage, agentData = {}, suggestions = []) {
    const errorText = this.colorize(`💥 ${humanMessage}`, 'red');
    this.human(errorText);

    const robotIcon = this.colorize('🤖', 'cyan');
    const errorData = {
      status: 'error',
      message: humanMessage,
      fix_suggestions: suggestions,
      context: agentData,
      timestamp: Date.now(),
    };

    console.log(`${robotIcon} ERROR:`);
    console.log(this.colorize(JSON.stringify(errorData, null, 2), 'red'));
  }

  /**
   * Warning logging with actionable suggestions for non-critical issues
   * @llm-rule WHEN: Reporting validation warnings that don't block pipeline but need attention
   * @llm-rule AVOID: Warnings without actionable suggestions - provide clear next steps
   * @llm-rule NOTE: Agent data only shown when actionable suggestions exist
   */
  warn(humanMessage, suggestions = []) {
    const warnText = this.colorize(`⚠️ ${humanMessage}`, 'yellow');
    this.human(warnText);

    // Only show agent data if there are actionable suggestions
    if (suggestions.length > 0) {
      const robotIcon = this.colorize('🤖', 'cyan');
      const warnData = {
        status: 'warning',
        message: humanMessage,
        fix_suggestions: suggestions,
        timestamp: Date.now(),
      };

      console.log(`${robotIcon} WARNING:`);
      console.log(this.colorize(JSON.stringify(warnData, null, 2), 'yellow'));
    }
  }

  /**
   * Informational logging for non-critical updates and suggestions
   * @llm-rule WHEN: Displaying helpful information that doesn't require action
   * @llm-rule AVOID: Critical information that requires action - use warn or error instead
   * @llm-rule NOTE: Uses passive yellow styling to indicate informational nature
   */
  info(message) {
    const infoText = this.colorize(message, 'yellow');
    this.human(infoText);
  }

  /**
   * Suggestion logging for optional improvements with passive styling
   * @llm-rule WHEN: Providing optional code improvements that don't block pipeline
   * @llm-rule AVOID: Required changes as suggestions - use error or warn for mandatory fixes
   * @llm-rule NOTE: Uses dim styling to indicate lowest priority optional changes
   */
  suggestion(message) {
    const suggestionText = this.colorize(message, 'dim');
    this.human(suggestionText);
  }

  /**
   * Pipeline success notification for complete validation workflow completion
   * @llm-rule WHEN: All validation checks in pipeline pass successfully
   * @llm-rule AVOID: Calling for partial success - use only when entire pipeline succeeds
   * @llm-rule NOTE: Provides final confirmation for CI/CD and agent decision making
   */
  pipelineSuccess(totalTime, passedCount, totalCount) {
    this.human('');
    this.human(
      this.colorize('🎉 ATOM: All validation checks passed!', 'green')
    );
    this.human('');

    const robotIcon = this.colorize('🤖', 'cyan');
    console.log(
      `${robotIcon} PIPELINE_SUCCESS: ${passedCount}/${totalCount} checks passed in ${totalTime}ms`
    );
  }

  /**
   * Pipeline failure notification with failure context for debugging
   * @llm-rule WHEN: Validation pipeline stops due to check failure
   * @llm-rule AVOID: Calling for individual check failures - use only for pipeline halt
   * @llm-rule NOTE: Provides failure step context for rapid debugging and agent intervention
   */
  pipelineFail(totalTime, failedStep, totalSteps) {
    this.human('');
    this.human(
      this.colorize(
        `💥 ATOM: Validation pipeline stopped at step ${failedStep}/${totalSteps}`,
        'red'
      )
    );

    const robotIcon = this.colorize('🤖', 'cyan');
    const errorData = {
      status: 'pipeline_failed',
      failed_step: failedStep,
      total_steps: totalSteps,
      duration: totalTime,
      timestamp: Date.now(),
    };

    console.log(`${robotIcon} PIPELINE_FAILED:`);
    console.log(this.colorize(JSON.stringify(errorData, null, 2), 'red'));
  }

  /**
   * Extract file names from error messages for agent context and processing
   * @llm-rule WHEN: Processing error messages to identify affected files for agent action
   * @llm-rule AVOID: Processing non-file-related errors - use only for file-based validation errors
   * @llm-rule NOTE: Returns unique file list for agent to understand scope of required fixes
   */
  extractFileNames(errors) {
    return [
      ...new Set(
        errors
          .map((error) => {
            const match = error.match(/([^\/\s]+\.(ts|js|tsx|jsx))/);
            return match ? match[1] : null;
          })
          .filter(Boolean)
      ),
    ];
  }
}

/**
 * Factory function to create component-specific logger instances
 * @llm-rule WHEN: Creating loggers for ATOM validation commands and components
 * @llm-rule AVOID: Creating multiple loggers for same component - reuse instances
 * @llm-rule NOTE: Provides consistent logging interface across all ATOM validation commands
 */
export function createLogger(component) {
  return new AtomLogger(component);
}
