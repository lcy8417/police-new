/* S10 신발문양 관리 (r2) — SCAS 「족윤적 > 문양관리 > 신발문양 관리」 목록 + 신발정보관리 레이어 모달(문양정보 탭)
   근거: inventory_5614_5616 S5·S1·S3·P1·P2·P3 (IMG_5614 0:00–2:30, IMG_5616 0:00–6:00), 녹취 5616 00:01–06:12, 12:00–12:26
   r2: 배치를 SCAS로 되돌림(검색폼 3열×4행 → 목록 헤더+툴바 → 카드 9열 → 페이지, 카드 클릭 = 같은 자리 레이어 모달). */
(function () {
  const { pin, apin, sole, picon } = M;

  const Z = [
    ["herring", "herring", "herring"], ["grid", "dots", "grid"], ["wave", "blocks", "lines"], ["tri", "grid", "dots"],
    ["dots", "dots", "blocks"], ["lines", "herring", "wave"], ["blocks", "grid", "blocks"], ["herring", "wave", "herring"],
  ];
  /* 2025-03 등록분 536건(전부 미승인, 5616 05:09) 중 1쪽 — st: 문양 대기 / 승인 대기 / 측면 없음 / AI 확인 필요 */
  const CARDS = [
    ["303352", "승인 대기"], ["303351", "승인 대기"], ["303349", "AI 확인 필요"], ["303348", "문양 대기"], ["303347", "승인 대기"], ["303346", "측면 없음"],
    ["303344", "문양 대기"], ["303342", "승인 대기"], ["303341", "승인 대기"], ["303340", "문양 대기"], ["303339", "AI 확인 필요"], ["303338", "승인 대기"],
    ["303337", "문양 대기"], ["303336", "승인 대기"], ["303335", "문양 대기"], ["303334", "승인 대기"],
  ];
  const ST = { "승인 대기": "blue", "문양 대기": "", "측면 없음": "red", "AI 확인 필요": "amber" };
  /* r3: 카드 위 AI 표시(시안 예시) — 숫자 = 문양 제안 확신도, scan = 지금 AI가 읽는 중, dup = 중복 의심 */
  const CAI = {
    "303352": "0.95", "303351": "0.93", "303349": "dup", "303348": "0.88", "303347": "0.91", "303344": "scan", "303342": "0.96", "303341": "0.94",
    "303340": "0.82", "303339": "0.61", "303338": "0.92", "303337": "0.90", "303336": "0.89", "303335": "0.86", "303334": "0.97",
  };
  const cardTag = (no) => {
    const a = CAI[no];
    if (!a) return "";
    const pos = "position:absolute;right:4px;top:4px;height:15px;padding:0 5px;font-size:9px;box-shadow:0 2px 6px rgba(0,0,0,.5)";
    if (a === "scan") return `<span class="fx-scan"></span><span class="ai-tag" style="${pos};background:#0b2a26"><span class="fx-live" style="width:5px;height:5px"></span>AI 읽는 중</span>`;
    if (a === "dup") return `<span class="ai-tag" style="${pos};background:#2a1f08;color:var(--amber);border-color:#4d3a12">중복 의심</span>`;
    const low = parseFloat(a) < 0.7;
    return `<span class="ai-tag" style="${pos};background:${low ? "#2a1f08" : "#0b2a26"};${low ? "color:var(--amber);border-color:#4d3a12" : ""}">AI ${a}</span>`;
  };
  /* 확신도 막대(모달 문양 행) */
  const confBar = (v, warn) => `<span style="display:inline-flex;align-items:center;gap:6px;font-size:11px;color:${warn ? "var(--amber)" : "var(--teal)"}"><span style="color:var(--dim);font-size:10.5px">AI 확신도</span>
      <span class="fx-bar" style="width:64px">${warn ? `<i style="width:${v * 100}%;background:var(--amber)"></i>` : `<i style="width:${v * 100}%"></i>`}</span><b class="num">${v.toFixed(2)}</b></span>`;

  function ours() {
    const sb = (t, cls = "") => `<button class="btn sm ${cls}">${t}</button>`;
    const cards = CARDS.map(
      ([no, st], i) => `<div style="display:grid;gap:4px;padding:4px;border:1px solid ${no === "303349" ? "var(--blue)" : "var(--line)"};border-radius:8px;background:${no === "303349" ? "var(--blue-bg)" : "var(--panel2)"}">
        <span class="imgbox" style="height:92px;border-radius:6px">${sole({ kind: "shoe", zones: Z[i % Z.length] })}${cardTag(no)}</span>
        <span style="display:flex;align-items:center;gap:4px"><span style="width:11px;height:11px;border-radius:3px;border:1px solid var(--line3)"></span><span class="mono" style="color:var(--fg);font-size:11.5px">${no}</span></span>
        <span class="chip ${ST[st]}" style="height:18px;padding:0 6px;font-size:10px;justify-self:start">${st}</span>
      </div>`
    ).join("");

    const stage = (n, t, c, on, extra = "", ai = "") => `<span style="display:flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid ${on ? "var(--blue)" : "var(--line2)"};border-radius:8px;background:${on ? "var(--blue-bg)" : "var(--bg2)"}">
        <span style="display:grid;place-items:center;width:18px;height:18px;border-radius:50%;background:var(--panel3);color:var(--fg2);font:700 10px var(--font-mono)">${n}</span>
        <span style="display:grid;line-height:1.25"><span style="color:${on ? "var(--fg)" : "var(--fg2)"};font-size:12px">${t}</span><span style="color:var(--dim);font-size:10.5px">${extra}</span>${ai}</span>
        <b class="num" style="color:${on ? "var(--blue)" : "var(--fg)"};font-size:14px">${c}</b></span>`;
    const arrow = `<span style="color:var(--faint)">→</span>`;

    /* 모달 안: 신발 문양 행 */
    const zrow = (lbl, icons, right, on) => `<div style="display:grid;grid-template-columns:46px minmax(0,1fr) auto;gap:8px;align-items:center;min-height:42px;padding:4px 8px;border:1px solid ${on ? "var(--blue)" : "var(--line2)"};border-radius:7px;background:${on ? "var(--blue-bg)" : "var(--bg2)"}">
        <span style="color:${on ? "var(--fg)" : "var(--mute)"};font-size:12.5px;font-weight:600">${lbl}</span>
        <span style="display:flex;flex-wrap:wrap;gap:5px;align-items:center">${icons}</span><span style="display:flex;gap:6px;align-items:center">${right}</span></div>`;
    const palette = M.P["내부선"].map((n) => picon(n, "sm" + (n === "n32_04" ? " sel" : ""), n)).join("");

    const modal = `<div style="position:absolute;inset:0;z-index:5;background:rgba(3,6,12,.55)"></div>
      <div class="panel pinbox" style="position:absolute;z-index:6;left:150px;top:500px;width:880px;background:var(--panel);box-shadow:0 30px 80px rgba(0,0,0,.6);border-color:var(--line3)">
        ${apin(6, "better", true)}
        <div class="panel-h"><span class="t">신발정보관리</span><span class="mono" style="color:var(--blue)">303349</span><span class="chip amber">AI 확인 필요</span>
          <span class="r"><span style="color:var(--dim);font-size:11px">뒤 목록은 그대로 깔려 있음 · Esc 닫기</span><span style="color:var(--mute)">✕</span></span></div>
        <div class="pinbox" style="display:flex;align-items:center;gap:6px;padding:8px 14px;border-bottom:1px solid var(--line2)">
          <span class="seg"><button aria-pressed="false">기본정보</button><button aria-pressed="true">문양정보</button></span>
          <span style="margin-left:auto;display:flex;gap:5px;align-items:center">
            ${pin(7, "plus")}<button class="btn sm ai" data-role="analyst admin">인공지능문양관리</button>${sb("이전")}${sb("다음")}
            <button class="btn sm ok" data-lock="admin" title="신발 승인 권한(SHOE_APPROVE)이 있는 승인 담당만">승인</button>${sb("그룹등록")}${sb("닫기")}
          </span>
        </div>
        <div style="padding:4px 14px;color:var(--dim);font-size:11px;border-bottom:1px solid var(--line2)">기본정보 탭: NEW등록 · 이전 다음 그룹등록 인공지능그룹등록 프린트 수정 삭제 닫기 — 버튼·19칸(화류번호 … 등록일자) 모두 SCAS 순서 그대로</div>
        <div style="display:grid;grid-template-columns:250px minmax(0,1fr);gap:14px;padding:12px 14px">
          <div style="display:grid;gap:8px;align-content:start">
            <span class="crumb">바닥 이미지</span>
            <span class="imgbox pinbox" style="height:270px">${sole({ kind: "shoe", zones: ["herring", "grid", "herring"] })}
              <span style="position:absolute;left:0;right:0;top:36%;border-top:1px dashed var(--teal);opacity:.8"></span>
              <span style="position:absolute;left:0;right:0;top:66%;border-top:1px dashed var(--teal);opacity:.8"></span>
              ${[["상", "6%", "0.94"], ["중", "40%", "0.58"], ["하", "70%", "0.94"]].map(([z, t, v]) => `<span class="ai-tag" style="position:absolute;left:6px;top:${t};height:15px;padding:0 5px;font-size:9px;background:#0b2a26;${v === "0.58" ? "color:var(--amber);border-color:#4d3a12;background:#2a1f08" : ""}">${z} ${v}</span>`).join("")}
              <span style="position:absolute;left:41%;top:39%;width:78px;height:44px;border:1.5px dashed var(--amber);border-radius:4px"></span>
              <span style="position:absolute;left:41%;top:calc(39% - 14px);color:var(--amber);font:600 9.5px var(--font-mono);text-shadow:0 1px 2px #000">가림 18%</span>
              <span class="fx-scan"></span>
              <span style="position:absolute;left:44%;top:43%;width:62px;height:30px;border-radius:4px;background:var(--amber);opacity:.85;display:grid;place-items:center;color:var(--bg);font:700 10px var(--font-ui);transform:rotate(-8deg)">가격표</span>${apin(8, "voice")}</span>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;text-align:center;font-size:10.5px;color:var(--dim)">
              <span><span class="imgbox" style="display:grid;place-items:center;height:38px;color:var(--green);font-size:11px;background:var(--panel2)">측면 ✓</span></span>
              <span><span class="imgbox" style="display:grid;place-items:center;height:38px;color:var(--faint);font-size:11px;background:var(--panel2)">전/후면 ＋</span></span>
              <span><span class="imgbox" style="display:grid;place-items:center;height:38px;color:var(--faint);font-size:11px;background:var(--panel2)">로고 ＋</span></span>
            </div>
            <div style="padding:8px 10px;border:1px solid var(--line2);border-radius:8px;background:var(--strip);font-size:11.5px;line-height:1.5;color:var(--fg2)">
              <span class="crumb" style="display:block;margin-bottom:3px">코드 설명</span>${picon("n32_04", "sm")} <b class="mono" style="color:var(--blue)">n32_04</b> ${M.PDESC.n32_04}</div>
          </div>
          <div style="display:grid;gap:6px;align-content:start">
            <span class="crumb">신발 문양</span>
            <div class="pinbox" style="display:flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid #1d4a44;border-radius:7px;background:var(--teal-bg);font-size:11.5px">
              ${pin(12, "plus")}<span class="ai-tag"><span class="fx-live" style="width:5px;height:5px"></span>AI 1차 입력</span>
              <span style="color:var(--fg2)">상·하가 같은 헤링본(<span class="mono">n32_04</span>)이라 <b style="color:var(--fg)">한 번에</b> 채움 · 행 3번 → 1번</span>
              <span style="margin-left:auto;color:var(--dim);font-size:11px">확정은 문양 입력 담당</span></div>
            ${zrow("상", picon("n32_04", "sm ai"), confBar(0.94))}
            ${zrow("중", picon("n21_05", "sm ai") + picon("s81b", "sm ai", "마크"), `${confBar(0.58, true)}<span class="chip amber" style="height:20px;font-size:10.5px">확인 필요 · 가격표가 가림</span>`)}
            ${zrow("하", picon("n32_04", "sm ai"), confBar(0.94), true)}
            ${zrow("윤곽", picon("s10c", "sm sel"), `<span style="color:var(--dim);font-size:11px">AI 미지원 · 사람이 입력</span>`)}
            ${zrow("문자열", `<span style="color:var(--faint);font-size:11.5px">—</span>`, `<button class="btn sm pri">저장</button>`)}
            <div class="pinbox" style="display:flex;align-items:center;gap:8px;padding:5px 8px;border:1px dashed var(--line3);border-radius:7px">
              ${apin(9, "better")}${picon("n32_04", "sm sel")}<span style="color:var(--fg2);font-size:12px">고른 문양을</span><button class="btn sm" data-role="analyst admin">상·중·하 모두에 넣기</button>
            </div>
            <div style="display:flex;gap:4px;flex-wrap:wrap">${M.PCATS.map((c) => `<span class="chip ${c === "내부선" ? "blue" : ""}" style="height:20px;font-size:11px">${c}</span>`).join("")}
              <span class="inp" style="flex:1;min-width:150px;height:22px;color:var(--dim);font-size:11.5px">⌕ 문양 이름·설명 검색</span></div>
            <div style="display:flex;flex-wrap:wrap;gap:4px">${palette}</div>
            <div style="display:flex;gap:4px"><span class="chip blue" style="height:20px;font-size:11px">단선</span><span class="chip" style="height:20px;font-size:11px">다선1</span><span class="chip" style="height:20px;font-size:11px">다선2</span></div>
            <div class="pinbox" style="display:grid;grid-template-columns:44px 44px minmax(0,1fr) auto;gap:10px;align-items:center;margin-top:2px;padding:8px 10px;border:1px solid color-mix(in srgb,var(--amber) 35%,var(--panel));border-radius:8px;background:var(--amber-bg)">
              ${apin(13, "plus")}
              <span style="display:grid;gap:2px;text-align:center;font-size:9.5px;color:var(--dim)"><span class="imgbox" style="height:58px;border-radius:5px;background:#e9ecf0">${sole({ kind: "shoe", zones: ["herring", "grid", "herring"] })}</span><span class="mono">303349</span></span>
              <span style="display:grid;gap:2px;text-align:center;font-size:9.5px;color:var(--dim)"><span class="imgbox" style="height:58px;border-radius:5px;background:#e9ecf0">${sole({ kind: "shoe", zones: ["herring", "grid", "herring"] })}</span><span class="mono">298114</span></span>
              <span style="display:grid;gap:2px;font-size:11.5px;line-height:1.45">
                <span><span class="ai-tag" style="background:#2a1f08;color:var(--amber);border-color:#4d3a12">AI 중복 의심</span> <b style="color:var(--fg)">이미 등록된 <span class="mono">298114</span>와 바닥이 거의 같음</b></span>
                <span style="color:var(--fg2)">바닥 유사도 <b class="num" style="color:var(--amber)">0.96</b> · 같은 상표 · 2023-11 등록(예시)</span>
                <span style="color:var(--dim)">같은 신발이면 등록 취소, 연도만 바뀐 재출시면 같은 그룹으로 연결</span></span>
              <span style="display:grid;gap:4px"><button class="btn sm">나란히 보기</button><button class="btn sm" data-role="analyst admin">그룹으로 연결</button></span>
            </div>
          </div>
        </div>
        <div class="pinbox" style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:9px 14px;border-top:1px solid var(--line2);background:var(--strip);border-radius:0 0 14px 14px;font-size:11.5px">
          ${apin(10, "better", true)}
          <span style="color:var(--mute)">진행</span><span class="chip">등록 · 서○○ 03-14</span>${arrow}<span class="chip">문양 입력 · 박○○ 07-24</span>${arrow}<span class="chip blue">승인 대기</span>
          <span style="margin-left:auto;color:var(--mute)">승인 조건</span><span style="color:var(--green)">측면 ✓</span><span style="color:var(--green)">바닥 ✓</span><span style="color:var(--green)">상·중·하 ✓</span><span style="color:var(--amber)">AI 확인 필요 2건 ✗ (가림 1 · 중복 의심 1)</span>
        </div>
      </div>`;

    return M.shell(
      { active: "신발문양 관리", tabs: ["사건관리", "신발문양 관리"], title: "신발문양 관리", h: 1340 },
      `<div class="page-head">
        <div><div class="crumb">족윤적 · 문양관리 · 신발문양 관리</div><h3>신발문양 관리</h3><p>SCAS와 같은 순서: 위 검색 → 가운데 카드 목록 → 카드를 누르면 같은 자리에 신발정보관리 창.</p></div>
      </div>

      <div class="panel pinbox" style="margin-bottom:10px">
        ${apin(1, "keep", true)}
        <div class="form" style="grid-template-columns:96px minmax(0,1fr) 84px minmax(0,1fr) 84px minmax(0,1fr)">
          <div class="l">화류번호</div><div class="v"><span class="inp w100 mono" style="color:var(--dim)">(신발 번호)</span></div>
          <div class="l">제조사</div><div class="v"><span class="inp w100">전체<span class="caret">⌕ 조회</span></span></div>
          <div class="l">성별</div><div class="v"><span class="radio"><span class="on">전체</span><span>남</span><span>여</span><span>혼용</span></span></div>
          <div class="l">등록일자</div><div class="v"><span class="inp w100 mono" style="font-size:12px">2025-03-01 ~ 2025-03-31<span class="caret">월 ▾</span></span></div>
          <div class="l">상표</div><div class="v"><span class="inp w100">전체<span class="caret">⌕ 조회</span></span></div>
          <div class="l">승인</div><div class="v"><span class="radio"><span>전체</span><span>승인</span><span class="on">미승인</span></span></div>
          <div class="l">등록관서</div><div class="v"><span class="inp w100">전체<span class="caret">▾</span></span></div>
          <div class="l">그룹명</div><div class="v"><span class="inp w100">전체<span class="caret">⌕ 조회</span></span></div>
          <div class="l pinbox" style="color:var(--teal)">문양 입력 ${pin(2, "better")}</div><div class="v"><span class="radio"><span>전체</span><span>입력</span><span class="on">미입력</span></span></div>
          <div class="l">화종</div><div class="v"><span class="inp w100" style="color:var(--dim)">—</span></div>
          <div class="l">비고</div><div class="v"><span class="inp w100" style="color:var(--dim)">—</span></div>
          <div class="l" style="color:var(--teal)">AI 추천</div><div class="v"><span class="radio"><span class="on">전체</span><span>확인 필요</span></span></div>
        </div>
      </div>

      <div class="panel tc">
        <div class="panel-h pinbox">
          <span class="t">신발문양 관리 목록</span>
          <span class="r">
            <span class="seg"><button aria-pressed="false">목록보기</button><button aria-pressed="true">문양보기</button></span>
            ${sb("조회", "pri")}${sb("엑셀")}<button class="btn sm danger" data-lock="admin">삭제</button><button class="btn sm ok" data-lock="admin" title="승인 담당만">승인</button><button class="btn sm" data-role="analyst admin">등록</button>${sb("초기화")}
            <span style="width:1px;height:20px;background:var(--line3)"></span>
            <button class="btn sm pinbox" data-role="analyst admin">엑셀 일괄 등록 ${apin(3, "keep")}</button>
          </span>
        </div>
        <div class="pinbox" style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:9px 14px;border-bottom:1px solid var(--line2)">
          ${apin(4, "voice", true)}
          <span style="color:var(--dim);font-size:11.5px;margin-right:2px">작업 단계<br>(분업)</span>
          ${stage(1, "등록됨 · 문양 대기", "214", false, "등록 담당 → 문양 입력 담당", `<span class="ai-tag" style="justify-self:start;margin-top:3px"><span class="fx-live" style="width:5px;height:5px"></span>AI 문양 제안 198 / 214</span>`)}${arrow}
          ${stage(2, "문양 입력됨 · 그룹 대기", "98", false, "그룹 담당", `<span class="ai-tag" style="justify-self:start;margin-top:3px">AI 그룹 후보 71</span>`)}${arrow}
          ${stage(3, "승인 대기", "224", true, "승인 담당", `<span class="ai-tag" style="justify-self:start;margin-top:3px;color:var(--amber);border-color:#4d3a12;background:#2a1f08">AI 확인 필요 9</span>`)}${arrow}
          ${stage(4, "승인", "0", false, "신발 DB 확정")}
          <span class="pinbox" style="margin-left:auto;display:grid;gap:4px;min-width:196px;font-size:11.5px">
            <span style="display:flex;justify-content:space-between;align-items:center;color:var(--mute)"><span>2025-03 미승인 ${pin(11, "plus")}</span><b class="num" style="color:var(--amber);font-size:14px">536</b></span>
            <span title="문양 대기 214 · 그룹 대기 98 · 승인 대기 224" style="display:flex;gap:1px;height:6px;border-radius:3px;overflow:hidden"><i style="flex:214;background:var(--line3)"></i><i style="flex:98;background:var(--violet)"></i><i style="flex:224;background:var(--blue2)"></i></span>
            <span style="display:flex;justify-content:space-between;align-items:center;color:var(--mute)"><span>오늘 승인 ${pin(5, "voice")}</span><b class="num" style="color:var(--fg)">37 / 50매</b></span>
            <span class="fx-bar run" style="height:5px"><i style="width:74%"></i></span>
            <span style="color:var(--dim)">하루 50매면 3월분 약 11일</span></span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(9,minmax(0,1fr));gap:8px;padding:10px 14px">${cards}</div>
        <div style="display:flex;justify-content:space-between;padding:6px 14px 12px;color:var(--mute);font-size:12px"><span class="num">« ‹ 페이지 [1] / 34 › » ⟳</span><span class="num">전체 536 중 1 - 16</span></div>
      </div>
      ${modal}`
    );
  }

  function scas() {
    const tree = [
      ["사건관리 ▸", 0], ["문양관리 ▾", 0], ["신발문양 관리", 1], ["신발문양 조회", 1], ["타이어문양 관리", 1], ["타이어문양 조회", 1], ["신발그룹 관리", 1],
      ["문양검색 ▸", 0], ["문양대조 ▸", 0], ["감정서관리 ▸", 0], ["족윤적관리 ▸", 0], ["족윤적감정 역량평가", 0],
    ];
    const tabs = ["사건관리", "시험품질경영절차서", "시험품질경영지침서", "감정서작성", "족윤적 검증", "결재 대기함", "수신 문서함", "문서접수대장", "신발문양 관리"];
    const card = ([n], i) => `<div style="${n === "303349" ? "outline:2px solid var(--green);" : ""}background:var(--s-white);border:1px solid var(--s-line);padding:3px">
        <div style="height:86px">${sole({ kind: "shoe", zones: Z[i % Z.length], bg: "#ffffff" })}</div>
        <div style="font-size:9.5px;color:var(--s-mute)">☐ ${n}</div></div>`;
    const sb = (t, c = "") => `<span class="sbtn ${c}">${t}</span>`;
    const zr = (l, icons, red) => `<tr><td class="lbl" style="width:52px;text-align:center">${l}</td><td style="height:34px;${red ? "outline:2px solid var(--red);outline-offset:-2px" : ""}">${icons}</td></tr>`;
    return M.scasShell(
      { treeOn: "신발문양 관리", tree, tabOn: "신발문양 관리", tabs, h: 880 },
      `<div class="box" style="padding:8px;margin-bottom:8px">
        <table><tbody>
          <tr><td class="lbl">화류번호</td><td style="width:220px"></td><td class="lbl">제조사</td><td style="width:220px">${sb("조회", "b")}</td><td class="lbl">성별</td><td>◉전체 ○남 ○여 ○혼용</td></tr>
          <tr><td class="lbl">등록일자</td><td>2025-03-01 📅 ~ 2025-03-31 📅</td><td class="lbl">상표</td><td>${sb("조회", "b")}</td><td class="lbl">승인</td><td>◉전체 ○승인 ○미승인</td></tr>
          <tr><td class="lbl">등록관서</td><td></td><td class="lbl">그룹명</td><td>${sb("조회", "b")}</td><td></td><td></td></tr>
          <tr><td class="lbl">화종</td><td></td><td class="lbl">비고</td><td></td><td></td><td></td></tr>
        </tbody></table>
      </div>
      <div class="bar">신발문양 관리 목록 <span style="font-weight:400">○목록보기 ◉문양보기 ${["조회", "엑셀", "삭제", "승인", "등록", "초기화"].map((t) => sb(t)).join(" ")}</span></div>
      <div class="box" style="padding:6px;display:grid;grid-template-columns:repeat(9,1fr);gap:5px">${CARDS.map(card).join("")}</div>
      <div style="padding:6px;color:var(--s-mute);font-size:11px">« ‹ 페이지 [1] / 34 › » ⟳ <span style="float:right">전체 536 중 1 - 16</span></div>

      <div class="dim"></div>
      <div class="modal" style="left:150px;top:250px;width:900px">
        <div class="bar">신발정보관리 <span>×</span></div>
        <div style="padding:8px">
          <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:6px;border-bottom:1px solid var(--s-line)">
            <span>${sb("기본정보")} ${sb("문양정보", "b")}</span>
            <span><span class="sbtn" style="border-color:var(--s-head);color:var(--s-head)">인공지능문양관리</span> ${["이전", "다음", "승인", "그룹등록", "닫기"].map((t) => sb(t)).join(" ")}</span>
          </div>
          <div style="padding:3px 0;text-align:right;color:var(--s-mute);font-size:10.5px">(기본정보 탭 버튼줄) NEW등록 · 이전 다음 그룹등록 인공지능그룹등록 프린트 수정 삭제 닫기</div>
          <div style="display:grid;grid-template-columns:30% minmax(0,1fr);gap:8px">
            <div style="display:grid;gap:6px;align-content:start">
              <div class="bar" style="height:22px">바닥 이미지</div>
              <div style="height:270px;border:1px solid var(--s-line)">${sole({ kind: "shoe", zones: ["herring", "grid", "herring"], bg: "#ffffff" })}</div>
              <div class="bar" style="height:22px">코드 설명</div>
              <div class="box" style="padding:6px;font-size:11px;line-height:1.45">${M.PDESC.n32_04}</div>
            </div>
            <div style="display:grid;gap:6px;align-content:start">
              <div class="bar" style="height:22px">신발 문양</div>
              <table><tbody>
                ${zr("상", picon("n32_04", "sm"))}${zr("중", picon("n21_05", "sm") + " " + picon("s81b", "sm", "마크"))}${zr("하", picon("n32_04", "sm"), true)}${zr("윤곽", "")}
                <tr><td class="lbl" style="text-align:center">문자열</td><td style="height:34px;text-align:right">${sb("저장", "b")}</td></tr>
              </tbody></table>
              <div style="display:flex;gap:2px;background:var(--s-head);padding:3px">${M.PCATS.map((c) => `<span style="padding:1px 8px;font-size:11px;${c === "내부선" ? "background:var(--s-white);color:var(--s-text)" : "color:#fff"}">${c}${c === "항목" ? "(?)" : ""}</span>`).join("")}</div>
              <div class="box" style="padding:5px;display:flex;flex-wrap:wrap;gap:3px">${M.P["내부선"].concat(M.P["내부선"].slice(0, 10)).map((n) => picon(n, "sm")).join("")}</div>
              <div style="display:flex;gap:2px;font-size:11px">${sb("단선", "b")}${sb("다선1")}${sb("다선2")}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="darkwin" style="left:800px;top:300px;width:330px">
        <div class="tt">인공지능 문양 상세 보기 - Chrome</div>
        <div style="padding:8px;display:grid;grid-template-columns:96px minmax(0,1fr);gap:8px;font-size:11px">
          <div>바닥 이미지
            <div style="position:relative;height:130px;margin-top:3px;background:var(--s-side)">
              <span style="position:absolute;left:8px;top:10px;width:40px;height:26px;border:2px solid var(--amber)"></span>
              <span style="position:absolute;left:30px;top:48px;width:44px;height:22px;border:2px solid var(--violet)"></span>
              <span style="position:absolute;left:12px;top:78px;width:36px;height:24px;border:2px solid var(--green)"></span>
              <span style="position:absolute;left:46px;top:96px;width:30px;height:24px;border:2px solid var(--red)"></span>
            </div>
            <div style="font-size:18px;font-weight:700">75%</div><div style="height:4px;background:var(--amber);width:75%"></div>
          </div>
          <div>신발 문양
            ${["상", "중", "하"].map((r, i) => `<div style="display:flex;gap:3px;align-items:center;margin-top:5px">${r} ${'<span style="width:20px;height:20px;background:var(--s-line);display:inline-block"></span>'.repeat(i === 1 ? 3 : 2)}${i === 1 ? " 마크 브랜드" : ""}</div>`).join("")}
          </div>
        </div>
        <div style="padding:0 8px 8px;font-size:10.5px">면 내부선 삼각 사각 다각 원 항목(?)
          <div style="display:grid;grid-template-columns:repeat(12,1fr);gap:2px;margin-top:4px">${'<span style="height:16px;background:var(--s-line)"></span>'.repeat(36)}</div>
          <div style="text-align:right;margin-top:5px"><span class="sbtn b">저장</span></div>
        </div>
      </div>

      <div class="oswin" style="left:20px;top:560px;width:330px">
        <div class="tt">👤 이미지 커팅</div>
        <div style="padding:5px 6px;display:flex;flex-wrap:wrap;gap:3px">${["-", "170", "+", "좌", "0", "우", "잘라내기", "확인", "저장"].map((t) => sb(t)).join("")}</div>
        <div class="ph" style="height:90px;margin:0 6px">밑창 이미지 (확대·회전)</div>
        <div style="padding:5px 6px;display:flex;flex-wrap:wrap;gap:3px">${["처음상태", "평준화(?)", "색상반전", "좌우반전", "밝게", "어둡게", "상하반전"].map((t) => sb(t)).join("")}</div>
      </div>

      ${M.pain(930, 64, "<b>미코딩·미승인 단계가 안 보임</b> — 등록일자를 1983년부터 월 단위로 좁혀 536건(34쪽)까지 줄인 뒤 한 장씩 열어 확인 (5616 3:30–4:40)", 280)}
      ${M.pain(840, 660, "<b>창 3종이 겹침</b> — 웹 모달 + 크롬 새 창(AI, 다크) + Windows 창(이미지 커팅). 생김새도 제각각 (5614 0:00–0:45)", 300)}
      ${M.pain(470, 200, "<b>같은 문양을 3번</b> — 상·중·하 행을 하나씩 눌러 같은 헤링본을 따로 찍음 (5616 0:30–2:45)", 300)}`
    );
  }

  M.add({
    id: "s10",
    code: "S10",
    group: "문양관리",
    title: "신발문양 관리",
    refs: [{ t: "SCAS 신발문양 관리", v: "5616 00:00 · 02:50–06:00" }, { t: "신발정보관리 모달", v: "5614 00:00–02:30" }, { t: "인터뷰 분업·승인", v: "5616 04:30–06:12", voice: true }],
    lead: "SCAS 배치를 그대로 씁니다. 위에 검색폼 3열×4행, 그 아래 「신발문양 관리 목록」 머리와 툴바, 카드 9열, 페이지 순서입니다. 카드를 누르면 같은 자리에 신발정보관리 창이 뜹니다. 바뀐 것은 세 가지입니다. 분업 단계별로 일감이 보이고, AI 추천이 새 창 대신 이 창 안에서 동작하며, 승인은 승인 담당만 합니다. r3: 작업 단계 줄에 AI가 미리 해 둔 일(문양 제안 198건 등)과 3월분 536건 미승인 막대를, 카드와 창 안에 문양별 AI 확신도·부위 구분선·중복 의심을 더했습니다(자리·버튼 순서는 그대로).",
    fit: {
      area: ["same", "검색폼 위 · 목록 머리+툴바 · 카드 9열 · 페이지 순서 그대로. 「작업 단계」 줄 하나만 목록 머리 아래 덧붙임"],
      buttons: ["same", "툴바(목록보기/문양보기 조회 엑셀 삭제 승인 등록 초기화)와 창 버튼(인공지능문양관리 이전 다음 승인 그룹등록 닫기) 원문 순서. 「엑셀 일괄 등록」만 구분선 뒤 끝에"],
      popup: ["near", "신발정보관리는 같은 자리 레이어 그대로. AI 크롬 창·이미지 커팅 Windows 창은 따로 뜨지 않고 이 창 안에서 동작(창 1겹)"],
      columns: ["same", "검색 라벨 10개·카드 16장·기본정보 19칸·문양 행(상 중 하 윤곽 문자열)·팔레트 탭 순서 그대로. 빈 칸 2곳에만 필터 추가"],
    },
    scas,
    ours,
    notes: [
      { n: 1, kind: "keep", title: "검색폼 3열×4행 그대로", text: "화류번호(신발 번호)·제조사·성별 / 등록일자·상표·승인 / 등록관서·그룹명 / 화종·비고를 SCAS와 같은 칸에 둡니다. 등록일자는 월 단위로 바로 고르게 해 10년씩 넘기던 날짜 선택기를 안 써도 됩니다.", src: "5616 S5 검색 폼 · P3 3:28–4:10" },
      { n: 2, kind: "better", title: "빈 칸 2곳에 「문양 입력」「AI 추천」 필터", text: "SCAS 검색폼의 비어 있던 오른쪽 아래 두 칸에만 필터를 넣었습니다. 문양이 비어 있는 신발만 바로 모읍니다. SCAS에서는 이 필터가 없어 날짜를 월 단위로 좁힌 뒤 한 장씩 열어 확인했습니다.", src: "5616 3:30–4:40" },
      { n: 3, kind: "keep", title: "툴바 원문 순서 + 엑셀 일괄 등록", text: "목록보기/문양보기 · 조회 엑셀 삭제 승인 등록 초기화를 같은 자리, 같은 순서로 둡니다. 구분선 뒤 「엑셀 일괄 등록」은 SCAS 「신발정보일괄등록」 메뉴를 이 화면에서도 부르는 지름길입니다. 「엑셀에다가 다 저장을 해요… 한 번에 등록을 하는거예요」.", src: "5616 12:00–12:10" },
      { n: 4, kind: "voice", title: "분업 단계별 일감", text: "등록 → 문양 입력 → 그룹 → 승인 담당이 따로 있어, 각자 자기 단계 카드만 모아 봅니다. 「신발 등록하는 사람은 따로 있고 그다음에 문양 넣는 사람이 따로 있고… 승인하는 사람이 따로 있고」.", src: "5616 04:30–04:42" },
      { n: 5, kind: "voice", title: "승인은 하루 약 50매 · 3월분 536건 미승인", text: "승인 담당의 하루 처리량과 남은 미승인 수를 목록 머리에 보여 줍니다. 「536건은 무조건 승인이 안 된 상태야」, 「승인하시는 분이 하루에 거의 한 50매 정도 하거든?」(등록은 한 달 약 500건).", src: "5616 05:09 · 05:51 · 03:04" },
      { n: 6, kind: "better", title: "같은 자리 레이어 창, 1겹만", text: "카드를 누르면 SCAS처럼 목록 위에 신발정보관리 창이 뜨고 뒤 목록은 어둡게 깔립니다. 크롬 새 창(인공지능 문양 상세 보기)과 Windows 「이미지 커팅」 창은 따로 뜨지 않습니다. 겹치는 창은 이 창 하나뿐입니다.", src: "5614 00:00–00:45" },
      { n: 7, kind: "plus", title: "「인공지능문양관리」는 같은 자리, 같은 창 안에서", text: "버튼 이름·자리는 그대로이고, 누르면 새 창 대신 문양 행에 AI 제안(청록)이 채워집니다. 윤곽은 AI가 못 잡으므로 「AI 미지원 · 사람이 입력」으로 비워 둡니다.", src: "사업계획서 p5 · 5613 04:10 「얘는 윤곽을 못 잡아요」" },
      { n: 8, kind: "voice", title: "가격표가 가린 사진은 「확인 필요」", text: "가격표·스티커가 문양을 가리면 그 행의 AI 제안을 노란 「확인 필요」로 표시하고, 확인 전에는 승인되지 않게 합니다. 「가격표 그런 것들 때문에 인공지능은 못잡을 수 있겠지」.", src: "5616 00:31–00:35" },
      { n: 9, kind: "better", title: "상·중·하 같은 문양 한 번에", text: "고른 문양을 세 행에 한 번에 넣습니다. 헤링본처럼 밑창 전체가 같은 무늬일 때 행을 3번 눌러 같은 아이콘을 3번 찍던 일을 줄입니다. 코드 설명은 SCAS처럼 왼쪽 아래 그대로 둡니다.", src: "5616 0:30–2:45" },
      { n: 10, kind: "better", title: "승인 조건과 승인 권한(보는 사람에 따라)", text: "측면·바닥 사진, 상·중·하 문양, AI 확인 필요 0건이 모두 갖춰져야 승인됩니다(「측면도 없고, 바닥만 있어. 그럼 못 넣어요」 5616 12:26). 「승인」 버튼은 신발 승인 권한(사용자 관리 S13)이 있는 승인 담당에게만 눌립니다. 시안에서는 관리자만 눌리고, 감정관으로 보면 승인·삭제가 흐리게 잠깁니다." },
      { n: 11, kind: "plus", title: "AI가 미리 해 둔 일 · 밀린 일감 막대(r3)", text: "등록된 신발은 담당자가 열기 전에 AI가 문양 제안(198/214)과 그룹 후보(71)를 미리 만들어 둡니다. 단계마다 청록 「AI …」 표로 몇 건이 준비됐는지 보이고, 오른쪽에는 3월분 536건이 어느 단계에 몇 건씩 쌓였는지(문양 대기 214 · 그룹 대기 98 · 승인 대기 224) 막대 하나로, 오늘 승인 37/50매는 진행 막대로 보여 줍니다. 카드 오른쪽 위에는 문양 제안 확신도가 붙고, 낮으면(0.7 미만) 노란색입니다. 숫자 중 198·71·9와 카드 확신도는 시안 예시입니다.", src: "5616 05:09 · 05:51 「하루에 거의 한 50매」 · 사업계획서 p5" },
      { n: 12, kind: "plus", title: "상·중·하를 AI가 한 번에, 확신도와 함께(r3)", text: "AI가 바닥 사진에 상·중·하 구분선을 긋고 부위마다 문양과 확신도(0.94 · 0.58 · 0.94)를 채웁니다. 상·하처럼 같은 무늬는 한 번에 넣어 「같은 헤링본을 행마다 3번 찍던」 일이 1번 확인으로 줄어듭니다. 가격표가 가린 중간(가림 18%)은 확신도가 낮아 노란 「확인 필요」로 남고, 확정은 문양 입력 담당이 합니다.", src: "5616 0:30–2:45 · 00:31 「가격표 그런 것들 때문에」" },
      { n: 13, kind: "plus", title: "중복 신발 의심(r3)", text: "새로 등록한 신발의 바닥이 이미 DB에 있는 신발(예: 298114)과 거의 같으면 AI가 「중복 의심」으로 알려 줍니다. 같은 신발이면 등록을 취소하고, 연도만 바뀐 재출시면 같은 그룹으로 연결합니다. 중복 확인이 끝나기 전에는 승인 조건이 채워지지 않습니다. 298114·0.96은 시안 예시입니다.", src: "5616 02:10–02:16 「똑같은 바닥이 신상으로 나오는 경우」" },
    ],
  });
})();
