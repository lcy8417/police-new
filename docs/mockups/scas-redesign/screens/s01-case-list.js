/* S01 사건관리 목록 — SCAS 「족윤적 > 사건관리 > 사건관리」 탭 (IMG_5613 02:00, 10:04–11:45, 16:37–17:15) */
(function () {
  const { pin, apin, sole } = M;

  const CASES = [
    { no: "00001-25-0649", doc: "SCAS수사부-871", nm: "주거침입", req: "대구청", occ: "동부서", imgs: 12, sus: "무", reg: "2025-07-24", step: 1, res: "", who: "박○○" },
    { no: "00001-25-0647", doc: "SCAS수사부-2951", nm: "절도", req: "경북청", occ: "포항남부서", imgs: 2, sus: "무", reg: "2025-07-24", step: 2, res: "", who: "박○○" },
    { no: "00001-25-0646", doc: "SCAS수사부-2944", nm: "주거침입", req: "대구청", occ: "수성서", imgs: 3, sus: "유", reg: "2025-07-23", step: 3, res: "발견", who: "박○○" },
    { no: "00001-25-0640", doc: "SCAS수사부-2911", nm: "절도", req: "부산청", occ: "해운대서", imgs: 1, sus: "무", reg: "2025-07-22", step: 4, res: "발견", who: "김○○" },
    { no: "00001-25-0633", doc: "SCAS수사부-2870", nm: "강도", req: "서울청", occ: "강서서", imgs: 4, sus: "무", reg: "2025-07-21", step: 3, res: "불발견", who: "박○○" },
    { no: "00001-25-0621", doc: "SCAS수사부-2802", nm: "기타", req: "경기남부청", occ: "화성동탄서", imgs: 2, sus: "무", reg: "2025-07-18", step: 5, res: "감정불능", who: "김○○" },
    { no: "00001-25-0612", doc: "SCAS수사부-2755", nm: "절도", req: "인천청", occ: "미추홀서", imgs: 2, sus: "유", reg: "2025-07-16", step: 5, res: "발견", who: "박○○" },
  ];
  const STEPS = ["등록", "검색", "확인대상선정", "결과확인완료", "검증요청", "결재완료"];
  const resChip = (r) =>
    r === "발견" ? `<span class="chip green">발견</span>` : r === "불발견" ? `<span class="chip">불발견</span>` : r === "감정불능" ? `<span class="chip amber">감정불능</span>` : `<span style="color:var(--faint)">—</span>`;
  const stepper = (k) => `<div style="display:grid;gap:3px"><span class="stepper" title="${STEPS[k]}">${STEPS.map((_, i) => `<i style="width:12px" class="${i < k ? "done" : i === k ? "now" : ""}"></i>`).join("")}</span><span style="color:var(--fg2);font-size:11.5px;line-height:1.2">${STEPS[k]}</span></div>`;
  const action = (c) => {
    if (c.step <= 1) return `<button class="btn sm pri" data-role="analyst admin">검색</button>`;
    if (c.step === 2) return `<button class="btn sm ok" data-role="analyst admin">확인</button>`;
    if (c.step === 3) return `<button class="btn sm ok" data-role="analyst admin">확인</button> <button class="btn sm" data-role="analyst admin">검증요청</button>`;
    if (c.step === 4) return `<button class="btn sm warn" data-role="verifier admin">검증하기</button>`;
    return `<button class="btn sm" data-role="analyst verifier admin">감정서</button>`;
  };

  function ours() {
    const rows = CASES.map(
      (c, i) => `<tr class="${i === 2 ? "sel" : ""}">
        <td><span class="imgbox" style="display:block;width:30px;height:44px">${sole({ kind: "scene", zones: ["dots", "grid", "herring"] })}</span></td>
        <td><div class="mono" style="color:var(--fg);line-height:1.3">${c.no}</div><div class="mono" style="color:var(--dim);font-size:11px;line-height:1.3">${c.doc}</div></td>
        <td>${c.nm}${c.sus === "유" ? ` <span class="chip red" style="height:18px;font-size:10.5px">용의자</span>` : ""}</td><td>${c.req} <span style="color:var(--dim)">/ ${c.occ}</span></td>
        <td class="r num">${c.imgs}</td><td class="num">${c.reg}</td>
        <td>${stepper(c.step)}</td><td>${resChip(c.res)}</td><td>${action(c)}</td></tr>`
    ).join("");

    return M.shell(
      { active: "사건관리", tabs: ["사건관리", "감정서작성", "족윤적 검증", "결재 대기함"], title: "사건관리" },
      `<div class="page-head">
        <div><div class="crumb">족윤적 · 사건관리</div><h3>사건관리 목록</h3><p>감정 의뢰가 들어온 사건을 진행상태별로 봅니다. 행을 고르면 오른쪽에 요약이 열립니다.</p></div>
        <div style="display:flex;gap:8px">
          <button class="btn">엑셀</button>
          <button class="btn pri pinbox" data-role="investigator admin">＋ 사건 등록 ${apin(6, "keep")}</button>
        </div>
      </div>

      <div class="panel" style="margin-bottom:12px">
        <div class="panel-b pinbox" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr)) auto;gap:10px 14px;align-items:end">
          ${apin(1, "keep", true)}
          <div><div class="crumb" style="margin-bottom:4px">감정번호·문서번호</div><span class="inp w100">00001-25-</span></div>
          <div><div class="crumb" style="margin-bottom:4px">등록일자</div><span class="inp w100 mono">2025-06-25 ~ 2025-07-24</span></div>
          <div><div class="crumb" style="margin-bottom:4px">사건명</div><span class="inp w100">전체<span class="caret">▾</span></span></div>
          <div><div class="crumb" style="margin-bottom:4px">의뢰관서</div><span class="inp w100">전체<span class="caret">▾</span></span></div>
          <div style="display:flex;gap:6px"><button class="btn">초기화</button><button class="btn pri">조회</button></div>
          <div style="grid-column:1/-1;display:flex;flex-wrap:wrap;gap:6px;align-items:center" class="pinbox">
            <span style="color:var(--dim);font-size:12px;margin-right:4px">빠른 필터 ${pin(2, "better")}</span>
            <span class="chip blue"><span class="dot"></span>결과 확인 전 14</span>
            <span class="chip" data-role="analyst admin">내 담당 9</span>
            <span class="chip amber" data-role="verifier admin">검증 대기 3</span>
            <span class="chip">용의자 있음 5</span>
            <span class="chip" data-role="investigator">우리 청 의뢰 22</span>
            <span style="margin-left:auto;color:var(--dim);font-size:12px">상세 조건(문서번호·피해자·사건장소·처리관서·발생관서·타기관여부·작성자) ▾</span>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:12px">
        <div class="panel tc">
          <div class="panel-h"><span class="lbl">CASE LIST</span><span class="t">전체 116건</span>
            <span class="r"><span class="seg"><button aria-pressed="true">목록보기</button><button aria-pressed="false">문양보기</button></span></span></div>
          <div class="pinbox" style="overflow-x:auto">${apin(3, "better")}
            <table class="grid"><thead><tr><th></th><th>감정번호 / 문서번호</th><th>사건명</th><th>의뢰관서 / 발생관서</th><th class="r">이미지</th><th>등록일자</th><th>진행상태 ${pin(4, "better")}</th><th>결과</th><th>다음 할 일</th></tr></thead>
            <tbody>${rows}</tbody></table>
          </div>
          <div style="display:flex;justify-content:space-between;padding:10px 14px;color:var(--mute);font-size:12px"><span class="num">전체 116 중 1 – 7</span><span class="num">‹ 1 / 17 ›</span></div>
        </div>

        <div class="panel pinbox">${apin(5, "better")}
          <div class="panel-h"><span class="lbl">SUMMARY</span><span class="t mono">00001-25-0646</span><span class="r"><span class="chip green">발견</span></span></div>
          <div class="panel-b" style="display:grid;gap:12px">
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">
              ${[["dots", "grid", "herring"], ["tri", "wave", "blocks"], ["grid", "grid", "lines"]].map((z, i) => `<span class="imgbox" style="height:110px">${sole({ kind: "scene", zones: z, cut: i === 1 })}<span class="cap">_${i + 1}</span></span>`).join("")}
            </div>
            <div class="form" style="grid-template-columns:84px minmax(0,1fr)">
              <div class="l">사건명</div><div class="v">주거침입</div>
              <div class="l">의뢰관서</div><div class="v">대구청 2025-03321</div>
              <div class="l">사건일시</div><div class="v num">2025-07-19 02:10 ~ 04:30</div>
              <div class="l">채취방법</div><div class="v">전사판채취법</div>
            </div>
            <div>
              <div class="crumb" style="margin-bottom:6px">진행 기록</div>
              <div style="display:grid;gap:6px;font-size:12px;color:var(--mute)">
                <div><span class="mono" style="color:var(--dim)">07-23 09:42</span> 검색 572355 · 후보 2,355건</div>
                <div><span class="mono" style="color:var(--dim)">07-23 10:05</span> 확인대상 1건 선정</div>
                <div><span class="mono" style="color:var(--dim)">07-24 17:29</span> 재검색 572414 · 후보 869건</div>
                <div style="color:var(--fg2)"><span class="mono" style="color:var(--dim)">07-24 17:35</span> 결과확인완료 · <b style="color:#4ade80">발견</b></div>
              </div>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button class="btn sm" data-role="analyst admin">사건 열기</button>
              <button class="btn sm" data-role="analyst admin">검증요청</button>
              <button class="btn sm" data-role="investigator">의뢰 내용 보기</button>
            </div>
          </div>
        </div>
      </div>`
    );
  }

  function scas() {
    const cols = ["순번", "이미지", "감정번호", "문서번호", "사건명", "의뢰관서 (SCAS번호)", "처리관서", "발생관서", "처리 구분", "개수", "용의자", "등록일자", "결과확인 완료일자", "사건 결과", "접수자", "작성자", "발/견", "불/발", "불/능", "등/록", "검/색", "확/인", "검색", "확인", "검증"];
    const row = (c, i) =>
      `<tr><td>${i + 1}</td><td><span class="ph" style="display:block;width:18px;height:24px"></span></td><td>${c.no}</td><td>${c.doc}</td><td>${c.nm}</td><td>${c.req} 2025-03321</td><td>경찰청 범죄분석과</td><td>${c.occ}</td><td>현장</td><td>${c.imgs} (${c.imgs}, 0)</td><td>${c.sus}</td><td>${c.reg}</td><td></td><td></td><td></td><td>${c.who} ▾</td><td>${c.res === "발견" ? 1 : ""}</td><td></td><td></td><td>${c.step === 1 ? 1 : ""}</td><td>${c.step === 2 ? 1 : ""}</td><td>${c.step >= 3 ? 1 : ""}</td><td><span class="sbtn g">검색</span></td><td>${c.step >= 2 ? '<span class="sbtn g">확인</span>' : ""}</td><td>${c.step >= 3 ? '<span class="sbtn n">검증요청</span>' : ""}</td></tr>`;
    return M.scasShell(
      { treeOn: "사건관리", h: 700 },
      `<div class="box" style="padding:8px;margin-bottom:8px">
        <table><tbody>
          <tr><td class="lbl">감정번호</td><td><span class="ph" style="height:16px"></span></td><td class="lbl">문서번호</td><td></td><td class="lbl">사건명</td><td>전체 ▾</td></tr>
          <tr><td class="lbl">등록일자</td><td>2025-06-25 📅 ~ 2025-07-24 📅</td><td class="lbl">피해자</td><td></td><td class="lbl">구분</td><td>◉전체 ○신발 ○타이어</td></tr>
          <tr><td class="lbl">사건장소</td><td></td><td class="lbl">검거여부</td><td>전체 ▾</td><td class="lbl">작성자</td><td></td></tr>
          <tr><td class="lbl">처리관서</td><td>경찰청 <span class="sbtn b">검색</span></td><td class="lbl">의뢰관서</td><td><span class="sbtn b">검색</span></td><td class="lbl">발생관서</td><td><span class="sbtn b">검색</span></td></tr>
          <tr><td class="lbl">사건결과</td><td>전체 ▾ ☐결과 확인 전</td><td class="lbl">타기관여부</td><td>전체 ▾</td><td></td><td></td></tr>
        </tbody></table>
      </div>
      <div class="bar">사건관리 목록 <span style="font-weight:400">◉목록보기 ○문양보기 <span class="sbtn">초기화</span> <span class="sbtn">엑셀</span> <span class="sbtn">조회</span> <span class="sbtn">등록</span></span></div>
      <div class="box" style="overflow:hidden"><table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${CASES.map(row).join("")}</tbody></table></div>
      <div style="padding:6px;color:#666;font-size:11px">« ‹ 페이지 [1] / 9 › » ⟳ <span style="float:right">전체 116 중 1 - 14</span></div>
      ${M.pain(760, 250, "<b>열 25개</b> — 한 화면에 다 안 들어와 인터뷰 내내 좌우로 스크롤 (5613 16:37–17:07)")}
      ${M.pain(1010, 120, "<b>진행상태가 세로쓰기 숫자</b> — 「발/견」「등/록」 두 글자 헤더 아래 숫자 1로만 표시")}
      ${M.pain(300, 300, "<b>다음 할 일이 버튼 색으로만</b> — 초록 검색·확인, 남색 검증요청이 단계마다 나타났다 사라짐")}`
    );
  }

  M.add({
    id: "s01",
    code: "S01",
    group: "사건관리",
    title: "사건관리 목록",
    refs: [{ t: "SCAS 사건관리 탭", v: "5613 02:00 · 10:04 · 16:37" }],
    lead: "SCAS 목록의 검색 조건과 열 이름은 그대로 두고, 진행상태를 막대 하나로 모으고, 다음 할 일 버튼을 행 끝 한 자리에 고정했습니다. 오른쪽 요약 칸으로 팝업 없이 사건을 훑어봅니다.",
    scas,
    ours,
    notes: [
      { n: 1, kind: "keep", title: "검색 조건 그대로", text: "감정번호·등록일자·사건명·의뢰관서를 앞에 두고, 문서번호·피해자·사건장소·처리관서·발생관서·타기관여부·작성자는 「상세 조건」으로 접었습니다.", src: "SCAS 검색 폼 3열×5행" },
      { n: 2, kind: "better", title: "빠른 필터", text: "SCAS의 「☐결과 확인 전」 체크를 칩으로 꺼내고, 역할별로 자주 보는 묶음(내 담당·검증 대기·우리 청 의뢰)을 더했습니다." },
      { n: 3, kind: "better", title: "열 25개 → 9개", text: "개수·결과·진행상태 숫자 열 9개를 진행 막대와 결과 칩 2개로 합치고, 문서번호는 감정번호 아래, 용의자는 사건명 옆 표시로 옮겼습니다. 접수자·처리 구분·작성자는 오른쪽 요약 칸에서 봅니다. 가로 스크롤이 없어집니다.", src: "5613 16:37–17:07 좌우 스크롤" },
      { n: 4, kind: "better", title: "진행상태 한눈에", text: "등록 → 검색 → 확인대상선정 → 결과확인완료 → 검증요청 → 결재완료 6단계를 막대로 보여 줍니다. SCAS의 단계 이름을 그대로 씁니다." },
      { n: 5, kind: "better", title: "오른쪽 요약 칸", text: "행을 누르면 팝업 대신 오른쪽에 이미지·사건정보·진행 기록이 열립니다. 검색 이력 번호(572355 등)도 여기서 봅니다." },
      { n: 6, kind: "keep", title: "등록 버튼은 수사관·관리자에게", text: "SCAS의 「등록」 버튼 그대로입니다. 보는 사람을 바꾸면 감정관에게는 숨겨지고, 행 끝 작업 버튼도 역할마다 달라집니다." },
    ],
  });
})();
