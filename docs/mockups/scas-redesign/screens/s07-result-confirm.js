/* S07 검색결과 확인 — SCAS 「검색결과 확인」 레이어 팝업(S12) + 알림(S10)
   (IMG_5613 13:46–14:22, 17:35, 26:22, 29:37) */
(function () {
  const { pin, apin, sole } = M;

  /* 이미지 _1 의 검색이력. 결과수 = 확인대상 수 / 전체 후보 수 (SCAS 형식 그대로) */
  const HIST = [
    { no: "572355", how: "현장문양검색", st: "확인대상선정", cnt: "1/2355", at: "2025-07-23 09:42:14" },
    { no: "572414", how: "현장문양검색", st: "검색", cnt: "0/869", at: "2025-07-24 17:29:41" },
    { no: "572420", how: "하이브리드검색", st: "확인대상선정", cnt: "2/500", at: "2025-07-24 17:40:05", ai: true },
  ];
  /* 이력을 합친 확인대상. from = 이 신발을 찾은 검색번호들 */
  const CONF = [
    { no: "305659", z: ["herring", "grid", "tri"], from: ["572355", "572420"], rank: "1위 · 1위", sc: 87, ai: "", ex: false },
    { no: "301122", z: ["wave", "grid", "blocks"], from: ["572420"], rank: "2위", sc: 69, ai: "AI 리랭킹 14위 → 2위", ex: false },
    { no: "288410", z: ["herring", "grid", "lines"], from: ["572420"], rank: "5위", sc: 61, ai: "AI 리랭킹 31위 → 5위", ex: true },
  ];

  const stChip = (s) => (s === "확인대상선정" ? `<span class="chip blue" style="height:19px;font-size:10.5px">${s}</span>` : s === "결과확인완료" ? `<span class="chip green" style="height:19px;font-size:10.5px">${s}</span>` : `<span class="chip" style="height:19px;font-size:10.5px">${s}</span>`);

  function ours() {
    const hist = HIST.map(
      (h, i) => `<tr><td>☑</td><td class="mono" style="color:var(--fg)">${h.no}</td>
        <td>${h.how}${h.ai ? ` <span class="ai-mark">AI</span>` : ""}</td><td>${stChip(h.st)}</td>
        <td class="mono">${h.cnt}</td><td class="num" style="color:var(--mute)">${h.at}</td></tr>`
    ).join("");

    const cards = CONF.map(
      (c) => `<div style="display:grid;grid-template-columns:62px minmax(0,1fr);gap:8px;padding:8px;border:1px solid ${c.ex ? "var(--line2)" : "var(--line3)"};border-radius:10px;background:var(--panel2);${c.ex ? "opacity:.5" : ""}">
        <span class="imgbox" style="display:block;height:92px">${sole({ kind: "shoe", zones: c.z })}</span>
        <div style="display:grid;gap:3px;align-content:start;font-size:11.5px;min-width:0">
          <div style="display:flex;justify-content:space-between;align-items:baseline"><b class="mono" style="font-size:12.5px;color:var(--fg);${c.ex ? "text-decoration:line-through" : ""}">${c.no}</b><span class="mono" style="color:var(--teal)">${c.sc}%</span></div>
          <div style="color:var(--mute)">찾은 검색 ${c.from.map((f) => `<span class="mono" style="color:var(--fg2)">${f}</span>`).join(" · ")}</div>
          <div style="color:var(--dim)">순위 ${c.rank}</div>
          ${c.ai ? `<span class="chip teal" style="height:18px;font-size:10px;justify-self:start">${c.ai}</span>` : `<span style="height:18px"></span>`}
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:2px"><span style="color:var(--blue)">정밀 대조 ↗</span><span style="color:${c.ex ? "var(--amber)" : "var(--mute)"}">${c.ex ? "☑" : "☐"} 제외</span></div>
        </div></div>`
    ).join("");

    const verdict = (on, why, brand) => `<div style="display:grid;gap:8px;align-content:start">
        <div class="crumb">판정</div>
        <div class="radio" style="font-size:13px">${["발견", "불발견", "감정불능"].map((v) => `<span class="${v === on ? "on" : ""}">${v}</span>`).join("")}</div>
        ${brand ? `<div><div class="crumb" style="margin-bottom:4px">발견상표</div><span class="inp w100">${brand}</span></div>` : ""}
        <div><div class="crumb" style="margin-bottom:4px">판정 사유 <span style="color:var(--red)">*</span></div>
          <div class="inp w100" style="height:auto;min-height:70px;align-items:flex-start;padding:6px 8px;white-space:normal;line-height:1.5">${why}</div></div>`;

    return M.shell(
      { active: "사건관리", tabs: ["사건관리", "검색결과 확인", "정밀 대조", "감정서작성"], tabOn: "검색결과 확인", title: "검색결과 확인", h: 1300 },
      `<div class="page-head">
        <div><div class="crumb">족윤적 · 문양검색 · 검색결과 확인</div><h3>검색결과 확인 <span class="chip blue mono" style="vertical-align:middle">00001-25-0646</span></h3>
          <p>이미지마다 검색이력과 확인대상을 보고 발견 / 불발견 / 감정불능을 정합니다. 팝업이 아니라 탭 하나짜리 화면입니다.</p></div>
        <div style="display:flex;gap:6px"><button class="btn">사건 열기</button><button class="btn">엑셀</button></div>
      </div>

      <div class="panel pinbox" style="margin-bottom:12px">${apin(1, "keep", true)}
        <div class="panel-h"><span class="lbl">CASE</span><span class="t">사건 요약</span><span class="r"><span class="chip red" style="height:19px;font-size:10.5px">용의자 있음</span></span></div>
        <div class="form" style="grid-template-columns:90px minmax(0,1fr) 90px minmax(0,1fr) 90px minmax(0,1fr);border-top:0">
          <div class="l">감정번호</div><div class="v mono">00001-25-0646</div>
          <div class="l">문서번호</div><div class="v mono">SCAS수사부-2944</div>
          <div class="l">범죄명</div><div class="v">주거침입</div>
          <div class="l">의뢰관서</div><div class="v">대구청 2025-03321</div>
          <div class="l">용의자유무</div><div class="v">유</div>
          <div class="l">범행장소</div><div class="v">단독주택 주방</div>
          <div class="l">시작</div><div class="v num">2025-07-19 02:10</div>
          <div class="l">종료</div><div class="v num">2025-07-19 04:30</div>
          <div class="l">범행주소</div><div class="v">대구 수성구 ○○동 [주소 가림]</div>
          <div class="l">사건개요</div><div class="v" style="grid-column:span 5;color:var(--mute)">피의자가 주방 창문으로 침입하여 현금을 훔쳐 달아난 사건. 주방 바닥·현관에서 족적 3점 채취(전사판채취법).</div>
        </div>
      </div>

      <div class="panel tc" style="margin-bottom:12px">
        <div class="panel-h pinbox"><span class="lbl">IMAGE</span><span class="t mono">00001-25-0646_1</span>
          <span style="color:var(--mute);font-size:12px">☑ 전체선택</span>
          <span style="color:var(--mute);font-size:12px">검색방법</span><span class="inp" style="width:130px">전체<span class="caret">▾</span></span>
          <span class="r"><span class="chip green">판정 입력됨 · 발견</span></span></div>
        <div class="panel-b" style="display:grid;grid-template-columns:110px minmax(0,1fr) 300px;gap:14px">
          <div style="display:grid;gap:6px;align-content:start">
            <span class="imgbox" style="display:block;height:160px">${sole({ kind: "scene", zones: ["herring", "grid", "blocks"], cut: true })}<span class="cap">_1</span></span>
            <span style="color:var(--dim);font-size:11px">주방 바닥</span>
          </div>
          <div style="display:grid;gap:10px;align-content:start;min-width:0">
            <div class="pinbox">${apin(2, "keep")}
              <div class="crumb" style="margin-bottom:5px">검색이력</div>
              <table class="grid"><thead><tr><th>☑</th><th>검색번호</th><th>검색방법</th><th>진행상태</th><th>결과수</th><th>검색일</th></tr></thead><tbody>${hist}</tbody></table>
              <div style="margin-top:4px;color:var(--dim);font-size:11px">결과수 = 확인대상 수 / 전체 후보 수</div>
            </div>
            <div class="pinbox">${apin(3, "better")}
              <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:6px"><span class="crumb">확인대상 · 이력 통합</span>
                <span style="color:var(--mute);font-size:11.5px">3건(제외 1) — 같은 신발이 여러 검색에서 나오면 한 장으로 합치고 「찾은 검색」을 적습니다</span>
                <span style="margin-left:auto;display:flex;gap:6px">${pin(4, "keep")}${pin(5, "plus")}</span></div>
              <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">${cards}</div>
              <div style="margin-top:6px;color:var(--dim);font-size:11px">제외한 후보도 지우지 않고 흐리게 남깁니다 · 제외 사유: 「하 부위 블록 문양 다름」</div>
            </div>
          </div>
          <div class="pinbox" style="padding-left:14px;border-left:1px solid var(--line2)">${apin(6, "better")}
            ${verdict("발견", "상·중 부위 헤링본·격자 문양과 각도·간격이 일치(종합 신뢰도 87%, S06). 하 부위는 현장 족적 일부 소실로 판단 제외.", "○○스포츠 운동화")}
            <div style="display:flex;gap:6px;margin-top:2px">
              <button class="btn sm ai" data-role="analyst admin">S06 근거 불러오기</button>
              <span style="margin-left:auto;color:var(--dim);font-size:11px;align-self:center">74자</span>
            </div>
            </div>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-bottom:12px">
        <div class="panel">
          <div class="panel-h"><span class="lbl">IMAGE</span><span class="t mono">00001-25-0646_2</span><span class="r"><span class="chip">불발견</span></span></div>
          <div class="panel-b" style="display:grid;grid-template-columns:64px minmax(0,1fr);gap:12px">
            <span class="imgbox" style="display:block;height:92px">${sole({ kind: "scene", zones: ["dots", "grid", "lines"] })}</span>
            <div style="display:grid;gap:5px;font-size:12px;color:var(--mute)">
              <div><span class="mono" style="color:var(--fg2)">572356</span> 현장문양검색 · ${stChip("검색")} · <span class="mono">0/1204</span></div>
              <div>확인대상 없음</div>
              <div>판정 사유: <span style="color:var(--fg2)">후보 1,204건 중 상·중 부위가 함께 맞는 신발 없음</span></div>
            </div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-h"><span class="lbl">IMAGE</span><span class="t mono">00001-25-0646_3</span><span class="r"><span class="chip amber">감정불능</span></span></div>
          <div class="panel-b" style="display:grid;grid-template-columns:64px minmax(0,1fr);gap:12px">
            <span class="imgbox" style="display:block;height:92px">${sole({ kind: "scene", zones: ["grid", "grid", "lines"], cut: true })}</span>
            <div style="display:grid;gap:5px;font-size:12px;color:var(--mute)">
              <div>검색 안 함</div>
              <div>확인대상 없음</div>
              <div>판정 사유: <span style="color:var(--fg2)">족적의 약 30%만 남아 문양 판독 불가(현관 매트 위)</span></div>
            </div>
          </div>
        </div>
      </div>

      <div class="panel pinbox" style="border-color:#4d3a12">${apin(7, "better", true)}
        <div class="panel-b" style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center">
          <div style="font-size:12.5px;color:var(--fg2)">이미지 3장 판정 완료 <b>3 / 3</b> · 발견 1 · 불발견 1 · 감정불능 1 · 확인대상 2건(제외 1건 기록 유지)</div>
          <div style="display:flex;gap:6px">
            <button class="btn" data-role="analyst admin">임시 저장</button>
            <button class="btn pri" data-role="analyst admin">결과확인완료 → 검증요청</button>
            <span class="chip" data-role="verifier">읽기 전용 · 승인은 S08 검증·결재에서</span>
            <span class="chip" data-role="investigator">판정 결과는 결재완료 뒤 공개</span>
          </div>
        </div>
        <div data-role="analyst admin" style="margin:0 14px 14px;padding:12px 14px;border:1px dashed #4d3a12;border-radius:10px;background:var(--amber-bg)">
          <div style="font-weight:600;color:var(--amber);margin-bottom:6px">한 번에 확인해 주세요</div>
          <ol style="margin:0;padding-left:18px;color:var(--fg2);font-size:12.5px;line-height:1.7">
            <li>확인대상 2건을 저장합니다 (305659 · 301122, 제외 288410은 기록으로 남김)</li>
            <li>이미지 3장의 판정과 판정 사유를 「결과확인완료」로 잠급니다</li>
            <li>검증요청을 보냅니다 → 1차 검증자 <b>최○○ 경감(팀장)</b></li>
          </ol>
          <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:8px"><button class="btn sm">돌아가기</button><button class="btn sm ok">확정</button></div>
        </div>
      </div>
      <div class="pinbox" style="margin-top:10px;display:flex;gap:8px;align-items:center;color:var(--mute);font-size:12px">${pin(8, "better")}
        <span>보는 사람을 바꾸면 판정 입력·완료 버튼은 감정관·관리자에게만 보이고, 검증자에게는 읽기 전용, 수사관에게는 공개 시점 안내만 보입니다.</span>
      </div>`
    );
  }

  function scas() {
    const bgRows = Array.from({ length: 14 }, (_, i) => `<tr><td>${i + 15}</td><td><span class="ph" style="display:block;width:16px;height:20px"></span></td><td>00001-25-06${35 - i}</td><td>SCAS수사부-${692 + i * 51}</td><td>절도</td><td>경찰청 범죄분석과</td></tr>`).join("");
    const cand = (z) => `<div style="display:grid;gap:2px;justify-items:center"><span style="display:block;width:38px;height:58px">${sole({ kind: "shoe", zones: z, bg: "#ffffff" })}</span><span>☐ 제외</span></div>`;
    const block = (img, rows, cands, on) => `<div style="display:grid;grid-template-columns:90px minmax(0,1fr) 280px;gap:8px;padding:8px;border-bottom:1px solid var(--s-line)">
        <div><div style="font-size:11px">${img}</div><div class="ph" style="height:96px;margin-top:4px">현장 사진</div></div>
        <div><div style="display:flex;gap:8px;align-items:center;margin-bottom:4px"><span>☐ 전체선택</span><span style="margin-left:auto">검색방법 <span class="sbtn" style="background:#e3f6ea">전체 ▾</span></span></div>
          <table><thead><tr><th>☐</th><th>검색번호</th><th>검색방법</th><th>진행상태</th><th>결과수</th><th>검색일</th></tr></thead><tbody>${rows}</tbody></table></div>
        <div><div style="margin-bottom:4px">${["발견", "불발견", "감정불능"].map((v) => (v === on ? `◉${v}` : `○${v}`)).join(" ")} <span class="sbtn n" style="float:right">결과확인완료</span></div>
          <div class="box" style="display:flex;gap:6px;padding:6px;min-height:80px">${cands}</div></div>
      </div>`;
    return M.scasShell(
      { treeOn: "사건관리", h: 760 },
      `<div style="min-height:690px"><div class="bar">사건관리 목록</div>
      <div class="box"><table><thead><tr><th>순번</th><th>이미지</th><th>감정번호</th><th>문서번호</th><th>사건명</th><th>처리관서</th></tr></thead><tbody>${bgRows}</tbody></table></div></div>
      <div class="dim"></div>
      <div class="modal" style="left:120px;top:30px;width:900px">
        <div class="bar">검색결과 확인 <span>×</span></div>
        <div style="padding:6px">
          <table><tbody>
            <tr><td class="lbl">감정번호</td><td>00001-25-0646</td><td class="lbl">범죄명</td><td>주거침입</td><td class="lbl">의뢰관서</td><td>대구청</td><td class="lbl">범행장소</td><td>주방</td></tr>
            <tr><td class="lbl">문서번호</td><td>SCAS수사부-2944</td><td class="lbl">용의자유무</td><td>유</td><td class="lbl">시작</td><td>2025-07-19 02:10</td><td class="lbl">종료</td><td>2025-07-19 04:30</td></tr>
            <tr><td class="lbl">범행주소</td><td colspan="7">대구 수성구 ○○동 [주소]</td></tr>
            <tr><td class="lbl">사건개요</td><td colspan="7" style="white-space:normal;color:#666">피의자가 주방 창문으로 침입하여 …</td></tr>
          </tbody></table>
        </div>
        <div class="bar">검색이력</div>
        ${block("00001-25-0646_1", `<tr><td>☐</td><td>572355</td><td>현장문양검색</td><td>확인대상선정</td><td>1/2355</td><td>2025-07-23 09:42:14</td></tr><tr><td>☐</td><td>572414</td><td>현장문양검색</td><td>검색</td><td>0/869</td><td>2025-07-24 17:29:41</td></tr>`, cand(["herring", "grid", "tri"]), "발견")}
        ${block("00001-25-0646_2", `<tr><td>☐</td><td>572356</td><td>현장문양검색</td><td>검색</td><td>0/1204</td><td>2025-07-23 09:51:02</td></tr>`, "", "불발견")}
        <div style="height:40px"></div>
      </div>
      <div class="modal" style="left:430px;top:330px;width:280px">
        <div class="bar">알림 <span>×</span></div>
        <div style="padding:14px;text-align:center">❔ 확인대상을 저장하시겠습니까?<div style="margin-top:10px"><span class="sbtn b">예</span> <span class="sbtn">아니오</span></div></div>
      </div>
      ${M.pain(760, 440, "<b>단계마다 알림</b> — 확인대상 저장·결과확인완료 때마다 예/아니오, 그다음 목록으로 돌아가 「검증요청」을 따로 누름 (5613 17:35, 19:52)", 260)}
      ${M.pain(140, 470, "<b>어느 검색이 찾은 후보인지 안 보임</b> — 이력 행(4/799, 4/804)과 후보 상자가 따로 놀아 이력 간 비교 불가 (5613 29:37)", 280)}
      ${M.pain(1030, 200, "<b>판정 이유 칸 없음</b> — 발견/불발견/감정불능 라디오 3개뿐 (5613 13:46–14:22)", 180)}`
    );
  }

  M.add({
    id: "s07",
    code: "S07",
    group: "문양검색",
    title: "검색결과 확인",
    refs: [
      { t: "SCAS 검색결과 확인", v: "5613 13:46 · 17:35 · 29:37" },
      { t: "플랫폼 개선 사항", v: "p1–5" },
      { t: "사업계획서", v: "p25 · p36" },
    ],
    lead: "SCAS 「검색결과 확인」의 사건 요약 라벨, 이미지별 블록, 검색이력 표, 확인대상 썸네일과 「제외」, 발견/불발견/감정불능 라디오를 그대로 둡니다. 여러 검색의 확인대상을 한 줄로 합치고, 판정 사유를 남기게 하고, 결과확인완료와 검증요청을 한 번의 확인으로 묶습니다.",
    scas,
    ours,
    notes: [
      { n: 1, kind: "keep", title: "사건 요약 라벨 그대로", text: "감정번호·문서번호·범죄명·범행주소·용의자유무·의뢰관서·시작·종료·범행장소·사건개요 10개를 같은 이름으로 보여 줍니다. 주소는 가려 표시합니다.", src: "5613 13:46" },
      { n: 2, kind: "keep", title: "이미지별 블록과 검색이력 표", text: "이미지(_1, _2, _3)마다 블록이 반복되고, ☐·검색번호·검색방법·진행상태·결과수·검색일 열과 「전체선택」「검색방법」 드롭다운이 그대로입니다. 결과수는 SCAS처럼 「확인대상 수 / 전체 후보 수」입니다.", src: "5613 13:46 · 26:22" },
      { n: 3, kind: "better", title: "확인대상 이력 통합(이력 간 비교)", text: "검색을 여러 번 해도 확인대상을 한 줄로 모으고, 카드마다 「찾은 검색」 번호를 적습니다. 같은 신발이 두 검색에서 다 나오면 근거가 더 단단하다는 뜻이 바로 보입니다.", src: "플랫폼 개선 사항 p1–5 · 5613 29:37" },
      { n: 4, kind: "keep", title: "「제외」 체크 유지, 기록은 남김", text: "SCAS의 ☐제외를 그대로 두고, 제외한 후보는 흐리게 남기며 제외 사유를 함께 적습니다. 검증자가 왜 뺐는지 볼 수 있습니다.", src: "5613 29:37" },
      { n: 5, kind: "plus", title: "AI 리랭킹 도움 표시", text: "하이브리드검색(문양 + 이미지)에서 AI 리랭킹(후보 순서 다시 매기기)으로 순위가 올라온 후보에는 「AI 리랭킹 14위 → 2위」처럼 청록 표시를 붙입니다. 사람이 고른 것과 AI가 도운 것을 구분합니다.", src: "BP p3 · p12 · 발표 s10" },
      { n: 6, kind: "better", title: "판정 + 판정 사유(필수)", text: "발견 / 불발견 / 감정불능 라디오는 그대로, 판정 사유 칸을 필수로 더했습니다. 「S06 근거 불러오기」로 정밀 대조 지표·부위 근거를 끌어오고, 발견이면 감정서 「발견상표」 칸도 여기서 채웁니다.", src: "BP p25 · p36" },
      { n: 7, kind: "better", title: "결과확인완료 → 검증요청 한 번에", text: "SCAS는 확인대상 저장·결과확인완료 알림을 따로 띄우고, 목록으로 돌아가 「검증요청」을 또 눌렀습니다. 개선안은 버튼 하나를 누르면 화면 안에 할 일 3가지를 요약해 보여 주고 「확정」 한 번으로 끝냅니다.", src: "5613 17:35 · 19:52" },
      { n: 8, kind: "better", title: "보는 사람에 따라", text: "감정관·관리자만 판정 입력·임시 저장·완료 버튼을 봅니다. 검증자는 같은 화면을 읽기 전용으로 보고 승인은 S08에서 하며, 수사관에게는 결재완료 뒤 공개된다는 안내만 보입니다." },
    ],
  });
})();
