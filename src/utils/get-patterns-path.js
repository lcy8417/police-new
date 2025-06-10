export const getPatternsPath = {
  무늬: import.meta.glob("/src/assets/Patterns/무늬/*", { eager: true }),
  선: import.meta.glob("/src/assets/Patterns/선/*", { eager: true }),
  윤곽: import.meta.glob("/src/assets/Patterns/윤곽선/*", { eager: true }),
  다각: import.meta.glob("/src/assets/Patterns/다각/*", { eager: true }),
  삼각: import.meta.glob("/src/assets/Patterns/삼각/*", { eager: true }),
  사각: import.meta.glob("/src/assets/Patterns/사각/*", { eager: true }),
  원: import.meta.glob("/src/assets/Patterns/원/*", { eager: true }),
  항목: import.meta.glob("/src/assets/Patterns/항목/*", { eager: true }),
};
