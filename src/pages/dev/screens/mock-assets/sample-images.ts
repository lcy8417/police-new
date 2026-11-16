import { fakePhotoUrl, type FakePhotoProps } from "./FakePhoto"
import { fakeSoleUrl, type FakeSoleProps } from "./FakeSole"
import { SAMPLE_SHOES, type SampleShoe } from "./sample-shoes"

// 진열 화면의 표본 그림(11/17 r7) — 실제 현장 족적 사진 · 실제 신발 밑창 사진을 가짜 그림 대신 쓴다.
//
// 현장 사진: 저장소 루트 `samples/crime/<감정번호>_<n>.png`(260×480). 증거 사진이라 .gitignore 로 저장소에서 빠져 있다
//  → 이 폴더가 없는 PC(저장소만 받은 사람)에서는 glob 이 빈 목록이 되어 지금까지의 가짜 그림(FakePhoto)이 그대로 나온다.
//  개발 서버에서만 쓴다: 진열 화면은 App.jsx 가 `import.meta.env.DEV` 일 때만 불러 빌드(dist)에 들어가지 않고,
//  여기서도 DEV 가 아니면 목록을 비운다. 테스트(vitest)에서도 비운다 — 사진이 있는 PC 와 없는 PC 의 결과가 같게.
// 신발 밑창: 저장소 안 `src/assets/Shoes/B/B<번호>.png` 5,110장 중 sample-shoes.ts 의 40장만 번호 목록으로 가져온다.
//
// 같은 열쇠(감정번호_n · 신발 번호)는 언제나 같은 그림이다. 이진화 그림은 처음 불릴 때 캔버스로 한 번 만들어 둔다
// (모듈 맨 위 await — 진열 화면이 열릴 때 100장 정도를 미리 만든다. 실패한 장은 원본 사진을 그대로 쓴다).

type PhotoOpts = Omit<FakePhotoProps, "palette" | "className" | "style">
type SoleOpts = Omit<FakeSoleProps, "palette" | "className">

/** 실제 사진을 쓰는가(개발 서버 · 테스트 아님) */
const LIVE = import.meta.env.DEV && import.meta.env.MODE !== "test"

const CRIME_GLOB = import.meta.glob<string>("/samples/crime/*.png", { eager: true, query: "?url", import: "default" })
// 진열에 쓰는 40켤레만(5,110장 전부를 묶지 않는다) — sample-shoes.ts 와 같은 번호
const SHOE_GLOB = import.meta.glob<string>(
  "/src/assets/Shoes/B/B{205423,205008,205007,206815,205391,208696,205292,205189,209608,206470,211189,205097,205078,206313,205218,206620,209819,210364,205151,206532,205068,205010,205002,206817,207905,208719,205293,205220,208969,206438,211190,205099,208220,206044,205252,206046,207479,210383,205147,206202}.png",
  { eager: true, query: "?url", import: "default" },
)

const fileName = (path: string) => (path.split("/").at(-1) ?? path).replace(/\.png$/, "")

export interface SamplePhoto {
  /** 파일 이름(감정번호_이미지번호) */
  name: string
  url: string
}

/** 현장 사진 목록(파일 이름순). 사진 폴더가 없거나 개발 서버가 아니면 빈 목록 */
export const SAMPLE_PHOTOS: readonly SamplePhoto[] = LIVE
  ? Object.entries(CRIME_GLOB)
      .map(([path, url]) => ({ name: fileName(path), url }))
      .sort((a, b) => a.name.localeCompare(b.name))
  : []

/** 실제 현장 사진이 있는가(없으면 화면은 가짜 그림) */
export const hasSamplePhotos = SAMPLE_PHOTOS.length > 0

/** 신발 번호 → 밑창 그림 주소 */
const SHOE_URL: ReadonlyMap<string, string> = new Map(Object.entries(SHOE_GLOB).map(([path, url]) => [fileName(path).replace(/^B/, ""), url]))

/** 그림이 있는 표본 신발만(목록 순서 그대로) */
export const SAMPLE_SHOES_WITH_IMAGE: readonly SampleShoe[] = SAMPLE_SHOES.filter((s) => SHOE_URL.has(s.ftwrId))

// ── 열쇠 → 몇 번째 그림 ──

/** 글자 열쇠를 0 이상 정수로(FNV-1a) */
export function hashKey(key: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * 열쇠 → 목록 자리. `감정번호_n` 이면 같은 사건의 1 · 2 · 3 … 장이 서로 다른 이웃 사진이 되게(사건 자리 + n - 1),
 * 숫자면 그 번호 자리, 그 밖의 글자는 해시 자리.
 */
export function sampleIndex(key: string | number, length: number): number {
  if (length <= 0) return -1
  if (typeof key === "number") return ((Math.trunc(key) % length) + length) % length
  const m = /^(.+)_(\d+)$/.exec(key)
  if (m) return (hashKey(m[1]) + Number(m[2]) - 1) % length
  return hashKey(key) % length
}

// ── 이진화(캔버스) ──

const BINARY = new Map<string, string>()

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`그림을 못 읽음: ${url}`))
    img.src = url
  })
}

/**
 * 둘레 평균과 차이가 큰 점만 먹색, 나머지는 흰색 — 밝은 먼지 족적 · 어두운 고무 무늬 둘 다 윤곽이 남는다.
 * 진열용 근사(실제 앱의 이진화는 백엔드가 한다). 현장 사진은 바닥 결이 거칠어 더 크게 다를 때만 먹색(tune).
 */
