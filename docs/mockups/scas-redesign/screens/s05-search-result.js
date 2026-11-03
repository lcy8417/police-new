/* S05 검색 결과 — SCAS 「문양검색결과」 레이어 팝업 + 「인공지능 문양 검색 결과」 다크 창 (IMG_5613 05:07, 07:22, 08:52–09:52) */
(function () {
  const { pin, apin, sole, picon } = M;

  /* 후보: mv=AI 리랭킹 이동(+면 위로), zn=[상,중,하] 일치, prev=이전 검색(572355) 순위 */
  const RES = [
    { id: "305659", sim: 94.2, mv: 12, zn: [1, 1, 1], br: "나이키", k: "운동화", prev: "이전 13위", z: ["herring", "herring", "herring"], star: true },
    { id: "305661", sim: 91.8, mv: 3, zn: [1, 1, 0], br: "나이키", k: "운동화", prev: "이전 5위", z: ["herring", "grid", "herring"], hover: true },
    { id: "288104", sim: 89.5, mv: -1, zn: [1, 0, 1], br: "아디다스", k: "운동화", prev: "이전 2위", z: ["herring", "dots", "herring"], star: true },
    { id: "301877", sim: 87.0, mv: 0, zn: [1, 1, 0], br: "뉴발란스", k: "운동화", prev: "새로 등장", z: ["herring", "herring", "blocks"] },
    { id: "276552", sim: 85.3, mv: 27, zn: [0, 1, 1], br: "프로스펙스", k: "운동화", prev: "이전 31위", z: ["grid", "herring", "herring"], star: true },
    { id: "299410", sim: 84.9, mv: -2, zn: [1, 0, 0], br: "나이키", k: "슬리퍼", prev: "이전 4위", z: ["herring", "wave", "lines"] },
    { id: "262019", sim: 83.1, mv: 5, zn: [0, 1, 0], br: "휠라", k: "운동화", prev: "이전 11위", z: ["dots", "herring", "grid"] },
    { id: "305102", sim: 82.7, mv: -4, zn: [1, 0, 0], br: "기타", k: "구두", prev: "이전 6위", z: ["herring", "blocks", "blocks"] },
  ];
  const mvBadge = (m) =>
    m > 0
      ? `<span class="chip teal num" style="height:19px;padding:0 6px;font-size:10.5px" title="AI 리랭킹으로 ${m}계단 올라옴">▲${m}</span>`
      : m < 0
      ? `<span class="chip num" style="height:19px;padding:0 6px;font-size:10.5px;color:var(--dim)">▼${-m}</span>`
      : `<span class="chip" style="height:19px;padding:0 6px;font-size:10.5px;color:var(--dim)">—</span>`;
  const zchips = (zn) =>
    ["상", "중", "하"].map((t, i) => `<span class="chip ${zn[i] ? "green" : ""}" style="height:18px;padding:0 6px;font-size:10.5px;${zn[i] ? "" : "color:var(--faint)"}">${t}</span>`).join("");

  function card(r, i) {
    const hover = r.hover
      ? `<div style="position:absolute;inset:0;clip-path:inset(0 50% 0 0)">${sole({ kind: "scene", zones: ["herring", "grid", "herring"] })}</div>
         <div style="position:absolute;left:50%;top:0;bottom:0;width:2px;margin-left:-1px;background:var(--blue)"></div>
         <span class="chip blue" style="position:absolute;left:8px;top:8px;height:20px">빠른 대조</span>
         <span style="position:absolute;left:0;right:0;bottom:0;padding:5px 8px;background:rgba(5,8,13,.82);color:var(--fg2);font-size:11px">두 번 누르면 편집창(S03)</span>`
      : `<span class="cap">${r.id}</span>`;
    const pinHtml = i === 0 ? apin(4, "plus") : i === 1 ? apin(6, "better") : "";
    return `<div class="pinbox" style="display:grid;gap:6px;padding:8px;border:1px solid ${r.hover ? "var(--blue)" : "var(--line)"};border-radius:12px;background:var(--panel2);${r.hover ? "box-shadow:0 0 0 1px var(--blue),0 10px 30px rgba(0,0,0,.45)" : ""}">${pinHtml}
      <div style="display:flex;align-items:center;gap:6px">
        <b class="num" style="font-size:13px">${i + 1}위</b><span class="num" style="color:var(--fg);font-weight:600;font-size:13px">${r.sim.toFixed(1)}%</span>${mvBadge(r.mv)}
        <button class="btn sm ghost" style="margin-left:auto;padding:0 4px;font-size:16px;color:${r.star ? "var(--amber)" : "var(--faint)"}" data-lock="analyst admin" title="확인대상">${r.star ? "★" : "☆"}</button>
      </div>
      <span class="imgbox" style="height:190px">${sole({ kind: "shoe", zones: r.z })}${hover}</span>
      <div style="display:flex;justify-content:space-between;gap:6px;font-size:11.5px"><span style="color:var(--fg2)"><span class="mono">${r.id}</span> · ${r.br} · ${r.k}</span></div>
      <div style="display:flex;align-items:center;gap:4px">${zchips(r.zn)}<span style="margin-left:auto;font-size:10.5px;color:${r.prev === "새로 등장" ? "var(--violet)" : "var(--dim)"}">${r.prev}</span></div>
    </div>`;
  }

  function ours() {
    const stars = RES.filter((r) => r.star);
    return M.shell(
      { active: "검색 이력", tabs: ["사건관리", "00001-25-0646", "문양 코딩 · _1", "검색 결과 572414"], tabOn: "검색 결과 572414", title: "검색 결과", h: 1090 },
      `<div class="page-head">
        <div><div class="crumb">족윤적 · 문양검색 · 검색 결과</div><h3>검색 결과 <span class="mono" style="font-size:16px;color:var(--mute)">572414</span></h3>
          <p>현장 족적을 왼쪽에 고정하고 후보를 넘겨 봅니다. 별(★)을 누르면 바로 확인대상에 들어갑니다.</p></div>
        <div style="display:flex;gap:8px"><button class="btn">엑셀</button><button class="btn">조건 고치기 (S04)</button></div>
      </div>

      <div style="display:grid;grid-template-columns:240px minmax(0,1fr);gap:12px;align-items:start">
        <div class="panel tc">
          <div class="panel-h"><span class="t">현장 족적</span><span class="r"><span class="seg"><button aria-pressed="true">원본</button><button aria-pressed="false">이진화</button></span></span></div>
          <div class="panel-b pinbox" style="display:grid;gap:10px">${apin(2, "better")}
            <span class="imgbox" style="height:380px">${sole({ kind: "scene", zones: ["herring", "grid", "herring"] })}<span class="cap">고정 · 스크롤해도 그대로</span></span>
            <div style="display:flex;gap:4px;align-items:center"><span style="color:var(--dim);font-size:11px;margin-right:2px">이미지번호</span>${["_1", "_2", "_3"].map((n, i) => `<span class="chip ${i === 0 ? "blue" : ""} mono" style="height:20px">${n}</span>`).join("")}</div>
            <div class="form" style="grid-template-columns:70px minmax(0,1fr)">
              <div class="l">검색번호</div><div class="v mono">572414</div>
              <div class="l">검색 방식</div><div class="v"><span class="chip teal" style="height:20px">하이브리드</span></div>
              <div class="l">검색일</div><div class="v num">07-24 17:29</div>
              <div class="l">필수 문양</div><div class="v" style="display:flex;gap:4px">${picon("n32_04", "sm")}<span class="chip red" style="height:20px">상·중·하</span></div>
            </div>
          </div>
        </div>

        <div class="panel tc" style="min-width:0">
          <div class="panel-h"><span class="lbl">RESULTS</span>
            <span class="t num pinbox" style="padding-right:16px">1–8위 / 857건${apin(3, "better")}</span>
            <span class="r pinbox" style="padding-right:12px">${apin(1, "keep")}<span style="color:var(--dim);font-size:11.5px">결과형태</span>
              <span class="seg"><button aria-pressed="false">1열</button><button aria-pressed="false">2열</button><button aria-pressed="false">3열</button><button aria-pressed="true">4열</button></span>
              <button class="btn sm">★ 확인대상보기 <span class="num" style="color:var(--amber)">${stars.length}</span></button></span>
          </div>
          <div class="pinbox" style="display:flex;gap:8px;align-items:center;padding:8px 14px;border-bottom:1px solid var(--line2)">${apin(7, "better")}
            ${["제조사", "상표", "화종", "성별"].map((t) => `<span class="inp" style="width:96px">${t} 전체<span class="caret">▾</span></span>`).join("")}
            <span style="width:1px;height:22px;background:var(--line)"></span>
            <span style="color:var(--dim);font-size:11.5px">이력 간 비교</span>
            <span class="seg"><button aria-pressed="false">끔</button><button aria-pressed="true">572355와 비교</button></span>
            <span class="chip teal" style="margin-left:auto"><span class="ai-mark">AI</span> 리랭킹 켬</span>
          </div>
          <div class="panel-b" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px">${RES.map(card).join("")}</div>
          <div style="display:flex;align-items:center;gap:10px;padding:0 14px 12px">
            <span class="num" style="color:var(--mute);font-size:12px">‹ 1 / 108 ›</span><span class="num" style="color:var(--dim);font-size:12px">1–8위 / 857건</span>
            <span class="pinbox" style="margin-left:auto;display:inline-flex;gap:10px;align-items:center;padding:6px 12px;border:1px solid var(--line3);border-radius:999px;background:var(--panel3);font-size:12px">${apin(5, "better")}
              <span style="color:var(--amber)">★</span>276552를 확인대상에 넣었습니다<b style="color:var(--blue);cursor:pointer">되돌리기</b></span>
          </div>
        </div>
      </div>

      <div class="panel pinbox" style="margin-top:12px">${apin(8, "plus", true)}
        <div class="panel-b" style="display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center">
          <div style="display:grid;gap:2px;min-width:110px"><b style="font-size:13px">확인대상 그룹</b><span style="color:var(--dim);font-size:11px">끌어서 순서 바꾸기</span></div>
          <span class="chip amber num">${stars.length}건</span>
          ${stars.map((r) => `<span style="display:inline-flex;gap:6px;align-items:center;padding:4px 8px 4px 4px;border:1px solid var(--line3);border-radius:8px;background:var(--panel2)"><span class="imgbox" style="width:32px;height:46px;border-radius:5px">${sole({ kind: "shoe", zones: r.z })}</span><span style="display:grid;line-height:1.3"><b class="mono" style="font-size:11.5px">${r.id}</b><span style="font-size:10.5px;color:var(--dim)">${r.br}</span></span><span style="color:var(--faint);margin-left:2px" title="제외">✕</span></span>`).join("")}
          <span class="inp" style="width:150px">그룹명: 헤링본 계열</span>
          <span class="pinbox" style="margin-left:auto;display:flex;gap:6px;padding-right:12px">${apin(9, "better")}
            <button class="btn">정밀 대조 (S06) →</button>
            <button class="btn ok" data-role="analyst admin">확인대상 저장</button>
            <button class="btn pri" data-role="analyst admin">검색결과 확인 →</button>
            <button class="btn warn" data-role="verifier">검증 메모</button>
            <span class="chip" data-role="investigator">수사관 · 결과 열람만</span></span>
        </div>
      </div>
      <p style="margin:8px 2px 0;color:var(--dim);font-size:11px">참고 · 상위 10위 안에 정답이 든 비율(Top-10) — 문양+이미지 하이브리드 51.43% / 기존 시스템 47.14% <span style="color:var(--faint)">(사업계획서 p5 표3, 폴리스랩 2.0 실증)</span></p>`
    );
  }

  function scas() {
    const caps = ["1 | 49", "2 | 32", "3 | 32", "4 | 30", "5 | 25", "6 | 24", "7 | 24", "8 | 23"];
    return M.scasShell(
      { treeOn: "사건관리", h: 790 },
      `<div style="height:710px"></div>
      <div class="modal" style="left:10px;top:8px;width:1200px;height:640px;opacity:.55"><div class="bar">문양 상세보기</div></div>
      <div class="dim"></div>
      <div class="modal" style="left:16px;top:24px;width:740px;height:600px">
        <div class="bar">문양검색결과 <span>✕</span></div>
        <div style="display:flex;gap:6px;align-items:center;padding:6px 8px;border-bottom:1px solid var(--s-line)">이미지번호 <b>00001-25-0646_1</b>
          <span style="margin-left:auto">결과형태 <span class="sbtn">1열</span> <span class="sbtn">2열</span> <span class="sbtn">3열</span> <span class="sbtn b">4열</span> <span class="sbtn">확인대상보기</span></span></div>
        <div style="display:grid;grid-template-columns:170px 1fr;gap:8px;padding:8px">
          <div class="ph" style="height:470px;background:#3a3a30;color:#c9b78a">현장 족적</div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">${caps.map((c) => `<div class="box" style="padding:4px"><div class="ph" style="height:190px">밑창</div><div style="text-align:center;font-size:11px">${c}</div></div>`).join("")}</div>
        </div>
        <div style="padding:2px 8px;color:#666;font-size:11px">« ‹ 페이지 [1] / 10 › » <span style="float:right">전체 470</span></div>
      </div>
      <div class="darkwin" style="left:740px;top:70px;width:470px;height:560px">
        <div class="tt">인공지능 문양 검색 결과 - Chrome</div>
        <div style="display:flex;gap:6px;align-items:center;padding:6px 8px;font-size:11px"><span>(현장) 이미지</span><span style="margin-left:auto">□ ▦ ▦ ▦</span><span class="sbtn">이진화 이미지</span></div>
        <div style="display:grid;grid-template-columns:120px 1fr;gap:6px;padding:0 8px">
          <div class="ph" style="height:440px;background:#111;color:#777">족적</div>
          <div><div style="font-size:11px;margin-bottom:4px">발견 이미지</div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px">${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<div style="position:relative;height:190px;background:#000;border:1px solid #444"><span style="position:absolute;left:4px;bottom:3px;font-size:10px">${n} /857</span></div>`).join("")}</div></div>
        </div>
        <div style="position:absolute;left:0;right:0;bottom:8px;text-align:center;font-size:11px">« ‹ 1/108 › » <span class="sbtn b" style="position:absolute;right:8px">확인대상 보기</span></div>
      </div>
      <div class="modal" style="left:220px;top:300px;width:270px;height:110px;z-index:4">
        <div class="bar">알림 <span>✕</span></div>
        <div style="padding:12px;text-align:center">❔ 확인대상에 등록하시겠습니까?<div style="margin-top:10px"><span class="sbtn b">예</span> <span class="sbtn">아니오</span></div></div>
      </div>
      ${M.pain(70, 210, "<b>숫자 표기가 화면마다 다름</b> — 일반 결과 「1 | 49」, AI 결과 「1 /857」, 페이지 「1/108」, 「전체 470」 (5613 05:07 · 07:22)", 250)}
      ${M.pain(250, 430, "<b>확인대상 하나에 팝업 2번</b> — 카드 → 상세조회 팝업 → 「확인대상」 → 알림 「예」 (5613 08:52–09:20)", 250)}
      ${M.pain(960, 640, "<b>일반·AI 결과가 다른 창</b> — 라이트 팝업과 다크 Chrome 창을 오가며 봄 (5613 05:07 vs 07:22)", 240)}`
    );
  }

  M.add({
    id: "s05",
    code: "S05",
    group: "문양검색",
    title: "검색 결과",
    refs: [
      { t: "SCAS 문양검색결과", v: "5613 07:22 · 09:47" },
      { t: "SCAS 인공지능 문양 검색 결과", v: "5613 05:07" },
      { t: "SCAS 확인대상 등록 알림", v: "5613 09:20" },
    ],
    lead: "일반 결과 팝업과 AI 결과 다크 창을 결과 화면 하나로 합쳤습니다. 결과형태(1–4열)와 확인대상보기는 그대로 두고, 카드마다 순위·유사도·AI 리랭킹 이동·일치 부위를 보여 주며, 확인대상은 카드의 별 하나로 넣고 뺍니다.",
    scas,
    ours,
    notes: [
      { n: 1, kind: "keep", title: "결과형태 1열–4열 · 확인대상보기", text: "SCAS 버튼 이름과 순서를 그대로 둡니다. 확인대상보기 옆에 지금 고른 개수(3)를 붙였습니다.", src: "5613 07:22" },
      { n: 2, kind: "better", title: "현장 족적 고정 + 원본/이진화", text: "왼쪽 현장 족적은 결과를 넘겨도 움직이지 않습니다. AI 창에만 있던 「이진화 이미지」 전환을 원본/이진화 버튼으로 남기고, 이미지번호·검색번호·필수 문양을 함께 보여 줍니다.", src: "5613 05:07 S7a" },
      { n: 3, kind: "better", title: "숫자 표기 하나로", text: "「1 | 49」「1 /857」「1/108」「전체 470」처럼 화면마다 달랐던 표기를 「1위 / 857건」, 유사도는 %로 통일했습니다. 페이지는 「‹ 1 / 108 ›」 한 가지입니다.", src: "5613 §3-10 카운트 표기" },
      { n: 4, kind: "plus", title: "AI 리랭킹 이동 · 일치 부위", text: "AI가 다시 줄 세우며 몇 계단 올렸는지(▲12) 청록 배지로, 상·중·하 중 어느 부위 문양이 맞았는지 초록 칩으로 보여 줍니다. 「왜 이 순위인가」를 설명하는 근거입니다.", src: "사업계획서 p3·p12 Top-k 리랭킹 · 설문 유사점 설명" },
      { n: 5, kind: "better", title: "★ 한 번으로 확인대상 · 되돌리기", text: "상세조회 팝업을 열고 알림에서 「예」를 누르던 2단계를, 카드의 별 하나로 줄였습니다. 확인 창 대신 아래쪽 「되돌리기」 알림이 잠깐 뜹니다.", src: "5613 08:52–09:20 · S10 알림" },
      { n: 6, kind: "better", title: "마우스 올리면 빠른 대조 · 두 번 누르면 편집창", text: "카드에 마우스를 올리면 현장 족적과 반씩 겹쳐 보고, 두 번 누르면 S03 편집창이 한 겹으로 열립니다. 이미지 뷰어 창을 따로 띄우지 않습니다.", src: "플랫폼 개선 사항 p1–5 결과 이미지 더블클릭 → 편집창" },
      { n: 7, kind: "better", title: "결과 거르기 · 이력 간 비교", text: "제조사·상표·화종·성별로 결과를 바로 거릅니다. 「572355와 비교」를 켜면 카드마다 이전 검색 순위(이전 13위·새로 등장)가 붙어 재검색 효과를 봅니다.", src: "플랫폼 개선 사항 p1–5 이력 간 비교" },
      { n: 8, kind: "plus", title: "확인대상 그룹 칸", text: "별을 누른 후보가 아래 칸에 모여 그룹 이름을 붙이고, 순서를 바꾸고, ✕로 제외합니다. 여기서 정밀 대조(S06)로 넘어갑니다.", src: "플랫폼 개선 사항 p1–5 확인 대상 그룹화·제외" },
      { n: 9, kind: "better", title: "보는 사람마다 다른 버튼", text: "감정관·관리자는 별을 누르고 「확인대상 저장」「검색결과 확인」으로 넘어갑니다. 검증자는 별이 잠긴 채 「검증 메모」만, 수사관은 결과 열람만 합니다." },
    ],
  });
})();
