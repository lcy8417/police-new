/* S11 수집 검수(+α) — SCAS에 없는 새 화면. 근거: 지금은 인터넷 PC에서 Bing → nike.com → 그림판 3D로 사진을 구해
   SCAS(내부망)에 손으로 등록한다(IMG_5616 오른쪽 모니터 7:30–13:40, 수집장소(상호) = 인터넷수집).
   사업계획서 p12 · 발표 s11: URL 크롤링 + 옆창·밑창 자동 분류 + 메타데이터 파싱 + 분석관 검수 후 DB 반영 + 라벨 오기입 정제(군집화). */
(function () {
  const { pin, apin, sole, picon } = M;

  const SIDE = `<svg viewBox="0 0 60 30" width="100%" height="100%" aria-label="옆창(가짜 예시)"><path d="M4 22C4 15 9 13 17 12L27 6C33 4 39 7 43 11C49 13 56 15 56 21V25H4Z" style="fill:var(--mute)"/><path d="M4 25H56" style="stroke:var(--fg2);stroke-width:2"/><path d="M20 17C28 14 36 15 44 18" style="fill:none;stroke:var(--bg2);stroke-width:1.6"/></svg>`;

  const JOBS = [
    { url: "nike.com/kr/w/shoes", scope: "신발 802개", br: "나이키", st: ["blue", "진행 중 64%"], got: "812", wait: "96", at: "07-24 06:00" },
    { url: "prospecs.com/goods", scope: "운동화", br: "프로스펙스", st: ["green", "완료"], got: "214", wait: "12", at: "07-23 06:00" },
    { url: "fila.co.kr/shoes", scope: "전체", br: "휠라", st: ["green", "완료"], got: "388", wait: "31", at: "07-23 06:00" },
    { url: "crocs.co.kr/sandals", scope: "샌들", br: "크록스", st: ["red", "실패 · 페이지 구조 바뀜"], got: "0", wait: "—", at: "07-22 06:00" },
    { url: "treksta.com/hiking", scope: "등산화", br: "트렉스타", st: ["", "예약 · 매주 월"], got: "—", wait: "—", at: "07-28 06:00" },
  ];
  const QUEUE = [
    { q: "Q-0712", br: "나이키", md: "LD-1000", sn: "IH7330-020", cls: "옆창+밑창", cf: "0.97", warn: ["amber", "중복 의심 305655"], z: ["herring", "herring", "herring"], sel: true },
    { q: "Q-0713", br: "나이키", md: "R-220", sn: "DV1234-001", cls: "밑창만", cf: "0.95", warn: null, z: ["grid", "dots", "grid"] },
    { q: "Q-0714", br: "프로스펙스", md: "W-31", sn: "PW0WK31-BK", cls: "옆창+밑창", cf: "0.93", warn: ["violet", "라벨 오기입 의심"], z: ["wave", "blocks", "lines"] },
    { q: "Q-0715", br: "휠라", md: "C-9", sn: "1TM01234", cls: "분류 확인", cf: "0.58", warn: ["amber", "옆창·밑창 애매"], z: ["tri", "grid", "dots"] },
    { q: "Q-0716", br: "휠라", md: "RX-5", sn: "1RM02211", cls: "옆창+밑창", cf: "0.96", warn: null, z: ["blocks", "grid", "blocks"] },
    { q: "Q-0717", br: "나이키", md: "LD-1000", sn: "IH7330-101", cls: "옆창+밑창", cf: "0.94", warn: ["violet", "같은 군집 12장"], z: ["herring", "wave", "herring"] },
    { q: "Q-0718", br: "프로스펙스", md: "W-33", sn: "PW0WK33-WH", cls: "밑창만", cf: "0.91", warn: null, z: ["dots", "dots", "blocks"] },
  ];

  const conf = (v, warn) => `<span class="ai-mark" style="${warn ? "color:var(--amber)" : ""}">${v}</span>`;

  function ours() {
    const jobRows = JOBS.map(
      (j) => `<tr><td><div class="mono" style="color:var(--fg);line-height:1.3">${j.url}</div><div style="color:var(--dim);font-size:11px;line-height:1.3">${j.scope}</div></td>
        <td>${j.br}</td><td><span class="chip ${j.st[0]}">${j.st[0] === "blue" ? '<span class="dot"></span>' : ""}${j.st[1]}</span></td>
        <td class="r num">${j.got}</td><td class="r num" style="color:${j.wait !== "—" ? "var(--amber)" : "var(--faint)"}">${j.wait}</td><td class="num" style="color:var(--mute)">${j.at}</td></tr>`
    ).join("");

    const qRows = QUEUE.map(
      (r) => `<tr class="${r.sel ? "sel" : ""}">
        <td><span style="display:inline-block;width:12px;height:12px;border-radius:3px;border:1px solid var(--line3)"></span></td>
        <td><span style="display:flex;gap:4px"><span class="imgbox" style="display:block;width:44px;height:30px;padding:2px;background:var(--panel2)">${r.cls === "밑창만" ? "" : SIDE}</span><span class="imgbox" style="display:block;width:22px;height:34px">${sole({ kind: "shoe", zones: r.z })}</span></span></td>
        <td><div style="color:var(--fg);line-height:1.3">${r.br} <span class="mono">${r.md}</span></div><div class="mono" style="color:var(--dim);font-size:11px;line-height:1.3">${r.q} · ${r.sn}</div></td>
        <td><div style="line-height:1.3">${r.cls}</div>${conf(r.cf, Number(r.cf) < 0.7)}</td>
        <td>${r.warn ? `<span class="chip ${r.warn[0]}" style="height:20px;font-size:11px">⚠ ${r.warn[1]}</span>` : `<span style="color:var(--faint)">—</span>`}</td></tr>`
    ).join("");

    return M.shell(
      { active: "수집 검수", tabs: ["사건관리", "신발문양 관리", "수집 검수"], title: "수집 검수", h: 1080 },
      `<div class="page-head">
        <div><div class="crumb">족윤적 · 문양관리 · 수집 검수 +α</div><h3>수집 검수</h3><p>인터넷에서 모은 신발 사진을 AI가 옆창·밑창으로 나누고 브랜드·모델을 읽어 둡니다. 감정관이 확인하고 승인하면 신발 DB에 들어갑니다.</p></div>
        <div style="display:flex;gap:8px">
          <button class="btn ghost">검수 기준 보기</button>
          <button class="btn pri pinbox" data-role="admin">＋ 수집 작업 추가 ${apin(8, "better")}</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:12px;margin-bottom:12px">
        <div class="panel tc pinbox">
          ${apin(1, "plus")}
          <div class="panel-h"><span class="lbl">CRAWL JOBS</span><span class="t">수집 작업 5개</span><span class="r"><span style="color:var(--dim);font-size:12px">이번 주 수집 1,414장 · 검수 대기 139</span></span></div>
          <table class="grid"><thead><tr><th>출처 URL · 범위</th><th>브랜드</th><th>상태</th><th class="r">수집</th><th class="r">검수 대기</th><th>마지막 실행</th></tr></thead><tbody>${jobRows}</tbody></table>
        </div>

        <div class="panel pinbox">
          ${apin(6, "plus")}
          <div class="panel-h"><span class="lbl">IMPORT</span><span class="t">반입 절차 (외부망 → 내부망)</span></div>
          <div class="panel-b" style="display:grid;gap:8px;font-size:12px">
            ${[
              ["외부망", "수집 서버가 상품 사진·정보를 모음", "지금은 인터넷 PC에서 사람이 검색"],
              ["망연계", "일방향 전송으로 내부망에 반입", "파일 형식·악성코드 검사"],
              ["내부망", "이 화면의 검수 대기열에 쌓임", "원본은 따로 보관"],
              ["승인", "신발 DB에 반영 → 신발문양 관리", "수집장소(상호) = 인터넷수집"],
            ].map((s, i) => `<div style="display:grid;grid-template-columns:22px minmax(0,1fr);gap:8px;align-items:start">
                <span style="display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:var(--blue-bg);color:var(--blue);font:700 11px var(--font-mono)">${i + 1}</span>
                <span><b style="color:var(--fg)">${s[0]}</b> <span style="color:var(--fg2)">${s[1]}</span><br><span style="color:var(--dim);font-size:11.5px">${s[2]}</span></span></div>`).join("")}
            <span class="chip amber" style="justify-self:start">확정 필요: 반입 주기 · 담당 부서</span>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:600px minmax(0,1fr);gap:12px;align-items:start">
        <div class="panel tc">
          <div class="panel-h"><span class="lbl">REVIEW QUEUE</span><span class="t">검수 대기 <span class="num">139</span></span>
            <span class="r"><span class="chip blue">전체 139</span><span class="chip amber">중복 의심 7</span><span class="chip violet">라벨 오기입 3</span><span class="chip">분류 확인 5</span></span></div>
          <table class="grid"><thead><tr><th></th><th>사진</th><th>브랜드 · 모델 / 일련번호</th><th>자동 분류 ${pin(2, "plus")}</th><th>경고</th></tr></thead><tbody>${qRows}</tbody></table>
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;color:var(--mute);font-size:12px">
            <span class="num">139 중 1 – 7</span>
            <span style="display:flex;gap:6px" data-role="analyst admin"><button class="btn sm ok">경고 없는 것 모두 승인</button></span>
          </div>
        </div>

        <div class="panel">
          <div class="panel-h"><span class="lbl">REVIEW</span><span class="t mono">Q-0712</span><span class="chip amber">⚠ 중복 의심</span>
            <span class="r"><span class="mono" style="color:var(--dim);font-size:11px">nike.com/kr · 07-24 06:12 수집</span></span></div>
          <div class="panel-b" style="display:grid;gap:12px">
            <div style="display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:8px">
              <div style="display:grid;gap:4px"><span class="imgbox" style="height:120px;display:grid;place-items:center;padding:14px;background:var(--panel2)">${SIDE}</span><span style="display:flex;gap:6px;align-items:center;font-size:12px">옆창 ${conf("0.99")}</span></div>
              <div style="display:grid;gap:4px"><span class="imgbox" style="height:120px">${sole({ kind: "shoe", zones: ["herring", "herring", "herring"] })}</span><span style="display:flex;gap:6px;align-items:center;font-size:12px">밑창 ${conf("0.97")}</span></div>
              <div style="display:grid;gap:4px"><span class="imgbox" style="height:120px;display:grid;place-items:center;color:var(--faint);font-size:11px;background:var(--panel2)">상품 상세 사진 3장</span><span style="display:flex;gap:6px;align-items:center;font-size:12px;color:var(--dim)">기타 → 제외</span></div>
            </div>

            <div class="pinbox">
              ${apin(3, "plus", true)}
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><b style="font-size:13px">읽어 낸 정보</b><span class="ai-mark">● AI 파싱 · 숫자는 신뢰도</span><span style="margin-left:auto;color:var(--dim);font-size:11px">SCAS 기본정보 칸으로 그대로 들어감</span></div>
              <div class="form">
                <div class="l req">상표명</div><div class="v">나이키 ${conf("0.98")}</div>
                <div class="l">제조사</div><div class="v">(유)나이키코리아 <span style="color:var(--dim);font-size:11px">FT002</span></div>
                <div class="l">모델</div><div class="v mono">LD-1000 ${conf("0.91")}</div>
                <div class="l">일련번호</div><div class="v mono">IH7330-020 ${conf("0.95")}</div>
                <div class="l req">신발종류</div><div class="v">운동화 / 운동화 ${conf("0.86")}</div>
                <div class="l">성별</div><div class="v">혼용 ${conf("0.62", true)}</div>
                <div class="l">수집년도</div><div class="v num">2025년 7월</div>
                <div class="l req">수집장소(상호)</div><div class="v pinbox"><span class="chip">인터넷수집</span> ${pin(7, "keep")}</div>
                <div class="l">수집장소(주소)</div><div class="v span3 mono" style="color:var(--mute);font-size:11.5px">nike.com/kr/t/ld-1000-IH7330-020 <span style="font-family:var(--font-ui);color:var(--dim)">(출처 URL을 자동으로 적음)</span></div>
              </div>
            </div>

            <div class="pinbox" style="display:grid;gap:8px">
              ${apin(4, "plus")}
              <div style="padding:9px 11px;border:1px solid color-mix(in srgb,var(--amber) 35%,var(--panel));border-radius:8px;background:var(--amber-bg);font-size:12px;line-height:1.5">
                <b style="color:var(--amber)">중복 의심</b> <span style="color:var(--fg2)">— 등록된 신발 <span class="mono">305655</span>와 밑창 유사도 <b class="num">96%</b>, 상표·모델번호 같음. 같은 신발이면 사진만 추가하세요.</span>
                <div style="display:flex;gap:6px;margin-top:6px"><button class="btn sm">305655 열기</button><button class="btn sm" data-role="analyst admin">사진만 305655에 추가</button></div>
              </div>
              <div style="padding:9px 11px;border:1px solid color-mix(in srgb,var(--violet) 35%,var(--panel));border-radius:8px;background:var(--violet-bg);font-size:12px;line-height:1.5">
                <b style="color:var(--violet)">라벨 군집</b> <span style="color:var(--fg2)">— 같은 밑창으로 묶인 12장 중 2장이 상표 「나이키코리아」로 적혀 있습니다. 「나이키」로 맞출까요?</span>
                <div style="display:flex;gap:6px;margin-top:6px"><button class="btn sm" data-role="analyst admin">12장 한꺼번에 맞추기</button><button class="btn sm ghost">군집 보기</button></div>
              </div>
            </div>

            <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px dashed var(--line3);border-radius:8px;font-size:12px;color:var(--mute)">
              <span class="ai-mark">● 문양 AI 추천</span>${picon("n32_04", "sm ai")}${picon("n32_04", "sm ai")}${picon("s10c", "sm ai")}
              <span>승인하면 신발문양 관리의 「AI 추천 대기」로 넘어갑니다</span>
            </div>

            <div class="pinbox" style="display:flex;align-items:center;gap:8px;padding-top:4px" data-role="analyst admin">
              ${apin(5, "better", true)}
              <button class="btn danger">반려</button>
              <span class="inp" style="width:170px">사유: 밑창 사진 없음<span class="caret">▾</span></span>
              <button class="btn" style="margin-left:auto">보류</button>
              <button class="btn ok">✓ 승인 → 신발 DB 반영</button>
            </div>
            <span class="chip" data-role="investigator verifier" style="justify-self:start">수사관·검증자: 보기 전용 — 검수·승인은 감정관</span>
          </div>
        </div>
      </div>`
    );
  }

  M.add({
    id: "s11",
    code: "S11",
    group: "문양관리",
    title: "수집 검수",
    plus: true,
    refs: [{ t: "인터넷 PC 수집 흐름", v: "5616 07:30–13:40" }, { t: "사업계획서", v: "p12" }, { t: "발표", v: "s11" }],
    lead: "SCAS에는 없는 새 화면입니다. 지금은 인터넷 PC에서 사진을 찾아 그림판으로 다듬은 뒤 SCAS에 한 칸씩 손으로 적습니다. 수집 서버가 사진과 상품 정보를 모아 오면, 감정관은 이 화면에서 확인하고 승인만 합니다.",
    ours,
    notes: [
      { n: 1, kind: "plus", title: "수집 작업(출처 URL 크롤링)", text: "브랜드 공식 몰 주소를 등록해 두면 정해진 시각에 상품 사진과 정보를 모아 옵니다. 작업마다 진행률·수집 수·검수 대기 수를 보여 주고, 사이트 구조가 바뀌어 실패하면 빨간 칩으로 알립니다.", src: "사업계획서 p12 · 발표 s11" },
      { n: 2, kind: "plus", title: "옆창·밑창 자동 분류", text: "상품 사진 여러 장 중 옆모습(옆창)과 밑창을 AI가 골라내고, 그 밖의 사진은 제외합니다. 신뢰도가 낮으면(예: 0.58) 「분류 확인」으로 따로 모읍니다.", src: "사업계획서 p12" },
      { n: 3, kind: "plus", title: "브랜드·모델·일련번호 자동 읽기", text: "상품 페이지에서 상표명·모델·일련번호·신발종류·성별을 읽어 SCAS 기본정보 칸 이름 그대로 채웁니다. 신뢰도가 낮은 칸(성별 0.62)은 노란색이라 그 칸만 보면 됩니다. 제조사는 기초코드관리(S12)의 코드로 맞춥니다.", src: "사업계획서 p12 메타데이터 파싱" },
      { n: 4, kind: "plus", title: "중복·라벨 오기입 경고", text: "이미 등록된 신발과 밑창이 거의 같으면 「중복 의심」으로 알려 사진만 붙이게 합니다. 같은 밑창끼리 묶었을 때 상표가 다르게 적힌 건은 「라벨 군집」으로 한꺼번에 바로잡습니다.", src: "사업계획서 p12 라벨 오기입 정제(군집화)" },
      { n: 5, kind: "better", title: "승인 한 번으로 신발 DB 반영", text: "지금은 인터넷 PC에서 Bing 검색 → nike.com 상품 페이지 → 그림판 3D로 사진 편집 → SCAS에 손으로 등록하는 이중 작업입니다. 이 화면에서는 「승인」이면 신발 DB에 들어가고, 「반려」는 사유를 남깁니다.", src: "5616 07:30–13:40 오른쪽 모니터" },
      { n: 6, kind: "plus", title: "반입 절차(외부망 → 내부망)", text: "수집은 외부망 서버에서, 검수와 등록은 내부망에서 합니다. 그 사이는 일방향 전송과 파일 검사를 거칩니다. 반입 주기와 담당 부서는 아직 정하지 않았습니다(열린 질문).", src: "열린 질문: 인터넷 수집 PC" },
      { n: 7, kind: "keep", title: "수집장소(상호) = 인터넷수집 그대로", text: "SCAS에서 쓰던 값 「인터넷수집」을 자동으로 넣고, 수집장소(주소) 칸에는 출처 URL을 적어 나중에 어디서 왔는지 되짚을 수 있게 합니다.", src: "5614 S1 수집장소(상호)*" },
      { n: 8, kind: "better", title: "보는 사람에 따라", text: "수집 작업(출처 URL) 추가는 관리자만, 검수·승인·반려는 감정관과 관리자만 합니다. 수사관·검증자는 메뉴에 없고, 주소로 들어와도 「보기 전용」입니다." },
    ],
  });
})();