const TUNE = { photo: { inner: 2, diff: 20 }, shoe: { inner: 1, diff: 16 } } as const

async function binarize(url: string, tune: { inner: number; diff: number }): Promise<string> {
  const img = await loadImage(url)
  const w = img.naturalWidth
  const h = img.naturalHeight
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("캔버스 없음")
  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, w, h)
  const px = data.data
  const gray = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) gray[i] = px[i * 4] * 0.299 + px[i * 4 + 1] * 0.587 + px[i * 4 + 2] * 0.114
  // 적분 영상으로 둘레 평균
  const sum = new Float64Array((w + 1) * (h + 1))
  for (let y = 0; y < h; y++) {
    let row = 0
    for (let x = 0; x < w; x++) {
      row += gray[y * w + x]
      sum[(y + 1) * (w + 1) + x + 1] = sum[y * (w + 1) + x + 1] + row
    }
  }
  /** (x, y) 둘레 반지름 r 네모의 평균 */
  const meanAt = (x: number, y: number, r: number) => {
    const y0 = Math.max(0, y - r)
    const y1 = Math.min(h, y + r + 1)
    const x0 = Math.max(0, x - r)
    const x1 = Math.min(w, x + r + 1)
    return (sum[y1 * (w + 1) + x1] - sum[y0 * (w + 1) + x1] - sum[y1 * (w + 1) + x0] + sum[y0 * (w + 1) + x0]) / ((y1 - y0) * (x1 - x0))
  }
  const r = Math.max(4, Math.round(Math.min(w, h) / 18))
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // 잡음을 줄이려고 점 하나 대신 작은 네모 평균을 둘레 평균과 견준다
      const ink = Math.abs(meanAt(x, y, tune.inner) - meanAt(x, y, r)) > tune.diff ? 0 : 255
      const i = (y * w + x) * 4
      px[i] = ink
      px[i + 1] = ink
      px[i + 2] = ink
      px[i + 3] = 255
    }
  }
  ctx.putImageData(data, 0, 0)
  return canvas.toDataURL("image/png")
}

if (LIVE && typeof document !== "undefined") {
  const jobs = [
    ...SAMPLE_PHOTOS.map((p) => ({ url: p.url, tune: TUNE.photo })),
    ...[...SHOE_URL.values()].map((url) => ({ url, tune: TUNE.shoe })),
  ]
  await Promise.all(
    jobs.map(async ({ url, tune }) => {
      try {
        BINARY.set(url, await binarize(url, tune))
      } catch {
        // 못 만든 장은 원본 사진을 그대로 쓴다
      }
    }),
  )
}

// ── 공개 함수 ──

/** 열쇠에 맞는 실제 현장 사진(없으면 null) */
export function samplePhoto(key: string | number): SamplePhoto | null {
  const i = sampleIndex(key, SAMPLE_PHOTOS.length)
  return i < 0 ? null : SAMPLE_PHOTOS[i]
}

/**
 * 현장 족적 사진 주소. 실제 사진이 있으면 그 사진(`look: "binary"` 면 이진화본), 없으면 가짜 그림(`fakePhotoUrl(fake)`).
 * 열쇠는 `감정번호_n`(같은 사건 · 같은 장 = 같은 사진) 또는 숫자.
 * `fallback` 을 주면 가짜 그림 대신 그 값을 쓴다(이미 만들어 둔 가짜 그림을 다시 쓸 때 — 가짜 그림은 만들기가 무겁다).
 */
export function samplePhotoUrl(key: string | number, fake: PhotoOpts = {}, fallback?: () => string): string {
  const photo = samplePhoto(key)
  if (!photo) return fallback ? fallback() : fakePhotoUrl(fake)
  return fake.look === "binary" ? (BINARY.get(photo.url) ?? photo.url) : photo.url
}

/** 열쇠에 맞는 표본 신발. 표본 번호면 그 신발, 아니면 번호를 해시해 40켤레 중 하나(그림이 하나도 없으면 null) */
export function sampleShoe(key: string | number): SampleShoe | null {
  const list = SAMPLE_SHOES_WITH_IMAGE
  const exact = list.find((s) => s.ftwrId === String(key))
  if (exact) return exact
  const i = sampleIndex(typeof key === "number" ? key : `shoe:${key}`, list.length)
  return i < 0 ? null : list[i]
}

/**
 * 밑창 그림 주소. kind `shoe` = 실제 밑창 사진, `bin` = 그 이진화본, `scene` = 현장 족적(samplePhotoUrl 과 같음).
 * 실제 그림이 없으면 가짜 그림(`fakeSoleUrl(fake)` — `fallback` 을 주면 그 값).
 */
export function sampleSoleUrl(key: string | number, fake: SoleOpts = {}, fallback?: () => string): string {
  const kind = fake.kind ?? "shoe"
  const fakeUrl = () => (fallback ? fallback() : fakeSoleUrl(fake))
  if (kind === "scene") return hasSamplePhotos ? samplePhotoUrl(key) : fakeUrl()
  const shoe = sampleShoe(key)
  const url = shoe ? SHOE_URL.get(shoe.ftwrId) : undefined
  if (!url) return fakeUrl()
  if (kind === "bin") return BINARY.get(url) ?? (LIVE ? url : fakeUrl())
  return url
}
