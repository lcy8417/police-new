/* S11 수집 검수(+α, r2) — SCAS에 없는 새 화면. 지금 절차(녹취 5616 01:00–01:40, 11:13–12:26):
   인터넷(종합몰·홈쇼핑·브랜드몰)을 루틴대로 돌며 → 프린트스크린으로 앞면·측면·바닥을 잘라 jpg/png 저장 → 엑셀에 정리 → 한 번에 등록.
   제조사는 이제 자료를 보내 주지 않는다. 측면 없이 바닥만 있으면 등록하지 않는다.
   사업계획서 p12 · 발표 s11: URL 수집 + 사진 자동 분류 + 메타데이터 읽기 + 분석관 검수 후 DB 반영 + 라벨 오기입 정제(군집화). */
(function () {
  const { pin, apin, sole, picon } = M;

  const SIDE = `<svg viewBox="0 0 60 30" width="100%" height="100%" aria-label="측면(가짜 예시)"><path d="M4 22C4 15 9 13 17 12L27 6C33 4 39 7 43 11C49 13 56 15 56 21V25H4Z" style="fill:var(--mute)"/><path d="M4 25H56" style="stroke:var(--fg2);stroke-width:2"/><path d="M20 17C28 14 36 15 44 18" style="fill:none;stroke:var(--bg2);stroke-width:1.6"/></svg>`;
  const FRONT = `<svg viewBox="0 0 40 30" width="100%" height="100%" aria-label="앞면(가짜 예시)"><path d="M8 26C8 14 13 6 20 6S32 14 32 26Z" style="fill:var(--mute)"/><path d="M8 26H32" style="stroke:var(--fg2);stroke-width:2"/></svg>`;

  const SRC = [
    { nm: "신발닷컴 · 신상 목록", kind: "종합몰", st: ["blue", "확인 중"], got: "46", wait: "12", at: "07-24 06:00", hl: true },
    { nm: "홈쇼핑 신발 신상관", kind: "종합몰", st: ["green", "완료"], got: "18", wait: "5", at: "07-24 06:00" },
    { nm: "nike.com/kr", kind: "브랜드몰", st: ["green", "완료"], got: "31", wait: "9", at: "07-23 06:00" },
    { nm: "prospecs.com", kind: "브랜드몰", st: ["green", "완료"], got: "12", wait: "3", at: "07-23 06:00" },
    { nm: "crocs.co.kr", kind: "브랜드몰", st: ["red", "실패 · 페이지 구조 바뀜"], got: "0", wait: "—", at: "07-22 06:00" },
  ];
  /* ph: [앞면, 측면, 바닥] 있음 여부 */
  const QUEUE = [
    { q: "Q-0712", br: "나이키", md: "LD-1000", sn: "IH7330-020", ph: [1, 1, 1], warn: ["blue", "재출시 후보 · 305655"], z: ["herring", "grid", "herring"], sel: true },
    { q: "Q-0713", br: "나이키", md: "R-220", sn: "DV1234-001", ph: [1, 0, 1], warn: ["red", "측면 없음 · 등록 불가"], z: ["grid", "dots", "grid"] },
    { q: "Q-0714", br: "프로스펙스", md: "W-31", sn: "PW0WK31-BK", ph: [1, 1, 1], warn: ["violet", "라벨 군집 · 상표 표기"], z: ["wave", "blocks", "lines"] },
    { q: "Q-0715", br: "휠라", md: "C-9", sn: "1TM01234", ph: [0, 1, 1], warn: ["amber", "바닥 가림 심함"], z: ["tri", "grid", "dots"] },
    { q: "Q-0716", br: "휠라", md: "RX-5", sn: "1RM02211", ph: [1, 1, 1], warn: null, z: ["blocks", "grid", "blocks"] },
    { q: "Q-0717", br: "크록스", md: "CL-2", sn: "206991-001", ph: [0, 1, 1], warn: null, z: ["dots", "dots", "blocks"] },
  ];

  const conf = (v, warn) => `<span class="ai-mark" style="${warn ? "color:var(--amber)" : ""}">${v}</span>`;
  const ok = (b) => (b ? `<span style="color:var(--green)">✓</span>` : `<span style="color:var(--red)">✗</span>`);

  function ours() {
    const srcRows = SRC.map(
      (s) => `<tr><td><span style="color:var(--fg)">${s.nm}</span>${s.hl ? ` ${pin(2, "voice")}` : ""}</td><td><span class="chip ${s.kind === "종합몰" ? "blue" : ""}" style="height:20px;font-size:11px">${s.kind}</span></td>
        <td><span class="chip ${s.st[0]}">${s.st[0] === "blue" ? '<span class="dot"></span>' : ""}${s.st[1]}</span></td>
        <td class="r num">${s.got}</td><td class="r num" style="color:${s.wait !== "—" ? "var(--amber)" : "var(--faint)"}">${s.wait}</td><td class="num" style="color:var(--mute)">${s.at}</td></tr>`
    ).join("");

    const qRows = QUEUE.map(
      (r) => `<tr class="${r.sel ? "sel" : ""}">
        <td><span style="display:inline-block;width:12px;height:12px;border-radius:3px;border:1px solid var(--line3)"></span></td>
        <td><span style="display:flex;gap:3px;align-items:center">
          <span class="imgbox" style="display:block;width:24px;height:22px;padding:2px;background:var(--panel2);${r.ph[0] ? "" : "opacity:.25"}">${r.ph[0] ? FRONT : ""}</span>
          <span class="imgbox" style="display:block;width:38px;height:22px;padding:2px;background:var(--panel2);${r.ph[1] ? "" : "opacity:.25;border-color:var(--red)"}">${r.ph[1] ? SIDE : ""}</span>
          <span class="imgbox" style="display:block;width:20px;height:32px">${sole({ kind: "shoe", zones: r.z })}</span></span></td>
        <td><div style="color:var(--fg);line-height:1.3">${r.br} <span class="mono">${r.md}</span></div><div class="mono" style="color:var(--dim);font-size:11px;line-height:1.3">${r.q} · ${r.sn}</div></td>
        <td style="font-size:11.5px;color:var(--mute)">앞 ${ok(r.ph[0])} 측 ${ok(r.ph[1])} 바닥 ${ok(r.ph[2])}</td>
        <td>${r.warn ? `<span class="chip ${r.warn[0]}" style="height:20px;font-size:11px">${r.warn[1]}</span>` : `<span style="color:var(--faint)">—</span>`}</td></tr>`
    ).join("");

    return M.shell(
      { active: "수집 검수", tabs: ["사건관리", "신발문양 관리", "수집 검수"], title: "수집 검수", h: 1150 },
      `<div class="page-head">
        <div><div class="crumb">족윤적 · 문양관리 · 수집 검수 +α</div><h3>수집 검수</h3><p>늘 보던 쇼핑몰을 대신 돌며 신상 사진을 모아 오고, 앞면·측면·바닥으로 나눠 둡니다. 등록 담당이 확인하면 엑셀 일괄 등록 묶음이 만들어져 신발 DB(문양 대기)로 들어갑니다.</p></div>
        <div style="display:flex;gap:8px">
          <button class="btn ghost">검수 기준 보기</button>
          <button class="btn pri" data-lock="admin">＋ 수집처 추가</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:minmax(0,1fr) 400px;gap:12px;margin-bottom:12px;align-items:start">
        <div class="panel tc pinbox">
          ${apin(1, "voice", true)}
          <div class="panel-h"><span class="lbl">SOURCES</span><span class="t">수집처 순회 목록</span><span class="r"><span style="color:var(--dim);font-size:12px">매일 06:00 신상 확인 · 검수 대기 29</span></span></div>
          <table class="grid"><thead><tr><th>수집처</th><th>종류</th><th>상태</th><th class="r">새로 찾음</th><th class="r">검수 대기</th><th>마지막 확인</th></tr></thead><tbody>${srcRows}</tbody></table>
          <div class="pinbox" style="display:flex;align-items:center;gap:8px;margin:10px 14px 12px;padding:8px 10px;border:1px solid color-mix(in srgb,var(--amber) 35%,var(--panel));border-radius:8px;background:var(--amber-bg);font-size:12px">
            ${apin(3, "better")}
            <b style="color:var(--amber)">새 상표 3개</b><span style="color:var(--fg2)">— 기초코드에 없는 상표가 보입니다. 상표부터 등록해야 이 신발들을 등록할 수 있습니다.</span>
            <button class="btn sm" style="margin-left:auto" data-lock="admin">기초코드관리에서 상표 등록</button>
          </div>
        </div>

        <div class="panel">
          <div class="panel-h"><span class="lbl">FLOW</span><span class="t">지금 방식 → 바뀌는 방식</span></div>
          <div class="panel-b" style="display:grid;gap:10px;font-size:12px">
            <div class="pinbox" style="display:grid;gap:4px;padding:8px 10px;border:1px solid var(--line2);border-radius:8px;background:var(--bg2)">
              ${apin(5, "better")}
              <span class="crumb">지금 (인터넷 PC, 사람이 직접)</span>
              <span style="color:var(--fg2);line-height:1.5">쇼핑몰 순회 → 프린트스크린 → 앞면·측면·바닥 잘라 jpg 저장 → 엑셀 정리 → 내부망 SCAS에 일괄 등록</span>
            </div>
            <div class="pinbox" style="display:grid;gap:6px;padding:8px 10px;border:1px solid var(--line2);border-radius:8px;background:var(--bg2)">
              ${apin(4, "plus")}
              <span class="crumb">바뀌는 방식 (반입 절차 포함)</span>
              ${[
                ["외부망", "수집 서버가 신상 사진·상품 정보 모음"],
                ["망연계", "일방향 전송 · 파일 형식·악성코드 검사"],
                ["내부망", "이 화면에서 등록 담당이 검수"],
                ["등록", "엑셀 일괄 등록 묶음 → 신발문양 관리 「문양 대기」"],
              ].map((s, i) => `<div style="display:grid;grid-template-columns:20px minmax(0,1fr);gap:8px;align-items:start">
                  <span style="display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:var(--blue-bg);color:var(--blue);font:700 10.5px var(--font-mono)">${i + 1}</span>
                  <span><b style="color:var(--fg)">${s[0]}</b> <span style="color:var(--fg2)">${s[1]}</span></span></div>`).join("")}
              <span class="chip amber" style="justify-self:start">확정 필요: 반입 주기 · 담당 부서</span>
            </div>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:600px minmax(0,1fr);gap:12px;align-items:start">
        <div class="panel tc">
          <div class="panel-h"><span class="lbl">REVIEW QUEUE</span><span class="t">검수 대기 <span class="num">29</span></span>
            <span class="r"><span class="chip blue">재출시 후보 4</span><span class="chip red">측면 없음 3</span><span class="chip amber">가림 2</span></span></div>
          <table class="grid"><thead><tr><th></th><th>사진(앞·측·바닥) ${pin(6, "plus")}</th><th>상표 · 모델 / 상품번호</th><th>필수 사진 ${pin(7, "voice")}</th><th>확인할 것</th></tr></thead><tbody>${qRows}</tbody></table>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;color:var(--mute);font-size:12px">
            <span class="num">29 중 1 – 6</span>
            <span data-lock="admin"><button class="btn sm ok">확인할 것 없는 건 모두 등록</button></span>
          </div>
        </div>

        <div class="panel">
          <div class="panel-h"><span class="lbl">REVIEW</span><span class="t mono">Q-0712</span><span class="chip blue">재출시 후보</span>
            <span class="r"><span class="mono" style="color:var(--dim);font-size:11px">신발닷컴 · 07-24 06:12</span></span></div>
          <div class="panel-b" style="display:grid;gap:12px">
            <div style="display:grid;grid-template-columns:1fr 1.4fr 1fr;gap:8px">
              <div style="display:grid;gap:4px"><span class="imgbox" style="height:110px;display:grid;place-items:center;padding:18px;background:var(--panel2)">${FRONT}</span><span style="font-size:12px">앞면 ${conf("0.97")}</span></div>
              <div style="display:grid;gap:4px"><span class="imgbox" style="height:110px;display:grid;place-items:center;padding:14px;background:var(--panel2)">${SIDE}</span><span style="font-size:12px">측면 ${conf("0.99")}</span></div>
              <div style="display:grid;gap:4px"><span class="imgbox" style="height:110px">${sole({ kind: "shoe", zones: ["herring", "grid", "herring"] })}</span><span style="font-size:12px">바닥 ${conf("0.98")}</span></div>
            </div>
            <div style="display:flex;gap:10px;align-items:center;font-size:12px;color:var(--mute)"><span>필수 사진</span><span style="color:var(--green)">측면 ✓</span><span style="color:var(--green)">바닥 ✓</span><span style="color:var(--dim)">→ 등록 가능</span></div>

            <div class="pinbox">
              ${apin(8, "plus", true)}
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><b style="font-size:13px">읽어 낸 정보</b><span class="ai-mark">● AI · 숫자는 신뢰도</span><span style="margin-left:auto;color:var(--dim);font-size:11px">SCAS 기본정보 칸 순서 그대로</span></div>
              <div class="form">
                <div class="l">제조사</div><div class="v">(유)나이키코리아 <span style="color:var(--dim);font-size:11px">FT002</span></div>
                <div class="l req">상표명</div><div class="v">나이키 ${conf("0.98")}</div>
                <div class="l">모델번호</div><div class="v span3 mono">LD-1000 IH7330-020 ${conf("0.93")}</div>
                <div class="l req">신발종류</div><div class="v">운동화 / 운동화 ${conf("0.86")}</div>
                <div class="l">성별</div><div class="v">혼용 ${conf("0.62", true)}</div>
                <div class="l">수집년도</div><div class="v num">2025년 7월</div>
                <div class="l req">수집장소(상호)</div><div class="v"><span class="chip">인터넷수집</span></div>
                <div class="l">수집장소(주소)</div><div class="v span3 mono" style="color:var(--mute);font-size:11.5px">신발닷컴 상품 주소 <span style="font-family:var(--font-ui);color:var(--dim)">(출처를 자동으로 적음)</span></div>
              </div>
            </div>

            <div class="pinbox" style="display:grid;gap:8px">
              ${apin(9, "voice")}
              <div style="padding:9px 11px;border:1px solid color-mix(in srgb,var(--blue) 35%,var(--panel));border-radius:8px;background:var(--blue-bg);font-size:12px;line-height:1.5">
                <b style="color:var(--blue)">재출시 후보</b> <span style="color:var(--fg2)">— 등록된 <span class="mono">305655</span>(2019년 수집)와 바닥이 같습니다. 같은 밑창이 연도만 바뀌어 다시 나온 것으로 보입니다. 중복이 아니므로 버리지 않습니다.</span>
                <div style="display:flex;gap:6px;margin-top:6px"><button class="btn sm" data-lock="admin">305655 그룹에 연결해 등록</button><button class="btn sm ghost">새 신발로 등록</button><button class="btn sm ghost">305655 열기</button></div>
              </div>
              <div class="pinbox" style="padding:9px 11px;border:1px solid color-mix(in srgb,var(--violet) 35%,var(--panel));border-radius:8px;background:var(--violet-bg);font-size:12px;line-height:1.5">
                <b style="color:var(--violet)">라벨 군집</b> <span style="color:var(--fg2)">— 같은 바닥으로 묶인 12장 중 2장의 상표가 「나이키코리아」로 적혀 있습니다. 「나이키」로 맞출까요?</span>
                <div style="display:flex;gap:6px;margin-top:6px"><button class="btn sm" data-lock="admin">12장 한꺼번에 맞추기</button></div>
              </div>
            </div>

            <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px dashed var(--line3);border-radius:8px;font-size:12px;color:var(--mute)">
              <span class="ai-mark">● 문양 AI 제안</span>${picon("n32_04", "sm ai")}${picon("n21_05", "sm ai")}${picon("n32_04", "sm ai")}
              <span>등록 뒤 신발문양 관리에서 문양 입력 담당이 확인합니다</span>
            </div>

            <div class="pinbox" style="display:flex;align-items:center;gap:8px;padding-top:4px" data-lock="admin">
              ${apin(10, "better", true)}
              <button class="btn danger">반려</button>
              <span class="inp" style="width:190px">사유: 가림이 심함<span class="caret">▾</span></span>
              <button class="btn" style="margin-left:auto">보류</button>
              <button class="btn ok">✓ 등록 → 일괄 등록 묶음</button>
            </div>
          </div>
        </div>
      </div>
      <div class="pinbox" style="display:inline-flex;gap:8px;align-items:center;margin-top:12px;padding:8px 12px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--mute);font-size:12px">
        ${apin(11, "better")}<span class="chip blue">신발 등록 담당</span> 검수·등록·반려 &nbsp;|&nbsp; <span class="chip blue">관리자</span> 수집처 추가 &nbsp;|&nbsp; <span class="chip">그 밖의 감정관</span> 보기만
      </div>`
    );
  }

  M.add({
    id: "s11",
    code: "S11",
    group: "문양관리",
    title: "수집 검수",
    plus: true,
    refs: [{ t: "인터넷 수집 절차", v: "5616 01:00–01:40 · 11:13–12:26", voice: true }, { t: "사업계획서", v: "p12" }, { t: "발표", v: "s11" }],
    lead: "SCAS에는 없는 새 화면입니다. 지금은 쇼핑몰을 돌며 프린트스크린으로 앞면·측면·바닥을 잘라 저장하고, 엑셀에 정리해 SCAS에 한 번에 등록합니다. 이 화면은 그 앞부분(모으기·자르기·정리)을 대신하고, 등록 담당은 확인만 합니다.",
    fit: {
      area: ["na", "SCAS에 없는 화면 — 현행 police-new 관리 화면처럼 위 목록 + 아래 표·오른쪽 상세"],
      buttons: ["na", "SCAS 버튼 없음. 결과는 SCAS 「신발정보일괄등록」 엑셀 양식으로 넘김"],
      popup: ["na", "창을 띄우지 않고 오른쪽 상세 칸에서 처리"],
      columns: ["na", "읽어 낸 정보 칸은 SCAS 기본정보 라벨·순서 그대로"],
    },
    ours,
    notes: [
      { n: 1, kind: "voice", title: "제조사가 자료를 안 줘서 인터넷 수집이 기본", text: "예전에는 회사가 측면 사진 등을 보내 줬지만 지금은 아닙니다. 「어떤 의무가 없다고 생각하니까 안 보내주기 때문에 인터넷으로 모든 것을 하고 있고」. 그래서 수집처 순회를 화면의 맨 위에 둡니다.", src: "5616 01:21–01:29" },
      { n: 2, kind: "voice", title: "늘 보던 곳을 루틴대로 · 종합몰 포함", text: "브랜드 공식몰만이 아니라 신발닷컴·홈쇼핑 같은 종합몰도 수집처로 둡니다. 「신발닷컴이라던가… 그런곳을 다 뒤져가지고」, 「항상 했던 곳이 있잖아」. 연도별이 아니라 신상이 올라오는 곳을 매일 확인합니다.", src: "5616 12:39–13:00 · 07:35" },
      { n: 3, kind: "better", title: "새 상표는 기초코드에 먼저", text: "기초코드에 없는 상표가 보이면 알려 주고, 기초코드관리(S12)에서 상표부터 등록하게 합니다. 「상표를 적어와서… 상표 등록을 하고」.", src: "5616 08:43–09:01" },
      { n: 4, kind: "plus", title: "반입 절차(외부망 → 내부망)", text: "수집은 외부망 서버에서, 검수·등록은 내부망에서 합니다. 그 사이는 일방향 전송과 파일 검사를 거칩니다. 반입 주기와 담당 부서는 아직 정하지 않았습니다(열린 질문).", src: "열린 질문: 인터넷 수집 PC" },
      { n: 5, kind: "better", title: "프린트스크린·자르기·엑셀 정리를 대신", text: "지금 절차는 「프린트 스크린으로, 잘라서 jpg나 png 파일로 저장」 → 「엑셀에다가 다 저장을 해요… 한 번에 등록」입니다. 이 앞부분을 수집 서버가 하고, 결과도 SCAS와 같은 엑셀 일괄 등록 묶음으로 만듭니다.", src: "5616 11:13–12:10" },
      { n: 6, kind: "plus", title: "앞면·측면·바닥 자동 분류", text: "상품 사진 여러 장 중 앞면(전/후면)·측면·바닥을 AI가 골라 SCAS 이미지 칸에 맞춰 넣습니다. 나머지 사진은 제외합니다.", src: "사업계획서 p12 · 5616 11:48 「앞면, 측면, 바닥」" },
      { n: 7, kind: "voice", title: "측면 + 바닥이 둘 다 있어야 등록", text: "측면이 없으면 「측면 없음 · 등록 불가」로 표시하고 등록 버튼을 막습니다. 「측면과 바닥은 거의 반드시 넣어요. 만약에 측면도 없고, 바닥만 있어. 그럼 못 넣어요」.", src: "5616 12:21–12:26" },
      { n: 8, kind: "plus", title: "상품 정보 읽기 → SCAS 기본정보 칸", text: "상표명·모델번호·신발종류·성별을 상품 페이지에서 읽어 SCAS 기본정보 라벨 그대로 채우고, 신뢰도가 낮은 칸(성별 0.62)만 노란색으로 표시합니다. 수집장소(상호)는 SCAS 값 「인터넷수집」 그대로입니다.", src: "사업계획서 p12 메타데이터 파싱" },
      { n: 9, kind: "voice", title: "같은 바닥이 연도만 바뀌면 「재출시」", text: "등록된 신발과 바닥이 같아도 중복으로 버리지 않고, 기존 그룹에 연결해 등록하는 선택지를 줍니다. 「세월이 흘러도 똑같은 바닥이 신상으로 나오는 경우가 있어」.", src: "5616 02:10–02:16" },
      { n: 10, kind: "better", title: "반려 사유 기본값 「가림이 심함」 · 라벨 군집", text: "문양이 많이 가려진 사진은 지금도 버립니다(「도저히 이거는 분별하기 어렵다 그러면 버려요」 5616 00:46). 반려 사유의 첫 값을 이것으로 둡니다. 같은 바닥끼리 묶었을 때 상표가 다르게 적힌 건은 한꺼번에 바로잡습니다(사업계획서 p12 군집화)." },
      { n: 11, kind: "better", title: "보는 사람에 따라", text: "검수·등록·반려는 신발 등록 권한이 있는 등록 담당만 합니다(사용자 관리 S13의 신발 DB 분업 권한). 수집처 추가는 관리자만 합니다. 시안에서는 관리자 말고 다른 사람으로 보면 이 버튼들이 흐리게 잠깁니다." },
    ],
  });
})();
