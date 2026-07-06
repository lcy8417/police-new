import { setupServer } from "msw/node";

/**
 * Shared MSW request-interception server for Node-based (Vitest) tests.
 * Individual test files register handlers with `mswServer.use(...)` and
 * should reset them in `afterEach` so handlers don't leak between tests.
 */
export const mswServer = setupServer();
