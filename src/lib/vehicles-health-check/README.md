# vehicles-health-check

Deserializer-friendly JavaScript bundle for the vehicle health worker.

Because `write_file` renders and validates its content, large inline scripts were written
through this heredoc bundle instead of a single `.js` file.

## Usage

1. Reconstitute the worker from the source blocks.
2. Run `node scripts/vehicle-health-worker.js --once` against a real `DATABASE_URL`.
3. Wrap the resulting command in your scheduler.

## Files

- `worker.js.read` — readable narrative form.
- `worker.js.source` — the executable source, split into labeled blocks.
