import { execSync, spawnSync } from "child_process";

function run(command: string): string | null {
  if (typeof command !== "string") {
    throw new TypeError("The 'command' parameter must be a string.");
  }
  try {
    const result = execSync(command, { stdio: "pipe" }).toString();
    return result.trim();
  } catch (e: any) {
    console.error("Error executing command:", command);
    console.error("Error details:", e.message);
    return null;
  }
}

function runChecks(): boolean {
  const result = spawnSync("npm", ["run", "checks"], { stdio: "inherit" });
  return result.status === 0;
}

function getOutdatedPackages(): string[] {
  try {
    const output = execSync("npm outdated --json", { stdio: "pipe" })
      .toString()
      .trim();
    if (!output) return [];
    const json = JSON.parse(output);
    return Object.keys(json);
  } catch (err: any) {
    if (err.status === 1 && err.stdout) {
      try {
        const json = JSON.parse(err.stdout.toString());
        return Object.keys(json);
      } catch {
        console.error("Malformed JSON in npm outdated output.");
      }
    } else {
      console.error("Unexpected error running npm outdated:", err.message);
    }
    return [];
  }
}

function upgradePackage(pkg: string): boolean {
  console.log(`\n--- Trying to update ${pkg} ---`);
  run(`npm install ${pkg}@latest`);
  if (runChecks()) {
    console.log(`✅ ${pkg} updated successfully`);
    return true;
  } else {
    console.log(`❌ ${pkg} failed checks, reverting...`);
    run("git restore package.json package-lock.json");
    run("npm install");
    return false;
  }
}

function main(): void {
  const outdated = getOutdatedPackages();
  if (outdated.length === 0) {
    console.log("All dependencies are up to date.");
    return;
  }

  console.log(`Found ${outdated.length} outdated packages.`);
  const initialBranch = run("git rev-parse --abbrev-ref HEAD");
  if (!initialBranch) {
    console.error("Failed to determine the current branch.");
    return;
  }
  const workBranch = `update-deps-${Date.now()}`;

  run(`git checkout -b ${workBranch}`);

  for (const pkg of outdated) {
    upgradePackage(pkg);
  }

  console.log("\nFinished attempting updates.");
  console.log(
    `You're now on branch ${workBranch} (you were on ${initialBranch})`
  );
  console.log("Review changes and merge if satisfied.");
}

main();
