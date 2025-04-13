import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { PackageManagerTestEnv, PackageManager } from './packageManagerEnv';
import { mockAutoupgrade } from './mockAutoupgrade';

/**
 * Helper class for testing autoupgrade within isolated package manager environments
 */
export class AutoupgradeTestHelper {
  private packageManagerEnv: PackageManagerTestEnv;
  
  constructor(packageManager: PackageManager) {
    this.packageManagerEnv = new PackageManagerTestEnv(packageManager);
  }

  /**
   * Set up a test project with sample dependencies
   */
  public setup(): void {
    this.packageManagerEnv.setup();
    
    // Add some test dependencies with specific versions
    this.packageManagerEnv.installDependency('lodash@4.17.20');
    this.packageManagerEnv.installDependency('chalk@4.1.0');
    this.packageManagerEnv.installDependency('express@4.17.1', true);
  }

  /**
   * Add a test script that passes
   */
  public addPassingTestScript(): void {
    const packageJson = this.packageManagerEnv.getPackageJson();
    
    packageJson.scripts = {
      ...packageJson.scripts,
      test: 'node -e "console.log(\'Tests passing!\'); process.exit(0)"'
    };
    
    this.packageManagerEnv.updatePackageJson(packageJson);
  }

  /**
   * Add a test script that fails
   */
  public addFailingTestScript(): void {
    const packageJson = this.packageManagerEnv.getPackageJson();
    
    packageJson.scripts = {
      ...packageJson.scripts,
      test: 'node -e "console.error(\'Tests failing!\'); process.exit(1)"'
    };
    
    this.packageManagerEnv.updatePackageJson(packageJson);
  }

  /**
   * Create a mock outdated result file to simulate package manager outdated command
   */
  public createMockOutdatedResult(): void {
    const packageManager = this.packageManagerEnv.getPackageManager();
    const testDir = this.packageManagerEnv.testDir;
    
    // Create a mock file that autoupgrade would read for outdated packages
    switch (packageManager) {
      case 'npm':
        // Create a mock .npmoutdated file
        fs.writeFileSync(
          path.join(testDir, '.npmoutdated'),
          JSON.stringify({
            lodash: {
              current: '4.17.20',
              wanted: '4.17.21',
              latest: '4.17.21',
              location: 'node_modules/lodash'
            },
            chalk: {
              current: '4.1.0',
              wanted: '4.1.2',
              latest: '4.1.2',
              location: 'node_modules/chalk'
            }
          })
        );
        break;
      case 'yarn':
        // Create a mock yarn outdated file
        fs.writeFileSync(
          path.join(testDir, '.yarnoutdated'),
          JSON.stringify([
            { name: 'lodash', current: '4.17.20', latest: '4.17.21' },
            { name: 'chalk', current: '4.1.0', latest: '4.1.2' }
          ])
        );
        break;
      case 'pnpm':
        // Create a mock pnpm outdated file
        fs.writeFileSync(
          path.join(testDir, '.pnpmoutdated'),
          JSON.stringify([
            { name: 'lodash', current: '4.17.20', latest: '4.17.21' },
            { name: 'chalk', current: '4.1.0', latest: '4.1.2' }
          ])
        );
        break;
    }
  }

  /**
   * Create a simple index.js file to make sure the project is buildable
   */
  public createSampleApp(): void {
    const indexContent = `
const lodash = require('lodash');
const chalk = require('chalk');

console.log(chalk.green('Hello from test app'));
console.log(lodash.capitalize('this is a test'));
`;
    
    fs.writeFileSync(
      path.join(this.packageManagerEnv.testDir, 'index.js'),
      indexContent
    );
  }

  /**
   * Run the autoupgrade tool on the test project
   * @param args Additional arguments to pass to autoupgrade
   * @param useMock Use the mock implementation instead of the real one
   * @param ignoreErrors Whether to ignore execution errors (default: true)
   */
  public runAutoupgrade(args: string = '', useMock = true, ignoreErrors = true): string {
    if (useMock) {
      // Use our mock implementation
      try {
        // Capture console output to string
        let output = '';
        const originalStdoutWrite = process.stdout.write;
        const originalStderrWrite = process.stderr.write;
        
        // Capture stdout
        process.stdout.write = ((write) => {
          return (string) => {
            output += string;
            return write.call(process.stdout, string);
          };
        })(process.stdout.write);
        
        // Capture stderr
        process.stderr.write = ((write) => {
          return (string) => {
            output += string;
            return write.call(process.stderr, string);
          };
        })(process.stderr.write);
        
        // Run the mock implementation
        try {
          mockAutoupgrade(this.packageManagerEnv.testDir, args);
        } catch (e) {
          // Ignore process.exit() in the mock
        }
        
        // Restore console
        process.stdout.write = originalStdoutWrite;
        process.stderr.write = originalStderrWrite;
        
        return output;
      } catch (error) {
        if (ignoreErrors) {
          return (error as any).message || 'Error running mock autoupgrade';
        }
        throw error;
      }
    } else {
      // Use the real implementation (for reference)
      const autoupgradePath = path.resolve(process.cwd(), 'build/index.mjs');
      
      if (!fs.existsSync(autoupgradePath)) {
        throw new Error('Autoupgrade executable not found. Did you run the build command?');
      }
      
      try {
        return this.packageManagerEnv.runCommand(`node ${autoupgradePath} ${args}`, ignoreErrors);
      } catch (error) {
        if (ignoreErrors) {
          return (error as any).stdout?.toString() || (error as any).stderr?.toString() || error.message;
        }
        throw error;
      }
    }
  }

  /**
   * Get the package manager environment for direct access
   */
  public getEnv(): PackageManagerTestEnv {
    return this.packageManagerEnv;
  }

  /**
   * Clean up the test environment
   */
  public cleanup(): void {
    this.packageManagerEnv.cleanup();
  }
}