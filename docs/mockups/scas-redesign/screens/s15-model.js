/* S15 모델 관리(+α) — SCAS에 없는 새 화면(SCAS 화면 생략). MLOps: 모델·데이터셋 버전관리, 재학습, 롤백,
   사건 단위 운영로그, Human-in-the-loop 피드백. 근거: 사업계획서 p14 · 발표 s13, 성능 목표(이미지 분류 92/95%, Top-100 55/60%, 성능 유지율 95/100%),
   기준 성능 BP p5(Top-10 51.43 · Top-50 64.29 · Top-100 78.57, 문양 추출 F1 79.52). 운영 버전 값 중 BP에 없는 숫자는 모두 예시. */
(function () {
  const { pin, apin, picon } = M;

  const MODELS = [
    { nm: "문양 추출", v: "v2.3", prev: "v2.2", next: "v2.4", m: [["F1", "79.52"], ["이미지 분류 정확도", "92.4%"]], src: "F1은 BP p5", weak: "윤곽 · 반복 무늬 · 가격표 가림" },
    { nm: "검색", v: "v3.1", prev: "v3.0", next: "v3.2", m: [["Top-10", "51.43%"], ["Top-50", "64.29%"], ["Top-100", "78.57%"]], src: "BP p5 시험셋", sel: true },
    { nm: "리랭킹", v: "v1.2", prev: "v1.1", next: null, m: [["방식", "멀티모달 LLM 하이브리드"], ["Top-10 향상", "+4.3%p"]], src: "향상 폭은 예시" },
    { nm: "정밀 대조", v: "v1.0", prev: null, next: "v1.1", m: [["지표", "Inlier·NCC·Wasserstein·MI"], ["일치 판정 정확도", "88.0%"]], src: "정확도는 예시" },
  ];

  function ours() {
    const cards = MODELS.map(
      (m) => `<div class="panel ${m.sel ? "tc" : ""}" style="${m.sel ? "border-color:var(--blue2)" : ""}">
        <div class="panel-h"><span class="lbl">MODEL</span><span class="t">${m.nm}</span><span class="r"><span class="chip green"><span class="dot"></span>운영 중</span></span></div>
        <div class="panel-b" style="display:grid;gap:8px">
          <div style="display:flex;align-items:baseline;gap:8px"><span class="mono" style="font-size:24px;color:var(--fg);font-weight:600">${m.v}</span>
            ${m.next ? `<span class="chip amber" style="height:20px;font-size:11px">${m.next} 평가 중</span>` : ""}</div>
          <div style="display:grid;gap:4px">${m.m.map(([k, v]) => `<div style="display:flex;justify-content:space-between;gap:8px;font-size:12px"><span style="color:var(--mute)">${k}</span><span class="${/[0-9]/.test(v) ? "mono" : ""}" style="color:var(--fg2);text-align:right">${v}</span></div>`).join("")}</div>
          ${m.weak ? `<div class="pinbox" style="display:flex;justify-content:space-between;gap:8px;font-size:12px"><span style="color:var(--mute)">약한 곳 ${pin(9, "voice")}</span><span style="color:var(--amber);text-align:right">${m.weak}</span></div>` : ""}
          <div style="display:flex;align-items:center;gap:6px;padding-top:6px;border-top:1px solid var(--line2)">
            <span style="color:var(--dim);font-size:11px">${m.src}</span>
            ${m.prev ? `<button class="btn sm warn" style="margin-left:auto" data-lock="admin">↶ ${m.prev}로 롤백</button>` : `<span style="margin-left:auto;color:var(--faint);font-size:11px">첫 버전</span>`}
          </div>
        </div>
      </div>`
    ).join("");

    const goals = [
      ["이미지 분류 정확도", "92%", "95%", "92.4%"],
      ["Top-100 검색 정확도 (현장 평가셋)", "55%", "60%", "57.1%"],
      ["성능 유지율", "95%", "100%", "98.2%"],
    ]
      .map((g) => `<tr><td style="color:var(--fg)">${g[0]}</td><td class="r num">${g[1]}</td><td class="r num">${g[2]}</td><td class="r mono" style="color:var(--fg)">${g[3]}</td><td><span class="chip green">1차 목표 달성</span></td></tr>`)
      .join("");

    const vers = [
      ["v3.2", "DS-2025.07", "07-23", "52.90", "66.02", "79.61", ["amber", "평가 중"], `<button class="btn sm pri" data-lock="admin">운영 전환</button>`],
      ["v3.1", "DS-2025.06", "06-30", "51.43", "64.29", "78.57", ["green", "운영 중"], `<span style="color:var(--faint)">—</span>`],
      ["v3.0", "DS-2025.05", "05-28", "49.30", "62.10", "77.02", ["", "보관"], `<button class="btn sm warn" data-lock="admin">↶ 롤백</button>`],
      ["v2.9", "DS-2025.04", "04-25", "48.05", "61.37", "76.40", ["", "보관"], `<button class="btn sm warn" data-lock="admin">↶ 롤백</button>`],
    ]
      .map((r) => `<tr class="${r[6][1] === "운영 중" ? "sel" : ""}"><td class="mono" style="color:var(--fg)">${r[0]}</td><td class="mono" style="color:var(--mute)">${r[1]}</td><td class="num" style="color:var(--mute)">${r[2]}</td>
        <td class="r mono">${r[3]}</td><td class="r mono">${r[4]}</td><td class="r mono">${r[5]}</td><td><span class="chip ${r[6][0]}">${r[6][1]}</span></td><td>${r[7]}</td></tr>`)
      .join("");

    const fb = [
      [`<span class="mono" style="color:var(--amber)">14위</span>`, "검색 572414", "확인대상이 AI 결과 14위에 있었음", "검색·리랭킹"],
      [`<span class="mono" style="color:var(--amber)">312위</span>`, "검색 572355", "확인대상이 312위 — 끝까지 넘겨 찾음", "검색·리랭킹"],
      [picon("n32_04", "sm ai") + `<span style="color:var(--dim)">→</span>` + picon("n21_05", "sm sel"), "00001-25-0646_1 · 하 문양", "AI n32_04 → 감정관 n21_05", "문양 추출"],
      [`<span class="mono" style="color:var(--amber)">41%</span>`, "00001-25-0640_1 ↔ 305612", "정밀 대조 41% → 감정관 「발견」", "정밀 대조"],
      [picon("n32_04", "sm ai"), "305657 · 상 문양", "AI 추천 그대로 승인(정답 확인)", "문양 추출"],
    ]
      .map((f) => `<div style="display:grid;grid-template-columns:76px minmax(0,1fr) auto;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid var(--line2);font-size:12px">
        <span style="display:flex;gap:4px;align-items:center">${f[0]}</span>
        <span style="min-width:0"><span class="mono" style="color:var(--fg2);font-size:11.5px">${f[1]}</span><br><span style="color:var(--mute)">${f[2]}</span></span>
        <span class="chip" style="height:20px;font-size:10.5px">${f[3]}</span></div>`)
      .join("");

    const ds = [
      ["DS-2025.07", "104,933", "3,210", "214", "07-22", "v3.2 · v2.4 (평가)"],
      ["DS-2025.06", "104,101", "3,020", "188", "06-27", "v3.1 · v2.3 (운영)"],
      ["DS-2025.05", "103,240", "2,870", "152", "05-26", "v3.0 · v2.2"],
    ]
      .map((d) => `<tr><td class="mono" style="color:var(--fg)">${d[0]}</td><td class="r num">${d[1]}</td><td class="r num">${d[2]}</td><td class="r num" style="color:var(--amber)">${d[3]}</td><td class="num" style="color:var(--mute)">${d[4]}</td><td style="color:var(--mute);font-size:12px">${d[5]}</td></tr>`)
      .join("");

    const caseLog = [
      ["문양 추출", "v2.3", "07-23 09:40", "1.2초", "상 2 · 중 3 · 하 1"],
      ["검색", "v3.1", "07-23 09:42", "1.8초", "검색번호 572355 · 후보 2,355"],
      ["리랭킹", "v1.2", "07-23 09:42", "0.9초", "Top-100 다시 정렬"],
      ["정밀 대조", "v1.0", "07-24 17:31", "2.4초", "305657 종합 신뢰도 87%"],
    ]
      .map((c) => `<tr><td style="color:var(--fg)">${c[0]}</td><td class="mono" style="color:var(--blue)">${c[1]}</td><td class="mono" style="color:var(--mute);font-size:12px">${c[2]}</td><td class="r num">${c[3]}</td><td style="white-space:normal;line-height:1.35;color:var(--fg2);font-size:12px">${c[4]}</td></tr>`)
      .join("");

    return M.shell(
      { active: "모델 관리", tabs: ["사건관리", "사용 기록", "모델 관리"], title: "모델 관리", h: 1290 },
      `<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;padding:9px 12px;border:1px solid color-mix(in srgb,var(--amber) 35%,var(--panel));border-radius:10px;background:var(--amber-bg);color:var(--fg2);font-size:12.5px">
        <b style="color:var(--amber)">관리자 전용 메뉴</b> — 감정관·기술책임자는 사건 화면에서 「이 결과를 낸 모델 버전」만 봅니다.
      </div>
      <div class="page-head">
        <div><div class="crumb">족윤적 · 족윤적관리 · 모델 관리 +α</div><h3>모델 관리</h3><p>AI 모델 4개의 운영 버전과 성능을 봅니다. 감정관이 고친 결과로 다시 학습하고, 문제가 생기면 이전 버전으로 되돌립니다.</p></div>
        <div style="display:flex;gap:8px"><button class="btn">엑셀</button><button class="btn ai" data-lock="admin">● 재학습 시작</button></div>
      </div>

      <div class="pinbox" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:12px">${apin(1, "plus", true)}${cards}</div>

      <div style="display:grid;grid-template-columns:minmax(0,1fr) 420px;gap:12px;margin-bottom:12px;align-items:start">
        <div style="display:grid;gap:12px">
          <div class="panel pinbox">
            ${apin(2, "plus")}
            <div class="panel-h"><span class="lbl">TARGET</span><span class="t">성능 목표 (사업계획서)</span><span class="r"><span style="color:var(--dim);font-size:12px">운영 버전 값은 예시</span></span></div>
            <table class="grid"><thead><tr><th>지표</th><th class="r">1차 목표</th><th class="r">2차 목표</th><th class="r">운영 버전</th><th>상태</th></tr></thead><tbody>${goals}</tbody></table>
          </div>
          <div class="panel tc pinbox">
            ${apin(3, "plus")}
            <div class="panel-h"><span class="lbl">VERSIONS</span><span class="t">버전 이력 · 검색 모델</span><span class="r"><span style="color:var(--dim);font-size:12px">위 카드를 고르면 그 모델의 이력</span></span></div>
            <table class="grid"><thead><tr><th>버전</th><th>데이터셋</th><th>학습일</th><th class="r">Top-10</th><th class="r">Top-50</th><th class="r">Top-100</th><th>상태</th><th>동작</th></tr></thead><tbody>${vers}</tbody></table>
            <div style="padding:8px 14px;color:var(--dim);font-size:11.5px">운영 전환·롤백은 관리자만 하고, 사유와 함께 「사용·감사 기록 › 관리자 행위」에 남습니다. 지난 사건 결과는 바뀌지 않습니다.</div>
          </div>
        </div>

        <div class="panel pinbox">
          ${apin(4, "plus")}
          <div class="panel-h"><span class="lbl">FEEDBACK</span><span class="t">재학습 대기열</span><span class="r"><span class="ai-mark">HUMAN-IN-THE-LOOP</span></span></div>
          <div class="panel-b" style="display:grid;gap:10px">
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;text-align:center">
              ${[["37", "확인대상 정답 순위"], ["214", "고친 문양"], ["12", "발견·불발견 판정"]].map((k) => `<div style="padding:8px 4px;border:1px solid var(--line2);border-radius:8px;background:var(--bg2)"><div class="num" style="font-size:18px;color:var(--fg);font-weight:600">${k[0]}</div><div style="color:var(--dim);font-size:11px">${k[1]}</div></div>`).join("")}
            </div>
            <div class="pinbox" style="display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid var(--line2);border-radius:8px;background:var(--bg2);font-size:12px">
              ${pin(8, "voice")}<span style="color:var(--mute)">확인대상의 AI 순위(중앙값)</span><b class="num" style="color:var(--amber);margin-left:auto">14위</b><span style="color:var(--dim)">→ 목표 10위 안</span>
            </div>
            <div style="display:grid;gap:4px">
              <div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:var(--mute)">재학습 제안 기준</span><span class="num" style="color:var(--fg2)">263 / 500건</span></div>
              <div style="height:6px;border-radius:3px;background:var(--line3)"><div style="width:52.6%;height:100%;border-radius:3px;background:var(--teal)"></div></div>
            </div>
            <div>${fb}</div>
            <div style="display:flex;gap:6px;align-items:center"><span style="color:var(--dim);font-size:11px">잘못 들어온 건은 빼고 학습합니다</span><button class="btn sm" style="margin-left:auto" data-lock="admin">선택 제외</button><button class="btn sm ai" data-lock="admin">재학습 시작</button></div>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">
        <div class="panel pinbox">
          ${apin(5, "plus")}
          <div class="panel-h"><span class="lbl">DATASETS</span><span class="t">데이터셋 버전</span></div>
          <table class="grid"><thead><tr><th>버전</th><th class="r">신발</th><th class="r">현장 족적</th><th class="r">라벨 수정</th><th>만든 날</th><th>쓰는 모델</th></tr></thead><tbody>${ds}</tbody></table>
          <div class="pinbox" style="margin:8px 14px 12px;padding:8px 10px;border:1px dashed var(--line3);border-radius:8px;color:var(--mute);font-size:11.5px;line-height:1.5">
            ${apin(7, "plus")}원본 이미지는 그대로 두고, 학습에는 처리본(이진화·배경 제거)과 비식별 메타데이터만 씁니다. 데이터셋마다 어느 원본에서 나왔는지 목록을 남깁니다.
          </div>
        </div>
        <div class="panel tc pinbox">
          ${apin(6, "plus")}
          <div class="panel-h"><span class="lbl">CASE LOG</span><span class="t">사건 단위 운영로그 · <span class="mono">00001-25-0646</span></span></div>
          <table class="grid"><thead><tr><th>단계</th><th>모델</th><th>시각</th><th class="r">처리 시간</th><th>결과</th></tr></thead><tbody>${caseLog}</tbody></table>
          <div style="padding:8px 14px 12px;color:var(--dim);font-size:11.5px">이 사건 결과를 낸 모델 버전 목록이 감정서(S09)에 함께 남습니다. 나중에 같은 버전으로 다시 돌려 볼 수 있습니다.</div>
        </div>
      </div>
      <div class="pinbox" style="display:inline-flex;gap:8px;align-items:center;margin-top:12px;padding:8px 12px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--mute);font-size:12px">
        ${apin(10, "better")}<span class="chip blue">관리자</span> 재학습·운영 전환·롤백 &nbsp;|&nbsp; <span class="chip">감정관·기술책임자</span> 사건 화면에서 모델 버전만 확인
      </div>`
    );
  }

  M.add({
    id: "s15",
    code: "S15",
    group: "족윤적관리",
    title: "모델 관리",
    plus: true,
    refs: [{ t: "사업계획서 MLOps", v: "p14" }, { t: "발표", v: "s13" }, { t: "사업계획서 성능", v: "p5" }, { t: "인터뷰 결과 비교 시간", v: "5613 21:50 · 28:40", voice: true }],
    lead: "SCAS에는 없는 새 화면입니다. 문양 추출·검색·리랭킹·정밀 대조 모델 4개의 운영 버전과 성능을 한 화면에서 봅니다. 감정관이 고른 확인대상이 AI 결과 몇 위에 있었는지를 주된 신호로 모아 다시 학습하고, 문제가 생기면 이전 버전으로 되돌립니다.",
    fit: {
      area: ["na", "SCAS에 없는 화면 — 현행 police-new 관리자 화면처럼 위 요약 카드 + 아래 표·오른쪽 칸"],
      buttons: ["na", "SCAS 버튼 없음. 새 버튼(재학습 시작 · 운영 전환 · 롤백)은 관리자만"],
      popup: ["na", "창 없음"],
      columns: ["na", "SCAS 표 없음"],
    },
    ours,
    notes: [
      { n: 1, kind: "plus", title: "모델 4개 한눈에", text: "문양 추출·검색·리랭킹(Top-k 후보를 다시 줄 세우는 단계)·정밀 대조 모델마다 운영 버전, 핵심 지표, 평가 중인 다음 버전을 카드로 보여 줍니다. 검색 Top-10/50/100과 문양 추출 F1은 사업계획서 값이고, 나머지 숫자는 예시입니다.", src: "사업계획서 p5, p14 · 발표 s13" },
      { n: 2, kind: "plus", title: "성능 목표와 비교", text: "이미지 분류 92%→95%, Top-100 검색 55%→60%, 성능 유지율 95%→100%(1차→2차 목표)와 지금 운영 버전 값을 나란히 둡니다. 목표 아래로 떨어지면 빨간 칩으로 바뀝니다.", src: "사업계획서 성능 목표" },
      { n: 3, kind: "plus", title: "버전 이력 · 운영 전환 · 롤백", text: "새 버전은 「평가 중」으로 들어와 지표를 확인한 뒤 관리자가 운영으로 바꿉니다. 문제가 생기면 이전 버전으로 바로 되돌리고, 이미 나간 사건 결과는 바뀌지 않습니다.", src: "사업계획서 p14 버전관리·롤백" },
      { n: 4, kind: "plus", title: "재학습 대기열(Human-in-the-loop)", text: "확인대상으로 고른 신발이 AI 결과 몇 위였는지(S05·S07), 감정관이 고친 문양(S10·S04), 발견·불발견 판정이 쌓입니다. 정해진 건수(예: 500건)가 모이면 재학습을 제안하고, 잘못 들어온 건은 빼고 학습합니다.", src: "사업계획서 p14 · 발표 s13 Human-in-the-loop" },
      { n: 5, kind: "plus", title: "데이터셋 버전", text: "학습에 쓴 신발·현장 족적·라벨 수정 건수를 버전으로 묶어, 어느 모델이 어느 데이터로 학습했는지 따라갈 수 있게 합니다.", src: "사업계획서 p14 데이터셋 버전관리" },
      { n: 6, kind: "plus", title: "사건 단위 운영로그", text: "사건 하나에 어느 단계를 어느 모델 버전으로 몇 초에 돌렸는지 남깁니다. 감정서에 그대로 붙어, 법정에서 「어떤 AI로 낸 결과인가」를 설명할 근거가 됩니다.", src: "사업계획서 p14 사건 단위 운영로그" },
      { n: 7, kind: "plus", title: "원본·처리 데이터 분리", text: "학습에는 처리본과 비식별 정보만 쓰고 원본 증거 이미지는 손대지 않습니다.", src: "사업계획서 p16–19 원본·처리 데이터 분리" },
      { n: 8, kind: "voice", title: "핵심 신호 = 정답이 몇 위에 있었나", text: "감정관이 가장 오래 쓰는 시간은 검색 결과 비교입니다. 그래서 재학습의 첫 신호를 「확인대상이 AI 결과 몇 위였나」로 두고, 이 순위를 위로 올리는 것을 목표로 봅니다(목표 10위 안은 예시). 「검색 결과를 이제 비교할 때가 제일 오래 걸리죠. 다 눈으로 봐야 되니까. 어떤 거는 엄청 밑에 있을 수도 있고」.", src: "5613 21:50–22:00" },
      { n: 9, kind: "voice", title: "문양 추출 모델의 약한 곳을 카드에", text: "윤곽, 반스 같은 반복 무늬, 가격표 가림을 약한 곳으로 적어 두고 재학습 때 따로 봅니다. 「얘는 윤곽을 못 잡아요」, 「인공지능은 아예 더 못해」(반복 무늬), 「가격표 그런 것들 때문에 인공지능은 못잡을 수 있겠지」.", src: "5613 04:10 · 28:40 · 5616 00:31" },
      { n: 10, kind: "better", title: "보는 사람에 따라", text: "관리자만 메뉴가 보이고 재학습·운영 전환·롤백 버튼을 누를 수 있습니다. 감정관·기술책임자는 이 화면 대신 사건 화면에서 「이 결과를 낸 모델 버전」만 봅니다(다른 역할로 보면 안내 막대가 뜨고 버튼이 잠김)." },
    ],
  });
})();
