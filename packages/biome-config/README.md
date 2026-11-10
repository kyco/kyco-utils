# @kyco-utils/biome-config

Shared [Biome](https://biomejs.dev) configuration for kyco-utils.

## Usage

```sh
pnpm add -D @kyco-utils/biome-config @biomejs/biome
```

```json
{
  "$schema": "./node_modules/@biomejs/biome/configuration_schema.json",
  "extends": ["@kyco-utils/biome-config/biome"]
}
```

### VCS

The base config enables Git integration (`vcs.useIgnoreFile`), so files in your `.gitignore` are skipped. If your project doesn't use Git, disable it:

```json
{
  "extends": ["@kyco-utils/biome-config/biome"],
  "vcs": { "enabled": false }
}
```

## License

[MIT](https://github.com/kyco/kyco-utils/blob/main/LICENSE)
