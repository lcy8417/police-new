# 사용자 매뉴얼(Word) 다시 만들기

화면이 바뀌면 아래 두 줄로 최신 화면의 매뉴얼을 다시 뽑는다(저장소 루트에서).

```bash
node scripts/manual/capture.mjs          # 1) 진열 화면 캡처 → ../output/manual/captures/ (*.png + captures.json)
node scripts/manual/build-docx.mjs       # 2) 번호 표시 그림 + 원고 → ../output/manual/족적감정플랫폼_사용자매뉴얼_v0.1.docx
```

- 1)은 개발 서버(`npm run dev`, 기본 `http://localhost:5210`)가 떠 있어야 한다. 헤드리스 Chromium(`@playwright/test`)으로 찍는다.
- 결과물(캡처 · 번호 표시 그림 `annotated/` · docx)은 **저장소 밖** `../output/manual/` 에만 둔다 — 실제 현장 족적 사진(`samples/crime`)이 찍히므로 git 에 넣지 않는다.
- 일부만 다시 찍기: `node scripts/manual/capture.mjs --only 3-4` (해당 캡처만 찍고 `captures.json` 에 합침).

## 처음 한 번 — docx 모듈 설치

저장소 `package.json` 을 건드리지 않으려고 `docx`(npm)는 저장소 밖에 따로 설치한다(약 24MB).

```bash
npm install --prefix ../output/manual/_tools docx@9
```

다른 곳에 설치했다면 `node scripts/manual/build-docx.mjs --tools <그 폴더>`.

## 파일

| 파일 | 하는 일 |
|---|---|
| `capture.mjs` | 매뉴얼 목차 순서대로 진열 화면을 찍고, 번호 붙일 요소의 화면 좌표를 `captures.json` 에 남김. 장면 추가 = `CAPTURES` 배열에 한 항목(주소 · 조작 `steps` · 번호 요소 `marks`) |
| `manual.md` | **원고**(본문 텍스트). 장 · 절 · 캡처 이름 · 번호별 설명. 문법은 파일 머리 주석 |
| `build-docx.mjs` | 원고 + 캡처 → 번호(①②③) 그린 그림 → Word. 제목 1/2/3 스타일 · 자동 목차 · 그림 캡션(SEQ) · 머리글 · 쪽 번호 |

## 원고 고치는 법(manual.md)

- `(3) 설명` 의 번호는 `capture.mjs` 의 그 캡처 `marks` 순서(= `captures.json` 의 `n`)와 같다. 그림에는 원고에 설명이 있는 번호만 그린다.
- `![캡처이름 | 그림 제목 | 확대]` — `| 확대` 를 붙이면 번호 붙인 요소들 둘레만 잘라 크게 보인다(작은 단추용).
- `※ 실증 적용 예정 — …` = 지금 서버(`police-server`)에 없고 시안에만 있는 기능. 서버에 생기면 지운다.
- 빌드 끝에 「확인할 것」이 나오면(원고 번호가 캡처에 없음 · 화면에서 요소를 못 찾음) `capture.mjs` 의 `marks` 나 원고를 맞춘다.

## Word 에서 열었을 때

- 목차 쪽 번호와 「N / 전체」 쪽 수는 조립 때 **추정**해 넣은 값이다(맑은 고딕 글자 폭을 몰라 어림). Word 에서 목차를 오른쪽 클릭 → 「필드 업데이트 → 전체 목차 업데이트」 하면 정확해진다.
- 목차에는 제목 1 · 2 까지 나온다(`build-docx.mjs` 의 `headingStyleRange: "1-2"`).
