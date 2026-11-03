/* S12 기초코드관리 (r2) — SCAS 「족윤적 > 족윤적관리 > 기초코드관리」 (IMG_5616 8:00–14:00)
   근거: inventory_5614_5616 S6 — 왼쪽 기초 분류 코드(FT0xx), 오른쪽 족윤적 기초 코드(제조사·상표 등). 녹취 5616 07:43–09:57.
   r2: 제조사와 상표 이름이 같은 것은 정상(나이키) → 경고 대신 「제조사 아래 상표」 연결로 보여 준다. */
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
  const DUP_CAT = new Set(["FT002", "FT0011", "FT059", "FT060", "FT056", "FT053"]);
  /* 같은 분류(제조사) 안의 비슷한 이름 — 진짜 확인할 것 */
  const SIMILAR = { FT002047: "FT002014 화승상사", FT002014: "FT002047 화승화학", FT002167: "FT002008 휠라코리아", FT002008: "FT002167 휠라코(주)" };
  /* 연결 상표 수(시안 예시) */
  const LINKS = { FT002158: 1, FT002142: 2, FT002085: 1, FT002301: 1, FT002254: 3, FT002126: 2, FT002149: 1, FT002076: 1, FT002183: 1, FT002047: 1, FT002014: 2, FT002167: 0, FT002008: 2, FT002277: 1 };
  /* r3: 이 코드를 쓰는 신발 수(시안 예시, 합계는 신발 DB 128,406켤레보다 훨씬 작게) */
  const USE = { FT002158: 412, FT002142: 1876, FT002085: 97, FT002301: 3, FT002254: 655, FT002126: 520, FT002149: 38, FT002076: 211, FT002183: 14, FT002047: 126, FT002014: 1342, FT002167: 0, FT002008: 4906, FT002277: 61 };

  const sw = (on) => `<span data-lock="admin" title="사용여부 ${on ? "Y" : "N"}" style="display:inline-flex;align-items:center;width:30px;height:16px;padding:2px;border-radius:999px;background:${on ? "var(--blue2)" : "var(--line3)"};justify-content:${on ? "flex-end" : "flex-start"}"><span style="width:12px;height:12px;border-radius:50%;background:var(--fg)"></span></span>`;

  function ours() {
    const leftRows = CATS.filter(([n]) => [23, 30, 32, 33, 34, 36, 37, 38, 39, 40, 41, 42, 46, 47].includes(n))
      .map(([n, id, nm]) => {
        const dup = DUP_CAT.has(id);
        const cnt = id === "FT002" ? "313" : id === "FT003" ? "677" : "";
        return `<tr class="${id === "FT002" ? "sel" : ""}"><td class="num" style="color:var(--dim)">${n}</td><td class="mono" style="color:${id === "FT0011" ? "var(--amber)" : "var(--blue)"}">${id}</td>
          <td style="${dup ? "color:var(--amber)" : ""}">${dup ? "⚠ " : ""}${nm}${cnt ? ` <span class="num" style="color:var(--dim);font-size:11px">${cnt}</span>` : ""}</td><td style="color:var(--faint);font-size:11.5px">설명 없음</td><td>${sw(true)}</td></tr>`;
      })
      .join("");

    const hits = MAKERS.slice(11);
    const rightRows = hits
      .map(([code, nm], i) => {
        const sim = SIMILAR[code];
        const sel = code === "FT002008";
        const ln = LINKS[code];
        return `<tr class="${sel ? "sel" : ""}"><td class="num" style="color:var(--dim)">${299 + i}</td><td class="mono" style="color:var(--blue)">${code}</td>
          <td style="color:var(--fg)"><b style="color:var(--blue);font-weight:600">${nm.slice(0, 1)}</b>${nm.slice(1)}</td>
          <td><span style="color:var(--faint);font-size:11.5px">설명 없음</span></td>
          <td>${sw(true)}</td>
          <td>${ln ? `<span class="chip blue" style="height:20px;font-size:11px">상표 ${ln}</span>` : `<span class="chip" style="height:20px;font-size:11px;color:var(--dim)">연결 없음</span>`}
            <span class="num" style="display:block;margin-top:2px;font-size:10.5px;color:${USE[code] ? "var(--dim)" : "var(--amber)"}">${USE[code] ? `신발 ${USE[code].toLocaleString("ko-KR")}켤레` : "신발 0 · 안 쓰는 코드"}</span></td>
          <td style="white-space:normal;line-height:1.35;font-size:11.5px">${sim ? `<span style="color:var(--amber)">비슷한 이름 <span class="mono">${sim}</span> — 같은 회사인지 확인</span>` : `<span style="color:var(--faint)">—</span>`}</td></tr>`;
      })
      .join("");

    const hist = [
      ["07-24 10:12", "FT002301 한스산업", "등록", "새 신상 상표의 제조사"],
      ["07-23 16:40", "FT002200 팔팔사(?)", "사용여부 Y → N", "폐업 · 기존 신발 데이터 유지"],
      ["07-22 09:05", "FT003070 탠디(TANDY)", "제조사 연결 → 금강", "제조사 아래 상표 묶기"],
      ["07-21 14:30", "FT0011 → FT002 병합", "코드 4건 이동", "분류 중복 정리"],
    ]
      .map((h) => `<tr><td class="num" style="color:var(--mute)">${h[0]}</td><td>관리자 김○○</td><td class="mono" style="font-size:12px">${h[1]}</td><td style="white-space:normal;line-height:1.35">${h[2]}</td><td style="white-space:normal;line-height:1.35;color:var(--mute)">${h[3]}</td></tr>`)
      .join("");

    const brand = (t, sub = "") => `<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 9px;border:1px solid var(--line3);border-radius:8px;background:var(--panel2);font-size:12px;color:var(--fg2)">${t}${sub ? ` <span class="mono" style="color:var(--dim);font-size:10.5px">${sub}</span>` : ""}</span>`;

    return M.shell(
      { active: "기초코드관리", tabs: ["사건관리", "신발문양 관리", "기초코드관리"], title: "기초코드관리", h: 1890 },
      `<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;padding:9px 12px;border:1px solid color-mix(in srgb,var(--amber) 35%,var(--panel));border-radius:10px;background:var(--amber-bg);color:var(--fg2);font-size:12.5px">
        <b style="color:var(--amber)">관리자 전용 메뉴</b> — 관리자가 아니면 코드표를 볼 수만 있고, 등록·삭제·사용여부·병합이 흐리게 잠깁니다(위 「보는 사람」을 바꿔 확인).
      </div>
      <div class="page-head">
        <div><div class="crumb">족윤적 · 족윤적관리 · 기초코드관리</div><h3>기초코드관리</h3><p>SCAS와 같은 2단 화면입니다. 왼쪽에서 분류를 고르면 오른쪽에 그 분류의 코드가 나옵니다.</p></div>
      </div>

      <div class="pinbox" style="display:flex;gap:10px;margin-bottom:12px">
        ${apin(11, "better", true)}
        <div class="stat" style="flex:1;min-width:0"><span class="k">제조사 <span class="mono">FT002</span></span><span class="v">313</span><span class="s">사용 안 함 6 · 상표 연결 없음 21</span></div>
        <div class="stat" style="flex:1;min-width:0;--glow:rgba(245,158,11,.18);border-color:#4d3a12"><span class="k" style="color:var(--amber)">상표 <span class="mono">FT003</span> · 제조사 미연결</span><span class="v">48<small style="font:500 11px var(--font-ui);color:var(--dim)"> / 677</small></span><span class="fx-bar"><i style="width:93%"></i></span><span class="s">629개(93%)는 제조사에 연결됨 · AI 제안 2</span></div>
        <div class="stat" style="flex:1;min-width:0"><span class="k">안 쓰는 제조사 코드</span><span class="v">11</span><span class="s">이 코드를 쓴 신발 0켤레 · 병합·사용 안 함 후보</span></div>
        <div class="stat" style="flex:1;min-width:0"><span class="k">비슷한 제조사 이름 · 겹치는 분류</span><span class="v">2 · 3<small style="font:500 11px var(--font-ui);color:var(--dim)"> 쌍</small></span><span class="s">화승·휠라 2쌍 확인 · 분류 3쌍 병합 제안</span></div>
        <div class="stat" style="flex:1;min-width:0;--glow:rgba(45,212,191,.16)"><span class="k">최근 30일 새 상표</span><span class="v">7</span><span class="s">수집 검수(S11)에서 넘어와 대기 3</span></div>
      </div>

      <div style="display:grid;grid-template-columns:410px minmax(0,1fr);gap:12px;align-items:start">
        <div style="display:grid;gap:12px">
          <div class="panel tc pinbox">
            ${apin(1, "keep", true)}
            <div class="panel-h"><span class="t">기초 분류 코드</span><span class="num" style="color:var(--dim);font-size:12px">47</span>
              <span class="r"><button class="btn sm" data-lock="admin">등록</button><button class="btn sm danger" data-lock="admin">삭제</button></span></div>
            <table class="grid"><thead><tr><th>순번</th><th>아이디</th><th>분류</th><th>코드 설명</th><th>사용여부</th></tr></thead><tbody>${leftRows}</tbody></table>
            <div style="padding:8px 12px;color:var(--dim);font-size:11.5px">47개 중 14개 표시 · 이름이 겹치는 분류는 ⚠</div>
          </div>

          <div class="panel pinbox">
            ${apin(3, "better")}
            <div class="panel-h"><span class="lbl">DUPLICATE</span><span class="t">이름이 겹치는 분류 3쌍</span></div>
            <div class="panel-b" style="display:grid;gap:8px;font-size:12px">
              ${[["FT002", "FT0011", "신발제조사", "코드 313 · 4"], ["FT059", "FT060", "신규범죄장소구분", "코드 12 · 12"], ["FT056", "FT053", "용의자이미지구분", "코드 5 · 3"]]
                .map((d) => `<div style="display:flex;align-items:center;gap:8px;padding:7px 9px;border:1px solid var(--line2);border-radius:8px;background:var(--bg2)">
                  <span class="mono" style="color:var(--blue)">${d[0]}</span><span style="color:var(--dim)">↔</span><span class="mono" style="color:var(--amber)">${d[1]}</span>
                  <span style="color:var(--fg2)">${d[2]}</span><span style="color:var(--dim);font-size:11px">${d[3]}</span>
                  <button class="btn sm" style="margin-left:auto" data-lock="admin">병합</button></div>`)
                .join("")}
              <span style="color:var(--dim);font-size:11px">병합하면 이 코드를 쓰던 신발·사건 기록이 남는 쪽 코드로 옮겨지고, 변경 이력에 남습니다.</span>
            </div>
          </div>
        </div>

        <div style="display:grid;gap:12px">
          <div class="panel tc">
            <div class="panel-h pinbox"><span class="t">족윤적 기초 코드</span><span style="color:var(--fg2);font-size:12.5px"><span class="mono">FT002</span> 신발제조사</span>
              <span class="num" style="color:var(--dim);font-size:12px">313 · 상표 677 ${pin(4, "voice")}</span>
              <span class="r"><button class="btn sm" data-lock="admin">등록</button><button class="btn sm danger" data-lock="admin">삭제</button><span style="width:1px;height:18px;background:var(--line3)"></span><button class="btn sm">엑셀</button></span></div>
            <div class="pinbox" style="display:grid;gap:8px;padding:12px 14px;border-bottom:1px solid var(--line2)">
              ${apin(2, "better", true)}
              <div style="display:flex;gap:8px;align-items:center">
                <span class="lbl" style="color:var(--mute);font-size:12.5px;white-space:nowrap">코드명</span>
                <span class="inp" style="flex:1;height:38px;padding:0 12px;font-size:13.5px;border-color:var(--blue2);box-shadow:0 0 0 3px color-mix(in srgb,var(--blue2) 20%,transparent)"><b style="color:var(--fg)">ㅎ</b><span style="color:var(--faint);font-size:12px">— 코드명·코드·설명, 초성으로도 찾기</span><span class="caret" style="color:var(--blue);font-size:12px">14건</span></span>
                <button class="btn pri" style="height:38px">조회</button>
              </div>
              <div class="pinbox" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
                <span class="chip blue">전체 313</span><span class="chip amber">비슷한 이름 4 ${pin(6, "better")}</span><span class="chip">상표 연결 없음 21</span><span class="chip">설명 없음 207</span><span class="chip">사용 안 함 6</span>
              </div>
            </div>
            <table class="grid"><thead><tr><th>순번</th><th>코드</th><th>코드명</th><th>코드 설명</th><th>사용여부 ${pin(8, "better")}</th><th>연결 상표 · 사용 ${pin(12, "better")}</th><th style="width:180px">점검</th></tr></thead><tbody>${rightRows}</tbody></table>
            <div style="display:flex;justify-content:space-between;padding:8px 14px;color:var(--mute);font-size:12px"><span class="num">「ㅎ」 14건 / 313</span><span>열 5개는 SCAS 순서 그대로, 「연결 상표」「점검」만 끝에 추가</span></div>
          </div>

          <div class="panel pinbox">
            ${apin(5, "voice")}
            <div class="panel-h"><span class="lbl">LINK</span><span class="t">제조사 아래 상표 · <span class="mono">FT002008</span> 휠라코리아</span><span class="r"><button class="btn sm" data-lock="admin">＋ 상표 연결</button></span></div>
            <div class="panel-b" style="display:grid;gap:10px;font-size:12px">
              <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center"><span style="color:var(--mute)">연결된 상표</span>${brand("휠라", "예시")}${brand("휠라키즈", "예시")}</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                <div style="padding:8px 10px;border:1px solid var(--line2);border-radius:8px;background:var(--bg2)"><span class="crumb">한 회사 · 여러 상표</span>
                  <div style="margin-top:4px;color:var(--fg2)">금강 → ${brand("엘칸토")} ${brand("탠디(TANDY)", "FT003070")}</div></div>
                <div style="padding:8px 10px;border:1px solid var(--line2);border-radius:8px;background:var(--bg2)"><span class="crumb">이름이 같아도 정상</span>
                  <div style="margin-top:4px;color:var(--fg2)">나이키 → ${brand("나이키")} <span style="color:var(--green);font-size:11px">✓ 경고 없음</span></div></div>
              </div>
              <div class="pinbox" style="display:grid;gap:6px;padding:8px 10px;border:1px solid #1d4a44;border-radius:8px;background:var(--teal-bg)">
                ${apin(13, "plus")}
                <span style="display:flex;align-items:center;gap:8px;padding-right:22px"><span class="ai-tag">AI 연결 제안</span><span style="color:var(--fg2)">제조사가 비어 있는 상표 48개 중 근거가 있는 것만</span><span style="margin-left:auto;color:var(--dim);font-size:11px">관리자가 눌러야 연결</span></span>
                ${[
                  ["한스(예시)", "FT002301", "한스산업", "수집 상품 페이지에 「제조원: 한스산업」 3건 · 07-24 함께 등록", "0.93", false],
                  ["학산워크(예시)", "FT002142", "학산", "상표 이름 앞부분이 같음 · 같은 수집처 상품 8건", "0.71", true],
                ]
                  .map(
                    ([b, c, m, why, v, low]) => `<div style="display:grid;grid-template-columns:auto auto minmax(0,1fr) auto auto;gap:8px;align-items:center;padding:6px 8px;border:1px solid var(--line2);border-radius:7px;background:var(--panel)">
                    ${brand(b)}<span style="color:var(--fg2);white-space:nowrap">→ <span class="mono" style="color:var(--blue)">${c}</span> ${m}</span>
                    <span style="color:var(--dim);font-size:11px;line-height:1.35">${why}</span>
                    <b class="num" style="color:${low ? "var(--amber)" : "var(--teal)"}">${v}</b>
                    <span style="display:flex;gap:4px"><button class="btn sm" data-lock="admin">연결</button><button class="btn sm ghost" data-lock="admin">아님</button></span></div>`
                  )
                  .join("")}
              </div>
              <div class="pinbox" style="display:flex;align-items:center;gap:8px;color:var(--mute)">${pin(7, "voice")}새 상표는 수집 검수(S11)에서 발견되면 여기로 넘어와 상표 등록 → 제조사 연결 순서로 넣습니다.</div>
            </div>
          </div>

          <div class="panel pinbox">
            ${apin(9, "plus")}
            <div class="panel-h"><span class="lbl">HISTORY</span><span class="t">변경 이력</span><span class="r"><span style="color:var(--dim);font-size:12px">누가 · 언제 · 무엇을 · 왜</span></span></div>
            <table class="grid"><thead><tr><th>시각</th><th>누가</th><th>대상</th><th>변경</th><th>사유</th></tr></thead><tbody>${hist}</tbody></table>
          </div>
        </div>
      </div>
      <div class="pinbox" style="display:inline-flex;gap:8px;align-items:center;margin-top:12px;padding:8px 12px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--mute);font-size:12px">
        ${apin(10, "better")}<span class="chip blue">관리자</span> 등록·삭제·사용여부·병합·상표 연결 &nbsp;|&nbsp; <span class="chip">감정관 등</span> 조회·엑셀만
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
    const y = (id) => (id === "FT002" ? "background:var(--s-yellow)" : "");
    const left = CATS.map(([n, id, nm]) => `<tr><td style="${y(id)}">${n}</td><td style="${y(id)}">${id}</td><td style="${y(id)}">${nm}</td><td style="${y(id)}"></td><td style="${y(id)}">Y</td></tr>`).join("");
    const right = MAKERS.map(([c, nm], i) => `<tr><td>${288 + i}</td><td>${c}</td><td>${nm}</td><td></td><td>Y</td></tr>`).join("");
    return M.scasShell(
      { treeOn: "기초코드관리", tree, tabOn: "기초코드관리", tabs, h: 790 },
      `<div style="display:grid;grid-template-columns:35% minmax(0,1fr);gap:10px">
        <div>
          <div class="bar">기초 분류 코드 <span>${sb("등록")} ${sb("삭제")}</span></div>
          <div class="box"><table><thead><tr><th>순번</th><th>아이디</th><th>분류</th><th>코드 설명</th><th>사용여부</th></tr></thead><tbody>${left}</tbody></table></div>
        </div>
        <div>
          <div class="bar">족윤적 기초 코드 <span></span></div>
          <div class="box" style="padding:5px 8px;display:flex;gap:6px;align-items:center"><span class="lbl" style="padding:1px 8px">코드명</span><span style="display:inline-block;width:140px;height:16px;border:1px solid var(--s-line)"></span>${sb("조회", "b")} ${sb("등록")} ${sb("삭제")}</div>
          <div class="box"><table><thead><tr><th>순번</th><th>코드</th><th>코드명</th><th>코드 설명</th><th>사용여부</th></tr></thead><tbody>${right}</tbody></table></div>
        </div>
      </div>
      ${M.pain(20, 662, "<b>분류 이름이 겹침</b> — FT002·FT0011 둘 다 「신발제조사」, FT059·FT060, FT056·FT053도 같은 이름. 아이디 자릿수도 제각각 (5616 8:00–8:15)", 400)}
      ${M.pain(760, 150, "<b>어느 회사 상표인지 안 보임</b> — 제조사 313건과 상표 677건이 따로 놀고, 상표 코드 설명은 「신발제조사」와 빈칸이 섞여 있음 (5616 8:03–9:57)", 280)}
      ${M.pain(760, 430, "<b>313행을 스크롤로 찾음</b> — 코드명 검색칸은 있지만 쓰지 않고 위아래로 훑음 (5616 8:15–9:00)", 280)}`
    );
  }

  M.add({
    id: "s12",
    code: "S12",
    group: "족윤적관리",
    title: "기초코드관리",
    refs: [{ t: "SCAS 기초코드관리", v: "5616 08:00–14:00" }, { t: "인터뷰 제조사·상표", v: "5616 08:03–09:57", voice: true }, { t: "사업계획서 관리자 로그", v: "p16–19" }],
    lead: "SCAS의 2단 화면(왼쪽 분류, 오른쪽 코드)과 열 순서를 그대로 둡니다. 검색칸을 크게 쓰게 하고, 제조사 아래 어떤 상표가 있는지 묶어 보여 줍니다. 경고는 같은 분류 안에서 이름이 겹치거나 비슷한 것에만 띄웁니다. r3: 위에 코드 정리 현황 타일(제조사 미연결 상표 48 등)을, 코드마다 그 코드를 쓰는 신발 수를, 제조사 아래 상표 칸에 근거가 붙은 AI 연결 제안을 더했습니다(열 순서·버튼은 그대로).",
    fit: {
      area: ["same", "왼쪽 기초 분류 코드(약 35%) · 오른쪽 족윤적 기초 코드 그대로. 「제조사 아래 상표」 칸과 변경 이력은 오른쪽 아래 빈자리에 덧붙임"],
      buttons: ["same", "왼쪽 등록·삭제 / 오른쪽 코드명 조회·등록·삭제 같은 자리. 엑셀만 구분선 뒤 끝에"],
      popup: ["same", "SCAS도 팝업 없음 — 그대로"],
      columns: ["near", "열 5개(순번·코드·코드명·코드 설명·사용여부) 순서 그대로, 끝에 「연결 상표」「점검」 2열만 추가"],
    },
    scas,
    ours,
    notes: [
      { n: 1, kind: "keep", title: "2단 화면 · 열 순서 · 버튼 그대로", text: "왼쪽 「기초 분류 코드」(순번·아이디·분류·코드 설명·사용여부, 등록·삭제), 오른쪽 「족윤적 기초 코드」(순번·코드·코드명·코드 설명·사용여부, 코드명 조회·등록·삭제) 배치를 바꾸지 않았습니다.", src: "5616 S6" },
      { n: 2, kind: "better", title: "코드명 검색을 크게, 초성으로도", text: "SCAS에도 코드명 검색칸이 있었지만 작아서 쓰지 않고 313행을 스크롤했습니다. 같은 자리의 검색칸을 크게 하고, 「ㅎ」처럼 초성이나 코드 번호로도 바로 좁힙니다.", src: "5616 8:15–9:00" },
      { n: 3, kind: "better", title: "이름이 겹치는 분류 + 병합", text: "FT002·FT0011(신발제조사), FT059·FT060(신규범죄장소구분), FT056·FT053(용의자이미지구분)은 같은 이름의 분류가 둘씩 있어 ⚠로 표시하고 병합을 제안합니다.", src: "5616 8:00–8:15" },
      { n: 4, kind: "voice", title: "제조사 313건 · 상표 677건", text: "코드가 많아 눈으로 훑기 어렵다는 점을 분류 옆 숫자로 보여 주고, 검색을 기본으로 씁니다. 「제조사만 해도 313건이란 말이에요… 상표만 해도 677건」.", src: "5616 08:03–08:15" },
      { n: 5, kind: "voice", title: "제조사 아래 상표를 묶어 보기", text: "한 회사 아래 여러 상표가 있고, 나이키처럼 제조사와 상표 이름이 같은 것도 정상입니다. 그래서 같은 이름 경고를 없애고 제조사 ↔ 상표 연결을 보여 줍니다. 「나이키는 나이키만 있는데… 같은 제조사인데 상표가 다른 경우가 있어요」, 「회사 자체는 금강이야. 근데 엘칸토도 있고」.", src: "5616 09:19–09:49" },
      { n: 6, kind: "better", title: "같은 분류 안의 비슷한 이름만 확인", text: "r1의 「제조사·상표 같은 이름」 경고는 뺐습니다. 제조사끼리 이름이 비슷한 것(화승화학 ↔ 화승상사, 휠라코(주) ↔ 휠라코리아)만 「같은 회사인지 확인」으로 짚습니다.", src: "인터뷰 정리 4절 S12" },
      { n: 7, kind: "voice", title: "새 상표는 상표 등록부터", text: "홈쇼핑 등에서 새 상표를 보면 적어 와서 상표부터 등록합니다. 수집 검수(S11)에서 발견된 새 상표가 이 화면으로 넘어옵니다. 「상표를 적어와서… 상표 등록을 하고」.", src: "5616 08:43–09:01" },
      { n: 8, kind: "better", title: "사용여부 Y/N → 스위치", text: "사용여부를 스위치로 바로 바꿉니다. 「사용 안 함」 코드는 새로 입력할 때 고르기 목록에서만 빠지고, 이미 그 코드를 쓴 신발·사건 기록은 그대로 남습니다." },
      { n: 9, kind: "plus", title: "코드 변경 이력", text: "누가·언제·무엇을·왜 바꿨는지 남깁니다(등록·사용여부·상표 연결·병합). 사유는 꼭 적어야 저장됩니다.", src: "사업계획서 p16–19 관리자 로그" },
      { n: 10, kind: "better", title: "보는 사람에 따라", text: "관리자만 등록·삭제·사용여부·병합·상표 연결을 할 수 있습니다. 다른 역할로 보면 그 버튼·스위치가 흐리게 잠기고, 조회와 엑셀은 그대로 됩니다." },
      { n: 11, kind: "better", title: "코드 정리 현황 타일(r3)", text: "관리자가 화면을 열면 먼저 정리할 거리가 숫자로 보입니다: 제조사 313(사용 안 함 6), 제조사에 연결되지 않은 상표 48 / 677, 신발이 0켤레인 안 쓰는 제조사 코드 11, 비슷한 제조사 이름 2쌍 · 겹치는 분류 3쌍, 최근 30일 새 상표 7. 313·677 말고는 시안 예시입니다.", src: "5616 08:03–09:57 · 사업계획서 p16–19" },
      { n: 12, kind: "better", title: "코드마다 쓰는 신발 수(r3)", text: "「연결 상표」 칸 아래에 이 코드를 쓰는 신발이 몇 켤레인지 붙였습니다(예: 휠라코리아 4,906켤레). 0켤레인 코드는 노란 「안 쓰는 코드」로 보여, 병합하거나 사용 안 함으로 돌릴 때 기존 신발 기록이 얼마나 영향을 받는지 미리 압니다. 열을 늘리지 않고 기존 칸 안에 넣었습니다." },
      { n: 13, kind: "plus", title: "상표 ↔ 제조사 AI 연결 제안(r3)", text: "제조사가 비어 있는 상표마다, 수집한 상품 페이지의 「제조원」 표기나 이름이 겹치는 정도를 근거로 어느 제조사에 묶일지 제안합니다(숫자는 확신도). 근거를 한 줄로 보여 주고, 관리자가 「연결」을 눌러야 반영되며 「아님」을 누르면 다시 제안하지 않습니다. 확신도가 낮으면(0.71) 노란색입니다. 상표 이름·숫자는 시안 예시입니다.", src: "5616 09:19–09:49 「회사 자체는 금강이야. 근데 엘칸토도 있고」" },
    ],
  });
})();
