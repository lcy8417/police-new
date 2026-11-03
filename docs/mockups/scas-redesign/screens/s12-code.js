/* S12 기초코드관리 — SCAS 「족윤적 > 족윤적관리 > 기초코드관리」 (IMG_5616 8:00–14:00)
   근거: inventory_5614_5616 S6 — 왼쪽 기초 분류 코드(FT0xx), 오른쪽 족윤적 기초 코드(제조사·상표 등) */
(function () {
  const { pin, apin } = M;

  /* SCAS 화면 원문(왼쪽 23–47번) */
  const CATS = [
    [23, "FT032", "문양코딩구분"], [24, "FT016", "발견처리구분"], [25, "FT031", "범죄명구분"], [26, "FT047", "범죄장소구분"], [27, "FT057", "사건결과구분"],
    [28, "FT017", "사건처리구분"], [29, "FT019", "성별"], [30, "FT015", "승인구분"], [31, "FT012", "시스템구분"], [32, "FT059", "신규범죄장소구분"],
    [33, "FT060", "신규범죄장소구분"], [34, "FT013", "신발문양구분"], [35, "FT014", "신발문양상세구분"], [36, "FT030", "신발바닥위치구분"], [37, "FT001", "신발분류"],
    [38, "FT052", "신발분류상위"], [39, "FT003", "신발상표"], [40, "FT004", "신발색상"], [41, "FT002", "신발제조사"], [42, "FT0011", "신발제조사"],
    [43, "FT037", "신발타이어구분"], [44, "FT023", "앞뒤구분"], [45, "FT051", "요청사항처리구분"], [46, "FT056", "용의자이미지구분"], [47, "FT053", "용의자이미지구분"],
  ];
  /* SCAS 화면 원문(오른쪽 FT002 신발제조사 288–312번, (?)는 판독 불확실) */
  const MAKERS = [
    ["FT002068", "팀웍(Teamwork)"], ["FT002141", "파트보(?)"], ["FT002139", "파크랜드"], ["FT002200", "팔팔사(?)"], ["FT002122", "페가수스"],
    ["FT002255", "포센스어패럴(?)"], ["FT002092", "폴로"], ["FT002003", "퓨마사업부"], ["FT002027", "프로월드컵"], ["FT002093", "프로스펙스(?)"],
    ["FT002171", "피코나패션(?)"], ["FT002158", "하나"], ["FT002142", "학산"], ["FT002085", "한비산업(?)"], ["FT002301", "한스산업"],
    ["FT002254", "한신제화"], ["FT002126", "한일제화"], ["FT002149", "해성(?)"], ["FT002076", "협진(?)"], ["FT002183", "호우(주)(?)"],
    ["FT002047", "화승화학(?)"], ["FT002014", "화승상사"], ["FT002167", "휠라코(주)(?)"], ["FT002008", "휠라코리아"], ["FT002277", "힐턴(?)"],
  ];
  const DUP_CAT = new Set(["FT0011", "FT060", "FT053"]);
  const SAME_NAME_BRAND = { FT002141: "FT003198 파트보", FT002139: "FT003196 파크랜드", FT002122: "FT003176 페가수스", FT002068: "FT003122 팀웍(Teamwork)" };

  /* 사용여부 스위치(그림) */
  const sw = (on) => `<span data-lock="admin" title="사용여부 ${on ? "Y" : "N"}" style="display:inline-flex;align-items:center;width:30px;height:16px;padding:2px;border-radius:999px;background:${on ? "var(--blue2)" : "var(--line3)"};justify-content:${on ? "flex-end" : "flex-start"}"><span style="width:12px;height:12px;border-radius:50%;background:var(--fg)"></span></span>`;

  function ours() {
    const leftRows = CATS.filter(([n]) => [23, 30, 32, 33, 34, 36, 37, 38, 39, 40, 41, 42, 46, 47].includes(n))
      .map(([n, id, nm]) => {
        const dup = DUP_CAT.has(id) || ["FT002", "FT059", "FT056"].includes(id);
        return `<tr class="${id === "FT002" ? "sel" : ""}"><td class="num" style="color:var(--dim)">${n}</td><td class="mono" style="color:${id === "FT0011" ? "var(--amber)" : "var(--blue)"}">${id}</td>
          <td style="${dup ? "color:var(--amber)" : ""}">${dup ? "⚠ " : ""}${nm}</td><td style="color:var(--faint);font-size:11.5px">${id === "FT002" ? "제조사 코드표" : id === "FT003" ? "상표 코드표" : "설명 없음"}</td><td>${sw(true)}</td></tr>`;
      })
      .join("");

    const hits = MAKERS.slice(1, 11);
    const rightRows = hits
      .map(([code, nm], i) => {
        const same = SAME_NAME_BRAND[code];
        const off = code === "FT002200";
        const desc = code === "FT002092" ? "의류·신발" : code === "FT002093" ? "스포츠 신발" : "";
        return `<tr style="${off ? "opacity:.55" : ""}"><td class="num" style="color:var(--dim)">${289 + i}</td><td class="mono" style="color:var(--blue)">${code}</td>
          <td style="color:var(--fg)"><b style="color:var(--blue);font-weight:600">${nm.slice(0, 1)}</b>${nm.slice(1)}</td>
          <td>${desc || `<span class="chip" style="height:20px;font-size:11px;color:var(--dim)">설명 없음</span>`}</td>
          <td>${sw(!off)}</td>
          <td style="white-space:normal;line-height:1.35;font-size:11.5px">${same ? `<span style="color:var(--amber)">⚠ 상표 <span class="mono">${same}</span>와 같은 이름</span>` : off ? `<span style="color:var(--dim)">사용 안 함 · 기존 신발 3건은 그대로</span>` : `<span style="color:var(--faint)">—</span>`}</td></tr>`;
      })
      .join("");

    const hist = [
      ["07-24 10:12", "FT002301 한스산업", "등록", "신규 수집 브랜드"],
      ["07-23 16:40", "FT002200 팔팔사(?)", "사용여부 Y → N", "폐업 · 기존 신발 데이터 유지"],
      ["07-22 09:05", "FT003122 팀웍(Teamwork)", "코드 설명 (빈칸) → 신발상표", "설명 정리"],
      ["07-21 14:30", "FT0011 → FT002 병합", "코드 4건 이동", "분류 중복 정리"],
    ]
      .map((h) => `<tr><td class="num" style="color:var(--mute)">${h[0]}</td><td>관리자 김○○</td><td class="mono" style="font-size:12px">${h[1]}</td><td style="white-space:normal;line-height:1.35">${h[2]}</td><td style="white-space:normal;line-height:1.35;color:var(--mute)">${h[3]}</td></tr>`)
      .join("");

    return M.shell(
      { active: "기초코드관리", tabs: ["사건관리", "신발문양 관리", "기초코드관리"], title: "기초코드관리", h: 1000 },
      `<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;padding:9px 12px;border:1px solid color-mix(in srgb,var(--amber) 35%,var(--panel));border-radius:10px;background:var(--amber-bg);color:var(--fg2);font-size:12.5px">
        <b style="color:var(--amber)">관리자 전용 메뉴</b> — 관리자가 아니면 코드표를 볼 수만 있고, 등록·삭제·사용여부·병합이 흐리게 잠깁니다(위 「보는 사람」을 바꿔 확인).
      </div>
      <div class="page-head">
        <div><div class="crumb">족윤적 · 족윤적관리 · 기초코드관리</div><h3>기초코드관리</h3><p>제조사·상표·신발분류처럼 화면의 고르기 목록에 쓰이는 코드표입니다. 왼쪽에서 분류를 고르면 오른쪽에 그 분류의 코드가 나옵니다.</p></div>
        <div style="display:flex;gap:8px"><button class="btn">엑셀</button><button class="btn ghost">변경 이력 전체</button></div>
      </div>

      <div style="display:grid;grid-template-columns:430px minmax(0,1fr);gap:12px;align-items:start">
        <div style="display:grid;gap:12px">
          <div class="panel tc pinbox">
            ${apin(1, "keep", true)}
            <div class="panel-h"><span class="lbl">CATEGORY</span><span class="t">기초 분류 코드 <span class="num" style="color:var(--dim);font-weight:400">47</span></span>
              <span class="r"><button class="btn sm" data-lock="admin">등록</button><button class="btn sm danger" data-lock="admin">삭제</button></span></div>
            <div style="padding:8px 12px;border-bottom:1px solid var(--line2)"><span class="inp w100" style="color:var(--dim)">⌕ 분류 이름·아이디</span></div>
            <table class="grid"><thead><tr><th>순번</th><th>아이디</th><th>분류</th><th>코드 설명</th><th>사용여부</th></tr></thead><tbody>${leftRows}</tbody></table>
            <div style="padding:8px 12px;color:var(--dim);font-size:11.5px">47개 중 14개 표시 · 중복 의심 분류는 ⚠</div>
          </div>

          <div class="panel pinbox">
            ${apin(3, "better")}
            <div class="panel-h"><span class="lbl">DUPLICATE</span><span class="t">이름이 같은 분류 3쌍</span></div>
            <div class="panel-b" style="display:grid;gap:8px;font-size:12px">
              ${[["FT002", "FT0011", "신발제조사", "코드 313 · 4", ""], ["FT059", "FT060", "신규범죄장소구분", "코드 12 · 12", "내용까지 같음"], ["FT056", "FT053", "용의자이미지구분", "코드 5 · 3", ""]]
                .map((d) => `<div style="display:flex;align-items:center;gap:8px;padding:7px 9px;border:1px solid var(--line2);border-radius:8px;background:var(--bg2)">
                  <span class="mono" style="color:var(--blue)">${d[0]}</span><span style="color:var(--dim)">↔</span><span class="mono" style="color:var(--amber)">${d[1]}</span>
                  <span style="color:var(--fg2)">${d[2]}</span><span style="color:var(--dim);font-size:11px">${d[3]}${d[4] ? " · " + d[4] : ""}</span>
                  <button class="btn sm" style="margin-left:auto" data-lock="admin">병합</button></div>`)
                .join("")}
              <span style="color:var(--dim);font-size:11px">병합하면 이 코드를 쓰던 신발·사건 기록이 남는 쪽 코드로 옮겨지고, 변경 이력에 남습니다.</span>
            </div>
          </div>
        </div>

        <div style="display:grid;gap:12px">
          <div class="panel tc">
            <div class="panel-h"><span class="lbl">CODES</span><span class="t">족윤적 기초 코드 · <span class="mono">FT002</span> 신발제조사</span><span style="color:var(--dim);font-size:12px">313개</span>
              <span class="r"><button class="btn sm" data-lock="admin">등록</button><button class="btn sm danger" data-lock="admin">삭제</button><button class="btn sm">엑셀</button></span></div>
            <div class="pinbox" style="display:grid;gap:8px;padding:12px 14px;border-bottom:1px solid var(--line2)">
              ${apin(2, "better", true)}
              <div style="display:flex;gap:8px;align-items:center">
                <span class="inp" style="flex:1;height:38px;padding:0 12px;font-size:13.5px;border-color:var(--blue2);box-shadow:0 0 0 3px color-mix(in srgb,var(--blue2) 20%,transparent)"><span style="color:var(--dim)">⌕ 코드명</span><b style="color:var(--fg)">ㅍ</b><span style="color:var(--faint);font-size:12px">— 코드명·코드·설명, 초성으로도 찾기</span><span class="caret" style="color:var(--blue);font-size:12px">10건</span></span>
                <button class="btn pri" style="height:38px">조회</button>
              </div>
              <div class="pinbox" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
                <span class="chip blue">전체 313</span>
                <span class="chip amber">중복 의심 4 ${pin(4, "better")}</span>
                <span class="chip">설명 없음 207 ${pin(5, "better")}</span>
                <span class="chip">사용 안 함 6</span>
              </div>
            </div>
            <table class="grid"><thead><tr><th>순번</th><th>코드</th><th>코드명</th><th>코드 설명</th><th>사용여부 ${pin(6, "better")}</th><th style="width:190px">점검</th></tr></thead><tbody>${rightRows}</tbody></table>
            <div style="display:flex;justify-content:space-between;padding:8px 14px;color:var(--mute);font-size:12px"><span class="num">「ㅍ」 10건 / 313</span><span>사용 안 함 코드는 새 입력 목록에서만 빠지고, 이미 쓴 기록은 그대로입니다</span></div>
          </div>

          <div class="panel pinbox">
            ${apin(7, "plus")}
            <div class="panel-h"><span class="lbl">HISTORY</span><span class="t">변경 이력</span><span class="r"><span style="color:var(--dim);font-size:12px">누가 · 언제 · 무엇을 · 왜</span></span></div>
            <table class="grid"><thead><tr><th>시각</th><th>누가</th><th>대상</th><th>변경</th><th>사유</th></tr></thead><tbody>${hist}</tbody></table>
          </div>
        </div>
      </div>
      <div class="pinbox" style="display:inline-flex;gap:8px;align-items:center;margin-top:12px;padding:8px 12px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--mute);font-size:12px">
        ${apin(8, "better")}<span class="chip blue">관리자</span> 등록·삭제·사용여부·병합 &nbsp;|&nbsp; <span class="chip">감정관 등</span> 조회·엑셀만
      </div>`
    );
  }

  function scas() {
    const tree = [
      ["사건관리 ▸", 0], ["문양관리 ▸", 0], ["문양검색 ▸", 0], ["문양대조 ▸", 0], ["감정서관리 ▸", 0], ["족윤적관리 ▾", 0],
      ["불발견족윤적관리", 1], ["문양아이콘관리", 1], ["진행상태변경", 1], ["신발정보일괄관리", 1], ["신발정보일괄등록", 1], ["타이어정보일괄등록", 1],
      ["기초코드관리", 1], ["사용자 관리", 1], ["족윤적 검증", 1], ["족윤적감정 역량평가", 0],
    ];
    const tabs = ["사건관리", "시험품질경영절차서", "시험품질경영지침서", "감정서작성", "족윤적 검증", "결재 대기함", "수신 문서함", "문서접수대장", "신발문양 관리", "기초코드관리"];
    const sb = (t, c = "") => `<span class="sbtn ${c}">${t}</span>`;
    const left = CATS.map(
      ([n, id, nm]) => `<tr><td style="${id === "FT002" ? "background:var(--s-yellow)" : ""}">${n}</td><td style="${id === "FT002" ? "background:var(--s-yellow)" : ""}">${id}</td><td style="${id === "FT002" ? "background:var(--s-yellow)" : ""}">${nm}</td><td style="${id === "FT002" ? "background:var(--s-yellow)" : ""}"></td><td style="${id === "FT002" ? "background:var(--s-yellow)" : ""}">Y</td></tr>`
    ).join("");
    const right = MAKERS.map(([c, nm], i) => `<tr><td>${288 + i}</td><td>${c}</td><td>${nm}</td><td></td><td>Y</td></tr>`).join("");
    return M.scasShell(
      { treeOn: "기초코드관리", tree, tabOn: "기초코드관리", tabs, h: 790 },
      `<div style="display:grid;grid-template-columns:35% minmax(0,1fr);gap:10px">
        <div>
          <div class="bar">기초 분류 코드 <span>${sb("등록")} ${sb("삭제")}</span></div>
          <div class="box"><table style="color:var(--s-text)"><thead><tr><th>순번</th><th>아이디</th><th>분류</th><th>코드 설명</th><th>사용여부</th></tr></thead><tbody>${left}</tbody></table></div>
        </div>
        <div>
          <div class="bar">족윤적 기초 코드 <span></span></div>
          <div class="box" style="padding:5px 8px;display:flex;gap:6px;align-items:center"><span class="lbl" style="padding:1px 8px">코드명</span><span style="display:inline-block;width:140px;height:16px;border:1px solid var(--s-line)"></span>${sb("조회", "b")} ${sb("등록")} ${sb("삭제")}</div>
          <div class="box"><table style="color:var(--s-text)"><thead><tr><th>순번</th><th>코드</th><th>코드명</th><th>코드 설명</th><th>사용여부</th></tr></thead><tbody>${right}</tbody></table></div>
        </div>
      </div>
      ${M.pain(20, 662, "<b>분류 이름이 겹침</b> — FT002·FT0011 둘 다 「신발제조사」, FT059·FT060, FT056·FT053도 같은 이름. 아이디 자릿수도 제각각 (5616 8:00–8:15)", 400)}
      ${M.pain(760, 150, "<b>제조사·상표에 같은 이름</b> — 팀웍·파트보·파크랜드·페가수스가 제조사(FT002)와 상표(FT003) 양쪽에 따로 등록 (5616 8:15–9:00)", 280)}
      ${M.pain(760, 430, "<b>313행을 스크롤로 찾음</b> — 코드명 검색칸은 있지만 쓰지 않음. 상표 코드 설명은 「신발제조사」와 빈칸이 섞여 있음 (5616 8:15–9:00)", 280)}`
    );
  }

  M.add({
    id: "s12",
    code: "S12",
    group: "족윤적관리",
    title: "기초코드관리",
    refs: [{ t: "SCAS 기초코드관리", v: "5616 08:00–14:00" }, { t: "사업계획서 관리자 로그", v: "p16–19" }],
    lead: "SCAS의 2단 화면(왼쪽 분류, 오른쪽 코드)과 열 이름을 그대로 둡니다. 검색칸을 크게 앞으로 꺼내고, 이름이 겹치는 분류·제조사·상표를 미리 짚어 줘서 코드표가 더 꼬이지 않게 합니다.",
    scas,
    ours,
    notes: [
      { n: 1, kind: "keep", title: "2단 화면 · 열 이름 · 버튼 그대로", text: "왼쪽 「기초 분류 코드」(순번·아이디·분류·코드 설명·사용여부, 등록·삭제), 오른쪽 「족윤적 기초 코드」(순번·코드·코드명·코드 설명·사용여부, 코드명 조회·등록·삭제) 배치를 바꾸지 않았습니다.", src: "5616 S6" },
      { n: 2, kind: "better", title: "코드명 검색을 크게, 초성으로도", text: "SCAS에도 코드명 검색칸이 있었지만 작아서 쓰지 않고 313행을 스크롤했습니다. 검색칸을 표 위에 크게 두고, 「ㅍ」처럼 초성이나 코드 번호로도 바로 좁힙니다.", src: "5616 8:15–9:00" },
      { n: 3, kind: "better", title: "이름이 같은 분류 짚기 + 병합", text: "FT002·FT0011(신발제조사), FT059·FT060(신규범죄장소구분), FT056·FT053(용의자이미지구분)을 ⚠로 표시하고 병합을 제안합니다. 병합하면 쓰던 기록이 남는 코드로 옮겨집니다.", src: "5616 8:00–8:15" },
      { n: 4, kind: "better", title: "제조사·상표 같은 이름 경고", text: "「점검」 열에 상표 코드표에도 같은 이름이 있는지 보여 줍니다(팀웍·파트보·파크랜드·페가수스). 수집 검수(S11)가 제조사·상표를 고를 때도 이 경고를 씁니다.", src: "5616 9:00" },
      { n: 5, kind: "better", title: "설명 없음 필터", text: "코드 설명이 빈 코드만 모아 채울 수 있게 했습니다. SCAS 상표 코드는 설명 칸에 「신발제조사」라 적힌 행과 빈 행이 섞여 있었습니다.", src: "5616 9:00 상표 코드 설명" },
      { n: 6, kind: "better", title: "사용여부 Y/N → 스위치", text: "사용여부를 스위치로 바로 바꿉니다. 「사용 안 함」 코드는 새로 입력할 때 고르기 목록에서만 빠지고, 이미 그 코드를 쓴 신발·사건 기록은 그대로 남습니다." },
      { n: 7, kind: "plus", title: "코드 변경 이력", text: "누가·언제·무엇을·왜 바꿨는지 남깁니다(등록·사용여부·설명 수정·병합). 사유는 꼭 적어야 저장됩니다.", src: "사업계획서 p16–19 관리자 로그" },
      { n: 8, kind: "better", title: "보는 사람에 따라", text: "관리자만 등록·삭제·사용여부·병합을 할 수 있습니다. 다른 역할로 보면 맨 위에 「관리자 전용 화면」 안내가 뜨고 그 버튼·스위치가 흐리게 잠깁니다. 조회와 엑셀은 그대로 됩니다." },
    ],
  });
})();
