import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// @MX:ANCHOR: [AUTO] cn() - clsx+twMerge 병합 유틸, 37개 파일에서 임포트되는 프로젝트 전역 단일 클래스명 병합 지점
// @MX:REASON: fan_in 37(전체 shared/ui 컴포넌트 및 feature UI 대부분) — 변경 시 전체 스타일링 레이어에 영향
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
