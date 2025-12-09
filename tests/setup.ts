import { setupServer } from "msw/node";
import "@testing-library/jest-dom";
import { beforeAll, afterEach, afterAll } from "vitest";

export const server = setupServer(...[]);

beforeAll(() => server.listen());

afterEach(() => server.resetHandlers());

afterAll(() => server.close());
