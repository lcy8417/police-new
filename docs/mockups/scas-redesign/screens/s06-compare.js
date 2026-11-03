/* S06 상세 조회·정밀 대조 — SCAS 「현장문양검색결과 상세조회」 레이어 팝업(S8) + 이미지 뷰어 창(S9)
   (IMG_5613 08:52–09:20, 17:22, 18:22–18:30, 24:07–25:15, 28:37–29:22) */
(function () {
  const { pin, apin, sole, picon } = M;

  /* 후보(검색 572414 결과 중 일부). sc = 종합 신뢰도(%) */
  const CANDS = [
    { no: "305659", rank: 1, sc: 87, conf: true, cur: true, z: ["herring", "grid", "blocks"] },
    { no: "275178", rank: 2, sc: 74, z: ["herring", "dots", "blocks"] },
    { no: "301122", rank: 3, sc: 69, conf: true, z: ["wave", "grid", "blocks"] },
    { no: "288410", rank: 4, sc: 61, z: ["herring", "grid", "lines"] },
    { no: "290031", rank: 5, sc: 58, z: ["tri", "grid", "blocks"] },
    { no: "276645", rank: 6, sc: 55, z: ["lines", "grid", "dots"] },
    { no: "299870", rank: 7, sc: 52, z: ["herring", "wave", "blocks"] },
    { no: "281204", rank: 8, sc: 49, z: ["grid", "grid", "blocks"] },
  ];

  /* 대응점(밑창 좌표 0–100 × 0–264). ok=1 일치, 0 불일치 */
  const PTS = [
    [40, 40, 1],
    [62, 80, 1],
    [55, 140, 1],
    [40, 200, 1],
    [58, 236, 0],
  ];
  const BOX_W = 249, GAP = 18, H = 420, S = 1.59, OX = 45; /* 249×420 상자 안 밑창 배율·여백 */

  function pairSvg() {
    const W = BOX_W * 2 + GAP;
    const L = PTS.map(([x, y]) => [OX + S * x, S * y]);
    const R = PTS.map(([x, y], i) => [BOX_W + GAP + OX + S * (x + (i % 2 ? 1.5 : -1)), S * (y + (i % 2 ? -1.2 : 1))]);
    const col = (ok) => (ok ? "var(--teal)" : "var(--red)");
    const lines = PTS.map(
      (p, i) =>
        `<line x1="${L[i][0] + 8}" y1="${L[i][1]}" x2="${R[i][0] - 8}" y2="${R[i][1]}" style="stroke:${col(p[2])};stroke-width:1.3;stroke-dasharray:${p[2] ? "none" : "4 3"};opacity:.85"/>`
    ).join("");
    const box = ([x, y], i) =>
      `<rect x="${x - 8}" y="${y - 8}" width="16" height="16" rx="3" style="fill:rgba(5,8,13,.78);stroke:${col(PTS[i][2])};stroke-width:1.4"/>
       <text x="${x}" y="${y + 3.6}" text-anchor="middle" style="fill:${PTS[i][2] ? "var(--teal)" : "#f87171"};font:700 10px var(--font-mono)">${i + 1}</text>`;
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2" aria-hidden="true">${lines}${L.map(box).join("")}${R.map(box).join("")}</svg>`;
  }

  /* 신발 옆모습(가짜) — 측면 이미지 자리 */
  const sideShoe = () =>
    `<svg viewBox="0 0 200 90" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-label="측면 이미지(가짜 예시)"><rect width="200" height="90" style="fill:var(--panel)"/>
      <path d="M20 62C20 40 40 30 70 28L95 18C110 12 125 22 130 32C150 36 175 44 182 56L182 68L20 70Z" style="fill:var(--panel3);stroke:var(--line3)"/>
      <path d="M18 70L184 70L182 76L22 78Z" style="fill:var(--dim)"/><path d="M98 24L120 40M92 30L114 44" style="stroke:var(--line3);stroke-width:2"/></svg>`;

  const gauge = (v) => {
    const len = 157.08;
    return `<svg viewBox="0 0 120 68" width="150" height="85" aria-label="종합 신뢰도 ${v}%">
      <path d="M10 62A50 50 0 0 1 110 62" style="fill:none;stroke:var(--line3);stroke-width:9;stroke-linecap:round"/>
      <path d="M10 62A50 50 0 0 1 110 62" style="fill:none;stroke:var(--teal);stroke-width:9;stroke-linecap:round;stroke-dasharray:${((len * v) / 100).toFixed(1)} ${len}"/>
    </svg>`;
  };

  const METRICS = [
    { k: "Inlier Ratio", v: "0.72", w: 72, hint: "정합 대응점 30 / 42쌍" },
    { k: "NCC", v: "0.81", w: 81, hint: "밝기 패턴 상관(1에 가까울수록 비슷)" },
    { k: "Wasserstein", v: "0.14", w: 86, hint: "분포 거리(낮을수록 비슷)" },
    { k: "Mutual Information", v: "1.36", w: 68, hint: "공유 정보량(bits)" },
  ];

  const ZONES = [
    { z: "상", ok: true, why: "헤링본 기울기 32° ↔ 31° · 줄 간격 4.1 ↔ 4.0 mm · 방향 같음" },
    { z: "중", ok: true, why: "격자 한 칸 6.2 ↔ 6.0 mm · 배열 각도 0° ↔ 1°" },
    { z: "하", ok: false, why: "블록 모서리 각도 차 9° · 현장 족적 하 부위 일부 소실(대응점 5)" },
  ];

  const PROWS = [
    { z: "상", a: ["n32_04", "n31_02"], b: ["n32_04", "n31_02"], ok: "일치" },
    { z: "중", a: ["n21_05"], b: ["s81b", "n21_05"], ok: "일치" },
    { z: "하", a: ["n52_01"], b: ["n62_02"], ok: "불일치" },
    { z: "윤곽", a: ["s10c"], b: ["s10c"], ok: "일치" },
  ];

  function ours() {
    const strip = CANDS.map(
      (c) => `<div style="display:grid;gap:3px;justify-items:center;padding:5px 6px;border-radius:8px;${c.cur ? "background:var(--blue-bg);box-shadow:inset 0 0 0 1px var(--blue)" : ""}">
        <span class="imgbox" style="display:block;width:44px;height:64px">${sole({ kind: "shoe", zones: c.z })}</span>
        <span class="mono" style="font-size:10.5px;color:${c.cur ? "var(--fg)" : "var(--mute)"}">${c.rank}위 · ${c.sc}%</span>
        ${c.conf ? `<span class="chip amber" style="height:16px;font-size:10px;padding:0 5px">★ 확인대상</span>` : `<span style="height:16px"></span>`}
      </div>`
    ).join("");

    const metricRows = METRICS.map(
      (m) => `<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 8px;align-items:baseline">
        <span style="font-size:12px;color:var(--fg2)">${m.k}</span><b class="mono" style="font-size:13px;color:var(--teal)">${m.v}</b>
        <span style="grid-column:1/-1;display:block;height:4px;border-radius:2px;background:var(--line3)"><span style="display:block;height:4px;width:${m.w}%;border-radius:2px;background:var(--teal)"></span></span>
        <span style="grid-column:1/-1;color:var(--dim);font-size:11px">${m.hint}</span></div>`
    ).join("");

    const zoneRows = ZONES.map(
      (r) => `<div style="display:grid;grid-template-columns:24px minmax(0,1fr);gap:8px;padding:8px 0;border-top:1px solid var(--line2)">
        <b style="font-size:13px;color:var(--fg)">${r.z}</b>
        <div><span class="chip ${r.ok ? "green" : "amber"}" style="height:19px;font-size:10.5px">${r.ok ? "일치" : "불일치"}</span>
          <div style="margin-top:3px;color:var(--mute);font-size:11.5px;line-height:1.45">근거: ${r.why}</div></div></div>`
    ).join("");

    const icons = (arr) => arr.map((n) => picon(n, "sm")).join(" ");
    const prow = PROWS.map(
      (r) => `<tr><td style="color:var(--fg)">${r.z}</td><td>${icons(r.a)}</td><td>${icons(r.b)}</td>
        <td><span class="chip ${r.ok === "일치" ? "green" : "amber"}" style="height:19px;font-size:10.5px">${r.ok}</span></td></tr>`
    ).join("");

    return M.shell(
      { active: "정밀 대조", tabs: ["사건관리", "검색 이력", "정밀 대조", "감정서작성"], title: "정밀 대조", h: 1250 },
      `<div class="page-head">
        <div><div class="crumb">족윤적 · 문양대조 · 정밀 대조</div>
          <h3>상세 조회·정밀 대조 <span class="chip blue mono" style="vertical-align:middle">00001-25-0646_1 ↔ 305659</span></h3>
          <p>현장 족적과 후보 밑창을 나란히·겹쳐 비교하고, AI 지표와 부위별 근거를 함께 봅니다. 팝업을 쌓지 않고 이 한 화면에서 끝납니다.</p></div>
        <div style="display:grid;gap:4px;justify-items:end">
          <div style="display:flex;gap:6px;align-items:center" class="pinbox">${apin(8, "better")}
            <button class="btn" data-role="analyst admin">그룹등록</button>
            <button class="btn warn" aria-pressed="true" data-role="analyst admin">★ 확인대상 등록됨</button>
            <button class="btn ai" data-role="analyst admin">근거 이미지 감정서에 첨부</button>
            <button class="btn" data-role="verifier admin">검증 메모 남기기</button>
            <button class="btn ghost">프린트</button>
          </div>
          <span style="color:var(--mute);font-size:11.5px" data-role="analyst admin">방금 확인대상에 등록함 · <u style="color:var(--fg2)">되돌리기</u> (묻는 창 없음)</span>
        </div>
      </div>

      <div class="panel pinbox" style="margin-bottom:12px">${apin(1, "keep", true)}
        <div class="panel-b" style="display:flex;align-items:center;gap:10px;padding:8px 14px">
          <div style="display:grid;gap:2px;min-width:118px">
            <span class="crumb">유류 이미지</span>
            <span class="inp" style="width:150px"><span class="mono">00001-25-0646_1</span><span class="caret">▾</span></span>
            <span style="color:var(--dim);font-size:11px">검색 572414 · 후보 869건</span>
          </div>
          <button class="btn">‹ 이전</button>
          <div style="display:flex;gap:4px;flex:1;min-width:0;overflow:hidden">${strip}</div>
          <div style="display:grid;gap:4px;justify-items:center"><span class="mono" style="color:var(--fg2);font-size:12px">1 / 869</span><button class="btn pri">다음 ›</button></div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:12px;margin-bottom:12px">
        <div class="panel tc">
          <div class="panel-h pinbox"><span class="lbl">COMPARE</span><span class="t">유류 이미지 ↔ 발견 이미지</span>
            <span class="r">
              <span class="seg">${pin(2, "better")}<button aria-pressed="true">나란히 보기</button><button aria-pressed="false">겹쳐 보기</button><button aria-pressed="false">히트맵</button></span>
              <span class="chip blue"><span class="dot"></span>줌 동기화 · 160%</span>
            </span></div>
          <div class="panel-b" style="display:grid;grid-template-columns:516px minmax(0,1fr);gap:14px">
            <div class="pinbox" style="position:relative;display:grid;grid-template-columns:${BOX_W}px ${BOX_W}px;gap:${GAP}px;width:516px;height:${H}px">${apin(4, "plus", true)}
              <span class="imgbox" style="display:block;height:${H}px">${sole({ kind: "scene", zones: ["herring", "grid", "blocks"], ruler: false, cut: true })}<span class="cap">유류 이미지 · 현장</span></span>
              <span class="imgbox" style="display:block;height:${H}px">${sole({ kind: "shoe", zones: ["herring", "grid", "tri"] })}<span class="cap" style="color:#1f2a3a;text-shadow:none">발견 이미지 · 305659</span></span>
              ${pairSvg()}
            </div>
            <div style="display:grid;gap:10px;align-content:start">
              <div class="pinbox">${apin(3, "plus")}
                <div class="crumb" style="margin-bottom:5px">겹쳐 보기 + 히트맵 미리보기</div>
                <span class="imgbox" style="display:block;height:236px">
                  <span style="position:absolute;inset:0">${sole({ kind: "scene", zones: ["herring", "grid", "blocks"], heat: true })}</span>
                  <span style="position:absolute;inset:0;opacity:.42">${sole({ kind: "shoe", zones: ["herring", "grid", "tri"], bg: "transparent" })}</span>
                  <span class="cap">Homography 정합 후</span>
                </span>
                <div style="display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:8px;align-items:center;margin-top:8px;font-size:11.5px;color:var(--mute)">
                  <span>투명도</span>
                  <span style="position:relative;height:4px;border-radius:2px;background:var(--line3)"><span style="position:absolute;left:0;top:0;height:4px;width:42%;border-radius:2px;background:var(--teal)"></span><span style="position:absolute;left:42%;top:-5px;width:14px;height:14px;margin-left:-7px;border-radius:50%;background:var(--fg);box-shadow:0 0 0 3px var(--teal-bg)"></span></span>
                  <span class="mono">42%</span>
                </div>
                <div style="margin-top:6px;color:var(--dim);font-size:11px;line-height:1.45">붉을수록 일치 근거(특징점)가 몰린 곳 · 초록은 문양 방향이 같은 곳</div>
              </div>
              <div>
                <div class="crumb" style="margin-bottom:5px">측면 이미지</div>
                <span class="imgbox" style="display:block;height:96px">${sideShoe()}</span>
              </div>
            </div>
            <div style="grid-column:1/-1;display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding-top:10px;border-top:1px solid var(--line2)">
              <span style="color:var(--dim);font-size:11.5px;margin-right:4px">두 이미지에 함께 적용</span>
              <button class="btn sm">−</button><span class="mono" style="font-size:12px">160%</span><button class="btn sm">＋</button>
              <button class="btn sm">좌</button><span class="mono" style="font-size:12px">0°</span><button class="btn sm">우</button>
              <span style="width:1px;height:18px;background:var(--line)"></span>
              <button class="btn sm ghost">처음상태</button><button class="btn sm ghost">평준화</button><button class="btn sm ghost">색상반전</button><button class="btn sm ghost">좌우반전</button><button class="btn sm ghost">밝게</button><button class="btn sm ghost">어둡게</button><button class="btn sm ghost">상하반전</button>
              <span style="margin-left:auto;display:flex;gap:10px;font-size:11.5px;color:var(--mute)"><span><b style="color:var(--teal)">━</b> 대응점 일치 4</span><span><b style="color:#f87171">┅</b> 불일치 1</span></span>
            </div>
          </div>
        </div>

        <div class="panel" style="display:grid;align-content:start">
          <div class="panel-h"><span class="lbl">AI METRICS</span><span class="t">1:1 정밀 대조 지표</span><span class="r"><span class="ai-mark">● AI</span></span></div>
          <div class="panel-b pinbox" style="display:grid;justify-items:center;gap:2px;border-bottom:1px solid var(--line2)">${apin(5, "plus")}
            <div style="position:relative;width:150px;height:85px">${gauge(87)}
              <b class="mono" style="position:absolute;left:0;right:0;bottom:2px;text-align:center;font-size:26px;color:var(--fg)">87<span style="font-size:14px;color:var(--mute)">%</span></b></div>
            <span style="font-size:12px;color:var(--fg2)">종합 신뢰도 <span class="chip teal" style="height:19px;font-size:10.5px;margin-left:4px">높음 · 80% 이상</span></span>
            <span style="font-size:11px;color:var(--dim)">0–100% · 아래 4개 지표를 합친 값</span>
          </div>
          <div class="panel-b" style="display:grid;gap:10px;border-bottom:1px solid var(--line2)">${metricRows}</div>
          <div class="panel-b pinbox">${apin(6, "plus")}
            <div class="crumb" style="margin-bottom:2px">일치 · 불일치 부위</div>
            ${zoneRows}
            <div style="margin-top:6px;color:var(--dim);font-size:11px">근거는 각도·길이·문양 방향성으로 적습니다. 감정서 판독소견 초안에 그대로 들어갑니다.</div>
          </div>
        </div>
      </div>

      <div class="pinbox" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px">${apin(7, "keep", true)}
        <div class="panel"><div class="panel-h"><span class="lbl">CASE</span><span class="t">사건정보</span></div>
          <div class="form" style="grid-template-columns:84px minmax(0,1fr);border-top:0">
            <div class="l">이미지번호</div><div class="v mono">00001-25-0646_1</div>
            <div class="l">SCAS번호</div><div class="v mono">2025-11710</div>
            <div class="l">문서번호</div><div class="v mono">SCAS수사부-2944</div>
            <div class="l">의뢰관서</div><div class="v">대구청 2025-03321</div>
            <div class="l">사건명</div><div class="v">주거침입</div>
            <div class="l">채취일시</div><div class="v num">2025-07-19 06:00</div>
            <div class="l">채취장소</div><div class="v">주방 바닥</div>
            <div class="l">채취방법</div><div class="v">전사판채취법</div>
          </div></div>
        <div class="panel"><div class="panel-h"><span class="lbl">SHOE</span><span class="t">신발정보</span><span class="r"><span class="chip red" style="height:19px;font-size:10.5px">용의자신발</span></span></div>
          <div class="form" style="grid-template-columns:84px minmax(0,1fr);border-top:0">
            <div class="l">화류번호</div><div class="v mono">305659</div>
            <div class="l">제조사</div><div class="v">○○산업</div>
            <div class="l">상표명</div><div class="v">○○스포츠</div>
            <div class="l">모델번호</div><div class="v" style="color:var(--faint)">—</div>
            <div class="l">화종</div><div class="v">운동화</div>
            <div class="l">수집년도</div><div class="v num">2025</div>
            <div class="l">그룹명</div><div class="v">○○스포츠-012</div>
            <div class="l">비고</div><div class="v">용의자신발</div>
          </div></div>
        <div class="panel"><div class="panel-h"><span class="lbl">PATTERN</span><span class="t">유류 이미지 문양 ↔ 발견 이미지 문양</span></div>
          <table class="grid"><thead><tr><th>부위</th><th>유류</th><th>발견</th><th></th></tr></thead><tbody>${prow}</tbody></table>
          <div style="padding:10px 14px;color:var(--dim);font-size:11.5px;line-height:1.5">SCAS처럼 문양 코드를 부위별로 나란히 둡니다. 다른 칸은 주황 표시로 바로 보입니다.</div>
        </div>
      </div>
      <div class="pinbox" style="margin-top:12px;display:flex;gap:8px;align-items:center;color:var(--mute);font-size:12px">${pin(9, "better")}
        <span data-role="analyst admin">감정관: 확인대상·그룹등록·감정서 첨부를 바로 할 수 있습니다.</span>
        <span data-role="verifier">검증자: 같은 화면을 읽기 전용으로 보고 「검증 메모」만 남깁니다.</span>
        <span data-role="investigator">수사관: 이 화면 메뉴가 없습니다. 결재완료 뒤 감정서의 근거 이미지로만 봅니다.</span>
      </div>`
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
      `<div style="min-height:740px"><div class="bar">사건관리 목록</div>
      <div class="box"><table><thead><tr><th>순번</th><th>이미지</th><th>감정번호</th><th>문서번호</th><th>사건명</th><th>의뢰관서</th></tr></thead><tbody>${bgRows}</tbody></table></div></div>
      <div class="dim"></div>
      <div class="modal" style="left:16px;top:16px;width:880px;height:660px"><div class="bar">문양 상세보기 <span>×</span></div><div class="ph" style="height:620px">S4 문양 상세보기</div></div>
      <div class="modal" style="left:50px;top:40px;width:900px;height:650px"><div class="bar">문양검색결과 <span>×</span></div><div class="ph" style="height:610px">S7b 후보 그리드 1 | 49 · 2 | 32 …</div></div>
      <div class="dim" style="background:rgba(40,44,60,.25)"></div>
      <div class="modal" style="left:90px;top:62px;width:880px;height:666px">
        <div class="bar">현장문양검색결과 상세조회 <span>×</span></div>
        <div style="padding:6px 8px;display:flex;gap:4px;justify-content:flex-end"><span class="sbtn">(이전)</span><span class="sbtn">다음</span><span class="sbtn">그룹등록</span><span class="sbtn">확인대상</span><span class="sbtn" style="opacity:.45">확인대상</span><span class="sbtn">프린트</span><span class="sbtn">닫기</span></div>
        <div style="display:grid;grid-template-columns:230px 200px minmax(0,1fr);gap:6px;padding:0 8px">
          <div class="box"><div class="bar" style="height:22px">유류 이미지</div><div style="height:300px;padding:4px">${sole({ kind: "scene", zones: ["herring", "grid", "blocks"], ruler: true, bg: "#2a2d33" })}</div></div>
          <div class="box"><div class="bar" style="height:22px">발견 이미지</div><div style="height:300px;padding:4px">${sole({ kind: "shoe", zones: ["herring", "grid", "tri"] })}</div></div>
          <div class="box"><div class="bar" style="height:22px">측면 이미지</div><div class="ph" style="height:110px;margin:4px">측면 사진</div>
            <table><tbody>
              <tr><th colspan="2">사건정보</th><th colspan="2">신발정보</th></tr>
              <tr><td class="lbl">이미지번호</td><td>00001-25-0646_1</td><td class="lbl">화류번호</td><td>305659</td></tr>
              <tr><td class="lbl">SCAS번호</td><td>2025-11710</td><td class="lbl">제조사</td><td></td></tr>
              <tr><td class="lbl">문서번호</td><td>SCAS수사부-2944</td><td class="lbl">상표명</td><td></td></tr>
              <tr><td class="lbl">의뢰관서</td><td>대구청</td><td class="lbl">모델번호</td><td></td></tr>
              <tr><td class="lbl">사건명</td><td>주거침입</td><td class="lbl">화종</td><td>운동화</td></tr>
              <tr><td class="lbl">채취일시</td><td>2025-07-19</td><td class="lbl">수집년도</td><td>2025</td></tr>
              <tr><td class="lbl">채취장소</td><td>주방 바닥</td><td class="lbl">그룹명</td><td></td></tr>
              <tr><td class="lbl">채취방법</td><td>전사판채취법</td><td class="lbl">비고</td><td>용의자신발</td></tr>
            </tbody></table></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:6px 8px">
          <div class="box"><div class="bar" style="height:22px;background:#e9ecf3;color:#555;justify-content:center">유류 이미지 문양</div><div style="padding:6px">상 ${icoRow(["n32_04", "n31_02", "n51_01", "n52_01"])}</div></div>
          <div class="box"><div class="bar" style="height:22px;background:#e9ecf3;color:#555;justify-content:center">발견 이미지 문양</div><div style="padding:6px">상 ${icoRow(["n32_04", "n31_02", "n51_01", "n21_05", "n62_02"])}</div></div>
        </div>
      </div>
      ${viewer(700, 120, sole({ kind: "scene", zones: ["herring", "grid", "blocks"], ruler: true, bg: "#3a3d42" }), "이미지 뷰어")}
      ${viewer(960, 150, sole({ kind: "shoe", zones: ["herring", "grid", "tri"], bg: "#ffffff" }), "이미지 뷰어")}
      <div class="modal" style="left:300px;top:430px;width:270px">
        <div class="bar">알림 <span>×</span></div>
        <div style="padding:14px;text-align:center">❔ 확인대상에 등록하시겠습니까?<div style="margin-top:10px"><span class="sbtn b">예</span> <span class="sbtn">아니오</span></div></div>
      </div>
      ${M.pain(110, 8, "<b>팝업 4겹</b> — 문양 상세보기 → 문양검색결과 → 상세조회 → 이미지 뷰어가 쌓여 지금 어디인지 헷갈림 (5613 07:37, 18:30)", 300)}
      ${M.pain(860, 580, "<b>겹쳐 보기 없음</b> — 이미지 뷰어 2개를 손으로 나란히 놓고 눈으로 비교. 근거는 말·연필로만 설명 (5613 18:30, 29:07)", 300)}
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
      { t: "SCAS 이미지 뷰어", v: "5613 18:30" },
      { t: "사업계획서", v: "p13 · p36" },
      { t: "발표", v: "s14" },
    ],
    lead: "SCAS 상세조회의 3단 구성(유류·발견·측면 이미지), 사건정보·신발정보 표, 문양 나란히 보기, 이전/다음·그룹등록·확인대상 버튼은 그대로 둡니다. 여기에 겹쳐 보기·대응점·AI 지표·부위별 근거를 얹어, 뷰어 두 개를 손으로 늘어놓던 비교를 한 화면으로 바꿉니다.",
    scas,
    ours,
    notes: [
      { n: 1, kind: "keep", title: "이전 / 다음으로 후보 넘기기", text: "SCAS의 「(이전)」「다음」을 그대로 두고, 위쪽 줄에 후보 썸네일과 순위·신뢰도·확인대상 표시를 함께 보여 줍니다. 유류 이미지(_1, _2 …)도 여기서 바꿉니다.", src: "5613 08:52–09:20" },
      { n: 2, kind: "better", title: "팝업 4겹 → 한 작업 화면, 줌 동기화", text: "문양 상세보기·검색결과·상세조회·이미지 뷰어가 겹치지 않고 한 탭에 들어옵니다. 확대·회전과 이미지 뷰어 버튼(처음상태·평준화·색상반전·좌우반전·밝게·어둡게·상하반전)은 두 이미지에 동시에 걸립니다.", src: "5613 07:37 · 18:30" },
      { n: 3, kind: "plus", title: "겹쳐 보기 + 투명도 + 히트맵", text: "Homography(두 이미지의 각도·크기를 맞추는 정합)로 현장 족적 위에 후보 밑창을 겹치고, 투명도 막대로 비율을 조절합니다. 히트맵은 일치 근거가 몰린 곳을 색으로 보여 줍니다.", src: "BP p13 · p36 · 발표 s14" },
      { n: 4, kind: "plus", title: "대응점 선과 번호 상자", text: "두 이미지에서 같은 특징점끼리 선으로 잇고 같은 번호를 붙입니다. 청록 실선 = 일치, 빨강 점선 = 불일치. 인터뷰 때 연필로 가리키던 설명이 화면에 남습니다.", src: "5613 29:07 · BP p36" },
      { n: 5, kind: "plus", title: "지표 4개 + 종합 신뢰도 0–100%", text: "Inlier Ratio(정합된 대응점 비율), NCC(밝기 패턴 상관), Wasserstein(분포 거리, 낮을수록 비슷), Mutual Information(공유 정보량)을 막대로 보여 주고, 합친 값을 0–100% 계기판으로 표시합니다.", src: "BP p13 · p36" },
      { n: 6, kind: "plus", title: "일치·불일치 부위와 근거", text: "상·중·하 부위마다 일치/불일치와 근거(각도·길이·문양 방향성)를 숫자로 적습니다. 실무자 설문의 「유사점 설명·객관성」 요구에 맞추고, 감정서 판독소견 초안(S09)으로 넘어갑니다.", src: "설문 문항 7–21 · BP p36" },
      { n: 7, kind: "keep", title: "사건정보·신발정보·문양 비교 그대로", text: "SCAS 라벨(이미지번호·SCAS번호·문서번호·의뢰관서·사건명·채취일시·채취장소·채취방법 / 화류번호·제조사·상표명·모델번호·화종·수집년도·그룹명·비고)과 「유류 이미지 문양 ↔ 발견 이미지 문양」 나란히 보기를 유지하고, 다른 부위만 주황으로 표시합니다.", src: "5613 08:52 정보표" },
      { n: 8, kind: "better", title: "확인대상은 한 번 클릭, 프린트는 감정서 첨부로", text: "「확인대상에 등록하시겠습니까?」 알림 없이 버튼 하나로 등록·해제하고 「되돌리기」를 둡니다. 그룹등록은 그대로이고, 프린트 대신 대응점·히트맵 그림을 감정서 이미지 페이지(S09)에 바로 첨부합니다. SCAS의 「닫기」는 탭 ✕입니다.", src: "5613 09:20" },
      { n: 9, kind: "better", title: "보는 사람에 따라", text: "감정관·관리자는 확인대상·그룹등록·첨부 버튼을, 검증자는 읽기 전용 화면과 「검증 메모 남기기」만 봅니다. 수사관에게는 정밀 대조 메뉴가 없습니다." },
    ],
  });
})();
