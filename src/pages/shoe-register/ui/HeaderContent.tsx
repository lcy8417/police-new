/** `usePageHeader({ title: <HeaderTitle /> })`로 `TopNav`에 게시되는 제목 + 부제. */
export function HeaderTitle() {
  return (
    <div className="flex flex-col justify-center gap-1">
      <span className="text-[28px] leading-none font-bold text-white">
        신규 신발 등록
      </span>
      <span className="text-[13px] leading-none font-normal text-[#8A93A6]">
        신발 이미지를 등록하고 밑창 문양을 추출·입력하세요.
      </span>
    </div>
  )
}
