const toCamelCase = (str: string): string =>
  str.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());

/**
 * Recursively convert snake_case object keys to camelCase.
 *
 * This is a ONE-DIRECTIONAL boundary (response → camel only). There is
 * deliberately no inverse: the backend accepts bespoke, per-endpoint mixed
 * casing on writes, so request bodies are hand-mapped per endpoint — never
 * produced by a symmetric converter. Port of utils/get-convert-camelcase.js.
 */
export function convertKeysToCamelCase<T = unknown>(input: unknown): T {
  if (Array.isArray(input)) {
    return input.map((v) => convertKeysToCamelCase(v)) as T;
  }
  if (input !== null && typeof input === "object") {
    return Object.entries(input as Record<string, unknown>).reduce(
      (acc, [key, value]) => {
        acc[toCamelCase(key)] = convertKeysToCamelCase(value);
        return acc;
      },
      {} as Record<string, unknown>
    ) as T;
  }
  return input as T;
}
