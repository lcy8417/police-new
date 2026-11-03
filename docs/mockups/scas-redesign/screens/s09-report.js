/* S09 감정서 작성 — SCAS 「감정서작성」 탭(S13) → 「결재문서정보」 팝업 + 문서 뷰어(S14) → 한글 편집기 별도 창(S15)
   (IMG_5613 14:37–16:07, 18:07–19:37)
   r2: 흐름 S07 → S08 교차 검증 → S09 감정서 → 결재. 목록 배치·결재회수 그대로, 결재문서정보는 팝업처럼.
       서명란 감정관(작성) · 감정관(교차 검증) · 기술책임자. AI는 「판독 문장 초안」만 */
(function () {
  const { pin, apin, sole } = M;

  const layer = ({ l, t, w, title, head = "" }, body) => `
    <div style="position:absolute;inset:0;z-index:5;background:rgba(5,8,13,.74)"></div>
    <div class="panel pinbox" style="position:absolute;left:${l}px;top:${t}px;width:${w}px;z-index:6;box-shadow:0 24px 70px rgba(0,0,0,.65)">
      <div class="panel-h" style="background:var(--blue-bg)"><span class="t">${title}</span>${head}<span class="r"><span style="color:var(--mute)">✕</span></span></div>
      ${body}
    </div>`;

  /* AI 판독 문장(청록 밑줄) + 근거 링크 */
  const ai = (html, src) => `<span class="ai-fill">${html}</span>${src ? `<sup style="margin-left:3px;color:var(--teal);font:600 10px var(--font-mono)">↗${src}</sup>` : ""}`;
  const key = (t) => `<b class="s09-key">${t}</b>`;
  /* r3: 감정관이 고친 곳(파란 밑줄 + 고친 사람) — AI 초안(청록 밑줄)과 구분 */
  const ed = (html, who) => `<span class="s09-ed">${html}<i>${who}</i></span>`;
  /* r3: 문서(종이) 전용 스타일 — 이 화면 안에서만 */
  const STYLE = `<style>
    .s09-key { color: var(--amber); }
    .s09-ed { color: var(--fg); background: rgba(74,158,255,.16); text-decoration: underline 1.5px #4a9eff; text-underline-offset: 3px; border-radius: 3px; }
    .s09-ed i { margin-left: 3px; padding: 0 4px; border-radius: 3px; background: #2563eb; color: #fff; font: 600 9px var(--font-ui); font-style: normal; vertical-align: 2px; text-decoration: none; display: inline-block; }
    .s09-paper { position: relative; border-radius: 3px; background: #f6f3ec; color: #1f2430; box-shadow: 0 18px 50px rgba(0,0,0,.55), 0 0 0 1px #cfc9bb; }
    .s09-paper .s09-key { color: #b4530a; }
    .s09-paper .s09-ed { color: #1e3a8a; background: rgba(37,99,235,.10); text-decoration-color: #2563eb; }
    .s09-paper .ai-fill { color: #0b3b36; background: rgba(45,212,191,.17); text-decoration-color: #0d9488; }
    .s09-paper sup { color: #0f766e !important; }
    .s09-paper del { color: #9a9486; text-decoration: line-through 1.2px #b91c1c; }
    .s09-sec { display: grid; grid-template-columns: 112px minmax(0,1fr); gap: 12px; padding: 6px 0; border-bottom: 1px solid #ddd7ca; font-size: 12px; line-height: 1.55; }
    .s09-sec > b { color: #1f2430; }
    .s09-tbl { width: 100%; border-collapse: collapse; font-size: 11.5px; }
    .s09-tbl th { background: #ebe6da; color: #4b4638; font-weight: 600; padding: 5px 7px; border: 1px solid #cfc9bb; text-align: left; }
    .s09-tbl td { padding: 6px 7px; border: 1px solid #d9d3c6; color: #1f2430; }
    .s09-tag { display: inline-flex; align-items: center; gap: 3px; height: 17px; padding: 0 6px; border-radius: 999px; font: 600 9.5px var(--font-ui); white-space: nowrap; }
    .s09-wm { position: absolute; right: 60px; top: 360px; transform: rotate(-22deg); font: 800 92px/1 serif; letter-spacing: .25em; color: rgba(180,83,10,.06); pointer-events: none; }
    .s09-seg { flex: 1; height: 8px; border-radius: 2px; }
  </style>`;

  const sideShoe = () =>
    `<svg viewBox="0 0 200 90" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-label="측면 이미지(가짜 예시)"><rect width="200" height="90" fill="#e9ecf0"/>
      <path d="M20 62C20 40 40 30 70 28L95 18C110 12 125 22 130 32C150 36 175 44 182 56L182 68L20 70Z" fill="#5b6472" stroke="#3a3f48"/>
      <path d="M18 70L184 70L182 76L22 78Z" fill="#2f343b"/><path d="M98 24L120 40M92 30L114 44" stroke="#cfd5de" stroke-width="2"/></svg>`;

  const WAIT = [
    { no: "00001-25-0646", doc: "SCAS수사부-2944", nm: "주거침입", req: "대구청", occ: "2025-07-19", reg: "2025-07-23", prog: "작성 중", cross: "의견 일치 · 김○○", cur: true },
    { no: "00001-25-0640", doc: "SCAS수사부-2911", nm: "절도", req: "부산청", occ: "2025-07-15", reg: "2025-07-22", prog: "결재 중", cross: "의견 일치 · 박○○" },
    { no: "00001-25-0633", doc: "SCAS수사부-2870", nm: "강도", req: "서울청", occ: "2025-07-12", reg: "2025-07-21", prog: "교차 검증 중", cross: "이○○ 접수함" },
    { no: "00001-25-0612", doc: "SCAS수사부-2755", nm: "절도", req: "인천청", occ: "2025-07-10", reg: "2025-07-16", prog: "결재완료", cross: "의견 일치 · 김○○", out: true },
  ];
  const progChip = (p) =>
    p === "작성 중" ? `<span class="chip blue">작성 중</span>` : p === "결재 중" ? `<span class="chip amber">결재 중</span>` : p === "교차 검증 중" ? `<span class="chip">교차 검증 중</span>` : `<span class="chip green">결재완료</span>`;

  const RULES = [
    { ok: true, t: "족적 기본정보", d: "1·2항, 감정물 3점 + 해시값" },
    { ok: true, t: "분석결과", d: "7항 3행 = 이미지 3장 판정" },
    { ok: true, t: "유사도/검색결과", d: "검색 572355 · 572420" },
    { ok: true, t: "판독소견", d: "AI 초안 → 감정관 수정 v2" },
    { ok: false, t: "종합의견", d: "AI 초안 그대로 — 감정관 확인 필요 (판정 3건과는 일치)" },
  ];
  const HIST = [
    { at: "07-24 17:40", who: "SCAS 자동", t: "감정서 1~7항·이미지 페이지 생성" },
    { at: "07-24 17:41", who: "보고서 Agent", t: "판독 문장 초안 v1 (근거 4건 인용)" },
    { at: "07-24 17:48", who: "박○○ 경위", t: "판독소견 수정 v2 — 「일치함」→「일치하는 것으로 판단됨」" },
  ];

  function ours() {
    const wrows = WAIT.map(
      (w) => `<tr class="${w.cur ? "sel" : ""}"><td class="mono" style="color:var(--fg)">${w.no}</td><td class="mono">${w.doc}</td><td>${w.nm}</td><td>${w.req}</td>
        <td class="num">${w.occ}</td><td class="num">${w.reg}</td><td>${progChip(w.prog)}</td>
        <td>${w.prog === "교차 검증 중" ? `<span style="color:var(--faint)">—</span>` : `<button class="btn sm" style="background:var(--blue-bg);border-color:#2b4a78;color:var(--blue)">감정서</button>`}</td><td>${w.out ? "✓" : `<span style="color:var(--faint)">—</span>`}</td>
        <td>${w.prog === "결재 중" ? `<button class="btn sm danger" data-role="analyst admin">결재회수</button>` : `<span style="color:var(--faint)">—</span>`}</td>
        <td style="color:var(--mute);font-size:11.5px">${w.cross}</td></tr>`
    ).join("");

    const rules = RULES.map(
      (r) => `<div style="display:grid;grid-template-columns:16px minmax(0,1fr);gap:6px;padding:4px 0;border-top:1px solid var(--line2);font-size:11.5px">
        <b style="color:${r.ok ? "#4ade80" : "var(--amber)"}">${r.ok ? "✓" : "!"}</b><span><span style="color:var(--fg2)">${r.t}</span> <span style="color:var(--dim)">— ${r.d}</span></span></div>`
    ).join("");
    const hist = HIST.map(
      (h) => `<div style="display:grid;grid-template-columns:70px minmax(0,1fr);gap:6px;font-size:11px;padding:4px 0;border-top:1px solid var(--line2)">
        <span class="mono" style="color:var(--dim)">${h.at}</span><span style="color:var(--mute)"><span style="color:${h.who === "보고서 Agent" ? "var(--teal)" : "var(--fg2)"}">${h.who}</span> · ${h.t}</span></div>`
    ).join("");

    const sec = (n, t, body) => `<div class="s09-sec"><b>${n}. ${t}</b><div style="min-width:0">${body}</div></div>`;
    const stag = (t, bg, fg, bd) => `<span class="s09-tag" style="background:${bg};color:${fg};border:1px solid ${bd}">${t}</span>`;
    const T_AI = stag("AI 초안 v1", "rgba(13,148,136,.12)", "#0f766e", "#5eead4");
    const T_ED = stag("감정관 수정 v2", "rgba(37,99,235,.10)", "#1e40af", "#93c5fd");
    const T_WAIT = stag("확인 전", "rgba(180,83,10,.10)", "#b4530a", "#fbbf77");

    /* 감정물 3점 — 썸네일 + 지문(해시) + 판정 */
    const EVI = [
      ["_1", "690dda…e41c", "발견", ["lines", "herring", "grid"], -4],
      ["_2", "1b7f03…9a02", "불발견", ["dots", "wave", "blocks"], 6],
      ["_3", "c45e88…07bd", "감정불능", ["grid", "dots", "lines"], -9],
    ];
    const evi = EVI.map(
      ([n, h, r, z, rot]) => `<div style="display:grid;grid-template-columns:44px minmax(0,1fr);gap:7px;align-items:center;padding:4px;border:1px solid #d9d3c6;border-radius:4px;background:#fbf9f4">
        <span style="display:block;width:44px;height:58px;border-radius:2px;overflow:hidden">${M.photo({ zones: z, rot, tag: n.slice(1), ruler: false })}</span>
        <span style="display:grid;gap:1px;min-width:0"><b class="mono" style="font-size:10.5px">0646${n}.jpg</b><span class="mono" style="font-size:9.5px;color:#6b6556">SHA-256 ${h}</span>
          <span>${r === "발견" ? stag("발견", "rgba(180,83,10,.12)", "#b4530a", "#fbbf77") : stag(r, "#ece7dc", "#5b5648", "#cfc9bb")}</span></span></div>`
    ).join("");

    const page1 = `<div class="s09-paper pinbox" style="padding:22px 30px 0">${apin(3, "keep", true)}
        <div style="position:absolute;inset:0;overflow:hidden;pointer-events:none"><div class="s09-wm">초 안</div></div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:10px;border-bottom:3px double #1f2430">
          <div><div class="mono" style="color:#7a7466;font-size:10.5px">KPSI-KQP-16-F05 (REV.03)</div><b style="display:block;margin:2px 0;font:700 24px/1.2 serif;letter-spacing:.45em">감 정 서</b><div style="color:#5b5648;font-size:11.5px">경찰청 · [주소]</div></div>
          <div style="text-align:right;font-size:11.5px;color:#5b5648;display:grid;gap:3px;justify-items:end">
            <div>감정서번호 : <b class="mono" style="color:#1f2430">00001-25-0646</b></div><div class="mono">1 / 2</div>
            <div style="display:flex;gap:4px">${["ILAC-MRA", "KOLAS"].map((t) => `<span style="padding:1px 6px;border:1px solid #1f2430;border-radius:2px;font:700 9.5px var(--font-mono);letter-spacing:.06em;color:#1f2430">${t}</span>`).join("")}</div>
            ${stag("초안 v2 · 07-24 17:48", "rgba(180,83,10,.10)", "#b4530a", "#fbbf77")}</div>
        </div>
        ${sec(1, "의뢰 관서", `대구청 (SCAS번호 2025-03321)`)}
        <div class="pinbox">${apin(15, "better")}${sec(2, "감정물", `현장 족적 사진 3점 <span style="color:#6b6556">· SCAS사건번호 2025-11710 · 문서번호 SCAS수사부-2944</span>
          <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:5px 30px 2px 0">${evi}</div>`)}</div>
        ${sec(3, "감정 방법", `윤적감정방법 지침서(KPSI-KQI-305 : 2022)`)}
        ${sec(4, "감정 장소", `경찰청 범죄분석과`)}
        ${sec(5, "감정 기간", `<span class="num">2025-07-23 ~ 2025-07-25</span>`)}
        ${sec(6, "시험 환경", `온도 (24 ± 5) ℃ 습도 70 % R.H. 이하`)}
        <div style="padding:7px 0;border-bottom:1px solid #ddd7ca">
          <b style="font-size:12px">7. 감정 결과</b>
          <table class="s09-tbl" style="margin-top:6px"><thead><tr><th>연번</th><th>검색구분</th><th>감정물</th><th>채취장소</th><th>감정결과</th><th>발견상표</th><th>비고</th></tr></thead><tbody>
            <tr><td>1</td><td>현장문양검색</td><td>전사판채취법 1 건</td><td>주방 바닥</td><td>${key("발견")}</td><td>○○스포츠 운동화</td><td>용의자신발</td></tr>
            <tr><td>2</td><td>현장문양검색</td><td>전사판채취법 1 건</td><td>주방 바닥</td><td>불발견</td><td>—</td><td></td></tr>
            <tr><td>3</td><td>—</td><td>전사판채취법 1 건</td><td>현관</td><td>감정불능</td><td>—</td><td></td></tr>
          </tbody></table>
        </div>
        <div class="pinbox" style="padding:7px 0;border-bottom:1px solid #ddd7ca;font-size:12px;line-height:1.75">${apin(6, "plus")}
          <div style="display:flex;align-items:center;gap:8px"><b>8. 비고</b><span class="pinbox" style="display:inline-flex;align-items:center;gap:6px;font-size:10.5px;color:#6b6556">${pin(12, "plus")} 문장마다 누가 썼는지 표시 — 인쇄·배포본에서는 표시가 빠집니다</span></div>
          <div style="display:grid;grid-template-columns:62px minmax(0,1fr) 92px;gap:8px;margin-top:4px;align-items:start">
            <span style="color:#6b6556">판독소견</span>
            <div>${ai(`감정물 _1의 상·중 부위 헤링본 줄 수(9 ↔ 9)와 격자 칸 수(가로 7 ↔ 7)가 신발 305659와 같아`, "")} <del>일치함</del> ${ed(key("일치하는 것으로 판단됨"), "박○○ 수정")}${ai(`. 하 부위는 현장 족적 일부 소실로 판단에서 제외함.`, "S06·S07")}</div>
            <span style="display:grid;gap:3px;justify-items:end">${T_AI}${T_ED}</span>
          </div>
          <div style="display:grid;grid-template-columns:62px minmax(0,1fr) 92px;gap:8px;margin-top:6px;align-items:start;padding:3px 0 3px 0;border-left:0">
            <span style="color:#6b6556">종합의견</span>
            <div style="padding-left:7px;border-left:2px dashed #f59e0b">${ai(`감정물 3점 중 1점 ${key("발견")}(○○스포츠 운동화), 1점 불발견, 1점 감정불능. 교차 검증 결과 의견 일치.`, "S07·S08")}</div>
            <span style="display:grid;gap:3px;justify-items:end">${T_AI}${T_WAIT}</span>
          </div>
        </div>
        <div class="pinbox" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px;text-align:center;font-size:12px">${apin(5, "better", true)}
          ${[["감정관 (작성)", "박○○ 경위", "S07 결과확인완료"], ["감정관 (교차 검증)", "김○○ 경사", "S08 의견 일치"], ["기술책임자", "최○○ 경감", "결재 후 서명"]]
            .map(([r, n, s]) => `<div style="display:grid;grid-template-columns:minmax(0,1fr) 40px;align-items:center;padding:7px 10px;border:1px solid #cfc9bb;border-radius:3px;background:#fbf9f4;text-align:left">
              <span><span style="display:block;color:#7a7466;font-size:10.5px">${r}</span><b style="display:block">${n}</b><span style="display:block;color:#9a9486;font-size:10px">${s}</span></span>
              <span style="display:grid;place-items:center;height:30px;border:1px dashed #cfc9bb;border-radius:3px;color:#b5ae9f;font-size:9.5px">(서명)</span></div>`)
            .join("")}
        </div>
        <div style="display:flex;justify-content:center;align-items:center;gap:10px;margin-top:10px;color:#5b5648;font-size:11px;line-height:1.5;text-align:center">
          <span>KOLAS 인정 문구 · 한국인정기구 인정<br><span style="color:#8a8578">Commissioner General of Korean National Police Agency · 경찰청 범죄분석과</span></span>
          <b style="font-size:13px;color:#1f2430;letter-spacing:.2em">경찰청장</b>
          <span style="display:inline-grid;place-items:center;width:34px;height:34px;border:2px solid rgba(192,57,43,.75);border-radius:3px;color:rgba(192,57,43,.8);font:700 10px serif;transform:rotate(-6deg)">[직인]</span>
        </div>
        <div class="pinbox" style="margin:12px -30px 0;padding:8px 30px 9px;border-top:1px solid #cfc9bb;background:#ece7dc;font-size:10.5px;color:#4b4638">${apin(14, "plus")}
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <b style="color:#1f2430">무결성 확인</b>
            <span class="mono">원본 이미지 SHA-256</span>
            ${EVI.map(([n, h]) => `<span class="mono" style="padding:0 5px;border-radius:3px;background:#f6f3ec;border:1px solid #d9d3c6">${n} ${h} <b style="color:#15803d">✓</b></span>`).join("")}
            <span style="color:#9a9486">│</span><span class="mono">문서 지문 v2 3f9a…b210</span>
            <span style="margin-left:auto;color:#1e40af;text-decoration:underline">수정 이력 3건 · v1 ↔ v2 비교 →</span>
          </div>
          <div style="margin-top:2px;color:#7a7466">받은 원본 3장의 지문이 등록 때와 같습니다(이미지 편집 S03 이력 포함). 결재가 끝나면 문서 지문이 고정되고 이후 수정은 새 판으로 남습니다.</div>
        </div>
      </div>`;

    const cellH = "display:block;padding:4px 8px;background:#ebe6da;border-bottom:1px solid #cfc9bb;color:#4b4638;font-size:11px;font-weight:600";
    const page2 = `<div class="s09-paper pinbox" style="margin-top:16px;padding:18px 30px 16px">${apin(8, "voice", true)}
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #cfc9bb"><b style="font-size:12.5px">이미지 페이지 <span class="mono" style="color:#7a7466;font-weight:400">2 / 2</span> · 이미지 _1 (발견)</b>
          <span style="font-size:11px;color:#6b6556">한글 편집기 창 없이 이 팝업에서 바로 고침</span></div>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border:1px solid #cfc9bb">
          <div style="border-right:1px solid #cfc9bb;border-bottom:1px solid #cfc9bb"><span style="${cellH}">유류이미지</span>
            <div style="padding:8px"><span style="display:flex;justify-content:center;height:230px;border-radius:2px;overflow:hidden;background:#3a3631"><span style="display:block;width:154px;height:100%">${M.photo({ zones: ["herring", "grid", "tri"], rot: -4, tag: "1" })}</span></span>
            <div class="mono" style="margin-top:4px;font-size:10px;color:#6b6556">00001-25-0646_1.jpg · SHA-256 690dda…e41c</div></div></div>
          <div style="border-bottom:1px solid #cfc9bb"><span style="${cellH}">발견이미지</span>
            <div style="padding:8px"><span style="display:block;height:230px;border-radius:2px;background:#e9ecf0">${sole({ kind: "shoe", zones: ["herring", "grid", "tri"] })}</span>
            <div class="mono" style="margin-top:4px;font-size:10px;color:#6b6556">305659 · 신발 DB 원본</div></div></div>
          <div style="border-right:1px solid #cfc9bb"><span style="${cellH}">측면이미지</span>
            <div style="padding:8px"><span style="display:block;height:96px;border-radius:2px;overflow:hidden">${sideShoe()}</span>
            <div style="display:flex;gap:4px;align-items:center;margin-top:6px">${[["herring", "grid", "tri"], ["herring", "grid", "blocks"], ["herring", "dots", "tri"]].map((z) => `<span style="display:block;width:34px;height:48px;border:1px solid #d9d3c6;border-radius:2px;background:#e9ecf0">${sole({ kind: "shoe", zones: z })}</span>`).join("")}
              <span style="font-size:11px;color:#6b6556">그룹 신발 이미지 +9 (최대 15)</span></div></div></div>
          <div><span style="${cellH}">이미지정보</span>
            <table class="s09-tbl" style="margin:8px;width:calc(100% - 16px)"><tbody>
              ${[["화류번호", `<span class="mono">305659</span>`], ["화종", "운동화"], ["상표", "○○스포츠"], ["모델번호", `<span style="color:#b5ae9f">—</span>`], ["성별", "남자"], ["수집년도", "2025년3월"], ["비고", "용의자신발"]]
                .map(([l, v]) => `<tr><td style="width:72px;background:#f1ede3;color:#6b6556">${l}</td><td>${v}</td></tr>`)
                .join("")}
            </tbody></table></div>
        </div>
        <div style="margin-top:7px;color:#7a7466;font-size:11px">발견된 이미지 순서(_1 → _n)대로 이 2×2 블록이 이어 붙습니다. 불발견·감정불능 이미지는 블록을 만들지 않습니다.</div>
      </div>`;

    const flow = [
      ["결과확인완료", "done"],
      ["교차 검증 · 의견 일치", "done"],
      ["감정서작성", "now"],
      ["결재(기술책임자)", ""],
    ].map(
      ([t, st], i) => `${i ? `<span style="color:var(--dim)">→</span>` : ""}<span class="chip ${st === "now" ? "amber" : st === "done" ? "blue" : ""}" style="height:20px;font-size:10.5px">${st === "done" ? "✓ " : ""}${t}</span>`
    ).join("");

    const body = `${STYLE}<div style="display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:14px;padding:10px 14px 14px">
      <div style="min-width:0">
        <div class="pinbox" style="display:flex;gap:5px;align-items:center;margin-bottom:10px">${apin(2, "keep", true)}
          <button class="btn sm">저장</button><button class="btn sm">인쇄</button>
          <span style="width:1px;height:18px;background:var(--line3);margin:0 3px"></span>
          <button class="btn sm ghost">⏫</button><button class="btn sm ghost">⏶</button><span class="mono" style="font-size:12px">1 / 2</span><button class="btn sm ghost">⏷</button><button class="btn sm ghost">⏬</button>
          <span style="width:1px;height:18px;background:var(--line3);margin:0 3px"></span>
          <button class="btn sm ghost">−</button><span class="mono" style="font-size:12px">100% ▾</span><button class="btn sm ghost">＋</button>
          <span style="margin-left:auto;display:flex;gap:5px;align-items:center">
            <button class="btn sm">배포용 다운로드 ▾</button>
            <span style="width:1px;height:18px;background:var(--line3)" data-role="analyst admin"></span>
            <button class="btn sm pri" data-role="analyst admin">결재 올리기</button>${pin(10, "voice")}
            <button class="btn sm ok" data-role="verifier">결재</button><button class="btn sm danger" data-role="verifier">반려</button>
          </span>
        </div>
        <div style="display:flex;gap:14px;align-items:center;margin-bottom:10px;font-size:11px;color:var(--mute)"><span>기본 글자 = SCAS처럼 자동 생성</span><span>${ai("청록 밑줄", "")} = AI 초안</span><span>${ed("파란 밑줄", "이름")} = 감정관이 고친 곳</span><span>${key("주황 굵게")} = 핵심 결과</span>
          <span style="margin-left:auto" class="mono">AI 초안 2문장 · 감정관 수정 1곳 · 확인 전 1</span></div>
        ${page1}
        ${page2}
        <div class="pinbox" style="margin-top:12px;border:1px solid var(--line);border-radius:10px">${apin(9, "voice", true)}
          <div style="padding:6px 12px;background:var(--strip);font-size:12px;color:var(--fg2);font-weight:600;border-radius:10px 10px 0 0">첨부파일 목록 ▾</div>
          <table class="grid"><thead><tr><th>순번</th><th>첨부 문서</th><th>파일 명칭</th><th>파일 크기</th></tr></thead><tbody>
            <tr><td style="height:34px">1</td><td>감정서</td><td>족윤적 감정서 출지</td><td class="num">412 KB</td></tr>
            <tr><td style="height:34px">2</td><td>발견 이미지 <span class="chip" style="height:17px;font-size:10px">자동 첨부</span></td><td class="mono">00001-25-0646_1_305659.png</td><td class="num">1.2 MB</td></tr>
          </tbody></table>
        </div>
      </div>

      <div style="display:grid;gap:10px;align-content:start;padding-left:14px;border-left:1px dashed #1d4a44">
        <div style="display:flex;justify-content:space-between;align-items:center"><span class="ai-mark">● +α 보고서 Agent</span><span class="inp" style="width:140px;font-size:11px">경찰청 F05 (REV.03)<span class="caret">▾</span></span></div>
        <div style="padding:7px 9px;border-radius:8px;background:var(--panel2);font-size:11.5px;color:var(--mute);line-height:1.5">감정서 1~7항과 이미지 페이지는 SCAS에도 있는 <b style="color:var(--fg2)">자동 생성</b>입니다. 새로 더하는 것은 8항의 <b style="color:var(--teal)">판독 문장 초안</b>과 아래 점검뿐입니다.</div>
        <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px">
          ${[
            ["자동 채움", "9", "칸 · 1~7항·이미지·첨부", "rgba(74,158,255,.16)"],
            ["AI 초안", "2", "문장 · 근거 4건 인용", "rgba(45,212,191,.18)"],
            ["감정관 수정", "1", "곳 · v1 → v2", "rgba(96,165,250,.18)"],
          ]
            .map(([k, v, s, g]) => `<div class="stat" style="--glow:${g};padding:8px 9px"><span class="k" style="font-size:10.5px">${k}</span><span class="v" style="font-size:19px">${v}</span><span class="s" style="font-size:9.5px;line-height:1.3">${s}</span></div>`)
            .join("")}
        </div>
        <div class="pinbox" style="padding:10px 11px;border:1px solid var(--line3);border-radius:10px;background:linear-gradient(160deg,var(--panel2),var(--panel))">${apin(13, "plus")}
          <div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:12px;color:var(--fg)">초안 완성도</b><span><b class="mono" style="font-size:20px;color:var(--fg)">91</b><span class="mono" style="color:var(--mute);font-size:12px">%</span> <span class="mono" style="color:var(--dim);font-size:11px">10 / 11칸</span></span></div>
          <div class="fx-bar" style="margin:7px 0 8px;height:5px"><i style="width:91%"></i></div>
          <div style="display:flex;gap:2px">${[
            ["1", "a"], ["2", "a"], ["3", "a"], ["4", "a"], ["5", "a"], ["6", "a"], ["7", "a"], ["판독", "e"], ["종합", "w"], ["이미지", "a"], ["첨부", "a"],
          ]
            .map(([t, s]) => `<span style="flex:1;display:grid;gap:3px;min-width:0;text-align:center"><span class="s09-seg" style="background:${s === "a" ? "var(--blue2)" : s === "e" ? "#60a5fa" : "transparent"};${s === "w" ? "border:1px dashed var(--amber)" : ""};${s === "e" ? "box-shadow:inset 0 -2px 0 var(--teal)" : ""}"></span><span style="font-size:8.5px;color:${s === "w" ? "var(--amber)" : "var(--dim)"};white-space:nowrap;overflow:hidden">${t}</span></span>`)
            .join("")}</div>
          <div style="display:flex;gap:10px;margin-top:6px;font-size:10px;color:var(--dim)"><span><i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:var(--blue2)"></i> 자동</span><span><i style="display:inline-block;width:8px;height:8px;border-radius:2px;background:#60a5fa;box-shadow:inset 0 -2px 0 var(--teal)"></i> AI 초안 → 수정</span><span><i style="display:inline-block;width:8px;height:8px;border-radius:2px;border:1px dashed var(--amber)"></i> 확인 전</span></div>
          <div style="margin-top:6px;padding:5px 7px;border-radius:6px;background:var(--amber-bg);font-size:11px;color:var(--amber)">남은 일 1 — 8항 종합의견(AI 초안)을 읽고 확인</div>
        </div>
        <div style="display:flex;gap:6px"><button class="btn sm ai" data-role="analyst admin">판독 문장 초안 생성</button><button class="btn sm ghost" data-role="analyst admin">이 문장만 다시</button></div>
        <div style="font-size:11px;color:var(--mute)">근거로 쓴 자료
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px"><span class="chip teal" style="height:19px;font-size:10px">S07 판정 메모</span><span class="chip teal" style="height:19px;font-size:10px">S06 칸 수·도형 근거</span><span class="chip" style="height:19px;font-size:10px">S08 교차 검증 의견</span><span class="chip" style="height:19px;font-size:10px">KPSI-KQI-305 : 2022</span></div></div>
        <div class="pinbox" style="padding-top:6px;border-top:1px solid var(--line2)">${apin(7, "plus")}
          <div style="display:flex;justify-content:space-between;align-items:baseline"><span class="crumb">규칙 기반 검증 · 필수 항목</span><span style="font-size:11px;color:var(--amber)">4 / 5</span></div>
          <div style="margin-top:4px">${rules}</div>
          <div style="margin-top:5px;font-size:10.5px;color:var(--dim)">「!」 항목을 확인해야 결재 올리기가 켜집니다.</div>
        </div>
        <div style="padding-top:6px;border-top:1px solid var(--line2)">
          <div style="display:flex;justify-content:space-between;align-items:center"><span class="crumb">핵심 결과 강조</span><span class="seg"><button aria-pressed="true">켜기</button><button aria-pressed="false">끄기</button></span></div>
        </div>
        <div style="padding-top:6px;border-top:1px solid var(--line2)"><div class="crumb" style="margin-bottom:2px">수정 이력</div>${hist}</div>
        <div class="pinbox" style="display:grid;gap:4px;padding-top:6px;border-top:1px solid var(--line2);font-size:11px;color:var(--mute)">${pin(11, "better")}
          <span data-role="analyst admin">감정관: 편집 · 초안 생성 · 결재 올리기 · 결재회수</span>
          <span data-role="verifier">기술책임자: 읽기 + 결재 · 반려</span>
          <span data-role="investigator">수사관: 결재완료 감정서만 내려받기</span>
        </div>
      </div>
    </div>`;

    return M.shell(
      { active: "감정서작성", tabs: ["사건관리", "감정서작성", "족윤적 검증", "결재 대기함"], title: "감정서작성", h: 2040 },
      `<div style="min-height:1910px">
        <div class="panel pinbox" style="margin-bottom:10px">${apin(1, "keep", true)}
          <div class="panel-b" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px 14px">
            <div style="display:flex;gap:8px;align-items:center"><span class="crumb" style="width:60px">감정번호</span><span class="inp w100" style="color:var(--dim)">00001-25-</span></div>
            <div style="display:flex;gap:8px;align-items:center"><span class="crumb" style="width:60px">등록일자</span><span class="inp w100 mono">2025-03-01 ~ 2025-07-24</span></div>
            <div style="display:flex;gap:8px;align-items:center"><span class="crumb" style="width:60px">의뢰관서</span><span class="inp w100"></span><button class="btn sm">검색</button></div>
            <div style="display:flex;gap:8px;align-items:center"><span class="crumb" style="width:60px">처리관서</span><span class="inp w100">경찰청</span><button class="btn sm">검색</button></div>
            <div style="display:flex;gap:8px;align-items:center"><span class="crumb" style="width:60px">문서번호</span><span class="inp w100"></span></div>
            <div style="display:flex;gap:8px;align-items:center"><span class="crumb" style="width:60px">사건명</span><span class="inp w100">전체<span class="caret">▾</span></span></div>
          </div>
        </div>
        <div class="panel tc">
          <div class="panel-h"><span class="t">감정 작성 대기 목록</span><span class="r"><button class="btn sm">엑셀</button><button class="btn sm">조회</button><button class="btn sm">초기화</button></span></div>
          <table class="grid"><thead><tr><th>감정번호</th><th>문서번호</th><th>사건명</th><th>의뢰관서</th><th>발생일</th><th>등록일</th><th>감정의뢰 진행</th><th>감정서</th><th>출지</th><th>결재</th><th>교차 검증</th></tr></thead><tbody>${wrows}</tbody></table>
        </div>
      </div>
      ${layer({ l: 10, t: 40, w: 1160, title: "결재문서정보", head: `<span class="pinbox" style="display:inline-flex;gap:5px;align-items:center;margin-left:10px">${pin(4, "voice")}${flow}</span>` }, body)}`
    );
  }

  function scas() {
    const rows = [
      ["00001-25-0646", "SCAS수사부-2944", "주거침입", "대구청", "2025-07-19", "2025-07-23", ""],
      ["00001-25-0640", "SCAS수사부-2911", "절도", "부산청", "2025-07-15", "2025-07-22", "결재 중"],
      ["00001-25-0612", "SCAS수사부-2755", "절도", "인천청", "2025-07-10", "2025-07-16", "결재 중"],
    ].map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}<td><span class="sbtn b">감정서</span></td><td></td><td>${r[6] ? '<span class="sbtn r">결재회수</span>' : ""}</td></tr>`).join("");
    const line = (w) => `<div style="height:6px;width:${w}%;margin:5px 0;background:#e3e6ec"></div>`;
    return M.scasShell(
      { treeOn: "감정서관리 ▸", tabOn: "감정서작성", h: 820 },
      `<div class="box" style="padding:8px;margin-bottom:8px"><table><tbody>
        <tr><td class="lbl">감정번호</td><td></td><td class="lbl">등록일자</td><td>📅 2025-03-01 ~ 📅 2025-07-24</td><td class="lbl">의뢰관서</td><td><span class="sbtn b">검색</span></td></tr>
        <tr><td class="lbl">처리관서</td><td>경찰청 <span class="sbtn b">검색</span></td><td class="lbl">문서번호</td><td></td><td class="lbl">사건명</td><td>전체 ▾</td></tr>
      </tbody></table></div>
      <div class="bar">감정 작성 대기 목록 <span><span class="sbtn">엑셀</span> <span class="sbtn">조회</span> <span class="sbtn">초기화</span></span></div>
      <div class="box"><table><thead><tr><th>감정번호</th><th>문서번호</th><th>사건명</th><th>의뢰관서</th><th>발생일</th><th>등록일</th><th>감정의뢰 진행</th><th>감정서</th><th>출지</th><th>결재</th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="dim"></div>
      <div class="modal" style="left:40px;top:60px;width:620px;height:680px">
        <div class="bar">결재문서정보 <span>×</span></div>
        <div style="display:flex;gap:6px;align-items:center;padding:4px 8px;background:#f3f4f7;border-bottom:1px solid var(--s-line);font-size:11px">💾 🖨 ⏫ ⏶ ⏷ ⏬ <span class="sbtn">2</span> / 2 🔍− 🔍+ 100% ▾ <span class="sbtn" style="margin-left:auto">배포용 다운로드</span></div>
        <div style="height:470px;overflow:hidden;background:#d9dce3;padding:10px">
          <div style="background:#fff;height:100%;padding:14px 22px;font-size:10.5px;color:#333">
            <div style="display:flex;justify-content:space-between"><b>경찰청</b><span>감정서번호 : 00001-25-0602 · 1/1 · ILAC-MRA KOLAS</span></div>
            <div style="color:#999;font-size:9.5px">KPSI-KQP-16-F05 (REV.03)</div>
            <div style="margin-top:8px">1. 의뢰 관서</div>${line(60)}
            <div>2. 감정물 (파일명 + 해시값) · SCAS사건번호 · 문서번호</div>${line(80)}
            <div>3. 감정 방법 : 윤적감정방법 지침서(KPSI-KQI-305 : 2022)</div>
            <div>4. 감정 장소</div><div>5. 감정 기간</div>
            <div>6. 시험 환경 : 온도 (24 ± 5) ℃ 습도 70 % R.H. 이하</div>
            <div>7. 감정 결과</div>
            <table style="margin:3px 0"><thead><tr><th>연번</th><th>검색구분</th><th>감정물</th><th>채취장소</th><th>감정결과</th><th>발견상표</th><th>비고</th></tr></thead>
              <tbody><tr><td>1</td><td>현장문양검색</td><td>사진촬영법 1 건</td><td>…</td><td>발견</td><td>○○표 외 1종</td><td></td></tr></tbody></table>
            <div>8. 비고</div>${line(40)}
            <div style="display:flex;justify-content:space-around;margin-top:8px"><span>감정관</span><span>감정관</span><span>기술책임자</span></div>
            <div style="text-align:center;margin-top:8px;color:#666">KOLAS 인정 문구 · 한국인정기구 인정 경찰청장 <span style="color:#d24b4b">[직인]</span></div>
          </div>
        </div>
        <div style="padding:3px 8px;font-size:10px;color:#666;background:#f3f4f7">준비 · 메시지 · 이미지: (속성편집=불가능), (이동=불가능), (입력=불가능), (링크=불가능) · 2/2</div>
        <div class="bar" style="background:#e9ecf3;color:#555">첨부파일 목록 ▾</div>
        <table><thead><tr><th>순번</th><th>첨부 문서</th><th>파일 명칭</th><th>파일 크기</th></tr></thead><tbody><tr><td>1</td><td></td><td>족윤적 감정서 출지</td><td></td></tr></tbody></table>
      </div>
      <div class="oswin" style="left:560px;top:120px;width:640px;height:600px">
        <div class="tt">🧑 용지 — 웹 한글 편집기<span style="margin-left:auto"><span class="sbtn">파일 저장</span> <span class="sbtn">PDF 저장</span> <span class="sbtn">닫기</span></span></div>
        <div style="padding:3px 8px;border-bottom:1px solid #ccc">파일(F) 편집(E) 보기(U) 입력(D) 모양(J) 도구(K) 표(Q) 도움말(H)</div>
        <div style="padding:3px 8px;border-bottom:1px solid #ccc;color:#666">바탕글 ▾ · 대표 ▾ · 함초롬바탕 ▾ · 10 · 160 % · 폭 맞춤</div>
        <div style="background:#c9ccd3;padding:12px;height:520px;overflow:hidden">
          <div style="background:#fff;padding:12px">
            ${[0, 1].map(() => `<table style="margin-bottom:10px"><tbody>
              <tr><th>유류이미지</th><th>발견이미지</th></tr>
              <tr><td style="padding:4px"><div style="height:100px">${sole({ kind: "scene", zones: ["herring", "grid", "blocks"], bg: "#2a2d33" })}</div><div style="font-size:9.5px">00001-25-0640_1.jpg (690dda…)</div></td>
                <td style="padding:4px"><div style="height:114px">${sole({ kind: "shoe", zones: ["herring", "grid", "tri"], bg: "#ffffff" })}</div></td></tr>
              <tr><th>측면이미지</th><th>이미지정보</th></tr>
              <tr><td class="ph" style="height:60px">측면 사진</td><td style="font-size:10px;white-space:normal">화류번호 275178 · 화종 슬리퍼 · 상표 기타 · 모델번호 · 성별 남자 · 수집년도 2021년7월 · 비고</td></tr>
            </tbody></table>`).join("")}
          </div>
        </div>
      </div>
      ${M.pain(680, 10, "<b>창 3종이 겹침</b> — 감정서작성 탭 → 결재문서정보 팝업(문서 뷰어) → 한글 편집기 별도 창 (5613 14:37–16:07)", 330)}
      ${M.pain(880, 660, "<b>이미지 페이지를 HWP에서 손으로 확인</b> — 「이미지가 15개까지 나오거든요」, 후보마다 2×2 표 반복 (5613 14:43–16:07)", 320)}
      ${M.pain(60, 600, "<b>본문은 보기만</b> — 뷰어 상태바 「속성편집=불가능」, 서명란 두 감정관이 누구인지 문서에서 안 보임 (5613 15:25–15:40)", 300)}`
    );
  }

  M.add({
    id: "s09",
    code: "S09",
    group: "감정서관리",
    title: "감정서 작성",
    plus: true,
    refs: [
      { t: "SCAS 감정서작성 탭", v: "5613 14:37 · 18:07 · 19:37" },
      { t: "SCAS 결재문서정보", v: "5613 15:25 · 19:07" },
      { t: "SCAS 한글 편집기", v: "5613 14:52–16:07" },
      { t: "인터뷰", v: "5613 14:43 · 18:48 · 19:18 · 19:32", voice: true },
      { t: "사업계획서", v: "p13 · p42" },
      { t: "발표", v: "s15" },
    ],
    lead: "순서는 검색결과 확인(S07) → 교차 검증(S08) → 감정서 작성(여기) → 결재입니다. SCAS 「감정서작성」 탭의 검색 폼·「감정 작성 대기 목록」·결재회수를 그대로 두고, 「감정서」를 누르면 결재문서정보가 같은 자리에 팝업으로 뜹니다(위 문서, 아래 첨부파일 목록). 한글 편집기 창 대신 같은 팝업 2쪽에서 이미지 페이지를 고치고, AI는 판독 문장 초안만 더합니다. r3: 문서를 실제 종이 감정서처럼(1~8항 KOLAS 양식, 「초안」 워터마크, 서명란·직인 자리) 그리고, 문장마다 AI 초안(청록)과 감정관이 고친 곳(파란 밑줄 + 이름)을 나눠 표시했습니다. 2항에 감정물 3장 썸네일·지문(해시)·판정을, 1쪽 끝에 무결성 확인 줄(원본 지문 일치·문서 지문·수정 이력)을, 오른쪽에 초안 완성도(10 / 11칸)를 붙였습니다.",
    fit: {
      area: ["same", "위 검색 폼·아래 대기 목록, 팝업은 위 문서·아래 첨부파일 목록, Agent는 오른쪽 덧붙임"],
      buttons: ["same", "엑셀·조회·초기화, 행 감정서·결재회수, 뷰어 저장·인쇄·쪽 이동·확대·배포용 다운로드 순서 그대로 + 끝에 결재 올리기"],
      popup: ["near", "결재문서정보 레이어 팝업 1겹 그대로, 한글 편집기 별도 창은 팝업 안 2쪽으로"],
      columns: ["same", "목록 열·감정서 1~8항·첨부파일 열 순서 그대로, 목록 끝에 교차 검증 열 1개"],
    },
    scas,
    ours,
    notes: [
      { n: 1, kind: "keep", title: "감정 작성 대기 목록 그대로", text: "검색 조건(감정번호·등록일자·의뢰관서·처리관서·문서번호·사건명)과 엑셀·조회·초기화, 열(감정번호 … 감정서·출지·결재)과 「결재 중」 행의 「결재회수」를 같은 자리에 둡니다. 새 「교차 검증」 열은 맨 끝에만 붙였습니다.", src: "5613 18:07 · 19:37" },
      { n: 2, kind: "keep", title: "결재문서정보 = 같은 자리 팝업", text: "「감정서」를 누르면 목록 위에 결재문서정보가 팝업으로 뜹니다. 위는 문서, 아래는 첨부파일 목록(순번·첨부 문서·파일 명칭·파일 크기)이고, 뷰어 줄은 저장·인쇄·쪽 이동·확대·배포용 다운로드 순서 그대로입니다. 문서는 보기만이 아니라 그 자리에서 고칩니다.", src: "5613 15:25 · 19:07" },
      { n: 3, kind: "keep", title: "KOLAS 감정서 양식 그대로", text: "KPSI-KQP-16-F05 (REV.03)의 1. 의뢰 관서 ~ 8. 비고, 감정물 파일명 + 해시값, 지침서 KPSI-KQI-305 : 2022, 시험 환경 문구, KOLAS 인정 문구를 같은 순서로 둡니다.", src: "5613 15:25–15:40" },
      { n: 4, kind: "voice", title: "교차 검증이 끝나야 감정서로", text: "「결과 값을 교차 검증 결과 의견이 일치한다고 해서 끝내. 끝내면 어디로 가냐. 감정서 작성으로 가는 거지」 — 팝업 머리에 결과확인완료 ✓ → 교차 검증 ✓ → 감정서작성 → 결재 순서를 보이고, 교차 검증 중인 사건은 「감정서」 버튼이 없습니다.", src: "5613 18:42–18:53" },
      { n: 5, kind: "better", title: "서명란에 누가 들어가는지 표시", text: "서명란 「감정관 · 감정관 · 기술책임자」를 감정관(작성) · 감정관(교차 검증) · 기술책임자로 풀어, S07 결과확인완료자와 S08 교차 검증자 이름을 자동으로 채웁니다(이름 가림). 두 감정관의 역할은 열린 질문으로 확인 예정입니다.", src: "인벤토리 S14 서명란" },
      { n: 6, kind: "plus", title: "AI는 판독 문장 초안만", text: "1~7항과 이미지 페이지 자동 생성은 SCAS에 이미 있는 기능이라 흰 글자로 둡니다. 새로 더하는 것은 8. 비고의 판독소견·종합의견 문장 초안뿐이며 청록 밑줄과 ↗근거(S06 칸 수·도형, S07 판정 메모, S08 의견)로 표시합니다.", src: "5613 19:00 · BP p13 · p42 · 발표 s15" },
      { n: 7, kind: "plus", title: "규칙 기반 검증(필수 5항목)", text: "족적 기본정보·분석결과·유사도/검색결과·판독소견·종합의견이 채워졌고 서로 맞는지 확인합니다. 「!」 항목을 감정관이 확인해야 「결재 올리기」가 켜집니다.", src: "BP p42" },
      { n: 8, kind: "voice", title: "이미지 페이지는 같은 팝업 2쪽에서", text: "「쫘라라락 이미지가 15개까지 나오거든요… 두번째 거가 밑에 붙어서」 — 발견 이미지 순서대로 2×2 블록(유류이미지·발견이미지·측면이미지·이미지정보)을 이어 붙이고, 그룹 신발이면 이미지를 최대 15개까지 넣습니다. 한글 편집기 창은 뜨지 않습니다.", src: "5613 14:43–15:12" },
      { n: 9, kind: "voice", title: "발견 이미지는 첨부파일로 자동", text: "「발견한 것에 대한 것을 첨부 파일로 들어가는 거고」 — 첨부파일 목록에 발견 이미지가 「자동 첨부」로 들어가고, S06에서 첨부한 근거 그림도 같은 목록에 붙습니다.", src: "5613 19:05–19:23" },
      { n: 10, kind: "voice", title: "결재를 올리면 끝", text: "「이렇게 해서 결제를 올린 게 끝. 전체 과정이 끝」 — 뷰어 줄 끝에 「결재 올리기」를 두고, 올린 문서는 기술책임자의 결재 대기함(S08)으로 갑니다. 잘못 올리면 목록의 「결재회수」로 되돌립니다.", src: "5613 19:32–19:36" },
      { n: 11, kind: "better", title: "보는 사람에 따라", text: "감정관·관리자는 편집·초안 생성·결재 올리기·결재회수를, 기술책임자는 같은 팝업에서 읽기와 결재·반려를, 수사관은 결재완료 감정서 내려받기만 봅니다." },
      { n: 12, kind: "plus", title: "AI 초안 ↔ 감정관 수정 구분(r3)", text: "8항 문장마다 누가 썼는지 보입니다 — AI 초안은 청록 밑줄, 감정관이 고친 곳은 파란 밑줄과 이름(예: 「일치함」을 지우고 「일치하는 것으로 판단됨」으로 박○○ 수정), 아직 읽고 확인하지 않은 AI 문장은 주황 점선과 「확인 전」. 인쇄·배포용 다운로드에서는 이 표시가 빠지고 글만 남습니다.", src: "5613 19:00 · BP p42" },
      { n: 13, kind: "plus", title: "초안 완성도(r3)", text: "감정서 칸을 1~7항 · 8항 판독소견 · 종합의견 · 이미지 페이지 · 첨부로 나눠 몇 칸이 끝났는지(10 / 11, 91%) 보여 줍니다. 자동으로 채운 칸, AI 초안을 감정관이 고친 칸, 아직 확인 전인 칸을 색으로 나누고, 남은 일을 한 줄로 알려 줍니다. 위 숫자 타일은 AI가 미리 해 둔 양(자동 9칸 · 초안 2문장 · 수정 1곳)입니다.", src: "BP p42" },
      { n: 14, kind: "plus", title: "무결성 확인 줄(r3)", text: "1쪽 끝에 받은 원본 사진 3장의 지문(SHA-256 해시)이 등록 때와 같은지, 지금 문서의 지문(v2), 수정 이력(v1 ↔ v2 비교)을 한 줄로 둡니다. 법정에서 「원본을 손대지 않았나」를 바로 댈 수 있게 하는 것이고, 결재가 끝나면 문서 지문이 고정됩니다. 해시 값은 예시입니다.", src: "BP p16–19 · 5613 15:25–15:40" },
      { n: 15, kind: "better", title: "감정물 썸네일 · 종이 문서 모양(r3)", text: "2항 감정물에 파일 이름만 있던 것을 사진 3장 썸네일 + 지문 + 판정(발견 · 불발견 · 감정불능)으로 보여 줍니다. 문서 전체는 실제 출력물처럼 종이 바탕에 KOLAS 양식 1~8항 그대로 두고, 결재 전에는 「초안」 워터마크가 깔립니다.", src: "5613 15:25–15:40 · 인벤토리 S14" },
    ],
  });
})();
