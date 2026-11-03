/* S03 이미지 편집 — SCAS 「이미지 커팅」 OS 창 + 「이미지 뷰어」 OS 창 (IMG_5613 00:00–02:55, 06:02–07:56, 18:30 · IMG_5614 P1)
   r2: SCAS 창의 버튼 배치(위 −[100]+ 좌[90]우 … 취소 확인 저장 / 아래 처음상태…상하반전)를 그대로 두고,
       편집을 두 종류로 나눔 — A 1차 이미지 커팅(저장함) / B 검색 중 보기용 뷰어(저장 안 함, 인터뷰 5613 07:48). */
(function () {
  const { pin, apin, sole } = M;

  const SCAS_BTNS = ["처음상태", "평준화", "색상반전", "좌우반전", "밝게", "어둡게", "상하반전"];
  const modal = ({ x, y, w, title, btns, body }) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;border:1px solid #2b4a78;border-radius:12px;background:var(--panel);box-shadow:0 24px 70px rgba(0,0,0,.7)">
      <div style="display:flex;align-items:center;gap:8px;height:42px;padding:0 10px 0 14px;border-bottom:1px solid #2b4a78;border-radius:12px 12px 0 0;background:linear-gradient(90deg,#132445,#0e1a30)"><b style="font-size:13.5px;white-space:nowrap">${title}</b><span style="margin-left:auto;display:flex;gap:6px;align-items:center">${btns}</span></div>${body}</div>`;
  const zoomRot = (z, r) => `<span style="display:inline-flex;gap:3px;align-items:center"><button class="btn sm">−</button><span class="inp mono" style="width:44px;height:24px;justify-content:center">${z}</span><button class="btn sm">+</button></span>
      <span style="display:inline-flex;gap:3px;align-items:center"><button class="btn sm">좌</button><span class="inp mono" style="width:38px;height:24px;justify-content:center">${r}</span><button class="btn sm">우</button></span>`;
  const bottomRow = (hl, small) => `<div style="display:flex;flex-wrap:wrap;gap:${small ? 3 : 5}px;justify-content:center">${SCAS_BTNS.map(
    (b) => `<button class="btn sm ${b === hl ? "warn pinbox" : ""}" style="${small ? "height:22px;padding:0 6px;font-size:11px" : ""}">${b}${b === hl ? apin(4, "voice") : ""}</button>`
  ).join("")}</div>`;
  const cap = (t, c) => `<div style="position:absolute;left:${c}px;top:4px;color:var(--fg2);font:600 11px var(--font-mono);letter-spacing:.06em">${t}</div>`;

  function ours() {
    /* 뒤 화면: S02 사건관리 팝업(어둡게) */
    const ghost = `<div style="opacity:.3;pointer-events:none;position:absolute;inset:0">
        <div class="panel" style="position:absolute;left:0;right:0;top:6px;height:690px"><div style="height:42px;border-bottom:1px solid var(--line)"></div>
        <div style="display:grid;grid-template-columns:300px 1fr;gap:12px;padding:12px"><div class="imgbox" style="height:300px">${sole({ kind: "scene", zones: ["herring", "grid", "blocks"] })}</div><div class="panel" style="height:600px"></div></div></div></div>`;

    /* A — 1차 이미지 커팅(사건관리 팝업 위 2번째 겹) */
    const aBody = `<div style="display:grid;gap:8px;padding:10px 12px 12px">
        <div class="pinbox" style="display:flex;gap:10px;align-items:center">${apin(1, "keep", true)}
          ${zoomRot("100", "2")}<span class="pinbox" style="width:1px;height:20px">${apin(2, "voice")}</span>
          <span style="margin-left:auto;display:inline-flex;gap:4px"><button class="btn sm">취소</button><button class="btn sm">확인</button><button class="btn sm pri" data-lock="investigator analyst admin">저장</button></span>
        </div>
        <div style="display:flex;gap:4px;align-items:center;padding:4px 6px;border:1px dashed var(--line3);border-radius:8px">
          <span style="color:var(--dim);font-size:11px;margin-right:2px">도구(덧붙임)</span>
          <button class="btn sm" style="box-shadow:inset 0 0 0 1px var(--blue)">⬚ 자르기</button><button class="btn sm">↻ 회전 핸들</button>
          <button class="btn sm pinbox">⌖ 4점 각도 보정${apin(9, "plus")}</button>
          <span class="pinbox" style="display:inline-flex">${apin(3, "voice")}<button class="btn sm" disabled title="사진에 자가 없어 길이를 잴 수 없음">📏 길이 측정</button></span>
        </div>
        <div class="imgbox" style="height:370px;background:#05080d;background-image:radial-gradient(rgba(74,158,255,.10) 1px,transparent 1px);background-size:18px 18px">
          <div style="position:absolute;inset:0;transform:rotate(-4deg)">${sole({ kind: "scene", zones: ["herring", "grid", "blocks"], bg: "transparent" })}</div>
          <svg viewBox="0 0 100 264" preserveAspectRatio="xMidYMid meet" style="position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none">
            <rect x="2" y="6" width="96" height="254" fill="none" stroke="#4a9eff" stroke-width=".9" stroke-dasharray="3 2"/>
            ${[[2, 6], [98, 6], [2, 260], [98, 260]].map(([x, y]) => `<rect x="${x - 2.2}" y="${y - 2.2}" width="4.4" height="4.4" fill="#4a9eff"/>`).join("")}
            <line x1="50" y1="6" x2="50" y2="-8" stroke="#4a9eff" stroke-width=".7"/><circle cx="50" cy="-11" r="3.4" fill="#0b121d" stroke="#4a9eff" stroke-width=".9"/>
          </svg>
          <span class="chip" style="position:absolute;left:10px;top:10px;height:20px">자 없음 · 길이 측정 꺼짐</span>
          <span class="chip blue" style="position:absolute;right:10px;top:10px;height:20px">↻ 끌어서 돌리기 · 2°</span>
          <span class="cap">00001-25-0649_2 · 전사판채취법</span>
        </div>
        ${bottomRow("좌우반전")}
        <div class="pinbox" style="display:flex;gap:8px;align-items:center;padding:7px 10px;border:1px solid #1f4a2f;border-radius:8px;background:var(--green-bg);color:#86efac;font-size:11.5px">${apin(5, "voice", true)}
          <b>저장함</b> · 잘린 사진이 사건 이미지가 되고, 받은 원본은 따로 보관됩니다(되돌리기 가능).</div>
      </div>`;

    /* B — 검색 중 보기용 뷰어(문양 상세보기·문양검색결과 위 2번째 겹), 두 장 나란히 */
    const pane = (t, kind, z) => `<div style="display:grid;gap:6px;padding:8px;border:1px solid var(--line);border-radius:10px;background:var(--panel2)">
        <div style="display:flex;align-items:center;gap:6px;font-size:11.5px"><b>${t}</b></div>
        <div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap">${zoomRot("288", "0")}</div>
        <span class="imgbox" style="height:250px">${sole({ kind, zones: z })}</span>
        ${bottomRow("", true)}
      </div>`;
    const bBody = `<div style="display:grid;gap:8px;padding:10px 12px 12px">
        <div class="pinbox" style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${apin(6, "voice", true)}
          ${pane("유류 이미지 · _1", "scene", ["herring", "grid", "herring"])}${pane("발견 이미지 · 305659", "shoe", ["herring", "herring", "herring"])}
        </div>
        <div style="display:flex;gap:6px;align-items:center;justify-content:center"><span class="seg"><button aria-pressed="true">🔗 함께 확대·이동</button><button aria-pressed="false">따로</button></span></div>
        <div class="pinbox" style="display:flex;gap:8px;align-items:center;padding:7px 10px;border:1px solid var(--line3);border-radius:8px;background:var(--panel3);color:var(--fg2);font-size:11.5px">${apin(7, "voice", true)}
          <b>저장 안 함</b> · 보기용 조정이라 닫으면 원본 그대로입니다.</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap" class="pinbox">${apin(8, "plus")}
          <button class="btn sm ai" data-lock="analyst admin">✦ 이 화면 그대로 AI 문양 다시 추출 → S04</button>
          <button class="btn sm ai" data-lock="analyst admin">AI 보정 ▾ 이진화·노이즈 제거</button>
        </div>
      </div>`;

    return M.shell(
      { active: "사건관리", tabs: ["사건관리", "감정서작성", "족윤적 검증", "결재 대기함", "문서접수대장"], title: "사건관리 · 이미지 편집", h: 800 },
      `<div style="position:relative;height:680px">
        ${ghost}
        <div style="position:absolute;inset:0;background:rgba(5,8,13,.72);border-radius:12px"></div>
        ${cap("A · 1차 작업 — 사건관리 팝업에서 족윤적 이미지를 누를 때", 4)}
        ${cap("B · 2차 작업 — 검색 중 이미지를 두 번 누를 때", 650)}
        ${modal({ x: 0, y: 24, w: 630, title: "이미지 커팅 <span class='mono' style='font-weight:400;color:var(--mute)'>_2</span>", btns: `<span class="chip blue" style="height:20px">1차 작업</span><button class="btn sm ghost">✕</button>`, body: aBody })}
        ${modal({
          x: 646, y: 24, w: 534, title: "이미지 뷰어 · 나란히",
          btns: `<span class="chip" style="height:20px">보기용</span><span class="chip" data-role="verifier" style="height:20px">기술책임자 · 보기만</span><span class="pinbox" style="display:inline-flex;gap:6px">${apin(10, "better")}<button class="btn sm">닫기</button></span>`,
          body: bBody,
        })}
      </div>`
    );
  }

  function scas() {
    const btnRow = (fs) => `<div style="display:flex;flex-wrap:wrap;gap:3px;padding:5px 6px;font-size:${fs}">${SCAS_BTNS.map((b) => `<span class="sbtn">${b}</span>`).join("")}</div>`;
    const viewer = (x, y, capt, num) => `<div class="oswin" style="left:${x}px;top:${y}px;width:270px;height:380px">
        <div class="tt">👤 이미지 뷰어<span style="margin-left:auto;color:#888">— ☐ ✕</span></div>
        <div style="padding:5px 6px"><span class="sbtn">-</span> [${num}] <span class="sbtn">+</span> · <span class="sbtn">좌</span> [0] <span class="sbtn">우</span> <span class="sbtn" style="float:right">닫기</span></div>
        <div class="ph" style="height:250px;margin:0 6px;background:#fff;border:1px solid #ccc">${capt}</div>
        ${btnRow("10px")}
      </div>`;
    return M.scasShell(
      { treeOn: "사건관리", h: 740 },
      `<div class="modal" style="left:16px;top:14px;width:1190px;height:640px">
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
      ${M.pain(110, 560, "<b>각도는 숫자·좌/우 버튼</b> — 좌 [90] 칸에 숫자를 넣거나 좌/우를 눌러 족적을 세움. 마우스로 돌리는 핸들이 없음 (5613 00:48–01:18)", 260)}
      ${M.pain(380, 18, "<b>OS 창이 팝업 위에 쌓임</b> — 이미지 커팅 창 2~3개가 보조 모니터에 겹쳐 열린 채 남음 (5613 06:22 · 5614 0:00–2:30)", 270)}
      ${M.pain(860, 520, "<b>뷰어 2개를 손으로 나란히</b> — 더블클릭해 따로 띄우고 확대도 따로 (5613 06:02–06:44 · 18:30)", 250)}`
    );
  }

  M.add({
    id: "s03",
    code: "S03",
    group: "사건관리",
    title: "이미지 편집",
    refs: [
      { t: "SCAS 이미지 커팅", v: "5613 00:00–02:55 · 5614 P1" },
      { t: "SCAS 이미지 뷰어", v: "5613 06:02–07:56 · 18:30" },
      { t: "인터뷰: 보기용 편집은 저장 안 함", v: "5613 07:48–07:56", voice: true },
    ],
    lead: "SCAS 이미지 커팅·이미지 뷰어 창의 버튼 자리와 이름을 그대로 둡니다. 다만 편집을 두 가지로 나눴습니다. A는 사건 이미지를 바로잡는 1차 이미지 커팅(저장함), B는 검색하면서 문양을 잘 보려고 잠깐 바꾸는 보기용 뷰어(저장 안 함)입니다. 둘 다 별도 OS 창이 아니라 앱 안의 한 겹 레이어로 뜹니다.",
    scas,
    ours,
    fit: {
      area: ["same", "위 버튼 줄 · 가운데 그림 · 아래 버튼 줄, 뷰어는 두 장 나란히"],
      buttons: ["same", "−[100]+ 좌[90]우 … 취소·확인·저장 / 처음상태~상하반전 이름·순서 그대로, 새 도구는 아래 한 줄로 덧붙임"],
      popup: ["near", "OS 창 → 앱 안 레이어(사건관리·문양 상세보기 팝업 위 2번째 겹)"],
      columns: ["na", "표·폼 없음"],
    },
    notes: [
      { n: 1, kind: "keep", title: "SCAS 버튼 자리 그대로", text: "위 줄 왼쪽 −[100]+ · 좌[90]우, 오른쪽 취소·확인·저장. 아래 줄 처음상태·평준화·색상반전·좌우반전·밝게·어둡게·상하반전. 이미지 뷰어도 같은 배치에 「닫기」입니다.", src: "5613 S1·S9 · 5614 P1" },
      { n: 2, kind: "voice", title: "좌/우 버튼으로 조금씩", text: "「그냥 좌측 딱 누르면 바로 좌측으로 되고 우측 누르면 우측으로 되니까… 이게 조금만 틀어주면 될 것 같아요.」 좌/우 버튼과 각도 칸을 그대로 두고, 자르기 상자 위 회전 핸들은 덧붙이기만 했습니다.", src: "5613 00:48–01:06" },
      { n: 3, kind: "voice", title: "자 없는 사진도 자른다", text: "「자가 없잖아요. 여기는 자가 없지만 우리가 임의대로 할 수가 있어요.」 자가 안 보이는 사진에서는 「길이 측정」을 끄고, 자르기·회전만으로 끝나게 합니다.", src: "5613 00:32–00:34" },
      { n: 4, kind: "voice", title: "전사판은 좌우반전 추천", text: "「전사지에다가 딱 찍고 뒤집어가지고 자를 대는 거기 때문에… 좌우 반전을 해야지 찍힌 상황인 거예요.」 채취 방법이 전사판채취법이면 「좌우반전」 버튼을 주황으로 표시해 먼저 누르게 합니다(자동으로 뒤집지는 않음).", src: "5613 02:18–02:42" },
      { n: 5, kind: "voice", title: "A 1차 이미지 커팅 = 저장함", text: "「똑바로 해서 확인을 누르면 잘라져요. 저장을 누른단 말이에요.」 1차 작업에서 자르고 돌린 사진은 사건 이미지로 저장됩니다. 받은 원본은 따로 보관해 되돌릴 수 있습니다.", src: "5613 00:05–00:07" },
      { n: 6, kind: "voice", title: "두 화면 나란히", text: "「여기서 더블클릭을 해. 그래서 옆에다가 놓고… 두 개 화면을 띄워놓고」 유류·발견 이미지를 한 레이어 안에 나란히 띄우고, 확대·이동을 함께 움직이게 할 수 있습니다(따로도 가능).", src: "5613 06:02–06:08" },
      { n: 7, kind: "voice", title: "B 보기용 뷰어 = 저장 안 함", text: "「편집해서 저렇게 문양을 보기 위한 용도지 저장할 필요는 없다는 거예요… 원본이기 때문에 저장을 안 해.」 검색 중 뷰어에서 바꾼 밝기·반전은 닫으면 사라지고, 「저장」 버튼이 없습니다.", src: "5613 07:48–07:56" },
      { n: 8, kind: "plus", title: "보이는 그대로 AI 다시 추출", text: "「이렇게 바꾼 걸로 한 번 더 인공지능으로 추출해 볼 수 있는… 변경해서 추출하는 걸 원하는 거지.」 보기용 뷰어에서 잘 보이게 바꾼 화면을 임시 편집본으로 S04에 넘겨 AI 문양 추출을 다시 돌립니다. 저장은 하지 않습니다.", src: "5613 08:02–08:38" },
      { n: 9, kind: "plus", title: "4점 각도 보정 · AI 보정은 접어 둠", text: "비스듬히 찍힌 사진을 반듯하게 펴는 4점 각도 보정을 도구 줄에 덧붙였습니다. 이진화·노이즈 제거 같은 AI 보정은 감정관 반응(「이런 기능보다는 그냥.」)이 미지근해 「AI 보정 ▾」 하나로 접어 두었습니다.", src: "사업계획서 p36 · 5616 14:08" },
      { n: 10, kind: "better", title: "어디서나 같은 뷰어 · 보는 사람별 권한", text: "「언제 어디서든 확대해서 볼 수 있게」 — 사건관리·문양 상세보기·검색결과 어디서 열어도 같은 뷰어가 한 겹으로 뜹니다. 1차 커팅 「저장」과 AI 다시 추출은 감정관·관리자(수사관은 등록 때 저장 가능), 기술책임자는 보기만 합니다.", src: "5613 07:44" },
    ],
  });
})();
