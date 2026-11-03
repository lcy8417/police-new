/* S00 로그인 — SCAS 영상에는 로그인 장면이 없다(이미 로그인된 상태로 촬영).
   r3: 왼쪽 큰 칸에 「AI 감정 시연」을 돌린다 — 현장 족적 → 이진화·문양 추출 → 신발 DB 검색·리랭킹 → 1:1 정밀 대조 → 감정서 초안.
   한 바퀴 CY초 동안 CSS 애니메이션만으로 움직인다(스크립트 없음). 움직임 줄이기 설정이면 mockup.css가 애니메이션을 끄고, 각 요소는 "다 끝난 상태"로 보인다.
   오른쪽 칸 = police-new 현행 로그인 카드(아이디·비밀번호·로그인) + 보안 안내 + 역할별 첫 화면. 수치는 모두 예시(S05·S06·S09 화면과 같은 값). */
(function () {
  const { pin, apin, sole, picon } = M;

  /* 작은 선 아이콘(장식용, 색은 currentColor) */
  const ICO = {
    user: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>`,
    lock: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`,
    eye: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>`,
    net: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>`,
    shield: `<svg viewBox="0 0 24 24" width="22" height="22" style="width:22px;height:22px" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5l8-3z"/><path d="M8.5 12.5l2.4 2.3 4.6-5"/></svg>`,
  };

  /* 역할별로 로그인 뒤 처음 들어가는 화면(core.js MENU의 data-role과 같은 묶음) */
  const ROLE_MENUS = {
    investigator: { hint: "의뢰·진행 확인", first: "사건관리 (우리 청 의뢰)", pin: 5 },
    analyst: { hint: "검색·판단·교차 검증·감정서", first: "사건관리 (내 담당)" },
    verifier: { hint: "감정서 결재", first: "결재 대기함" },
    admin: { hint: "계정·권한·기록·모델", first: "사용자 관리" },
  };

  /* ── 시연 타임라인 ──
     한 바퀴 CY초. 단계마다 [시작%, 끝%] 구간에 해당 카드가 빛나고, 위 단계 줄의 막대가 찬다. 94~100%에 전부 사라졌다가 다시 시작. */
  const CY = 14;
  const STEPS = [
    { t: "현장 족적", sub: "업로드", s: 0, e: 8, time: "—", go: "s02" },
    { t: "이진화", sub: "배경 제거", s: 8, e: 22, time: "0.4초", go: "s03" },
    { t: "문양 추출", sub: "상·중·하", s: 22, e: 34, time: "1.2초", go: "s04" },
    { t: "신발 검색", sub: "리랭킹", s: 34, e: 56, time: "2.1초", go: "s05" },
    { t: "1:1 정밀 대조", sub: "근거·신뢰도", s: 56, e: 76, time: "1.6초", go: "s06" },
    { t: "감정서 초안", sub: "1–8항 자동", s: 76, e: 92, time: "3.8초", go: "s09" },
  ];

  function ours() {
    /* 키프레임은 렌더할 때마다 새로 모은다. 요소마다 같은 CY초·같은 시작점이라 서로 어긋나지 않는다. */
    const K = [];
    const anim = (frames, ease = "linear") => {
      const n = `lg${K.length + 1}`;
      K.push(`@keyframes ${n}{${frames}}`);
      return `animation:${n} ${CY}s ${ease} infinite;`;
    };
    const appear = (at) => anim(`0%,${at}%{opacity:0;transform:translateY(5px)}${at + 2}%,94%{opacity:1;transform:none}100%{opacity:0}`, "ease-out");
    const grow = (at, w, dur = 6) => anim(`0%,${at}%{width:0;opacity:1}${at + dur}%,94%{width:${w}%;opacity:1}100%{width:${w}%;opacity:0}`, "ease-out");
    const glow = (s, e) =>
      anim(`0%,${s}%{border-color:var(--line);box-shadow:none}${s + 1}%,${e}%{border-color:#1d6b62;box-shadow:0 0 0 1px #1d4a44,0 0 34px rgba(45,212,191,.16)}${e + 1}%,100%{border-color:var(--line);box-shadow:none}`);
    const draw = (at, dur = 5) => anim(`0%,${at}%{stroke-dashoffset:1;opacity:1}${at + dur}%,94%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}`, "ease-out");
    const showAfter = (at) => anim(`0%,${at}%{opacity:0}${at + 2}%,100%{opacity:1}`);
    const hideAfter = (at) => anim(`0%,${at}%{opacity:1}${at + 2}%,100%{opacity:0}`);

    /* ── 단계 줄 ── */
    const rail = STEPS.map((st, i) => {
      const lab = anim(`0%,${st.s}%{color:var(--dim)}${st.s + 0.5}%,${st.e}%{color:var(--teal)}${st.e + 0.5}%,95%{color:var(--fg2)}100%{color:var(--dim)}`);
      return `<a href="#${st.go}" style="display:grid;gap:5px;min-width:0;color:inherit;text-decoration:none">
        <span style="display:flex;align-items:baseline;gap:6px;color:var(--fg2);${lab}">
          <b class="mono" style="font-size:11px">0${i + 1}</b><b style="font-size:12.5px;white-space:nowrap">${st.t}</b>
          <span class="mono" style="margin-left:auto;color:var(--dim);font-size:10.5px">${st.time}</span>
        </span>
        <span style="position:relative;height:3px;border-radius:2px;background:var(--line)"><span style="position:absolute;inset:0 auto 0 0;width:100%;border-radius:2px;background:linear-gradient(90deg,var(--blue2),var(--teal));${anim(`0%,${st.s}%{width:0}${st.e}%,95%{width:100%}100%{width:0}`)}"></span></span>
        <span style="display:flex;justify-content:space-between;color:var(--dim);font-size:10.5px"><span>${st.sub}</span><span class="mono">${st.go.toUpperCase()}</span></span>
      </a>`;
    }).join("");

    /* 카드 틀: 단계 구간 동안 청록 테두리로 빛난다 */
    const card = (w, s, e, step, title, body, arrow = true) => `<div style="position:relative;width:${w}px;display:grid;grid-template-rows:auto 1fr;gap:10px;padding:12px;border:1px solid var(--line);border-radius:12px;background:var(--panel2);${glow(s, e)}">
        <div style="display:flex;align-items:center;gap:7px"><span class="mono" style="color:var(--dim);font-size:10.5px">${step}</span><b style="font-size:13px">${title}</b></div>
        ${body}
        ${arrow ? `<span aria-hidden="true" style="position:absolute;right:-19px;top:50%;z-index:2;display:grid;place-items:center;width:24px;height:24px;margin-top:-12px;border:1px solid var(--line3);border-radius:50%;background:var(--bg);color:var(--teal);font:600 12px var(--font-mono)">›</span>` : ""}
      </div>`;

    /* ① 현장 족적 → 이진화 → 문양 추출 */
    const ZONES = [
      { z: "상", icon: "n21_15", name: "타원 배열", top: 0, h: 35, at: 24 },
      { z: "중", icon: "n32_04", name: "헤링본", top: 35, h: 32, at: 27 },
      { z: "하", icon: "n21_05", name: "사각 배열", top: 67, h: 33, at: 30 },
    ];
    const roi = ZONES.map((z) => `<span style="position:absolute;left:6%;right:6%;top:calc(${z.top}% + 3px);height:calc(${z.h}% - 6px);border:1.5px dashed var(--teal);border-radius:6px;${appear(z.at - 1)}"><b class="mono" style="position:absolute;left:3px;top:1px;color:var(--teal);font-size:9.5px;text-shadow:0 0 3px #000">${z.z}</b></span>`).join("");
    const chips = ZONES.map((z) => `<div style="display:grid;gap:4px;align-content:center;${appear(z.at)}">
        <span style="display:flex;align-items:center;gap:6px">${picon(z.icon, "sm")}<b style="color:var(--teal);font-size:12px">${z.z}</b></span>
        <span style="color:var(--fg2);font-size:11.5px;line-height:1.3">${z.name}</span>
        <span class="mono" style="color:var(--dim);font-size:10px">AI 제안</span>
      </div>`).join("");
    const cardA = card(214, 0, 34, "01–03", "이진화 · 문양 추출", `
      <div style="display:grid;grid-template-columns:92px minmax(0,1fr);gap:10px">
        <div style="position:relative;height:242px;border-radius:8px;overflow:hidden;border:1px solid var(--line);background:#121418">
          ${sole({ kind: "scene", zones: ["dots", "herring", "grid"], cut: true })}
          <div style="position:absolute;inset:0;${anim(`0%,8%{clip-path:inset(0 0 100% 0);opacity:1}22%,94%{clip-path:inset(0 0 0 0);opacity:1}100%{clip-path:inset(0 0 0 0);opacity:0}`)}">${sole({ kind: "bin", zones: ["dots", "herring", "grid"] })}</div>
          <span aria-hidden="true" style="position:absolute;left:-4px;right:-4px;height:2px;top:100%;opacity:0;background:var(--teal);box-shadow:0 0 12px 3px rgba(45,212,191,.7);${anim(`0%,8%{top:0;opacity:0}9%{opacity:1}22%{top:100%;opacity:1}23%,100%{top:100%;opacity:0}`)}"></span>
          ${roi}
          <span class="mono" style="position:absolute;left:5px;bottom:4px;padding:1px 5px;border-radius:4px;background:rgba(5,8,13,.8);color:var(--fg2);font-size:9.5px">IMG_03.jpg</span>
        </div>
        <div style="display:grid;grid-template-rows:repeat(3,1fr);gap:4px">${chips}</div>
      </div>`);

    /* ② 신발 DB 검색 → 리랭킹: 문양 검색만으로 137위였던 정답(305657)이 AI 리랭킹 뒤 1위로 올라온다(S05와 같은 값) */
    const RH = 44;
    const ROWS = [
      { no: "305657", sim: 61.2, from: 4, to: 0, r0: "137위", r1: "1위", ans: true },
      { no: "281904", sim: 61.0, from: 0, to: 1, r0: "1위", r1: "2위" },
      { no: "299310", sim: 60.8, from: 1, to: 2, r0: "2위", r1: "3위" },
      { no: "274466", sim: 60.7, from: 2, to: 3, r0: "3위", r1: "4위" },
      { no: "301122", sim: 60.1, from: 3, to: 4, r0: "4위", r1: "5위" },
    ];
    const ZS = [["blocks", "wave", "grid"], ["herring", "lines", "blocks"], ["dots", "blocks", "lines"], ["tri", "herring", "grid"]];
    const rows = ROWS.map((r, i) => {
      const enter = 36 + r.from * 2;
      const move = anim(`0%,46%{top:${r.from * RH}px}52%,100%{top:${r.to * RH}px}`, "cubic-bezier(.6,0,.2,1)");
      const hl = r.ans ? anim(`0%,50%{border-color:var(--line2);background:transparent}54%,94%{border-color:#1d6b62;background:var(--teal-bg)}100%{border-color:var(--line2);background:transparent}`) : "";
      return `<div style="position:absolute;left:0;right:0;top:${r.to * RH}px;height:${RH - 4}px;${move}">
        <div style="display:grid;grid-template-columns:22px 36px minmax(0,1fr) auto;gap:7px;align-items:center;height:100%;padding:0 6px;border:1px solid ${r.ans ? "#1d6b62" : "var(--line2)"};border-radius:8px;background:${r.ans ? "var(--teal-bg)" : "transparent"};${hl}${appear(enter)}">
          <span style="height:34px;border-radius:4px;overflow:hidden">${sole({ kind: "shoe", zones: r.ans ? ["dots", "herring", "grid"] : ZS[i - 1] })}</span>
          <span style="display:grid;font:600 11px var(--font-mono);color:${r.ans ? "var(--teal)" : "var(--fg2)"}"><span style="grid-area:1/1;opacity:0;${r.ans ? "color:var(--amber);" : ""}${hideAfter(48)}">${r.r0}</span><span style="grid-area:1/1;${showAfter(48)}">${r.r1}</span></span>
          <span style="display:grid;gap:4px;min-width:0">
            <span class="mono" style="font-size:11px;color:var(--fg)">${r.no}</span>
            <span style="height:3px;border-radius:2px;background:var(--line)"><span style="display:block;height:100%;width:${(r.sim - 50) * 8}%;border-radius:2px;background:${r.ans ? "var(--teal)" : "var(--dim)"};${grow(enter, (r.sim - 50) * 8)}"></span></span>
          </span>
          <span class="mono" style="font-size:10.5px;color:${r.ans ? "var(--teal)" : "var(--mute)"}">${r.sim.toFixed(1)}</span>
        </div>
        ${r.ans ? `<span class="chip teal num" style="position:absolute;right:-4px;top:-9px;height:17px;padding:0 5px;font-size:9.5px;${appear(52)}">▲136</span>` : ""}
      </div>`;
    }).join("");
    const cardB = card(226, 34, 56, "04", "신발 DB 검색", `
      <div style="display:grid;gap:9px;align-content:start">
        <div style="display:grid;gap:5px;padding:8px 9px;border-radius:8px;background:var(--panel3);font-size:11px">
          <span style="display:flex;justify-content:space-between;color:var(--mute)"><span>신발 DB</span><b class="mono" style="color:var(--fg2)">128,406켤레</b></span>
          <span style="height:3px;border-radius:2px;background:var(--line)"><span style="display:block;height:100%;width:100%;border-radius:2px;background:var(--blue2);${grow(34, 100, 4)}"></span></span>
          <span style="display:flex;justify-content:space-between;color:var(--mute)"><span>문양 일치 후보</span><b class="mono" style="color:var(--fg2)">857건</b></span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;font-size:11px">
          <span style="color:var(--mute)">AI 리랭킹 순위</span>
          <span class="ai-mark" style="${anim(`0%,45%{opacity:.35}47%,53%{opacity:1;text-shadow:0 0 10px rgba(45,212,191,.9)}55%,100%{opacity:1}`)}">● RERANK</span>
        </div>
        <div style="position:relative;height:${RH * 5}px">${rows}</div>
      </div>`);

    /* ③ 1:1 정밀 대조: 이진화 족적 ↔ 1위 신발, 대응점 선 + 히트맵 + 종합 신뢰도(S06과 같은 값) */
    const PTS = [[40, 40], [64, 70], [30, 128], [70, 150], [44, 214], [60, 242]];
    const lx = (x) => 18 + x * 0.644;
    const lines = PTS.map(([x, y], i) => {
      const ok = i !== 3;
      const yy = (y * 0.644).toFixed(1);
      const c = ok ? "var(--teal)" : "var(--amber)";
      return `<g style="${appear(57 + i * 2)}"><line x1="${lx(x).toFixed(1)}" y1="${yy}" x2="${(122 + lx(x)).toFixed(1)}" y2="${yy}" pathLength="1" stroke="${c}" stroke-width="1.2" stroke-dasharray="${ok ? "1" : "0.04 0.03"}" style="${ok ? draw(57 + i * 2) : ""}" opacity=".9"/>
        <circle cx="${lx(x).toFixed(1)}" cy="${yy}" r="2.6" fill="none" stroke="${c}" stroke-width="1.2"/><circle cx="${(122 + lx(x)).toFixed(1)}" cy="${yy}" r="2.6" fill="none" stroke="${c}" stroke-width="1.2"/></g>`;
    }).join("");
    const METRICS = [["Inlier Ratio", "0.72"], ["NCC", "0.81"], ["Wasserstein", "0.14"], ["Mutual Info.", "1.36"]];
    const cardC = card(246, 56, 76, "05", "1:1 정밀 대조", `
      <div style="display:grid;gap:10px;align-content:start">
        <div style="position:relative;display:grid;grid-template-columns:100px 100px;gap:22px;height:170px">
          <span style="border-radius:8px;overflow:hidden;border:1px solid var(--line);background:#fff">${sole({ kind: "bin", zones: ["dots", "herring", "grid"] })}</span>
          <span style="position:relative;border-radius:8px;overflow:hidden;border:1px solid #1d4a44;background:#e9ecf0">${sole({ kind: "shoe", zones: ["dots", "herring", "grid"] })}
            <span style="position:absolute;inset:0;${anim(`0%,62%{opacity:0}68%,94%{opacity:1}100%{opacity:0}`)}">${sole({ kind: "shoe", zones: ["dots", "herring", "grid"], heat: true })}</span></span>
          <svg viewBox="0 0 222 170" width="222" height="170" style="position:absolute;inset:0;overflow:visible" aria-hidden="true">${lines}</svg>
          <span class="mono" style="position:absolute;left:4px;top:4px;padding:0 4px;border-radius:3px;background:rgba(5,8,13,.75);color:var(--fg2);font-size:9px">현장</span>
          <span class="mono" style="position:absolute;left:126px;top:4px;padding:0 4px;border-radius:3px;background:rgba(5,8,13,.75);color:var(--teal);font-size:9px">305657</span>
        </div>
        <div style="display:grid;grid-template-columns:92px minmax(0,1fr);gap:10px;align-items:center">
          <div style="position:relative;width:92px;height:56px">
            <svg viewBox="0 0 120 68" width="92" height="52" aria-hidden="true"><path d="M12 62A48 48 0 0 1 108 62" fill="none" stroke="var(--line3)" stroke-width="9" stroke-linecap="round"/>
              <path d="M12 62A48 48 0 0 1 108 62" fill="none" stroke="var(--teal)" stroke-width="9" stroke-linecap="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="13" style="${anim(`0%,63%{stroke-dashoffset:100;opacity:1}73%,94%{stroke-dashoffset:13;opacity:1}100%{stroke-dashoffset:13;opacity:0}`, "ease-out")}"/></svg>
            <b class="mono" style="position:absolute;left:0;right:0;bottom:0;text-align:center;font-size:17px;${appear(70)}">87%</b>
          </div>
          <div style="display:grid;gap:3px;font-size:10.5px;${appear(68)}">${METRICS.map(([k, v]) => `<span style="display:flex;justify-content:space-between;gap:6px"><span style="color:var(--mute)">${k}</span><b class="mono" style="color:var(--teal)">${v}</b></span>`).join("")}</div>
        </div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;${appear(72)}"><span class="chip green" style="height:19px;font-size:10px">대응점 5 / 6</span><span class="chip amber" style="height:19px;font-size:10px">중 1곳 마모 차이</span></div>
      </div>`);

    /* ④ 감정서 초안 자동 작성: KOLAS 양식 1–8항이 한 줄씩 채워지고, 발견 이미지가 붙는다(S09) */
    const ITEMS = [["1. 의뢰 관서", 70], ["2. 감정물", 86], ["3. 감정 사항", 62], ["4. 감정 방법", 92], ["5. 감정 결과", 78], ["6. 감정 의견", 88]];
    const paperLines = ITEMS.map(([t, w], i) => `<div style="display:grid;gap:2px;${appear(77 + i * 2)}">
        <span style="color:#1d2a3d;font-size:8.5px;font-weight:700;line-height:1.2">${t}</span>
        <span style="display:block;height:3px;border-radius:2px;background:#b7bfcc;width:${w}%;${grow(77 + i * 2, w, 3)}"></span>
        ${i === 4 ? "" : ""}
      </div>`).join("");
    const cardD = card(170, 76, 92, "06", "감정서 초안", `
      <div style="display:grid;gap:8px;align-content:start">
        <div style="position:relative;display:grid;gap:6px;align-content:start;height:272px;padding:10px 10px 8px;border-radius:4px;background:#f4f2ec;box-shadow:0 10px 26px rgba(0,0,0,.45)">
          <b style="text-align:center;color:#111;font-size:12px;letter-spacing:.5em">감정서</b>
          <span class="mono" style="text-align:center;color:#5a6474;font-size:8px">00001-25-0646 · 주거침입</span>
          ${paperLines}
          <div style="display:flex;gap:4px;${appear(89)}">
            <span style="width:26px;height:44px;border:1px solid #c9ced8;background:#fff">${sole({ kind: "bin", zones: ["dots", "herring", "grid"] })}</span>
            <span style="width:26px;height:44px;border:1px solid #c9ced8;background:#e9ecf0">${sole({ kind: "shoe", zones: ["dots", "herring", "grid"] })}</span>
            <span style="align-self:end;color:#5a6474;font-size:8px">발견 이미지 첨부</span>
          </div>
          <span style="position:absolute;right:8px;bottom:10px;padding:2px 6px;border:1.5px solid #c0392b;border-radius:4px;color:#c0392b;font:700 9px var(--font-ui);transform:rotate(-8deg);${anim(`0%,89%{opacity:0;transform:rotate(-8deg) scale(1.6)}91%,94%{opacity:1;transform:rotate(-8deg) scale(1)}100%{opacity:0;transform:rotate(-8deg) scale(1)}`, "ease-out")}">초안</span>
        </div>
        <span style="color:var(--mute);font-size:10.5px;line-height:1.45">감정관이 고치고<br>교차 검증 → 결재</span>
      </div>`, false);

    const roleRows = Object.entries(M.ROLES)
      .map(([k, r]) => {
        const m = ROLE_MENUS[k];
        return `<div style="display:grid;grid-template-columns:78px minmax(0,1fr) auto;gap:8px;align-items:center;padding:7px 10px;border:1px solid var(--line2);border-radius:9px;background:var(--panel2)">
          <span class="chip blue" style="justify-content:center">${r.label}</span>
          <span style="display:grid;min-width:0;line-height:1.35"><b style="color:var(--fg2);font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">→ ${m.first}</b><span style="color:var(--dim);font-size:11px">${m.hint}</span></span>
          <span style="display:flex;align-items:center;gap:6px">${m.pin ? pin(m.pin, "voice") : ""}<span class="chip teal" data-role="${k}" style="height:19px;font-size:10px"><span class="dot"></span>지금</span></span>
        </div>`;
      })
      .join("");

    const field = (label, icon, value, extra = "") => `<label style="display:grid;gap:6px">
        <span style="color:var(--fg2);font-size:12.5px;font-weight:600">${label}</span>
        <span class="inp w100" style="height:42px;padding:0 12px;gap:10px;${extra}"><span style="color:var(--dim);display:inline-flex">${icon}</span>${value}</span>
      </label>`;

    return `<div style="position:relative;width:1440px;height:916px;overflow:hidden;background:var(--bg)">
      <style>${K.join("")}</style>
      <!-- 바탕: 점 격자 + 빛 번짐 2개 + 큰 밑창 윤곽(현행 police-new AuthScreen 장식 그대로에 밑창만 더함) -->
      <div style="position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(color-mix(in srgb,var(--blue) 18%,transparent) 1px,transparent 1px);background-size:24px 24px;-webkit-mask-image:radial-gradient(ellipse at 35% 45%,#000 0%,transparent 75%);mask-image:radial-gradient(ellipse at 35% 45%,#000 0%,transparent 75%)"></div>
      <div style="position:absolute;top:-200px;left:12%;width:620px;height:520px;border-radius:50%;background:color-mix(in srgb,var(--blue3) 16%,transparent);filter:blur(90px);pointer-events:none"></div>
      <div style="position:absolute;right:-140px;bottom:-180px;width:480px;height:480px;border-radius:50%;background:color-mix(in srgb,var(--teal) 8%,transparent);filter:blur(90px);pointer-events:none"></div>
      <svg viewBox="0 0 100 264" aria-hidden="true" style="position:absolute;right:300px;top:-60px;width:330px;height:870px;opacity:.05;transform:rotate(14deg);pointer-events:none"><path d="M50 6C78 6 92 32 92 72C92 112 80 132 78 152C76 176 84 202 82 226C80 250 64 258 50 258C36 258 20 250 18 226C16 202 24 176 22 152C20 132 8 112 8 72C8 32 22 6 50 6Z" fill="none" stroke="var(--blue)" stroke-width=".5"/><path d="M50 18C72 18 82 40 82 72C82 104 72 124 70 150" fill="none" stroke="var(--blue)" stroke-width=".3" stroke-dasharray="2 2"/></svg>

      <!-- 위 띠: 기관 표시 + 내부망 -->
      <div style="position:relative;z-index:1;display:flex;align-items:center;gap:12px;height:64px;padding:0 44px;border-bottom:1px solid var(--line2)">
        <span class="emblem" style="width:36px;height:36px;color:var(--blue)">${ICO.shield}</span>
        <span style="display:grid;line-height:1.25"><b style="font-size:14px">경찰청 과학수사 · 족윤적 감정 플랫폼</b><span class="crumb" style="color:var(--blue);letter-spacing:.22em">FORENSIC FOOTWEAR AI PLATFORM</span></span>
        <span style="margin-left:auto;display:flex;gap:8px;align-items:center;color:var(--mute);font-size:11.5px"><span class="chip"><span style="color:var(--green)">●</span> 내부망 연결됨</span><span class="mono" style="color:var(--dim)">v3.0 · 모델 FP-2025.07</span></span>
      </div>

      <div style="position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:40px;padding:26px 44px 0">

        <!-- 왼쪽: 소개 + AI 감정 시연 -->
        <div style="display:grid;gap:18px;align-content:start;min-width:0">
          <div class="pinbox" style="display:flex;align-items:flex-end;gap:28px">
            ${apin(1, "better", true)}
            <div style="min-width:0">
              <h1 style="margin:0;font-size:36px;line-height:1.18;letter-spacing:-.02em;text-wrap:balance">현장 족적 한 장으로<br><span style="background:linear-gradient(90deg,var(--blue),var(--teal));-webkit-background-clip:text;background-clip:text;color:transparent">신발 검색부터 감정서 초안까지</span></h1>
              <p style="margin:10px 0 0;color:var(--mute);font-size:13.5px;line-height:1.65;max-width:62ch">SCAS와 같은 메뉴·같은 순서로 일합니다. 이진화·문양 추출·검색·정밀 대조·감정서 초안은 AI가 먼저 해 두고, <b style="color:var(--fg2)">발견 판단과 서명은 감정관</b>이 합니다.</p>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,auto);gap:22px;margin-left:auto;padding-bottom:4px">
              ${[["857 → 10", "먼저 볼 후보"], ["상·중·하", "문양 자동 제안"], ["1–8항", "감정서 자동 채움"]].map(([v, t]) => `<span style="display:grid;gap:2px"><b class="mono" style="font-size:20px;color:var(--fg)">${v}</b><span style="color:var(--dim);font-size:11px;white-space:nowrap">${t}</span></span>`).join("")}
            </div>
          </div>

          <div class="panel tc pinbox" style="background:color-mix(in srgb,var(--panel) 92%,transparent)">
            ${apin(7, "plus")}
            <div class="panel-h"><span class="lbl">LIVE DEMO</span><span class="t">AI 감정 흐름 — 사건 00001-25-0646 · 현장 이미지 3번</span>
              <span class="r"><span style="display:inline-flex;align-items:center;gap:6px;color:var(--mute);font-size:11px"><span style="width:7px;height:7px;border-radius:50%;background:var(--red);box-shadow:0 0 8px var(--red);${anim(`0%,100%{opacity:1}50%{opacity:.25}`)}"></span>자동 재생 · 전체 <b class="mono" style="color:var(--fg2)">9.1초</b> (예시)</span></span></div>
            <div class="panel-b" style="display:grid;gap:14px;padding:14px 16px 16px">
              <div style="display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px">${rail}</div>
              <div style="display:flex;gap:14px;align-items:stretch">${cardA}${cardB}${cardC}${cardD}</div>
            </div>
          </div>
          <p style="margin:-6px 0 0;color:var(--dim);font-size:11px">화면 속 사건·신발·수치는 모두 예시입니다. AI 결과는 「추천」으로만 표시되며, 감정관이 확인하기 전에는 사건 결과에 들어가지 않습니다.</p>
        </div>

        <!-- 오른쪽: 로그인 카드 + 역할별 첫 화면 -->
        <div style="display:grid;gap:14px;align-content:start">
          <div class="panel tc" style="padding:26px 28px 20px;background:color-mix(in srgb,var(--panel) 95%,transparent);box-shadow:0 30px 80px rgba(0,0,0,.55)">
            <div style="position:absolute;left:40px;right:40px;top:0;height:1px;background:linear-gradient(90deg,transparent,var(--blue),transparent);opacity:.7"></div>
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px">
              <div style="display:grid;place-items:center;width:40px;height:40px;border-radius:10px;border:1px solid color-mix(in srgb,var(--blue) 40%,var(--panel));background:var(--blue-bg);color:var(--blue);box-shadow:0 0 24px rgba(37,99,235,.3)">${ICO.lock}</div>
              <div><h2 style="margin:0;font-size:20px">로그인</h2><p style="margin:0;color:var(--mute);font-size:12.5px">등록된 계정으로 로그인하세요.</p></div>
            </div>
            <div style="display:grid;gap:14px">
              ${field("아이디", ICO.user, `<span class="mono" style="color:var(--fg)">park0412</span>`)}
              ${field("비밀번호", ICO.lock, `<span style="color:var(--fg);letter-spacing:.3em">••••••••</span><span style="margin-left:auto;color:var(--dim);display:inline-flex">${ICO.eye}</span>`, "border-color:color-mix(in srgb,var(--red) 35%,var(--panel))")}
              <div style="display:flex;align-items:center;justify-content:space-between;color:var(--mute);font-size:12px">
                <span><span style="display:inline-block;width:14px;height:14px;margin-right:6px;vertical-align:-2px;border-radius:3px;background:var(--blue2)"></span>아이디 저장</span>
                <span style="color:var(--dim);font-size:11.5px">분실 시 관리자에게 초기화 요청</span>
              </div>
              <div class="pinbox" style="padding:8px 11px;border:1px solid color-mix(in srgb,var(--red) 35%,var(--panel));border-radius:8px;background:var(--red-bg);color:var(--fg2);font-size:12px;line-height:1.5">
                ${apin(2, "plus")}
                <b style="color:var(--red)">비밀번호가 맞지 않습니다.</b> 남은 시도 <b class="num">3</b>회<br>
                <span style="color:var(--mute)">5회 연속 틀리면 잠기고, 관리자만 풀 수 있습니다.</span>
              </div>
              <button class="btn pri" style="height:42px;justify-content:center;font-size:14px;font-weight:600">로그인</button>
            </div>
            <div class="pinbox" style="margin-top:16px;padding:12px 18px 0 0;border-top:1px solid var(--line2);display:grid;gap:6px;color:var(--dim);font-size:11.5px;line-height:1.5">
              ${apin(4, "plus")}
              <span>지난 로그인 <span class="mono" style="color:var(--fg2)">2025-07-24 17:58</span> · PC <span class="mono" style="color:var(--fg2)">10.14.43.***</span> · 그 뒤 실패 <b class="num" style="color:var(--amber)">2</b>회</span>
              <span class="pinbox" style="display:flex;gap:7px;align-items:flex-start;padding-right:10px">${apin(3, "plus")}<span style="color:var(--blue);display:inline-flex;margin-top:2px">${ICO.net}</span><span><b style="color:var(--fg2)">경찰 내부망 전용</b> · 조회·다운로드·출력까지 모든 사용 기록이 저장됩니다.</span></span>
            </div>
          </div>

          <div class="panel pinbox">
            ${apin(6, "plus")}
            <div class="panel-h"><span class="lbl">ROLES</span><span class="t">로그인하면 처음 열리는 화면</span></div>
            <div class="panel-b" style="display:grid;gap:6px;padding:10px 12px">${roleRows}</div>
          </div>
        </div>
      </div>
    </div>`;
  }

  M.add({
    id: "s00",
    code: "S00",
    group: "공통",
    title: "로그인",
    refs: [{ t: "police-new 현행 로그인(AuthScreen)" }, { t: "사업계획서 AI 기능·보안", v: "p13 · p16–19 · p36" }, { t: "인터뷰 결과 비교가 제일 오래", v: "5613 21:50", voice: true }, { t: "인터뷰 사건 자동 접수", v: "5613 11:31", voice: true }],
    lead: "r3: 첫 화면 왼쪽에 「AI 감정 시연」이 저절로 돌아갑니다 — 현장 족적이 이진화되고, 상·중·하 문양이 뽑히고, 신발 DB에서 137위였던 정답이 리랭킹으로 1위로 올라오고, 1:1 정밀 대조(대응점·히트맵·신뢰도 87%)를 거쳐 감정서 1–8항 초안이 채워집니다. 단계 줄의 S02~S09를 누르면 해당 화면으로 갑니다. 로그인 카드(현행 police-new 구조)와 보안 안내·역할별 첫 화면은 오른쪽에 모았습니다. SCAS 영상에는 로그인 장면이 없어 SCAS 화면은 생략합니다.",
    fit: {
      area: ["na", "SCAS 로그인 장면 없음 — 현행 police-new 로그인 카드는 그대로, 위치만 오른쪽 칸으로"],
      buttons: ["na", "현행 앱 그대로(아이디 저장 · 로그인)"],
      popup: ["na", "창 없음"],
      columns: ["na", "입력 칸 순서(아이디 → 비밀번호) 현행 그대로"],
    },
    ours,
    notes: [
      { n: 1, kind: "better", title: "첫 문장 = 이 플랫폼이 하는 일", text: "SCAS는 여러 업무가 한 시스템에 있어 첫 화면이 아무것도 말해 주지 않습니다. 우리 플랫폼은 족윤적 감정만 다루므로 「현장 족적 한 장으로 신발 검색부터 감정서 초안까지」를 첫 문장으로 둡니다. 오른쪽 숫자 3개는 목표입니다 — 857건을 다 넘기는 대신 먼저 볼 10건, 상·중·하 문양을 AI가 먼저 제안(감정관이 확인), 감정서 1–8항 자동 채움.", src: "5613 21:50–22:39 · 사업계획서 p13" },
      { n: 7, kind: "plus", title: "AI 감정 흐름 자동 시연(14초 반복)", text: "① 현장 족적 위로 스캔 선이 지나가며 이진화 → ② 상·중·하 영역에 문양(타원 배열·헤링본·사각 배열)이 「AI 제안」으로 붙음(감정관 확인 전) → ③ 신발 DB 128,406켤레에서 문양 일치 857건, AI 리랭킹으로 정답 305657이 137위 → 1위(▲136) → ④ 1:1 정밀 대조: 대응점 선, 히트맵, 지표 4개, 종합 신뢰도 87% → ⑤ 감정서 1–6항 줄이 채워지고 발견 이미지가 붙은 뒤 「초안」 도장. 숫자는 S05·S06·S09 화면과 같은 예시 값입니다. 움직임 줄이기 설정에서는 다 끝난 상태로 멈춰 보입니다.", src: "사업계획서 p13 · p36 · 발표 s14" },
      { n: 2, kind: "plus", title: "5회 연속 실패하면 잠금", text: "남은 시도 횟수를 오류 문구 안에 보여 줍니다. 잠긴 계정은 관리자가 「사용자 관리」의 잠금 해제로만 풉니다(S13).", src: "사업계획서 p16–19 계정 보안" },
      { n: 3, kind: "plus", title: "내부망 전용 · 기록 저장 안내", text: "내부망 PC에서만 열리고, 조회·다운로드·출력까지 모두 기록된다는 점을 로그인 전에 알립니다. 기록은 「사용·감사 기록」(S14)에서 봅니다.", src: "사업계획서 p16–19" },
      { n: 4, kind: "plus", title: "지난 로그인 · 실패 횟수", text: "내 계정이 언제, 어느 PC에서 마지막으로 쓰였는지와 그 뒤 실패 횟수를 보여 줍니다. 남이 내 계정을 시도했는지 본인이 먼저 알아챌 수 있습니다.", src: "사업계획서 p16 접속 기록" },
      { n: 5, kind: "voice", title: "수사관 첫 화면은 사건관리(사건 등록 아님)", text: "사건은 공문이 접수되면 목록에 자동으로 뜨는 것이 기본입니다. 그래서 수사관은 「사건 등록」이 아니라 우리 청 의뢰 사건관리로 들어갑니다. 「자동으로 문서를 접수하면 여기에 자동으로 뜨는 거죠」. 수사관이 직접 등록하는지는 열린 질문입니다.", src: "5613 11:31 · 19:55" },
      { n: 6, kind: "plus", title: "역할마다 다른 첫 화면", text: "수사관은 우리 청 사건관리, 감정관은 내 담당 사건관리(교차 검증 포함), 기술책임자는 결재 대기함, 관리자는 사용자 관리로 바로 들어갑니다. 위쪽 「보는 사람」을 바꾸면 해당 역할 줄에 「지금」 표시가 옮겨 갑니다.", src: "사업계획서 p16, p20 역할 기반 접근제어" },
    ],
  });
})();
