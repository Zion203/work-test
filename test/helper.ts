import { vi } from "vitest";
import { type DirectusGraphqlClient } from "@icliniqSmartDoctor/shared-kernel";
import { Schema } from "@icliniqSmartDoctor/reactive-framework";

export const directusClientMock = (
  queryReturnValueFirstTime: unknown,
  queryReturnValueSecondTime?: unknown,
  error?: boolean
) => {
  if (error) {
    const directusClient: Partial<DirectusGraphqlClient<Schema>> = {
      query: vi.fn().mockImplementation(() => {
        throw new Error("error");
      }),
    };
    return directusClient as DirectusGraphqlClient<Schema>;
  }

  const directusClient: Partial<DirectusGraphqlClient<Schema>> = {
    query: queryReturnValueSecondTime
      ? vi
          .fn()
          .mockReturnValueOnce(queryReturnValueFirstTime)
          .mockReturnValueOnce(queryReturnValueSecondTime)
      : vi.fn().mockReturnValue(queryReturnValueFirstTime),
  };
  return directusClient as DirectusGraphqlClient<Schema>;
};

export const testLogger = () => ({
  info: () => {},
  error: () => {},
  critical: () => {},
  warn: () => {},
  debug: () => {},
});
