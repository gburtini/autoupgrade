#!/usr/bin/env node

import { execSync, spawnSync } from "child_process";

import ora from "ora";
import chalk from "chalk";
import prompts from "prompts";
import ProgressBar from "progress";

const args = process.argv.slice(2);
const checkCommand = args[0] || "npm test";

function run(command: string): string | null {
  if (typeof command !== "string") {
    throw new TypeError("The 'command' parameter must be a string.");
  }
  try {
    const result = execSync(command, { stdio: "pipe" }).toString();
    return result.trim();
  } catch (e: any) {
    console.error(chalk.red("Error executing command:"), command);
    console.error(chalk.red("Error details:"), e.message);
    return null;
  }
}

function runChecks(): boolean {
  const [cmd, ...cmdArgs] = checkCommand.split(" ");
  const result = spawnSync(cmd, cmdArgs, { stdio: "inherit" });
  return result.status === 0;
}

function getOutdatedPackages(): string[] {
  const spinner = ora("Checking for outdated packages...").start();
  try {
    const output = execSync("npm outdated --json", { stdio: "pipe" })
      .toString()
      .trim();
    spinner.succeed("Outdated packages retrieved.");
    if (!output) return [];
    const json = JSON.parse(output);
    return Object.keys(json);
  } catch (err: any) {
    // The code here is pretty silly, but `npm outdated` returns 1 when there are
    // outdated packages, and 0 when there are none. We need to check the output
    // to determine if this is an actual failure or not.

    if (err.status === 1 && err.stdout) {
      spinner.succeed("Outdated packages retrieved.");
      try {
        const json = JSON.parse(err.stdout.toString());
        return Object.keys(json);
      } catch {
        spinner.fail("Malformed JSON in npm outdated output.");
        console.error(chalk.red("Malformed JSON in npm outdated output."));
      }
    } else {
      spinner.fail("Failed to retrieve outdated packages.");
      console.error(
        chalk.red("Unexpected error running npm outdated:"),
        err.message
      );
    }
    return [];
  }
}

async function upgradePackage(pkg: string): Promise<boolean> {
  const spinner = ora(`Updating ${pkg}...`).start();
  run(`npm install ${pkg}@latest`);
  spinner.text = `Running checks for ${pkg}...`;
  if (runChecks()) {
    spinner.succeed(`✅ ${pkg} updated successfully`);
    return true;
  } else {
    spinner.fail(`❌ ${pkg} failed checks, reverting...`);
    run("git restore package.json package-lock.json");
    run("npm install");
    return false;
  }
}

async function main(): Promise<void> {
  const spinner = ora("Running initial checks...").start();
  if (!runChecks()) {
    spinner.fail("Initial checks failed. Aborting.");
    console.error();
    console.error(
      chalk.white(
        "Please ensure your checks pass before proceeding with updates."
      )
    );
    console.error();
    console.error(chalk.white("The check command was:"));
    console.error(chalk.gray(`  ${checkCommand}`));
    console.error();
    console.error(
      chalk.white("You can change this by passing a command as an argument.")
    );
    console.error(chalk.white("Example:"));
    console.error(chalk.gray("  $ npx autoupgrade 'npm test'"));

    process.exit(1);
  }
  spinner.succeed("Initial checks passed.");

  const outdated = getOutdatedPackages();
  if (outdated.length === 0) {
    console.log(chalk.green("All dependencies are up to date."));
    return;
  }

  console.log(chalk.yellow(`Found ${outdated.length} outdated packages.`));
  console.log(chalk.blue("Outdated packages:"));
  outdated.forEach((pkg) => console.log(`- ${pkg}`));
  const { confirm } = await prompts({
    type: "confirm",
    name: "confirm",
    message: "Do you want to proceed with updating these packages?",
    initial: true,
  });

  if (!confirm) {
    console.log(chalk.blue("Update process aborted."));
    return;
  }

  const initialBranch = run("git rev-parse --abbrev-ref HEAD");
  if (!initialBranch) {
    console.error(chalk.red("Failed to determine the current branch."));
    return;
  }
  const workBranch = `update-deps-${Date.now()}`;

  run(`git checkout -b ${workBranch}`);
  console.log(chalk.green(`Switched to new branch: ${workBranch}`));

  const bar = new ProgressBar("[:bar] :current/:total :package", {
    total: outdated.length,
    width: 30,
  });

  for (const pkg of outdated) {
    bar.tick({ package: pkg });
    await upgradePackage(pkg);
  }

  console.log(chalk.green("\nFinished attempting updates."));
  console.log(
    chalk.blue(
      `You're now on branch ${workBranch} (you were on ${initialBranch})`
    )
  );
  console.log(chalk.yellow("Review changes and merge if satisfied."));
}

main();
