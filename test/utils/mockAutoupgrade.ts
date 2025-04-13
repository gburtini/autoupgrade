import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * A mock implementation of the autoupgrade executable for testing
 * This allows us to test the behavior in isolation
 */
export function mockAutoupgrade(cwd: string, command: string): void {
  console.log(`- Running initial checks...`);

  // Parse the command to get the test command (npm test, yarn test, etc.)
  const testCommand = command || 'npm test';
  
  try {
    // Run the test command
    execSync(testCommand, { cwd, stdio: 'inherit' });
    
    console.log(`✓ Initial checks passed. Proceeding with updates.`);
    
    // Detect the package manager
    const packageManagerType = detectPackageManager(cwd);
    
    // Get outdated packages
    const outdatedPackages = getOutdatedPackages(cwd, packageManagerType);
    
    if (outdatedPackages.length === 0) {
      console.log('No outdated packages found.');
      return;
    }
    
    console.log(`Found ${outdatedPackages.length} outdated packages:`);
    outdatedPackages.forEach(pkg => {
      console.log(`  - ${pkg.name}: ${pkg.current} -> ${pkg.latest}`);
    });
    
    // Simulate upgrading packages
    outdatedPackages.forEach(pkg => {
      console.log(`Upgrading ${pkg.name} from ${pkg.current} to ${pkg.latest}`);
      upgradePackage(cwd, packageManagerType, pkg.name);
    });
    
    console.log('All packages upgraded successfully.');
    
  } catch (error) {
    console.error(`✖ Initial checks failed. Aborting.`);
    console.error('');
    console.error('Please ensure your checks pass before proceeding with updates.');
    console.error('');
    console.error(`The check command was:`);
    console.error(`  ${command}`);
    console.error('');
    console.error('You can change this by passing a command as an argument.');
    console.error('Example:');
    console.error(`  $ npx autoupgrade 'npm test'`);
    
    process.exit(1);
  }
}

/**
 * Detect which package manager is being used in the current directory
 */
function detectPackageManager(cwd: string): string {
  if (fs.existsSync(path.join(cwd, 'yarn.lock'))) {
    return 'yarn';
  } else if (fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  return 'npm';
}

/**
 * Get a list of outdated packages
 */
function getOutdatedPackages(cwd: string, packageManager: string): Array<{name: string, current: string, latest: string}> {
  // Check for mock outdated files
  switch (packageManager) {
    case 'npm': {
      const npmOutdatedPath = path.join(cwd, '.npmoutdated');
      if (fs.existsSync(npmOutdatedPath)) {
        const data = JSON.parse(fs.readFileSync(npmOutdatedPath, 'utf8'));
        return Object.keys(data).map(name => ({
          name,
          current: data[name].current,
          latest: data[name].latest
        }));
      }
      break;
    }
    case 'yarn': {
      const yarnOutdatedPath = path.join(cwd, '.yarnoutdated');
      if (fs.existsSync(yarnOutdatedPath)) {
        return JSON.parse(fs.readFileSync(yarnOutdatedPath, 'utf8'));
      }
      break;
    }
    case 'pnpm': {
      const pnpmOutdatedPath = path.join(cwd, '.pnpmoutdated');
      if (fs.existsSync(pnpmOutdatedPath)) {
        return JSON.parse(fs.readFileSync(pnpmOutdatedPath, 'utf8'));
      }
      break;
    }
  }
  
  return [];
}

/**
 * Simulate upgrading a package
 */
function upgradePackage(cwd: string, packageManager: string, packageName: string): void {
  // In a real implementation, this would actually upgrade the package
  // For test purposes, we just simulate it
  
  const packageJsonPath = path.join(cwd, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Update version in package.json to simulate an upgrade
    if (packageJson.dependencies && packageJson.dependencies[packageName]) {
      packageJson.dependencies[packageName] = 'latest';
    }
    
    if (packageJson.devDependencies && packageJson.devDependencies[packageName]) {
      packageJson.devDependencies[packageName] = 'latest';
    }
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
}

// For direct execution from command line
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || '';
  mockAutoupgrade(process.cwd(), command);
}