# @kyco-utils/biome-config

Shared [Biome](https://biomejs.dev) configuration for kyco-utils.

## Usage

Install the package (requires `@biomejs/biome` 2.0+):

```sh
pnpm add -D @kyco-utils/biome-config @biomejs/biome
```

Extend it from your `biome.json`:

```json
{
  "$schema": "./node_modules/@biomejs/biome/configuration_schema.json",
  "extends": ["@kyco-utils/biome-config/biome"],
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  }
}
```

Any rule can be overridden locally — `extends` merges the shared config with your own.

## License

[MIT](LICENSE)
