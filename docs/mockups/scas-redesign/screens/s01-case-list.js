/* S01 사건관리 목록 — SCAS 「족윤적 > 사건관리 > 사건관리」 탭 (IMG_5613 02:00, 10:00–11:45, 16:37–17:15, 19:45–20:30)
   r2: SCAS 검색 폼·툴바·열 순서를 그대로 되돌리고, 진행상태·결과를 「이미지 장수 카운트」로 바로잡음(인터뷰 5613 10:00). */
(function () {
  const { pin, apin, sole } = M;

  /* sh/ti = 신발·타이어 파일 수, st = [등록, 검색, 확인] 장수, rs = [발견, 불발, 불능] 장수,
     cs = 사건 층 단계(-1 없음, 0 검증요청, 1 교차 검증, 2 감정서, 3 결재, 4 결재완료), src = 들어온 길 */
  const CASES = [
    { no: "00001-25-0649", doc: "SCAS수사부-871", nm: "주거침입", req: "대구청", sc: "2025-03321", occ: "동부서", kind: "현장", sh: 12, ti: 0, sus: "무", reg: "2025-07-24", st: [9, 2, 1], rs: [1, 0, 0], cs: -1, src: "auto" },
    { no: "00001-25-0647", doc: "SCAS수사부-2951", nm: "절도", req: "경북청", sc: "2025-11707", occ: "포항남부서", kind: "현장", sh: 2, ti: 0, sus: "무", reg: "2025-07-24", st: [0, 2, 0], rs: [0, 0, 0], cs: -1, src: "auto" },
    { no: "00001-25-0646", doc: "SCAS수사부-2944", nm: "주거침입", req: "대구청", sc: "2025-03318", occ: "수성서", kind: "현장", sh: 3, ti: 0, sus: "유", reg: "2025-07-23", st: [0, 0, 3], rs: [1, 1, 1], cs: 1, who: "김○○", src: "auto" },
    { no: "00001-25-0640", doc: "SCAS수사부-2911", nm: "절도", req: "부산청", sc: "2025-09120", occ: "해운대서", kind: "대조", sh: 1, ti: 0, sus: "유", reg: "2025-07-22", st: [0, 0, 1], rs: [1, 0, 0], cs: 2, src: "auto" },
    { no: "00001-25-0633", doc: "SCAS수사부-2870", nm: "강도", req: "서울청", sc: "2025-20114", occ: "강서서", kind: "현장", sh: 4, ti: 0, sus: "무", reg: "2025-07-21", st: [0, 0, 4], rs: [0, 3, 1], cs: 3, src: "auto" },
    { no: "00001-25-0621", doc: "SCAS수사부-2802", nm: "기타", req: "경기남부청", sc: "2025-07731", occ: "화성동탄서", kind: "현장", sh: 1, ti: 1, sus: "무", reg: "2025-07-18", st: [0, 0, 2], rs: [0, 0, 2], cs: 4, src: "auto" },
    { no: "00001-25-0612", doc: "—", nm: "절도", req: "인천청", sc: "—", occ: "미추홀서", kind: "현장", sh: 2, ti: 0, sus: "유", reg: "2025-07-16", st: [0, 0, 2], rs: [2, 0, 0], cs: 4, src: "manual" },
  ];
  const CS = ["검증요청", "교차 검증", "감정서", "결재", "결재완료"];
  const TD = (h, x = "") => `<td style="padding:0 6px;${x}">${h}</td>`;
  const TH = (h, x = "") => `<th style="padding:4px 6px;height:auto;line-height:1.25;${x}">${h}</th>`;
  const n0 = (v) => (v ? `<b style="color:var(--fg)">${v}</b>` : `<span style="color:var(--faint)">0</span>`);

  /* 결과: 발견·불발·불능 장수 */
  const resCell = (c) => {
    const [a, b, d] = c.rs;
    return `<div class="num" style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px;font-size:11.5px;text-align:center">
      <span style="color:${a ? "#4ade80" : "var(--faint)"}">${a}</span><span style="color:${b ? "var(--fg2)" : "var(--faint)"}">${b}</span><span style="color:${d ? "var(--amber)" : "var(--faint)"}">${d}</span></div>`;
  };
  /* 진행상태: 등록·검색·확인 장수 + 장마다 한 칸짜리 막대 */
  const stCell = (c) => {
    const tot = c.sh + c.ti;
    const cells = [].concat(Array(c.st[2]).fill("var(--blue2)"), Array(c.st[1]).fill("var(--amber)"), Array(c.st[0]).fill("var(--line3)"));
    return `<div style="display:grid;gap:3px">
      <div class="num" style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px;font-size:11.5px;text-align:center"><span>${n0(c.st[0])}</span><span>${n0(c.st[1])}</span><span>${n0(c.st[2])}</span></div>
      <div style="display:flex;gap:2px" title="${tot}장 중 등록 ${c.st[0]} · 검색 ${c.st[1]} · 확인 ${c.st[2]}">${cells.map((col) => `<i style="flex:1;height:4px;border-radius:2px;background:${col}"></i>`).join("")}</div></div>`;
  };
  /* 사건 층: 검증요청 → 교차 검증 → 감정서 → 결재 */
  const csCell = (c) => {
    if (c.cs < 0) return `<span style="color:var(--faint);font-size:11px">이미지 확인 중</span>`;
    return `<div style="display:grid;gap:3px"><span class="stepper">${[0, 1, 2, 3].map((i) => `<i style="width:20px" class="${i < c.cs ? "done" : i === c.cs ? "now" : ""}"></i>`).join("")}</span>
      <span style="font-size:11px;color:${c.cs === 4 ? "#4ade80" : "var(--fg2)"};line-height:1.2">${CS[Math.min(c.cs, 4)]}${c.cs === 1 && c.who ? ` · ${c.who}` : ""}</span></div>`;
  };
  /* SCAS 행 버튼 자리(검색 · 확인 · 검증) 그대로 */
  const actCell = (c) => {
    const s = c.st[0] > 0 ? `<button class="btn sm ok" style="padding:0 6px" data-role="analyst admin" data-part="Button" data-part-variant="sm-ok-row"${c === CASES[0] ? ' data-part-id="S01-04"' : ""}>검색</button>` : `<span style="display:inline-block;width:36px"></span>`;
    const k = c.st[1] > 0 || (c.st[2] > 0 && c.cs < 0) ? `<button class="btn sm ok" style="padding:0 6px" data-role="analyst admin" data-part="Button" data-part-variant="sm-ok-row">확인</button>` : `<span style="display:inline-block;width:36px"></span>`;
    const v = c.cs === 0 || (c.st[0] === 0 && c.st[1] === 0 && c.cs < 0) ? `<button class="btn sm" style="padding:0 6px;color:#a5b4fc;border-color:#3b3f7a" data-role="analyst admin" data-part="Button" data-part-variant="sm-indigo-row">검증요청</button>` : c.cs === 1 ? `<button class="btn sm warn" style="padding:0 6px" data-role="analyst admin" data-part="Button" data-part-variant="sm-warn-row"${c === CASES[2] ? ' data-part-id="S01-06"' : ""} title="다른 감정관(교차 검증자)에게만 보임">검증</button>` : "";
    return `<span style="display:inline-flex;gap:4px;align-items:center">${s}${k}${v}</span>`;
  };

  function ours() {
    const rows = CASES.map(
      (c, i) => `<tr class="${i === 2 ? "sel" : i === 0 ? "fx-new" : ""}">
        ${TD(`<span class="num" style="color:var(--dim)">${i + 1}</span>`)}
        ${TD(`<span style="position:relative;display:inline-block;width:40px;height:40px;vertical-align:middle"><span style="position:relative;display:block;width:${c.sh + c.ti > 1 ? 34 : 26}px;height:40px">
            ${c.sh + c.ti > 1 ? `<span class="imgbox" style="position:absolute;left:8px;top:0;width:26px;height:38px;border-radius:5px;opacity:.55">${sole({ kind: "bin", zones: ["grid", "dots", "lines"] })}</span>` : ""}
            <span class="imgbox" style="position:absolute;left:0;top:2px;width:26px;height:38px;border-radius:5px;box-shadow:2px 0 6px rgba(0,0,0,.6)">${sole({ kind: "scene", zones: ["dots", "grid", "herring"] })}${i === 0 ? `<span class="fx-scan"></span>` : ""}</span></span>
          ${i === 0 ? `<span class="ai-tag" data-role="analyst admin" data-part="AiTag" data-part-variant="progress" data-part-id="S01-17" style="position:absolute;left:4px;bottom:-5px;height:15px;padding:0 4px;font-size:9px;background:#0b2a26;box-shadow:0 2px 6px rgba(0,0,0,.6)"><span class="fx-live" style="width:5px;height:5px"></span>7/12</span>` : `<span class="ai-tag" data-role="analyst admin" data-part="AiTag" data-part-variant="done"${i === 1 ? ' data-part-id="S01-18"' : ""} style="position:absolute;left:12px;bottom:-5px;height:15px;padding:0 4px;font-size:9px;background:#0b2a26">AI✓</span>`}</span>`)}
        ${TD(`<div class="mono" style="color:var(--fg);line-height:1.3;font-size:12px">${c.no}</div><div style="line-height:1.3;font-size:10.5px;color:var(--dim)">${c.src === "auto" ? `<span style="color:var(--blue)">● 공문 자동</span>` : `<span style="color:var(--violet)">● 임의 등록</span>`}</div>`)}
        ${TD(`<span class="mono" style="font-size:11.5px">${c.doc}</span>`)}
        ${TD(c.nm)}
        ${TD(`<div style="line-height:1.3">${c.req}</div><div class="mono" style="font-size:10.5px;color:var(--dim);line-height:1.3">${c.sc}</div>`)}
        ${TD(c.occ)}
        ${TD(c.kind === "대조" ? `<span class="chip violet" data-part="Chip" data-part-variant="violet-h20"${c === CASES[3] ? ' data-part-id="S01-07"' : ""} style="height:20px;padding:0 6px">대조</span>` : "현장")}
        ${TD(`<span class="num"><b style="color:var(--fg)">${c.sh + c.ti}</b> <span style="color:var(--dim)">(${c.sh}, ${c.ti})</span></span>`)}
        ${TD(c.sus === "유" ? `<span style="color:#f87171">유</span>` : "무")}
        ${TD(`<span class="num" style="font-size:12px">${c.reg}</span>`)}
        ${TD(resCell(c))}
        ${TD(stCell(c))}
        ${TD(actCell(c))}
        ${TD(csCell(c), "background:rgba(15,38,36,.18)")}
      </tr>
      ${i === 2 ? `<tr><td colspan="15" style="height:auto;padding:0;background:var(--panel2)">
        <div class="pinbox" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) 260px;gap:10px;padding:10px 12px 12px 48px;white-space:normal">${apin(10, "better", true)}
          ${[["_1", "발견", "572420", "2 / 500", "305659", "60.8"], ["_2", "불발견", "572356", "0 / 1,204", "", ""], ["_3", "감정불능", "—", "검색 안 함", "", ""]].map(
            ([n, r, sn, cnt, top, sim], k) => {
              const z = [["dots", "grid", "herring"], ["tri", "wave", "blocks"], ["grid", "grid", "lines"]][k];
              const found = r === "발견";
              return `<div style="display:grid;gap:7px;padding:8px 9px;border:1px solid ${found ? "#1f4a2f" : "var(--line)"};border-radius:10px;background:linear-gradient(160deg,var(--panel),var(--panel2))">
              <div style="display:flex;align-items:center;gap:6px;font-size:11.5px"><b class="mono">${n}</b><span class="chip ${found ? "green" : ""}" data-part="Chip" data-part-variant="${found ? "green-h18" : "h18"}"${k < 2 ? ` data-part-id="${found ? "S01-08" : "S01-09"}"` : ""} style="height:18px;padding:0 6px;font-size:10px">${r}</span><span class="mono" style="margin-left:auto;color:var(--dim);font-size:10px">검색 ${sn}</span></div>
              <div style="display:flex;align-items:center;gap:5px">
                <span class="imgbox" data-part="SoleThumb" data-part-variant="md"${k === 0 ? ' data-part-id="S01-31"' : ""} style="width:30px;height:44px;border-radius:5px;flex:none">${sole({ kind: "scene", zones: z })}</span>
                <span style="color:var(--dim);font:600 10px var(--font-mono)">›</span>
                <span class="imgbox" style="width:30px;height:44px;border-radius:5px;flex:none;background:#fff">${sole({ kind: "bin", zones: z })}</span>
                <span style="color:var(--dim);font:600 10px var(--font-mono)">›</span>
                ${found ? `<span class="imgbox" style="width:30px;height:44px;border-radius:5px;flex:none;border-color:#1d4a44">${sole({ kind: "shoe", zones: z, heat: true })}</span>
                <span style="display:grid;line-height:1.3;font-size:10.5px;min-width:0"><b class="mono" style="color:var(--teal)">${top}</b><span class="mono" style="color:var(--mute)">${sim}</span><span style="color:var(--dim)">확인대상 ${cnt}</span></span>`
                : `<span style="display:grid;place-items:center;width:30px;height:44px;border:1px dashed var(--line3);border-radius:5px;color:var(--faint);font-size:10px">—</span><span style="display:grid;line-height:1.3;font-size:10.5px"><span style="color:var(--mute)">${r === "감정불능" ? "족적 30%만 남음" : "끝까지 봄"}</span><span style="color:var(--dim)">${r === "감정불능" ? cnt : `확인대상 ${cnt}`}</span></span>`}
              </div></div>`;
            }
          ).join("")}
          <div style="display:grid;gap:4px;font-size:11.5px;color:var(--mute);line-height:1.4">
            <span>07-24 17:35 결과확인완료 → <b style="color:var(--fg2)">검증요청</b></span>
            <span>교차 검증: <b style="color:var(--amber)">김○○ 경위</b> (다른 감정관, 대기)</span>
            <span style="display:flex;gap:6px;margin-top:2px"><button class="btn sm" data-part="Button" data-part-variant="sm">사건 열기 (S02)</button><button class="btn sm" data-role="analyst admin" data-part="Button" data-part-variant="sm">검색결과 확인</button></span>
          </div>
        </div></td></tr>` : ""}`
    ).join("");

    const F = (l, v) => `<div class="l">${l}</div><div class="v">${v}</div>`;
    const sel = (t, id = "") => `<span class="inp w100" data-part="Field" data-part-variant="select"${id ? ` data-part-id="${id}"` : ""}>${t}<span class="caret">▾</span></span>`;
    const find = (t, id = "") => `<span style="display:flex;gap:4px"><span class="inp w100" data-part="Field" data-part-variant="text">${t}</span><button class="btn sm" data-part="Button" data-part-variant="sm-h26"${id ? ` data-part-id="${id}"` : ""} style="height:26px">검색</button></span>`;

    return M.shell(
      { active: "사건관리", tabs: ["사건관리", "시험품질경영절차서", "감정서작성", "족윤적 검증", "결재 대기함", "문서접수대장"], title: "사건관리", h: 1000, partIds: { inp: "S01-19", chip: "S01-20", avatar: "S01-73" } },
      `<div class="panel pinbox" data-part="Panel" data-part-variant="default" data-part-id="S01-14" style="margin-bottom:12px">${apin(1, "keep", true)}
        <div class="form" style="grid-template-columns:84px minmax(0,1fr) 84px minmax(0,1fr) 84px minmax(0,1fr);border-top:0">
          ${F("감정번호", `<span class="inp w100 mono" data-part="Field" data-part-variant="mono" data-part-id="S01-12">00001-25-</span>`)}${F("문서번호", `<span class="inp w100" data-part="Field" data-part-variant="text" data-part-id="S01-11"></span>`)}${F("사건명", sel("전체", "S01-10"))}
          ${F("등록일자", `<span class="inp w100 mono" data-part="Field" data-part-variant="mono-sm" data-part-id="S01-13" style="font-size:11.5px">2025-06-25 ~ 2025-07-24</span>`)}${F("피해자", `<span class="inp w100" data-part="Field" data-part-variant="text"></span>`)}${F("구분", `<span class="radio"><span class="on">전체</span><span>신발</span><span>타이어</span></span>`)}
          ${F("사건장소", `<span class="inp w100" data-part="Field" data-part-variant="text"></span>`)}${F("검거여부", sel("전체"))}${F("작성자", `<span class="inp w100" data-part="Field" data-part-variant="text"></span>`)}
          ${F("처리관서", find("경찰청", "S01-03"))}${F("의뢰관서", find(""))}${F("발생관서", find(""))}
          ${F("사건결과", `<span style="display:flex;gap:8px;align-items:center">${sel("전체")}<span style="white-space:nowrap;color:var(--mute);font-size:12px">☐ 결과 확인 전</span></span>`)}${F("타기관여부", sel("전체"))}<div class="l"></div><div class="v"></div>
        </div>
        <div class="pinbox" style="display:flex;gap:10px;padding:12px 14px;border-top:1px solid var(--line2)">${apin(12, "plus", true)}
          <div class="stat" data-role="analyst admin" style="flex:1.8;min-width:0;--glow:rgba(45,212,191,.2);border-color:#1d4a44">
            <span style="display:flex;align-items:center;gap:7px"><span class="fx-live" data-part="LiveDot" data-part-variant="busy" data-part-id="S01-21"></span><b style="font-size:12px;color:var(--teal)">AI 사전 처리</b><span class="mono" style="margin-left:auto;color:var(--dim);font-size:10.5px">09:12 공문 접수</span></span>
            <span style="display:flex;align-items:baseline;gap:8px"><span class="v">00001-25-0649</span><span class="k">12장</span></span>
            <span class="fx-bar run" data-part="AiProgress" data-part-variant="running" data-part-id="S01-22"><i style="width:62%"></i></span>
            <span class="s">이진화 12/12 · 문양 제안 9/12 · 검색 Top-10 준비 7/12 — 감정관이 열기 전에 미리</span>
          </div>
          <div class="stat" style="flex:1;min-width:0"><span class="k">결과 확인 전</span><span class="v">14<small style="font:500 11px var(--font-ui);color:var(--dim)"> 건</small></span><span class="fx-bar" data-part="AiProgress" data-part-variant="done" data-part-id="S01-23"><i style="width:58%"></i></span><span class="s">이미지 98장 중 확인 57장</span></div>
          <div class="stat" data-role="analyst admin" style="flex:1;min-width:0;--glow:rgba(74,158,255,.18)"><span class="k">이미지 미검색</span><span class="v">9<small style="font:500 11px var(--font-ui);color:var(--dim)"> 장</small></span><span class="fx-bar"><i style="width:78%"></i></span><span class="s">AI Top-10 준비 7 · 대기 2</span></div>
          <div class="stat" data-role="analyst admin" style="flex:1;min-width:0;--glow:rgba(245,158,11,.2);border-color:#4d3a12"><span class="k" style="color:var(--amber)">교차 검증 요청 받음</span><span class="v">1<small style="font:500 11px var(--font-ui);color:var(--dim)"> 건</small></span><span class="s">00001-25-0646 · 김○○ → 나</span></div>
          <div class="stat" data-role="verifier admin" style="flex:1;min-width:0"><span class="k">결재 대기</span><span class="v">3<small style="font:500 11px var(--font-ui);color:var(--dim)"> 건</small></span><span class="s">가장 오래된 것 2일</span></div>
          <div class="stat" data-role="investigator" style="flex:1;min-width:0"><span class="k">우리 청 의뢰</span><span class="v">22<small style="font:500 11px var(--font-ui);color:var(--dim)"> 건</small></span><span class="s">진행 중 6 · 결재완료 16</span></div>
        </div>
      </div>

      <div class="panel tc" data-part="Panel" data-part-variant="tc" data-part-id="S01-15">
        <div class="panel-h">
          <span class="t">사건관리 목록</span><span style="color:var(--dim);font-size:12px">전체 116건</span><span style="display:inline-flex;align-items:center;gap:5px;color:var(--dim);font-size:11px"><span class="fx-live" style="width:6px;height:6px"></span>실시간 · <span class="mono">09:12</span> 갱신</span>
          <span class="r pinbox" data-part="ButtonBar" data-part-variant="panel-head" data-part-id="S01-16" style="padding-left:14px">${apin(2, "keep", true)}
            <span class="radio" data-part="RadioRow" data-part-id="S01-76" style="font-size:12px;margin-right:6px"><span class="on">목록보기</span><span>문양보기</span></span>
            <button class="btn sm" data-part="Button" data-part-variant="sm" data-part-id="S01-01">초기화</button><button class="btn sm" data-part="Button" data-part-variant="sm">엑셀</button><button class="btn sm" data-part="Button" data-part-variant="sm">조회</button>
            <button class="btn sm pri pinbox" data-role="investigator analyst admin" data-part="Button" data-part-variant="sm-pri" data-part-id="S01-02">등록${apin(3, "voice")}</button>
            <span style="width:1px;height:20px;background:var(--line)"></span>
            <span class="seg pinbox" data-part="Segmented" data-part-id="S01-71">${apin(5, "better")}<button aria-pressed="true">기본 보기 15열</button><button aria-pressed="false">SCAS 열 전체 보기 25열</button></span>
          </span>
        </div>
        <div>
          <table class="grid" style="font-size:12px">
            <thead><tr>
              ${TH("순번")}${TH("이미지")}${TH(`감정번호 ${pin(4, "voice")}`)}${TH("문서번호")}${TH("사건명")}${TH("의뢰관서<br>(SCAS번호)")}${TH("발생관서")}${TH("처리<br>구분")}
              ${TH(`개수 ${pin(7, "voice")}<br><span style="font-weight:400;color:var(--dim)">(신발, 타이어)</span>`)}${TH("용의자")}${TH("등록일자")}
              ${TH(`결과 · 장<div class="num" style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px;font-weight:400;color:var(--dim);text-align:center;margin-top:2px"><span>발견</span><span>불발</span><span>불능</span></div>`, "width:96px")}
              ${TH(`진행상태 · 장 ${pin(6, "voice")}<div class="num" style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px;font-weight:400;color:var(--dim);text-align:center;margin-top:2px"><span>등록</span><span>검색</span><span>확인</span></div>`, "width:110px")}
              ${TH("검색 · 확인 · 검증")}
              ${TH(`<span style="color:var(--teal)">＋사건 진행</span> ${pin(8, "better")}<br><span style="font-weight:400;color:var(--dim)">검증요청→교차 검증→감정서→결재</span>`, "width:118px;white-space:normal")}
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div style="display:flex;justify-content:space-between;padding:10px 14px;color:var(--mute);font-size:12px"><span class="num">« ‹ 페이지 1 / 9 › » ⟳</span><span class="num">전체 116 중 1 – 14</span></div>
      </div>
      <div class="pinbox" style="display:inline-block;margin-top:10px;padding-right:14px;color:var(--dim);font-size:11.5px">${apin(9, "voice")}처리 구분 「현장」 = DB 검색, 「대조」 = 용의자 신발과 1:1 비교. 숨긴 열(처리관서·결과확인 완료일자·사건 결과·접수자·작성자)은 「SCAS 열 전체 보기」에서 원래 자리로 돌아옵니다.</div>
      <div class="pinbox" style="display:inline-block;margin:6px 0 0 18px;padding-right:14px;color:var(--dim);font-size:11.5px">${apin(11, "better")}보는 사람: 감정관은 검색·확인·검증요청, 기술책임자는 「결재 대기」, 수사관은 우리 청 의뢰를 봅니다.</div>`
    );
  }

  function scas() {
    const cols = ["순번", "이미지", "감정번호", "문서번호", "사건명", "의뢰관서 (SCAS번호)", "처리관서", "발생관서", "처리 구분", "개수", "용의자", "등록일자", "결과확인 완료일자", "사건 결과", "접수자", "작성자", "발/견", "불/발", "불/능", "등/록", "검/색", "확/인", "검색", "확인", "검증"];
    const v = (x) => (x ? x : "");
    const row = (c, i) =>
      `<tr><td>${i + 1}</td><td><span class="ph" style="display:block;width:18px;height:24px"></span></td><td>${c.no}</td><td>${c.doc}</td><td>${c.nm}</td><td>${c.req} ${c.sc}</td><td>경찰청 범죄분석과</td><td>${c.occ}</td><td>${c.kind}</td><td>${c.sh + c.ti} (${c.sh}, ${c.ti})</td><td>${c.sus}</td><td>${c.reg}</td><td></td><td></td><td></td><td>박○○ ▾</td><td>${v(c.rs[0])}</td><td>${v(c.rs[1])}</td><td>${v(c.rs[2])}</td><td>${v(c.st[0])}</td><td>${v(c.st[1])}</td><td>${v(c.st[2])}</td><td>${c.st[0] ? '<span class="sbtn g">검색</span>' : ""}</td><td>${c.st[1] || c.st[2] ? '<span class="sbtn g">확인</span>' : ""}</td><td>${c.cs === 0 || (c.st[2] && c.cs < 0) ? '<span class="sbtn n">검증요청</span>' : ""}</td></tr>`;
    return M.scasShell(
      { treeOn: "사건관리", h: 700 },
      `<div class="box" style="padding:8px;margin-bottom:8px">
        <table><tbody>
          <tr><td class="lbl">감정번호</td><td><span class="ph" style="height:16px"></span></td><td class="lbl">문서번호</td><td></td><td class="lbl">사건명</td><td>전체 ▾</td></tr>
          <tr><td class="lbl">등록일자</td><td>2025-06-25 📅 ~ 2025-07-24 📅</td><td class="lbl">피해자</td><td></td><td class="lbl">구분</td><td>◉전체 ○신발 ○타이어</td></tr>
          <tr><td class="lbl">사건장소</td><td></td><td class="lbl">검거여부</td><td>전체 ▾</td><td class="lbl">작성자</td><td></td></tr>
          <tr><td class="lbl">처리관서</td><td>경찰청 <span class="sbtn b">검색</span></td><td class="lbl">의뢰관서</td><td><span class="sbtn b">검색</span></td><td class="lbl">발생관서</td><td><span class="sbtn b">검색</span></td></tr>
          <tr><td class="lbl">사건결과</td><td>전체 ▾ ☐결과 확인 전</td><td class="lbl">타기관여부</td><td>전체 ▾</td><td></td><td></td></tr>
        </tbody></table>
      </div>
      <div class="bar">사건관리 목록 <span style="font-weight:400">◉목록보기 ○문양보기 <span class="sbtn">초기화</span> <span class="sbtn">엑셀</span> <span class="sbtn">조회</span> <span class="sbtn">등록</span></span></div>
      <div class="box" style="overflow:hidden"><table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${CASES.map(row).join("")}</tbody></table></div>
      <div style="padding:6px;color:#666;font-size:11px">« ‹ 페이지 [1] / 9 › » ⟳ <span style="float:right">전체 116 중 1 - 14</span></div>
      ${M.pain(760, 250, "<b>열 25개</b> — 한 화면에 다 안 들어와 인터뷰 내내 좌우로 스크롤 (5613 16:37–17:07)")}
      ${M.pain(1000, 120, "<b>진행상태·결과가 세로쓰기 2글자 헤더</b> — 「등/록」「검/색」 아래 숫자가 이미지 장수인데 화면에 설명이 없음 (5613 10:00)", 220)}
      ${M.pain(300, 330, "<b>사건 뒤 단계가 안 보임</b> — 검증요청 뒤 교차 검증·감정서·결재가 어디까지 갔는지 목록에서 알 수 없음 (5613 17:34–19:36)", 260)}`
    );
  }

  M.add({
    id: "s01",
    code: "S01",
    group: "사건관리",
    title: "사건관리 목록",
    refs: [
      { t: "SCAS 사건관리 탭", v: "5613 02:00 · 10:04 · 16:37" },
      { t: "인터뷰: 진행상태·개수의 뜻", v: "5613 10:00–11:38", voice: true },
    ],
    lead: "SCAS의 검색 폼(3열×5행)·툴바·열 순서를 그대로 둡니다. 결과·진행상태는 SCAS처럼 「이미지 장수」를 세는 칸으로 두되 숫자 아래 장마다 한 칸짜리 막대를 그려 읽기 쉽게 하고, 사건 단위 단계(검증요청 → 교차 검증 → 감정서 → 결재)는 맨 끝 열에 따로 덧붙였습니다. r3: 검색 폼 아래에 「AI 사전 처리」와 할 일 타일, 이미지 칸에 AI 준비 표시, 펼친 행에 이미지별 현장 → 이진화 → 1위 후보를 더했습니다(자리·열 순서는 그대로).",
    scas,
    ours,
    fit: {
      area: ["same", "검색 폼 위 · 목록 아래, SCAS와 같은 자리"],
      buttons: ["same", "목록보기·문양보기·초기화·엑셀·조회·등록 순서 그대로, 열 보기 전환은 구분선 뒤"],
      popup: ["na", "목록 화면이라 팝업 없음(행 펼침은 덧붙임)"],
      columns: ["near", "SCAS 순서 유지. 기본 보기는 5열 숨김, 세로쓰기 숫자 6열 → 결과·진행상태 2칸, 검색·확인·검증 3열 → 1칸. 「SCAS 열 전체 보기」로 25열"],
    },
    notes: [
      { n: 1, kind: "keep", title: "검색 폼 3열×5행 그대로", text: "감정번호·등록일자·사건장소·처리관서·사건결과(☐결과 확인 전) / 문서번호·피해자·검거여부·의뢰관서·타기관여부 / 사건명·구분·작성자·발생관서를 SCAS와 같은 자리에 둡니다. 역할별 빠른 보기 칩은 폼 아래에 덧붙였습니다.", src: "5613 S3 검색 폼" },
      { n: 2, kind: "keep", title: "툴바 버튼 순서 그대로", text: "목록보기/문양보기 · 초기화 · 엑셀 · 조회 · 등록을 같은 순서로 오른쪽 위에 둡니다." },
      { n: 3, kind: "voice", title: "감정관도 「등록」", text: "공문 없이 감정관이 직접 사건을 만드는 경우가 있습니다. 「보면 등록이라는 게 있어요. 임의로 등록하는 거.」 그래서 등록 버튼을 수사관·감정관·관리자 모두에게 보입니다.", src: "5613 19:55" },
      { n: 4, kind: "voice", title: "공문 자동 접수 표시", text: "「자동으로 문서를 접수하면 여기에 자동으로 뜨는 거죠.」 감정번호 아래에 「공문 자동」/「임의 등록」을 작게 표시해, 어떤 길로 들어온 사건인지 구분합니다.", src: "5613 11:31" },
      { n: 5, kind: "better", title: "기본 보기 + SCAS 열 전체 보기", text: "열 순서는 SCAS 그대로이고, 기본 보기는 처리관서·결과확인 완료일자·사건 결과·접수자·작성자를 숨겨 가로 스크롤을 없앱니다. 「SCAS 열 전체 보기」를 누르면 25열 원래 모양으로 돌아옵니다.", src: "5613 16:37–17:07 좌우 스크롤" },
      { n: 6, kind: "voice", title: "진행상태 = 이미지 장수", text: "「진행상태가 검색하나를 한거야. 그래서 여기 확인을 눌러주는거야.」 등록·검색·확인 칸은 사건 단계가 아니라 이미지가 몇 장씩 그 상태인지 세는 숫자입니다(예 12장 중 등록 9·검색 2·확인 1). 숫자 아래 장마다 한 칸짜리 막대(회색 등록·주황 검색·파랑 확인)를 덧붙였습니다. 결과(발견·불발·불능)도 장수입니다.", src: "5613 10:00 · 인벤토리 S3/S11" },
      { n: 7, kind: "voice", title: "개수 = (신발, 타이어)", text: "「왼쪽에 있는 것은 신발 파일을 얘기하는 거고, 오른쪽에 있는 것은 타이어를 얘기하는 거에요.」 SCAS 표기 「12 (12, 0)」을 그대로 두고 헤더에 (신발, 타이어)를 적었습니다.", src: "5613 10:43–11:04" },
      { n: 8, kind: "better", title: "사건 진행 열(덧붙임)", text: "이미지가 모두 확인되면 사건 단위로 검증요청 → 교차 검증(다른 감정관) → 감정서 → 결재가 이어집니다. SCAS 목록에는 없던 이 단계를 맨 끝 열에 따로 보여 주고, 이미지 장수 칸과 섞지 않습니다.", src: "5613 17:34–19:36" },
      { n: 9, kind: "voice", title: "처리 구분 현장 / 대조", text: "「현장, 대조, 뭐 이런게 다 있어요. 현장이면 검색이란 말이에요.」 SCAS 값을 그대로 두고, 「대조」 사건만 보라색으로 구분합니다.", src: "5613 10:43" },
      { n: 10, kind: "better", title: "행 펼침 요약(덧붙임)", text: "행을 누르면 바로 아래에 이미지별 상태(확인·발견, 검색번호, 확인대상 수 / 전체)와 교차 검증자가 펼쳐집니다. 열과 팝업은 그대로 두고 덧붙이기만 합니다." },
      { n: 12, kind: "plus", title: "AI 사전 처리 · 현황 타일(r3)", text: "공문이 접수되면 감정관이 사건을 열기 전에 AI가 이미지마다 이진화 → 문양 제안 → 검색 Top-10을 미리 돌려 둡니다. 검색 폼 아래(r2의 빠른 보기 자리)에 진행 중인 사건과 역할별 할 일 숫자를 타일로 보여 주고, 목록의 이미지 칸에는 「AI 7/12」(준비된 장 / 전체)를 붙였습니다. 방금 들어온 행은 왼쪽에 청록 줄이 빛납니다. 열 순서·버튼은 그대로이고, 판정은 여전히 감정관이 합니다.", src: "사업계획서 p13 · 5613 16:07–16:36 「일일이 검색」" },
      { n: 11, kind: "better", title: "보는 사람마다 다른 버튼", text: "감정관·관리자는 행 끝 검색·확인·검증요청 버튼과 「교차 검증 요청 받음」을 봅니다. 기술책임자는 「결재 대기」, 수사관은 「우리 청 의뢰」와 등록만 봅니다." },
    ],
  });
})();
