import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { PackageManagerTestEnv } from './utils/packageManagerEnv';

describe('Package Manager Environment Tests', () => {
  describe('NPM Environment', () => {
    const npmEnv = new PackageManagerTestEnv('npm');
    
    beforeAll(() => {
      npmEnv.setup();
    });

    test('should initialize npm project', () => {
      const packageJson = npmEnv.getPackageJson();
      expect(packageJson).toHaveProperty('name');
      expect(packageJson).toHaveProperty('version');
    });

    test('should install a dependency', () => {
      npmEnv.installDependency('lodash');
      const packageJson = npmEnv.getPackageJson();
      expect(packageJson.dependencies).toHaveProperty('lodash');
    });

    test('should install a dev dependency', () => {
      npmEnv.installDependency('jest', true);
      const packageJson = npmEnv.getPackageJson();
      expect(packageJson.devDependencies).toHaveProperty('jest');
    });

    afterAll(() => {
      npmEnv.cleanup();
    });
  });

  describe('Yarn Environment', () => {
    const yarnEnv = new PackageManagerTestEnv('yarn');
    
    beforeAll(() => {
      yarnEnv.setup();
    });

    test('should initialize yarn project', () => {
      const packageJson = yarnEnv.getPackageJson();
      expect(packageJson).toHaveProperty('name');
      expect(packageJson).toHaveProperty('version');
    });

    test('should install a dependency', () => {
      yarnEnv.installDependency('axios');
      const packageJson = yarnEnv.getPackageJson();
      expect(packageJson.dependencies).toHaveProperty('axios');
    });

    test('should install a dev dependency', () => {
      yarnEnv.installDependency('typescript', true);
      const packageJson = yarnEnv.getPackageJson();
      expect(packageJson.devDependencies).toHaveProperty('typescript');
    });

    afterAll(() => {
      yarnEnv.cleanup();
    });
  });

  describe('PNPM Environment', () => {
    const pnpmEnv = new PackageManagerTestEnv('pnpm');
    
    beforeAll(() => {
      pnpmEnv.setup();
    });

    test('should initialize pnpm project', () => {
      const packageJson = pnpmEnv.getPackageJson();
      expect(packageJson).toHaveProperty('name');
      expect(packageJson).toHaveProperty('version');
    });

    test('should install a dependency', () => {
      pnpmEnv.installDependency('react');
      const packageJson = pnpmEnv.getPackageJson();
      expect(packageJson.dependencies).toHaveProperty('react');
    });

    test('should install a dev dependency', () => {
      pnpmEnv.installDependency('eslint', true);
      const packageJson = pnpmEnv.getPackageJson();
      expect(packageJson.devDependencies).toHaveProperty('eslint');
    });

    afterAll(() => {
      pnpmEnv.cleanup();
    });
  });
});