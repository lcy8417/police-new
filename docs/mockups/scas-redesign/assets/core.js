/* 족적 감정 플랫폼 시안 — 공통 도우미 (화면 파일 screens/*.js 가 M.add 로 화면을 등록하고, index.html 이 렌더한다)
   이 파일은 시안 전용이다. 실제 앱(src/) 코드가 아니다. */
(function () {
  "use strict";

  const M = (window.M = { screens: [] });

  /* ── 화면 등록 ──
     M.add({ id, code, title, plus, group, refs:[{t, v}], lead, scas: () => html, ours: () => html,
             notes:[{ n, kind:"keep|better|plus|voice", title, text, src }] }) */
  M.add = (s) => M.screens.push(s);

  /* ── 문자열 도우미 ── */
  M.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  M.pin = (n, kind = "better", cls = "") => `<span class="pin ${kind} ${cls}" title="주석 ${n}">${n}</span>`;
  M.apin = (n, kind = "better", tl = false) => M.pin(n, kind, "abs" + (tl ? " tl" : ""));

  /* ── 역할(보는 사람) ── */
  M.ROLES = {
    investigator: { label: "수사관", who: "이○○ 경사", org: "대구청 과학수사계", hint: "사건 등록·의뢰" },
    analyst: { label: "감정관", who: "박○○ 경위", org: "경찰청 범죄분석과", hint: "검색·대조·판단·감정서" },
    verifier: { label: "검증자", who: "최○○ 경감", org: "족윤적 팀장·기술책임자", hint: "검증·결재" },
    admin: { label: "관리자", who: "시스템 관리자", org: "경찰청 과학수사관리관실", hint: "계정·권한·기록·모델" },
  };

  /* ── 문양 아이콘(police-new src/assets/Patterns 에서 복사한 일부) ──
     「?」(분류 불가) 아이콘: n51_01 · n71_01 · s10a · s81a — 대표 문양으로 쓰지 말 것.
     항목: s81b 마크 · s81c 브랜드 · s81d 숫자 · s81e 문자 · s82a 그림. 헤링본 n32_04, 사각 격자 n21_05, 삼각 배열 n21_02. */
  M.P = {
    윤곽: ["s10a", "s10b", "s10c", "s10d", "s10e", "s10f", "s10g", "s10h", "s10i", "s10j", "s10k", "s10l", "n10_01", "n10_03"],
    면: ["n21_01", "n21_02", "n21_03", "n21_05", "n21_06", "n21_07", "n21_10", "n21_11", "n21_12", "n21_13", "n21_15", "n21_16", "n21_17", "n21_19"],
    내부선: ["n21_20", "n31_01", "n31_02", "n31_03", "n31_04", "n32_02", "n32_03", "n32_04", "n32_05", "n32_06", "n32_07", "n32_09", "n32_10", "n32_11"],
    삼각: ["n41_01", "n41_02", "n41_03", "n41_04", "n42_01", "n42_02", "n42_03", "s41a", "s41b", "s41c", "s41d", "s41e", "s41f", "s41g"],
    사각: ["n51_01", "n51_02", "n51_03", "n51_04", "n51_05", "n51_06", "n51_08", "n51_09", "n51_10", "n51_11", "n51_12", "n51_13", "n51_14", "n52_01"],
    다각: ["n61_01", "n61_02", "n62_02", "n62_03", "n62_04", "n62_05", "n62_06", "n62_07", "n62_08", "n62_09", "n62_10", "n62_11", "s61a", "s62z"],
    원: ["n71_01", "n71_02", "n71_04", "n72_01", "n72_02", "n72_05", "n73_01", "n73_02", "n73_03", "n73_05", "n73_06", "s71a", "s71b", "s71c"],
    항목: ["s81a", "s81b", "s81c", "s81d", "s81e", "s82a"],
  };
  M.PCATS = Object.keys(M.P);
  /* 코드 설명(SCAS 화면 원문 2건 + 같은 문체의 예시) */
  M.PDESC = {
    // 「?」 아이콘(각 분류의 첫 칸) — SCAS 화면 원문
    n51_01: "대분류 중분류 가능하나 소분류에 아이콘이 없는 경우",
    n71_01: "대분류 중분류 가능하나 소분류에 아이콘이 없는 경우",
    // 사각 규칙 배열(면 > 규칙무늬) — SCAS 화면 원문(IMG_5614 1:15)
    n21_05: "사각형이 규칙적으로 배열 (정사각형, 마름모, 직사각형 등 사각형의 형태 구분없음)",
    // 헤링본(지그재그) — SCAS 화면 원문(IMG_5616 0:30–2:45)
    n32_04: "산 모양이 규칙적으로 반복 배열(주기 1번 초과, 꼭지점 각도가 내각, 직각 포함)",
  };
  M.picon = (name, cls = "", title = "") =>
    `<span class="picon ${cls}" title="${M.esc(title || name)}"><img src="assets/patterns/${name}.png" alt="${name}" loading="lazy"></span>`;

  /* ── 가짜 밑창·족적 그림(SVG) ──
     kind: "shoe"(등록 신발 밑창) | "scene"(현장 족적: 먼지·잡음·일부 소실) | "bin"(이진화)
     zones: [상, 중, 하] 무늬 이름 — herring | grid | wave | dots | blocks | tri | lines */
  let uid = 0;
  const SOLE =
    "M50 6C78 6 92 32 92 72C92 112 80 132 78 152C76 176 84 202 82 226C80 250 64 258 50 258C36 258 20 250 18 226C16 202 24 176 22 152C20 132 8 112 8 72C8 32 22 6 50 6Z";
  const TEX = {
    herring: (c) => `<pattern id="%" width="12" height="9" patternUnits="userSpaceOnUse"><path d="M0 7L6 2L12 7" fill="none" stroke="${c}" stroke-width="2.4"/></pattern>`,
    grid: (c) => `<pattern id="%" width="9" height="9" patternUnits="userSpaceOnUse"><rect x="1.2" y="1.2" width="6.6" height="6.6" rx="1" fill="${c}"/></pattern>`,
    wave: (c) => `<pattern id="%" width="16" height="8" patternUnits="userSpaceOnUse"><path d="M0 4Q4 0 8 4T16 4" fill="none" stroke="${c}" stroke-width="2.2"/></pattern>`,
    dots: (c) => `<pattern id="%" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="2.2" fill="${c}"/></pattern>`,
    blocks: (c) => `<pattern id="%" width="18" height="13" patternUnits="userSpaceOnUse"><rect x="1.5" y="1.5" width="15" height="9.5" rx="2" fill="${c}"/></pattern>`,
    tri: (c) => `<pattern id="%" width="12" height="11" patternUnits="userSpaceOnUse"><path d="M6 1L11 10H1Z" fill="${c}"/></pattern>`,
    lines: (c) => `<pattern id="%" width="8" height="6" patternUnits="userSpaceOnUse"><rect y="1" width="8" height="2.6" fill="${c}"/></pattern>`,
  };
  M.sole = function ({ kind = "shoe", zones = ["herring", "grid", "blocks"], bg, w = "100%", h = "100%", ruler = false, cut = false, heat = false, flip = false } = {}) {
    const id = "s" + ++uid;
    const ink = kind === "shoe" ? "#3a3f48" : kind === "bin" ? "#111" : "#d9c27a";
    const base = kind === "shoe" ? "#9aa1ab" : kind === "bin" ? "#fff" : "transparent";
    const ground = bg || (kind === "bin" ? "#ffffff" : kind === "scene" ? "#121418" : "#e9ecf0");
    const defs = zones.map((z, i) => (TEX[z] || TEX.grid)(ink).replace("%", `${id}p${i}`)).join("");
    const bands = [
      [0, 92],
      [92, 176],
      [176, 264],
    ]
      .map(([y0, y1], i) => `<rect x="0" y="${y0}" width="100" height="${y1 - y0}" fill="url(#${id}p${i})"/>`)
      .join("");
    const noise =
      kind === "scene"
        ? `<filter id="${id}n"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="${uid}"/><feColorMatrix values="0 0 0 0 .85  0 0 0 0 .76  0 0 0 0 .48  0 0 0 1.1 -.55"/><feComposite in2="SourceGraphic" operator="in"/></filter>
           <mask id="${id}m"><rect width="100" height="264" fill="#fff"/>${cut ? `<path d="M100 120C70 140 64 190 100 210Z" fill="#000"/>` : ""}<rect width="100" height="264" fill="#000" opacity=".15"/></mask>`
        : "";
    const heatLayer = heat
      ? `<g opacity=".55" style="mix-blend-mode:screen"><circle cx="40" cy="60" r="26" fill="url(#${id}h1)"/><circle cx="62" cy="150" r="22" fill="url(#${id}h2)"/><circle cx="46" cy="222" r="18" fill="url(#${id}h1)"/></g>`
      : "";
    const heatDefs = heat
      ? `<radialGradient id="${id}h1"><stop offset="0" stop-color="#ef4444"/><stop offset=".5" stop-color="#f59e0b" stop-opacity=".6"/><stop offset="1" stop-color="#f59e0b" stop-opacity="0"/></radialGradient>
         <radialGradient id="${id}h2"><stop offset="0" stop-color="#22c55e"/><stop offset="1" stop-color="#22c55e" stop-opacity="0"/></radialGradient>`
      : "";
    const rulerSvg = ruler
      ? `<g transform="translate(100 0)">${Array.from({ length: 13 }, (_, i) => `<rect x="2" y="${6 + i * 20}" width="8" height="10" fill="${i % 2 ? "#111" : "#f5f5f5"}"/>`).join("")}<rect x="2" y="6" width="8" height="250" fill="none" stroke="#f5f5f5" stroke-width=".6"/></g>`
      : "";
    const vbw = ruler ? 114 : 100;
    return `<svg viewBox="0 0 ${vbw} 264" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${kind === "scene" ? "현장 족적(가짜 예시)" : "밑창(가짜 예시)"}">
      <defs>${defs}${noise}${heatDefs}<clipPath id="${id}c"><path d="${SOLE}"/></clipPath></defs>
      <rect x="-20" y="-20" width="160" height="310" fill="${ground}"/>
      <g ${flip ? 'transform="translate(100 0) scale(-1 1)"' : ""} ${kind === "scene" ? `mask="url(#${id}m)"` : ""}>
        <g clip-path="url(#${id}c)" ${kind === "scene" ? `filter="url(#${id}n)"` : ""}>
          <rect width="100" height="264" fill="${base}"/>${bands}
        </g>
        ${kind !== "scene" ? `<path d="${SOLE}" fill="none" stroke="${kind === "bin" ? "#111" : "#596170"}" stroke-width="1.6"/>` : ""}
      </g>${heatLayer}${rulerSvg}</svg>`;
  };

  /* ── 우리 개선안 앱 셸 ──
     M.shell({ active:"사건관리", tabs:["사건관리", ...], tabOn:"사건관리", title:"사건관리", menuCount:{}, h:880 }, innerHtml) */
  const SVG_SHIELD = `<svg viewBox="0 0 24 24" fill="none" stroke="#7fb6ff" stroke-width="1.8"><path d="M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5l8-3z"/><path d="M8.5 12.5l2.4 2.3 4.6-5" stroke="#4a9eff"/></svg>`;
  const MENU = [
    { g: "사건관리", items: [
      { t: "사건관리", role: "investigator analyst verifier admin" },
      { t: "사건 등록", role: "investigator admin" },
      { t: "용의자관리", role: "investigator analyst admin" },
    ] },
    { g: "문양관리", items: [
      { t: "신발문양 관리", role: "analyst admin" },
      { t: "신발그룹 관리", role: "analyst admin" },
      { t: "수집 검수", role: "analyst admin", plus: true },
    ] },
    { g: "문양검색·대조", items: [
      { t: "검색 이력", role: "analyst verifier admin" },
      { t: "정밀 대조", role: "analyst verifier admin", plus: true },
    ] },
    { g: "감정서관리", items: [
      { t: "감정서작성", role: "analyst admin", cnt: "2" },
      { t: "결재 대기함", role: "verifier admin", cnt: "3" },
    ] },
    { g: "족윤적관리", items: [
      { t: "족윤적 검증", role: "verifier admin", cnt: "1" },
      { t: "기초코드관리", role: "admin" },
      { t: "사용자·권한", role: "admin" },
      { t: "사용 기록", role: "admin" },
      { t: "모델 관리", role: "admin", plus: true },
    ] },
  ];
  M.shell = function ({ active = "사건관리", tabs = ["사건관리"], tabOn, title = "", h = 880 } = {}, inner = "") {
    const side = MENU.map(
      (g) =>
        `<div class="grp" data-role="${[...new Set(g.items.flatMap((it) => it.role.split(" ")))].join(" ")}">${g.g}</div>` +
        g.items
          .map(
            (it) =>
              `<a class="${[].concat(active).includes(it.t) ? "on" : ""} ${it.plus ? "plus" : ""}" data-role="${it.role}">${it.t}${it.cnt ? `<span class="cnt">${it.cnt}</span>` : ""}</a>`
          )
          .join("")
    ).join("");
    const whos = Object.entries(M.ROLES)
      .map(
        ([k, r]) =>
          `<span class="who" data-role="${k}"><span style="text-align:right"><b style="display:block;color:var(--fg2);font-size:12px">${r.who}</b>${r.org}</span><span class="chip blue">${r.label}</span><span class="avatar">${r.who[0]}</span></span>`
      )
      .join("");
    const tabHtml = tabs.map((t) => `<span class="tab ${t === (tabOn || [].concat(active)[0]) ? "on" : ""}">${t}<span class="x">✕</span></span>`).join("");
    return `<div class="app" style="min-height:${h}px">
      <div class="topnav">
        <span class="emblem">${SVG_SHIELD}</span>
        <span class="agency"><b>경찰청 과학수사</b><small>FOOTWEAR FORENSICS · 족윤적 감정</small></span>
        <span class="divider"></span><span class="page-title">${title || [].concat(active)[0]}</span>
        <span class="spacer"></span>
        <span class="inp" style="width:260px;color:var(--dim)">⌕ 감정번호·문서번호·신발번호 바로 찾기</span>
        ${whos}
      </div>
      <div class="mdi">${tabHtml}</div>
      <div class="body"><nav class="side"><h5>족윤적</h5>${side}</nav><div class="content">${inner}</div></div>
    </div>`;
  };

  /* ── SCAS 원래 화면(라이트 와이어프레임) 셸 ── */
  const SCAS_TREE = [
    ["사건관리 ▾", 0], ["사건관리", 1], ["용의자관리", 1], ["문양관리 ▸", 0], ["문양검색 ▸", 0], ["문양대조 ▸", 0],
    ["감정서관리 ▸", 0], ["족윤적관리 ▸", 0], ["족윤적감정 역량평가", 0],
  ];
  M.scasShell = function ({ treeOn = "사건관리", tree = SCAS_TREE, tabOn = "사건관리", tabs, h = 640 } = {}, inner = "") {
    const tb = tabs || ["사건관리", "시험품질경영절차서", "시험품질경영지침서", "감정서작성", "족윤적 검증", "결재 대기함", "수신 문서함", "문서접수대장"];
    return `<div class="scas" style="min-height:${h}px">
      <div class="gnb"><span class="logo">SCAS<em>+</em></span><span>현장감식</span><span>사건조회</span><span>몽타주</span><span class="on">족윤적</span><span>특수감식</span><span>KOLAS</span><span>통합증거물</span><span>통합감정의뢰</span><span>통계</span><span>모니터링</span><span>전자결재</span></div>
      <div class="tabs">${tb.map((t) => `<span class="${t === tabOn ? "on" : ""}">${t} ×</span>`).join("")}</div>
      <div class="wrap"><div class="tree">${tree.map(([t, sub]) => `<div class="${sub ? "sub" : ""} ${t === treeOn ? "on" : ""}">${sub ? "▪ " : "📁 "}${t}</div>`).join("")}</div>
      <div class="work" style="min-height:${h - 70}px">${inner}</div></div></div>`;
  };
  M.pain = (x, y, html, w = 230) => `<div class="scas-pain" style="left:${x}px;top:${y}px;max-width:${w}px">${html}</div>`;

  /* ── 렌더 ── */
  const KIND = { keep: "SCAS 유지", better: "개선", plus: "+α 신규", voice: "인터뷰" };
  M.KIND = KIND;

  M.render = function () {
    const root = document.getElementById("screens");
    const toc = document.getElementById("toc-screens");
    M.screens.forEach((s) => {
      toc.insertAdjacentHTML(
        "beforeend",
        `<a href="#${s.id}" class="${s.plus ? "plus" : ""}"><span class="mono">${s.code}</span>${M.esc(s.title)}</a>`
      );
      const refs = (s.refs || [])
        .map((r) => `<span class="chip-ref ${r.voice ? "v" : ""}">${M.esc(r.t)}${r.v ? ` · <span class="mono">${M.esc(r.v)}</span>` : ""}</span>`)
        .join("");
      const notes = (s.notes || [])
        .map(
          (n) => `<div class="note">${M.pin(n.n, n.kind)}<b><span class="kind ${n.kind}">${KIND[n.kind]}</span>${M.esc(n.title)}</b>
            <p>${n.text}${n.src ? ` <span class="src">— ${M.esc(n.src)}</span>` : ""}</p></div>`
        )
        .join("");
      root.insertAdjacentHTML(
        "beforeend",
        `<section class="sec" id="${s.id}">
          <div class="sec-head">
            <div><div class="code">${s.code}${s.group ? ` · ${M.esc(s.group)}` : ""}</div>
              <h2>${M.esc(s.title)}${s.plus ? '<span class="plus">+α</span>' : ""}</h2>
              <div class="ref">${refs}</div></div>
            <div class="seg" role="group" aria-label="${M.esc(s.title)} 보기 전환">
              ${s.scas ? `<button class="is-scas" data-show="scas" aria-pressed="false">SCAS 지금</button>` : ""}
              <button data-show="ours" aria-pressed="true">개선안</button>
            </div>
          </div>
          ${s.lead ? `<p class="sec-lead">${s.lead}</p>` : ""}
          <div class="viewport">
            ${s.scas ? `<div class="frame" data-frame="scas" hidden>${s.scas()}</div>` : ""}
            <div class="frame" data-frame="ours">${s.ours()}</div>
          </div>
          <div class="notes">${notes}</div>
        </section>`
      );
    });

    /* 화면별 SCAS | 개선안 전환 */
    root.addEventListener("click", (e) => {
      const b = e.target.closest(".seg button[data-show]");
      if (!b) return;
      const sec = b.closest(".sec");
      sec.querySelectorAll(".seg button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      sec.querySelectorAll(".frame").forEach((f) => (f.hidden = f.dataset.frame !== b.dataset.show));
    });

    /* 기능 대조표: 모든 화면의 주석을 한 표로 */
    const rows = M.screens
      .flatMap((s) => (s.notes || []).map((n) => ({ s, n })))
      .map(
        ({ s, n }) => `<tr><td class="mono" style="white-space:nowrap"><a href="#${s.id}" style="color:var(--blue)">${s.code}</a></td>
          <td>${M.esc(s.title)}</td><td>${M.pin(n.n, n.kind)}</td><td class="tag"><span class="kind ${n.kind}" style="font:600 11px var(--font-mono)">${KIND[n.kind]}</span></td>
          <td><b>${M.esc(n.title)}</b><br><span style="color:var(--mute)">${n.text}</span></td><td style="color:var(--dim)">${M.esc(n.src || "")}</td></tr>`
      )
      .join("");
    const gap = document.getElementById("gap-body");
    if (gap) gap.innerHTML = rows;
    const counts = { keep: 0, better: 0, plus: 0, voice: 0 };
    M.screens.forEach((s) => (s.notes || []).forEach((n) => counts[n.kind]++));
    const cnt = document.getElementById("gap-count");
    if (cnt) cnt.textContent = `SCAS 유지 ${counts.keep} · 개선 ${counts.better} · +α 신규 ${counts.plus} · 인터뷰 근거 ${counts.voice}`;
  };

  /* 보는 사람(역할) 전환 */
  M.setViewer = function (role) {
    document.body.dataset.viewer = role;
    document.querySelectorAll("#viewer button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.viewer === role)));
    const r = M.ROLES[role];
    const hint = document.getElementById("viewer-hint");
    if (hint) hint.textContent = `${r.label}: ${r.hint}`;
    try { localStorage.setItem("scas-mockup-viewer", role); } catch (e) { /* 저장 불가 환경은 무시 */ }
  };
})();
