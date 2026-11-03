/* S06 상세 조회·정밀 대조 — SCAS 「현장문양검색결과 상세조회」 레이어 팝업(S8) + 이미지 뷰어 창(S9)
   (IMG_5613 06:02, 08:52–09:20, 17:22, 18:22–18:30, 24:07–25:15, 28:37–30:07)
   r2: SCAS 팝업 배치(위 유류|발견|측면 3단, 아래 문양) 그대로 + 정밀 대조는 오른쪽 덧붙임 */
(function () {
  const { pin, apin, sole, picon } = M;

  /* 우리 다크 모달 1겹: 뒤 화면(검색결과)은 어둡게 깔린 채 보인다 */
  const layer = ({ l, t, w, title, head = "" }, body) => `
    <div style="position:absolute;inset:0;z-index:5;background:rgba(5,8,13,.74)"></div>
    <div class="panel pinbox" style="position:absolute;left:${l}px;top:${t}px;width:${w}px;z-index:6;box-shadow:0 24px 70px rgba(0,0,0,.65)">
      <div class="panel-h" style="background:var(--blue-bg)"><span class="t">${title}</span>${head}<span class="r"><span style="color:var(--mute)">✕</span></span></div>
      ${body}
    </div>`;

  /* 대응점(밑창 좌표 0–100 × 0–264). ok=1 일치, 0 불일치 */
  const PTS = [
    [40, 40, 1],
    [62, 80, 1],
    [55, 140, 1],
    [40, 200, 1],
    [58, 236, 0],
  ];
  const W1 = 245, W2 = 205, GAP = 10, H = 340, S = H / 264; /* 유류·발견 상자 크기와 밑창 배율 */
  const OX1 = (W1 - 100 * S) / 2, OX2 = W1 + GAP + (W2 - 100 * S) / 2;

  function pairSvg() {
    const W = W1 + GAP + W2;
    const L = PTS.map(([x, y]) => [OX1 + S * x, S * y]);
    const R = PTS.map(([x, y], i) => [OX2 + S * (x + (i % 2 ? 1.5 : -1)), S * (y + (i % 2 ? -1.2 : 1))]);
    const col = (ok) => (ok ? "var(--teal)" : "var(--red)");
    const lines = PTS.map(
      (p, i) =>
        `<line x1="${(L[i][0] + 8).toFixed(1)}" y1="${L[i][1].toFixed(1)}" x2="${(R[i][0] - 8).toFixed(1)}" y2="${R[i][1].toFixed(1)}" style="stroke:${col(p[2])};stroke-width:1.3;stroke-dasharray:${p[2] ? "none" : "4 3"};opacity:.85"/>`
    ).join("");
    const box = ([x, y], i) =>
      `<rect x="${(x - 8).toFixed(1)}" y="${(y - 8).toFixed(1)}" width="16" height="16" rx="3" style="fill:rgba(5,8,13,.78);stroke:${col(PTS[i][2])};stroke-width:1.4"/>
       <text x="${x.toFixed(1)}" y="${(y + 3.6).toFixed(1)}" text-anchor="middle" style="fill:${PTS[i][2] ? "var(--teal)" : "#f87171"};font:700 10px var(--font-mono)">${i + 1}</text>`;
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="position:absolute;left:0;top:0;width:${W}px;height:${H}px;pointer-events:none;z-index:2" aria-hidden="true">${lines}${L.map(box).join("")}${R.map(box).join("")}</svg>`;
  }

  /* 신발 옆모습(가짜) — 측면 이미지 자리 */
  const sideShoe = () =>
    `<svg viewBox="0 0 200 90" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-label="측면 이미지(가짜 예시)"><rect width="200" height="90" style="fill:var(--panel)"/>
      <path d="M20 62C20 40 40 30 70 28L95 18C110 12 125 22 130 32C150 36 175 44 182 56L182 68L20 70Z" style="fill:var(--panel3);stroke:var(--line3)"/>
      <path d="M18 70L184 70L182 76L22 78Z" style="fill:var(--dim)"/><path d="M98 24L120 40M92 30L114 44" style="stroke:var(--line3);stroke-width:2"/></svg>`;

  const gauge = (v) => {
    const len = 157.08;
    return `<svg viewBox="0 0 120 68" width="104" height="59" aria-label="종합 신뢰도 ${v}%">
      <path d="M10 62A50 50 0 0 1 110 62" style="fill:none;stroke:var(--line3);stroke-width:10;stroke-linecap:round"/>
      <path d="M10 62A50 50 0 0 1 110 62" style="fill:none;stroke:var(--teal);stroke-width:10;stroke-linecap:round;stroke-dasharray:${((len * v) / 100).toFixed(1)} ${len}"/></svg>`;
  };

  /* SCAS 정보표: 사건정보 | 신발정보 (라벨 순서 원문 그대로) */
  const INFO = [
    ["이미지번호", "00001-25-0646_1", "화류번호", "305659"],
    ["SCAS번호", "2025-11710", "제조사", "○○산업"],
    ["문서번호", "SCAS수사부-2944", "상표명", "○○스포츠"],
    ["의뢰관서", "대구청", "모델번호", ""],
    ["사건명", "주거침입", "화종", "운동화"],
    ["채취일시", "2025-07-19", "수집년도", "2025"],
    ["채취장소", "주방 바닥", "그룹명", "○○스포츠-012"],
    ["채취방법", "전사판채취법", "비고", "용의자신발"],
  ];
  const tdL = "padding:3px 6px;border:1px solid var(--line2);background:rgba(13,20,32,.6);color:var(--mute);white-space:nowrap";
  const tdV = "padding:3px 6px;border:1px solid var(--line2);color:var(--fg2);white-space:nowrap";

  /* 유류 이미지 문양 ↔ 발견 이미지 문양 (부위별) */
  const PROWS = [
    { z: "상", a: ["n32_04", "n31_02"], b: ["n32_04", "n31_02"] },
    { z: "중", a: ["n21_05"], b: ["n21_05", "s81b"] },
    { z: "하", a: ["n21_02"], b: ["n21_02", "n62_02"] },
    { z: "윤곽", a: ["s10c"], b: ["s10c"] },
  ];

  const BASIS = [
    { z: "상", ok: true, why: "헤링본 줄 9 ↔ 9줄 · 기울기 32° ↔ 31°" },
    { z: "중", ok: true, why: "격자 칸 수 가로 7 ↔ 7칸 · 세로 5 ↔ 5칸" },
    { z: "하", ok: false, why: "삼각형 5 ↔ 6개 · 현장 하 부위 일부 소실" },
  ];

  function ours() {
    /* 뒤에 깔린 문양검색결과(S05) — 어둡게 보이기만 */
    const bg = Array.from({ length: 16 }, (_, i) =>
      `<span class="imgbox" style="display:block;height:150px">${sole({ kind: "shoe", zones: [["herring", "grid", "tri"], ["wave", "grid", "blocks"], ["dots", "lines", "blocks"], ["herring", "dots", "grid"]][i % 4] })}<span class="cap" style="color:#1f2a3a;text-shadow:none">${i + 1} | ${87 - i * 3}</span></span>`
    ).join("");

    const icoCell = (arr, other) =>
      arr.map((n) => picon(n, other.includes(n) ? "sm" : "sm sel", other.includes(n) ? n : n + " — 상대편에 없음")).join(" ");
    const prow = (side) =>
      PROWS.map(
        (r) => `<div style="display:grid;grid-template-columns:34px minmax(0,1fr);align-items:center;gap:6px;padding:3px 0;border-top:1px solid var(--line2)">
          <span style="color:var(--mute);font-size:12px">${r.z}</span><span>${side === "a" ? icoCell(r.a, r.b) : icoCell(r.b, r.a)}</span></div>`
      ).join("");

    const info = INFO.map(
      (r) => `<tr><td style="${tdL}">${r[0]}</td><td style="${tdV}" class="${/\d{4}/.test(r[1]) ? "mono" : ""}">${r[1]}</td><td style="${tdL}">${r[2]}</td><td style="${tdV}">${r[3] || `<span style="color:var(--faint)">—</span>`}</td></tr>`
    ).join("");

    const metrics = [
      ["Inlier Ratio", "0.72"],
      ["NCC", "0.81"],
      ["Wasserstein", "0.14"],
      ["Mutual Info.", "1.36"],
    ].map(([k, v]) => `<span style="display:flex;justify-content:space-between;gap:6px"><span style="color:var(--mute)">${k}</span><b class="mono" style="color:var(--teal)">${v}</b></span>`).join("");

    const basis = BASIS.map(
      (r) => `<div style="display:grid;grid-template-columns:20px minmax(0,1fr) auto;gap:6px;align-items:baseline;padding:5px 0;border-top:1px solid var(--line2);font-size:11.5px">
        <b style="color:var(--fg)">${r.z}</b><span style="color:var(--fg2);line-height:1.4">${r.why}</span>
        <span class="chip ${r.ok ? "green" : "amber"}" style="height:18px;font-size:10px">${r.ok ? "일치" : "불일치"}</span></div>`
    ).join("");

    const modalBody = `<div style="display:grid;grid-template-columns:820px minmax(0,1fr);gap:14px;padding:12px 14px 14px">
      <div style="display:grid;gap:8px;min-width:0">
        <div class="pinbox" style="display:flex;justify-content:flex-end;align-items:center;gap:5px">${apin(2, "keep", true)}
          <button class="btn sm">이전</button><button class="btn sm">다음</button>
          <button class="btn sm" data-role="analyst admin">그룹등록</button><button class="btn sm warn" data-role="analyst admin">확인대상</button>
          <button class="btn sm">프린트</button><button class="btn sm">닫기</button>
          <span style="width:1px;height:18px;background:var(--line3);margin:0 3px" data-role="analyst admin"></span>
          <button class="btn sm ai" data-role="analyst admin">근거 이미지 감정서에 첨부</button>
        </div>
        <div class="pinbox" data-role="analyst admin" style="justify-self:end;display:flex;gap:8px;align-items:center;padding:4px 6px 4px 10px;border:1px solid #4d3a12;border-radius:8px;background:var(--amber-bg);font-size:12px;color:var(--fg2)">
          ${pin(3, "better")}확인대상에 등록하시겠습니까? <button class="btn sm ok">예</button><button class="btn sm">아니오</button>${pin(7, "voice")}
        </div>
        <div style="display:grid;grid-template-columns:${W1 + GAP + W2}px 350px;gap:10px">
          <div class="pinbox">${apin(6, "voice", true)}
            <div style="display:grid;grid-template-columns:${W1}px ${W2}px;gap:${GAP}px;margin-bottom:4px">
              <span class="crumb" style="padding:3px 6px;border-radius:4px;background:var(--strip)">유류 이미지</span><span class="crumb" style="padding:3px 6px;border-radius:4px;background:var(--strip)">발견 이미지</span></div>
            <div style="position:relative;display:grid;grid-template-columns:${W1}px ${W2}px;gap:${GAP}px;width:${W1 + GAP + W2}px;height:${H}px">
              <span class="imgbox" style="display:block;height:${H}px">${sole({ kind: "scene", zones: ["herring", "grid", "tri"], cut: true })}<span class="cap">00001-25-0646_1</span></span>
              <span class="imgbox" style="display:block;height:${H}px">${sole({ kind: "shoe", zones: ["herring", "grid", "tri"] })}<span class="cap" style="color:#1f2a3a;text-shadow:none">305659</span></span>
              ${pairSvg()}
            </div>
            <div class="pinbox" style="display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin-top:6px">${pin(5, "better")}
              <span style="color:var(--dim);font-size:11px">두 이미지 함께</span>
              <button class="btn sm">−</button><span class="mono" style="font-size:11.5px">160</span><button class="btn sm">＋</button>
              <button class="btn sm">좌</button><span class="mono" style="font-size:11.5px">0</span><button class="btn sm">우</button>
              <button class="btn sm ghost">처음상태</button><button class="btn sm ghost">평준화</button><button class="btn sm ghost">색상반전</button><button class="btn sm ghost">좌우반전</button><button class="btn sm ghost">밝게</button><button class="btn sm ghost">어둡게</button><button class="btn sm ghost">상하반전</button>
            </div>
          </div>
          <div style="display:grid;gap:6px;align-content:start">
            <span class="crumb" style="padding:3px 6px;border-radius:4px;background:var(--strip)">측면 이미지</span>
            <span class="imgbox" style="display:block;height:104px">${sideShoe()}</span>
            <div class="pinbox">${apin(4, "keep")}
              <table style="width:100%;border-collapse:collapse;font-size:11.5px">
                <thead><tr><th colspan="2" style="${tdL};text-align:center;color:var(--fg2)">사건정보</th><th colspan="2" style="${tdL};text-align:center;color:var(--fg2)">신발정보</th></tr></thead>
                <tbody>${info}</tbody></table>
            </div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">
          <div style="padding:6px 10px;border:1px solid var(--line);border-radius:10px"><div class="crumb" style="text-align:center;margin-bottom:2px">유류 이미지 문양</div>${prow("a")}</div>
          <div style="padding:6px 10px;border:1px solid var(--line);border-radius:10px"><div class="crumb" style="text-align:center;margin-bottom:2px">발견 이미지 문양</div>${prow("b")}</div>
        </div>
      </div>

      <div style="display:grid;gap:9px;align-content:start;padding-left:14px;border-left:1px dashed #1d4a44">
        <div style="display:flex;justify-content:space-between;align-items:center"><span class="ai-mark">● +α 정밀 대조</span><span class="chip" style="height:19px;font-size:10.5px">덧붙임 · 접기 ▴</span></div>
        <div style="padding:7px 9px;border-radius:8px;background:var(--panel2);font-size:11.5px;color:var(--mute);line-height:1.5">1:1 정밀 대조는 처리 구분 <b style="color:var(--fg2)">「대조」</b>(용의자 신발과 비교) 사건의 주 기능입니다. 이 사건은 「현장」이라 <b style="color:var(--fg2)">참고용</b>으로만 보입니다.</div>
        <div class="pinbox">${apin(8, "plus")}
          <span class="seg" style="width:100%"><button aria-pressed="false">대응점</button><button aria-pressed="true">겹쳐 보기</button><button aria-pressed="false">히트맵</button></span>
          <div style="display:grid;grid-template-columns:96px minmax(0,1fr);gap:8px;margin-top:7px;align-items:center">
            <span class="imgbox" style="display:block;height:128px">
              <span style="position:absolute;inset:0">${sole({ kind: "scene", zones: ["herring", "grid", "tri"], heat: true })}</span>
              <span style="position:absolute;inset:0;opacity:.42">${sole({ kind: "shoe", zones: ["herring", "grid", "tri"], bg: "transparent" })}</span></span>
            <div style="display:grid;gap:6px;font-size:11px;color:var(--mute)">
              <span>투명도 <b class="mono" style="color:var(--fg2)">42%</b></span>
              <span style="position:relative;height:4px;border-radius:2px;background:var(--line3)"><span style="position:absolute;left:0;top:0;height:4px;width:42%;border-radius:2px;background:var(--teal)"></span><span style="position:absolute;left:42%;top:-5px;width:13px;height:13px;margin-left:-6px;border-radius:50%;background:var(--fg)"></span></span>
              <span style="line-height:1.4">Homography(각도·크기 맞춤) 정합 뒤 겹침. 붉을수록 일치 근거가 몰린 곳</span>
            </div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:104px minmax(0,1fr);gap:8px;align-items:center;padding-top:6px;border-top:1px solid var(--line2)">
          <div style="position:relative;width:104px;height:59px">${gauge(87)}<b class="mono" style="position:absolute;left:0;right:0;bottom:0;text-align:center;font-size:18px">87%</b></div>
          <div style="display:grid;gap:2px;font-size:11px">${metrics}</div>
        </div>
        <div class="pinbox">${apin(10, "voice")}
          <div class="crumb" style="margin-bottom:2px">근거 — 칸 수 · 도형 개수 · 각도</div>
          ${basis}
        </div>
        <div class="pinbox" style="display:grid;gap:4px;font-size:11px;color:var(--mute)">${pin(11, "better")}
          <span data-role="analyst admin">감정관: 확인대상·그룹등록·감정서 첨부</span>
          <span data-role="verifier">기술책임자: 읽기 전용(결재 참고)</span>
          <span data-role="investigator">수사관: 이 팝업 없음 — 결재완료 감정서로만</span>
        </div>
      </div>
    </div>`;

    return M.shell(
      { active: "사건관리", tabs: ["사건관리", "감정서작성", "족윤적 검증", "결재 대기함"], title: "사건관리", h: 920 },
      `<div style="min-height:790px">
        <div class="page-head"><div><div class="crumb">족윤적 · 사건관리 · 문양검색결과</div><h3>문양검색결과 <span class="mono" style="font-size:14px;color:var(--mute)">00001-25-0646_1 · 검색 572414 · 후보 869</span></h3></div></div>
        <div style="display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:8px">${bg}</div>
      </div>
      ${layer(
        {
          l: 10,
          t: 8,
          w: 1160,
          title: "현장문양검색결과 상세조회",
          head: `<span class="pinbox" style="display:inline-flex;gap:6px;align-items:center;margin-left:10px">${pin(1, "keep")}<span class="chip">처리 구분 현장</span>
            <span style="color:var(--mute);font-size:12px">목적: 「이런 종류의 신발」을 찾아 수사망 좁히기</span>${pin(9, "voice")}</span>`,
        },
        modalBody
      )}`
    );
  }

  function scas() {
    const bgRows = Array.from({ length: 12 }, (_, i) => `<tr><td>${i + 1}</td><td><span class="ph" style="display:block;width:16px;height:20px"></span></td><td>00001-25-06${49 - i}</td><td>SCAS수사부-${871 + i * 37}</td><td>절도</td><td>대구청</td></tr>`).join("");
    const viewer = (x, y, inner, title) => `<div class="oswin" style="left:${x}px;top:${y}px;width:250px;height:400px">
        <div class="tt">🧑 ${title}<span style="margin-left:auto">✕</span></div>
        <div style="padding:5px;display:flex;gap:4px;align-items:center"><span class="sbtn">-</span><span class="sbtn">288</span><span class="sbtn">+</span><span class="sbtn">좌</span><span class="sbtn">0</span><span class="sbtn">우</span><span class="sbtn" style="margin-left:auto">닫기</span></div>
        <div style="height:292px;margin:0 6px;background:#fff;border:1px solid #ccc">${inner}</div>
        <div style="padding:5px;display:flex;flex-wrap:wrap;gap:3px">${["처음상태", "평준화", "색상반전", "좌우반전", "밝게", "어둡게", "상하반전"].map((b) => `<span class="sbtn">${b}</span>`).join("")}</div>
      </div>`;
    const icoRow = (arr) => arr.map((n) => picon(n, "sm")).join(" ");
    return M.scasShell(
      { treeOn: "사건관리", h: 820 },
      `<div class="bar">사건관리 목록</div>
      <div class="box"><table><thead><tr><th>순번</th><th>이미지</th><th>감정번호</th><th>문서번호</th><th>사건명</th><th>의뢰관서</th></tr></thead><tbody>${bgRows}</tbody></table></div>
      <div class="dim"></div>
      <div class="modal" style="left:16px;top:16px;width:880px;height:660px"><div class="bar">문양 상세보기 <span>×</span></div><div class="ph" style="height:620px">S4 문양 상세보기</div></div>
      <div class="modal" style="left:50px;top:40px;width:900px;height:650px"><div class="bar">문양검색결과 <span>×</span></div><div class="ph" style="height:610px">S7b 후보 그리드 1 | 49 · 2 | 32 …</div></div>
      <div class="dim" style="background:rgba(40,44,60,.25)"></div>
      <div class="modal" style="left:90px;top:62px;width:880px;height:666px">
        <div class="bar">현장문양검색결과 상세조회 <span>×</span></div>
        <div style="padding:6px 8px;display:flex;gap:4px;justify-content:flex-end"><span class="sbtn">(이전)</span><span class="sbtn">다음</span><span class="sbtn">그룹등록</span><span class="sbtn">확인대상</span><span class="sbtn" style="opacity:.45">확인대상</span><span class="sbtn">프린트</span><span class="sbtn">닫기</span></div>
        <div style="display:grid;grid-template-columns:230px 200px minmax(0,1fr);gap:6px;padding:0 8px">
          <div class="box"><div class="bar" style="height:22px">유류 이미지</div><div style="height:300px;padding:4px">${sole({ kind: "scene", zones: ["herring", "grid", "tri"], ruler: true, bg: "#2a2d33" })}</div></div>
          <div class="box"><div class="bar" style="height:22px">발견 이미지</div><div style="height:300px;padding:4px">${sole({ kind: "shoe", zones: ["herring", "grid", "tri"] })}</div></div>
          <div class="box"><div class="bar" style="height:22px">측면 이미지</div><div class="ph" style="height:110px;margin:4px">측면 사진</div>
            <table><tbody>
              <tr><th colspan="2">사건정보</th><th colspan="2">신발정보</th></tr>
              ${INFO.map((r) => `<tr><td class="lbl">${r[0]}</td><td>${r[1]}</td><td class="lbl">${r[2]}</td><td>${r[3] === "○○산업" || r[3] === "○○스포츠" || r[3] === "○○스포츠-012" ? "" : r[3]}</td></tr>`).join("")}
            </tbody></table></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:6px 8px">
          <div class="box"><div class="bar" style="height:22px;background:#e9ecf3;color:#555;justify-content:center">유류 이미지 문양</div><div style="padding:6px">상 ${icoRow(["n32_04", "n31_02", "n21_05", "n21_02"])}</div></div>
          <div class="box"><div class="bar" style="height:22px;background:#e9ecf3;color:#555;justify-content:center">발견 이미지 문양</div><div style="padding:6px">상 ${icoRow(["n32_04", "n31_02", "n21_05", "s81b", "n62_02"])}</div></div>
        </div>
      </div>
      ${viewer(700, 120, sole({ kind: "scene", zones: ["herring", "grid", "tri"], ruler: true, bg: "#3a3d42" }), "이미지 뷰어")}
      ${viewer(960, 150, sole({ kind: "shoe", zones: ["herring", "grid", "tri"], bg: "#ffffff" }), "이미지 뷰어")}
      <div class="modal" style="left:300px;top:430px;width:270px">
        <div class="bar">알림 <span>×</span></div>
        <div style="padding:14px;text-align:center">❔ 확인대상에 등록하시겠습니까?<div style="margin-top:10px"><span class="sbtn b">예</span> <span class="sbtn">아니오</span></div></div>
      </div>
      ${M.pain(110, 8, "<b>팝업 4겹</b> — 문양 상세보기 → 문양검색결과 → 상세조회 → 이미지 뷰어가 쌓여 지금 어디인지 헷갈림 (5613 07:37, 18:30)", 300)}
      ${M.pain(860, 580, "<b>뷰어 창 2개를 손으로 나란히</b> — 「두 개 화면을 띄워놓고」 비교. 겹쳐 보기는 없음 (5613 06:02, 18:30)", 300)}
      ${M.pain(320, 560, "<b>등록할 때마다 알림</b> — 「확인대상에 등록하시겠습니까?」 예/아니오 (5613 09:20)")}`
    );
  }

  M.add({
    id: "s06",
    code: "S06",
    group: "문양대조",
    title: "상세 조회·정밀 대조",
    plus: true,
    refs: [
      { t: "SCAS 현장문양검색결과 상세조회", v: "5613 08:52 · 18:22 · 24:07" },
      { t: "SCAS 이미지 뷰어", v: "5613 06:02 · 18:30" },
      { t: "인터뷰", v: "5613 08:52 · 28:45 · 29:26", voice: true },
      { t: "사업계획서", v: "p13 · p36" },
      { t: "발표", v: "s14" },
    ],
    lead: "SCAS 상세조회 레이어 팝업을 같은 자리·같은 배치로 그립니다. 위는 유류 · 발견 · 측면 이미지 3단, 아래는 유류 ↔ 발견 이미지 문양이고, 오른쪽 위 버튼 줄은 「이전 다음 그룹등록 확인대상 프린트 닫기」 순서 그대로입니다. 정밀 대조(지표·겹쳐 보기·히트맵)는 오른쪽에 덧붙였고, 현장 사건에서는 참고용이라고 화면에 적었습니다.",
    fit: {
      area: ["same", "위 유류|발견|측면 3단·아래 문양 2칸 그대로, 정밀 대조는 오른쪽 덧붙임"],
      buttons: ["same", "이전 다음 그룹등록 확인대상 프린트 닫기 순서 그대로, 구분선 뒤 청록 1개만 추가"],
      popup: ["near", "같은 자리 레이어 팝업. 4겹 → 1겹, 이미지 뷰어 창은 팝업 안 확대 줄로"],
      columns: ["same", "사건정보·신발정보 라벨 순서 원문 그대로"],
    },
    scas,
    ours,
    notes: [
      { n: 1, kind: "keep", title: "같은 자리의 레이어 팝업", text: "검색결과 위에 상세조회가 같은 크기로 뜨고 뒤 화면은 어둡게 보입니다. 창은 우리 다크 모달 하나로 통일하고, 문양 상세보기·검색결과를 겹겹이 쌓지 않아 1겹만 남습니다.", src: "5613 07:37 · 08:52" },
      { n: 2, kind: "keep", title: "버튼 줄 순서 그대로", text: "오른쪽 위 「이전 · 다음 · 그룹등록 · 확인대상 · 프린트 · 닫기」를 같은 이름·순서로 둡니다. 새 버튼 「근거 이미지 감정서에 첨부」는 구분선 뒤 줄 끝에 청록으로 붙였습니다.", src: "5613 08:52" },
      { n: 3, kind: "better", title: "알림 창 → 같은 자리 확인 막대", text: "「확인대상에 등록하시겠습니까?」 질문은 남기되, 팝업 위 알림 창 대신 버튼 줄 바로 아래 작은 막대(예 / 아니오)로 묻습니다. 습관은 그대로, 겹침만 없앱니다.", src: "5613 09:20" },
      { n: 4, kind: "keep", title: "사건정보 · 신발정보 · 문양 비교", text: "측면 이미지 아래 표(이미지번호 ~ 채취방법 / 화류번호 ~ 비고)와 아래쪽 「유류 이미지 문양 ↔ 발견 이미지 문양」을 원문 라벨·순서로 둡니다. 상대편에 없는 문양만 파란 테두리로 표시합니다.", src: "5613 08:52 정보표" },
      { n: 5, kind: "better", title: "이미지 뷰어 창 → 팝업 안 확대 줄", text: "SCAS 뷰어 버튼(− 비율 + · 좌 각도 우 · 처음상태 · 평준화 · 색상반전 · 좌우반전 · 밝게 · 어둡게 · 상하반전)을 이미지 바로 아래에 두고, 유류·발견 두 이미지에 함께 적용합니다. 별도 창이 뜨지 않습니다.", src: "5613 06:12–06:44 · 18:30" },
      { n: 6, kind: "voice", title: "두 화면을 나란히 놓고 비교한다", text: "「여기서 더블클릭을 해. 그래서 옆에다가 놓고… 두 개 화면을 띄워놓고」 — 손으로 늘어놓던 뷰어 두 개를 유류 | 발견 자리에 붙여, 같은 배율로 함께 확대·이동합니다.", src: "5613 06:02–06:08" },
      { n: 7, kind: "voice", title: "확대해서 다시 보고 확인대상 등록", text: "「확대해서 다시 한 번 봤어… 보고 나서 얘가 맞다. 그러면 확인대상에 등록을 하는 거예요」 — 확대 줄과 확인 막대를 같은 팝업 안에 두어, 다시 보기 → 등록이 창 이동 없이 이어집니다.", src: "5613 08:52–09:04" },
      { n: 8, kind: "plus", title: "정밀 대조는 오른쪽에 덧붙임", text: "대응점 · 겹쳐 보기(투명도) · 히트맵과 지표 4개(Inlier Ratio·NCC·Wasserstein·Mutual Information), 종합 신뢰도 0–100%를 SCAS 영역 오른쪽 칸에 접어 둘 수 있게 붙였습니다. 기존 3단 배치는 밀리지 않습니다.", src: "BP p13 · p36 · 발표 s14" },
      { n: 9, kind: "voice", title: "현장 검색의 목적 = 수사망 좁히기", text: "「그건 대조에서 일어나는 부분」, 「이런 종류의 신발이다라는 거를 알려주는 거야. 수사망을 좁히기 위해서. 1대1이 아니니까」 — 팝업 머리에 처리 구분과 목적을 적고, 정밀 대조는 「대조」 사건의 주 기능·「현장」에서는 참고용이라고 구분합니다.", src: "5613 29:26–30:07" },
      { n: 10, kind: "voice", title: "칸 수 · 도형 개수로 근거 남기기", text: "「이 개수까지도 정확하게 맞게 그거를 인공지능이 잡아낸다면 좋겠지… 칸 수가 어떤 거는 7개 있고 어떤 거는 6개」 — 근거 항목을 지표보다 앞에, 부위별 칸 수·삼각형/마름모 개수·각도 비교로 적습니다.", src: "5613 28:45–29:19" },
      { n: 11, kind: "better", title: "보는 사람에 따라", text: "감정관·관리자는 그룹등록·확인대상·감정서 첨부 버튼과 확인 막대를 봅니다. 기술책임자는 결재 참고용 읽기 전용, 수사관에게는 이 팝업이 없습니다." },
    ],
  });
})();
