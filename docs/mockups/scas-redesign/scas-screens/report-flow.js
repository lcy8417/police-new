/* SCAS 재현 — 결과·검증·감정서 흐름 (영상 IMG_5613 13:46–19:37)
   sc-confirm 검색결과 확인(S12) → sc-verify 족윤적 검증 탭(S16) → sc-report-list 감정서작성 탭(S13)
   → sc-report-doc 결재문서정보(S14) → sc-hwp 한글 편집기(S15) → sc-approve 결재 대기함 탭(S17)
   순서는 인터뷰 업무 순서(결과확인완료 → 교차 검증 → 감정서 작성 → 결재, 5613 17:34–19:36). 사람 이름·주소는 가림. */
(function () {
  const { btn, btns, inp, sel, img } = R;
  const G = "결과·검증·감정서";

  /* ── 공통 바탕 ── */
  const cal = (v = "", w = 96) => `${inp(v, w)} <span style="color:#8a90a0">📅</span>`;
  const pg = (total, from, to, pages = 1) =>
    `<div class="r-pg"><span>«&nbsp; ‹ &nbsp;페이지 ${inp("1", 30)} / ${pages}&nbsp; › &nbsp;» &nbsp;⟳</span><span>전체 ${total} 중 ${from} - ${to}</span></div>`;

  /* 사건관리 목록(검색결과 확인 팝업 뒤에 깔림) — 간략 */
  function caseListBg() {
    const rows = Array.from({ length: 16 }, (_, i) => {
      const n = 35 - i;
      return `<tr><td>${i + 15}</td><td><span class="r-ph" style="width:22px;height:26px"></span></td><td>00001-25-06${String(n).padStart(2, "0")}</td><td>SCAS수사부-${700 + i * 53}</td>
        <td>${["절도", "주거침입", "절도", "재물손괴"][i % 4]}</td><td>${["서울청", "경기남부청", "강원청", "대구청"][i % 4]} 2025-0${2 + (i % 3)}${(915 + i * 7) % 1000}</td><td>경찰청 범죄분석과</td>
        <td>${["용산서", "파주서", "홍천서", "중부서"][i % 4]}</td><td>현장</td><td>1 (1, 0)</td><td>무</td><td>2025-07-${String(23 - (i >> 1)).padStart(2, "0")}</td><td></td><td></td></tr>`;
    }).join("");
    return `<div class="r-box" style="padding:6px;margin-bottom:6px"><table><tbody>
        <tr><td class="l">감정번호</td><td>${inp("", 160)}</td><td class="l">문서번호</td><td>${inp("", 160)}</td><td class="l">사건명</td><td>${sel("전체", 120)}</td></tr>
        <tr><td class="l">등록일자</td><td>${cal("2025-06-25")} ~ ${cal("2025-07-24")}</td><td class="l">피해자</td><td>${inp("", 160)}</td><td class="l">구분</td><td>◉전체 ○신발 ○타이어</td></tr>
      </tbody></table></div>
      <div class="r-bar">사건관리 목록 ${btns(["초기화", "엑셀", "조회", "등록"])}</div>
      <div class="r-box"><table><thead><tr><th>순번</th><th>이미지</th><th>감정번호</th><th>문서번호</th><th>사건명</th><th>의뢰관서 (SCAS번호)</th><th>처리관서</th><th>발생관서</th><th>처리 구분</th><th>개수</th><th>용의자</th><th>등록일자</th><th>결과확인 완료일자</th><th>사건 결과</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  /* 감정서작성 탭 본문(감정 작성 대기 목록) — sc-report-list 와 그 위 팝업들의 바탕 */
  const WAIT = [
    ["00001-25-0640", "SCAS수사부-2815", "절도", "경기도남부경찰청", "2025-07-06", "2025-07-21"],
    ["00001-25-0602", "SCAS형사과-211", "절도", "제주특별자치도경찰청", "2025-06-23", "2025-07-10"],
    ["00001-25-0601", "SCAS수사부-1742", "절도", "충청남도경찰청", "2025-06-24", "2025-07-10"],
    ["00001-25-0600", "SCAS수사부-2630", "주거침입", "경기도남부경찰청", "2025-06-23", "2025-07-10"],
    ["00001-25-0598", "SCAS수사부-352", "기타", "광주광역시경찰청", "2025-06-18", "2025-07-10"],
    ["00001-25-0581", "SCAS수사부-664", "주거침입", "대전광역시경찰청", "2025-06-20", "2025-07-02"],
  ];
  function reportListInner() {
    const rows = WAIT.map(
      (r, i) => `<tr class="${i === 0 ? "sel" : ""}">${r.map((c) => `<td style="text-align:center">${c}</td>`).join("")}<td style="text-align:center">결재 중</td>
        <td style="text-align:center">${btn("감정서", "sc-report-doc", "b")}</td><td></td><td style="text-align:center">${btn("결재회수", "", "r")}</td></tr>`
    ).join("");
    return `<div class="r-box" style="padding:6px;margin-bottom:6px"><table><tbody>
        <tr><td class="l">감정번호</td><td>${inp("", 200)}</td><td class="l">문서번호</td><td>${inp("", 200)}</td></tr>
        <tr><td class="l">등록일자</td><td>${cal("2025-03-01")} ~ ${cal("2025-07-24")}</td><td class="l">사건명</td><td>${sel("전체", 200)}</td></tr>
        <tr><td class="l">의뢰관서</td><td>${inp("", 200)} ${btn("검색", "", "b")}</td><td class="l"></td><td></td></tr>
        <tr><td class="l">처리관서</td><td>${inp("경찰청", 200)} ${btn("검색", "", "b")}</td><td class="l"></td><td></td></tr>
      </tbody></table></div>
      <div class="r-bar">감정서 작성 대기 목록</div>
      <div style="display:flex;justify-content:flex-end;padding:4px 0">${btns(["엑셀", "조회", "초기화"])}</div>
      <div class="r-box"><table><thead><tr><th>감정번호</th><th>문서번호</th><th>사건명</th><th>의뢰관서</th><th>발생일</th><th>등록일</th><th>감정의뢰 진행</th><th>감정서</th><th style="width:22%">출지</th><th>결재</th></tr></thead><tbody>${rows}</tbody></table></div>
      ${pg(6, 1, 6)}`;
  }

  /* ───────── S12 검색결과 확인 (레이어 팝업) ───────── */
  function confirm() {
    const thB = "background:#6f8fe0;color:#fff;border-color:#6f8fe0";
    const block = (no, rows, cands, on, h) => `
      <div style="display:grid;grid-template-columns:120px minmax(0,1fr) 360px;gap:6px 10px;padding:8px 10px">
        <span style="font-size:11.5px">${no}</span>
        <div style="display:flex;justify-content:space-between;align-items:center"><span>☑ 전체선택</span><span>검색방법 <span class="r-inp r-sel" style="min-width:150px;background:#e3f6ea">전체</span></span></div>
        <div style="display:flex;justify-content:space-between;align-items:center"><span>${["발견", "불발견", "감정불능"].map((v) => (v === on ? `◉ ${v}` : `○ ${v}`)).join("&nbsp; ")}</span>${btn("결과확인완료", "sc-verify")}</div>
        ${img(100, h, { kind: "scene", zones: ["herring", "grid", "tri"], ruler: true, bg: "#2a2d33" })}
        <div><table><thead><tr><th style="${thB}">☐</th><th style="${thB}">검색번호</th><th style="${thB}">검색방법</th><th style="${thB}">진행상태</th><th style="${thB}">결과수</th><th style="${thB}">검색일</th></tr></thead>
          <tbody>${rows.map((r) => `<tr><td style="border:0">☑</td>${r.map((c) => `<td style="border:0;text-align:center">${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
        <div class="r-box" style="display:flex;gap:8px;align-items:flex-start;padding:6px;height:${h}px;overflow:hidden">${cands}</div>
      </div>`;
    const cand = (z) => `<div style="display:grid;gap:2px;justify-items:center" data-go="sc-detail" title="→ sc-detail">${img(44, 70, { kind: "shoe", zones: z, bg: "#ffffff" })}<span>☐ 제외</span></div>`;
    const modal = `<div class="r-modal" style="left:40px;top:12px;width:1130px;height:800px">
        <div class="r-bar">검색결과 확인</div>
        <div style="padding:8px"><table><tbody>
          <tr><td class="l">감정번호</td><td>00001-25-0633</td><td class="l">범죄명</td><td>절도</td><td class="l">의뢰관서</td><td>서울특별시경찰청</td><td class="l">범행장소</td><td>공사 현장 사무실</td></tr>
          <tr><td class="l">문서번호</td><td>SCAS수사부-3571</td><td class="l">용의자유무</td><td>무</td><td class="l">시작</td><td>2025-07-01 21:04:00</td><td class="l">종료</td><td>2025-07-02 06:30:00</td></tr>
          <tr><td class="l">범행주소</td><td colspan="7">[주소]</td></tr>
          <tr><td class="l">사건개요</td><td colspan="7" style="white-space:normal;height:44px;vertical-align:top">피의자는 2025. 7. 1. 21:04 ~ 7. 2. 06:30경 [주소] 공사 현장의 임시 사무실 용도로 사용 중인 컨테이너의 방범 창을 … 내부에 있던 물품 등을 분해하여 절취한 것임.</td></tr>
        </tbody></table></div>
        <div class="r-bar">검색이력</div>
        ${block(
          "00001-25-0633_1",
          [["572355", "현장문양검색", "확인대상선정", "1/2355", "2025-07-23 09:42:14"], ["572354", "현장문양검색", "확인대상선정", "1/1085", "2025-07-23 09:38:59"]],
          cand(["dots", "grid", "blocks"]),
          "발견",
          120
        )}
        ${block("00001-25-0633_2", [["572356", "현장문양검색", "확인대상선정", "1/2355", "2025-07-23 09:44:43"]], cand(["dots", "grid", "blocks"]), "발견", 120)}
      </div>
      <div class="r-alert" style="left:470px;top:330px"><div class="r-bar">알림</div><div class="msg">확인대상을 저장하시겠습니까?</div><div class="ft">${btn("예", "", "b")}${btn("아니오", "", "b")}</div></div>`;
    return R.win({ tabOn: "사건관리", treeOn: "사건관리", h: 920 }, caseListBg() + R.dim() + modal);
  }

  /* ───────── S16 족윤적 검증 (탭) ───────── */
  function verify() {
    const rows = [
      ["00001-25-0619", "서울청", "2025-07-15", "김○○"],
      ["00001-25-0618", "경기남부청", "2025-07-15", "김○○"],
      ["00001-25-0620", "경기남부청", "2025-07-15", "김○○"],
      ["00001-25-0589", "경남청", "2025-07-09", "김○○"],
      ["00001-25-0566", "강원청", "2025-07-02", "박○○"],
      ["00001-25-0565", "경기남부청", "2025-07-02", "박○○"],
      ["00001-25-0564", "충북청", "2025-07-02", "박○○"],
    ].map(
      ([no, req, at, who]) => `<tr><td style="text-align:center">${no}</td><td style="text-align:center">0</td><td style="text-align:center">${at}</td><td style="text-align:center">${req}</td><td style="text-align:center">${who}</td><td style="text-align:center">발견</td>
        <td style="text-align:center">${btn("확인", "sc-detail", "n")} ${btn("검증결과", "sc-report-list", "n")}</td></tr>`
    ).join("");
    return R.win(
      { tabOn: "족윤적 검증", treeOn: "족윤적 검증", h: 820 },
      `<div class="r-box" style="padding:6px;margin-bottom:6px;display:flex;gap:6px;align-items:center">${cal("", 110)} ~ ${cal("2025-07-24", 110)} ${btn("조회", "", "b")}</div>
      <div class="r-bar">&nbsp;</div>
      <div class="r-box"><table style="width:72%"><thead><tr><th>감정번호</th><th>대조번호/용의자번호</th><th>접수일자</th><th>의뢰관서</th><th>작성자</th><th>사건결과</th><th>검증결과확인</th></tr></thead><tbody>${rows}</tbody></table>
        <div style="height:250px"></div></div>
      ${pg(7, 1, 7)}`
    );
  }

  /* ───────── S13 감정서작성 (탭) ───────── */
  function reportList() {
    return R.win({ tabOn: "감정서작성", treeOn: "감정서관리 ▸", h: 820 }, reportListInner());
  }

  /* ───────── S14 결재문서정보 (레이어 팝업 + 문서 뷰어) ───────── */
  function docPage() {
    const s = "margin:5px 0 2px;font-size:12.5px";
    return `<div style="position:relative;background:#fff;border:6px double #9fb7d8;padding:16px 28px;font-size:11px;color:#222;line-height:1.55">
        <div style="position:absolute;inset:80px 140px auto auto;width:260px;height:260px;border-radius:50%;border:2px solid #edf0f5;color:#edf0f5;display:grid;place-items:center;font-size:28px;font-weight:700">경찰청</div>
        <div style="display:grid;grid-template-columns:1fr 180px 150px;align-items:center;border-bottom:1px solid #333;padding-bottom:6px">
          <div style="text-align:center"><b style="font-size:16px;letter-spacing:.3em">경 찰 청</b><div style="color:#555">[주소] (Tel: 02-[번호])</div></div>
          <div style="text-align:center;border-left:1px solid #999;border-right:1px solid #999">감정서번호 : 00001-25-0602<div>1/1</div></div>
          <div style="display:flex;gap:6px;justify-content:center"><span style="padding:6px 8px;border:1px solid #2b5aa8;border-radius:50%;color:#2b5aa8;font-size:9px">ILAC-MRA</span><span style="padding:6px 8px;border:1px solid #2b5aa8;border-radius:50%;color:#2b5aa8;font-size:9px">KOLAS</span></div>
        </div>
        <div style="${s}">1. 의뢰 관서 : 제주특별자치도경찰청</div>
        <div style="display:flex;justify-content:space-between;${s}"><span>2. 감정물</span><span style="font-size:11px">SCAS사건번호 : SCAS 2025-00994</span></div>
        <div style="display:flex;justify-content:space-between;padding-left:14px"><span>1.00001-25-0602_1.jpg(4c1e9a7f03b25d68e9a1c4f70b2d93e6a815c7d2)</span><span>문서번호 : SCAS형사과-211</span></div>
        <div style="${s}">3. 감정 방법 : 윤적감정방법 지침서(KPSI-KQI-305 : 2022)</div>
        <div style="padding-left:14px;color:#333">감정대상 족윤적 자료를 사진 촬영하여 코딩값(조건값)을 족윤적감정시스템에 입력 후, 감정 대상 족윤적과 등록된 족윤적 자료의 문양, 특징점의 위치를 비교 관찰하여 동일문양 여부를 판단 감정함.</div>
        <div style="${s}">4. 감정 장소 : [주소]</div>
        <div style="${s}">5. 감정 기간 : 2025.07.10 ~</div>
        <div style="${s}">6. 시험 환경 : 온도 (24 ± 5) ℃ &nbsp;&nbsp; 습도 70 % R.H. 이하</div>
        <div style="${s}">7. 감정 결과</div>
        <table style="margin:2px 0 2px 14px;width:calc(100% - 14px)"><thead><tr><th>연번</th><th>검색구분</th><th>감정물</th><th>채취장소</th><th>감정결과</th><th>발견상표</th><th>비고</th></tr></thead>
          <tbody><tr><td>1</td><td>현장문양검색</td><td>사진촬영법 1 건</td><td>[장소]</td><td>불발견</td><td></td><td></td></tr></tbody></table>
        <div style="padding-left:14px">끝.</div>
        <div style="${s}">8. 비고</div>
        <div style="padding-left:14px">현장에 유류된 족(윤)적 사진으로 용의자 수사에 참고</div>
        <div style="display:flex;justify-content:flex-end;gap:0;margin-top:10px">${["감정관", "감정관", "기술책임자"].map((r) => `<div style="width:88px;border:1px solid #999;text-align:center"><div style="border-bottom:1px solid #999;background:#f3f4f7">${r}</div><div style="height:34px"></div></div>`).join("")}</div>
        <div style="margin-top:14px;padding-top:8px;border-top:1px dashed #bbb;font-size:10px;color:#444">위 감정서는 국제시험기관인정협력체(International Laboratory Accreditation Cooperation) 상호인정협정(Mutual Recognition Arrangement)에 서명한 한국인정기구(KOLAS)로부터 공인받은 분야에 대한 감정결과입니다. 상기 내용은 의뢰자가 제공한 감정물에 대한 결과이고, 감정서에 직인이 없는 경우 무효이며, KS Q ISO/IEC 17025의 KOLAS 인정과 관련 있음.</div>
        <div style="display:flex;justify-content:center;align-items:center;gap:30px;margin-top:12px"><span>한국인정기구 인정</span><b style="font-size:18px;letter-spacing:.4em">경찰청장</b><span style="display:grid;place-items:center;width:54px;height:54px;border:3px solid #c0272d;color:#c0272d;font-weight:700;font-size:11px;line-height:1.1;text-align:center">경찰청<br>장의인</span></div>
        <div style="text-align:center;margin-top:6px;letter-spacing:.06em">Commissioner General of Korean National Police Agency</div>
        <div style="display:flex;justify-content:space-between;margin-top:10px;color:#555"><span>KPSI-KQP-16-F05 (REV.03)</span><span>경찰청 범죄분석과</span></div>
      </div>`;
  }
  function docModal(top = 30, left = 150) {
    return `<div class="r-modal" style="left:${left}px;top:${top}px;width:900px;height:760px">
        <div class="r-bar">결재문서정보</div>
        <div style="margin:8px;border:1px solid #c8ccd6">
          <div style="display:flex;gap:10px;align-items:center;height:32px;padding:0 10px;background:#f3f4f7;border-bottom:1px solid #d5d9e2;font-size:13px;color:#555">
            <span title="저장">💾</span><span title="인쇄">🖨</span><span style="color:#ccc">|</span><span>⏫</span><span>⏶</span><span style="color:#bbb">⏷</span><span style="color:#bbb">⏬</span>
            ${inp("2", 28)}<span style="font-size:11.5px">/ 2</span><span>🔍−</span><span>🔍+</span>${sel("100%", 60)}
            <span style="margin-left:auto;font-size:11px;color:#666">배포용 다운로드</span></div>
          <div style="height:470px;overflow:hidden;background:#e6e8ec;padding:10px 40px">${docPage()}</div>
          <div style="display:flex;justify-content:space-between;padding:2px 8px;background:#f3f4f7;border-top:1px solid #d5d9e2;font-size:10.5px;color:#666">
            <span>준비 &nbsp;&nbsp; 메시지</span><span>이미지: (속성편집=불가능), (이동=불가능), (입력=불가능), (링크=불가능)</span><span>2/2</span></div>
        </div>
        <div class="r-bar" style="margin:0 8px">첨부파일 목록 <span>▾</span></div>
        <div style="margin:0 8px"><table><thead><tr><th style="width:40px">순번</th><th>첨부 문서</th><th>파일 명칭</th><th style="width:90px">파일 크기</th></tr></thead>
          <tbody><tr><td style="text-align:center">1</td><td style="background:#fff6c8"></td><td style="background:#fff6c8;text-align:center" data-go="sc-hwp" title="→ sc-hwp">족윤적 감정서 출지</td><td></td></tr></tbody></table></div>
      </div>`;
  }
  function reportDoc() {
    return R.win({ tabOn: "감정서작성", treeOn: "감정서관리 ▸", h: 900 }, reportListInner() + R.dim() + docModal());
  }

  /* ───────── S15 한글 문서 편집기 (OS 창, 감정서 이미지 페이지) ───────── */
  function hwp() {
    const lab = "background:#e3e6f0;text-align:center;font-size:13px;padding:8px;color:#333";
    const infoRows = [["화류번호", "275178"], ["화종", "슬리퍼"], ["상표", "기타"], ["모델번호", ""], ["성별", "남자"], ["수집년도", "2021년7월"], ["비고", ""]]
      .map(([k, v]) => `<tr><td style="background:#e3e6f0;text-align:center;width:42%;height:30px">${k}</td><td style="text-align:center">${v}</td></tr>`)
      .join("");
    const block = `<table style="table-layout:fixed;font-size:12px;margin-bottom:16px"><tbody>
        <tr><th style="${lab}">유류이미지</th><th style="${lab}">발견이미지</th></tr>
        <tr><td style="height:250px;text-align:center;vertical-align:top;padding:8px">${img(240, 190, { kind: "scene", zones: ["dots", "grid", "lines"], ruler: true, bg: "#2a2d33" })}
            <div style="font-style:italic;font-size:12px;margin-top:4px">00001-25-0640_1.jpg</div><div style="font-style:italic;font-size:11px;color:#444">(5a1f7c2e9d04b8a6c3e1f09d7b2a4c6e8f1d3b5a)</div></td>
          <td style="text-align:center;padding:8px">${img(150, 230, { kind: "shoe", zones: ["dots", "dots", "grid"], bg: "#ffffff" })}</td></tr>
        <tr><th style="${lab}">측면이미지</th><th style="${lab}">이미지정보</th></tr>
        <tr><td style="height:260px;text-align:center;padding:10px"><span class="r-ph" style="width:300px;height:150px">측면 사진(슬리퍼)</span></td>
          <td style="padding:10px;vertical-align:top"><table style="font-size:12.5px"><tbody>${infoRows}</tbody></table></td></tr>
      </tbody></table>`;
    const win = `<div class="r-os" style="left:20px;top:6px;width:1170px;height:780px">
        <div class="tt"><span>🗎 용지</span></div>
        <div style="padding:3px 8px;border-bottom:1px solid #ccc;background:#fafafa">파일(F) &nbsp; 편집(E) &nbsp; 보기(U) &nbsp; 입력(D) &nbsp; 모양(J) &nbsp; 도구(K) &nbsp; 표(Q) &nbsp; 도움말(H)</div>
        <div style="padding:3px 8px;border-bottom:1px solid #ccc;background:#fafafa;color:#555">🗋 🖫 ↶ ↷ ✂ ⎘ 📋 &nbsp;|&nbsp; 가 가 가 &nbsp;|&nbsp; ☰ ☰ ☰</div>
        <div style="display:flex;align-items:center;gap:6px;padding:3px 8px;border-bottom:1px solid #ccc;background:#fafafa">
          ${sel("바탕글", 80)}${sel("대표", 60)}${sel("함초롬바탕", 100)}${sel("10", 44)}<span style="color:#888">가 가 가</span>${sel("160 %", 64)}${sel("폭 맞춤", 70)}
          <span style="margin-left:auto">${btns(["파일 저장", "PDF 저장", ["닫기", "sc-report-doc"]])}</span></div>
        <div style="height:684px;overflow:hidden;background:#c9ccd3;padding:16px 0">
          <div style="position:relative;width:820px;margin:0 auto;background:#fff;padding:28px 34px">
            <div style="position:absolute;left:280px;top:220px;width:300px;height:300px;border-radius:50%;border:2px solid #f0f2f6;color:#f0f2f6;display:grid;place-items:center;font-size:34px;font-weight:700">경찰청</div>
            ${block}${block}
          </div>
        </div>
      </div>`;
    return R.win({ tabOn: "감정서작성", treeOn: "감정서관리 ▸", h: 900 }, reportListInner() + R.dim() + docModal(30, 150) + win);
  }

  /* ───────── S17 결재 대기함 (탭) ───────── */
  function approve() {
    return R.win(
      { tabOn: "결재 대기함", treeOn: "감정서관리 ▸", h: 820 },
      `<div class="r-box" style="padding:6px;margin-bottom:6px"><table><tbody>
          <tr><td class="l">기안일자</td><td>${cal("", 130)} ~ ${cal("", 130)}</td><td class="l">제목</td><td>${inp("", 260)}</td><td rowspan="2" style="vertical-align:middle">${btns([["조회", "", "b"], ["초기화", "", "b"], ["결재", "", "b"]])}</td></tr>
          <tr><td class="l">기안자</td><td>${inp("", 300)}</td><td class="l">수신처</td><td>${inp("", 260)}</td></tr>
        </tbody></table></div>
      <div class="r-bar">결재 대기함</div>
      <div class="r-box"><table><thead><tr><th style="width:28px">☐</th><th style="width:150px">문서종류</th><th>제목</th><th style="width:130px">업무구분</th><th style="width:110px">담당부서</th><th style="width:90px">작성자</th></tr></thead>
        <tbody><tr><td colspan="6" style="height:520px;text-align:center;color:#aaa;vertical-align:middle">(녹화 시점에 결재할 문서 없음)</td></tr></tbody></table></div>
      ${pg(0, 0, 0)}`
    );
  }

  R.add({
    id: "sc-confirm", group: G, title: "검색결과 확인", ours: "S07", kind: "레이어 팝업", ref: "5613 13:46–14:22 · 17:35 · 29:37",
    render: confirm,
    memo: [
      "확인대상 저장·결과확인완료 때마다 「확인대상을 저장하시겠습니까?」 알림이 한 번 더 뜬다 (5613 17:35)",
      "이력 행(1/2355, 1/1085)과 오른쪽 후보 상자가 따로 있어, 어느 검색에서 찾은 후보인지 화면에서 안 보인다 (5613 14:15, 29:37)",
      "판정 이유를 적는 칸이 없다 — 발견/불발견/감정불능 라디오 3개뿐 (5613 13:46–14:22)",
      "이미지가 12~20장인 사건은 이 블록이 세로로 끝없이 늘어난다 (5613 16:07–16:44)",
    ],
  });
  R.add({
    id: "sc-verify", group: G, title: "족윤적 검증", ours: "S08", kind: "탭 화면", ref: "5613 18:22 · 18:37",
    render: verify,
    memo: [
      "누가 누구에게 보낸 교차 검증 요청인지, 지금 어느 상태인지 열이 없다 — 대조번호/용의자번호는 거의 0 (5613 18:37)",
      "「확인」을 누르면 상세조회 팝업이 다시 열리고, 검증자가 뷰어 창 2개를 또 나란히 띄워 비교한다 (5613 18:22–18:30)",
      "교차 검증 결과(「의견 일치」)를 보여 주는 열이 목록에 없다 (5613 18:39–18:48). 「검증결과」 다음 화면은 영상에 안 나와, 말로 들은 순서(→ 감정서 작성)로 연결했다",
    ],
  });
  R.add({
    id: "sc-report-list", group: G, title: "감정서작성 (감정 작성 대기 목록)", ours: "S09", kind: "탭 화면", ref: "5613 14:37 · 18:07 · 19:37",
    render: reportList,
    memo: [
      "목록에서는 「결재 중」만 보이고, 교차 검증을 누가 했는지·결재가 어디까지 왔는지 알 수 없다 (5613 19:37)",
      "「출지」 열이 넓게 비어 있다 (5613 19:37)",
    ],
  });
  R.add({
    id: "sc-report-doc", group: G, title: "결재문서정보 (감정서 1–8항)", ours: "S09", kind: "레이어 팝업", ref: "5613 14:37 · 15:25–15:40 · 19:07–19:22",
    render: reportDoc,
    memo: [
      "문서 뷰어는 보기만 된다 — 상태바 「속성편집=불가능」 (5613 15:25)",
      "서명란 「감정관 · 감정관 · 기술책임자」에 누가 들어가는지 문서에서 안 보인다 (5613 15:40)",
      "한글 편집기(이미지 페이지)를 어디서 여는지 영상에 안 보여, 첨부파일 행 클릭으로 연결했다 (5613 14:52)",
    ],
  });
  R.add({
    id: "sc-hwp", group: G, title: "한글 편집기 (감정서 이미지 페이지)", ours: "S09", kind: "OS 창", ref: "5613 14:52–16:07",
    render: hwp,
    memo: [
      "브라우저 팝업 위에 세 번째 종류의 창(웹 한글)이 따로 뜬다 (5613 14:52)",
      "후보마다 2×2 표가 반복되고, 그룹 신발이면 이미지가 15개까지 이어져 스크롤이 길다 (5613 14:43–15:12)",
      "창 제목은 「용지」로 읽었다(영상에서 「음지」처럼도 보임) (5613 14:52)",
    ],
  });
  R.add({
    id: "sc-approve", group: G, title: "결재 대기함", ours: "S08", kind: "탭 화면", ref: "5613 18:52",
    render: approve,
    memo: [
      "녹화 시점에 비어 있어 결재 화면 안쪽은 볼 수 없었다 (5613 18:52)",
      "목록에 교차 검증 결과·기안일 열이 없어, 무엇을 결재하는지 열어 봐야 안다 (5613 18:52)",
      "검색 라벨 「기안일자」「기안자」는 앞글자가 가려져 가장 그럴듯한 원문으로 썼다 (5613 18:52)",
    ],
  });
})();
