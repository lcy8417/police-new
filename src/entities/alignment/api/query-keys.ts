/** TanStack Query key factory for the alignment entity. */
export const alignmentKeys = {
  detail: (crimeNumber: string, modelNumber: string) =>
    ["alignment", crimeNumber, modelNumber] as const,
};
