# Testing Prisma Connection

These tests use Node.js without frameworks as requested.

## Quick Steps

1. View database in Prisma Studio:
   ```bash
   pnpm prisma studio
   ```

2. Run node test (basic):
   ```bash
   node sara_tests/prisma-connection.mjs
   ```

3. Database connection will work after migration:
   ```bash
   pnpm prisma migrate dev
   ```

## Files

- `prisma-connection.mjs` - Basic Prisma setup test
- `test-mts.mts` - Template for future TypeScript tests