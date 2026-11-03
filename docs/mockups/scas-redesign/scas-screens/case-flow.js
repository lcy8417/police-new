/* SCAS 재현 — 사건 감정 흐름(사건관리 목록 → 사건관리 팝업 → 이미지 커팅 → 문양 상세보기 → AI 창 3개 → 문양검색결과 → 상세조회 → 이미지 뷰어)
   근거: analysis/scas-video/inventory_5613.md S1–S10, detail/5613_*.jpg. 사람·주소는 가림, 번호는 인벤토리 예시 형식의 가짜 값.
   작업 영역(.r-work) 안쪽 폭 약 1210px · 높이 h-120px. 팝업은 바탕 화면 위에 R.dim() + .r-modal 로 겹친다. */
(function () {
  const { btn, btns, inp, sel, icon, img } = R;
  const G = "sc-";
  const H = 900; // 창 높이(작업 영역 약 780px)

  /* ── 공통 조각 ── */
  const bar = (t, right = "", x = "") => `<div class="r-bar" style="${x}">${t}${right ? `<span>${right}</span>` : ""}</div>`;
  const darkIcon = (n) => `<span style="display:inline-block;filter:invert(1) contrast(1.1)">${icon(n)}</span>`;
  const cnt = (n) => `<span class="r-inp r-sel" style="min-width:30px;height:16px;line-height:14px;font-size:10px;padding:0 3px">${n}</span>`;
  const iconCnt = (p, n, dark = false) => `<span style="display:inline-grid;justify-items:center;gap:1px;margin:0 3px 3px 0;vertical-align:top">${dark ? darkIcon(p) : icon(p)}${dark ? `<span style="display:inline-block;min-width:30px;height:15px;border:1px solid #777;background:#eee;color:#222;font-size:9.5px;line-height:13px;padding:0 3px">${n} ▾</span>` : cnt(n)}</span>`;
  const darkUrl = (u) => `<div style="height:22px;padding:0 10px;background:#f1f3f4;color:#333;font:11px/22px Consolas,monospace;border-bottom:1px solid #ccc">ⓘ ${u}</div>`;

  /* ── 바탕 1: 사건관리 목록(탭 화면) ── */
  const CASES = [
    ["00001-25-0649", "SCAS수사부-871", "주거침입", "대구청", "2025-03321", "동부서", "12 (12, 0)", "무", { st: [12, 0, 0], go: ["검색"] }],
    ["00001-25-0648", "SCAS수사부-754", "절도", "대전청", "2025-02078", "대덕서", "1 (1, 0)", "유", { st: [1, 0, 0], go: ["검색"] }],
    ["00001-25-0647", "SCAS수사부-2951", "절도", "경기남부청", "2025-11707", "평택서", "2 (2, 0)", "무", { st: [2, 0, 0], go: ["검색"] }],
    ["00001-25-0646", "SCAS수사부-2952", "주거침입", "경기남부청", "2025-11710", "평택서", "1 (1, 0)", "무", { st: [0, 0, 1], rs: [1, 0, 0], go: ["검색", "확인", "검증요청"] }],
    ["00001-25-0645", "SCAS수사부-704", "절도", "경남청", "2025-04201", "마산동부서", "2 (2, 0)", "무", { st: [2, 0, 0], go: ["검색"] }],
    ["00001-25-0644", "SCAS수사부-403", "절도", "충북청", "2025-01923", "청주흥덕서", "1 (1, 0)", "무", { st: [1, 0, 0], go: ["검색"] }],
    ["00001-25-0643", "SCAS수사부-380", "절도", "광주청", "2025-01552", "동부서", "1 (1, 0)", "무", { st: [0, 1, 0], go: ["검색", "확인"] }],
    ["00001-25-0642", "SCAS수사부-366", "기타", "인천청", "2025-02210", "미추홀서", "3 (3, 0)", "무", { st: [3, 0, 0], go: ["검색"] }],
    ["00001-25-0641", "SCAS수사부-351", "강도", "서울청", "2025-20114", "강서서", "2 (2, 0)", "유", { st: [2, 0, 0], go: ["검색"] }],
  ];
  const n = (v) => (v ? v : "");
  function listBase() {
    const row = (c, i) => {
      const x = c[8];
      const rs = x.rs || [0, 0, 0];
      return `<tr class="${i === 3 ? "sel" : ""}" data-go="${G}case" style="cursor:pointer">
        <td style="text-align:center">${i + 1}</td><td style="padding:2px">${img(34, 40, { kind: "scene", zones: [["dots", "grid", "herring"], ["tri", "wave", "blocks"], ["grid", "grid", "lines"]][i % 3] })}</td>
        <td>${c[0]}</td><td style="white-space:normal;width:70px;line-height:1.3">${c[1].replace("수사부-", "수사<br>부-")}</td><td>${c[2]}</td><td style="text-align:center;line-height:1.3">${c[3]}<br>${c[4]}</td>
        <td style="text-align:center;line-height:1.3">경찰청<br>범죄분석과</td><td>${c[5]}</td><td>현장</td><td>${c[6]}</td><td style="text-align:center">${c[7]}</td><td>2025-07-24</td><td></td><td></td><td></td>
        <td>박○○ ▾</td><td>${n(rs[0])}</td><td>${n(rs[1])}</td><td>${n(rs[2])}</td><td>${n(x.st[0])}</td><td>${n(x.st[1])}</td><td>${n(x.st[2])}</td>
        <td>${x.go.includes("검색") ? btn("검색", G + "pattern", "g") : ""}</td><td>${x.go.includes("확인") ? btn("확인", "sc-confirm", "g") : ""}</td><td>${x.go.includes("검증요청") ? btn("검증요청", "sc-verify", "n") : ""}</td></tr>`;
    };
    return `<div class="r-box" style="padding:6px 8px;margin-bottom:6px">
        <table><tbody>
          <tr><td class="l">감정번호</td><td>${inp("", 200)}</td><td class="l">문서번호</td><td>${inp("", 200)}</td><td class="l">사건명</td><td>${sel("전체", 160)}</td></tr>
          <tr><td class="l">등록일자</td><td>${inp("2025-06-25 📅", 96)} ~ ${inp("2025-07-24 📅", 96)}</td><td class="l">피해자</td><td>${inp("", 200)}</td><td class="l">구분</td><td>◉전체 ○신발 ○타이어</td></tr>
          <tr><td class="l">사건장소</td><td>${inp("", 200)}</td><td class="l">검거여부</td><td>${sel("전체", 200)}</td><td class="l">작성자</td><td>${inp("", 160)}</td></tr>
          <tr><td class="l">처리관서</td><td>${inp("경찰청", 150)} ${btn("검색", "", "b")}</td><td class="l">의뢰관서</td><td>${inp("", 150)} ${btn("검색", "", "b")}</td><td class="l">발생관서</td><td>${inp("", 110)} ${btn("검색", "", "b")}</td></tr>
          <tr><td class="l">사건결과</td><td>${sel("전체", 120)} ☐결과 확인 전</td><td class="l">타기관여부</td><td>${sel("전체", 200)}</td><td></td><td></td></tr>
        </tbody></table></div>
      ${bar("사건관리 목록", `<span style="font-weight:400;margin-right:6px">◉목록보기 ○문양보기</span>${btns(["초기화", "엑셀", "조회", ["등록", G + "case"]])}`)}
      <div class="r-box" style="overflow:hidden">
        <table style="width:auto;min-width:100%"><thead>
          <tr>${["순번", "이미지", "감정번호", "문서번호", "사건명", "의뢰관서<br>(SCAS번호)", "처리관서", "발생관서", "처리<br>구분", "개수", "용의자", "등록일자", "결과확인<br>완료일자", "사건<br>결과", "접수자", "작성자"].map((h) => `<th rowspan="2" style="line-height:1.3">${h}</th>`).join("")}
            <th colspan="3">결과</th><th colspan="3">진행상태 ▾</th><th rowspan="2">검색</th><th rowspan="2">확인</th><th rowspan="2">검증</th></tr>
          <tr>${["발<br>견", "불<br>발", "불<br>능", "등<br>록", "검<br>색", "확<br>인"].map((h) => `<th style="line-height:1.15;padding:2px 4px">${h}</th>`).join("")}</tr>
        </thead><tbody>${CASES.map(row).join("")}</tbody></table>
        <div style="height:12px;background:#f0f0f0;border-top:1px solid #ddd;position:relative"><span style="position:absolute;left:2px;top:2px;width:62%;height:8px;border-radius:4px;background:#c1c1c1"></span></div>
      </div>
      <div class="r-pg"><span>« ‹ 페이지 ${inp("1", 30)} / 9 › » ⟳</span><span>전체 116 중 1 - 14</span></div>`;
  }

  /* ── 레이어 1: 사건관리 팝업(S2) ── */
  function caseModal(box = "left:14px;top:6px;width:1180px;height:760px") {
    const L = (t, req) => `<td class="l ${req ? "req" : ""}">${t}${req ? "*" : ""}</td>`;
    const files = ["_1", "_10", "_11", "_12", "_2", "_3", "_4", "_5", "_6", "_7"];
    const kb = ["5900362", "6992910", "5120944", "4877120", "6012384", "5530211", "5310076", "4980544", "5021337", "5266103"];
    return `<div class="r-modal" style="${box}">
      ${bar("사건관리")}
      <div style="display:flex;justify-content:flex-end;padding:5px 8px 0">${btns([["이전"], ["다음"], ["사건복사"], ["수정"], ["닫기", G + "list"]])}</div>
      <div style="display:grid;grid-template-columns:25% minmax(0,1fr);gap:8px;padding:6px 8px">
        <div>
          ${bar("족윤적 이미지")}
          <div style="display:grid;place-items:center;height:250px;background:#8fb3f0" data-go="${G}cut" title="→ 이미지 커팅" >${img(230, 210, { kind: "scene", zones: ["blocks", "lines", "lines"], ruler: true })}</div>
          ${bar("이미지 목록", btns(["추가", "삭제"]), "margin-top:8px")}
          <table><thead><tr><th>파일명칭</th><th>파일크기</th></tr></thead><tbody>
            ${files.map((f, i) => `<tr class="${i === 4 ? "sel" : ""}"><td>00001-25-0649${f}.jpg</td><td style="text-align:right">${kb[i]}</td></tr>`).join("")}
          </tbody></table>
        </div>
        <div>
          ${bar("사건정보")}
          <table><tbody>
            <tr>${L("감정번호")}<td>${inp("00001-25-0649", 260, "ro")}</td>${L("문서번호")}<td>${inp("SCAS수사부-871", 260, "ro")}</td></tr>
            <tr>${L("SCAS사건번호")}<td>${inp("2025-03321", 160, "ro")}</td>${L("피해자 성명")}<td>${inp("", 260)}</td></tr>
            <tr>${L("의뢰관서", 1)}<td>☐타기관 ${sel("대구지방경찰청", 120)} ${sel("동부경찰서", 120)}</td>${L("출생년도")}<td>${inp("", 260)}</td></tr>
            <tr>${L("사건명", 1)}<td>${sel("주거침입", 160)}</td>${L("용의자 유무", 1)}<td>○유 ◉무</td></tr>
            <tr>${L("사건일시", 1)}<td style="line-height:1.9">&nbsp;&nbsp;&nbsp;시작 ${inp("2025-07-22 📅", 100)} ${sel("23", 36)} ${sel("00", 36)}<br>☑종료 ${inp("2025-07-23 📅", 100)} ${sel("06", 36)} ${sel("30", 36)}</td>${L("사건장소", 1)}<td style="line-height:1.9">${sel("주택", 120)} ${sel("단독주택", 120)}<br>${sel("", 244)}</td></tr>
            <tr>${L("발생관서", 1)}<td>${sel("대구지방경찰청", 120)} ${sel("동부경찰서", 120)}</td>${L("검거여부")}<td>${sel("수사중", 160)}</td></tr>
            <tr>${L("사건주소", 1)}<td>${inp("[주소]", 260)}</td>${L("감정의뢰 담당자")}<td>${inp("경사 박○○", 260)}</td></tr>
            <tr>${L("사건개요", 1)}<td colspan="3" style="white-space:normal;height:44px;vertical-align:top">피의자는 2025. 7. 22. 23:00경부터 7. 23. 06:30경 사이 [주소] 피해자 주거지에 침입하여 현금 등을 절취한 것임.</td></tr>
            <tr>${L("비고")}<td colspan="3">${inp("", 600)}</td></tr>
          </tbody></table>
          ${bar("현장 이미지 정보", btn("수정"), "margin-top:8px")}
          <table><tbody>
            <tr>${L("구분", 1)}<td>◉신발 ○타이어</td>${L("이미지 이름")}<td>${sel("00001-25-0649_2.jpg", 220)}</td></tr>
            <tr>${L("채취 일시", 1)}<td>☐ ${inp("2025-07-23 📅", 100)} ${sel("08", 36)} ${sel("40", 36)}</td>${L("채취자 계급", 1)}<td>☐ ${sel("경사", 160)}</td></tr>
            <tr>${L("채취 장소", 1)}<td>☐ ${sel("거실 바닥", 200)}</td>${L("채취자 이름", 1)}<td>☐ ${inp("박○○", 160)}</td></tr>
            <tr>${L("채취 방법", 1)}<td>☐ ${sel("기타", 200)}</td>${L("감정물 종류", 1)}<td>☐ ${sel("사진", 160)}</td></tr>
            <tr>${L("제조사")}<td>☐ ${sel("", 200)}</td>${L("족적 구분")}<td>☐ ◉좌 ○우 ○불상</td></tr>
            <tr>${L("상표")}<td>☐ ${sel("", 200)}</td>${L("굽 유무")}<td>☐ ◉유 ○무 ○불상</td></tr>
            <tr>${L("화종")}<td>☐ ${sel("", 200)}</td><td class="l"></td><td></td></tr>
          </tbody></table>
        </div>
      </div></div>`;
  }

  /* ── 레이어 1': 문양 상세보기 팝업(S4) ── */
  function patternModal(box = "left:6px;top:4px;width:1196px;height:770px") {
    const rowIcons = { 상: iconCnt("n21_05", "1") + iconCnt("n32_04", "9"), 중: iconCnt("n32_04", "1"), 하: "", 윤곽: "", 문자열: "" };
    const pal = ["n51_01"].concat(M.P.면.slice(1), M.P.사각.slice(1), M.P.삼각);
    return `<div class="r-modal" style="${box}">
      ${bar("문양 상세보기")}
      <div style="display:flex;justify-content:flex-end;padding:5px 8px 0">${btns([["인공지능문양관리", G + "ai-roi"], ["검색결과", G + "result"], ["검색", G + "result"], ["다시입력"], ["닫기", G + "list"]])}</div>
      <div style="display:grid;grid-template-columns:20% minmax(0,1fr) 25%;gap:8px;padding:6px 8px">
        <div>
          ${bar("현장 이미지")}
          <div style="display:grid;place-items:center;height:290px;background:#fff;border:1px solid #d5d9e2">${img(200, 280, { kind: "scene", zones: ["blocks", "grid", "lines"], ruler: true })}</div>
          ${bar("이미지 목록", "", "margin-top:6px")}
          <table><thead><tr><th>이미지 번호</th></tr></thead><tbody><tr class="sel"><td style="text-align:center">00001-25-0646_1</td></tr><tr><td style="height:22px"></td></tr><tr><td style="height:22px"></td></tr></tbody></table>
          ${bar("코드 설명", "", "margin-top:6px")}
          <div class="r-box" style="padding:6px;height:70px;white-space:normal;font-size:11px">${M.PDESC.n51_01}</div>
        </div>
        <div>
          ${bar("현장 이미지 문양")}
          <table><tbody>${["상", "중", "하", "윤곽", "문자열"].map((z) => `<tr><td class="l" style="width:54px;text-align:center">${z}</td><td style="height:${z === "문자열" ? 34 : 54}px;${z === "상" ? "outline:2px solid #e02424;outline-offset:-2px" : ""}">${rowIcons[z]}</td></tr>`).join("")}</tbody></table>
          <div class="r-bar" style="margin-top:6px;justify-content:flex-start;gap:16px;font-weight:400">${M.PCATS.map((t) => `<span style="${t === "면" ? "background:#fff;color:#2d3a8c;padding:0 8px;font-weight:700" : ""}">${t}</span>`).join("")}</div>
          <div class="r-box" style="display:flex;flex-wrap:wrap;gap:3px;padding:6px;height:150px;overflow:hidden">${pal.map((p) => icon(p)).join("")}</div>
          <div style="display:flex;gap:4px;padding:4px;background:#e9ecf3;border:1px solid #d5d9e2;border-top:0">${btn("규칙무늬", "", "b")}${btn("불규칙무늬")}</div>
        </div>
        <div>
          ${bar("매칭 조건")}
          <table><tbody>
            <tr><td class="l">검색구분</td><td style="white-space:normal">◉현장문양 ○동일범 ○ ○용의자문양</td></tr>
            <tr><td class="l">등록기간</td><td>${inp("2000-01-01 📅", 90)} ~ ${inp("2025-07-24 📅", 90)}</td></tr>
            ${["제조사", "상표", "화종"].map((t) => `<tr><td class="l">${t}</td><td>${inp("", 170)} ${btn("찾기", "", "b")}</td></tr>`).join("")}
            <tr><td class="l">성별</td><td>◉전체 ○남 ○여 ○혼용</td></tr>
            <tr><td class="l">굽유무</td><td>◉전체 ○유 ○무 ○불상</td></tr>
            <tr><td class="l">등록관서</td><td>${inp("", 170)} ${btn("찾기", "", "b")}</td></tr>
          </tbody></table>
          ${bar("검색이력", "", "margin-top:6px")}
          <table><thead><tr><th>검색번호</th><th>결과건수</th><th>검색방법</th><th>검색결과</th><th>검색일</th></tr></thead><tbody>
            <tr data-go="${G}result" style="cursor:pointer"><td>572415</td><td>481</td><td>현장문양검색</td><td>검색</td><td>2025-07…</td></tr>
            <tr data-go="${G}result" style="cursor:pointer"><td>572414</td><td>869</td><td>현장문양검색</td><td>검색</td><td>2025-07…</td></tr>
          </tbody></table>
        </div>
      </div></div>`;
  }

  /* ── 레이어 2: 문양검색결과 팝업(S7b) ── */
  const CAPS = ["1 | 49", "2 | 32", "3 | 32", "4 | 30", "5 | 25", "6 | 24", "7 | 24", "8 | 23"];
  const SZ = [["blocks", "grid", "lines"], ["lines", "lines", "blocks"], ["grid", "blocks", "grid"], ["wave", "lines", "wave"], ["tri", "blocks", "tri"], ["lines", "grid", "lines"], ["dots", "dots", "dots"], ["lines", "wave", "blocks"]];
  function resultModal(box = "left:80px;top:40px;width:960px;height:700px") {
    return `<div class="r-modal" style="${box}">
      ${bar("문양검색결과")}
      <div style="display:flex;align-items:center;gap:10px;padding:6px 10px;border-bottom:1px solid #d5d9e2">
        <span style="color:#666">이미지번호</span>${inp("00001-25-0646_1", 150, "ro")}
        <span style="margin-left:auto;color:#666">결과형태</span>${btns([["1열", "", "b"], ["2열", "", "b"], ["3열", "", "b"], ["4열", "", "b"], ["확인대상보기", "", "b"]])}</div>
      <div style="display:grid;grid-template-columns:25% minmax(0,1fr);gap:8px;padding:8px 10px">
        <div style="display:grid;place-items:center;height:560px;background:#fff;border:1px solid #d5d9e2">${img(210, 540, { kind: "scene", zones: ["blocks", "grid", "lines"], ruler: true })}</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;height:560px;overflow:hidden;padding-right:12px;border-right:10px solid #f0f0f0">
          ${CAPS.map((c, i) => `<div class="r-box" style="display:grid;grid-template-rows:1fr auto;padding:4px;cursor:pointer" data-go="${G}detail" title="→ 상세조회">${img(140, 236, { kind: "shoe", zones: SZ[i] })}<div style="text-align:center;font-size:11.5px;padding-top:2px">${c}</div></div>`).join("")}
        </div>
      </div>
      <div class="r-pg" style="padding:2px 12px"><span>« ‹ 페이지 ${inp("1", 30)} / 10 › » ⟳</span><span>전체 470 중 1 - 8</span></div>
    </div>`;
  }

  /* ── 레이어 3: 현장문양검색결과 상세조회(S8) ── */
  function detailModal(box = "left:150px;top:70px;width:900px;height:600px") {
    const info = [
      ["이미지번호", "00001-25-0646_1", "화류번호", "305659"], ["SCAS번호", "2025-11710", "제조사", "기타"], ["문서번호", "SCAS수사부-2952", "상표명", "기타"],
      ["의뢰관서", "경기남부청", "모델번호", ""], ["사건명", "주거침입", "화종", "운동화"], ["채취일시", "2025-07-19 00:00", "수집년도", "2025"],
      ["채취장소", "주방 바닥", "그룹명", ""], ["채취방법", "전사판채취법", "비고", "용의자신발"],
    ];
    return `<div class="r-modal" style="${box}">
      ${bar("현장문양검색결과 상세조회")}
      <div style="display:flex;justify-content:flex-end;padding:5px 8px 0">${btns([["이전"], ["다음"], ["그룹등록"], ["확인대상", G + "detail"], ["<span style='color:#bbb'>확인대상 제외</span>"], ["프린트"], ["닫기", G + "result"]])}</div>
      <div style="display:grid;grid-template-columns:30% 25% minmax(0,1fr);gap:6px;padding:6px 8px">
        <div>${bar("유류 이미지")}<div style="display:grid;place-items:center;height:330px;background:#fff;border:1px solid #d5d9e2" data-go="${G}viewer" title="→ 이미지 뷰어">${img(220, 320, { kind: "scene", zones: ["blocks", "grid", "lines"], ruler: true })}</div></div>
        <div>${bar("발견 이미지")}<div style="display:grid;place-items:center;height:330px;background:#fff;border:1px solid #d5d9e2" data-go="${G}viewer" title="→ 이미지 뷰어">${img(160, 320, { kind: "shoe", zones: SZ[0] })}</div></div>
        <div>${bar("측면 이미지")}<div class="r-ph" style="height:120px;border:1px solid #d5d9e2">측면 사진</div>
          <table style="margin-top:4px"><thead><tr><th colspan="2">사건정보</th><th colspan="2">신발정보</th></tr></thead><tbody>
            ${info.map((r) => `<tr><td class="l">${r[0]}</td><td>${r[1]}</td><td class="l">${r[2]}</td><td>${r[3]}</td></tr>`).join("")}
          </tbody></table></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:0 8px">
        <div class="r-box"><div style="text-align:center;color:#666;padding:3px;border-bottom:1px solid #d5d9e2">유류 이미지 문양</div><div style="display:flex;gap:6px;align-items:center;padding:6px"><span style="width:30px;color:#666">상</span>${["n32_04", "n21_05", "n32_09", "n31_02", "n72_01"].map((p) => icon(p)).join("")}</div></div>
        <div class="r-box"><div style="text-align:center;color:#666;padding:3px;border-bottom:1px solid #d5d9e2">발견 이미지 문양</div><div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:6px"><span style="width:30px;color:#666">상</span>${["n51_01", "n21_05", "n31_02", "n32_09", "n32_04", "n42_01"].map((p) => icon(p)).join("")}</div></div>
      </div></div>`;
  }

  /* ── 이미지 커팅 / 이미지 뷰어 OS 창 ── */
  const EDIT = ["처음상태", "평준화", "색상반전", "좌우반전", "밝게", "어둡게", "상하반전"];
  function cutWin(box) {
    return `<div class="r-os" style="${box}">
      <div class="tt"><span>👤 이미지 커팅</span></div>
      <div style="display:flex;align-items:center;gap:4px;padding:8px 10px">${btn("-")}${inp("100", 40)}${btn("+")}&nbsp;${btn("좌")}${inp("90", 34)}${btn("우")}
        <span style="margin-left:auto">${btns([["취소", G + "case"], ["확인"], ["저장", G + "case"]])}</span></div>
      <div style="position:relative;height:470px;margin:0 10px;background:#fff;border:1px solid #bbb;overflow:hidden">
        <div style="position:absolute;left:110px;top:20px;width:240px;height:430px;transform:rotate(-12deg)">${img(240, 430, { kind: "scene", zones: ["blocks", "lines", "lines"], ruler: true, bg: "#2a2014" })}</div>
        <div style="position:absolute;left:150px;top:24px;width:170px;height:420px;border-left:2px solid #e02424;border-right:2px solid #e02424"></div>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px">${EDIT.map((b) => btn(b)).join("")}</div>
    </div>`;
  }
  function viewerWin(box, cap, opts) {
    return `<div class="r-os" style="${box}">
      <div class="tt"><span>👤 이미지 뷰어</span></div>
      <div style="display:flex;align-items:center;gap:4px;padding:8px 10px">${btn("-")}${inp("288", 40)}${btn("+")}&nbsp;${btn("좌")}${inp("0", 34)}${btn("우")}<span style="margin-left:auto">${btn("닫기", G + "detail")}</span></div>
      <div style="position:relative;height:440px;margin:0 10px;background:#fff;border:1px solid #bbb;overflow:hidden;display:grid;place-items:center">${img(300, 430, opts)}
        <span style="position:absolute;left:6px;top:4px;color:#666;font-size:11px">${cap}</span>
        <span style="position:absolute;right:0;top:0;bottom:0;width:12px;background:#f0f0f0;border-left:1px solid #ddd"></span></div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;padding:10px">${EDIT.map((b) => btn(b)).join("")}</div>
    </div>`;
  }

  /* ── 다크 크롬 창(인공지능) ── */
  const darkHist = (h = 360) => `<div style="display:flex;justify-content:space-between;padding:6px 8px;background:#2a2e34;font-size:11px"><b style="font-weight:600">검색 이력</b><span>☰</span></div>
      <table style="font-size:10.5px"><thead><tr>${["검색 번호", "결과 건수", "검색 방법", "검색 결과", "검색 일"].map((t) => `<th style="background:#3b4048;color:#ddd;border-color:#555">${t}</th>`).join("")}</tr></thead></table>
      <div style="height:${h}px;background:#3b4048"></div>`;
  const darkPalette = (n) => {
    const tabs = [["면", "▨"], ["내부선", "≡"], ["삼각", "△"], ["사각", "□"], ["다각", "⬠"], ["원", "○"], ["항목", "⁂"]];
    const icons = M.P.면.slice(1).concat(M.P.사각.slice(1), M.P.삼각).slice(0, n);
    return `<div style="display:flex;gap:18px;padding:6px 10px;background:#2a2e34;font-size:11.5px">${tabs.map(([t, g], i) => `<span style="${i === 0 ? "color:#fff;font-weight:700" : "color:#bbb"}"><span style="color:${["#7ab0ff", "#e8c34a", "#4fd17a", "#5b8cff", "#e66", "#ccc", "#e8a24a"][i]}">${g}</span> ${t}</span>`).join("")}</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;padding:8px;background:#2f343b">${darkIcon("n51_01")}${icons.map(darkIcon).join("")}</div>`;
  };
  const SOLE_D =
    "M50 6C78 6 92 32 92 72C92 112 80 132 78 152C76 176 84 202 82 226C80 250 64 258 50 258C36 258 20 250 18 226C16 202 24 176 22 152C20 132 8 112 8 72C8 32 22 6 50 6Z";

  /* ════════════ 화면 등록(업무 순서) ════════════ */

  R.add({
    id: G + "list", group: "사건 감정", title: "사건관리 목록", ours: "S01", kind: "탭 화면", ref: "5613 02:00 · 10:04–11:45 · 16:37",
    render: () => R.win({ tabOn: "사건관리", treeOn: "사건관리", h: 860 }, listBase()),
    memo: [
      "열이 20개가 넘어 한 화면에 다 안 들어오고, 인터뷰 내내 좌우로 스크롤했다 (5613 16:37–17:07).",
      "결과(발견·불발·불능)·진행상태(등록·검색·확인) 머리글이 세로 두 글자이고, 숫자가 이미지 장수라는 설명이 화면에 없다 (5613 10:00).",
      "다음 할 일이 행 끝 버튼 색(초록 검색·확인, 남색 검증요청)으로만 보이고 단계마다 나타났다 사라진다 (5613 20:22).",
    ],
  });

  R.add({
    id: G + "case", group: "사건 감정", title: "사건관리 (사건 상세 팝업)", ours: "S02", kind: "레이어 팝업", ref: "5613 01:30–01:45 · 03:05 · 16:22 · 20:52",
    render: () => R.win({ tabOn: "사건관리", treeOn: "사건관리", h: H }, `${listBase()}${R.dim()}${caseModal()}`),
    memo: [
      "이미지 목록이 글자 순서라 12장 사건에서 _1, _10, _11, _12, _2 순으로 섞인다 (5613 16:22).",
      "의뢰관서·발생관서를 지방청 → 경찰서 드롭다운 2단으로 고른다. 현장 이미지 정보 칸 앞 ☐의 뜻이 화면에 없다 (5613 01:30).",
      "채취 방법이 「기타」로 와서 이미지마다 손으로 「전사판채취법」 등으로 고친다 (5613 02:56–03:24).",
    ],
  });

  R.add({
    id: G + "cut", group: "사건 감정", title: "이미지 커팅 (OS 창)", ours: "S03", kind: "OS 창", ref: "5613 00:00–01:25 · 02:20–02:55",
    render: () => R.win({ tabOn: "사건관리", treeOn: "사건관리", h: H }, `${listBase()}${R.dim()}${caseModal()}${cutWin("left:230px;top:40px;width:540px;height:640px")}`),
    memo: [
      "회전은 좌/우 버튼이나 각도 칸에 숫자(90 → 44)를 넣어서만 한다. 마우스로 돌리는 손잡이가 없다 (5613 00:48–01:18).",
      "브라우저 밖 Windows 창이라 사건관리 팝업 위에 겹쳐 뜨고, 보조 모니터로 끌어 둔 창이 여러 개 쌓인다 (5613 06:22 · 5614 0:00–2:30).",
      "버튼이 작고 회색이라 눌리는 버튼인지 구분이 어렵다 (5613 00:00).",
    ],
  });

  R.add({
    id: G + "pattern", group: "사건 감정", title: "문양 상세보기 (수동 코딩 팝업)", ours: "S04", kind: "레이어 팝업", ref: "5613 01:50 · 05:22–06:00 · 07:07 · 21:37",
    render: () => R.win({ tabOn: "사건관리", treeOn: "사건관리", h: H }, `${listBase()}${R.dim()}${patternModal()}`),
    memo: [
      "문양 탭 8개 × 하위 탭 × 수십 개 아이콘(약 30px)을 눈으로 찾아 하나씩 누른다 (5613 05:22–06:00).",
      "아이콘마다 개수를 드롭다운(0–9, 10이상)으로 일일이 고른다 (5613 05:52).",
      "「검색」을 누르면 「저장되었습니다」 알림이 뜨고, 결과는 「검색결과」 팝업을 다시 열어야 본다 (5613 07:07).",
      "하위 탭 판독: 「항목」 탭(영상에서 「황목」처럼 보임)은 항목 아이콘(마크·브랜드·숫자·문자) 분류로 보고 「항목」으로 적었다.",
    ],
  });

  R.add({
    id: G + "ai-roi", group: "사건 감정", title: "ShoePrintROI (AI 영역 지정)", ours: "S04", kind: "크롬 새 창(다크)", ref: "5613 03:40–03:58 · 23:07–23:22",
    render: () =>
      R.win(
        { tabOn: "사건관리", treeOn: "사건관리", h: H },
        `${listBase()}${R.dim()}${patternModal()}
        <div class="r-dark" style="left:60px;top:20px;width:1060px;height:740px">
          <div class="tt">ShoePrintROI - Chrome<span style="margin-left:auto;letter-spacing:6px;color:#666">— ☐ ✕</span></div>${darkUrl("10.14.43.6/kcsi/fts/ai/AIShoePrintROI.do")}
          <div style="display:grid;grid-template-columns:52% 1fr 32%;height:640px">
            <div style="position:relative;background:#111;display:grid;place-items:center">
              ${img(300, 560, { kind: "scene", zones: ["blocks", "grid", "lines"], ruler: true, bg: "#2a2014" })}
              <svg viewBox="0 0 114 264" style="position:absolute;left:50%;top:50%;width:300px;height:560px;transform:translate(-50%,-50%);overflow:visible">
                <path d="${SOLE_D}" fill="none" stroke="#3fd16b" stroke-width="1.2"/>
                <rect x="4" y="4" width="92" height="256" fill="none" stroke="#4a7dff" stroke-width=".8"/>
                ${[[4, 4], [50, 4], [96, 4], [4, 132], [96, 132], [4, 260], [50, 260], [96, 260]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#4a7dff"/>`).join("")}
                <text x="46" y="48" fill="#fff" font-size="7">상</text><text x="46" y="136" fill="#fff" font-size="7">중</text><text x="46" y="222" fill="#fff" font-size="7">하</text>
              </svg>
            </div>
            <div style="display:grid;place-items:center;background:#2f343b">${btn("인공지능 분석 시작", G + "ai-pattern", "b")}</div>
            <div style="background:#2f343b;border-left:1px solid #222">${darkHist(500)}</div>
          </div>
          <div style="position:absolute;right:12px;bottom:12px;display:flex;gap:6px">${btn("검색이력 저장")}${btn("검색결과 보기", G + "ai-result", "b")}</div>
        </div>`
      ),
    memo: [
      "「인공지능문양관리」를 누르면 SCAS 화면과 다른 다크 테마의 크롬 새 창이 문양 상세보기 위에 뜬다. 처음엔 흰 화면으로 한참 로딩한다 (5613 23:07).",
      "족적 위의 초록 윤곽과 파란 조절점 8개로 영역을 맞추고 상·중·하로 기울일 수 있다 (5613 03:52–04:00).",
    ],
  });

  R.add({
    id: G + "ai-pattern", group: "사건 감정", title: "인공지능 문양 상세 보기", ours: "S04", kind: "크롬 새 창(다크)", ref: "5613 04:07–04:52 · 12:37",
    render: () => {
      const rows = { 상: ["n21_02", "n21_05", "n51_03", "n51_02", "n32_09", "n32_02", "n32_04", "n72_01", "n62_03", "n51_04", "n62_05", "n72_02", "n32_04"], 중: ["n32_09", "n51_05"], 하: ["n32_09"] };
      const cnts = { 상: ["1", "1", "6", "9", "8", "1", "1", "1", "1", "1", "1", "1", "1"], 중: ["1", "1"], 하: ["1"] };
      return R.win(
        { tabOn: "사건관리", treeOn: "사건관리", h: H },
        `${listBase()}${R.dim()}${patternModal()}
        <div class="r-dark" style="left:30px;top:10px;width:1150px;height:760px">
          <div class="tt">인공지능 문양 상세 보기 - Chrome<span style="margin-left:auto;letter-spacing:6px;color:#666">— ☐ ✕</span></div>${darkUrl("10.14.43.6/kcsi/fts/ai/AIShoePrintPattern.do")}
          <div style="text-align:center;padding:6px;font-size:13px;background:#2a2e34">인공지능 문양 상세 보기</div>
          <div style="display:grid;grid-template-columns:25% 1fr 25%;height:620px">
            <div style="padding:6px;background:#2f343b">
              <div style="display:flex;justify-content:space-between;align-items:center;font-size:11.5px">(현장) 이미지<span style="padding:1px 10px;border-radius:999px;background:#3c6fe0;color:#fff">AI 분석🔍</span></div>
              <div style="position:relative;height:360px;margin-top:4px;display:grid;place-items:center;background:#111">${img(200, 350, { kind: "scene", zones: ["blocks", "grid", "lines"], ruler: true, bg: "#2a2014" })}
                ${[["#3fd16b", 70, 30, 70, 40], ["#e04848", 60, 80, 40, 50], ["#e8c34a", 110, 90, 40, 50], ["#4a7dff", 120, 160, 40, 60], ["#3fd16b", 70, 220, 60, 90]].map(([c, x, y, w, h]) => `<span style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;border:1.5px solid ${c}"></span>`).join("")}
                <span style="position:absolute;left:6px;bottom:2px;font-size:34px;font-weight:700;color:#fff">100%</span></div>
              <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:11.5px">이미지 목록<span>☰ ▦</span></div>
              <div style="display:flex;gap:8px;align-items:center;margin-top:4px;padding:6px;background:#3c6fe0">${img(20, 30, { kind: "scene" })}00001-25-0646_1</div>
            </div>
            <div style="background:#2f343b;border-left:1px solid #222;border-right:1px solid #222">
              <div style="padding:6px 8px;font-size:11.5px">현장 이미지 문양</div>
              ${["상", "중", "하"].map((z) => `<div style="display:grid;grid-template-columns:44px 1fr;border-top:1px solid #444;min-height:${z === "상" ? 120 : 80}px"><div style="display:grid;place-items:center;background:#3b4048">${z}</div><div style="padding:6px">${rows[z].map((p, i) => iconCnt(p, cnts[z][i], true)).join("")}</div></div>`).join("")}
              ${darkPalette(40)}
            </div>
            <div style="background:#2f343b">${darkHist(520)}</div>
          </div>
          <div style="position:absolute;right:12px;bottom:12px;display:flex;gap:6px">${btn("검색이력 저장")}${btn("검색결과 보기", G + "ai-result", "b")}</div>
        </div>`
      );
    },
    memo: [
      "AI가 상·중·하 문양을 채우지만 윤곽은 못 잡고, 엉뚱한 문양도 많이 잡는다 (5613 04:10–04:34).",
      "왼쪽 아래 큰 숫자 「100%」가 진행률인지 신뢰도인지 화면에 설명이 없다. 「후보군 저장 중 70%」, 「로딩 중… 10%」 진행창이 따로 뜬다 (5613 04:52 · 12:37).",
      "본 화면(흰색)과 테마가 다르고 창이 하나 더 늘어난다 (5613 04:07).",
    ],
  });

  R.add({
    id: G + "ai-result", group: "사건 감정", title: "인공지능 문양 검색 결과", ours: "S05", kind: "크롬 새 창(다크)", ref: "5613 04:54–05:07",
    render: () =>
      R.win(
        { tabOn: "사건관리", treeOn: "사건관리", h: H },
        `${listBase()}${R.dim()}${patternModal()}
        <div class="r-dark" style="left:30px;top:10px;width:1150px;height:760px">
          <div class="tt">인공지능 문양 검색 결과 - Chrome<span style="margin-left:auto;letter-spacing:6px;color:#666">— ☐ ✕</span></div>${darkUrl("10.14.43.6/kcsi/fts/ai/AISearchResult.do")}
          <div style="text-align:center;padding:6px;font-size:13px;background:#2a2e34">인공지능 문양 검색 결과</div>
          <div style="display:grid;grid-template-columns:25% 1fr;gap:8px;height:610px;padding:6px 8px">
            <div><div style="font-size:11.5px;margin-bottom:4px">(현장) 이미지</div><div style="display:grid;place-items:center;height:580px;background:#111">${img(240, 570, { kind: "scene", zones: ["blocks", "grid", "lines"], ruler: true, bg: "#2a2014" })}</div></div>
            <div>
              <div style="display:flex;align-items:center;gap:8px;font-size:11.5px"><span>발견 이미지</span><span style="margin-left:auto">□ ▦ ▦ <b>▦</b></span></div>
              <div style="text-align:right;font-size:11px;margin:2px 0 4px">이진화 이미지 ○</div>
              <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">
                ${SZ.map((z, i) => `<div style="position:relative;display:grid;place-items:center;height:268px;background:#1d2024;border:1px solid #444">${img(120, 250, { kind: "shoe", zones: z })}<span style="position:absolute;left:6px;bottom:4px;font-size:10.5px">${i + 1} /857</span></div>`).join("")}
              </div>
            </div>
          </div>
          <div style="position:absolute;left:0;right:0;bottom:12px;text-align:center;font-size:13px;letter-spacing:6px">« ‹ 1/108 › »</div>
          <div style="position:absolute;right:12px;bottom:10px">${btn("확인대상 보기", "", "b")}</div>
        </div>`
      ),
    memo: [
      "AI 결과(다크 크롬 창)와 일반 결과(흰 레이어 팝업)가 다른 창이라 둘을 오가며 본다 (5613 05:07 vs 07:22).",
      "순위 표기 「1 /857」, 페이지 「1/108」이 일반 결과의 「1 | 49」, 「전체 470」과 다르다 (5613 05:07).",
    ],
  });

  R.add({
    id: G + "result", group: "사건 감정", title: "문양검색결과 (결과 팝업)", ours: "S05", kind: "레이어 팝업", ref: "5613 07:22 · 09:47–09:52",
    render: () => R.win({ tabOn: "사건관리", treeOn: "사건관리", h: H }, `${listBase()}${R.dim()}${patternModal()}${R.dim()}${resultModal()}`),
    memo: [
      "카드 캡션 「1 | 49」가 순위와 점수라는 설명이 없다. 한 쪽에 8장씩, 몇천 장이면 페이지를 수백 번 넘긴다 (5613 07:22 · 22:18–22:48).",
      "어디까지 봤는지 화면이 기억하지 않는다. 애매한 사건은 처음부터 끝까지 본다 (5613 22:28).",
      "문양 상세보기 팝업 위에 겹쳐 떠서 뒤 화면이 회색으로 비친다 (5613 07:22).",
    ],
  });

  R.add({
    id: G + "detail", group: "사건 감정", title: "현장문양검색결과 상세조회 + 확인대상 알림", ours: "S06", kind: "레이어 팝업", ref: "5613 08:52–09:20 · 17:22 · 24:07",
    render: () =>
      R.win(
        { tabOn: "사건관리", treeOn: "사건관리", h: H },
        `${listBase()}${R.dim()}${patternModal()}${R.dim()}${resultModal()}${R.dim()}${detailModal()}
        <div class="r-alert" style="left:450px;top:320px">${bar("알림")}<div class="msg">확인대상에 등록하시겠습니까?</div><div class="ft">${btn("예", G + "result", "b")}${btn("아니오")}</div></div>`
      ),
    memo: [
      "팝업 위에 팝업이 3겹(문양 상세보기 → 문양검색결과 → 상세조회)으로 쌓이고, 여기서 이미지를 누르면 뷰어 창까지 4겹이 된다 (5613 07:37 · 18:30).",
      "확인대상 하나를 넣을 때마다 「확인대상에 등록하시겠습니까?」 알림에서 「예」를 누른다 (5613 09:20).",
      "버튼 판독: 「확인대상」 옆 흐린 버튼은 인터뷰의 「확인대상 제외」(5613 09:20)로 보고 그렇게 적었다.",
    ],
  });

  R.add({
    id: G + "viewer", group: "사건 감정", title: "이미지 뷰어 (OS 창 2개 나란히)", ours: "S03", kind: "OS 창", ref: "5613 06:02–06:44 · 07:37 · 18:30",
    render: () =>
      R.win(
        { tabOn: "사건관리", treeOn: "사건관리", h: H },
        `${listBase()}${R.dim()}${patternModal()}${R.dim()}${resultModal()}${R.dim()}${detailModal()}
        ${viewerWin("left:120px;top:20px;width:440px;height:600px", "유류 이미지", { kind: "bin", zones: ["blocks", "grid", "lines"], ruler: true })}
        ${viewerWin("left:600px;top:60px;width:440px;height:600px", "발견 이미지", { kind: "shoe", zones: SZ[0] })}`
      ),
    memo: [
      "유류·발견 이미지를 더블클릭해 뷰어 창을 따로 띄우고 손으로 나란히 놓는다. 확대·이동이 따로 움직인다 (5613 06:02–06:08 · 18:30).",
      "뷰어에서 밝기·평준화·반전은 다 되지만 보기용이라 저장하지 않는다(「원본이기 때문에」). 바꾼 그림으로 AI 추출을 다시 할 수는 없다 (5613 07:48–08:38).",
    ],
  });
})();
