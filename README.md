# autoupgrade

## Usage

```
npx autoupgrade
```

## Features

- Automatically upgrades dependencies in your project if the checks pass.
- Provides a detailed report of changes.

## Options

You can pass the first argument as the command to run to validate the upgrade. For example:

```
npx autoupgrade "npm run checks"
```

If this passes, the upgrade will be performed. If it fails, the upgrade will not be performed.

## License

This project is licensed under the MIT License. See the [LICENSE.md](LICENSE.md) file for details.
