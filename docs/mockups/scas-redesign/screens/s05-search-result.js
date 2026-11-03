/* S05 검색 결과 — SCAS 「문양검색결과」 레이어 팝업 + 「인공지능 문양 검색 결과」 다크 창 + 「현장문양검색결과 상세조회」 팝업
   (IMG_5613 04:54–05:07, 07:22, 08:44–09:52, 21:50–22:48)
   r2: SCAS 팝업 배치(좌 현장 / 우 결과 그리드, 결과형태 1–4열 · 확인대상보기) 유지 + 수천 장 빠른 넘겨보기,
       확인대상 등록은 SCAS처럼 상세조회 버튼으로, 카드 ★은 지름길로만 덧붙임. */
(function () {
  const { pin, apin, sole } = M;

  const modal = ({ x, y, w, title, btns, body }) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;border:1px solid #2b4a78;border-radius:12px;background:var(--panel);box-shadow:0 24px 70px rgba(0,0,0,.7)">
      <div style="display:flex;align-items:center;gap:8px;height:42px;padding:0 10px 0 14px;border-bottom:1px solid #2b4a78;border-radius:12px 12px 0 0;background:linear-gradient(90deg,#132445,#0e1a30)"><b style="font-size:13.5px;white-space:nowrap">${title}</b><span style="margin-left:auto;display:flex;gap:6px;align-items:center">${btns}</span></div>${body}</div>`;
  const band = (t, r = "") => `<div style="display:flex;align-items:center;gap:8px;min-height:30px;padding:0 10px;border-left:3px solid var(--blue2);background:rgba(21,34,56,.7);font-size:12.5px;font-weight:600">${t}<span style="margin-left:auto;display:flex;gap:6px;align-items:center;font-weight:400">${r}</span></div>`;

  /* 17쪽(129–152위). 136위까지 봤음, 137위에 키보드 초점, mv = AI 순위 다시 매김으로 오른 계단 */
  const Z = [["herring", "grid", "herring"], ["grid", "grid", "blocks"], ["herring", "herring", "lines"], ["dots", "herring", "grid"], ["wave", "grid", "herring"], ["blocks", "herring", "blocks"], ["tri", "herring", "grid"], ["herring", "dots", "herring"]];
  const SIMS = [61.2, 61.0, 60.8, 60.7, 60.1, 59.9, 59.6, 59.0, 58.4, 58.1, 57.9, 57.6, 57.2, 57.0, 56.8, 56.5, 56.1, 55.9, 55.8, 55.4, 55.0, 54.7, 54.5, 54.1];
  const RES = SIMS.map((s, i) => ({ r: 129 + i, s, z: Z[i % 8], seen: 129 + i <= 136, focus: 129 + i === 137, star: 129 + i === 140, mv: { 1: 4, 9: 11, 13: 2 }[i] || 0 }));

  const card = (c) => `<div class="pinbox" style="display:grid;gap:3px;padding:4px;border:1px solid ${c.focus ? "var(--blue)" : "var(--line)"};border-radius:9px;background:var(--panel2);${c.seen ? "opacity:.5" : ""}${c.focus ? ";box-shadow:0 0 0 2px var(--blue),0 0 14px rgba(74,158,255,.4)" : ""}">${c.star ? apin(8, "better") : ""}
      <span class="imgbox" style="height:104px;border-radius:6px;background:#e9ecf0">${sole({ kind: "shoe", zones: c.z, heat: c.focus })}${c.mv ? `<span class="chip teal num" style="position:absolute;left:4px;top:4px;height:17px;padding:0 5px;font-size:10px">▲${c.mv}</span>` : ""}${c.focus ? `<span class="fx-scan" style="animation-duration:2.8s"></span><span class="ai-tag" style="position:absolute;right:4px;bottom:4px;height:15px;font-size:9px">일치 부위</span>` : ""}</span>
      <span class="fx-bar" style="height:3px"><i style="width:${(c.s - 50) * 8}%;${c.seen ? "background:var(--dim)" : ""}"></i></span>
      <div style="display:flex;align-items:center;gap:3px;font-size:10.5px;line-height:1.2;white-space:nowrap">
        <b class="num">${c.r}위</b><span class="num" style="color:var(--mute)">${c.s.toFixed(1)}%</span>
        <span style="margin-left:auto;font-size:13px;color:${c.star ? "var(--amber)" : "var(--faint)"}" data-lock="analyst admin">${c.star ? "★" : "☆"}</span>
      </div></div>`;

  function ours() {
    /* 뒤 화면: S04 문양 상세보기 팝업(어둡게) */
    const ghost = `<div style="opacity:.3;pointer-events:none;position:absolute;inset:0">
        <div class="panel" style="position:absolute;left:0;right:0;top:6px;height:900px"><div style="height:42px;border-bottom:1px solid var(--line)"></div>
          <div style="display:grid;grid-template-columns:240px 1fr 270px;gap:12px;padding:12px"><div class="panel" style="height:800px"></div><div class="panel" style="height:800px"></div><div class="panel" style="height:800px"></div></div></div></div>`;

    /* 유사도 분포(가짜): 순위 1–857을 43칸으로 묶은 막대. 앞쪽은 높고 뒤로 갈수록 낮다. 본 위치(136위)까지는 흐리게 */
    const NB = 43;
    const bars = Array.from({ length: NB }, (_, i) => {
      const v = 72 - 22 * Math.pow(i / (NB - 1), 0.55) - (i < 2 ? 0 : 3 * Math.sin(i * 1.7) * (i / NB));
      const h = Math.max(3, (v - 44) * 1.6);
      const seen = (i + 1) * (857 / NB) <= 136;
      return `<rect x="${i * 5}" y="${48 - h}" width="4" height="${h}" rx="1" fill="${seen ? "#2b4a78" : "#4a9eff"}" opacity="${seen ? 0.55 : 0.9 - (i / NB) * 0.5}"/>`;
    }).join("");
    const xr = (r) => ((r / 857) * NB * 5).toFixed(1);
    const dist = `<svg viewBox="0 0 215 58" width="100%" height="64" aria-label="유사도 분포">${bars}
        <line x1="${xr(136)}" y1="0" x2="${xr(136)}" y2="50" stroke="var(--blue)" stroke-width="1.2"/>
        ${[3, 140].map((r) => `<path d="M${xr(r) - 3} 0L${+xr(r) + 3} 0L${xr(r)} 5Z" fill="var(--amber)"/>`).join("")}
        <text x="0" y="57" font-size="6" fill="#5b6b85" font-family="monospace">1위 72%</text><text x="215" y="57" font-size="6" fill="#5b6b85" font-family="monospace" text-anchor="end">857위 41%</text></svg>`;

    const row1 = RES.slice(0, 8).map(card).join("");
    const rest = RES.slice(8).map(card).join("");

    const left = `<div style="display:grid;gap:8px;align-content:start">
        ${band("현장 족적", `<span class="seg" style="padding:2px"><button aria-pressed="true" style="padding:2px 8px">원본</button><button aria-pressed="false" style="padding:2px 8px">이진화</button></span>`)}
        <span class="imgbox" style="height:330px">${M.photo({ zones: ["herring", "herring", "herring"], rot: 0, flip: true, tag: "" })}<span class="cap">고정 · 두 번 누르면 뷰어</span></span>
        <div style="font-size:11.5px;color:var(--mute);line-height:1.6">검색번호 <b class="mono" style="color:var(--fg2)">572433</b> · 이미지 검색<br>필수 문양 상·중 헤링본 · 07-24 17:41</div>
        <div class="pinbox" style="display:grid;gap:6px;padding:8px 10px;border:1px solid var(--line3);border-radius:8px;background:var(--panel2)">${apin(4, "voice")}
          <div style="display:flex;justify-content:space-between;font-size:12px"><b>본 위치</b><span class="num" style="color:var(--fg2)">136위 / 857건</span></div>
          <div style="height:6px;border-radius:3px;background:var(--line3)"><div style="width:16%;height:100%;border-radius:3px;background:var(--blue2)"></div></div>
          <div style="display:flex;gap:6px;align-items:center;font-size:11px;color:var(--dim)">지난번 07-24 17:52까지<button class="btn sm" style="margin-left:auto">137위부터 이어 보기</button></div>
        </div>
        <div class="pinbox" style="display:grid;gap:5px;padding:8px 10px;border:1px solid var(--line3);border-radius:8px;background:var(--panel2)">${apin(12, "plus")}
          <div style="display:flex;justify-content:space-between;font-size:12px"><b>유사도 분포</b><span class="mono" style="color:var(--dim);font-size:10.5px">857건 · 순위 →</span></div>
          ${dist}
          <div style="display:flex;gap:10px;font-size:10px;color:var(--dim)"><span><span style="color:var(--amber)">▼</span> 확인대상</span><span><span style="color:var(--blue)">│</span> 본 위치</span><span style="margin-left:auto">300위 뒤는 꼬리</span></div>
        </div>
        <div class="pinbox" style="display:grid;gap:4px;padding:8px 10px;border:1px solid #4d3a12;border-radius:8px;background:var(--amber-bg)">${apin(9, "voice")}
          <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--amber)"><b>확인대상</b><span class="num">2건</span></div>
          ${[["3위", "305659"], ["140위", "305102"]].map(([r, id]) => `<div style="display:flex;gap:6px;align-items:center;font-size:11.5px;color:var(--fg2)"><span class="num" style="width:38px">${r}</span><span class="mono">${id}</span><button class="btn sm" style="margin-left:auto;height:20px;padding:0 6px" data-lock="analyst admin">확인대상 제외</button></div>`).join("")}
        </div>
        <div style="font-size:11px;color:var(--dim);line-height:1.6">키보드 ← → 한 장 · PgDn 한 쪽 · Enter 상세조회 · S ★</div>
      </div>`;

    const right = `<div style="display:grid;gap:8px;align-content:start;min-width:0">
        <div style="display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:6px">${row1}</div>
        <div class="pinbox" style="display:flex;align-items:center;gap:8px;color:var(--blue);font-size:11px;padding-right:16px"><span style="flex:1;height:1px;background:var(--blue2)"></span>여기까지 봤음 · 136위 · 07-24 17:52<span style="flex:1;height:1px;background:var(--blue2)"></span></div>
        <div style="display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:6px">${rest}</div>
        <div style="display:flex;align-items:center;gap:10px;font-size:12px;color:var(--mute)"><span class="num">« ‹ 17 / 108 › »</span><span class="num" style="color:var(--dim)">129–152위 / 857건</span>
          <span style="margin-left:auto;font-size:11px;color:var(--dim)">카드 ☆ = 확인대상 지름길(상세조회 버튼과 같음)</span></div>
      </div>`;

    /* 상세조회(SCAS는 3번째 팝업 → 같은 레이어 아래 칸) */
    const info = [["화류번호", "305102"], ["제조사", "(주)○○"], ["상표명", "기타"], ["모델번호", "—"], ["화종", "구두"], ["수집년도", "2021"], ["그룹명", "G-1182"]];
    const detail = `<div style="margin-top:4px">
        ${band(`현장문양검색결과 상세조회 <span class="num" style="font-weight:400;color:var(--mute);margin-left:4px">137위 · 58.4%</span>`, `<span class="pinbox" style="display:inline-flex;gap:5px">${apin(6, "voice", true)}
          <button class="btn sm">이전</button><button class="btn sm">다음</button><button class="btn sm" data-lock="analyst admin">그룹등록</button><button class="btn sm ok" data-lock="analyst admin" style="box-shadow:inset 0 0 0 1px #4ade80">확인대상</button><button class="btn sm">프린트</button><button class="btn sm">닫기</button></span>
          <span style="width:1px;height:18px;background:var(--line3)"></span><button class="btn sm">크게 보기(뷰어)</button>`)}
        <div style="display:grid;grid-template-columns:150px 150px 190px minmax(0,1fr);gap:10px;padding:10px 0 0">
          <div style="display:grid;gap:3px;font-size:11px;color:var(--mute)">유류 이미지<span class="imgbox" style="height:150px">${M.photo({ zones: ["herring", "herring", "herring"], rot: 0, flip: true, tag: "" })}</span></div>
          <div style="display:grid;gap:3px;font-size:11px;color:var(--mute)"><span style="display:flex;align-items:center">발견 이미지<span class="ai-tag" style="margin-left:auto;height:15px;font-size:9px">일치 부위 켬</span></span><span class="imgbox" style="height:150px;background:#e9ecf0">${sole({ kind: "shoe", zones: Z[0], heat: true })}</span></div>
          <div style="display:grid;gap:3px;font-size:11px;color:var(--mute)">측면 이미지<span class="imgbox" style="height:150px;display:grid;place-items:center"><svg viewBox="0 0 200 90" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-label="측면 이미지(가짜 예시)"><rect width="200" height="90" style="fill:var(--panel)"/>
            <path d="M14 60C16 46 30 40 52 38L78 26C90 18 104 18 112 26L122 34C142 36 168 42 182 52L184 64L16 66Z" style="fill:#2a3546;stroke:#3b4a63"/>
            <path d="M12 66L186 64L184 72L18 74Z" style="fill:#c7cedb"/><path d="M84 30L104 44M78 34L98 48M72 38L92 52" style="stroke:#4a5a75;stroke-width:2"/><path d="M20 70L180 69" style="stroke:#5b6b85;stroke-width:1;stroke-dasharray:3 2"/></svg></span></div>
          <div style="display:grid;gap:8px;align-content:start">
            <div class="form" style="grid-template-columns:72px minmax(0,1fr) 72px minmax(0,1fr)">${info.map(([l, v]) => `<div class="l" style="padding:5px 8px;min-height:30px">${l}</div><div class="v" style="padding:5px 8px;min-height:30px">${v}</div>`).join("")}<div class="l" style="padding:5px 8px;min-height:30px"></div><div class="v" style="padding:5px 8px;min-height:30px"></div></div>
            <div class="pinbox" style="display:flex;gap:8px;align-items:center;padding:7px 10px;border:1px solid #2b4a78;border-radius:8px;background:var(--blue-bg);font-size:12px">${apin(7, "better", true)}
              확인대상에 등록하시겠습니까?<span style="margin-left:auto;display:flex;gap:5px"><button class="btn sm pri">예</button><button class="btn sm">아니오</button></span></div>
          </div>
        </div>
      </div>`;

    const toolbar = `<div style="display:flex;align-items:center;gap:10px;padding:8px 14px;border-bottom:1px solid var(--line2)">
        <span style="font-size:12px;color:var(--mute)">이미지번호 <b class="mono" style="color:var(--fg)">00001-25-0649_2</b></span>
        <span class="num pinbox" style="font-size:12px;color:var(--fg2);padding-right:16px">1위 / 857건${apin(10, "better")}</span>
        <span class="pinbox" style="margin-left:auto;display:inline-flex;gap:5px;align-items:center;padding-left:14px">${apin(2, "keep", true)}
          <span style="font-size:12px;color:var(--mute);margin-right:2px">결과형태</span>
          <button class="btn sm">1열</button><button class="btn sm">2열</button><button class="btn sm">3열</button><button class="btn sm">4열</button><button class="btn sm">확인대상보기</button></span>
        <span style="width:1px;height:20px;background:var(--line3)"></span>
        <span class="pinbox" style="display:inline-flex;gap:5px;align-items:center">${apin(3, "voice")}<button class="btn sm" style="box-shadow:inset 0 0 0 1px var(--blue);color:var(--fg)">촘촘 8열</button></span>
        <span class="chip teal pinbox" style="height:22px;margin-right:6px">${apin(5, "voice")}<span class="ai-mark">AI</span> 순위 다시 매김</span>
      </div>`;

    const body = `${toolbar}<div style="padding:12px 14px 14px">
        <div class="pinbox" style="display:grid;grid-template-columns:240px minmax(0,1fr);gap:12px">${apin(1, "keep", true)}${left}${right}</div>
        ${detail}
      </div>`;

    return M.shell(
      { active: "사건관리", tabs: ["사건관리", "감정서작성", "족윤적 검증", "결재 대기함", "문서접수대장"], title: "사건관리 · 문양검색결과", h: 1280 },
      `<div style="position:relative;min-height:1180px">
        ${ghost}
        <div style="position:absolute;inset:0;background:rgba(5,8,13,.72);border-radius:12px"></div>
        ${modal({
          x: 0, y: 14, w: 1180, title: "문양검색결과",
          btns: `<span class="pinbox" style="display:inline-flex;gap:6px">${apin(11, "better")}<span class="chip" data-role="verifier" style="height:22px">기술책임자 · 보기만</span><span class="chip" data-role="investigator" style="height:22px">수사관 · 볼 수 없음</span><button class="btn sm ghost">✕</button></span>`,
          body,
        })}
      </div>`
    );
  }

  function scas() {
    const caps = ["1 | 49", "2 | 32", "3 | 32", "4 | 30", "5 | 25", "6 | 24", "7 | 24", "8 | 23"];
    return M.scasShell(
      { treeOn: "사건관리", h: 790 },
      `<div class="modal" style="left:10px;top:8px;width:1200px;height:640px;opacity:.55"><div class="bar">문양 상세보기</div></div>
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
      ${M.pain(250, 430, "<b>확인대상 등록은 팝업 3겹째</b> — 카드 → 상세조회 팝업 → 「확인대상」 → 알림 「예」 (5613 08:52–09:20)", 250)}
      ${M.pain(960, 640, "<b>몇천 장을 4열로 넘김</b> — 애매하면 처음부터 끝까지 보고, 어디까지 봤는지 화면이 기억하지 않음 (5613 22:18–22:48)", 240)}`
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
      { t: "SCAS 현장문양검색결과 상세조회", v: "5613 08:52–09:20" },
      { t: "인터뷰: 결과 비교가 제일 오래", v: "5613 21:50–22:48", voice: true },
    ],
    lead: "SCAS 「문양검색결과」 팝업의 배치(왼쪽 현장 족적, 오른쪽 결과 그리드, 위쪽 결과형태 1–4열·확인대상보기)를 그대로 둡니다. 감정관이 가장 오래 쓰는 「결과 눈으로 비교」를 줄이려고 촘촘한 8열 빠른 넘겨보기, 키보드 넘기기, 어디까지 봤는지 기억을 덧붙였습니다. 확인대상 등록은 SCAS처럼 상세조회의 「확인대상」 버튼이 기본이고, 카드 ☆은 지름길입니다.",
    scas,
    ours,
    fit: {
      area: ["same", "좌 현장 족적(약 1/4) / 우 결과 그리드, 위에 이미지번호·결과형태"],
      buttons: ["same", "결과형태 1열·2열·3열·4열·확인대상보기, 상세조회 이전·다음·그룹등록·확인대상·프린트·닫기 순서 그대로"],
      popup: ["near", "문양 상세보기 위 2번째 겹 그대로. 3번째 겹이던 상세조회는 같은 레이어 아래 칸으로, 알림은 작은 확인 막대로"],
      columns: ["near", "1–4열 그대로 + 촘촘 8열 덧붙임, 카드 캡션 「1 | 49」 → 「137위 · 58.4%」"],
    },
    notes: [
      { n: 1, kind: "keep", title: "문양검색결과 팝업 배치 그대로", text: "문양 상세보기 위에 레이어로 뜨고, 왼쪽에 현장 족적(고정), 오른쪽에 결과 그리드가 있습니다. SCAS와 같은 자리입니다.", src: "5613 S7b" },
      { n: 2, kind: "keep", title: "결과형태 1–4열 · 확인대상보기", text: "버튼 이름과 순서를 그대로 둡니다. 새 「촘촘 8열」은 구분선 뒤에 붙였습니다." },
      { n: 3, kind: "voice", title: "촘촘 8열 + 키보드로 빠르게 넘기기", text: "「검색 결과를 이제 비교할 때가 제일 오래 걸리죠. 다 눈으로 봐야 되니까.」 한 쪽에 24장을 보여 주고, ← →로 한 장, PgDn으로 한 쪽씩 넘기며 Enter로 상세조회를 엽니다. 미리보기 사진을 먼저 띄워 넘김이 끊기지 않게 합니다.", src: "5613 21:50–21:59 · 사업계획서 p44 2초 응답" },
      { n: 4, kind: "voice", title: "어디까지 봤는지 기억", text: "「몇천개가 나와도 처음부터 끝까지 보거든요… 막연한 거는 막 만개도 볼 때가 있고.」 본 카드는 흐리게, 「여기까지 봤음 · 136위」 선을 긋고, 다시 열면 「137위부터 이어 보기」를 제안합니다.", src: "5613 22:18–22:48" },
      { n: 5, kind: "voice", title: "AI 순위 다시 매김", text: "「어떤 거는 엄청 밑에 있을 수도 있고 하니까. 그걸 좀 위로 올라가면 그 시간은 소요가 좀 줄어들겠다.」 AI가 다시 줄 세워 올린 후보에 청록 ▲(올라간 계단)를 붙입니다. 성공 기준은 「정답 순위가 얼마나 위로 왔나」입니다.", src: "5613 21:59–22:07" },
      { n: 6, kind: "voice", title: "상세조회에서 다시 보고 확인대상", text: "「확대해서 다시 한 번 봤어… 보고 나서 얘가 맞다. 그러면 확인대상에 등록을 하는 거예요.」 카드를 고르면 아래 칸에 유류·발견·측면 이미지와 신발정보가 열리고, SCAS 버튼 줄(이전·다음·그룹등록·확인대상·프린트·닫기) 그대로 등록합니다. 「크게 보기」는 S03 뷰어를 엽니다.", src: "5613 08:44–09:04" },
      { n: 7, kind: "better", title: "알림 창 → 같은 자리 확인 막대", text: "SCAS의 「확인대상에 등록하시겠습니까? 예/아니오」 습관은 그대로 두되, 새 팝업 대신 상세조회 칸 안의 작은 막대로 묻습니다.", src: "5613 09:20 S10 알림" },
      { n: 8, kind: "better", title: "카드 ☆ 지름길(덧붙임)", text: "확실한 후보는 카드의 ☆을 눌러 바로 확인대상에 넣고, 잘못 누르면 「되돌리기」로 취소합니다. 상세조회의 「확인대상」 버튼은 원래 자리에 그대로 있습니다." },
      { n: 9, kind: "voice", title: "확인대상 보고 제외", text: "「비교를 했는데 아니야. 그러면 여기서 확인대상 제외를 다시 누르면 되고.」 왼쪽 확인대상 칸에 고른 후보를 모아 두고, 다시 비교해 아니면 「확인대상 제외」를 누릅니다.", src: "5613 09:10–09:22" },
      { n: 10, kind: "better", title: "숫자 표기 통일 · 원본/이진화", text: "「1 | 49」「1 /857」「1/108」처럼 화면마다 달랐던 표기를 「1위 / 857건」, 카드는 「137위 · 58.4%」로 맞췄습니다. AI 창에만 있던 「이진화 이미지」 전환은 현장 족적 위 원본/이진화로 남겼습니다.", src: "5613 05:07 · 07:22" },
      { n: 12, kind: "plus", title: "유사도 분포 · 일치 부위(r3)", text: "857건이 순위별로 얼마나 비슷한지 막대로 보여 주고, 본 위치(136위)와 확인대상(3위·140위)을 표시합니다. 「어떤 거는 엄청 밑에 있을 수도 있고」 — 남은 후보가 앞쪽과 얼마나 차이 나는지 보고 어디까지 볼지 정할 수 있습니다(끝까지 보는 것은 그대로 가능). 카드마다 유사도 막대를 달고, 지금 보는 카드와 상세조회 발견 이미지에는 AI가 비슷하다고 본 부위를 색으로 겹칩니다. 측면 이미지 칸도 채웠습니다.", src: "5613 21:50–22:48 · 사업계획서 p13" },
      { n: 11, kind: "better", title: "보는 사람마다 다른 권한", text: "감정관·관리자만 확인대상 등록·제외·그룹등록을 합니다. 기술책임자는 결재 때 결과를 보기만 하고(☆ 잠김), 수사관에게는 이 화면이 열리지 않습니다." },
    ],
  });
})();
