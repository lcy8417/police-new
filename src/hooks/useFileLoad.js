import { getPatternsPath } from "../utils/get-patterns-path";

const filesLoad = (kind, setPatterns) => {
  const imageModules = getPatternsPath[kind];
  if (!imageModules) return;

  // 소스 경로(glob 키)를 쓴다 — 빌드된 값(module.default)은 해시가 붙어 문양 이름이 틀어진다
  const imagePaths = Object.keys(imageModules);

  setPatterns([...imagePaths]);
};

export default filesLoad;
