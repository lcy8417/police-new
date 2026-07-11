/** `usePageHeader({ title: <HeaderTitle /> })`로 `TopNav`에 게시되는 제목 + 부제. */
export function HeaderTitle() {
  return (
    <div className="flex flex-col justify-center gap-1">
      <span className="text-[28px] leading-none font-bold text-white">
        신규 사건 등록
      </span>
      <span className="text-[13px] leading-none font-normal text-[#8A93A6]">
        사건 정보를 입력하고 현장 이미지를 관리하세요.
      </span>
    </div>
  )
}
