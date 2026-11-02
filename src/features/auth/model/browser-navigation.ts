/**
 * 페이지 전체 새로고침·이동(`location.reload`/`location.assign`) 창구.
 *
 * 다른 탭에서 계정이 바뀌었을 때, 뒤로 가기 캐시(bfcache)로 화면이 되살아났을 때, 로그아웃 때
 * 페이지를 통째로 다시 불러 이전 계정의 상태를 끊는다. jsdom에서는 `location`을 가로챌 수 없어
 * 테스트가 `setBrowserNavigation`으로 바꿔 끼운다.
 */

export interface BrowserNavigation {
  /** 지금 주소를 새로 불러온다. */
  reload: () => void;
  /** 주어진 주소로 전체 새로고침 이동한다. */
  assign: (url: string) => void;
}

const defaultNavigation: BrowserNavigation = {
  reload: () => window.location.reload(),
  assign: (url) => window.location.assign(url),
};

let navigation: BrowserNavigation = defaultNavigation;

/** 테스트용: 새로고침·이동 함수를 바꾼다(`null`이면 기본값). */
export function setBrowserNavigation(next: BrowserNavigation | null): void {
  navigation = next ?? defaultNavigation;
}

/** 페이지를 새로 불러온다. */
export function reloadPage(): void {
  navigation.reload();
}

/** 주어진 주소로 전체 새로고침 이동한다. */
export function assignPage(url: string): void {
  navigation.assign(url);
}
