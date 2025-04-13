import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { AutoupgradeTestHelper } from "./utils/autoupgradeTestHelper";
import * as fs from "fs";
import * as path from "path";

// Increased timeout to avoid test failures
const TEST_TIMEOUT = 30000;

describe("Autoupgrade Integration Tests", () => {
  describe("NPM autoupgrade tests", () => {
    let helper: AutoupgradeTestHelper;

    beforeEach(() => {
      helper = new AutoupgradeTestHelper("npm");
      helper.setup();
      helper.createSampleApp();
    });

    test("should not upgrade when test script fails", () => {
      // Add a failing test script
      helper.addFailingTestScript();

      const packageJsonBefore = helper.getEnv().getPackageJson();
      const oldLodashVersion = packageJsonBefore.dependencies.lodash;

      const output = helper.runAutoupgrade("npm test", true);

      expect(output).toContain("Initial checks failed");

      // Verify no packages were upgraded
      const packageJsonAfter = helper.getEnv().getPackageJson();
      expect(packageJsonAfter.dependencies.lodash).toBe(oldLodashVersion);
    }, TEST_TIMEOUT);

    test("should upgrade when test script passes", () => {
      // Add a passing test script
      helper.addPassingTestScript();

      // Get versions before upgrade
      const packageJsonBefore = helper.getEnv().getPackageJson();
      const oldLodashVersion = packageJsonBefore.dependencies.lodash;

      // Create a mock npm outdated result
      helper.createMockOutdatedResult();

      // Run autoupgrade
      const output = helper.runAutoupgrade("npm test", true);

      // Verify packages were considered for upgrade
      expect(output).toContain("Initial checks passed");
      expect(output).toContain("Proceeding with updates");
      expect(output).toContain("Found");
      expect(output).toContain("outdated packages");
      expect(output).toContain("lodash");

      // Verify packages were upgraded
      const packageJsonAfter = helper.getEnv().getPackageJson();
      expect(packageJsonAfter.dependencies.lodash).not.toBe(oldLodashVersion);
    }, TEST_TIMEOUT);

    afterEach(() => {
      helper.cleanup();
    });
  });

  describe("Yarn autoupgrade tests", () => {
    let helper: AutoupgradeTestHelper;

    beforeEach(() => {
      helper = new AutoupgradeTestHelper("yarn");
      helper.setup();
      helper.createSampleApp();
    });

    test("should not upgrade when test script fails", () => {
      // Add a failing test script
      helper.addFailingTestScript();

      const packageJsonBefore = helper.getEnv().getPackageJson();
      const oldLodashVersion = packageJsonBefore.dependencies.lodash;

      const output = helper.runAutoupgrade("yarn test", true);

      expect(output).toContain("Initial checks failed");

      // Verify no packages were upgraded
      const packageJsonAfter = helper.getEnv().getPackageJson();
      expect(packageJsonAfter.dependencies.lodash).toBe(oldLodashVersion);
    }, TEST_TIMEOUT);

    test("should upgrade when test script passes", () => {
      // Add a passing test script
      helper.addPassingTestScript();

      // Get versions before upgrade
      const packageJsonBefore = helper.getEnv().getPackageJson();
      const oldLodashVersion = packageJsonBefore.dependencies.lodash;

      // Create a mock yarn outdated result
      helper.createMockOutdatedResult();

      // Run autoupgrade with passing test
      const output = helper.runAutoupgrade("yarn test", true);

      // Verify packages were considered for upgrade
      expect(output).toContain("Initial checks passed");
      expect(output).toContain("Proceeding with updates");
      expect(output).toContain("Found");
      expect(output).toContain("outdated packages");
      expect(output).toContain("lodash");

      // Verify packages were upgraded
      const packageJsonAfter = helper.getEnv().getPackageJson();
      expect(packageJsonAfter.dependencies.lodash).not.toBe(oldLodashVersion);
    }, TEST_TIMEOUT);

    afterEach(() => {
      helper.cleanup();
    });
  });

  describe("PNPM autoupgrade tests", () => {
    let helper: AutoupgradeTestHelper;

    beforeEach(() => {
      helper = new AutoupgradeTestHelper("pnpm");
      helper.setup();
      helper.createSampleApp();
    });

    test("should not upgrade when test script fails", () => {
      // Add a failing test script
      helper.addFailingTestScript();

      const packageJsonBefore = helper.getEnv().getPackageJson();
      const oldLodashVersion = packageJsonBefore.dependencies.lodash;

      const output = helper.runAutoupgrade("pnpm test", true);

      expect(output).toContain("Initial checks failed");

      // Verify no packages were upgraded
      const packageJsonAfter = helper.getEnv().getPackageJson();
      expect(packageJsonAfter.dependencies.lodash).toBe(oldLodashVersion);
    }, TEST_TIMEOUT);

    test("should upgrade when test script passes", () => {
      // Add a passing test script
      helper.addPassingTestScript();

      // Get versions before upgrade
      const packageJsonBefore = helper.getEnv().getPackageJson();
      const oldLodashVersion = packageJsonBefore.dependencies.lodash;

      // Create a mock pnpm outdated result
      helper.createMockOutdatedResult();

      // Run autoupgrade with passing test
      const output = helper.runAutoupgrade("pnpm test", true);

      // Verify packages were considered for upgrade
      expect(output).toContain("Initial checks passed");
      expect(output).toContain("Proceeding with updates");
      expect(output).toContain("Found");
      expect(output).toContain("outdated packages");
      expect(output).toContain("lodash");

      // Verify packages were upgraded
      const packageJsonAfter = helper.getEnv().getPackageJson();
      expect(packageJsonAfter.dependencies.lodash).not.toBe(oldLodashVersion);
    }, TEST_TIMEOUT);

    afterEach(() => {
      helper.cleanup();
    });
  });
});
