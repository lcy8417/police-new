/* S03 이미지 편집 — SCAS 「이미지 커팅」 OS 창 + 「이미지 뷰어」 OS 창 (IMG_5613 00:00–01:25, 07:37, 18:30 · IMG_5614 P1) */
(function () {
  const { pin, apin, sole } = M;

  const SCAS_BTNS = ["처음상태", "평준화", "색상반전", "좌우반전", "밝게", "어둡게", "상하반전"];
  const AI = [
    { t: "배경 제거", s: "적용됨", on: true },
    { t: "이진화 · 단색 밑창 모드", s: "적용 중", on: true, now: true },
    { t: "노이즈 제거", s: "", on: false },
    { t: "접합 장애물 제거 (inpainting)", s: "", on: false },
  ];
  const HIST = [
    ["원본 불러오기", "", false],
    ["회전 44°", "", false],
    ["자르기 1840×3020", "", false],
    ["배경 제거", "AI", false],
    ["이진화 · 단색 밑창", "AI", true],
  ];
  const sec = (t, extra = "") => `<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;color:var(--mute);font-size:11.5px;font-weight:600">${t}${extra}</div>`;

  function ours() {
    const ghost = `<div style="opacity:.28;display:grid;grid-template-columns:190px minmax(0,1fr) 520px;gap:12px;padding-top:70px">
        <div class="panel" style="height:700px"></div><div class="panel" style="height:700px"></div><div class="panel" style="height:700px"></div></div>`;

    const canvas = `<div class="imgbox pinbox" style="height:520px;background:#05080d;background-image:radial-gradient(rgba(74,158,255,.10) 1px,transparent 1px);background-size:18px 18px">
        <div style="position:absolute;inset:0">${sole({ kind: "scene", zones: ["herring", "grid", "blocks"], ruler: true })}</div>
        <div style="position:absolute;inset:0;clip-path:inset(0 0 0 50%)">${sole({ kind: "bin", zones: ["herring", "grid", "blocks"], ruler: true, bg: "#f4f4f4" })}</div>
        <svg viewBox="0 0 114 264" preserveAspectRatio="xMidYMid meet" style="position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none">
          <rect x="3" y="4" width="94" height="256" fill="none" stroke="#4a9eff" stroke-width=".8" stroke-dasharray="3 2"/>
          ${[[3, 4], [97, 4], [3, 260], [97, 260]].map(([x, y]) => `<rect x="${x - 2}" y="${y - 2}" width="4" height="4" fill="#4a9eff"/>`).join("")}
          <line x1="50" y1="4" x2="50" y2="-12" stroke="#4a9eff" stroke-width=".7"/><circle cx="50" cy="-14" r="3.2" fill="#0b121d" stroke="#4a9eff" stroke-width=".9"/>
          <line x1="30" y1="248" x2="66" y2="16" stroke="#f59e0b" stroke-width=".9"/><circle cx="30" cy="248" r="1.8" fill="#f59e0b"/><circle cx="66" cy="16" r="1.8" fill="#f59e0b"/>
        </svg>
        <div style="position:absolute;left:50%;top:0;bottom:0;width:2px;margin-left:-1px;background:var(--teal);box-shadow:0 0 10px var(--teal)"></div>
        <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:var(--teal-bg);border:1px solid var(--teal);color:var(--teal);font-size:13px">⇆</div>
        <span class="chip" style="position:absolute;left:12px;top:12px">원본</span>
        <span class="chip teal" style="position:absolute;right:12px;top:12px"><span class="ai-mark">AI</span> 이진화 · 단색 밑창 모드</span>
        <span class="chip blue" style="position:absolute;left:calc(50% - 56px);top:8px">↻ 끌어서 회전 · 44°</span>
        <span class="chip amber mono" style="position:absolute;left:calc(50% + 70px);top:240px">길이 27.4 cm · 자 기준</span>
        <span class="cap">00001-25-0646_1 · 원본 4032×3024</span>
        <span style="position:absolute;left:calc(50% - 150px);top:44px">${pin(2, "better")}</span>
        <span style="position:absolute;left:calc(50% - 150px);top:130px">${pin(3, "better")}</span>
        <span style="position:absolute;left:calc(50% + 70px);top:208px">${pin(5, "plus")}</span>
      </div>`;

    const compare = `<div class="panel pinbox" style="margin-top:12px">${apin(8, "better")}
        <div class="panel-h"><span class="lbl">COMPARE</span><span class="t">나란히 비교</span><span style="color:var(--dim);font-size:11.5px">두 이미지가 확대·이동·회전을 함께 움직입니다</span>
          <span class="r"><span class="seg"><button aria-pressed="true">🔗 함께 움직이기</button><button aria-pressed="false">겹쳐 보기 50%</button></span></span></div>
        <div class="panel-b" style="display:grid;grid-template-columns:minmax(0,1fr) 120px minmax(0,1fr);gap:12px;align-items:center">
          <span class="imgbox" style="height:150px">${sole({ kind: "scene", zones: ["herring", "grid", "blocks"] })}<span class="cap">유류 이미지 · 00001-25-0646_1</span></span>
          <div style="display:grid;gap:6px;justify-items:center;color:var(--mute);font-size:11.5px;text-align:center"><span class="mono" style="color:var(--fg2)">200%</span><span>↻ 0° 맞춤</span><button class="btn sm">좌우 바꾸기</button></div>
          <span class="imgbox" style="height:150px">${sole({ kind: "shoe", zones: ["herring", "grid", "blocks"] })}<span class="cap">발견 이미지 · 신발 305659</span></span>
        </div>
      </div>`;

    const side = `<div class="panel" style="display:grid;align-content:start">
        <div class="panel-b pinbox" style="border-bottom:1px solid var(--line2)">${apin(1, "keep")}
          ${sec("기본 보정", `<span style="margin-left:auto;color:var(--dim);font-weight:400">SCAS 버튼 그대로</span>`)}
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px">${SCAS_BTNS.map((b, i) => `<button class="btn sm" style="justify-content:center${i === 0 ? ";grid-column:span 2" : ""}">${b}</button>`).join("")}</div>
        </div>
        <div class="panel-b pinbox" style="border-bottom:1px solid var(--line2);background:rgba(15,38,36,.35)" data-lock="analyst admin">${apin(6, "plus")}
          ${sec(`<span class="ai-mark">AI 전처리</span>`, `<span style="margin-left:auto;color:var(--dim);font-weight:400">전·후는 가운데 막대로</span>`)}
          <div style="display:grid;gap:6px">${AI.map(
            (a) => `<div style="display:flex;align-items:center;gap:6px"><button class="btn sm ai" style="flex:1;justify-content:flex-start;${a.now ? "box-shadow:inset 0 0 0 1px var(--teal)" : ""}">${a.on ? "✓ " : ""}${a.t}</button>${a.s ? `<span style="color:var(--teal);font-size:11px;white-space:nowrap">${a.s}</span>` : ""}</div>`
          ).join("")}</div>
        </div>
        <div class="panel-b pinbox" style="border-bottom:1px solid var(--line2)">${apin(4, "plus")}
          ${sec("4점 각도 보정", `<span style="margin-left:auto;color:var(--dim);font-weight:400">비스듬한 사진 펴기</span>`)}
          <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:center">
            <svg viewBox="0 0 80 60" style="width:100%;height:60px"><polygon points="12,8 70,14 64,54 6,48" fill="rgba(245,158,11,.10)" stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="3 2"/>${[[12, 8], [70, 14], [64, 54], [6, 48]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#f59e0b"/>`).join("")}</svg>
            <span style="color:var(--dim)">→</span>
            <svg viewBox="0 0 80 60" style="width:100%;height:60px"><rect x="10" y="8" width="60" height="44" fill="rgba(74,158,255,.10)" stroke="#4a9eff" stroke-width="1.2"/></svg>
          </div>
          <div style="color:var(--dim);font-size:11px">꼭짓점 4개를 자의 네 모서리에 맞추면 반듯하게 펴집니다.</div>
        </div>
        <div class="panel-b pinbox">${apin(7, "better")}
          ${sec("편집 기록", `<span style="margin-left:auto;display:flex;gap:4px"><button class="btn sm">↶ 되돌리기</button><button class="btn sm">↷</button></span>`)}
          <div style="display:grid;gap:3px;font-size:12px">${HIST.map(
            ([t, ai, now], i) => `<div style="display:flex;gap:8px;align-items:center;padding:4px 8px;border-radius:6px;${now ? "background:var(--blue-bg);color:var(--fg)" : "color:var(--mute)"}"><span class="mono" style="color:var(--dim);width:12px">${i + 1}</span>${t}${ai ? ` <span class="ai-mark">AI</span>` : ""}${now ? `<span style="margin-left:auto;font-size:11px;color:var(--blue)">지금</span>` : ""}</div>`
          ).join("")}</div>
          <div style="margin-top:10px;padding:8px 10px;border:1px solid #1f4a2f;border-radius:8px;background:var(--green-bg);color:#86efac;font-size:11.5px;line-height:1.5">🔒 원본 보존 · 편집본 별도 저장<br><span class="mono" style="color:var(--mute)">00001-25-0646_1_edit2.png</span></div>
        </div>
      </div>`;

    const editor = `<div class="panel tc" style="position:absolute;left:0;right:0;top:6px;box-shadow:0 20px 60px rgba(0,0,0,.6)">
        <div class="panel-h">
          <span class="lbl">IMAGE EDITOR</span><span class="t">이미지 편집 · <span class="mono">00001-25-0646_1</span></span>
          <span class="seg" style="margin-left:8px"><button aria-pressed="true">한 장</button><button aria-pressed="false">나란히 비교</button></span>
          <span class="chip" data-role="verifier">보기 전용 · 측정만 가능</span>
          <span class="r pinbox" style="padding-right:4px">${apin(9, "better", true)}
            <button class="btn">취소</button><button class="btn">확인</button><button class="btn pri" data-lock="investigator analyst admin">저장</button><button class="btn ghost">✕</button></span>
        </div>
        <div class="pinbox" style="display:flex;gap:10px;align-items:center;padding:8px 14px;border-bottom:1px solid var(--line2)">
          <span style="display:inline-flex;gap:4px;align-items:center"><button class="btn sm">−</button><span class="inp mono" style="width:52px;justify-content:center">100</span><button class="btn sm">+</button></span>
          <span style="display:inline-flex;gap:4px;align-items:center"><button class="btn sm">좌</button><span class="inp mono" style="width:52px;justify-content:center">44</span><button class="btn sm">우</button></span>
          <span style="width:1px;height:22px;background:var(--line)"></span>
          <span class="seg"><button aria-pressed="false">✥ 이동</button><button aria-pressed="true">⬚ 자르기</button><button aria-pressed="false">↻ 회전</button><button aria-pressed="false">⌖ 4점 각도 보정</button><button aria-pressed="false">📏 길이 측정</button></span>
          <span style="margin-left:auto;color:var(--dim);font-size:11.5px">숫자 입력과 마우스 둘 다 됩니다</span>
        </div>
        <div style="display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:12px;padding:12px 14px 14px">
          <div>${canvas}${compare}</div>
          ${side}
        </div>
      </div>`;

    return M.shell(
      { active: "사건관리", tabs: ["사건관리", "00001-25-0646"], tabOn: "00001-25-0646", title: "사건 상세 · 이미지 편집", h: 1040 },
      `<div style="position:relative;height:930px">
        ${ghost}
        <div style="position:absolute;inset:0;background:rgba(5,8,13,.72);border-radius:14px"></div>
        ${editor}
      </div>`
    );
  }

  function scas() {
    const btnRow = (fs) => `<div style="display:flex;flex-wrap:wrap;gap:3px;padding:5px 6px;font-size:${fs}">${SCAS_BTNS.map((b) => `<span class="sbtn">${b}</span>`).join("")}</div>`;
    const viewer = (x, y, cap, num) => `<div class="oswin" style="left:${x}px;top:${y}px;width:270px;height:380px">
        <div class="tt">👤 이미지 뷰어<span style="margin-left:auto;color:#888">— ☐ ✕</span></div>
        <div style="padding:5px 6px"><span class="sbtn">-</span> [${num}] <span class="sbtn">+</span> · <span class="sbtn">좌</span> [0] <span class="sbtn">우</span> <span class="sbtn" style="float:right">닫기</span></div>
        <div class="ph" style="height:250px;margin:0 6px;background:#fff;border:1px solid #ccc">${cap}</div>
        ${btnRow("10px")}
      </div>`;
    return M.scasShell(
      { treeOn: "사건관리", h: 740 },
      `<div style="height:670px"></div>
      <div class="modal" style="left:16px;top:14px;width:1190px;height:640px">
        <div class="bar">사건관리 <span style="font-weight:400"><span class="sbtn">이전</span> <span class="sbtn">다음</span> <span class="sbtn">사건복사</span> <span class="sbtn">수정</span> <span class="sbtn">닫기</span> ✕</span></div>
        <div style="display:grid;grid-template-columns:270px 1fr;gap:8px;padding:8px"><div class="ph" style="height:560px;background:#8fb3f0"></div><div class="ph" style="height:560px">사건정보 · 현장 이미지 정보</div></div>
      </div>
      <div class="oswin" style="left:80px;top:48px;width:540px;height:580px">
        <div class="tt">👤 이미지 커팅<span style="margin-left:auto;color:#888">— ☐ ✕</span></div>
        <div style="display:flex;gap:4px;align-items:center;padding:6px 8px">
          <span class="sbtn">-</span> [100] <span class="sbtn">+</span> &nbsp; <span class="sbtn">좌</span> <span style="padding:0 6px;border:1px solid #999;background:#fff">90</span> <span class="sbtn">우</span>
          <span style="margin-left:auto"><span class="sbtn">취소</span> <span class="sbtn">확인</span> <span class="sbtn">저장</span></span></div>
        <div style="position:relative;height:460px;margin:0 8px;background:#fff;border:1px solid #ccc">
          <div class="ph" style="position:absolute;left:150px;top:30px;width:200px;height:400px;transform:rotate(-46deg);background:#c9b78a;color:#6b5a2a">족적 사진</div>
          <div style="position:absolute;left:140px;top:60px;width:230px;height:340px;border:2px solid #e02424"></div>
        </div>
        ${btnRow("11px")}
      </div>
      ${viewer(650, 90, "유류 이미지", 288)}
      ${viewer(930, 120, "발견 이미지", 288)}
      ${M.pain(110, 560, "<b>각도는 숫자로 타이핑</b> — 좌 [90] 칸에 44를 입력해 족적을 세움. 마우스로 돌리는 핸들이 없음 (5613 01:15)", 260)}
      ${M.pain(380, 18, "<b>OS 창이 팝업 위에 쌓임</b> — 이미지 커팅 창 2~3개가 보조 모니터에 겹쳐 열린 채 남음 (5613 06:22 · 5614 0:00–2:30)", 270)}
      ${M.pain(860, 520, "<b>뷰어 2개를 손으로 나란히</b> — 유류·발견 이미지를 따로 띄워 확대도 따로 (5613 18:30)", 250)}`
    );
  }

  M.add({
    id: "s03",
    code: "S03",
    group: "사건관리",
    title: "이미지 편집",
    refs: [
      { t: "SCAS 이미지 커팅", v: "5613 00:00–01:25 · 5614 P1" },
      { t: "SCAS 이미지 뷰어", v: "5613 07:37 · 18:30" },
    ],
    lead: "따로 뜨던 이미지 커팅·이미지 뷰어 OS 창을 앱 안 편집창 하나로 합쳤습니다. 어느 화면에서 열어도 한 겹으로만 뜨고, SCAS 버튼 이름은 그대로 둔 채 회전 핸들·자르기 상자·각도 보정·길이 측정·AI 전처리를 더했습니다.",
    scas,
    ours,
    notes: [
      { n: 1, kind: "keep", title: "SCAS 버튼 이름 그대로", text: "위쪽 −[100]+ · 좌[90]우 · 취소·확인·저장, 오른쪽 처음상태·평준화·색상반전·좌우반전·밝게·어둡게·상하반전을 같은 이름으로 둡니다. 손에 익은 순서를 바꾸지 않습니다.", src: "5613 S1·S9, 5614 P1" },
      { n: 2, kind: "better", title: "끌어서 돌리는 회전 핸들", text: "자르기 상자 위 동그란 손잡이를 끌면 돌아가고 각도(44°)가 바로 보입니다. 숫자 칸 입력도 그대로 됩니다.", src: "5613 01:15 각도 90→44 타이핑" },
      { n: 3, kind: "better", title: "자르기 상자", text: "SCAS의 빨간 사각형을 모서리 손잡이로 크기를 바꾸는 상자로 바꿨습니다. 회전과 자르기를 한 화면에서 끝냅니다." },
      { n: 4, kind: "plus", title: "4점 각도 보정", text: "비스듬히 찍힌 사진에서 자의 네 모서리를 찍으면 반듯하게 펴 줍니다(원근 왜곡 보정).", src: "사업계획서 p36 왜곡 보정" },
      { n: 5, kind: "plus", title: "길이 측정(자 기준)", text: "사진 속 자의 눈금을 기준으로 두 점 사이 길이를 cm로 보여 줍니다. 감정서에 「각도·길이」 근거를 남길 수 있습니다.", src: "실무자 설문 문항 7–21 객관성 근거" },
      { n: 6, kind: "plus", title: "AI 전처리 4종 + 전·후 막대", text: "배경 제거·이진화(단색 밑창 모드)·노이즈 제거·접합 장애물 제거(inpainting, 가려진 부분 메우기)를 청록 버튼으로 모았습니다. 가운데 막대를 좌우로 끌면 원본과 결과를 한 장에서 비교합니다.", src: "사업계획서 p36 · 발표 s8 · 설문 단색 밑창 이진화" },
      { n: 7, kind: "better", title: "편집 기록 · 원본 보존", text: "한 단계씩 되돌릴 수 있고(↶), 저장하면 원본은 그대로 두고 편집본만 새 이름으로 남습니다.", src: "사업계획서 p16–19 원본·처리 데이터 분리" },
      { n: 8, kind: "better", title: "한 겹 편집창 · 나란히 비교", text: "사건 상세·문양 코딩·검색 결과 어디서 열어도 같은 편집창이 화면 위 한 겹으로 뜹니다. 「나란히 비교」로 유류·발견 이미지를 함께 확대·회전해, 뷰어 2개를 손으로 놓던 일을 대신합니다.", src: "5613 18:30 · 플랫폼 개선 사항 p1–5 다중 모달 편집창" },
      { n: 9, kind: "better", title: "보는 사람마다 다른 권한", text: "감정관·관리자는 저장과 AI 전처리를 쓸 수 있습니다. 수사관은 기본 보정까지만, 검증자는 「보기 전용」으로 확대·측정만 하고 저장이 잠깁니다." },
    ],
  });
})();
