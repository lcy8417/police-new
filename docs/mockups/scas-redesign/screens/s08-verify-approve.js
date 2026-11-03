/* S08 검증·결재 — SCAS 「족윤적 검증」 탭(S16) + 「결재 대기함」 탭(S17)
   (IMG_5613 17:34–18:55, 18:52, 19:32)
   r2: 1차 팀장/2차 기술책임자 삭제. 흐름 = 결과확인완료 → 교차 검증(다른 감정관) → 감정서작성 → 결재(기술책임자).
       두 탭은 SCAS처럼 따로, 같은 화면 틀에서 탭 전환. 교차 검증 = analyst, 결재 = verifier */
(function () {
  const { pin, apin, sole } = M;

  const layer = ({ l, t, w, title, head = "" }, body) => `
    <div style="position:absolute;inset:0;z-index:5;background:rgba(5,8,13,.6);border-radius:14px"></div>
    <div class="panel pinbox" style="position:absolute;left:${l}px;top:${t}px;width:${w}px;z-index:6;box-shadow:0 24px 70px rgba(0,0,0,.65)">
      <div class="panel-h" style="background:var(--blue-bg)"><span class="t">${title}</span>${head}<span class="r"><span style="color:var(--mute)">✕</span></span></div>
      ${body}
    </div>`;

  /* r3: 작성자(첫 감정관)가 남긴 표시 — 유류 사진과 발견 밑창에 같은 번호로 겹쳐 그림.
     좌표는 밑창 기준(0~100 × 0~264). 사진은 M.photo와 같은 회전(−4°)을 걸어 맞춘다. */
  const MARKS = [
    { n: 1, x: 30, y: 44 },
    { n: 2, x: 68, y: 70 },
    { n: 3, x: 36, y: 132 },
    { n: 4, x: 66, y: 152 },
  ];
  const markG = (r) =>
    `<line x1="4" y1="92" x2="96" y2="92" stroke="#60a5fa" stroke-width=".8" stroke-dasharray="3 2" opacity=".85"/><line x1="4" y1="176" x2="96" y2="176" stroke="#60a5fa" stroke-width=".8" stroke-dasharray="3 2" opacity=".85"/>` +
    MARKS.map(
      (m) => `<circle cx="${m.x}" cy="${m.y}" r="${r}" fill="rgba(74,158,255,.16)" stroke="#60a5fa" stroke-width="1.1"/><circle cx="${m.x}" cy="${m.y}" r="1.1" fill="#93c5fd"/>
        <text x="${m.x + r + 1}" y="${m.y - r + 3}" font-size="8" font-weight="700" font-family="monospace" fill="#bfdbfe" stroke="#05080d" stroke-width="1.6" paint-order="stroke">${m.n}</text>`
    ).join("");
  const photoMarks = () => `<svg viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;pointer-events:none" aria-label="작성자 표시">
      <g transform="translate(100 150) rotate(-4) translate(-50 -134)">${markG(6)}
        <rect x="8" y="182" width="84" height="74" rx="4" fill="rgba(245,158,11,.10)" stroke="#f59e0b" stroke-width="1" stroke-dasharray="3 2"/>
        <text x="50" y="224" font-size="7.5" font-weight="700" text-anchor="middle" fill="#fcd34d" stroke="#05080d" stroke-width="1.6" paint-order="stroke">하 소실 · 판단 제외</text></g></svg>`;
  const shoeMarks = () => `<svg viewBox="0 0 100 264" preserveAspectRatio="xMidYMid meet" style="position:absolute;inset:0;pointer-events:none" aria-label="작성자 표시">${markG(5.5)}</svg>`;
  const sideShoe = () =>
    `<svg viewBox="0 0 200 90" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-label="측면 이미지(가짜 예시)"><rect width="200" height="90" fill="#e9ecf0"/>
      <path d="M22 60C24 46 40 38 64 36L92 24C104 20 116 26 120 34C146 38 172 46 180 56L180 66L22 68Z" fill="#5b6472" stroke="#3a3f48"/>
      <path d="M20 68L182 66L180 74L24 76Z" fill="#2f343b"/><path d="M96 28L114 42M90 33L108 46" stroke="#cfd5de" stroke-width="2"/></svg>`;

  const resChip = (r) => (r === "발견" ? `<span class="chip green">발견</span>` : r === "불발견" ? `<span class="chip">불발견</span>` : `<span class="chip amber">감정불능</span>`);

  /* 족윤적 검증 탭: 내게 온 교차 검증 요청 + 내가 보낸 것 */
  const VQ = [
    { no: "00001-25-0640", sus: "", at: "2025-07-24", req: "부산청", who: "김○○ 경사", res: "발견", st: "요청 받음", mine: false, sel: true },
    { no: "00001-25-0633", sus: "S-25-0107", at: "2025-07-23", req: "서울청", who: "이○○ 경위", res: "불발견", st: "접수함", mine: false },
    { no: "00001-25-0646", sus: "S-25-0112", at: "2025-07-24", req: "대구청", who: "박○○ 경위", res: "발견", st: "보냄 → 김○○ 검증 중", mine: true },
    { no: "00001-25-0612", sus: "S-25-0098", at: "2025-07-16", req: "인천청", who: "김○○ 경사", res: "발견", st: "의견 일치", mine: false },
  ];
  const vst = (s) =>
    s === "의견 일치" ? `<span class="chip green">✓ 의견 일치</span>` : s === "요청 받음" ? `<span class="chip amber"><span class="dot"></span>요청 받음</span>` : s === "접수함" ? `<span class="chip blue">접수함</span>` : `<span class="chip">${s}</span>`;

  /* 결재 대기함 탭 */
  const AQ = [
    { kind: "족윤적 감정서", title: "절도 족적 감정 결과 (00001-25-0612)", biz: "족윤적 감정", dept: "범죄분석과", who: "박○○ 경위", cross: "의견 일치 · 김○○", at: "2025-07-24", sel: true },
    { kind: "족윤적 감정서", title: "주거침입 족적 감정 결과 (00001-25-0601)", biz: "족윤적 감정", dept: "범죄분석과", who: "이○○ 경위", cross: "의견 일치 · 박○○", at: "2025-07-23" },
    { kind: "족윤적 감정서", title: "강도 족적 감정 결과 (00001-25-0598)", biz: "족윤적 감정", dept: "범죄분석과", who: "김○○ 경사", cross: "의견 일치 · 이○○", at: "2025-07-22" },
  ];

  function ours() {
    const vrows = VQ.map(
      (q) => `<tr class="${q.sel ? "sel" : ""}"><td class="mono" style="color:var(--fg)">${q.no}</td><td class="mono">${q.sus || `<span style="color:var(--faint)">—</span>`}</td>
        <td class="num">${q.at}</td><td>${q.req}</td><td>${q.who}${q.mine ? ` <span class="chip" style="height:18px;font-size:10px">나</span>` : ""}</td><td>${resChip(q.res)}</td>
        <td>${q.mine ? `<span style="color:var(--dim);font-size:11.5px">본인 건 — 검증 불가</span>` : `<button class="btn sm" style="background:var(--blue-bg);border-color:#2b4a78;color:var(--blue)">확인</button> <button class="btn sm" style="background:var(--blue-bg);border-color:#2b4a78;color:var(--blue)">검증결과</button>`}</td>
        <td>${vst(q.st)}</td></tr>`
    ).join("");

    const arows = AQ.map(
      (q) => `<tr class="${q.sel ? "sel" : ""}"><td>${q.sel ? "☑" : "☐"}</td><td>${q.kind}</td><td style="color:var(--fg)">${q.title}</td><td>${q.biz}</td><td>${q.dept}</td><td>${q.who}</td>
        <td><span class="chip green" style="height:19px;font-size:10.5px">✓ ${q.cross}</span></td><td class="num">${q.at}</td></tr>`
    ).join("");

    const flow = [
      ["결과확인완료", "감정관 · S07", "done"],
      ["교차 검증", "다른 감정관 · 이 탭", "now"],
      ["감정서작성", "감정관 · S09", ""],
      ["결재", "기술책임자 · 결재 대기함", ""],
    ].map(
      ([t, s, st], i) => `${i ? `<span style="color:var(--dim)">→</span>` : ""}<span style="display:inline-grid;padding:4px 10px;border-radius:8px;border:1px solid ${st === "now" ? "#4d3a12" : "var(--line3)"};background:${st === "now" ? "var(--amber-bg)" : st === "done" ? "var(--blue-bg)" : "var(--panel2)"}">
        <b style="font-size:12px;color:${st === "now" ? "var(--amber)" : "var(--fg2)"}">${t}</b><span style="font-size:10.5px;color:var(--dim)">${s}</span></span>`
    ).join("");

    const tdL = "padding:3px 6px;border:1px solid var(--line2);background:rgba(13,20,32,.6);color:var(--mute);white-space:nowrap";
    const tdV = "padding:3px 6px;border:1px solid var(--line2);color:var(--fg2);white-space:nowrap";

    const modalBody = `<div style="padding:10px 14px 0;display:flex;align-items:center;gap:8px">
        <span class="seg"><button aria-pressed="true">_1 발견</button><button aria-pressed="false">_2 불발견</button></span>
        <span style="font-size:12px;color:var(--mute)">작성자 <b style="color:var(--fg2)">김○○ 경사</b> 판정 메모: 「상·중 칸 수 일치, 하 부위 소실」</span>
        <span style="margin-left:auto;display:flex;gap:5px">
          <button class="btn sm">이전</button><button class="btn sm">다음</button>
          <button class="btn sm locked" title="작성자만">그룹등록</button><button class="btn sm locked" title="작성자만">확인대상</button>
          <button class="btn sm">프린트</button><button class="btn sm">닫기</button></span>
      </div>
      <div style="display:grid;grid-template-columns:250px 210px 320px minmax(0,1fr);gap:10px;padding:10px 14px">
        <div class="pinbox">${apin(5, "voice", true)}<span class="crumb" style="display:block;padding:3px 6px;margin-bottom:4px;border-radius:4px;background:var(--strip)">유류 이미지</span>
          <span class="imgbox pinbox" style="display:block;height:380px">${M.photo({ zones: ["lines", "grid", "blocks"], rot: -4, tag: "1" })}${photoMarks()}${apin(12, "better", true)}
            <span style="position:absolute;left:8px;top:34px;display:flex;gap:4px;align-items:center;padding:2px 7px;border-radius:999px;background:rgba(5,8,13,.78);border:1px solid #2b4a78;font-size:10.5px;color:#bfdbfe">● 작성자 표시 1–4 · 김○○</span>
            <span class="cap">00001-25-0640_1</span></span></div>
        <div><span class="crumb" style="display:block;padding:3px 6px;margin-bottom:4px;border-radius:4px;background:var(--strip)">발견 이미지</span>
          <span class="imgbox" style="display:block;height:380px;background:#e9ecf0">${sole({ kind: "shoe", zones: ["lines", "grid", "blocks"] })}${shoeMarks()}<span class="cap" style="color:#1f2a3a;text-shadow:none">275178</span></span></div>
        <div style="display:grid;gap:6px;align-content:start">
          <span class="crumb" style="display:block;padding:3px 6px;border-radius:4px;background:var(--strip)">측면 이미지</span>
          <span class="imgbox" style="display:block;height:84px;background:#e9ecf0">${sideShoe()}</span>
          <table style="width:100%;border-collapse:collapse;font-size:11.5px"><tbody>
            <tr><td style="${tdL}">이미지번호</td><td style="${tdV}" class="mono">00001-25-0640_1</td><td style="${tdL}">화류번호</td><td style="${tdV}" class="mono">275178</td></tr>
            <tr><td style="${tdL}">사건명</td><td style="${tdV}">절도</td><td style="${tdL}">화종</td><td style="${tdV}">슬리퍼</td></tr>
            <tr><td style="${tdL}">채취방법</td><td style="${tdV}">사진촬영법</td><td style="${tdL}">상표명</td><td style="${tdV}">기타</td></tr>
          </tbody></table>
          <span style="font-size:11px;color:var(--dim)">사건정보 · 신발정보 전체 라벨은 S06과 같음 ▾</span>
          <div style="display:flex;gap:6px;align-items:center;font-size:11.5px;color:var(--mute)"><span class="chip blue" style="height:19px;font-size:10.5px">두 이미지 함께</span>− 160% ＋ · 처음상태 · 평준화 · 색상반전 …</div>
          <div class="pinbox" style="margin-top:4px;padding:8px 10px 4px;border:1px solid var(--line3);border-radius:10px;background:linear-gradient(160deg,var(--panel2),var(--panel))">${apin(13, "plus")}
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px"><b style="font-size:12px;color:var(--fg)">독립 점검 · 내가 직접 확인 <span class="mono" style="color:var(--dim);font-weight:400">_1</span></b><span class="mono" style="font-size:11px;color:var(--amber)">4 / 5</span></div>
            ${[
              ["ok", "✓", "상 부위 줄무늬 수 직접 셈", "9 ↔ 9"],
              ["ok", "✓", "중 부위 격자 칸 수", "7 ↔ 7"],
              ["ok", "✓", "하 부위 소실 → 판단 제외에 동의", "표시 일치"],
              ["ok", "✓", "자 기준 길이 비교 (예시)", "26.8 ↔ 27.0cm"],
              ["warn", "·", "마모·흠 같은 개별 특징", "아직 안 봄"],
            ]
              .map(([c, i, t, v]) => `<div class="check"><span class="ic ${c}">${i}</span><span style="color:var(--fg2)">${t}</span><span class="mono" style="color:${c === "ok" ? "var(--mute)" : "var(--amber)"};font-size:10.5px">${v}</span></div>`)
              .join("")}
            <div style="padding:4px 0 2px;font-size:10.5px;color:var(--dim)">작성자 표시를 끄고 먼저 세어 본 뒤 켜서 맞춰 볼 수 있습니다.</div>
          </div>
        </div>
        <div class="pinbox" style="display:grid;gap:8px;align-content:start;padding-left:10px;border-left:1px dashed #1d4a44">${apin(7, "plus")}
          <div class="pinbox" style="padding:9px 10px;border:1px solid var(--line3);border-radius:10px;background:linear-gradient(160deg,var(--panel2),var(--panel))">${apin(14, "plus")}
            <div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:12px;color:var(--fg)">의견 비교 · 작성자 ↔ 나</b><span class="mono" style="font-size:12px;color:#4ade80">1 / 2 일치</span></div>
            <div class="fx-bar" style="margin:7px 0 6px"><i style="width:50%;background:linear-gradient(90deg,#22c55e,#4ade80)"></i></div>
            ${[
              ["_1", "발견", "발견", "ok"],
              ["_2", "불발견", "—", "wait"],
            ]
              .map(
                ([n, a, me, s]) => `<div style="display:grid;grid-template-columns:28px minmax(0,1fr) 16px minmax(0,1fr) 58px;gap:4px;align-items:center;padding:3px 0;border-top:1px solid var(--line2);font-size:11.5px">
                <span class="mono" style="color:var(--fg2)">${n}</span><span>${resChip(a)}</span><span style="color:var(--dim)">↔</span><span>${me === "—" ? `<span style="color:var(--faint)">아직 안 봄</span>` : resChip(me)}</span>
                <span style="text-align:right;font-size:11px;color:${s === "ok" ? "#4ade80" : "var(--dim)"}">${s === "ok" ? "✓ 같음" : "대기"}</span></div>`
              )
              .join("")}
            <div style="margin-top:4px;font-size:10.5px;color:var(--dim);line-height:1.45">왼쪽 = 작성자 판정, 오른쪽 = 내가 고른 판정. 하나라도 다르면 「의견 불일치」와 사유 칸이 열립니다.</div>
          </div>
          <span class="ai-mark">● 누락 점검</span>
          ${[["이미지 2장 모두 판정", 1], ["확인대상 저장됨 (1건)", 1], ["판정 메모 있음", 1], ["_2 확인대상 없음 — 불발견과 맞음", 1]]
            .map(([t, ok]) => `<div style="display:flex;gap:6px;font-size:11.5px;color:var(--fg2)"><b style="color:${ok ? "#4ade80" : "var(--amber)"}">${ok ? "✓" : "!"}</b>${t}</div>`)
            .join("")}
          <div style="padding:7px 9px;border:1px solid #1d4a44;border-radius:8px;background:var(--teal-bg);font-size:11.5px">
            <div style="display:flex;justify-content:space-between"><span class="ai-mark">● 정밀 대조 참고</span><b class="mono" style="color:var(--teal)">82%</b></div>
            <div class="mono" style="margin-top:3px;color:var(--fg2);font-size:10.5px">Inlier 0.66 · NCC 0.78 · W 0.17 · MI 1.21</div>
            <div style="margin-top:3px;color:var(--mute)">현장 사건이라 참고용 · 판단은 눈으로</div></div>
        </div>
      </div>
      <div class="pinbox" style="margin:0 14px 12px;padding:9px 12px 8px;border:1px solid var(--line2);border-radius:10px;background:rgba(13,20,32,.5)">${apin(15, "plus", true)}
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;padding-left:22px"><span class="crumb">사건 타임라인 · 00001-25-0640</span><span style="font-size:10.5px;color:var(--dim)">날짜는 예시 · 누가 언제 무엇을 했는지 사용 기록에서 자동</span></div>
        <div style="position:relative;display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:6px">
          <span style="position:absolute;left:5px;right:5px;top:5px;height:1px;background:var(--line3)"></span>
          ${[
            ["d", "07-15", "발생 · 채취", "부산청"],
            ["d", "07-22", "등록 · 이미지 2장", "수사관"],
            ["ai", "07-22", "AI 사전 처리", "이진화 · 문양 제안"],
            ["d", "07-23", "검색 · 판정", "김○○ · _1 발견 _2 불발견"],
            ["d", "07-24", "결과확인완료", "김○○ 경사"],
            ["d", "07-24", "교차 검증 요청", "→ 박○○ 경위"],
            ["now", "07-25 09:12", "접수 · 검증 중", "지금 이 화면"],
            ["", "다음", "감정서작성", "작성자 김○○"],
          ]
            .map(
              ([s, at, t, w]) => `<div style="position:relative;display:grid;gap:1px;padding-top:14px;min-width:0">
              ${s === "now" ? `<span class="fx-live" style="position:absolute;left:1px;top:1px;width:9px;height:9px;background:var(--amber)"></span>` : `<span style="position:absolute;left:1px;top:1px;width:9px;height:9px;border-radius:50%;background:${s === "ai" ? "var(--teal)" : s === "d" ? "var(--blue2)" : "var(--panel3)"};border:1px solid ${s ? "transparent" : "var(--line3)"}"></span>`}
              <span class="mono" style="font-size:10px;color:${s === "now" ? "var(--amber)" : "var(--dim)"}">${at}</span>
              <b style="font-size:11.5px;font-weight:600;color:${s === "now" ? "var(--amber)" : s ? "var(--fg)" : "var(--dim)"};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t}${s === "ai" ? ` <span class="ai-tag">AI</span>` : ""}</b>
              <span style="font-size:10.5px;color:var(--mute);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${w}</span></div>`
            )
            .join("")}
        </div>
      </div>
      <div class="pinbox" style="display:flex;gap:10px;align-items:center;padding:10px 14px;background:var(--strip);border-radius:0 0 14px 14px" data-role="analyst admin">${pin(6, "voice")}
        <span class="chip blue">교차 검증 접수함 · 07-25 09:12</span>
        <span style="font-size:12.5px;color:var(--fg2)">교차 검증 결과</span>
        <span class="radio" style="font-size:12.5px"><span class="on">의견 일치</span><span>의견 불일치</span></span>
        <span class="inp" style="flex:1;color:var(--dim)">의견 (불일치면 사유 필수 — 작성자에게 돌아감)</span>
        <button class="btn pri">검증결과 저장</button>
      </div>`;

    return M.shell(
      { active: ["족윤적 검증", "결재 대기함"], tabs: ["사건관리", "감정서작성", "족윤적 검증", "결재 대기함"], tabOn: "족윤적 검증", title: "족윤적 검증 · 결재 대기함", h: 1310 },
      `<div class="page-head">
        <div><div class="crumb">족윤적 · 족윤적관리 / 감정서관리</div><h3>족윤적 검증 · 결재 대기함</h3>
          <p>SCAS처럼 두 탭을 따로 두고 같은 화면 틀에서 바꿉니다. 교차 검증은 감정관끼리, 결재는 기술책임자가 합니다.</p></div>
        <div class="pinbox" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end">${apin(9, "better", true)}${flow}</div>
      </div>

      <div class="pinbox" style="display:flex;gap:10px;align-items:center;margin-bottom:10px">${pin(2, "better")}
        <span class="seg" data-role="analyst admin"><button aria-pressed="true">족윤적 검증 <span class="mono" style="color:var(--amber)">1</span></button><button aria-pressed="false">결재 대기함</button></span>
        <span class="seg" data-role="verifier"><button aria-pressed="false">족윤적 검증</button><button aria-pressed="true">결재 대기함 <span class="mono" style="color:var(--amber)">3</span></button></span>
        <span style="color:var(--dim);font-size:12px">보는 사람에 맞는 탭이 먼저 열립니다</span>
      </div>

      <div data-role="analyst admin" class="pinbox" style="position:relative;min-height:1000px;margin-bottom:14px">
        <div class="panel pinbox" style="margin-bottom:10px">${apin(1, "keep", true)}
          <div class="panel-b" style="display:flex;gap:10px;align-items:center">
            <span class="crumb">접수일자</span><span class="inp mono" style="width:220px">2025-06-25 ~ 2025-07-24</span><button class="btn pri">조회</button>
            <span style="margin-left:auto;display:flex;gap:6px"><span class="chip amber"><span class="dot"></span>내게 온 요청 1</span><span class="chip">내가 보낸 요청 1</span></span>
          </div>
        </div>
        <div class="panel tc">
          <div class="panel-h"><span class="lbl">CROSS CHECK</span><span class="t">족윤적 검증</span></div>
          <table class="grid"><thead><tr><th>감정번호</th><th>대조번호/용의자번호</th><th>접수일자</th><th>의뢰관서</th><th>작성자</th><th>사건결과</th><th>검증결과확인</th><th class="pinbox">교차 검증 ${pin(3, "voice")}</th></tr></thead><tbody>${vrows}</tbody></table>
        </div>
        ${layer(
          {
            l: 10,
            t: 236,
            w: 1160,
            title: "현장문양검색결과 상세조회 · 교차 검증",
            head: `<span style="margin-left:8px">${pin(4, "keep")}</span><span style="margin-left:8px;color:var(--mute);font-size:12px">00001-25-0640 · 「확인」으로 열림</span>`,
          },
          modalBody
        )}
      </div>

      <div data-role="verifier admin" class="pinbox" style="display:grid;gap:10px">
        <div class="crumb" data-role="admin">관리자 보기 — 아래는 「결재 대기함」 탭 (기술책임자)</div>
        <div class="panel pinbox">${apin(8, "keep", true)}
          <div class="panel-b" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr)) auto;gap:10px 12px;align-items:end">
            <div><div class="crumb" style="margin-bottom:4px">기안일자</div><span class="inp w100 mono">2025-07-01 ~ 2025-07-25</span></div>
            <div><div class="crumb" style="margin-bottom:4px">기안자</div><span class="inp w100" style="color:var(--dim)">이름</span></div>
            <div><div class="crumb" style="margin-bottom:4px">제목</div><span class="inp w100" style="color:var(--dim)">제목 일부</span></div>
            <div><div class="crumb" style="margin-bottom:4px">수신처</div><span class="inp w100">경찰청 범죄분석과<span class="caret">▾</span></span></div>
            <div style="display:flex;gap:6px;align-items:center"><button class="btn">조회</button><button class="btn">초기화</button><button class="btn pri">결재</button>
              <span style="width:1px;height:20px;background:var(--line3)"></span><button class="btn danger">반려</button></div>
          </div>
        </div>
        <div class="panel tc">
          <div class="panel-h"><span class="lbl">APPROVAL</span><span class="t">결재 대기함</span><span class="r" style="color:var(--dim);font-size:12px">교차 검증이 끝난 감정서만 옵니다</span></div>
          <table class="grid"><thead><tr><th>☐</th><th>문서종류</th><th>제목</th><th>업무구분</th><th>담당부서</th><th>작성자</th><th>교차 검증</th><th>기안일</th></tr></thead><tbody>${arows}</tbody></table>
        </div>
        <div class="panel pinbox">${apin(10, "plus", true)}
          <div class="panel-h"><span class="lbl">DOCUMENT</span><span class="t mono">00001-25-0612</span><span class="t">절도 족적 감정 결과</span><span class="r"><button class="btn sm">감정서 열기 (S09)</button></span></div>
          <div class="panel-b" style="display:grid;grid-template-columns:150px minmax(0,1fr) 320px;gap:16px">
            <div style="height:206px;padding:10px 11px;border-radius:4px;background:#f5f2ea;box-shadow:0 10px 26px rgba(0,0,0,.45),0 0 0 1px #c9c4b8;display:grid;gap:4px;align-content:start;color:#1f2430;overflow:hidden">
              <span style="font:600 6.5px var(--font-mono);color:#8a8578">KPSI-KQP-16-F05</span>
              <b style="font-size:11px;letter-spacing:.3em;text-align:center;font-family:serif">감 정 서</b>
              ${[88, 70, 80, 62].map((w) => `<span style="display:block;height:3px;width:${w}%;background:#d6d1c4;border-radius:2px"></span>`).join("")}
              <span style="display:grid;grid-template-columns:1fr 1fr;gap:3px;margin:2px 0"><span style="display:block;height:46px;overflow:hidden;border-radius:2px">${M.photo({ zones: ["herring", "grid", "dots"], rot: -3, tag: "", ruler: false })}</span><span style="display:block;height:46px;background:#e9ecf0;border-radius:2px">${sole({ kind: "shoe", zones: ["herring", "grid", "dots"] })}</span></span>
              ${[76, 54].map((w) => `<span style="display:block;height:3px;width:${w}%;background:#d6d1c4;border-radius:2px"></span>`).join("")}
              <span style="display:block;height:3px;width:82%;background:rgba(13,148,136,.45);border-radius:2px" title="AI 초안 문장(감정관 확인함)"></span>
              <span style="display:flex;gap:3px;margin-top:3px">${["감정관", "감정관", "기술책임자"].map((r) => `<span style="flex:1;padding:2px 0;border:1px solid #c9c4b8;border-radius:3px;font-size:7.5px;text-align:center;color:#5b5648">${r}</span>`).join("")}</span>
            </div>
            <div>
              <div class="crumb" style="margin-bottom:6px;display:flex;align-items:center;gap:6px">결재 흐름 (이름 가림) <span class="chip" style="height:17px;font-size:10px">결재 세부 순서는 확인 중</span></div>
              ${[
                ["done", "결과확인완료", "박○○ 경위(감정관)", "07-23 10:05"],
                ["done", "교차 검증 · 의견 일치", "김○○ 경사(감정관)", "07-24 09:40"],
                ["done", "감정서작성 · 결재 올림", "박○○ 경위(감정관)", "07-24 17:52"],
                ["now", "결재", "최○○ 경감(기술책임자)", "대기 중"],
              ]
                .map(
                  ([s, t, w, at]) => `<div style="display:grid;grid-template-columns:14px minmax(0,1fr) auto;gap:8px;align-items:center;padding:4px 0;border-top:1px solid var(--line2);font-size:12px">
                  <span style="width:9px;height:9px;border-radius:50%;background:${s === "now" ? "var(--amber)" : "var(--blue2)"}"></span><span><span style="color:var(--fg)">${t}</span> <span style="color:var(--dim)">· ${w}</span></span><span class="num" style="color:var(--mute)">${at}</span></div>`
                )
                .join("")}
            </div>
            <div style="display:grid;gap:8px;align-content:start">
              <div class="pinbox" style="padding:6px 10px 2px;border:1px solid var(--line3);border-radius:10px;background:linear-gradient(160deg,var(--panel2),var(--panel))">${apin(16, "plus")}
                <div class="crumb" style="padding-top:2px">결재 전 확인 <span style="color:var(--dim)">· 시스템이 미리 맞춰 봄</span></div>
                ${[
                  ["ok", "✓", "교차 검증 · 의견 일치", "김○○ 07-24"],
                  ["ok", "✓", "감정서 필수 항목(규칙 검증)", "5 / 5"],
                  ["ok", "✓", "AI 초안 문장 → 감정관 확인", "2 / 2"],
                  ["ok", "✓", "원본 이미지 지문(해시) 그대로", "일치"],
                ]
                  .map(([c, i, t, v]) => `<div class="check"><span class="ic ${c}">${i}</span><span style="color:var(--fg2)">${t}</span><span class="mono" style="color:var(--mute);font-size:10.5px">${v}</span></div>`)
                  .join("")}
              </div>
              <div class="crumb">반려 사유 <span style="color:var(--dim)">(반려 시 필수)</span></div>
              <span class="inp w100" style="height:52px;align-items:flex-start;padding:6px 8px;white-space:normal;color:var(--dim)">예) 이미지 페이지 _2 블록 누락</span>
              <div style="padding:7px 9px;border-radius:8px;background:var(--panel2);font-size:11.5px;color:var(--mute);line-height:1.5"><b style="color:var(--fg2)">감사 기록</b> · 열람·결재·반려를 누가 언제 했는지 사용 기록에 남고 지울 수 없습니다.</div>
            </div>
          </div>
        </div>
      </div>
      <div class="pinbox" style="margin-top:10px;display:flex;gap:8px;align-items:center;color:var(--mute);font-size:12px">${pin(11, "better")}
        <span>감정관은 「족윤적 검증」 탭(남이 보낸 요청만 확인 가능), 기술책임자는 「결재 대기함」 탭이 먼저 열립니다. 관리자는 둘 다 봅니다. 수사관에게는 두 메뉴가 없습니다.</span>
      </div>`
    );
  }

  function scas() {
    const vrows = VQ.map(
      (q) => `<tr><td>${q.no}</td><td>${q.sus}</td><td>${q.at}</td><td>${q.req}</td><td>${q.who.replace(/ .*/, "")}</td><td>${q.res}</td><td><span class="sbtn n">확인</span> <span class="sbtn n">검증결과</span></td></tr>`
    ).join("");
    return M.scasShell(
      { treeOn: "족윤적관리 ▸", tabOn: "족윤적 검증", h: 700 },
      `<div class="box" style="padding:8px;margin-bottom:8px">📅 2025-06-25 ~ 📅 2025-07-24 <span class="sbtn">조회</span></div>
      <div class="bar">족윤적 검증</div>
      <div class="box"><table><thead><tr><th>감정번호</th><th>대조번호/용의자번호</th><th>접수일자</th><th>의뢰관서</th><th>작성자</th><th>사건결과</th><th>검증결과확인</th></tr></thead><tbody>${vrows}</tbody></table></div>
      <div style="margin:22px 0 8px;padding-top:8px;border-top:2px dashed #b9bfcc;color:#7a808c;font-size:11px">↓ 탭을 「결재 대기함」으로 바꾸면 보이는 화면</div>
      <div class="box" style="padding:8px;margin-bottom:8px"><table><tbody>
        <tr><td class="lbl">기안일자</td><td>📅 ~ 📅</td><td class="lbl">기안자</td><td></td><td class="lbl">제목</td><td></td><td class="lbl">수신처</td><td></td></tr>
      </tbody></table><div style="margin-top:6px;text-align:right"><span class="sbtn">조회</span> <span class="sbtn">초기화</span> <span class="sbtn b">결재</span></div></div>
      <div class="bar">결재 대기함</div>
      <div class="box"><table><thead><tr><th>☐</th><th>문서종류</th><th>제목</th><th>업무구분</th><th>담당부서</th><th>작성자</th></tr></thead>
        <tbody><tr><td colspan="6" style="height:120px;text-align:center;color:#999">(녹화 시점에 비어 있음)</td></tr></tbody></table></div>
      ${M.pain(640, 30, "<b>누가 누구에게 보낸 요청인지 안 보임</b> — 「교차 검증 할 수 있는 사람한테 요청」하지만 목록에 요청자·상태 열이 없음 (5613 17:54, 18:37)", 300)}
      ${M.pain(700, 160, "<b>「확인」 = 상세조회 팝업 + 뷰어 창</b> — 검증자가 뷰어 2개를 다시 나란히 띄워 비교 (5613 18:22–18:30)", 300)}
      ${M.pain(600, 400, "<b>결과는 말로만</b> — 「교차 검증 결과 의견이 일치한다고 해서 끝내」, 결재 대기함에서 그 결과가 안 보임 (5613 18:42, 18:52)", 300)}`
    );
  }

  M.add({
    id: "s08",
    code: "S08",
    group: "감정서관리",
    title: "검증·결재",
    refs: [
      { t: "SCAS 족윤적 검증 탭", v: "5613 18:22 · 18:37" },
      { t: "SCAS 결재 대기함 탭", v: "5613 18:52" },
      { t: "인터뷰", v: "5613 17:42–18:48 · 19:32", voice: true },
      { t: "사업계획서", v: "p13 · p16–19 · p42" },
    ],
    lead: "흐름은 결과확인완료 → 교차 검증(다른 감정관) → 감정서작성 → 결재(기술책임자)입니다. SCAS처럼 「족윤적 검증」과 「결재 대기함」을 따로 두고 같은 화면 틀에서 탭으로 바꿉니다. 교차 검증자는 「확인」으로 상세조회 팝업을 열어 유류·발견 이미지를 나란히 보고 「의견 일치 / 불일치」를 남깁니다. r3: 팝업의 유류 사진(실제 사진 느낌)과 발견 밑창에 작성자가 남긴 표시(같은 번호 1–4, 상·중·하 경계, 하 소실 구역)를 겹쳐 보이고, 검증자가 직접 세어 보는 독립 점검표 · 작성자 ↔ 나 의견 비교 · 사건 타임라인을 붙였습니다. 결재 대기함에는 문서 미리보기와 「결재 전 확인」(시스템이 미리 맞춰 본 4가지)을 더했습니다.",
    fit: {
      area: ["same", "두 탭 모두 위 검색 폼 · 아래 목록 그대로"],
      buttons: ["same", "행 끝 [확인][검증결과], 결재 대기함 조회·초기화·결재 순서 그대로, 반려만 끝에 추가"],
      popup: ["near", "「확인」 → 상세조회 레이어 팝업 1겹(뷰어 창 대신 팝업 안 나란히 비교)"],
      columns: ["same", "두 탭 열 순서 원문 그대로, 끝에 교차 검증 열 1개만 추가"],
    },
    scas,
    ours,
    notes: [
      { n: 1, kind: "keep", title: "족윤적 검증 탭 그대로", text: "날짜 범위 + 조회, 열 감정번호 · 대조번호/용의자번호 · 접수일자 · 의뢰관서 · 작성자 · 사건결과 · 검증결과확인[확인][검증결과]를 같은 순서로 둡니다. 새 「교차 검증」 상태 열은 맨 끝에만 붙였습니다.", src: "5613 18:37" },
      { n: 2, kind: "better", title: "두 탭은 따로, 같은 틀에서 전환", text: "SCAS MDI 탭처럼 「족윤적 검증」과 「결재 대기함」을 합치지 않고 탭으로 바꿉니다. 하는 사람(감정관 / 기술책임자)과 시점(감정서 전 / 후)이 달라서입니다. 보는 사람에 맞는 탭이 먼저 열립니다.", src: "5613 18:37 · 18:52" },
      { n: 3, kind: "voice", title: "교차 검증 = 다른 감정관", text: "「제 다음 사람이 교차 검증이 일어나야 되는데… 교차 검증 할 수 있는 사람한테 요청을 한단 말이에요」 — 이 탭은 감정관이 받는 요청함입니다. 본인이 작성한 건은 「확인」 버튼 없이 「보냄 → 김○○ 검증 중」만 보입니다.", src: "5613 17:42–17:59" },
      { n: 4, kind: "keep", title: "「확인」 = 상세조회 팝업 1겹", text: "SCAS처럼 「확인」을 누르면 현장문양검색결과 상세조회 팝업이 열립니다(S06과 같은 틀, 이전·다음·그룹등록·확인대상·프린트·닫기 순서). 그룹등록·확인대상은 작성자만 쓸 수 있어 흐리게 둡니다. 뷰어 창은 뜨지 않습니다.", src: "5613 18:22–18:30" },
      { n: 5, kind: "voice", title: "유류 ↔ 발견 이미지 나란히가 기본", text: "「내가 이 사람 거를 보고… 이거랑 이거랑 보니까 맞아」 — 팝업을 열면 이미지별(_1, _2) 유류·발견 이미지가 같은 배율로 나란히 펼쳐져 있습니다. 작성자의 판정 메모도 같은 줄에 보입니다.", src: "5613 18:14–18:34" },
      { n: 6, kind: "voice", title: "결과는 「의견 일치 / 불일치」", text: "「교차 검증을 접수를 해… 결과 값을 교차 검증 결과 의견이 일치한다고 해서 끝내」 — 접수 표시 뒤 의견 일치 / 의견 불일치를 고르고 「검증결과 저장」. 불일치면 사유를 적어 작성자에게 돌려보냅니다. 승인·반려라는 말은 결재에만 씁니다.", src: "5613 18:34–18:48" },
      { n: 7, kind: "plus", title: "누락 점검 + 정밀 대조 참고", text: "이미지마다 판정이 있는지, 확인대상이 저장됐는지, 불발견인데 확인대상이 남아 있지 않은지를 규칙으로 점검합니다. 정밀 대조 지표는 「현장 사건 참고용」으로만 작게 붙였습니다.", src: "BP p13 · p42" },
      { n: 8, kind: "keep", title: "결재 대기함 탭 그대로", text: "기안일자 · 기안자 · 제목 · 수신처와 조회 · 초기화 · 결재 버튼 순서, 열 ☐ · 문서종류 · 제목 · 업무구분 · 담당부서 · 작성자를 유지합니다. 새 버튼 「반려」는 구분선 뒤 끝에, 새 열 「교차 검증」 · 「기안일」은 맨 끝에 붙였습니다.", src: "5613 18:52" },
      { n: 9, kind: "better", title: "흐름 표시 — 팀장 단계 없음", text: "r1의 「1차 팀장 → 2차 기술책임자」는 인터뷰 근거가 없어 지웠습니다. 화면 위에 결과확인완료 → 교차 검증 → 감정서작성 → 결재 4칸을 두고 지금 칸을 주황으로 표시합니다. 결재의 세부 단계는 열린 질문입니다.", src: "5613 17:34–19:36" },
      { n: 10, kind: "plus", title: "결재 흐름 이력 · 감사 기록", text: "결재 대기함에서 문서를 고르면 결과확인완료 · 교차 검증 · 감정서작성 · 결재를 누가 언제 했는지 이름을 가려 보여 줍니다. 열람·결재·반려는 사용 기록에 남고 지울 수 없습니다.", src: "BP p16–19" },
      { n: 11, kind: "better", title: "보는 사람에 따라", text: "감정관은 「족윤적 검증」 탭과 의견 일치/불일치 저장을, 기술책임자는 「결재 대기함」 탭과 결재·반려를 봅니다. 관리자는 둘 다, 수사관은 메뉴가 없습니다." },
      { n: 12, kind: "better", title: "작성자 표시를 겹쳐 보기(r3)", text: "검증자가 뷰어 두 개를 다시 띄워 「어디를 보고 맞다고 했지?」를 찾지 않도록, 작성자(김○○)가 남긴 표시 — 같은 자리 번호 1–4, 상·중·하 경계선, 「하 소실 · 판단 제외」 구역 — 를 유류 사진과 발견 밑창에 같은 번호로 겹쳐 보여 줍니다. 끄고 켤 수 있습니다.", src: "5613 18:14–18:34" },
      { n: 13, kind: "plus", title: "독립 점검표(r3)", text: "검증자가 작성자 판정을 따라가지 않고 직접 확인한 것을 체크합니다 — 상 부위 줄무늬 수, 중 부위 격자 칸 수, 하 소실 제외 동의, 자 기준 길이, 마모·흠 같은 개별 특징. 표시를 끄고 먼저 세어 본 뒤 켜서 맞춰 볼 수 있습니다. 숫자는 예시입니다.", src: "5613 18:22–18:34 · BP p42" },
      { n: 14, kind: "plus", title: "의견 비교 · 작성자 ↔ 나(r3)", text: "이미지마다 작성자 판정과 검증자가 고른 판정을 나란히 놓고 같은지 표시합니다(지금 1 / 2 같음, _2는 아직). 하나라도 다르면 「의견 불일치」와 사유 칸이 열립니다. 고르는 것은 검증자 본인입니다.", src: "5613 18:34–18:48" },
      { n: 15, kind: "plus", title: "사건 타임라인(r3)", text: "발생·채취 → 등록 → AI 사전 처리 → 검색·판정 → 결과확인완료 → 교차 검증 요청 → 접수(지금) → 감정서작성을 한 줄로 보여 줍니다. 사용 기록에서 자동으로 채우며, 날짜는 예시입니다.", src: "BP p16–19" },
      { n: 16, kind: "plus", title: "결재 전 확인 · 문서 미리보기(r3)", text: "기술책임자가 문서를 열기 전에 시스템이 미리 맞춰 본 4가지 — 교차 검증 의견 일치, 감정서 필수 항목, AI 초안 문장을 감정관이 확인했는지, 원본 이미지 지문(해시)이 그대로인지 — 를 보여 줍니다. 왼쪽 미리보기는 실제 감정서처럼 그림 두 장과 서명란(감정관·감정관·기술책임자)이 보입니다. 결재 세부 순서는 아직 확인 중이라 단정하지 않습니다.", src: "BP p16–19 · p42 · 5613 18:52" },
    ],
  });
})();
