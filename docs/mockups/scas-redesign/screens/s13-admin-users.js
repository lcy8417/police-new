/* S13 사용자 관리 (r2) — SCAS 트리 「족윤적관리 > 사용자 관리」 자리(영상에서 열지 않아 내용 미확인 → SCAS 화면 생략).
   police-new 현행 /manage/users(ManageUsersPage: UserTable + UserDetailPanel + FeatureToggles) 배치를 그대로 쓰고
   r2 역할(수사관 / 감정관 = 교차 검증 포함 / 기술책임자 = 결재 / 관리자)과 신발 DB 분업 권한(신발 등록 · 문양 입력 · 신발 승인)을 더함.
   근거: 녹취 5613 17:42–19:55(교차 검증·결재·임의 등록), 5616 04:30–04:42(분업), 사업계획서 p16, p20. */
(function () {
  const { pin, apin } = M;

  /* 역할에 따라 켜지는 기능 — r: [수사관, 감정관, 기술책임자, 관리자] */
  const FEAT = [
    { code: "CRIME_REGISTER", nm: "사건 등록", r: ["on", "on", "off", "on"], memo: "감정관은 「임의 등록」" },
    { code: "CRIME_SEARCH", nm: "사건 조회", r: ["view", "on", "on", "on"], memo: "수사관은 우리 청 의뢰만" },
    { code: "CROSS_VERIFY", nm: "교차 검증", r: ["off", "on", "off", "on"], nw: true, memo: "남이 요청한 건만 · 자기 건 불가" },
    { code: "REPORT", nm: "감정서 작성", r: ["view", "on", "view", "on"], nw: true, memo: "수사관은 발급본 열람" },
    { code: "SIGN", nm: "감정서 결재", r: ["off", "off", "on", "on"], nw: true, memo: "서명란 감정관·감정관·기술책임자" },
    { code: "SHOE_VIEW", nm: "신발 조회", r: ["off", "on", "on", "on"] },
  ];
  /* 신발 DB 분업 — 역할과 따로, 사람마다 켬 */
  const DUTY = [
    { code: "SHOE_EDIT", nm: "신발 등록", memo: "수집 검수·엑셀 일괄 등록" },
    { code: "SHOE_PATTERN", nm: "문양 입력", nw: true, memo: "상·중·하·윤곽 입력" },
    { code: "SHOE_APPROVE", nm: "신발 승인", nw: true, memo: "신발 DB 확정 · 하루 약 50매" },
  ];
  const MARK = { on: `<span style="color:var(--blue)">●</span>`, view: `<span style="color:var(--blue)">◐</span>`, off: `<span style="color:var(--faint)">—</span>`, duty: `<span style="color:var(--violet)">◇</span>` };

  const USERS = [
    { id: "park0412", nm: "박○○ 경위", role: "감정관", duty: "문양 입력", org: "경찰청 범죄분석과", st: "사용", at: "07-24 17:58", sel: true },
    { id: "kim0301", nm: "김○○ 경위", role: "감정관", org: "경찰청 범죄분석과", st: "사용", at: "07-24 16:20" },
    { id: "jang0105", nm: "장○○ 경위", role: "감정관", duty: "신발 승인", org: "경찰청 범죄분석과", st: "사용", at: "07-24 15:40" },
    { id: "seo0322", nm: "서○○ 주무관", role: "감정관", duty: "신발 등록", org: "경찰청 범죄분석과", st: "사용", at: "07-24 09:05" },
    { id: "choi0115", nm: "최○○ 경감", role: "기술책임자", org: "경찰청 범죄분석과", st: "사용", at: "07-24 15:02" },
    { id: "lee0508", nm: "이○○ 경사", role: "수사관", org: "대구청 과학수사계", st: "잠금", at: "07-22 18:03" },
    { id: "han0911", nm: "한○○ 경사", role: "수사관", org: "경북청 과학수사계", st: "사용", at: "07-21 09:12" },
    { id: "admin01", nm: "시스템 관리자", role: "관리자", org: "과학수사관리관실", st: "사용", at: "07-24 08:51" },
    { id: "yoon0203", nm: "윤○○ 경장", role: "수사관", org: "부산청 과학수사계", st: "중지", at: "03-02 10:05" },
  ];
  /* 현행 앱은 「사용」을 청록으로 칠하지만, 시안에서는 청록을 AI 전용으로 두려고 초록을 쓴다 */
  const stChip = (s) => (s === "사용" ? `<span class="chip green">사용</span>` : s === "잠금" ? `<span class="chip amber">잠금</span>` : `<span class="chip">중지</span>`);
  const roleChip = (u) => `<span class="chip ${u.role === "관리자" ? "blue" : u.role === "기술책임자" ? "violet" : ""}">${u.role}</span>${u.duty ? `<div style="margin-top:2px"><span class="chip" style="height:18px;font-size:10px;padding:0 6px;color:var(--violet);border-color:color-mix(in srgb,var(--violet) 40%,var(--panel))">◇ ${u.duty}</span></div>` : ""}`;

  const sw = (on) => `<span data-lock="admin" style="display:inline-flex;align-items:center;width:34px;height:18px;padding:2px;border-radius:999px;background:${on ? "var(--blue2)" : "var(--line3)"};justify-content:${on ? "flex-end" : "flex-start"}"><span style="width:14px;height:14px;border-radius:50%;background:var(--fg)"></span></span>`;
  const sec = (t, body) => `<div style="display:grid;gap:10px;padding:14px 18px;border-top:1px solid var(--line2)"><div class="crumb" style="letter-spacing:.2em">${t}</div>${body}</div>`;
  const actionRow = (t, d, btn) => `<div style="display:flex;align-items:center;gap:12px"><span style="display:grid;gap:1px;min-width:0"><span style="color:var(--fg);font-size:13px;font-weight:600">${t}</span><span style="color:var(--dim);font-size:11.5px">${d}</span></span><span style="margin-left:auto">${btn}</span></div>`;
  const newChip = `<span class="chip teal" style="height:17px;font-size:10px;padding:0 5px">신규</span>`;
  const tog = (f, on) => `<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--line2)">
      <span style="display:grid;gap:0"><span style="color:var(--fg2);font-size:12.5px">${f.nm} ${f.nw ? newChip : ""}</span><span style="color:var(--dim);font-size:10.5px"><span class="mono">${f.code}</span>${f.memo ? ` · ${f.memo}` : ""}</span></span>
      <span style="margin-left:auto">${sw(on)}</span></div>`;

  function ours() {
    const rows = USERS.map(
      (u) => `<tr class="${u.sel ? "sel" : ""}"><td class="mono" style="color:var(--blue)">${u.id}</td><td style="color:${u.sel ? "var(--fg)" : "var(--fg2)"}">${u.nm}</td><td style="height:auto;padding-top:6px;padding-bottom:6px">${roleChip(u)}</td>
        <td style="color:var(--mute);font-size:12px">${u.org}</td><td>${stChip(u.st)}</td><td class="mono" style="color:var(--mute);font-size:12px">${u.at}</td></tr>`
    ).join("");

    const matrix =
      FEAT.map(
        (f) => `<tr><td><span style="color:var(--fg)">${f.nm}</span> ${f.nw ? newChip : ""}<div class="mono" style="color:var(--dim);font-size:10.5px;line-height:1.2">${f.code}</div></td>
          ${f.r.map((v) => `<td style="text-align:center;font-size:14px">${MARK[v]}</td>`).join("")}
          <td style="white-space:normal;color:var(--dim);font-size:11px;line-height:1.35">${f.memo || ""}</td></tr>`
      ).join("") +
      `<tr><td colspan="6" style="height:28px;background:var(--strip);color:var(--violet);font-size:11.5px">신발 DB 분업 — 역할과 따로, 사람마다 지정 ${pin(6, "voice")}</td></tr>` +
      DUTY.map(
        (f) => `<tr><td><span style="color:var(--fg)">${f.nm}</span> ${f.nw ? newChip : ""}<div class="mono" style="color:var(--dim);font-size:10.5px;line-height:1.2">${f.code}</div></td>
          <td style="text-align:center">${MARK.off}</td><td style="text-align:center;font-size:14px">${MARK.duty}</td><td style="text-align:center">${MARK.off}</td><td style="text-align:center;font-size:14px">${MARK.on}</td>
          <td style="white-space:normal;color:var(--dim);font-size:11px;line-height:1.35">${f.memo}</td></tr>`
      ).join("");

    const hist = [
      ["07-24 09:10", "admin01 → park0412", "문양 입력(SHOE_PATTERN) 켬", "3월분 536건 문양 입력 지원", ""],
      ["07-23 14:00", "admin01 → jang0105", "신발 승인(SHOE_APPROVE) 켬", "승인 담당 지정", ""],
      ["07-22 18:03", "시스템 → lee0508", "계정 잠금", "비밀번호 5회 연속 실패", "amber"],
      ["07-21 11:20", "admin01 → choi0115", "역할 감정관 → 기술책임자", "기술책임자 지정", ""],
      ["07-20 10:02", "admin01 → admin01", "본인 권한 변경 시도", "거절: 본인 권한은 다른 관리자만", "red"],
    ]
      .map((h) => `<tr><td class="mono" style="color:var(--mute);font-size:12px">${h[0]}</td><td class="mono" style="font-size:11.5px">${h[1]}</td><td style="white-space:normal;line-height:1.35;${h[4] ? `color:var(--${h[4]})` : ""}">${h[2]}</td><td style="white-space:normal;line-height:1.35;color:var(--mute);font-size:12px">${h[3]}</td></tr>`)
      .join("");

    return M.shell(
      { active: "사용자 관리", tabs: ["사건관리", "사용자 관리", "사용 기록"], title: "사용자 관리", h: 1260 },
      `<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;padding:9px 12px;border:1px solid color-mix(in srgb,var(--amber) 35%,var(--panel));border-radius:10px;background:var(--amber-bg);color:var(--fg2);font-size:12.5px">
        <b style="color:var(--amber)">관리자 전용 메뉴</b> — 다른 역할에게는 메뉴가 보이지 않습니다. 시안에서는 구조를 보여 주려고 화면은 두고 버튼·스위치만 흐리게 잠급니다(위 「보는 사람」을 바꿔 확인).
      </div>
      <div class="page-head">
        <div><div class="crumb">족윤적 · 족윤적관리 · 사용자 관리 ${pin(1, "keep")}</div><h3>사용자 관리</h3><p>계정마다 역할을 정하면 기능 권한이 한 번에 맞춰지고, 신발 DB 일(등록·문양 입력·승인)은 사람마다 따로 맡깁니다.</p></div>
        <div style="display:flex;gap:8px"><button class="btn">엑셀</button><button class="btn pri" data-lock="admin">＋ 사용자 추가</button></div>
      </div>

      <div class="panel" style="margin-bottom:12px">
        <div class="panel-b" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
          <span class="inp" style="width:190px;color:var(--dim)">⌕ 아이디·이름</span>
          <span style="color:var(--dim);font-size:12px;margin-left:4px">역할</span>
          <span class="chip blue">전체 38</span><span class="chip">수사관 18</span><span class="chip">감정관 14</span><span class="chip violet">기술책임자 3</span><span class="chip">관리자 3</span>
          <span style="color:var(--dim);font-size:12px;margin-left:4px">신발 DB</span>
          <span class="chip" style="color:var(--violet)">등록 1</span><span class="chip" style="color:var(--violet)">문양 입력 3</span><span class="chip" style="color:var(--violet)">승인 1</span>
          <span style="color:var(--dim);font-size:12px;margin-left:4px">상태</span>
          <span class="chip green">사용 34</span><span class="chip amber">잠금 1</span><span class="chip">중지 3</span>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:640px minmax(0,1fr);gap:12px;align-items:start">
        <div style="display:grid;gap:12px">
          <div class="panel tc pinbox">
            ${apin(2, "better", true)}
            <div class="panel-h"><span class="t">사용자</span><span class="chip blue mono" style="height:20px">38명</span><span class="r"><span class="inp" style="width:170px;height:24px">소속 관서 · 전체<span class="caret">▾</span></span></span></div>
            <table class="grid"><thead><tr><th>아이디</th><th>이름</th><th>구분(역할)</th><th>소속 관서 ${pin(8, "plus")}</th><th>상태</th><th>마지막 로그인</th></tr></thead><tbody>${rows}</tbody></table>
          </div>

          <div class="panel pinbox">
            ${apin(3, "plus")}
            <div class="panel-h"><span class="lbl">PRESETS</span><span class="t">역할별 기본 권한</span></div>
            <div style="padding:8px 14px 0;color:var(--dim);font-size:11.5px">읽는 법: <span style="color:var(--blue)">●</span> 켜짐 · <span style="color:var(--blue)">◐</span> 보기만 · <span style="color:var(--violet)">◇</span> 사람마다 지정 · — 꺼짐. 역할을 고르면 이 줄대로 스위치가 맞춰지고, 그 뒤 한 칸씩 고칠 수 있습니다.</div>
            <table class="grid"><thead><tr><th>기능</th><th style="text-align:center">수사관</th><th style="text-align:center">감정관</th><th style="text-align:center">기술책임자</th><th style="text-align:center">관리자</th><th>메모</th></tr></thead><tbody>${matrix}</tbody></table>
          </div>
        </div>

        <div style="display:grid;gap:12px">
          <div class="panel tc">
            <div style="display:flex;gap:14px;align-items:flex-start;padding:16px 18px;background:rgba(13,20,32,.6);border-radius:14px 14px 0 0">
              <span class="avatar" style="width:44px;height:44px;font-size:16px">박</span>
              <span style="display:grid;gap:4px;min-width:0">
                <span style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><b style="font-size:17px;color:var(--fg)">박○○ 경위</b><span class="chip">감정관</span><span class="chip green">사용</span></span>
                <span class="mono" style="color:var(--blue);font-size:12px">park0412</span>
                <span style="color:var(--dim);font-size:11.5px">마지막 로그인 <span class="num">2025-07-24 17:58</span> · 10.14.43.*** · 그 뒤 실패 0회</span>
              </span>
            </div>
            ${sec("기본 정보", `<div class="form" style="grid-template-columns:96px minmax(0,1fr) 96px minmax(0,1fr)">
                <div class="l">이름</div><div class="v">박○○</div><div class="l">구분</div><div class="v"><span class="inp w100" data-lock="admin">사용자<span class="caret">▾</span></span></div>
                <div class="l">소속 관서</div><div class="v span3"><span class="inp w100" data-lock="admin">경찰청 범죄분석과<span class="caret">▾</span></span></div>
              </div>`)}
            ${sec(
              "역할 프리셋",
              `<span class="seg" data-lock="admin"><button aria-pressed="false">수사관</button><button aria-pressed="true">감정관</button><button aria-pressed="false">기술책임자</button><button aria-pressed="false">관리자</button></span>
               <span style="color:var(--dim);font-size:11.5px">감정관 = 검색·판단·교차 검증·감정서 작성 / 기술책임자 = 감정서 결재</span>`
            )}
            ${sec(
              `기능 권한 <span class="chip green" style="height:18px;font-size:10px;margin-left:6px;letter-spacing:0">프리셋과 같음</span>`,
              `<div class="pinbox">${FEAT.slice(0, 2).map((f) => tog(f, true)).join("")}
                 <div class="pinbox">${apin(4, "voice", true)}${tog(FEAT[2], true)}</div>
                 ${tog(FEAT[3], true)}
                 <div class="pinbox">${apin(5, "voice", true)}${tog(FEAT[4], false)}</div>
                 ${tog(FEAT[5], true)}</div>
               <div class="pinbox" style="display:flex;align-items:center;gap:6px;color:var(--dim);font-size:11px">${pin(7, "voice")}감정관도 사건을 「임의 등록」할 수 있어 사건 등록이 켜져 있습니다.</div>`
            )}
            ${sec(
              `신발 DB 분업 <span class="chip" style="height:18px;font-size:10px;margin-left:6px;letter-spacing:0;color:var(--violet)">사람마다 지정</span>`,
              `<div>${tog(DUTY[0], false)}${tog(DUTY[1], true)}${tog(DUTY[2], false)}</div>
               <span style="color:var(--dim);font-size:11px">한 사람에게 여러 개를 켤 수 있습니다. 신발문양 관리(S10)의 「승인」 버튼은 신발 승인이 켜진 사람에게만 눌립니다.</span>`
            )}
            ${sec(
              `계정 관리 ${pin(9, "plus")}`,
              `${actionRow("비밀번호 초기화", "임시 비밀번호를 정하고, 열린 로그인을 모두 끝냅니다", `<button class="btn sm" data-lock="admin">초기화</button>`)}
               ${actionRow("잠금 해제", "5회 연속 실패로 잠긴 계정을 다시 쓰게 합니다", `<button class="btn sm" disabled>잠기지 않음</button>`)}
               ${actionRow("비활성화", "로그인할 수 없게 합니다. 지난 기록은 그대로 남습니다", `<button class="btn sm danger" data-lock="admin">비활성화</button>`)}`
            )}
          </div>

          <div class="panel pinbox">
            ${apin(10, "plus")}
            <div class="panel-h"><span class="lbl">ADMIN LOG</span><span class="t">관리자 변경 이력</span><span class="r"><span style="color:var(--dim);font-size:12px">권한 오남용 방지</span></span></div>
            <table class="grid"><thead><tr><th>시각</th><th>누가 → 대상</th><th>변경</th><th>사유</th></tr></thead><tbody>${hist}</tbody></table>
          </div>
        </div>
      </div>
      <div class="pinbox" style="display:inline-flex;gap:8px;align-items:center;margin-top:12px;padding:8px 12px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--mute);font-size:12px">
        ${apin(11, "better")}<span class="chip blue">관리자</span> 모든 조작 &nbsp;|&nbsp; <span class="chip">그 밖의 역할</span> 메뉴 없음 · 화면 잠김 &nbsp;|&nbsp; 본인 계정은 다른 관리자만 변경
      </div>`
    );
  }

  M.add({
    id: "s13",
    code: "S13",
    group: "족윤적관리",
    title: "사용자 관리",
    refs: [{ t: "SCAS 트리 「사용자 관리」", v: "5616 08:00 (열지 않음)" }, { t: "police-new /manage/users" }, { t: "인터뷰 교차 검증·분업", v: "5613 17:42 · 5616 04:30", voice: true }, { t: "사업계획서", v: "p16 · p20" }],
    lead: "지금 police-new 관리자 화면(왼쪽 사용자 표 + 오른쪽 상세)을 그대로 씁니다. 역할은 인터뷰대로 수사관 / 감정관(교차 검증 포함) / 기술책임자(결재) / 관리자 4개입니다. 신발 DB 일(등록·문양 입력·승인)은 역할과 따로 사람마다 맡깁니다. SCAS의 「사용자 관리」는 영상에서 열지 않아 SCAS 화면은 생략합니다.",
    fit: {
      area: ["na", "SCAS 화면 내용 미확인 — 메뉴 자리만 유지. 배치는 현행 police-new /manage/users(왼쪽 표 + 오른쪽 상세) 그대로"],
      buttons: ["na", "현행 앱 버튼(사용자 추가 · 비밀번호 초기화 · 잠금 해제 · 비활성화) 그대로"],
      popup: ["na", "상세는 오른쪽 칸, 확인 창만 현행 앱처럼 1겹"],
      columns: ["na", "현행 앱 열(아이디·이름·구분·상태·마지막 로그인) 순서 그대로 + 소속 관서"],
    },
    ours,
    notes: [
      { n: 1, kind: "keep", title: "SCAS 「사용자 관리」 메뉴 이름·자리 그대로", text: "SCAS 트리 「족윤적관리」 아래 「사용자 관리」 자리에 같은 이름으로 둡니다. SCAS 화면 안의 칸은 영상에 나오지 않아 확인이 필요합니다.", src: "5616 08:00 트리" },
      { n: 2, kind: "better", title: "사용자 표 + 오른쪽 상세(현행 그대로)", text: "police-new /manage/users의 열과 상세 칸(기본 정보·기능 권한·계정 관리)을 그대로 쓰고, 「소속 관서」 열과 신발 DB 담당 표시(◇)만 더했습니다. 상태는 사용·잠금·중지 그대로입니다(시안에서는 청록을 AI 전용으로 두려고 「사용」을 초록으로 칠함).", src: "police-new UserTable · UserDetailPanel" },
      { n: 3, kind: "plus", title: "역할 프리셋 4개", text: "수사관·감정관·기술책임자·관리자 중 하나를 고르면 「역할별 기본 권한」 표대로 스위치가 켜집니다. r1의 「1차 팀장」 단계는 인터뷰 근거가 없어 없앴습니다.", src: "사업계획서 p16, p20 · core.js 역할" },
      { n: 4, kind: "voice", title: "교차 검증은 감정관 권한", text: "결과확인완료 뒤 검증요청은 동료 감정관에게 갑니다. 그래서 교차 검증(CROSS_VERIFY)을 감정관 프리셋에 넣고, 자기가 올린 건은 검증하지 못하게 합니다. 「교차 검증 할 수 있는 사람한테 요청을 한단 말이에요」.", src: "5613 17:42–17:59" },
      { n: 5, kind: "voice", title: "감정서 결재는 기술책임자", text: "교차 검증 → 감정서 작성 → 결재 순서이고, 감정서 서명란은 감정관·감정관·기술책임자입니다. 결재(SIGN)는 기술책임자 프리셋에만 켭니다. 「결제를 올린 게 끝. 전체 과정이 끝」. 결재 단계의 세부 순서는 열린 질문입니다.", src: "5613 18:48–19:36 · 인벤토리 S14 서명란" },
      { n: 6, kind: "voice", title: "신발 DB 분업 권한", text: "신발 등록(SHOE_EDIT)·문양 입력(SHOE_PATTERN)·신발 승인(SHOE_APPROVE)을 역할과 따로 사람마다 켭니다. 「신발 등록하는 사람은 따로 있고 그다음에 문양 넣는 사람이 따로 있고… 승인하는 사람이 따로 있고」. 「구름(?) 넣는 사람」(그룹 담당으로 추정)은 확인 뒤 더할 수 있습니다.", src: "5616 04:30–04:42" },
      { n: 7, kind: "voice", title: "감정관도 사건 등록", text: "공문 접수로 사건이 자동으로 뜨는 것이 기본이지만, 감정관이 직접 등록하기도 합니다. 그래서 사건 등록을 감정관 프리셋에도 켭니다. 「임의로 등록하는 거」.", src: "5613 19:55 · 11:31" },
      { n: 8, kind: "plus", title: "소속 관서 = 볼 수 있는 범위", text: "수사관은 자기 청이 의뢰한 사건만 봅니다. 감정관·기술책임자는 배정된 사건 전체를 봅니다.", src: "사업계획서 p16 업무 기반 접근제어" },
      { n: 9, kind: "plus", title: "비밀번호 초기화 · 잠금 해제 · 비활성화", text: "현행 계정 관리 3가지를 그대로 둡니다. 5회 실패로 잠긴 계정(S00)은 여기서만 풀고, 퇴직·전보자는 「비활성화」로 막되 지난 기록은 지우지 않습니다.", src: "사업계획서 p16–19 계정 생성·변경·비활성화" },
      { n: 10, kind: "plus", title: "관리자 변경 이력(권한 오남용 방지)", text: "권한·역할·분업 담당·잠금을 바꿀 때마다 누가·누구를·무엇을·왜를 남기고, 사유가 없으면 저장되지 않습니다. 관리자가 자기 권한을 스스로 바꾸는 것은 막고, 마지막 관리자 1명은 지울 수 없습니다(현행 서버 규칙).", src: "사업계획서 p16–19 관리자 권한 오남용 방지 이력" },
      { n: 11, kind: "better", title: "보는 사람에 따라", text: "관리자만 메뉴가 보이고 모든 버튼을 누를 수 있습니다. 다른 역할로 보면 역할·스위치·버튼이 흐리게 잠깁니다." },
    ],
  });
})();
