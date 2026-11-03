/* S04 문양 코딩·검색 조건 — SCAS 「문양 상세보기」 팝업 + 「ShoePrintROI」·「인공지능 문양 상세 보기」 다크 창
   (IMG_5613 01:50, 03:37–04:52, 05:22–06:00, 07:07, 21:37–22:52 · IMG_5616 S3' 0:30–2:45) */
(function () {
  const { pin, apin, sole, picon } = M;

  /* 밑창 실루엣(core.js M.sole 과 같은 좌표계 0 0 100 264) — ROI 윤곽 표시용 */
  const SOLE_D =
    "M50 6C78 6 92 32 92 72C92 112 80 132 78 152C76 176 84 202 82 226C80 250 64 258 50 258C36 258 20 250 18 226C16 202 24 176 22 152C20 132 8 112 8 72C8 32 22 6 50 6Z";

  /* 현장 이미지 문양 행: ai=신뢰도(%) 또는 0(수동), c=개수, req=필수, w=가중치 */
  const ROWS = [
    { z: "상", on: true, items: [{ p: "n32_04", ai: 92, c: "9", req: 1, w: "1.5" }, { p: "n51_03", ai: 81, c: "1", w: "1.0" }, { p: "n21_03", ai: 0, c: "2", w: "1.0" }] },
    { z: "중", items: [{ p: "n32_04", ai: 88, c: "9", req: 1, w: "1.5" }, { p: "n31_02", ai: 64, c: "3", w: "1.0" }] },
    { z: "하", items: [{ p: "n32_04", ai: 90, c: "8", req: 1, w: "1.5" }, { p: "n73_01", ai: 71, c: "2", w: "1.0" }] },
    { z: "윤곽", items: [{ p: "s10c", ai: 77, c: "1", w: "1.0" }] },
  ];
  const RECENT = ["n32_04", "n51_03", "n21_03", "n73_01", "s10c"];
  const TABS = ["윤곽", "면", "내부선", "삼각", "사각", "다각", "원", "항목"];
  const SUB = { 윤곽: ["윤곽"], 면: ["규칙무늬", "불규칙무늬"], 내부선: ["단선", "다선1", "다선2"], 원: ["정규형", "비정규형", "부분원"] };

  const count = (c) =>
    `<span style="display:inline-flex;align-items:center;height:20px;border:1px solid var(--line3);border-radius:6px;background:#0d1420;font-size:11px"><b style="padding:0 5px;color:var(--dim);font-weight:400">−</b><span class="num" style="min-width:22px;text-align:center;color:var(--fg)">${c}</span><b style="padding:0 5px;color:var(--dim);font-weight:400">+</b></span>`;
  const card = (it) => `<div style="display:grid;justify-items:center;gap:4px;width:84px;padding:7px 4px 6px;border:1px solid ${it.req ? "#4a1f24" : "var(--line3)"};border-radius:9px;background:var(--panel2)">
      ${picon(it.p, it.ai ? "ai" : "sel", M.PDESC[it.p] || it.p)}
      ${it.ai ? `<span class="ai-mark" style="${it.ai < 70 ? "color:var(--amber)" : ""}">AI ${it.ai}%</span>` : `<span style="color:var(--blue);font:600 10px var(--font-mono)">수동</span>`}
      ${count(it.c)}
      <span style="display:flex;gap:3px"><span class="chip ${it.req ? "red" : ""}" style="height:18px;padding:0 5px;font-size:10.5px;${it.req ? "" : "color:var(--dim)"}">필수</span><span class="chip mono" style="height:18px;padding:0 5px;font-size:10.5px">×${it.w}</span></span>
    </div>`;

  function ours() {
    const rows = ROWS.map(
      (r, i) => `<div style="display:grid;grid-template-columns:52px minmax(0,1fr);gap:10px;align-items:center;padding:8px 10px;border-radius:10px;${r.on ? "box-shadow:inset 0 0 0 1px var(--blue);background:rgba(21,34,56,.45)" : "border-bottom:1px solid var(--line2)"}">
        <div style="display:grid;gap:2px"><b style="font-size:15px">${r.z}</b><span style="color:var(--dim);font-size:10.5px">${r.items.length}개${r.on ? " · 입력 중" : ""}</span></div>
        <div class="${i === 0 ? "pinbox" : ""}" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">${i === 0 ? apin(2, "better", true) : ""}
          ${r.items.map(card).join("")}
          <div style="display:grid;place-items:center;width:84px;height:108px;border:1px dashed var(--line3);border-radius:9px;color:var(--faint);font-size:11px;text-align:center">＋<br>끌어 놓기</div>
          ${i === 0 ? `<span style="align-self:flex-start">${pin(4, "plus")}</span>` : ""}
        </div>
      </div>`
    ).join("");

    const grid = M.P.내부선.map((p) =>
      p === "n32_04"
        ? `<span style="position:relative;display:inline-block">${picon(p, "sel")}
            <div style="position:absolute;right:44px;top:-10px;z-index:3;width:262px;padding:10px 12px;border:1px solid #2b4a78;border-radius:10px;background:var(--panel3);box-shadow:0 12px 30px rgba(0,0,0,.55)">
              <div style="display:flex;gap:6px;align-items:center;margin-bottom:4px"><span class="mono" style="color:var(--blue);font-size:11px">n32_04</span><span style="color:var(--dim);font-size:11px">내부선 › 단선</span><span style="margin-left:auto;color:var(--dim);font-size:10.5px">코드 설명</span></div>
              <div style="color:var(--fg2);font-size:12px;line-height:1.5">${M.PDESC.n32_04}</div>
              <div style="display:flex;gap:4px;margin-top:8px"><button class="btn sm">상</button><button class="btn sm">중</button><button class="btn sm">하</button><button class="btn sm pri" style="margin-left:auto">상·중·하 모두</button></div>
            </div></span>`
        : picon(p, "", M.PDESC[p] || p)
    ).join("");

    const F = (l, v) => `<div class="l">${l}</div><div class="v">${v}</div>`;
    const radio = (opts, on) => `<span class="radio" style="flex-wrap:wrap;gap:2px 10px">${opts.map((o) => `<span class="${o === on ? "on" : ""}">${o}</span>`).join("")}</span>`;
    const find = (t) => `<span class="inp w100">${t}<span class="caret" style="color:var(--blue)">⌕</span></span>`;

    return M.shell(
      { active: "사건관리", tabs: ["사건관리", "00001-25-0646", "문양 코딩 · _1"], tabOn: "문양 코딩 · _1", title: "문양 코딩·검색 조건", h: 1080 },
      `<div class="page-head">
        <div><div class="crumb">족윤적 · 문양검색 · 문양 코딩</div><h3>문양 코딩·검색 조건 <span class="mono" style="font-size:16px;color:var(--mute)">00001-25-0646_1</span></h3>
          <p>수동 코딩과 AI 문양 추출을 한 화면에서 합니다. 고친 내용은 바로 저장됩니다.</p></div>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="chip green"><span class="dot"></span>자동 저장 · 17:41</span>
          <span class="chip" data-role="verifier">검증자 · 보기 전용</span>
          <span class="chip" data-role="investigator">수사관 · 진행 상태만 보기</span>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:300px minmax(0,1fr) 300px;gap:12px;align-items:start">
        <!-- 왼쪽: 현장 이미지 + ROI + 경계선 -->
        <div class="panel tc">
          <div class="panel-h"><span class="t">현장 이미지</span>
            <span class="r">${["_1", "_2", "_3"].map((n, i) => `<span class="chip ${i === 0 ? "blue" : ""} mono" style="height:20px">${n}</span>`).join("")}</span></div>
          <div class="panel-b" style="display:grid;gap:10px">
            <div class="imgbox" style="height:450px">
              ${sole({ kind: "scene", zones: ["herring", "grid", "dots"] })}
              <svg viewBox="0 0 100 264" preserveAspectRatio="xMidYMid meet" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible">
                <path d="${SOLE_D}" fill="none" stroke="#2dd4bf" stroke-width="1.1" stroke-dasharray="3 2"/>
                <line x1="-14" y1="92" x2="114" y2="92" stroke="#4a9eff" stroke-width="1"/><line x1="-14" y1="176" x2="114" y2="176" stroke="#4a9eff" stroke-width="1"/>
                <circle cx="108" cy="92" r="2.6" fill="#4a9eff"/><circle cx="108" cy="176" r="2.6" fill="#4a9eff"/>
                <text x="-12" y="50" fill="#c7cedb" font-size="9" font-weight="700">상</text><text x="-12" y="136" fill="#c7cedb" font-size="9" font-weight="700">중</text><text x="-12" y="222" fill="#c7cedb" font-size="9" font-weight="700">하</text>
                <rect x="24" y="24" width="30" height="22" fill="none" stroke="#2dd4bf" stroke-width=".8"/><rect x="30" y="110" width="34" height="24" fill="none" stroke="#2dd4bf" stroke-width=".8"/><rect x="34" y="196" width="30" height="22" fill="none" stroke="#2dd4bf" stroke-width=".8"/>
              </svg>
              <span class="cap">ROI(분석 영역) · 경계선 2개 끌어서 조정</span>
            </div>
            <div class="pinbox" style="display:flex;gap:6px" data-lock="analyst admin">${apin(3, "plus", true)}<button class="btn ai" style="flex:1;justify-content:center">✦ AI 문양 추출</button><button class="btn sm">ROI 다시</button><button class="btn sm">경계선 초기화</button></div>
            <div style="color:var(--dim);font-size:11px">모델 v3.2 · 문양 추출 F1 79.52 · 3.1초 · 청록 테두리 = AI가 넣은 문양</div>
          </div>
        </div>

        <!-- 가운데: 현장 이미지 문양 + 팔레트 -->
        <div style="display:grid;gap:12px">
          <div class="panel">
            <div class="panel-h"><span class="lbl">PATTERN CODE</span><span class="t">현장 이미지 문양</span>
              <span class="r pinbox" style="padding-right:12px">${apin(5, "better")}<button class="btn sm" data-lock="analyst admin">⇊ 상·중·하 같은 문양 한 번에</button></span></div>
            <div class="panel-b pinbox" style="display:grid;gap:4px">${apin(1, "keep", true)}
              ${rows}
              <div style="display:grid;grid-template-columns:52px minmax(0,1fr);gap:10px;align-items:center;padding:8px 10px">
                <b style="font-size:15px">문자열</b><span class="inp w100" style="color:var(--dim)">밑창에 글자·로고가 보이면 입력 (예: NIKE)</span></div>
            </div>
          </div>

          <div class="panel">
            <div class="panel-h"><span class="lbl">PALETTE</span><span class="t">문양 목록</span><span class="r" style="color:var(--dim);font-size:11px">끌어서 행에 놓거나 눌러서 「입력 중」 행에 넣기</span></div>
            <div class="panel-b pinbox" style="display:grid;gap:10px">${apin(6, "better")}
              <span class="seg" style="justify-self:start">${TABS.map((t) => `<button aria-pressed="${t === "내부선"}">${t}</button>`).join("")}</span>
              <div style="display:flex;gap:10px;align-items:center">
                <span class="seg">${SUB.내부선.map((t, i) => `<button aria-pressed="${i === 0}">${t}</button>`).join("")}</span>
                <span class="inp" style="flex:1;color:var(--dim)">⌕ 이름·설명으로 찾기 (예: 산 모양, 격자)</span>
              </div>
              <div style="display:flex;gap:6px;align-items:center"><span style="color:var(--dim);font-size:11.5px;margin-right:4px">최근 사용</span>${RECENT.map((p) => picon(p, "sm")).join("")}</div>
              <div style="display:flex;flex-wrap:wrap;gap:6px;padding-top:8px;border-top:1px solid var(--line2)">${grid}</div>
              <div style="color:var(--dim);font-size:11px">하위 탭 그대로 — 면: 규칙무늬·불규칙무늬 · 내부선: 단선·다선1·다선2 · 원: 정규형·비정규형·부분원</div>
            </div>
          </div>
        </div>

        <!-- 오른쪽: 매칭 조건 + 검색 방식 + 검색이력 -->
        <div style="display:grid;gap:12px">
          <div class="panel">
            <div class="panel-h"><span class="t">매칭 조건</span><span class="r pinbox" style="padding-right:12px">${apin(7, "keep")}</span></div>
            <div class="form" style="grid-template-columns:72px minmax(0,1fr)">
              ${F("검색구분", radio(["현장문양", "동일범", "용의자문양"], "현장문양"))}
              ${F("등록기간", `<span style="display:flex;gap:4px;align-items:center"><span class="inp mono" style="font-size:11px">2000-01-01</span>~<span class="inp mono" style="font-size:11px">2025-07-24</span></span>`)}
              ${F("제조사", find("전체"))}${F("상표", find("전체"))}${F("화종", find("운동화"))}
              ${F("성별", radio(["전체", "남", "여", "혼용"], "전체"))}
              ${F("굽유무", radio(["전체", "유", "무", "불상"], "전체"))}
              ${F("등록관서", find("전체"))}
            </div>
          </div>
          <div class="panel">
            <div class="panel-b pinbox" style="display:grid;gap:8px">${apin(8, "plus")}
              <div style="color:var(--mute);font-size:11.5px;font-weight:600">검색 방식</div>
              <span class="seg" style="justify-self:start"><button aria-pressed="false">문양 검색</button><button aria-pressed="false">이미지 검색</button><button aria-pressed="true" style="color:var(--teal)">하이브리드 +α</button></span>
              <div style="color:var(--dim);font-size:11px;line-height:1.5">문양 코드와 사진 특징을 함께 써서 순위를 매기고, AI가 다시 줄 세웁니다(리랭킹).</div>
              <div style="display:grid;grid-template-columns:1fr auto auto;gap:6px">
                <button class="btn pri" style="justify-content:center" data-lock="analyst admin">검색</button><button class="btn">다시입력</button><button class="btn">검색결과</button>
              </div>
            </div>
          </div>
          <div class="panel">
            <div class="panel-h"><span class="t">검색이력</span><span class="r"><span class="chip num" style="height:20px">3</span></span></div>
            <div style="display:grid">
              ${[["572415", "481", "현장문양검색", "07-24 17:41"], ["572414", "869", "현장문양검색", "07-24 17:29"], ["572355", "2,355", "현장문양검색", "07-23 09:42"]].map(
                ([no, n, m, d], i) => `<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 8px;padding:8px 14px;border-bottom:1px solid var(--line2);${i === 0 ? "background:var(--blue-bg)" : ""}">
                  <span><b class="mono" style="color:var(--fg)">${no}</b> <span style="color:var(--mute);font-size:12px"><span class="num">${n}</span>건</span></span><button class="btn sm ghost" style="color:var(--blue)">검색결과 ›</button>
                  <span style="grid-column:span 2;color:var(--dim);font-size:11px">${m} · <span class="num">${d}</span></span></div>`
              ).join("")}
            </div>
          </div>
        </div>
      </div>
      <div class="pinbox" style="display:inline-block;margin-top:10px;color:var(--dim);font-size:11.5px;padding-right:14px">${apin(9, "better")}보는 사람: 감정관·관리자는 코딩·검색, 검증자는 같은 화면을 보기 전용으로, 수사관은 진행 상태만 봅니다.</div>`
    );
  }

  function scas() {
    const sic = (p, n) => `<span style="display:inline-grid;justify-items:center;margin-right:4px">${picon(p, "sm")}<span style="font-size:9px;border:1px solid #bbb;padding:0 3px;background:#fff">${n} ▾</span></span>`;
    const rowsHtml = [
      ["상", sic("n32_04", 9) + sic("n51_03", 1), true],
      ["중", sic("n32_04", 9), false],
      ["하", sic("n32_04", 8), false],
      ["윤곽", "", false],
      ["문자열", "", false],
    ].map(([z, h, on]) => `<tr><td class="lbl" style="width:46px;text-align:center">${z}</td><td style="height:44px;${on ? "outline:2px solid #e02424;outline-offset:-2px" : ""}">${h}</td></tr>`).join("");
    return M.scasShell(
      { treeOn: "사건관리", h: 790 },
      `<div style="height:700px"></div>
      <div class="dim"></div>
      <div class="modal" style="left:12px;top:10px;width:1196px;height:660px">
        <div class="bar">문양 상세보기 <span style="font-weight:400"><span class="sbtn">인공지능문양관리</span> <span class="sbtn">검색결과</span> <span class="sbtn">검색</span> <span class="sbtn">다시입력</span> <span class="sbtn">닫기</span> ✕</span></div>
        <div style="display:grid;grid-template-columns:230px minmax(0,1fr) 290px;gap:8px;padding:8px">
          <div>
            <div class="bar" style="height:22px">현장 이미지</div><div class="ph" style="height:250px;background:#3a3a30;color:#c9b78a">족적 사진</div>
            <div class="bar" style="height:22px;margin-top:6px">이미지 목록</div>
            <table><thead><tr><th>이미지 번호</th></tr></thead><tbody><tr><td style="background:var(--s-yellow)">00001-25-0646_1</td></tr></tbody></table>
            <div class="bar" style="height:22px;margin-top:6px">코드 설명</div>
            <div class="box" style="padding:6px;height:60px;white-space:normal;font-size:11px">${M.PDESC.n32_04}</div>
          </div>
          <div>
            <div class="bar" style="height:22px">현장 이미지 문양</div>
            <table><tbody>${rowsHtml}</tbody></table>
            <div class="bar" style="height:24px;margin-top:6px;justify-content:flex-start;gap:12px;font-weight:400">${TABS.map((t) => `<span style="${t === "면" ? "background:#fff;color:#2d3a8c;padding:0 6px;font-weight:700" : ""}">${t}</span>`).join("")}</div>
            <div class="box" style="display:flex;flex-wrap:wrap;gap:3px;padding:6px"><span class="ph" style="width:28px;height:28px;font-weight:700;color:#555">?</span>${M.P.면.slice(1).concat(M.P.사각.slice(1, 9)).map((p) => picon(p, "sm")).join("")}</div>
            <div style="display:flex;gap:6px;padding:4px;background:#e9ecf3"><span class="sbtn">규칙무늬</span><span class="sbtn">불규칙무늬</span></div>
          </div>
          <div>
            <div class="bar" style="height:22px">매칭 조건</div>
            <table><tbody>
              <tr><td class="lbl">검색구분</td><td>◉현장문양 ○동일범 ○ ○용의자문양</td></tr>
              <tr><td class="lbl">등록기간</td><td>2000-01-01 📅 ~ 2025-07-24 📅</td></tr>
              <tr><td class="lbl">제조사</td><td><span class="sbtn b">찾기</span></td></tr>
              <tr><td class="lbl">상표</td><td><span class="sbtn b">찾기</span></td></tr>
              <tr><td class="lbl">화종</td><td><span class="sbtn b">찾기</span></td></tr>
              <tr><td class="lbl">성별</td><td>◉전체 ○남 ○여 ○혼용</td></tr>
              <tr><td class="lbl">굽유무</td><td>◉전체 ○유 ○무 ○불상</td></tr>
              <tr><td class="lbl">등록관서</td><td><span class="sbtn b">찾기</span></td></tr>
            </tbody></table>
            <div class="bar" style="height:22px;margin-top:6px">검색이력</div>
            <table><thead><tr><th>검색번호</th><th>결과건수</th><th>검색방법</th><th>검색결과</th><th>검색일</th></tr></thead><tbody>
              <tr><td>572415</td><td>481</td><td>현장문양검색</td><td>검색</td><td>2025-07…</td></tr>
              <tr><td>572414</td><td>869</td><td>현장문양검색</td><td>검색</td><td>2025-07…</td></tr></tbody></table>
          </div>
        </div>
      </div>
      <div class="darkwin" style="left:760px;top:250px;width:300px;height:250px">
        <div class="tt">ShoePrintROI - Chrome</div>
        <div style="position:relative;height:190px;margin:6px;background:#000">
          <svg viewBox="0 0 100 264" style="position:absolute;inset:0;width:100%;height:100%"><path d="${SOLE_D}" fill="none" stroke="#3fd16b" stroke-width="2"/><rect x="6" y="4" width="88" height="256" fill="none" stroke="#4a7dff" stroke-width="1.2"/></svg></div>
        <div style="text-align:center"><span class="sbtn b">인공지능 분석 시작</span></div>
      </div>
      <div class="darkwin" style="left:860px;top:330px;width:350px;height:330px">
        <div class="tt">인공지능 문양 상세 보기 - Chrome</div>
        <div style="display:grid;grid-template-columns:110px 1fr;gap:6px;padding:6px">
          <div><div style="font-size:10px">(현장) 이미지 <span class="sbtn">AI 분석🔍</span></div><div class="ph" style="height:170px;background:#111;color:#666;position:relative">사진<span style="position:absolute;left:4px;bottom:2px;color:#fff;font-size:20px;font-weight:700">100%</span></div></div>
          <div style="font-size:10px">현장 이미지 문양
            ${["상", "중", "하"].map((z) => `<div style="display:flex;gap:3px;align-items:center;margin-top:4px">${z} ${picon("n32_04", "sm")}${picon("n51_03", "sm")}${picon("n21_03", "sm")}</div>`).join("")}
            <div style="margin-top:6px;color:#aaa">면 · 내부선 · 삼각 · 사각 · 다각 · 원 · 항목</div></div>
        </div>
        <div style="position:absolute;right:8px;bottom:8px"><span class="sbtn">검색이력 저장</span> <span class="sbtn b">검색결과 보기</span></div>
      </div>
      ${M.pain(260, 610, "<b>아이콘 사냥</b> — 탭 8개 × 하위 탭 × 수십 개, 약 30px 아이콘을 눈으로 찾음. 같은 문양을 상·중·하에 따로 3번 입력 (5613 05:22–06:00 · 5616 0:30–2:45)", 300)}
      ${M.pain(560, 60, "<b>개수는 드롭다운</b> — 아이콘마다 0~9·10이상을 일일이 펼쳐 고름 (5613 05:52)", 230)}
      ${M.pain(470, 470, "<b>AI는 따로 뜨는 다크 창 2개</b> — ROI 지정 창 → 문양 상세 보기 창, 본 화면과 테마·위치가 따로 놂 (5613 03:52–04:52)", 260)}`
    );
  }

  M.add({
    id: "s04",
    code: "S04",
    group: "문양검색",
    title: "문양 코딩·검색 조건",
    refs: [
      { t: "SCAS 문양 상세보기", v: "5613 05:22–06:00 · 21:37" },
      { t: "SCAS ShoePrintROI · 인공지능 문양 상세 보기", v: "5613 03:52–04:52" },
      { t: "SCAS 문양정보 탭", v: "5616 0:30–2:45" },
    ],
    lead: "수동 코딩 팝업과 따로 뜨던 AI 다크 창 2개를 한 화면으로 합쳤습니다. 상·중·하·윤곽·문자열 행과 팔레트 탭 8개, 매칭 조건, 검색이력은 SCAS 그대로 두고, AI가 먼저 채운 문양을 감정관이 고치는 순서로 바꿨습니다.",
    scas,
    ours,
    notes: [
      { n: 1, kind: "keep", title: "상·중·하·윤곽·문자열 행 그대로", text: "SCAS 「현장 이미지 문양」의 다섯 행과 「입력 중인 행」 표시를 그대로 둡니다(SCAS의 빨간 테두리는 「필수」와 헷갈리지 않게 파란 테두리로).", src: "5613 S4" },
      { n: 2, kind: "better", title: "개수 드롭다운 → − 9 + 버튼", text: "0~9·10이상 값은 그대로이고, 펼쳐 고르는 대신 −/+를 누르거나 숫자를 바로 칩니다.", src: "5613 05:52" },
      { n: 3, kind: "plus", title: "AI 문양 추출을 같은 화면에서", text: "ROI(분석 영역)와 상·중·하 경계선을 왼쪽 그림에서 바로 맞추고 「AI 문양 추출」을 누르면 행이 채워집니다. AI가 넣은 문양은 청록 테두리와 신뢰도(%)가 붙고, 70% 미만은 주황으로 다시 보게 합니다. SCAS의 「인공지능문양관리」 버튼과 다크 창 2개를 대신합니다.", src: "사업계획서 p5 문양 자동 추출 F1 79.52 · 5613 03:52–04:52" },
      { n: 4, kind: "plus", title: "필수(빨강)·가중치", text: "문양마다 「필수」를 켜면 그 문양이 없는 신발은 결과에서 빠지고, 가중치(×1.5 등)로 중요한 문양에 점수를 더 줍니다.", src: "플랫폼 개선 사항 p3–4 수동 삽입·삭제·가중치·필수" },
      { n: 5, kind: "better", title: "상·중·하 같은 문양 한 번에", text: "헤링본처럼 밑창 전체가 같은 무늬면 한 번 눌러 세 행에 모두 넣습니다. 팔레트 설명창의 「상·중·하 모두」도 같은 기능입니다.", src: "5616 0:30–2:45 같은 아이콘 3번 반복" },
      { n: 6, kind: "better", title: "팔레트 찾기 · 최근 사용 · 옆에 뜨는 코드 설명", text: "윤곽·면·내부선·삼각·사각·다각·원·항목 8개 탭과 하위 탭(규칙무늬/불규칙무늬, 단선/다선1/다선2, 정규형/비정규형/부분원)은 그대로 두고, 이름·설명 검색과 최근 사용 줄을 더했습니다. 코드 설명은 왼쪽 아래가 아니라 마우스를 올린 아이콘 바로 옆에 뜹니다.", src: "5614 S3 코드 설명 시선 이동 · 설문 코딩 부담" },
      { n: 7, kind: "keep", title: "매칭 조건·검색이력·버튼 그대로", text: "검색구분(현장문양/동일범/용의자문양)·등록기간·제조사·상표·화종·성별·굽유무·등록관서와 검색이력(검색번호·결과건수·검색방법·검색일), 「검색」「다시입력」「검색결과」를 그대로 둡니다. 「찾기」 팝업은 입력하면 바로 목록이 뜨는 칸으로 바꿨고, 「저장되었습니다」 알림은 자동 저장 표시로 대신합니다.", src: "5613 07:07" },
      { n: 8, kind: "plus", title: "검색 방식: 문양 / 이미지 / 하이브리드", text: "문양 코드만, 사진만, 둘을 함께 쓰는 하이브리드 중에서 고릅니다. 하이브리드는 AI가 순위를 다시 매깁니다(리랭킹).", src: "사업계획서 p3·p12 · 발표 s10" },
      { n: 9, kind: "better", title: "보는 사람마다 다른 권한", text: "감정관·관리자만 AI 추출·일괄 입력·검색을 누를 수 있습니다. 검증자는 같은 코딩을 보기 전용으로 보고, 수사관은 진행 상태만 봅니다." },
    ],
  });
})();
