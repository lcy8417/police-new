// snake_case → camelCase 변환 함수
const toCamelCase = (str) => str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());

// 객체 내 키를 camelCase로 재귀 변환
export const convertKeysToCamelCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamelCase);
  }
  if (obj !== null && typeof obj === "object") {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      acc[toCamelCase(key)] = convertKeysToCamelCase(value);
      return acc;
    }, {});
  }
  return obj;
};