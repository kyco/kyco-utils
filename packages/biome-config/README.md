# @kyco-utils/biome-config

Shared [Biome](https://biomejs.dev) configuration for kyco-utils.

## Usage

```sh
pnpm add -D @kyco-utils/biome-config @biomejs/biome
```

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

## License

[MIT](https://github.com/kyco/kyco-utils/blob/main/LICENSE)
