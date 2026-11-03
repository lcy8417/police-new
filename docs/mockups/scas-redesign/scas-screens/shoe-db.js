/* SCAS 재현 — 신발 DB·기초코드 (영상 IMG_5614 0:00–2:30, IMG_5616 0:00–14:00)
   근거: analysis/scas-video/inventory_5614_5616.md S5·S1·S3·P1·P2·P3·S6 + detail/5614_0015_modal·5614_0050_modal·5614_0030·5616_0400·5616_0800.
   화면 순서 = 업무 순서: 목록 → 신발정보관리(기본정보 + 이미지 커팅) → 문양정보 → 인공지능 문양 상세 보기 → (목록) 날짜 좁히기 → 기초코드관리 */
(function () {
  const { btn, btns, inp, icon, img } = R;
  const G = "신발 DB·기초코드";

  /* ── 공통 조각 ── */
  const Z = [
    ["dots", "dots", "dots"], ["grid", "grid", "blocks"], ["herring", "herring", "herring"], ["wave", "blocks", "lines"], ["tri", "grid", "dots"],
    ["lines", "herring", "wave"], ["blocks", "grid", "blocks"], ["herring", "wave", "herring"], ["grid", "dots", "grid"],
  ];
  const NUMS = ["305661", "305660", "305659", "305658", "305657", "305656", "305655", "305654", "305653", "305652", "305651", "305650", "305649", "305648", "305647", "305646"];
  const SIDE = `<svg viewBox="0 0 120 60" width="100%" height="100%" aria-label="측면 사진 자리(가짜)"><path d="M10 44C10 32 20 28 34 26L54 14C66 10 78 16 86 24C98 28 112 32 112 42V50H10Z" fill="#e9ebef" stroke="#9aa1ab" stroke-width="1.5"/><path d="M40 34C58 24 76 26 92 34" fill="none" stroke="#3a3f48" stroke-width="5"/><path d="M10 50H112" stroke="#8a6f62" stroke-width="4"/></svg>`;
  const noImg = (h) => `<div style="height:${h}px;display:grid;place-items:center;background:#fff"><span style="display:grid;place-items:center;width:96px;height:96px;border-radius:50%;background:#d9dbe0;color:#fff;font:700 15px/1.1 Arial,sans-serif;text-align:center">NO<br>IMAGE</span></div>`;
  const barBtn = (t, b) => `<div class="r-bar" style="height:26px">${t}${b ? R.btn(b) : ""}</div>`;
  const modalTabs = (on) => `<div style="display:flex;gap:2px;margin:6px 6px 0;padding:5px 8px 0;background:var(--r-head)">
      <span ${on === "basic" ? "" : 'data-go="sc-shoe-basic"'} style="padding:5px 18px;font-weight:700;cursor:pointer;${on === "basic" ? "background:#fff;color:#2d3a8c" : "color:#fff"}">기본정보</span>
      <span ${on === "pattern" ? "" : 'data-go="sc-shoe-pattern"'} style="padding:5px 18px;font-weight:700;cursor:pointer;${on === "pattern" ? "background:#fff;color:#2d3a8c" : "color:#fff"}">문양정보</span></div>`;

  /* 신발문양 관리 목록(바탕) — dateFrom/dateTo/page/total 은 화면마다 다름 */
  function listBody({ from = "1983-01-01", to = "2025-07-24", pages = "6559", total = "전체 104933 중 1 - 16", openNo = "" } = {}) {
    const cal = `<span data-go="sc-date" title="→ sc-date" style="cursor:pointer">📅</span>`;
    const cards = NUMS.map(
      (n, i) => `<div data-go="sc-shoe-basic" style="cursor:pointer;background:#fff;border:${n === openNo ? "2px solid var(--r-green)" : "1px solid var(--r-line)"};padding:4px">
        ${img(118, 150, { kind: "shoe", zones: Z[i % Z.length], bg: "#ffffff" })}
        <div style="font-size:10px;color:#777;padding-top:2px">☐ ${n}</div></div>`
    ).join("");
    return `<div class="r-box" style="padding:6px;margin-bottom:8px">
        <table><tbody>
          <tr><td class="l">화류번호</td><td>${inp("", 220)}</td><td class="l">제조사</td><td>${inp("", 200)} ${btn("조회", "", "b")}</td><td class="l">성별</td><td>◉전체 ○남 ○여 ○혼용</td></tr>
          <tr><td class="l">등록일자</td><td>${inp(from, 96)} ${cal} ~ ${inp(to, 96)} ${cal}</td><td class="l">상표</td><td>${inp("", 200)} ${btn("조회", "", "b")}</td><td class="l">승인</td><td>◉전체 ○승인 ○미승인</td></tr>
          <tr><td class="l">등록관서</td><td>${inp("", 220)}</td><td class="l">그룹명</td><td>${inp("", 200)} ${btn("조회", "", "b")}</td><td class="l"></td><td></td></tr>
          <tr><td class="l">화종</td><td>${inp("", 220)}</td><td class="l">비고</td><td>${inp("", 200)}</td><td class="l"></td><td></td></tr>
        </tbody></table>
      </div>
      <div class="r-bar"><span>신발문양 관리 목록</span><span></span></div>
      <div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;padding:4px 2px;font-size:11px;color:#555">
        <span>○목록보기 ◉문양보기</span>${btns([["조회", "sc-shoe-list", "flat"], ["엑셀", "", "flat"], ["삭제", "", "flat"], ["승인", "", "flat"], ["등록", "sc-shoe-basic", "flat"], ["초기화", "", "flat"]])}
      </div>
      <div class="r-box" style="padding:6px;display:grid;grid-template-columns:repeat(9,minmax(0,1fr));gap:6px">${cards}</div>
      <div class="r-pg"><span>« ‹ 페이지 ${inp("1", 30)} / ${pages} › » ⟳</span><span>${total}</span></div>`;
  }

  /* 신발정보관리 모달 틀 */
  const modalBox = (inner) => `<div class="r-modal" style="left:140px;top:16px;width:920px;height:760px">
      <div class="r-bar" style="height:30px;font-size:13px">신발정보관리</div>${inner}</div>`;

  function basicModal() {
    const row = (l, v, req) => `<tr><td class="l ${req ? "req" : ""}" style="width:96px;padding:5px 8px">${l}${req ? "*" : ""}</td><td class="${req ? "req" : ""}" style="padding:4px 6px">${v}</td></tr>`;
    return modalBox(`${modalTabs("basic")}
      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px">
        ${btn("NEW등록", "sc-shoe-basic", "flat")}
        ${btns([["이전", "", "flat"], ["다음", "", "flat"], ["그룹등록", "", "flat"], ["인공지능그룹등록", "", "flat"], ["프린트", "", "flat"], ["수정", "", "flat"], ["삭제", "", "flat"], ["닫기", "sc-shoe-list", "flat"]])}
      </div>
      <div style="display:grid;grid-template-columns:25% 20% minmax(0,1fr);gap:8px;padding:0 8px">
        <div>${barBtn("바닥 이미지", "삭제")}<div style="height:600px;background:#f3f4f6;display:grid;place-items:center">${img(170, 560, { kind: "shoe", zones: ["dots", "dots", "dots"], bg: "#ffffff" })}</div></div>
        <div style="display:grid;gap:8px;align-content:start">
          ${barBtn("측면 이미지", "삭제")}<div style="height:150px;background:#fff;padding:14px 8px">${SIDE}</div>
          ${barBtn("전/후면 이미지", "추가")}${noImg(150)}
          ${barBtn("로고 이미지", "추가")}${noImg(150)}
        </div>
        <div>${barBtn("신발 정보")}
          <table><tbody>
            ${row("화류번호", "305655")}${row("등록관서", "경찰청")}
            ${row("제조사", `${inp("(유)나이키코리아", 260)} ${btn("조회", "", "b")}`)}
            ${row("상표명", `☐ ${inp("나이키", 236)} ${btn("조회", "", "b")}`, 1)}
            ${row("모델번호", inp("LD-1000 IH7330-020", 260))}
            ${row("신발종류", `${R.sel("운동화", 120)} ${R.sel("운동화", 120)}`, 1)}
            ${row("크기", inp("▴▾", 120))}
            ${row("제조지역", "○해당없음 &nbsp;○국내산 &nbsp;◉수입산")}
            ${row("성별", "○해당없음 &nbsp;○남 &nbsp;○여 &nbsp;◉혼용")}
            ${row("좌우구분", "○해당없음 &nbsp;◉좌 &nbsp;○우")}
            ${row("굽유무", "○해당없음 &nbsp;○유 &nbsp;◉무 &nbsp;○불상")}
            ${row("수집년도", `${R.sel("2025", 70)} 년 ${R.sel("7", 50)} 월`)}
            ${row("몰드번호", inp("", 160))}
            ${row("전화번호", `☐ ${inp("", 160)}`)}
            ${row("수집장소(주소)", `☐ ${inp("", 70)} ${inp("[주소]", 190)} ${btn("찾기", "", "b")}`)}
            ${row("수집장소(상호)", `☐ ${inp("인터넷수집", 236)}`, 1)}
            ${row("비고", inp("", 300))}
            ${row("신발그룹명", "")}
            ${row("등록일자", "2025-07-10")}
          </tbody></table></div>
      </div>`);
  }

  function patternModal() {
    const zr = (l, icons, red, extra = "") => `<tr><td class="l" style="width:70px;text-align:center">${l}</td><td style="height:64px;${red ? "outline:2px solid #e23b3b;outline-offset:-2px" : ""}">${icons}${extra}</td></tr>`;
    const big = (n) => `<span style="display:inline-block;margin-right:6px">${icon(n).replace('class="r-icon ', 'style="width:48px;height:48px" class="r-icon ')}</span>`;
    const pal = M.P["면"].map((n) => icon(n, n === "n21_05").replace('class="r-icon', 'style="width:40px;height:40px;margin:2px" class="r-icon')).join("");
    return modalBox(`${modalTabs("pattern")}
      <div style="display:flex;justify-content:flex-end;align-items:center;gap:4px;padding:6px 10px">
        ${btn("인공지능문양관리", "sc-shoe-ai")}${btns([["이전", "", "flat"], ["다음", "", "flat"], ["승인", "sc-shoe-list", "flat"], ["그룹등록", "", "flat"], ["닫기", "sc-shoe-list", "flat"]])}
      </div>
      <div style="display:grid;grid-template-columns:30% minmax(0,1fr);gap:8px;padding:0 8px">
        <div>
          ${barBtn("바닥 이미지")}<div style="height:420px;background:#fff;display:grid;place-items:center">${img(150, 400, { kind: "shoe", zones: ["dots", "dots", "dots"], bg: "#ffffff" })}</div>
          ${barBtn("코드 설명")}<div class="r-box" style="height:180px;padding:8px;font-size:12px">${M.PDESC.n21_05}</div>
        </div>
        <div>
          ${barBtn("신발 문양")}
          <table><tbody>
            ${zr("상", big("n51_02") + big("n21_05"), true)}
            ${zr("중", big("n51_02") + big("s81b") + big("s81c") + big("n21_05"))}
            ${zr("하", big("n51_02"))}
            ${zr("윤곽", "")}
            <tr><td class="l" style="text-align:center">문자열</td><td style="height:40px;text-align:right">${btn("저장", "", "b")}</td></tr>
          </tbody></table>
          <div style="display:flex;gap:2px;margin-top:6px;padding:4px 6px 0;background:var(--r-head)">
            ${M.PCATS.map((c) => `<span style="padding:4px 12px;font-weight:700;${c === "면" ? "background:#fff;color:#2d3a8c" : "color:#fff"}">${c}</span>`).join("")}
          </div>
          <div class="r-box" style="height:150px;padding:4px;overflow:hidden">${pal}</div>
          <div style="display:flex;gap:2px;padding:4px 6px 0;background:var(--r-head)">
            <span style="padding:4px 12px;background:#fff;color:#2d3a8c;font-weight:700">규칙무늬</span><span style="padding:4px 12px;color:#fff;font-weight:700">불규칙무늬</span>
          </div>
        </div>
      </div>`);
  }

  /* ── 1. 신발문양 관리 목록 ── */
  R.add({
    id: "sc-shoe-list",
    group: G,
    title: "신발문양 관리 목록",
    ours: "S10",
    ref: "5616 00:00 · 02:50–06:00",
    kind: "탭 화면",
    render: () =>
      R.win({ tabOn: "신발문양 관리", treeOn: "신발문양 관리", extraTabs: [["신발문양 관리", "sc-shoe-list"]], h: 880 }, listBody({ openNo: "305657" })),
    memo: [
      "10만 건이 넘는데 문양을 안 넣은(미코딩) 신발만 보는 필터가 없어, 등록일자를 월 단위로 좁혀 찾는다 (5616 3:30–4:15)",
      "기본 시작일이 1983-01-01이라 늘 바꿔야 하고, 결과가 6559쪽이다 (5616 0:00)",
      "카드 번호(화류번호) 글씨가 아주 작다. 방금 연 카드만 초록 테두리로 남는다 (5616 2:45)",
    ],
  });

  /* ── 2. 신발정보관리 — 기본정보 탭 + 이미지 커팅 창 ── */
  R.add({
    id: "sc-shoe-basic",
    group: G,
    title: "신발정보관리 · 기본정보 (+이미지 커팅 창)",
    ours: "S10",
    ref: "5614 00:00–00:19 · 5616 00:15",
    kind: "레이어 팝업 + OS 창",
    render: () =>
      R.win(
        { tabOn: "신발문양 관리", treeOn: "신발문양 관리", extraTabs: [["신발문양 관리", "sc-shoe-list"]], h: 880 },
        `${listBody({ openNo: "305655" })}${R.dim()}${basicModal()}
        <div class="r-os" style="left:40px;top:130px;width:430px">
          <div class="tt"><span>👤 이미지 커팅</span></div>
          <div style="display:flex;flex-wrap:wrap;gap:3px;padding:6px">${btns(["-", "170", "+", "좌", "0", "우", "잘라내기", "확인", "저장"])}</div>
          <div style="height:400px;margin:0 6px;background:#fff;border:1px solid #bbb;display:grid;place-items:center;overflow:hidden">${img(200, 380, { kind: "shoe", zones: ["dots", "dots", "dots"], bg: "#ffffff" })}</div>
          <div style="display:flex;flex-wrap:wrap;gap:3px;padding:6px">${btns(["처음상태", "평준화", "색상반전", "좌우반전", "밝게", "어둡게", "상하반전"])}</div>
        </div>`
      ),
    memo: [
      "웹 팝업 위에 브라우저 밖 Windows 창(이미지 커팅)이 또 뜬다. 생김새가 완전히 달라 창이 2~3개 겹쳐 남는다 (5614 0:00–0:10)",
      "라벨 글씨가 작고 회색 바탕에 회색 글씨라 잘 안 보인다 (5614 0:15)",
      "오른쪽 위 버튼 8개(이전·다음·그룹등록·인공지능그룹등록·프린트·수정·삭제·닫기)가 모두 같은 회색 글자라 구분이 어렵다 (5614 0:15)",
      "이미지 커팅 창 아래 줄 둘째 버튼은 영상에서 흐리게 보여 「평준화」로 적었다(판독 불확실)",
    ],
  });

  /* ── 3. 신발정보관리 — 문양정보 탭 ── */
  R.add({
    id: "sc-shoe-pattern",
    group: G,
    title: "신발정보관리 · 문양정보",
    ours: "S10",
    ref: "5614 00:50–02:30 · 5616 00:30–02:45",
    kind: "레이어 팝업",
    render: () =>
      R.win({ tabOn: "신발문양 관리", treeOn: "신발문양 관리", extraTabs: [["신발문양 관리", "sc-shoe-list"]], h: 880 }, `${listBody({ openNo: "305655" })}${R.dim()}${patternModal()}`),
    memo: [
      "행(상·중·하·윤곽·문자열)을 누르고 → 분류 탭 8개 → 하위 탭 → 작은 흑백 아이콘을 골라야 한다. 아이콘이 50개가 넘는다 (5614 0:50–1:30)",
      "밑창 전체가 같은 무늬여도 상·중·하에 같은 아이콘을 하나씩 3번 찍는다 (5616 0:30–2:45)",
      "고른 아이콘의 뜻(코드 설명)이 왼쪽 아래 멀리 떨어져 있어 눈을 크게 옮겨야 한다 (5614 1:15)",
    ],
  });

  /* ── 4. 인공지능 문양 상세 보기(신발, 크롬 새 창·다크) ── */
  R.add({
    id: "sc-shoe-ai",
    group: G,
    title: "인공지능 문양 상세 보기 (신발)",
    ours: "S10",
    ref: "5614 00:20–00:45",
    kind: "크롬 새 창(다크)",
    render: () => {
      const boxes = [
        [22, 30, "#f5c542"], [60, 52, "#a78bfa"], [34, 90, "#4ade80"], [74, 120, "#f472b6"], [28, 160, "#f5c542"], [66, 196, "#a78bfa"], [40, 236, "#4ade80"],
        [80, 270, "#f472b6"], [30, 304, "#f5c542"], [62, 340, "#4ade80"], [36, 380, "#a78bfa"], [70, 410, "#f5c542"],
      ]
        .map(([x, y, c]) => `<span style="position:absolute;left:${x}px;top:${y}px;width:22px;height:18px;border:2px solid ${c}"></span>`)
        .join("");
      const zrow = (l, ns) => `<div style="display:grid;grid-template-columns:50px minmax(0,1fr);min-height:96px;margin-bottom:4px;background:var(--r-dark2)"><span style="display:grid;place-items:center;color:#cfd3da">${l}</span><span style="display:flex;gap:6px;align-items:flex-start;padding:10px">${ns.map((n) => icon(n)).join("")}</span></div>`;
      const tabs = [["▨", "면"], ["▰", "내부선"], ["△", "삼각"], ["□", "사각"], ["⬠", "다각"], ["○", "원"], ["⚠", "항목"]];
      /* 「?」(분류 불가) 아이콘은 팔레트 첫 칸에만 */
      const Q = ["n51_01", "n71_01", "s10a", "s81a", "s41a", "s61a", "s71a", "n41_04"];
      const pal = ["n51_01"].concat(["면", "삼각", "사각", "다각"].flatMap((c) => M.P[c]).filter((n) => !Q.includes(n))).slice(0, 52).map((n) => icon(n)).join("");
      return R.win(
        { tabOn: "신발문양 관리", treeOn: "신발문양 관리", extraTabs: [["신발문양 관리", "sc-shoe-list"]], h: 880 },
        `${listBody({ openNo: "305655" })}${R.dim()}${patternModal()}
        <div class="r-dark" style="left:-190px;top:-50px;width:1100px;height:810px">
          <div class="tt">인공지능 문양 상세 보기 - Chrome</div>
          <div style="height:22px;padding:0 10px;background:#eef0f3;color:#555;font:11px/22px Consolas,monospace">10.14.43.6/kcsi/ftis/ai/AIShoeOutsolePattern.do</div>
          <div style="position:relative;height:30px;display:grid;place-items:center;font-size:13px;color:#eee;border-bottom:1px solid #222">
            <span style="position:absolute;left:10px;top:5px;width:20px;height:20px;border-radius:4px;background:#4a5fd0"></span>인공지능 문양 상세 보기</div>
          <div style="display:grid;grid-template-columns:30% minmax(0,1fr);gap:10px;padding:10px">
            <div>
              <div style="color:#cfd3da;margin-bottom:6px">바닥 이미지</div>
              <div style="position:relative;height:620px;background:#fff;display:grid;place-items:center">
                ${img(200, 600, { kind: "shoe", zones: ["dots", "dots", "dots"], bg: "#ffffff" })}
                <span style="position:absolute;left:60px;top:40px;width:200px;height:480px">${boxes}</span>
                <span style="position:absolute;left:8px;bottom:14px;font:700 34px Arial,sans-serif;color:#fff;text-shadow:0 1px 3px #000">75%</span>
                <span style="position:absolute;left:0;bottom:0;width:75%;height:6px;background:#f5c542"></span>
                <span style="position:absolute;right:8px;bottom:12px">${icon("n51_02")}</span>
              </div>
            </div>
            <div>
              <div style="color:#cfd3da;margin-bottom:6px">신발 문양</div>
              ${zrow("상", ["n21_05", "n51_02"])}${zrow("중", ["s81b", "s81c", "n51_02"])}${zrow("하", ["n51_02"])}
              <div style="display:flex;gap:22px;padding:8px 10px;color:#cfd3da">${tabs.map(([g, t]) => `<span><span style="color:#8fb3ff">${g}</span> ${t}</span>`).join("")}</div>
              <div style="height:190px;overflow:hidden;display:grid;grid-template-columns:repeat(13,32px);gap:8px;padding:6px 10px;background:#262a30">${pal}</div>
              <div style="text-align:right;padding-top:10px">${btn("저장", "sc-shoe-pattern", "b")}</div>
            </div>
          </div>
        </div>`
      );
    },
    memo: [
      "문양정보 탭의 「인공지능문양관리」를 누르면 브라우저 새 창(다크 화면)이 따로 뜬다. 본 화면(밝은 색)과 톤이 끊기고, 이미지 커팅 창까지 3겹이 된다 (5614 0:20–0:45)",
      "왼쪽 아래 큰 숫자가 13 → 44 → 75% → 10으로 바뀌는데, 무엇의 숫자인지 화면에 설명이 없다 (5614 0:22–0:45)",
      "AI가 상·중·하만 채우고 윤곽 행은 없다. 저장하고 닫아야 문양정보 탭에 반영된다 (5614 0:50)",
      "주소의 「ftis」는 화면에서 흐리게 보여 가장 그럴듯한 표기로 적었다(판독 불확실)",
    ],
  });

  /* ── 5. 등록일자 날짜 선택기(월/년) ── */
  R.add({
    id: "sc-date",
    group: G,
    title: "등록일자 날짜 선택기",
    ours: "S10",
    ref: "5616 03:28–04:10",
    kind: "레이어 팝업",
    render: () => {
      const mo = (m) => `<span style="display:block;padding:7px 0;text-align:center;${m === 3 ? "background:#3c55c8;color:#fff;font-weight:700" : ""}">${m}월</span>`;
      const yr = (y) => `<span style="display:block;padding:7px 0;text-align:center;${y === 1983 ? "background:#3c55c8;color:#fff;font-weight:700" : "color:#555"}">${y}</span>`;
      return R.win(
        { tabOn: "신발문양 관리", treeOn: "신발문양 관리", extraTabs: [["신발문양 관리", "sc-shoe-list"]], h: 880 },
        `${listBody({ from: "1983-03-01", to: "2025-03-31", pages: "6414", total: "전체 102619 중 1 - 16" })}
        <div style="position:absolute;left:96px;top:66px;width:250px;background:#fff;border:1px solid #9aa3b5;box-shadow:0 8px 24px rgba(0,0,0,.3);padding:8px;font-size:12px">
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:2px 6px">
            <div>${[1, 2, 3, 4, 5, 6].map(mo).join("")}</div><div>${[7, 8, 9, 10, 11, 12].map(mo).join("")}</div>
            <div style="grid-column:3/5;display:grid;grid-template-columns:1fr 1fr;gap:0 6px">
              <span style="text-align:center;color:#888">«</span><span style="text-align:center;color:#888">»</span>
              <div>${[1979, 1980, 1981, 1982, 1983].map(yr).join("")}</div><div>${[1984, 1985, 1986, 1987, 1988].map(yr).join("")}</div>
            </div>
          </div>
          <div style="display:flex;justify-content:center;gap:6px;padding-top:8px">${btn("확인", "sc-shoe-list", "b")}${btn("취소", "sc-shoe-list", "b")}</div>
        </div>`
      );
    },
    memo: [
      "미코딩 신발을 찾으려고 날짜를 1983-01-01 → 1983-03-01, 2025-03-31 → 2025-03-01~03-31로 몇 번씩 좁힌다(결과 34쪽 536건) (5616 3:28–4:10)",
      "일 달력(« 1월 1983 », 요일, [오늘])에서 월/년 화면으로 바꿔야 하고, 연도는 10년씩 넘겨야 해 클릭이 많다 (5616 3:28–4:10)",
      "기본 시작일이 1983년이라 날짜 범위를 매번 바꿔야 한다 (5616 3:28)",
    ],
  });

  /* ── 6. 기초코드관리 ── */
  const CATS = [
    [23, "FT032", "문양코딩구분"], [24, "FT016", "발견처리구분"], [25, "FT031", "범죄명구분"], [26, "FT047", "범죄장소구분"], [27, "FT057", "사건결과구분"],
    [28, "FT017", "사건처리구분"], [29, "FT019", "성별"], [30, "FT015", "승인구분"], [31, "FT012", "시스템구분"], [32, "FT059", "신규범죄장소구분"],
    [33, "FT060", "신규범죄장소구분"], [34, "FT013", "신발문양구분"], [35, "FT014", "신발문양상세구분"], [36, "FT030", "신발바닥위치구분"], [37, "FT001", "신발분류"],
    [38, "FT052", "신발분류상위"], [39, "FT003", "신발상표"], [40, "FT004", "신발색상"], [41, "FT002", "신발제조사"], [42, "FT0011", "신발제조사"],
    [43, "FT037", "신발타이어구분"], [44, "FT023", "앞뒤구분"], [45, "FT051", "요청사항처리구분"], [46, "FT056", "용의자이미지구분"], [47, "FT053", "용의자이미지구분"],
  ];
  const MAKERS = [
    ["FT002068", "팀웍(Teamwork)"], ["FT002141", "파트보"], ["FT002139", "파크랜드"], ["FT002200", "팔팔사"], ["FT002122", "페가수스"],
    ["FT002255", "포센스어패럴"], ["FT002092", "폴로"], ["FT002003", "퓨마사업부"], ["FT002027", "프로월드컵"], ["FT002093", "프로스펙스"],
    ["FT002171", "피코나패션"], ["FT002158", "하나"], ["FT002142", "학산"], ["FT002085", "한비산업"], ["FT002301", "한스산업"],
    ["FT002254", "한신제화"], ["FT002126", "한일제화"], ["FT002149", "해성"], ["FT002076", "협진"], ["FT002183", "호우(주)"],
    ["FT002047", "화승화학"], ["FT002014", "화승상사"], ["FT002167", "휠라코(주)"], ["FT002008", "휠라코리아"], ["FT002277", "힐턴"],
  ];
  R.add({
    id: "sc-code",
    group: G,
    title: "기초코드관리",
    ours: "S12",
    ref: "5616 08:00–14:00",
    kind: "탭 화면",
    render: () =>
      R.win(
        { tabOn: "기초코드관리", treeOn: "기초코드관리", extraTabs: [["신발문양 관리", "sc-shoe-list"], ["기초코드관리", "sc-code"]], h: 900 },
        `<div style="display:grid;grid-template-columns:35% minmax(0,1fr);gap:10px">
          <div>
            <div class="r-bar"><span>기초 분류 코드</span><span></span></div>
            <div style="display:flex;justify-content:flex-end;padding:4px 2px">${btns([["등록", "", "flat"], ["삭제", "", "flat"]])}</div>
            <div class="r-box" style="height:690px;overflow:hidden"><table><thead><tr><th>순번</th><th>아이디</th><th>분류</th><th>코드 설명</th><th>사용여부</th></tr></thead>
              <tbody>${CATS.map(([n, id, nm]) => `<tr class="${id === "FT002" ? "sel" : ""}"><td style="text-align:center">${n}</td><td>${id}</td><td>${nm}</td><td></td><td style="text-align:center">Y</td></tr>`).join("")}</tbody></table></div>
          </div>
          <div>
            <div class="r-bar"><span>족윤적 기초 코드</span><span></span></div>
            <div style="display:flex;align-items:center;gap:6px;padding:4px 2px">
              <span style="color:#666">코드명</span>${inp("", 160)}<span style="margin-left:auto">${btns([["조회", "", "flat"], ["등록", "", "flat"], ["삭제", "", "flat"]])}</span>
            </div>
            <div class="r-box" style="height:690px;overflow:hidden"><table><thead><tr><th>순번</th><th>코드</th><th>코드명</th><th style="width:40%">코드 설명</th><th>사용여부</th></tr></thead>
              <tbody>${MAKERS.map(([c, nm], i) => `<tr><td style="text-align:center">${288 + i}</td><td>${c}</td><td>${nm}</td><td></td><td style="text-align:center">Y</td></tr>`).join("")}</tbody></table></div>
          </div>
        </div>`
      ),
    memo: [
      "분류 이름이 겹친다: FT002·FT0011 둘 다 「신발제조사」, FT059·FT060, FT056·FT053도 같은 이름. 아이디 자릿수도 다르다(FT0011) (5616 8:00–8:15)",
      "제조사 313건·상표 677건을 코드명 검색칸 대신 스크롤로 훑어 찾는다 (5616 8:03–9:00)",
      "상표 코드의 「코드 설명」 칸은 「신발제조사」라고 적힌 행과 빈 행이 섞여 있어, 어느 회사 상표인지 이 화면에서 알 수 없다 (5616 9:00–9:57)",
      "제조사 이름 일부(파트보·팔팔사·포센스어패럴 등)는 영상에서 흐려 가장 그럴듯한 표기로 적었다(판독 불확실)",
    ],
  });
})();
