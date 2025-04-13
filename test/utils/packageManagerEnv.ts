import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { temporaryDirectory } from "tempy";

export type PackageManager = "npm" | "yarn" | "pnpm";

/**
 * Creates a scoped test environment for a specific package manager
 */
export class PackageManagerTestEnv {
  public readonly testDir: string;
  private readonly packageManager: PackageManager;

  constructor(packageManager: PackageManager) {
    this.packageManager = packageManager;
    this.testDir = temporaryDirectory();
  }

  /**
   * Get the package manager type
   */
  public getPackageManager(): PackageManager {
    return this.packageManager;
  }

  /**
   * Initialize a test project with the specified package manager
   */
  public setup(): void {
    // Initialize the project based on package manager
    switch (this.packageManager) {
      case "npm":
        execSync("npm init -y", { cwd: this.testDir });
        break;
      case "yarn":
        execSync("yarn init -y", { cwd: this.testDir });
        break;
      case "pnpm":
        execSync("pnpm init", { cwd: this.testDir });
        break;
    }
  }

  /**
   * Install a dependency using the specified package manager
   */
  public installDependency(packageName: string, dev = false): void {
    const devFlag = dev
      ? this.packageManager === "npm"
        ? "--save-dev"
        : "-D"
      : "";

    switch (this.packageManager) {
      case "npm":
        execSync(`npm install ${devFlag} ${packageName}`, {
          cwd: this.testDir,
        });
        break;
      case "yarn":
        execSync(`yarn add ${devFlag} ${packageName}`, { cwd: this.testDir });
        break;
      case "pnpm":
        execSync(`pnpm add ${devFlag} ${packageName}`, { cwd: this.testDir });
        break;
    }
  }

  /**
   * Get the current package.json content
   */
  public getPackageJson(): any {
    const packageJsonPath = path.join(this.testDir, "package.json");
    return JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  }

  /**
   * Update package.json content
   */
  public updatePackageJson(content: any): void {
    const packageJsonPath = path.join(this.testDir, "package.json");
    fs.writeFileSync(packageJsonPath, JSON.stringify(content, null, 2));
  }

  /**
   * Run a command in the test environment
   * @param command The command to execute
   * @param ignoreErrors Whether to catch and return output even if command fails
   */
  public runCommand(command: string, ignoreErrors = false): string {
    try {
      return execSync(command, { cwd: this.testDir }).toString();
    } catch (error: any) {
      if (ignoreErrors) {
        // Return stderr or stdout if available
        return (
          error.stderr?.toString() || error.stdout?.toString() || error.message
        );
      }
      throw error;
    }
  }

  /**
   * Clean up the test environment
   */
  public cleanup(): void {
    // Optional: Implement cleanup logic if needed
    // fs.rmSync(this.testDir, { recursive: true, force: true });
  }
}
