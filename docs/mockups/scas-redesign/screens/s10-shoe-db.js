/* S10 신발문양 관리 — SCAS 「족윤적 > 문양관리 > 신발문양 관리」 목록 + 신발정보관리 모달(기본정보/문양정보)
   근거: inventory_5614_5616 S5·S1·S3·P1·P2·P3 (IMG_5614 0:00–2:30, IMG_5616 0:00–6:00) */
(function () {
  const { pin, apin, sole, picon } = M;

  /* 옆모습 신발 실루엣(가짜, 장식용) */
  const SIDE = `<svg viewBox="0 0 60 30" width="100%" height="100%" aria-label="측면(가짜 예시)"><path d="M4 22C4 15 9 13 17 12L27 6C33 4 39 7 43 11C49 13 56 15 56 21V25H4Z" style="fill:var(--mute)"/><path d="M4 25H56" style="stroke:var(--fg2);stroke-width:2"/></svg>`;

  const Z = [
    ["herring", "herring", "herring"], ["grid", "dots", "grid"], ["wave", "blocks", "lines"], ["tri", "grid", "dots"],
    ["dots", "dots", "blocks"], ["lines", "herring", "wave"], ["blocks", "grid", "blocks"], ["herring", "wave", "herring"],
  ];
  /* 미코딩 필터 적용 결과(가짜) — ai: AI 추천 준비됨 / run: 분석 중 */
  const CARDS = [
    { no: "305661", br: "나이키", d: "07-10", st: "ai" }, { no: "305660", br: "나이키", d: "07-10", st: "ai" },
    { no: "305659", br: "아디다스", d: "07-10", st: "ai" }, { no: "305658", br: "휠라", d: "07-10", st: "run" },
    { no: "305657", br: "나이키", d: "07-10", st: "ai", sel: true }, { no: "305656", br: "나이키", d: "07-10", st: "ai" },
    { no: "305655", br: "나이키", d: "07-10", st: "ai" }, { no: "305640", br: "프로스펙스", d: "07-08", st: "ai" },
    { no: "305633", br: "트렉스타", d: "07-08", st: "run" }, { no: "305612", br: "크록스", d: "07-03", st: "ai" },
    { no: "305601", br: "휠라", d: "07-02", st: "ai" }, { no: "305588", br: "코오롱", d: "06-30", st: "ai" },
    { no: "305570", br: "나이키", d: "06-27", st: "ai" }, { no: "305544", br: "케이투", d: "06-25", st: "run" },
    { no: "303337", br: "아디다스", d: "03-14", st: "ai" }, { no: "303301", br: "나이키", d: "03-11", st: "ai" },
  ];

  const lab = (t) => `<div class="crumb" style="margin-bottom:4px">${t}</div>`;

  function ours() {
    const cards = CARDS.map(
      (c, i) => `<div style="display:grid;gap:5px;padding:6px;border:1px solid ${c.sel ? "var(--blue)" : "var(--line)"};border-radius:10px;background:${c.sel ? "var(--blue-bg)" : "var(--panel2)"};${c.sel ? "box-shadow:0 0 0 1px var(--blue),0 0 16px rgba(74,158,255,.25)" : ""}">
        <span class="imgbox" style="height:92px">${sole({ kind: "shoe", zones: Z[i % Z.length] })}</span>
        <div style="display:flex;align-items:center;gap:5px">
          <span style="width:12px;height:12px;border-radius:3px;border:1px solid var(--line3);${i < 3 ? "background:var(--blue2);border-color:var(--blue2)" : ""}"></span>
          <span class="mono" style="color:var(--fg);font-size:12px">${c.no}</span>
          ${c.st === "ai" ? `<span class="chip teal" style="margin-left:auto;height:18px;padding:0 6px;font-size:10.5px">AI 추천</span>` : `<span class="chip" style="margin-left:auto;height:18px;padding:0 6px;font-size:10.5px">분석 중</span>`}
        </div>
        <div style="color:var(--dim);font-size:11px;line-height:1.2">${c.br} · <span class="num">${c.d}</span></div>
      </div>`
    ).join("");

    /* 문양정보: AI가 미리 채운 상·중·하·윤곽·문자열 */
    const zone = (lbl, icons, conf, on) => `<div style="display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:8px;align-items:center;min-height:44px;padding:5px 8px;border:1px solid ${on ? "var(--blue)" : "var(--line2)"};border-radius:8px;background:${on ? "var(--blue-bg)" : "var(--bg2)"}">
        <span style="color:${on ? "var(--fg)" : "var(--mute)"};font-size:12.5px;font-weight:600">${lbl}</span>
        <span style="display:flex;flex-wrap:wrap;gap:5px;align-items:center">${icons || `<span style="color:var(--faint);font-size:11.5px">비어 있음 — 아래에서 고르세요</span>`}</span>
        <span style="display:flex;gap:6px;align-items:center">${conf ? `<span class="ai-mark">AI ${conf}%</span>` : ""}<span style="color:var(--faint);font-size:11px">✕</span></span>
      </div>`;

    const palette = M.P["내부선"].map((n, i) => picon(n, "sm" + (n === "n32_04" ? " sel" : ""), n)).join("");

    const form = `<div class="form">
        <div class="l">화류번호</div><div class="v mono">305657</div><div class="l">등록관서</div><div class="v">경찰청</div>
        <div class="l">제조사</div><div class="v">(유)나이키코리아 <span style="color:var(--dim)">⌕</span></div><div class="l req">상표명</div><div class="v"><span title="SCAS와 같은 체크칸(용도 확인 필요)" style="color:var(--dim)">☐</span> 나이키 <span style="color:var(--dim)">⌕</span></div>
        <div class="l">모델번호</div><div class="v">S.T 플레어 EP</div><div class="l req">신발종류</div><div class="v">운동화 / 운동화</div>
        <div class="l">크기</div><div class="v" style="color:var(--faint)">—</div><div class="l">몰드번호</div><div class="v" style="color:var(--faint)">—</div>
        <div class="l">제조지역</div><div class="v span3"><span class="radio"><span>해당없음</span><span>국내산</span><span class="on">수입산</span></span></div>
        <div class="l">성별</div><div class="v span3"><span class="radio"><span>해당없음</span><span>남</span><span>여</span><span class="on">혼용</span></span></div>
        <div class="l">좌우구분</div><div class="v span3"><span class="radio"><span>해당없음</span><span class="on">좌</span><span>우</span></span></div>
        <div class="l">굽유무</div><div class="v span3"><span class="radio"><span>해당없음</span><span>유</span><span class="on">무</span><span>불상</span></span></div>
        <div class="l">수집년도</div><div class="v num">2025년 7월</div><div class="l">전화번호</div><div class="v"><span style="color:var(--dim)">☐</span></div>
        <div class="l">수집장소(주소)</div><div class="v span3" style="color:var(--mute)"><span style="color:var(--dim)">☐</span> 우편번호 · 주소 <span class="btn sm ghost">찾기</span></div>
        <div class="l req">수집장소(상호)</div><div class="v"><span style="color:var(--dim)">☐</span> <span class="chip">인터넷수집</span></div><div class="l">비고</div><div class="v" style="color:var(--faint)">—</div>
        <div class="l">신발그룹명</div><div class="v">나이키(NIKE)-112</div><div class="l">등록일자</div><div class="v num">2025-07-10</div>
      </div>`;

    return M.shell(
      { active: "신발문양 관리", tabs: ["사건관리", "신발문양 관리", "수집 검수"], title: "신발문양 관리", h: 1240 },
      `<div class="page-head">
        <div><div class="crumb">족윤적 · 문양관리 · 신발문양 관리</div><h3>신발문양 관리</h3><p>등록 신발의 밑창과 문양 코드를 관리합니다. 카드를 고르면 오른쪽 칸에서 기본정보·문양정보를 바로 고칩니다.</p></div>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="chip" data-role="investigator verifier">수사관·검증자: 보기 전용</span>
          <button class="btn">엑셀</button>
          <button class="btn pri" data-role="analyst admin">＋ 등록</button>
        </div>
      </div>

      <div class="panel" style="margin-bottom:12px">
        <div class="panel-b pinbox" style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr)) auto;gap:10px 14px;align-items:end">
          ${apin(1, "keep", true)}
          <div>${lab("화류번호 (신발 번호)")}<span class="inp w100 mono" style="color:var(--dim)">305…</span></div>
          <div>${lab("제조사")}<span class="inp w100">전체<span class="caret">⌕</span></span></div>
          <div>${lab("상표")}<span class="inp w100">전체<span class="caret">⌕</span></span></div>
          <div>${lab("그룹명")}<span class="inp w100">전체<span class="caret">⌕</span></span></div>
          <div>${lab("등록일자")}<span class="inp w100 mono" style="font-size:12px">전체 기간<span class="caret">▾</span></span></div>
          <div style="display:flex;gap:6px"><button class="btn">초기화</button><button class="btn pri">조회</button></div>
          <div>${lab("성별")}<span class="radio" style="font-size:12.5px"><span class="on">전체</span><span>남</span><span>여</span><span>혼용</span></span></div>
          <div>${lab("승인")}<span class="radio" style="font-size:12.5px"><span class="on">전체</span><span>승인</span><span>미승인</span></span></div>
          <div>${lab("등록관서")}<span class="inp w100">전체<span class="caret">▾</span></span></div>
          <div>${lab("화종")}<span class="inp w100" style="color:var(--dim)">—</span></div>
          <div>${lab("비고")}<span class="inp w100" style="color:var(--dim)">—</span></div>
          <div></div>
          <div style="grid-column:1/-1;display:flex;flex-wrap:wrap;gap:6px;align-items:center">
            <span style="color:var(--dim);font-size:12px;margin-right:4px">빠른 필터 ${pin(2, "better")}</span>
            <span class="chip amber" style="box-shadow:0 0 0 1px var(--amber)"><span class="dot"></span>미코딩 1,284</span>
            <span class="chip">미승인 312</span>
            <span class="chip teal">AI 추천 대기 96</span>
            <span class="chip">이번 달 등록 536</span>
            <span class="chip">인터넷수집</span>
            <span style="margin-left:auto;color:var(--dim);font-size:12px">등록일자: 이번 달 · 지난달 · 올해 · 직접 입력(1983-01-01부터 다시 고를 필요 없음)</span>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:560px minmax(0,1fr);gap:12px;align-items:start">
        <div class="panel tc">
          <div class="panel-h"><span class="lbl">SHOE LIST</span><span class="t">미코딩 <span class="num">1,284</span>건 <span style="color:var(--dim);font-weight:400">/ 전체 104,933</span></span>
            <span class="r pinbox">${apin(3, "keep")}<span class="seg"><button aria-pressed="false">목록보기</button><button aria-pressed="true">문양보기</button></span></span></div>
          <div style="display:flex;align-items:center;gap:6px;padding:8px 14px;border-bottom:1px solid var(--line2)">
            <span style="color:var(--fg2);font-size:12px"><b class="num">3</b>건 선택</span>
            <span style="margin-left:auto;display:flex;gap:6px">
              <button class="btn sm ok" data-role="analyst admin">승인</button>
              <button class="btn sm" data-role="analyst admin">그룹등록</button>
              <button class="btn sm danger" data-role="analyst admin" data-lock="admin" title="삭제는 관리자만">삭제</button>
            </span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:12px 14px">${cards}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 14px 12px;color:var(--mute);font-size:12px">
            <span class="num">1,284 중 1 – 16 · 16개씩 ▾</span><span class="num">« ‹ 1 / 81 › »</span>
          </div>
        </div>

        <div class="panel pinbox">
          ${apin(4, "better")}
          <div class="panel-h"><span class="lbl">SHOE</span><span class="t mono">305657</span>
            <span class="chip amber">미코딩</span><span class="chip teal">AI 추천 있음</span>
            <span class="r"><button class="btn sm">‹ 이전</button><button class="btn sm">다음 ›</button><span style="color:var(--faint);font:600 10.5px var(--font-mono)">← →</span><button class="btn sm ghost" title="닫기">✕</button></span></div>
          <div style="display:flex;align-items:center;gap:6px;padding:8px 14px;border-bottom:1px solid var(--line2)">
            <span class="seg"><button aria-pressed="false">기본정보</button><button aria-pressed="true">문양정보</button></span>
            <span style="margin-left:auto;display:flex;gap:6px">
              <button class="btn sm">프린트</button>
              <button class="btn sm" data-role="analyst admin">그룹등록</button>
              <button class="btn sm ai" data-role="analyst admin">AI 그룹 추천</button>
              <button class="btn sm danger" data-role="analyst admin" data-lock="admin">삭제</button>
            </span>
          </div>

          <div class="panel-b" style="display:grid;grid-template-columns:150px minmax(0,1fr);gap:14px">
            <div style="display:grid;gap:8px;align-content:start">
              <span class="imgbox" style="height:280px">${sole({ kind: "shoe", zones: ["herring", "herring", "herring"] })}<span class="cap">바닥 이미지</span></span>
              <button class="btn sm" style="justify-content:center" data-role="analyst admin">이미지 편집</button>
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">
                <span style="display:grid;gap:2px;text-align:center"><span class="imgbox" style="height:40px;padding:4px;background:var(--panel2)">${SIDE}</span><span style="color:var(--dim);font-size:10px">측면</span></span>
                <span style="display:grid;gap:2px;text-align:center"><span class="imgbox" style="height:40px;display:grid;place-items:center;color:var(--faint);font-size:16px;background:var(--panel2)">＋</span><span style="color:var(--dim);font-size:10px">전/후면</span></span>
                <span style="display:grid;gap:2px;text-align:center"><span class="imgbox" style="height:40px;display:grid;place-items:center;color:var(--faint);font-size:16px;background:var(--panel2)">＋</span><span style="color:var(--dim);font-size:10px">로고</span></span>
              </div>
            </div>

            <div style="display:grid;gap:8px;align-content:start">
              <div class="pinbox" style="display:flex;align-items:center;gap:8px">
                ${apin(5, "plus")}
                <b style="font-size:13px">신발 문양</b><span class="ai-mark">● AI 추천 · 승인 전</span>
                <span style="margin-left:auto;display:flex;gap:6px"><button class="btn sm ai" data-role="analyst admin">AI 다시 추천</button><button class="btn sm ai" data-role="analyst admin">추천 모두 받기</button></span>
              </div>
              ${zone("상", picon("n32_04", "sm ai"), 94)}
              ${zone("중", picon("n32_04", "sm ai") + picon("s81b", "sm ai", "마크"), 88)}
              ${zone("하", picon("n32_04", "sm ai"), 91, true)}
              ${zone("윤곽", picon("s10c", "sm ai"), 76)}
              ${zone("문자열", "", 0)}
              <div class="pinbox" style="display:flex;align-items:center;gap:8px;padding:6px 8px;border:1px dashed var(--line3);border-radius:8px">
                ${apin(6, "better")}
                ${picon("n32_04", "sm sel")}
                <span style="color:var(--fg2);font-size:12px">고른 문양을</span>
                <button class="btn sm" data-role="analyst admin">상·중·하 모두에 넣기</button>
                <span style="color:var(--dim);font-size:11px">같은 문양 3번 찍지 않기</span>
              </div>
              <div class="pinbox" style="padding:8px 10px;border-radius:8px;background:var(--strip);border:1px solid var(--line2)">
                ${apin(7, "better")}
                <div style="display:flex;gap:8px;align-items:flex-start">${picon("n32_04", "sm")}<span style="font-size:12px;color:var(--fg2);line-height:1.45"><b class="mono" style="color:var(--blue)">n32_04</b> 코드 설명 — ${M.PDESC.n32_04}</span></div>
              </div>
              <div style="display:grid;gap:6px">
                <div style="display:flex;gap:4px;flex-wrap:wrap">${M.PCATS.map((c) => `<span class="chip ${c === "내부선" ? "blue" : ""}" style="height:20px;font-size:11px">${c}</span>`).join("")}</div>
                <div style="display:flex;gap:6px;align-items:center"><span class="seg" style="padding:2px"><button aria-pressed="true" style="padding:2px 8px">단선</button><button aria-pressed="false" style="padding:2px 8px">다선1</button><button aria-pressed="false" style="padding:2px 8px">다선2</button></span>
                  <span class="inp" style="flex:1;color:var(--dim)">⌕ 문양 이름·설명 검색 (예: 산 모양)</span></div>
                <div style="display:flex;flex-wrap:wrap;gap:4px">${palette}</div>
              </div>
              <div style="display:flex;gap:6px;align-items:center;padding-top:4px" data-role="analyst admin">
                <span style="color:var(--dim);font-size:11px">Enter 승인 · ← → 다음 신발</span>
                <button class="btn" style="margin-left:auto">저장</button>
                <button class="btn ok">✓ 승인</button>
              </div>
            </div>
          </div>

          <div class="pinbox" style="border-top:1px solid var(--line2)">
            ${apin(8, "keep", true)}
            <div style="display:flex;align-items:center;gap:8px;padding:10px 14px"><b style="font-size:13px;white-space:nowrap">기본정보</b><span style="color:var(--dim);font-size:11.5px">SCAS 기본정보 칸 그대로 · 탭을 누르면 이 칸으로 이동(새 창 없음)</span>
              <button class="btn sm" style="margin-left:auto" data-role="analyst admin">수정</button></div>
            <div style="padding:0 14px 14px">${form}</div>
          </div>
        </div>
      </div>
      <div class="pinbox" style="display:inline-flex;gap:8px;align-items:center;margin-top:12px;padding:8px 12px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--mute);font-size:12px">
        ${apin(9, "better")}
        <span class="chip blue">감정관·관리자</span> 승인·저장·등록 &nbsp;|&nbsp; <span class="chip">수사관·검증자</span> 보기 전용 &nbsp;|&nbsp; <span class="chip red">삭제</span> 관리자만
      </div>`
    );
  }

  function scas() {
    const tree = [
      ["사건관리 ▸", 0], ["문양관리 ▾", 0], ["신발문양 관리", 1], ["신발문양 조회", 1], ["타이어문양 관리", 1], ["타이어문양 조회", 1], ["신발그룹 관리", 1],
      ["문양검색 ▸", 0], ["문양대조 ▸", 0], ["감정서관리 ▸", 0], ["족윤적관리 ▸", 0], ["족윤적감정 역량평가", 0],
    ];
    const tabs = ["사건관리", "시험품질경영절차서", "시험품질경영지침서", "감정서작성", "족윤적 검증", "결재 대기함", "수신 문서함", "문서접수대장", "신발문양 관리"];
    const nums = ["305661", "305660", "305659", "305658", "305657", "305656", "305655", "305654", "305653", "305652", "305651", "305650", "305649", "305648", "305647", "305646"];
    const card = (n, i) => `<div style="${n === "305657" ? "outline:2px solid var(--green);" : ""}background:var(--s-white);border:1px solid var(--s-line);padding:3px">
        <div style="height:86px">${sole({ kind: "shoe", zones: Z[i % Z.length], bg: "#ffffff" })}</div>
        <div style="font-size:9.5px;color:var(--s-mute)">☐ ${n}</div></div>`;
    const sb = (t, c = "") => `<span class="sbtn ${c}">${t}</span>`;
    const row = (l, v, req) => `<tr><td class="lbl" style="width:92px;${req ? "background:var(--s-pink)" : ""}">${l}${req ? "*" : ""}</td><td style="${req ? "background:var(--s-pink)" : ""}">${v}</td></tr>`;
    return M.scasShell(
      { treeOn: "신발문양 관리", tree, tabOn: "신발문양 관리", tabs, h: 960 },
      `<div class="box" style="padding:8px;margin-bottom:8px">
        <table style="color:var(--s-text)"><tbody>
          <tr><td class="lbl">화류번호</td><td style="width:220px"></td><td class="lbl">제조사</td><td style="width:220px">${sb("조회", "b")}</td><td class="lbl">성별</td><td>◉전체 ○남 ○여 ○혼용</td></tr>
          <tr><td class="lbl">등록일자</td><td>1983-01-01 📅 ~ 2025-07-24 📅</td><td class="lbl">상표</td><td>${sb("조회", "b")}</td><td class="lbl">승인</td><td>◉전체 ○승인 ○미승인</td></tr>
          <tr><td class="lbl">등록관서</td><td></td><td class="lbl">그룹명</td><td>${sb("조회", "b")}</td><td></td><td></td></tr>
          <tr><td class="lbl">화종</td><td></td><td class="lbl">비고</td><td></td><td></td><td></td></tr>
        </tbody></table>
      </div>
      <div class="bar">신발문양 관리 목록 <span style="font-weight:400">○목록보기 ◉문양보기 ${["조회", "엑셀", "삭제", "승인", "등록", "초기화"].map((t) => sb(t)).join(" ")}</span></div>
      <div class="box" style="padding:6px;display:grid;grid-template-columns:repeat(9,1fr);gap:5px">${nums.map(card).join("")}</div>
      <div style="padding:6px;color:var(--s-mute);font-size:11px">« ‹ 페이지 [1] / 6559 › » ⟳ <span style="float:right">전체 104933 중 1 - 16</span></div>

      <div class="dim"></div>
      <div class="modal" style="left:20px;top:300px;width:890px">
        <div class="bar">신발정보관리 <span>×</span></div>
        <div style="padding:8px">
          <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:6px;border-bottom:1px solid var(--s-line)">
            <span>${sb("기본정보", "b")} ${sb("문양정보")} <span style="margin-left:8px;color:var(--s-mute);text-decoration:underline">NEW등록</span></span>
            <span>${["이전", "다음", "그룹등록", "인공지능그룹등록", "프린트", "수정", "삭제", "닫기"].map((t) => sb(t)).join(" ")}</span>
          </div>
          <div style="padding:3px 0;text-align:right;color:var(--s-mute);font-size:10.5px">(문양정보 탭 버튼줄) [인공지능문양관리] 이전 다음 승인 그룹등록 닫기 · 행: 상 중 하 윤곽 문자열 · 팔레트: 윤곽 면 내부선 삼각 사각 다각 원 항목</div>
          <div style="display:grid;grid-template-columns:200px 150px minmax(0,1fr);gap:8px">
            <div><div class="bar" style="height:22px">바닥 이미지 ${sb("삭제")}</div><div style="height:390px;border:1px solid var(--s-line)">${sole({ kind: "shoe", zones: ["herring", "herring", "herring"], bg: "#ffffff" })}</div></div>
            <div style="display:grid;gap:6px;align-content:start">
              <div class="bar" style="height:22px">측면 이미지 ${sb("삭제")}</div><div class="ph" style="height:80px">측면 사진</div>
              <div class="bar" style="height:22px">전/후면 이미지 ${sb("추가")}</div><div class="ph" style="height:70px">NO IMAGE</div>
              <div class="bar" style="height:22px">로고 이미지 ${sb("추가")}</div><div class="ph" style="height:70px">NO IMAGE</div>
            </div>
            <div><div class="bar" style="height:22px">신발 정보</div>
              <table style="color:var(--s-text)"><tbody>
                ${row("화류번호", "305655")}${row("등록관서", "경찰청")}${row("제조사", `(유)나이키코리아 ${sb("조회")}`)}${row("상표명", `☐ 나이키 ${sb("조회")}`, 1)}
                ${row("모델번호", "LD-1000 IH7330-020")}${row("신발종류", "운동화 ▾ 운동화 ▾", 1)}${row("크기", "[ &nbsp; ▴▾]")}
                ${row("제조지역", "○해당없음 ○국내산 ◉수입산")}${row("성별", "○해당없음 ○남 ○여 ◉혼용")}${row("좌우구분", "○해당없음 ◉좌 ○우")}${row("굽유무", "○해당없음 ○유 ◉무 ○불상")}
                ${row("수집년도", "2025 ▾ 년 7 ▾ 월")}${row("몰드번호", "")}${row("전화번호", "☐")}${row("수집장소(주소)", `☐ [&nbsp;&nbsp;&nbsp;&nbsp;] [&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;] ${sb("찾기")}`)}
                ${row("수집장소(상호)", "☐ 인터넷수집", 1)}${row("비고", "")}${row("신발그룹명", "")}${row("등록일자", "2025-07-10")}
              </tbody></table></div>
          </div>
        </div>
      </div>

      <div class="oswin" style="left:230px;top:430px;width:340px">
        <div class="tt">👤 이미지 커팅</div>
        <div style="padding:5px 6px;display:flex;flex-wrap:wrap;gap:3px">${["-", "170", "+", "좌", "0", "우", "잘라내기", "확인", "저장"].map((t) => sb(t)).join("")}</div>
        <div class="ph" style="height:110px;margin:0 6px">밑창 이미지 (확대·회전)</div>
        <div style="padding:5px 6px;display:flex;flex-wrap:wrap;gap:3px">${["처음상태", "평준화(?)", "색상반전", "좌우반전", "밝게", "어둡게", "상하반전"].map((t) => sb(t)).join("")}</div>
      </div>

      <div class="darkwin" style="left:925px;top:300px;width:290px">
        <div class="tt">인공지능 문양 상세 보기 - Chrome</div>
        <div style="padding:8px;display:grid;grid-template-columns:92px minmax(0,1fr);gap:8px;font-size:11px">
          <div>바닥 이미지
            <div style="position:relative;height:130px;margin-top:3px;background:var(--s-side)">
              <span style="position:absolute;left:8px;top:10px;width:40px;height:26px;border:2px solid var(--amber)"></span>
              <span style="position:absolute;left:30px;top:48px;width:44px;height:22px;border:2px solid var(--violet)"></span>
              <span style="position:absolute;left:12px;top:78px;width:36px;height:24px;border:2px solid var(--green)"></span>
              <span style="position:absolute;left:46px;top:96px;width:30px;height:24px;border:2px solid var(--red)"></span>
            </div>
            <div style="font-size:18px;font-weight:700">75%</div><div style="height:4px;background:var(--amber);width:75%"></div>
          </div>
          <div>신발 문양
            ${["상", "중", "하"].map((r, i) => `<div style="display:flex;gap:3px;align-items:center;margin-top:5px">${r} ${'<span style="width:20px;height:20px;background:var(--s-line);display:inline-block"></span>'.repeat(i === 1 ? 3 : 2)}${i === 1 ? " 마크 브랜드" : ""}</div>`).join("")}
          </div>
        </div>
        <div style="padding:0 8px 8px;font-size:10.5px">면 내부선 삼각 사각 다각 원 항목(?)
          <div style="display:grid;grid-template-columns:repeat(12,1fr);gap:2px;margin-top:4px">${'<span style="height:16px;background:var(--s-line)"></span>'.repeat(36)}</div>
          <div style="text-align:right;margin-top:5px"><span class="sbtn b">저장</span></div>
        </div>
      </div>

      ${M.pain(920, 52, "<b>미코딩만 보는 필터가 없음</b> — 등록일자를 1983년부터 월 단위로 좁혀 34페이지까지 줄이는 우회 (5616 3:30–4:15)", 280)}
      ${M.pain(925, 690, "<b>팝업 3종이 겹침</b> — 웹 모달 + 크롬 새 창(AI, 다크) + Windows 창(이미지 커팅). 생김새도 제각각 (5614 0:00–0:45)", 290)}
      ${M.pain(250, 236, "<b>같은 문양을 3번</b> — 문양정보 탭에서 상·중·하 행을 하나씩 눌러 같은 헤링본을 따로 찍음 (5616 0:30–2:45)", 300)}`
    );
  }

  M.add({
    id: "s10",
    code: "S10",
    group: "문양관리",
    title: "신발문양 관리",
    refs: [{ t: "SCAS 신발문양 관리", v: "5616 00:00 · 02:50–06:00" }, { t: "신발정보관리 모달", v: "5614 00:00–02:30" }, { t: "사업계획서", v: "p5" }],
    lead: "SCAS의 검색 조건·카드 목록·기본정보 칸은 그대로 두고, 모달 위에 AI 창·이미지 커팅 창이 또 뜨던 3겹 팝업을 오른쪽 칸 하나로 합쳤습니다. AI가 문양을 미리 채워 두면 감정관은 확인하고 승인만 합니다.",
    scas,
    ours,
    notes: [
      { n: 1, kind: "keep", title: "검색 조건 10개 그대로", text: "화류번호(靴類番號, 신발 번호)·제조사·상표·그룹명·등록일자·성별·승인·등록관서·화종(靴種, 신발 종류)·비고를 SCAS 라벨·순서 그대로 둡니다. 낯선 한자어 라벨은 첫 칸에만 괄호 풀이를 붙였습니다. 등록일자는 기본값을 「전체 기간」으로 바꾸고 이번 달·지난달 버튼을 둬, 10년씩 넘기던 날짜 선택기를 안 써도 됩니다.", src: "5616 S5 검색 폼 · P3 3:28–4:10" },
      { n: 2, kind: "better", title: "빠른 필터: 미코딩 · 미승인 · AI 추천 대기", text: "문양이 비어 있는 신발만 한 번에 모읍니다. SCAS에서는 이 필터가 없어 등록일자를 월 단위로 좁혀 34페이지까지 줄인 뒤 한 장씩 열어 확인했습니다.", src: "5616 3:30–4:40" },
      { n: 3, kind: "keep", title: "목록보기/문양보기 · 16장 카드 · 툴바", text: "SCAS 카드 16장 한 페이지와 체크박스를 그대로 둡니다. 툴바 6개는 자리만 옮겼습니다: 조회·초기화 → 검색 칸 끝, 엑셀·등록 → 오른쪽 위, 승인·삭제 → 체크한 카드 위 막대.", src: "5616 S5 툴바" },
      { n: 4, kind: "better", title: "팝업 3겹 → 오른쪽 칸 하나", text: "카드를 누르면 모달 대신 오른쪽 칸이 바뀝니다. 「인공지능문양관리」 크롬 새 창은 이 칸 안의 AI 추천으로, Windows 「이미지 커팅」 창은 「이미지 편집」 버튼(S03 편집 화면 하나)으로 들어왔습니다. 「이전」「다음」은 ‹ › 버튼과 키보드 ← →로 옆 신발로 넘어갑니다.", src: "5614 00:00–00:45" },
      { n: 5, kind: "plus", title: "AI 문양 추천을 미리 채움(청록)", text: "등록되면 AI가 상·중·하·윤곽 문양을 먼저 찍어 두고 부위별 신뢰도(예: AI 94%)를 보여 줍니다. SCAS 팝업의 설명 없는 숫자(13 → 44 → 75%) 대신 무엇의 %인지 적습니다. 감정관이 고치면 그 기록이 재학습에 쓰입니다(S15).", src: "사업계획서 p5 문양 자동 추출 F1 79.52 · 5614 00:22–00:45" },
      { n: 6, kind: "better", title: "상·중·하 같은 문양 한 번에", text: "고른 문양을 세 부위에 한 번에 넣습니다. 헤링본처럼 밑창 전체가 같은 무늬일 때 행을 3번 눌러 같은 아이콘을 3번 찍던 일을 줄입니다.", src: "5616 0:30–2:45" },
      { n: 7, kind: "better", title: "코드 설명을 아이콘 바로 옆에 · 문양 검색", text: "고른 아이콘 옆에 코드 설명 원문이 붙어 나옵니다(SCAS는 왼쪽 아래 멀리). 분류 탭 8개와 하위 탭(단선·다선1·다선2)은 그대로 두고, 「산 모양」처럼 설명 글자로도 찾게 했습니다.", src: "5614 01:15 · 설문: 정해진 문양 코딩 방식 부담" },
      { n: 8, kind: "keep", title: "기본정보 19칸 · 모달 버튼 전부 유지", text: "제조사·상표명·모델번호·신발종류·크기·제조지역·성별·좌우구분·굽유무·수집년도·몰드번호·전화번호·수집장소(주소)·수집장소(상호)·비고·신발그룹명·등록일자 라벨 그대로이고, 수집장소(상호) 「인터넷수집」 값도 그대로 씁니다. 버튼: NEW등록 → ＋ 등록, 그룹등록 그대로, 인공지능그룹등록 → AI 그룹 추천, 프린트 그대로, 수정 → 수정·저장, 승인 그대로, 닫기 → ✕.", src: "5614 S1·S3 버튼줄" },
      { n: 9, kind: "better", title: "보는 사람에 따라", text: "감정관·관리자만 승인·저장·등록 버튼이 보입니다. 수사관·검증자는 「보기 전용」으로 카드와 문양만 봅니다. 삭제는 관리자만 누를 수 있게 잠가, 감정관이 실수로 10만 건 DB에서 신발을 지우는 일을 막습니다." },
    ],
  });
})();
