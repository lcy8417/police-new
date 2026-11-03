/* S13 사용자·권한 — SCAS 트리 「족윤적관리 > 사용자 관리」 자리(영상에서 열지 않아 내용 미확인 → SCAS 화면 생략).
   police-new 현행 /manage/users(ManageUsersPage: UserTable + UserDetailPanel + FeatureToggles)를 바탕으로
   역할 프리셋·검증자 단계·소속 관서·새 권한(VERIFY·REPORT)·관리자 변경 이력을 더함. 사업계획서 p16, p20. */
(function () {
  const { pin, apin } = M;

  const FEAT = [
    { code: "CRIME_REGISTER", nm: "사건 등록", r: ["on", "off", "off", "on"] },
    { code: "CRIME_SEARCH", nm: "사건 조회", r: ["view", "on", "on", "on"], memo: "수사관은 우리 청 의뢰만" },
    { code: "SHOE_VIEW", nm: "신발 조회", r: ["off", "on", "on", "on"] },
    { code: "SHOE_EDIT", nm: "신발 등록·수정", r: ["off", "on", "off", "on"] },
    { code: "VERIFY", nm: "검증·결재", r: ["off", "off", "on", "on"], nw: true },
    { code: "REPORT", nm: "감정서", r: ["view", "on", "view", "on"], nw: true, memo: "수사관은 발급본 열람, 검증자는 검토" },
  ];
  const MARK = { on: `<span style="color:var(--blue)">●</span>`, view: `<span style="color:var(--blue)">◐</span>`, off: `<span style="color:var(--faint)">—</span>` };

  const USERS = [
    { id: "park0412", nm: "박○○ 경위", role: "감정관", org: "경찰청 범죄분석과", st: "사용", at: "07-24 17:58", sel: true },
    { id: "kim0301", nm: "김○○ 경위", role: "감정관", org: "경찰청 범죄분석과", st: "사용", at: "07-24 16:20" },
    { id: "choi0115", nm: "최○○ 경감", role: "검증자", sub: "1차", org: "경찰청 범죄분석과", st: "사용", at: "07-24 15:02" },
    { id: "jung0720", nm: "정○○ 경정", role: "검증자", sub: "2차", org: "과학수사관리관실", st: "사용", at: "07-23 11:40" },
    { id: "lee0508", nm: "이○○ 경사", role: "수사관", org: "대구청 과학수사계", st: "잠금", at: "07-22 18:03" },
    { id: "han0911", nm: "한○○ 경사", role: "수사관", org: "경북청 과학수사계", st: "사용", at: "07-21 09:12" },
    { id: "admin01", nm: "시스템 관리자", role: "관리자", org: "과학수사관리관실", st: "사용", at: "07-24 08:51" },
    { id: "yoon0203", nm: "윤○○ 경장", role: "수사관", org: "부산청 과학수사계", st: "중지", at: "03-02 10:05" },
  ];
  /* 현행 앱은 「사용」을 청록으로 칠하지만, 시안에서는 청록을 AI 전용으로 두려고 초록을 쓴다 */
  const stChip = (s) => (s === "사용" ? `<span class="chip green">사용</span>` : s === "잠금" ? `<span class="chip amber">잠금</span>` : `<span class="chip">중지</span>`);
  const roleChip = (u) => `<span class="chip ${u.role === "관리자" ? "blue" : u.role === "검증자" ? "violet" : ""}">${u.role}${u.sub ? ` · ${u.sub}` : ""}</span>`;

  const sw = (on) => `<span data-lock="admin" style="display:inline-flex;align-items:center;width:34px;height:18px;padding:2px;border-radius:999px;background:${on ? "var(--blue2)" : "var(--line3)"};justify-content:${on ? "flex-end" : "flex-start"}"><span style="width:14px;height:14px;border-radius:50%;background:var(--fg)"></span></span>`;
  const sec = (t, body, extra = "") => `<div style="display:grid;gap:10px;padding:14px 18px;border-top:1px solid var(--line2)" ${extra}><div class="crumb" style="letter-spacing:.2em">${t}</div>${body}</div>`;
  const actionRow = (t, d, btn) => `<div style="display:flex;align-items:center;gap:12px"><span style="display:grid;gap:1px;min-width:0"><span style="color:var(--fg);font-size:13px;font-weight:600">${t}</span><span style="color:var(--dim);font-size:11.5px">${d}</span></span><span style="margin-left:auto">${btn}</span></div>`;

  function ours() {
    const rows = USERS.map(
      (u) => `<tr class="${u.sel ? "sel" : ""}"><td class="mono" style="color:var(--blue)">${u.id}</td><td style="color:${u.sel ? "var(--fg)" : "var(--fg2)"}">${u.nm}</td><td>${roleChip(u)}</td>
        <td style="color:var(--mute);font-size:12px">${u.org}</td><td>${stChip(u.st)}</td><td class="mono" style="color:var(--mute);font-size:12px">${u.at}</td></tr>`
    ).join("");

    const matrix = FEAT.map(
      (f) => `<tr><td><span style="color:var(--fg)">${f.nm}</span> ${f.nw ? `<span class="chip teal" style="height:18px;font-size:10px;padding:0 6px">신규</span>` : ""}<div class="mono" style="color:var(--dim);font-size:10.5px;line-height:1.2">${f.code}</div></td>
        ${f.r.map((v) => `<td style="text-align:center;font-size:14px">${MARK[v]}</td>`).join("")}
        <td style="white-space:normal;color:var(--dim);font-size:11px;line-height:1.35">${f.memo || ""}</td></tr>`
    ).join("");

    const toggles = FEAT.map(
      (f) => `<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--line2)">
        <span style="display:grid;gap:0"><span style="color:var(--fg2);font-size:12.5px">${f.nm} ${f.nw ? `<span class="chip teal" style="height:17px;font-size:10px;padding:0 5px">신규</span>` : ""}</span><span class="mono" style="color:var(--dim);font-size:10.5px">${f.code}</span></span>
        <span style="margin-left:auto">${sw(f.r[1] !== "off")}</span></div>`
    ).join("");

    const hist = [
      ["07-24 09:10", "admin01 → park0412", "SHOE_EDIT 켬", "신발 DB 코딩 담당 지정", ""],
      ["07-22 18:03", "시스템 → lee0508", "계정 잠금", "비밀번호 5회 연속 실패", "amber"],
      ["07-21 11:20", "admin01 → choi0115", "역할 감정관 → 검증자(1차 팀장)", "팀장 발령", ""],
      ["07-20 10:02", "admin01 → admin01", "본인 권한 변경 시도", "거절: 본인 권한은 다른 관리자만", "red"],
    ]
      .map((h) => `<tr><td class="mono" style="color:var(--mute);font-size:12px">${h[0]}</td><td class="mono" style="font-size:11.5px">${h[1]}</td><td style="white-space:normal;line-height:1.35;${h[4] ? `color:var(--${h[4]})` : ""}">${h[2]}</td><td style="white-space:normal;line-height:1.35;color:var(--mute);font-size:12px">${h[3]}</td></tr>`)
      .join("");

    return M.shell(
      { active: "사용자·권한", tabs: ["사건관리", "사용자·권한", "사용 기록"], title: "사용자·권한", h: 1120 },
      `<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;padding:9px 12px;border:1px solid color-mix(in srgb,var(--amber) 35%,var(--panel));border-radius:10px;background:var(--amber-bg);color:var(--fg2);font-size:12.5px">
        <b style="color:var(--amber)">관리자 전용 메뉴</b> — 다른 역할에게는 메뉴가 보이지 않습니다. 시안에서는 구조를 보여 주려고 화면은 두고 버튼·스위치만 흐리게 잠급니다(위 「보는 사람」을 바꿔 확인).
      </div>
      <div class="page-head">
        <div><div class="crumb">족윤적 · 족윤적관리 · 사용자·권한 ${pin(1, "keep")}</div><h3>사용자·권한</h3><p>계정마다 역할을 정하면 기능 권한이 한 번에 맞춰집니다. 바꾼 내용은 누가·왜 바꿨는지와 함께 남습니다.</p></div>
        <div style="display:flex;gap:8px"><button class="btn">엑셀</button><button class="btn pri" data-lock="admin">＋ 사용자 추가</button></div>
      </div>

      <div class="panel" style="margin-bottom:12px">
        <div class="panel-b" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
          <span class="inp" style="width:220px;color:var(--dim)">⌕ 아이디·이름</span>
          <span style="color:var(--dim);font-size:12px;margin-left:6px">역할</span>
          <span class="chip blue">전체 39</span><span class="chip">수사관 18</span><span class="chip">감정관 12</span><span class="chip violet">검증자 6</span><span class="chip">관리자 3</span>
          <span style="color:var(--dim);font-size:12px;margin-left:6px">상태</span>
          <span class="chip green">사용 35</span><span class="chip amber">잠금 1</span><span class="chip">중지 3</span>
          <span class="inp" style="margin-left:auto;width:200px">소속 관서 · 전체<span class="caret">▾</span></span>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:640px minmax(0,1fr);gap:12px;align-items:start">
        <div style="display:grid;gap:12px">
          <div class="panel tc pinbox">
            ${apin(2, "better", true)}
            <div class="panel-h"><span class="t">사용자</span><span class="chip blue mono" style="height:20px">39명</span><span class="r"><span style="color:var(--dim);font-size:12px">행을 고르면 오른쪽에 상세</span></span></div>
            <table class="grid"><thead><tr><th>아이디</th><th>이름</th><th>구분(역할)</th><th>소속 관서 ${pin(6, "plus")}</th><th>상태</th><th>마지막 로그인</th></tr></thead><tbody>${rows}</tbody></table>
          </div>

          <div class="panel pinbox">
            ${apin(5, "plus")}
            <div class="panel-h"><span class="lbl">PRESETS</span><span class="t">역할별 기본 권한</span></div>
            <div style="padding:8px 14px 0;color:var(--dim);font-size:11.5px">읽는 법: <span style="color:var(--blue)">●</span> 켜짐 · <span style="color:var(--blue)">◐</span> 보기만 · — 꺼짐. 역할을 고르면 이 줄대로 스위치가 맞춰지고, 그 뒤 한 칸씩 고칠 수 있습니다.</div>
            <table class="grid"><thead><tr><th>기능</th><th style="text-align:center">수사관</th><th style="text-align:center">감정관</th><th style="text-align:center">검증자</th><th style="text-align:center">관리자</th><th>메모</th></tr></thead><tbody>${matrix}</tbody></table>
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
              `역할 프리셋 ${pin(3, "plus")}`,
              `<span class="seg" data-lock="admin"><button aria-pressed="false">수사관</button><button aria-pressed="true">감정관</button><button aria-pressed="false">검증자</button><button aria-pressed="false">관리자</button></span>
               <div class="pinbox" style="display:flex;gap:10px;align-items:center;padding:7px 10px;border:1px dashed var(--line3);border-radius:8px;color:var(--mute);font-size:12px">
                 ${apin(4, "plus")}<span>검증자 단계</span><span class="radio"><span>1차 팀장</span><span>2차 기술책임자</span></span><span style="margin-left:auto;color:var(--dim);font-size:11px">검증자를 고르면 켜짐</span>
               </div>`
            )}
            ${sec(`기능 권한 <span class="chip green" style="height:18px;font-size:10px;margin-left:6px;letter-spacing:0">프리셋과 같음</span>`, `<div>${toggles}</div>`)}
            ${sec(
              `계정 관리 ${pin(7, "plus")}`,
              `${actionRow("비밀번호 초기화", "임시 비밀번호를 정하고, 열린 로그인을 모두 끝냅니다", `<button class="btn sm" data-lock="admin">초기화</button>`)}
               ${actionRow("잠금 해제", "5회 연속 실패로 잠긴 계정을 다시 쓰게 합니다", `<button class="btn sm" disabled>잠기지 않음</button>`)}
               ${actionRow("비활성화", "로그인할 수 없게 합니다. 지난 기록은 그대로 남습니다", `<button class="btn sm danger" data-lock="admin">비활성화</button>`)}`
            )}
          </div>

          <div class="panel pinbox">
            ${apin(8, "plus")}
            <div class="panel-h"><span class="lbl">ADMIN LOG</span><span class="t">관리자 변경 이력</span><span class="r"><span style="color:var(--dim);font-size:12px">권한 오남용 방지</span></span></div>
            <table class="grid"><thead><tr><th>시각</th><th>누가 → 대상</th><th>변경</th><th>사유</th></tr></thead><tbody>${hist}</tbody></table>
          </div>
        </div>
      </div>
      <div class="pinbox" style="display:inline-flex;gap:8px;align-items:center;margin-top:12px;padding:8px 12px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--mute);font-size:12px">
        ${apin(9, "better")}<span class="chip blue">관리자</span> 모든 조작 &nbsp;|&nbsp; <span class="chip">그 밖의 역할</span> 메뉴 없음 · 화면 잠김 &nbsp;|&nbsp; 본인 계정은 다른 관리자만 변경
      </div>`
    );
  }

  M.add({
    id: "s13",
    code: "S13",
    group: "족윤적관리",
    title: "사용자·권한",
    refs: [{ t: "SCAS 트리 「사용자 관리」", v: "5616 08:00 (열지 않음)" }, { t: "police-new /manage/users" }, { t: "사업계획서", v: "p16 · p20" }],
    lead: "지금 police-new 관리자 화면(왼쪽 사용자 표 + 오른쪽 상세)을 그대로 쓰고, 역할 4개를 고르면 기능 권한 스위치가 한 번에 맞춰지게 했습니다. 권한을 바꾼 기록은 사유와 함께 따로 남습니다. SCAS의 「사용자 관리」는 영상에서 열지 않아 SCAS 화면은 생략합니다.",
    ours,
    notes: [
      { n: 1, kind: "keep", title: "SCAS 「사용자 관리」 메뉴 자리 유지", text: "SCAS 트리 「족윤적관리」 아래 「사용자 관리」가 있던 자리에 이 화면을 둡니다(사이드바 「사용자·권한」). SCAS 화면 안의 칸은 영상에 나오지 않아 확인이 필요합니다.", src: "5616 08:00 트리" },
      { n: 2, kind: "better", title: "사용자 표 + 오른쪽 상세(현행 그대로)", text: "police-new /manage/users의 열(아이디·이름·구분·상태·마지막 로그인)과 상세 칸(기본 정보·기능 권한·계정 관리)을 그대로 쓰고, 「소속 관서」 열만 더했습니다. 상태 칩은 사용·잠금·중지 3가지 그대로입니다(시안에서는 청록을 AI 전용으로 두려고 「사용」만 초록으로 칠함).", src: "police-new UserTable · UserDetailPanel" },
      { n: 3, kind: "plus", title: "역할 프리셋 4개", text: "수사관·감정관·검증자·관리자 중 하나를 고르면 아래 「역할별 기본 권한」 표대로 스위치가 켜집니다. 한 칸씩 따로 고치면 「프리셋과 다름」으로 바뀌어, 예외 계정을 쉽게 찾습니다.", src: "사업계획서 p16, p20 역할 기반 접근제어" },
      { n: 4, kind: "plus", title: "검증자 1차 팀장 · 2차 기술책임자", text: "검증자는 결재 단계(1차 팀장 → 2차 기술책임자)를 함께 정합니다. 한 역할로 둘지 두 역할로 나눌지는 열린 질문입니다.", src: "열린 질문: 검증자 권한 범위" },
      { n: 5, kind: "plus", title: "새 기능 권한 VERIFY · REPORT", text: "지금 있는 4개(CRIME_REGISTER 사건 등록, CRIME_SEARCH 사건 조회, SHOE_VIEW 신발 조회, SHOE_EDIT 신발 등록·수정)에 VERIFY 검증·결재와 REPORT 감정서를 더합니다. 표의 「◐ 보기만」은 화면은 열리지만 고치기 버튼이 없는 상태입니다.", src: "police-new features.ts" },
      { n: 6, kind: "plus", title: "소속 관서 = 볼 수 있는 범위", text: "수사관은 자기 청이 의뢰한 사건만 봅니다(S01 「우리 청 의뢰」 필터와 같은 기준). 감정관·검증자는 배정된 사건 전체를 봅니다.", src: "사업계획서 p16 업무 기반 접근제어" },
      { n: 7, kind: "plus", title: "비밀번호 초기화 · 잠금 해제 · 비활성화", text: "현행 계정 관리 3가지를 그대로 둡니다. 5회 실패로 잠긴 계정(S00)은 여기서만 풀고, 퇴직·전보자는 「비활성화」로 막되 지난 기록은 지우지 않습니다.", src: "사업계획서 p16–19 계정 생성·변경·비활성화" },
      { n: 8, kind: "plus", title: "관리자 변경 이력(권한 오남용 방지)", text: "권한·역할·잠금을 바꿀 때마다 누가·누구를·무엇을·왜를 남기고, 사유가 없으면 저장되지 않습니다. 관리자가 자기 권한을 스스로 바꾸는 것은 막고, 마지막 관리자 1명은 지울 수 없습니다(현행 서버 규칙).", src: "사업계획서 p16–19 관리자 권한 오남용 방지 이력" },
      { n: 9, kind: "better", title: "보는 사람에 따라", text: "관리자만 메뉴가 보이고 모든 버튼을 누를 수 있습니다. 다른 역할로 보면 맨 위에 「관리자 전용 화면」 안내가 뜨고 역할·스위치·버튼이 흐리게 잠깁니다." },
    ],
  });
})();
