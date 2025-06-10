import { getPatternsPath } from "../utils/get-patterns-path";

const filesLoad = (kind, setPatterns) => {
  const imageModules = getPatternsPath[kind];
  if (!imageModules) return;

  const imagePaths = Object.values(imageModules).map(
    (module) => module.default
  );

  setPatterns([...imagePaths]);
};

export default filesLoad;
