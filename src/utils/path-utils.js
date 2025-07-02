const patternsRoot = "/src/assets/Patterns/전체/";

export const toPatternPaths = (patterns) =>
  patterns ? patterns.map((p) => `${patternsRoot}/${p}.png`) : [];

export const pathInsert = (item) => {
  return [patternsRoot + item[0] + ".png", item[1]];
};
