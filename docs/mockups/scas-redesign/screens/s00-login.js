/* S00 로그인 — SCAS 영상에는 로그인 장면이 없다(이미 로그인된 상태로 촬영). police-new 현행 로그인(AuthScreen: 점 격자 + 빛 번짐 + 카드 1장)을
   바탕으로, 사업계획서 보안 요구(5회 잠금·내부망·접속 기록)와 역할별 첫 화면 안내를 더한 시안. 앱 셸 없이 전체 프레임 하나. */
(function () {
  const { pin, apin, sole } = M;

  /* 작은 선 아이콘(장식용, 색은 currentColor) */
  const ICO = {
    user: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>`,
    lock: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`,
    eye: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>`,
    net: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>`,
    shield: `<svg viewBox="0 0 24 24" width="30" height="30" style="width:30px;height:30px" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5l8-3z"/><path d="M8.5 12.5l2.4 2.3 4.6-5"/></svg>`,
  };

  /* 역할별로 로그인 뒤 보이는 메뉴(core.js MENU의 data-role과 같은 묶음) */
  const ROLE_MENUS = {
    investigator: { menus: "사건관리 · 사건 등록 · 용의자관리", first: "사건 등록", scope: "우리 청이 의뢰한 사건만" },
    analyst: { menus: "사건관리 · 신발문양 관리 · 수집 검수 · 검색 이력 · 정밀 대조 · 감정서작성", first: "사건관리 (내 담당)", scope: "배정된 사건 전체" },
    verifier: { menus: "사건관리 · 검색 이력 · 정밀 대조 · 결재 대기함 · 족윤적 검증", first: "결재 대기함", scope: "검증 요청이 온 사건" },
    admin: { menus: "모든 메뉴 + 기초코드관리 · 사용자·권한 · 사용 기록 · 모델 관리", first: "사용자·권한", scope: "전체 (모든 행위가 기록됨)" },
  };

  const field = (label, icon, value, extra = "") => `<label style="display:grid;gap:6px">
      <span style="color:var(--fg2);font-size:12.5px;font-weight:600">${label}</span>
      <span class="inp w100" style="height:42px;padding:0 12px;gap:10px;${extra}"><span style="color:var(--dim);display:inline-flex">${icon}</span>${value}</span>
    </label>`;

  function ours() {
    const roleRows = Object.entries(M.ROLES)
      .map(([k, r]) => {
        const m = ROLE_MENUS[k];
        return `<div style="display:grid;gap:4px;padding:10px 12px;border:1px solid var(--line2);border-radius:10px;background:var(--panel2)">
          <div style="display:flex;align-items:center;gap:8px">
            <span class="chip blue">${r.label}</span>
            <span style="color:var(--mute);font-size:11.5px">${r.hint}</span>
            <span class="chip blue" data-role="${k}" style="margin-left:auto;height:20px;font-size:10.5px"><span class="dot"></span>지금 보는 사람</span>
          </div>
          <div style="color:var(--fg2);font-size:12px;line-height:1.5">${m.menus}</div>
          <div style="display:flex;gap:12px;color:var(--dim);font-size:11.5px">
            <span>첫 화면 <b style="color:var(--fg2);font-weight:600">${m.first}</b></span><span>범위 ${m.scope}</span>
          </div>
        </div>`;
      })
      .join("");

    return `<div style="position:relative;width:1440px;height:760px;overflow:hidden;background:var(--bg)">
      <div style="position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(color-mix(in srgb,var(--blue) 18%,transparent) 1px,transparent 1px);background-size:24px 24px;-webkit-mask-image:radial-gradient(ellipse at 45% 40%,#000 0%,transparent 72%);mask-image:radial-gradient(ellipse at 45% 40%,#000 0%,transparent 72%)"></div>
      <div style="position:absolute;top:-170px;left:5%;width:480px;height:480px;border-radius:50%;background:color-mix(in srgb,var(--blue3) 18%,transparent);filter:blur(80px);pointer-events:none"></div>
      <div style="position:absolute;right:-120px;bottom:-160px;width:420px;height:420px;border-radius:50%;background:color-mix(in srgb,var(--blue) 11%,transparent);filter:blur(80px);pointer-events:none"></div>

      <div style="position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1fr) 400px 340px;gap:40px;align-items:center;height:100%;padding:0 64px">

        <!-- 왼쪽: 플랫폼 소개 -->
        <div class="pinbox" style="display:grid;gap:18px;align-content:center">
          ${apin(1, "better", true)}
          <span class="emblem" style="width:64px;height:64px;color:var(--blue)">${ICO.shield}</span>
          <div>
            <div class="crumb" style="color:var(--blue);letter-spacing:.24em">FORENSIC FOOTWEAR PLATFORM</div>
            <div style="margin-top:10px;color:var(--fg2);font-size:15px;font-weight:600">경찰청 과학수사 · 족윤적 감정 플랫폼</div>
            <h1 style="margin:6px 0 0;font-size:34px;line-height:1.2;letter-spacing:-.01em">족윤적 감정 플랫폼</h1>
            <p style="margin:10px 0 0;color:var(--mute);font-size:13.5px;line-height:1.65;max-width:42ch">SCAS와 같은 메뉴, 같은 순서로 일합니다.<br>문양 추출·검색·정밀 대조는 AI가 먼저 해 두고, 감정관이 확인하고 판단합니다.</p>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <span class="imgbox" style="width:64px;height:104px">${sole({ kind: "scene", zones: ["dots", "herring", "grid"], cut: true })}<span class="cap">현장</span></span>
            <span style="color:var(--dim);font:600 11px var(--font-mono)">──▶</span>
            <span class="imgbox" style="width:64px;height:104px">${sole({ kind: "bin", zones: ["dots", "herring", "grid"] })}</span>
            <span style="color:var(--dim);font:600 11px var(--font-mono)">──▶</span>
            <span class="imgbox" style="width:64px;height:104px;border-color:color-mix(in srgb,var(--teal) 30%,var(--panel))">${sole({ kind: "shoe", zones: ["dots", "herring", "grid"], heat: true })}<span class="cap">305657</span></span>
            <span style="display:grid;gap:4px;margin-left:6px">
              <span class="ai-mark">● AI 대조</span>
              <span style="color:var(--mute);font-size:11.5px;line-height:1.4">현장 족적 → 이진화 →<br>후보 신발 일치 부위</span>
            </span>
          </div>
        </div>

        <!-- 가운데: 로그인 카드 -->
        <div style="display:grid;gap:14px">
          <div class="panel tc" style="padding:32px 32px 26px;background:color-mix(in srgb,var(--panel) 95%,transparent);box-shadow:0 30px 80px rgba(0,0,0,.55)">
            <div style="position:absolute;left:40px;right:40px;top:0;height:1px;background:linear-gradient(90deg,transparent,var(--blue),transparent);opacity:.7"></div>
            <div style="display:grid;place-items:center;width:44px;height:44px;margin-bottom:18px;border-radius:10px;border:1px solid color-mix(in srgb,var(--blue) 40%,var(--panel));background:var(--blue-bg);color:var(--blue);box-shadow:0 0 24px rgba(37,99,235,.3)">${ICO.lock}</div>
            <h2 style="margin:0;font-size:22px">로그인</h2>
            <p style="margin:4px 0 22px;color:var(--mute);font-size:13px">등록된 계정으로 로그인하세요.</p>

            <div style="display:grid;gap:16px">
              ${field("아이디", ICO.user, `<span class="mono" style="color:var(--fg)">park0412</span>`)}
              ${field("비밀번호", ICO.lock, `<span style="color:var(--fg);letter-spacing:.3em">••••••••</span><span style="margin-left:auto;color:var(--dim);display:inline-flex">${ICO.eye}</span>`, "border-color:color-mix(in srgb,var(--red) 35%,var(--panel))")}
              <div style="display:flex;align-items:center;justify-content:space-between;color:var(--mute);font-size:12px">
                <span><span style="display:inline-block;width:14px;height:14px;margin-right:6px;vertical-align:-2px;border-radius:3px;background:var(--blue2)"></span>아이디 저장</span>
                <span style="color:var(--dim)">비밀번호 분실 시 관리자에게 초기화 요청</span>
              </div>
              <div class="pinbox" style="padding:9px 11px;border:1px solid color-mix(in srgb,var(--red) 35%,var(--panel));border-radius:8px;background:var(--red-bg);color:var(--fg2);font-size:12px;line-height:1.5">
                ${apin(2, "plus")}
                <b style="color:var(--red)">비밀번호가 맞지 않습니다.</b> 남은 시도 <b class="num">3</b>회<br>
                <span style="color:var(--mute)">5회 연속 틀리면 계정이 잠기고, 관리자만 잠금을 풀 수 있습니다.</span>
              </div>
              <button class="btn pri" style="height:42px;justify-content:center;font-size:14px;font-weight:600">로그인</button>
            </div>

            <div class="pinbox" style="margin-top:18px;padding-top:14px;border-top:1px solid var(--line2);display:grid;gap:3px;color:var(--dim);font-size:11.5px">
              ${apin(4, "plus")}
              <span>이 계정의 지난 로그인 <span class="mono" style="color:var(--fg2)">2025-07-24 17:58</span> · 접속 PC <span class="mono" style="color:var(--fg2)">10.14.43.***</span></span>
              <span>그 뒤 실패한 로그인 <b class="num" style="color:var(--amber)">2</b>회 — 본인이 아니면 관리자에게 알려 주세요.</span>
            </div>
          </div>

          <div class="pinbox" style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--strip);color:var(--mute);font-size:11.5px;line-height:1.55">
            ${apin(3, "plus")}
            <span style="color:var(--blue);display:inline-flex;margin-top:2px">${ICO.net}</span>
            <span><b style="color:var(--fg2)">경찰 내부망 전용</b> — 내부망 PC에서만 접속됩니다.<br>인가된 사용자만 접근할 수 있으며, 조회·다운로드·출력을 포함한 모든 사용 기록이 저장됩니다.</span>
          </div>
        </div>

        <!-- 오른쪽: 역할별 안내 -->
        <div class="panel pinbox" style="align-self:center">
          ${apin(5, "plus")}
          <div class="panel-h"><span class="lbl">ROLES</span><span class="t">로그인하면 보이는 메뉴</span></div>
          <div class="panel-b" style="display:grid;gap:8px">
            ${roleRows}
            <p style="margin:2px 0 0;color:var(--dim);font-size:11px;line-height:1.5">역할은 관리자가 「사용자·권한」에서 정합니다. 메뉴에 없는 화면은 주소를 알아도 열리지 않습니다.</p>
          </div>
        </div>
      </div>
    </div>`;
  }

  M.add({
    id: "s00",
    code: "S00",
    group: "공통",
    title: "로그인",
    refs: [{ t: "police-new 현행 로그인(AuthScreen)" }, { t: "사업계획서 보안·로그", v: "p16–19" }],
    lead: "지금 police-new의 로그인 카드 1장 구조를 그대로 두고, 계정 잠금·내부망 전용·지난 로그인 안내를 더했습니다. 오른쪽 칸은 역할마다 로그인 뒤 무엇이 보이는지 미리 알려 줍니다. SCAS 영상에는 로그인 장면이 없어 SCAS 화면은 생략합니다.",
    ours,
    notes: [
      { n: 1, kind: "better", title: "족윤적만 다루는 플랫폼 이름", text: "SCAS는 현장감식·몽타주 등 여러 업무가 한 시스템에 있습니다. 우리 플랫폼은 족윤적 감정만 다루므로 첫 화면부터 「족윤적 감정 플랫폼」으로 이름을 분명히 합니다. 메뉴 이름·순서는 SCAS 그대로입니다.", src: "열린 질문: SCAS 상단 대메뉴" },
      { n: 2, kind: "plus", title: "5회 연속 실패하면 잠금", text: "남은 시도 횟수를 오류 문구 안에 보여 줍니다. 잠긴 계정은 관리자가 「사용자·권한」의 잠금 해제로만 풉니다(S13).", src: "사업계획서 p16–19 계정 보안" },
      { n: 3, kind: "plus", title: "내부망 전용 · 기록 저장 안내", text: "내부망 PC에서만 열리고, 조회·다운로드·출력까지 모두 기록된다는 점을 로그인 전에 알립니다. 기록은 「사용·감사 기록」(S14)에서 봅니다.", src: "사업계획서 p16–19" },
      { n: 4, kind: "plus", title: "지난 로그인 · 실패 횟수", text: "내 계정이 언제, 어느 PC에서 마지막으로 쓰였는지와 그 뒤 실패 횟수를 보여 줍니다. 남이 내 계정을 시도했는지 본인이 먼저 알아챌 수 있습니다.", src: "사업계획서 p16 접속 기록" },
      { n: 5, kind: "plus", title: "역할마다 다른 메뉴와 첫 화면", text: "수사관은 사건 등록, 감정관은 내 담당 사건관리, 검증자는 결재 대기함, 관리자는 사용자·권한으로 바로 들어갑니다. 위쪽 「보는 사람」을 바꾸면 해당 역할 줄에 「지금 보는 사람」 표시가 옮겨 갑니다.", src: "사업계획서 p16, p20 역할 기반 접근제어" },
    ],
  });
})();
