/* S14 사용·감사 기록 — SCAS 영상에 해당 화면 없음(SCAS 화면 생략).
   police-new 현행 /manage/logs(ManageLogsPage: LogFilterBar + 로그인 기록/기능 기록 탭 + SessionEventTimeline + ResultChip)를 바탕으로
   사업계획서 p16–19 감사 항목(조회·등록·수정·삭제·검색·보고서 생성·다운로드·출력), 관리자 행위 탭, 엑셀 내보내기, 보존 기간을 더함. */
(function () {
  const { pin, apin } = M;

  /* 결과 칩: 현행 앱 ResultChip 문구(SUCCESS 성공 / FAIL 실패 / DENIED 권한 없음). 시안에서는 청록을 AI 전용으로 두려고 성공은 초록. */
  const RES = { ok: `<span class="chip green">✓ 성공</span>`, fail: `<span class="chip red">⚠ 실패</span>`, deny: `<span class="chip amber">⛔ 권한 없음</span>` };
  const ACT = {
    조회: "", 검색: "blue", 등록: "green", 수정: "amber", 삭제: "red", "보고서 생성": "violet", 다운로드: "blue", 출력: "violet", 로그인: "",
  };
  const act = (a) => `<span class="chip ${ACT[a] || ""}" style="height:20px;font-size:11px">${a}</span>`;

  const TL = [
    ["09:02", "로그인", "로그인", "park0412 · 10.14.43.***", "ok"],
    ["09:05", "조회", "사건 조회", "00001-25-0646", "ok"],
    ["09:12", "검색", "문양 검색", "검색번호 572414 · 후보 869건", "ok"],
    ["09:20", "수정", "신발 문양 수정", "신발번호 305657 · 하 n32_04", "ok"],
    ["09:24", "등록", "확인대상 등록", "00001-25-0646_1 ↔ 305657", "ok"],
    ["09:31", "보고서 생성", "감정서 생성", "SCAS수사부-2944", "ok"],
    ["09:33", "다운로드", "감정서 PDF 다운로드", "SCAS수사부-2944 · 워터마크 포함", "ok"],
    ["09:35", "출력", "감정서 출력", "프린터 3층-A", "fail", "프린터 응답 없음 (상태 코드 504)"],
    ["09:40", "삭제", "사건 삭제", "00001-25-0612", "deny", "CRIME_DELETE 권한 없음 — 삭제는 관리자만"],
  ];

  const SESS = [
    { nm: "박○○ 경위", id: "park0412", in: "07-24 09:02", out: null, why: "—", ip: "10.14.43.***", ev: 18, fail: 2, open: true },
    { nm: "김○○ 경위", id: "kim0301", in: "07-24 08:47", out: "07-24 12:10", why: "로그아웃", ip: "10.14.43.***", ev: 9, fail: 0 },
    { nm: "최○○ 경감", id: "choi0115", in: "07-24 08:31", out: "07-24 11:02", why: "시간 초과(30분)", ip: "10.14.41.***", ev: 6, fail: 0 },
    { nm: "이○○ 경사", id: "lee0508", in: "07-22 17:58", out: "07-22 18:03", why: "로그인 실패 5회 → 잠금", ip: "10.21.8.***", ev: 5, fail: 5, bad: true },
    { nm: "시스템 관리자", id: "admin01", in: "07-24 08:51", out: null, why: "—", ip: "10.14.40.***", ev: 7, fail: 0 },
  ];

  function ours() {
    const tl = TL.map(
      (t) => `<div style="display:grid;grid-template-columns:44px 14px 96px minmax(0,1fr) auto;gap:8px;align-items:center;min-height:30px">
        <span class="mono" style="color:var(--dim);font-size:11.5px">${t[0]}</span>
        <span style="width:9px;height:9px;border-radius:50%;background:${t[4] === "ok" ? "var(--line3)" : t[4] === "fail" ? "var(--red)" : "var(--amber)"};box-shadow:0 0 0 3px var(--bg2)"></span>
        <span>${act(t[1])}</span>
        <span style="min-width:0"><span style="color:var(--fg2)">${t[2]}</span> <span class="mono" style="color:var(--mute);font-size:11.5px">${t[3]}</span>${t[5] ? `<div style="color:var(--dim);font-size:11px;line-height:1.3">▾ ${t[5]}</div>` : ""}</span>
        <span>${RES[t[4]]}</span></div>`
    ).join("");

    const rows = SESS.map((s) => {
      const tr = `<tr class="${s.open ? "sel" : ""}"><td style="color:var(--mute)">${s.open ? "▾" : "▸"}</td>
        <td><span style="color:var(--fg)">${s.nm}</span> <span class="mono" style="color:var(--dim);font-size:11.5px">${s.id}</span></td>
        <td class="mono" style="font-size:12px">${s.in}</td><td>${s.out ? `<span class="mono" style="font-size:12px">${s.out}</span>` : `<span class="chip green">사용 중</span>`}</td>
        <td style="${s.bad ? "color:var(--red)" : "color:var(--mute)"}">${s.why}</td><td class="mono" style="color:var(--mute);font-size:12px">${s.ip}</td>
        <td class="r num">${s.ev}</td><td class="r num" style="${s.fail ? "color:var(--red);font-weight:600" : "color:var(--faint)"}">${s.fail}</td></tr>`;
      const open = s.open
        ? `<tr><td colspan="8" style="height:auto;padding:10px 14px 12px 34px;background:var(--bg2);white-space:normal">
            <div class="pinbox" style="position:relative;display:grid;gap:2px">${apin(2, "better", true)}
              <span style="position:absolute;left:56px;top:12px;bottom:12px;width:1px;background:var(--line)"></span>${tl}</div></td></tr>`
        : "";
      return tr + open;
    }).join("");

    const kinds = [
      ["조회", 212, "사건·신발·이미지를 열어 본 기록"], ["검색", 96, "문양 검색·재검색(검색번호)"], ["등록", 34, "사건·신발·확인대상 등록"], ["수정", 41, "문양·기본정보·판단 수정"],
      ["삭제", 3, "무엇을 지웠는지 원본 값과 함께"], ["보고서 생성", 8, "감정서 초안·확정"], ["다운로드", 11, "파일·이미지 내려받기"], ["출력", 7, "인쇄(프린터 이름)"],
    ]
      .map((k) => `<div style="display:grid;grid-template-columns:86px 36px minmax(0,1fr);gap:8px;align-items:center;font-size:12px">${act(k[0])}<span class="num" style="text-align:right;color:var(--fg)">${k[1]}</span><span style="color:var(--dim);font-size:11.5px">${k[2]}</span></div>`)
      .join("");

    const adminActs = [
      ["07-24 09:10", "admin01", "park0412 권한 SHOE_EDIT 켬"],
      ["07-23 16:40", "admin01", "기초코드 FT002200 사용여부 Y → N"],
      ["07-22 18:20", "admin01", "lee0508 잠금 해제"],
      ["07-22 10:00", "admin01", "모델 검색 v3.1 운영 전환"],
    ]
      .map((a) => `<div style="display:grid;grid-template-columns:76px minmax(0,1fr);gap:8px;font-size:12px;line-height:1.4"><span class="mono" style="color:var(--dim);font-size:11px">${a[0]}</span><span style="color:var(--fg2)"><span class="mono" style="color:var(--blue);font-size:11.5px">${a[1]}</span> ${a[2]}</span></div>`)
      .join("");

    const lab = (t) => `<div class="crumb" style="margin-bottom:4px">${t}</div>`;

    return M.shell(
      { active: "사용 기록", tabs: ["사건관리", "사용자·권한", "사용 기록"], title: "사용·감사 기록", h: 1000 },
      `<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;padding:9px 12px;border:1px solid color-mix(in srgb,var(--amber) 35%,var(--panel));border-radius:10px;background:var(--amber-bg);color:var(--fg2);font-size:12.5px">
        <b style="color:var(--amber)">관리자 전용 메뉴</b> — 다른 역할은 메뉴가 없습니다. 내 접속 기록은 오른쪽 위 내 이름 → 「내 접속 기록」에서 봅니다.
      </div>
      <div class="page-head">
        <div><div class="crumb">족윤적 · 족윤적관리 · 사용 기록</div><h3>사용·감사 기록</h3><p>누가 언제 로그인해 어떤 기능을 썼는지, 실패·권한 없음 기록까지 확인합니다. 기록은 고칠 수 없습니다.</p></div>
        <div style="display:flex;gap:8px;align-items:center" class="pinbox">
          <button class="btn" data-lock="admin">엑셀 내보내기 ${pin(6, "plus")}</button>
        </div>
      </div>

      <div class="panel" style="margin-bottom:10px">
        <div class="panel-b pinbox" style="display:grid;grid-template-columns:200px 230px 150px 180px minmax(0,1fr) auto;gap:10px 12px;align-items:end">
          ${apin(1, "better", true)}
          <div>${lab("사용자")}<span class="inp w100">전체 사용자<span class="caret">▾</span></span></div>
          <div>${lab("기간")}<span class="inp w100 mono">2025-07-24 ~ 2025-07-24</span></div>
          <div>${lab("결과")}<span class="inp w100">전체<span class="caret">▾</span></span></div>
          <div>${lab("기능")}<span class="inp w100">전체 기능<span class="caret">▾</span></span></div>
          <div>${lab("대상 번호")}<span class="inp w100" style="color:var(--dim)">감정번호·신발번호 등</span></div>
          <div><button class="btn ghost">필터 초기화</button></div>
        </div>
      </div>

      <div class="pinbox" style="display:flex;align-items:center;gap:10px;margin-bottom:10px;padding:8px 12px;border:1px solid var(--line);border-radius:10px;background:var(--strip);color:var(--mute);font-size:12px">
        ${apin(7, "plus", true)}
        <span style="color:var(--blue)">ⓘ</span> 보존 기간: 접속·사용 기록 <b style="color:var(--fg2)">3년</b>, 관리자 행위 <b style="color:var(--fg2)">5년</b> (예시 — 기관 규정 확인 필요). 지난 기록은 자동으로 보관 저장소로 옮겨지고, 내보내기·조회도 이 화면에 다시 기록됩니다.
      </div>

      <div style="display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:12px;align-items:start">
        <div class="panel tc">
          <div class="panel-h">
            <span class="seg pinbox"><button aria-pressed="true">로그인 기록 <span class="num" style="color:var(--dim)">38</span></button><button aria-pressed="false">기능 기록 <span class="num" style="color:var(--dim)">412</span></button><button aria-pressed="false">관리자 행위 <span class="num" style="color:var(--dim)">9</span> ${pin(5, "plus")}</button></span>
            <span class="r"><span style="color:var(--dim);font-size:12px">50개씩 · 최신순</span></span>
          </div>
          <table class="grid"><thead><tr><th></th><th>사용자</th><th>로그인</th><th>로그아웃</th><th>종료 사유</th><th>IP</th><th class="r">이벤트 수</th><th class="r">실패 수</th></tr></thead><tbody>${rows}</tbody></table>
          <div style="padding:10px 14px;text-align:center"><button class="btn sm">더 보기</button></div>
        </div>

        <div style="display:grid;gap:12px">
          <div class="panel pinbox">
            ${apin(3, "plus")}
            <div class="panel-h"><span class="lbl">AUDIT</span><span class="t">감사 항목 · 오늘</span></div>
            <div class="panel-b" style="display:grid;gap:7px">${kinds}</div>
          </div>
          <div class="panel pinbox">
            ${apin(4, "plus")}
            <div class="panel-h"><span class="lbl">EXPORT</span><span class="t">다운로드·출력 제한</span></div>
            <div class="panel-b" style="display:grid;gap:6px;font-size:12px;color:var(--fg2);line-height:1.5">
              <div>· 감정서·원본 이미지 내려받기는 감정관·관리자만</div>
              <div>· 모든 파일에 <b>내려받은 사람·시각</b> 워터마크</div>
              <div>· 하루 20건 넘으면 관리자 확인 <span style="color:var(--dim)">(예시 기준)</span></div>
              <div>· 원본 이미지와 처리 이미지는 따로 저장, 원본은 고칠 수 없음</div>
            </div>
          </div>
          <div class="panel">
            <div class="panel-h"><span class="lbl">ADMIN</span><span class="t">관리자 행위 · 최근</span></div>
            <div class="panel-b" style="display:grid;gap:7px">${adminActs}</div>
          </div>
        </div>
      </div>
      <div class="pinbox" style="display:inline-flex;gap:8px;align-items:center;margin-top:12px;padding:8px 12px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--mute);font-size:12px">
        ${apin(8, "better")}<span class="chip blue">관리자</span> 모든 사람의 기록 · 내보내기 &nbsp;|&nbsp; <span class="chip">그 밖의 역할</span> 내 접속 기록만
      </div>`
    );
  }

  M.add({
    id: "s14",
    code: "S14",
    group: "족윤적관리",
    title: "사용·감사 기록",
    refs: [{ t: "police-new /manage/logs" }, { t: "사업계획서 보안·로그", v: "p16–19" }],
    lead: "지금 police-new 사용 기록 화면(필터 막대 + 로그인 기록·기능 기록 탭, 로그인을 펼치면 그때 쓴 기능이 시간순으로)을 그대로 두고, 사업계획서가 요구하는 감사 항목 8가지와 관리자 행위 탭, 엑셀 내보내기를 더했습니다. SCAS 영상에는 이런 화면이 없어 SCAS 화면은 생략합니다.",
    ours,
    notes: [
      { n: 1, kind: "better", title: "필터 막대 그대로 + 대상 번호", text: "현행 필터(사용자·기간·결과·기능·필터 초기화)에 「대상 번호」를 더했습니다. 감정번호 00001-25-0646을 넣으면 그 사건을 누가 열고 고치고 내려받았는지 한 번에 나옵니다.", src: "police-new LogFilterBar" },
      { n: 2, kind: "better", title: "로그인을 펼치면 기능 타임라인", text: "로그인 한 번 동안 쓴 기능을 시간순 점선으로 보여 줍니다(현행 SessionEventTimeline). 실패·권한 없음 줄은 눌러서 오류 내용을 펼칩니다. 결과 문구는 현행 앱 그대로 성공·실패·권한 없음입니다.", src: "police-new SessionTable · ResultChip" },
      { n: 3, kind: "plus", title: "감사 항목 8가지", text: "조회·검색·등록·수정·삭제·보고서 생성·다운로드·출력을 종류별로 셉니다. 삭제는 지운 원본 값까지 남겨 되돌릴 근거를 둡니다.", src: "사업계획서 p16–19 조회·등록·수정·삭제·검색·보고서 생성 이력" },
      { n: 4, kind: "plus", title: "다운로드·출력 기록과 제한", text: "누가 어떤 감정서·이미지를 내려받고 출력했는지 남기고, 파일에 워터마크를 넣습니다. 원본 이미지와 처리 이미지를 나눠 저장해 원본이 바뀌지 않게 합니다. 숫자 기준(하루 20건)은 예시입니다.", src: "사업계획서 p16–19 다운로드·출력 제한 · 원본·처리 데이터 분리" },
      { n: 5, kind: "plus", title: "관리자 행위 탭", text: "권한 변경·잠금 해제·코드 수정·모델 전환처럼 관리자가 한 일만 따로 모읍니다. 사용자·권한(S13), 기초코드관리(S12), 모델 관리(S15)의 이력이 여기로 모입니다.", src: "사업계획서 p16–19 관리자 로그" },
      { n: 6, kind: "plus", title: "엑셀 내보내기", text: "지금 거른 조건 그대로 엑셀로 내보냅니다. 내보낸 일 자체도 기록에 남습니다.", src: "실무자 설문: 결과를 엑셀 형식으로" },
      { n: 7, kind: "plus", title: "보존 기간 안내", text: "기록을 얼마나 보관하는지 화면에 적어 둡니다. 3년·5년은 예시이며 기관 규정을 확인해야 합니다. 기록은 고칠 수 없습니다.", src: "사업계획서 p16–19" },
      { n: 8, kind: "better", title: "보는 사람에 따라", text: "관리자는 모든 사람의 기록을 보고 내보냅니다. 다른 역할은 이 메뉴가 없고, 자기 접속 기록만 내 이름 메뉴에서 봅니다(시안에서는 안내 막대와 흐린 내보내기 버튼으로 표시)." },
    ],
  });
})();
