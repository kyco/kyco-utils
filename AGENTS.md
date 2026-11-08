Always use pnpm.
Be extremely concise in all your responses.

## Testing

- Test names always start with "should".
- `src/index.test.ts`: logic tests against the source (edge cases, all inputs).
- `src/consumer.test.ts`: packaging smoke test, importing by package name (built `dist/`). ESM-only: assert resolution to `dist`, the exact export list, and one call per export with all params, asserting the return value (not just "does not throw"). No logic duplication.
- When adding/removing an export, update both files.
