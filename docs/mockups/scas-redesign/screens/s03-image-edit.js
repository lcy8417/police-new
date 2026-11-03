/* S03 이미지 편집 — SCAS 「이미지 커팅」 OS 창 + 「이미지 뷰어」 OS 창 (IMG_5613 00:00–02:55, 06:02–07:56, 18:30 · IMG_5614 P1)
   r2: SCAS 창의 버튼 배치(위 −[100]+ 좌[90]우 … 취소 확인 저장 / 아래 처음상태…상하반전)를 그대로 두고,
       편집을 두 종류로 나눔 — A 1차 이미지 커팅(저장함) / B 검색 중 보기용 뷰어(저장 안 함, 인터뷰 5613 07:48).
   r3: 작업 화면다운 모습으로 다시 그림 — 실제 사진 같은 족적(M.photo), 자르기 틀(3분할선·모서리 손잡이·밖은 어둡게)·회전 손잡이,
       오른쪽 칸(AI 제안 · 원본→편집본 · 편집 이력 · 원본 해시), 뷰어는 함께 움직이는 십자선·돋보기·보기 방식 전환. */
(function () {
  const { pin, apin, sole, photo } = M;

  const SCAS_BTNS = ["처음상태", "평준화", "색상반전", "좌우반전", "밝게", "어둡게", "상하반전"];
  const ZONES = ["dots", "herring", "grid"];
  const modal = ({ x, y, w, title, btns, body }) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;border:1px solid #2b4a78;border-radius:12px;background:var(--panel);box-shadow:0 24px 70px rgba(0,0,0,.7)">
      <div style="display:flex;align-items:center;gap:8px;height:42px;padding:0 10px 0 14px;border-bottom:1px solid #2b4a78;border-radius:12px 12px 0 0;background:linear-gradient(90deg,#132445,#0e1a30)"><b style="font-size:13.5px;white-space:nowrap">${title}</b><span style="margin-left:auto;display:flex;gap:6px;align-items:center">${btns}</span></div>${body}</div>`;
  const zoomRot = (z, r) => `<span style="display:inline-flex;gap:3px;align-items:center"><button class="btn sm">−</button><span class="inp mono" style="width:44px;height:24px;justify-content:center">${z}</span><button class="btn sm">+</button></span>
      <span style="display:inline-flex;gap:3px;align-items:center"><button class="btn sm">좌</button><span class="inp mono" style="width:44px;height:24px;justify-content:center">${r}</span><button class="btn sm">우</button></span>`;
  /* SCAS 아래 버튼 줄. on = 지금 켜진 보기(파랑), hl = 먼저 누르라고 권하는 버튼(주황) */
  const bottomRow = ({ hl = "", on = [], small = false } = {}) => `<div style="display:flex;flex-wrap:wrap;gap:${small ? 3 : 5}px;justify-content:center">${SCAS_BTNS.map((b) => {
    const cls = b === hl ? "warn pinbox" : "";
    const onSt = on.includes(b) ? "box-shadow:inset 0 0 0 1px var(--blue);color:var(--fg);background:var(--blue-bg);" : "";
    return `<button class="btn sm ${cls}" style="${onSt}${small ? "height:22px;padding:0 6px;font-size:11px" : ""}">${b}${b === hl ? apin(4, "voice") : ""}</button>`;
  }).join("")}</div>`;
  const cap = (t, c) => `<div style="position:absolute;left:${c}px;top:4px;color:var(--fg2);font:600 11px var(--font-mono);letter-spacing:.06em">${t}</div>`;
  const side = (t, body, x = "") => `<div style="display:grid;gap:6px;padding:9px 10px;border:1px solid var(--line);border-radius:10px;background:var(--panel2);${x}"><b style="font-size:11.5px;color:var(--fg2)">${t}</b>${body}</div>`;

  function ours() {
    /* 뒤 화면: S02 사건관리 팝업(어둡게) */
    const ghost = `<div style="opacity:.3;pointer-events:none;position:absolute;inset:0">
        <div class="panel" style="position:absolute;left:0;right:0;top:6px;height:760px"><div style="height:42px;border-bottom:1px solid var(--line)"></div>
        <div style="display:grid;grid-template-columns:300px 1fr;gap:12px;padding:12px"><div class="imgbox" style="height:300px">${sole({ kind: "scene", zones: ["herring", "grid", "blocks"] })}</div><div class="panel" style="height:660px"></div></div></div></div>`;

    /* ── A 캔버스: 기울어진 사진 위 자르기 틀 ── */
    const handles = [["0", "0"], ["100%", "0"], ["0", "100%"], ["100%", "100%"]].map(([l, t]) => `<span style="position:absolute;left:${l};top:${t};width:14px;height:14px;margin:-3px 0 0 -3px;${l === "100%" ? "margin-left:-11px;" : ""}${t === "100%" ? "margin-top:-11px;" : ""}border:3px solid #fff;border-${l === "0" ? "right" : "left"}:0;border-${t === "0" ? "bottom" : "top"}:0;filter:drop-shadow(0 0 3px rgba(0,0,0,.8))"></span>`).join("");
    const mids = [["50%", "0"], ["50%", "100%"], ["0", "50%"], ["100%", "50%"]].map(([l, t]) => `<span style="position:absolute;left:${l};top:${t};width:${t === "50%" ? 4 : 18}px;height:${t === "50%" ? 18 : 4}px;margin:${t === "50%" ? "-9px 0 0 -2px" : "-2px 0 0 -9px"};border-radius:2px;background:#fff;box-shadow:0 0 4px rgba(0,0,0,.8)"></span>`).join("");
    const canvas = `<div style="position:relative;height:536px;border-radius:10px;overflow:hidden;border:1px solid var(--line);background:#05080d;background-image:radial-gradient(rgba(74,158,255,.10) 1px,transparent 1px);background-size:18px 18px">
        <!-- 사진(2:3 비율 그대로) + 자르기 틀: 틀 밖은 어둡게, 안에는 3분할선 -->
        <div style="position:absolute;top:58px;bottom:34px;left:50%;aspect-ratio:2/3;transform:translateX(-50%);box-shadow:0 10px 40px rgba(0,0,0,.6)">
        <div style="position:absolute;inset:0">${photo({ zones: ZONES, rot: -4.2 })}</div>
        <div style="position:absolute;left:21%;right:21%;top:3%;bottom:3%;border:1.5px solid var(--blue);box-shadow:0 0 0 2000px rgba(3,6,10,.62),0 0 18px rgba(74,158,255,.35)">
          <span style="position:absolute;left:33.3%;top:0;bottom:0;width:1px;background:rgba(255,255,255,.28)"></span><span style="position:absolute;left:66.6%;top:0;bottom:0;width:1px;background:rgba(255,255,255,.28)"></span>
          <span style="position:absolute;top:33.3%;left:0;right:0;height:1px;background:rgba(255,255,255,.28)"></span><span style="position:absolute;top:66.6%;left:0;right:0;height:1px;background:rgba(255,255,255,.28)"></span>
          ${handles}${mids}
          <span style="position:absolute;left:50%;top:-34px;width:1px;height:34px;background:var(--blue)"></span>
          <span style="position:absolute;left:50%;top:-50px;width:20px;height:20px;margin-left:-10px;border-radius:50%;border:2px solid var(--blue);background:#0b121d;display:grid;place-items:center;color:var(--blue);font-size:11px">↻</span>
          <span class="mono" style="position:absolute;left:calc(50% + 16px);top:-48px;padding:1px 6px;border-radius:4px;background:rgba(11,18,29,.92);color:var(--fg);font-size:10.5px;white-space:nowrap">−4.2° → 0°</span>
          <span class="mono" style="position:absolute;left:50%;bottom:-24px;transform:translateX(-50%);padding:1px 6px;border-radius:4px;background:rgba(11,18,29,.92);color:var(--fg2);font-size:10.5px;white-space:nowrap">1,088 × 2,964 px · 9.1 × 24.7 cm</span>
        </div></div>
        <span class="fx-scan" style="animation-duration:4.5s"></span>
        <span class="mono" style="position:absolute;left:10px;top:10px;padding:2px 7px;border-radius:5px;background:rgba(36,27,12,.92);color:var(--amber);font-size:10.5px">📏 자 인식 · 1 cm = 120 px</span>
        <span class="mono" style="position:absolute;right:10px;top:10px;padding:2px 7px;border-radius:5px;background:rgba(15,38,36,.92);color:var(--teal);font-size:10.5px">AI · 족적 축 −4.2°</span>
        <!-- 축소판 지도(지금 보는 범위) -->
        <div style="position:absolute;right:10px;bottom:10px;width:62px;height:88px;border:1px solid var(--line3);border-radius:5px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,.6)">${photo({ zones: ZONES, rot: -4.2, tag: "" })}<span style="position:absolute;left:18%;right:14%;top:8%;bottom:8%;border:1.5px solid var(--blue)"></span></div>
        <span class="mono" style="position:absolute;left:10px;top:36px;padding:2px 7px;border-radius:5px;background:rgba(11,18,29,.9);color:var(--fg2);font-size:10.5px">원본 3,024 × 4,032 · 100%</span>
      </div>`;

    const aiRow = (t, sub, b) => `<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;align-items:center;font-size:11px;line-height:1.35"><span><b style="color:var(--fg)">${t}</b><br><span style="color:var(--dim)">${sub}</span></span>${b}</div>`;
    const sidePanel = `<div style="display:grid;gap:8px;align-content:start">
        <div class="pinbox">${apin(11, "plus")}${side(`<span style="display:flex;align-items:center;gap:6px"><span class="fx-live"></span><span style="color:var(--teal)">AI 제안</span><span style="margin-left:auto;color:var(--dim);font-weight:400;font-size:10px">누르면 반영</span></span>`, `
          ${aiRow("기울기 맞추기", "족적 축 −4.2°", `<button class="btn sm" style="height:22px;padding:0 7px">맞추기</button>`)}
          ${aiRow("족적만 자르기", "여백 6% 남김", `<button class="btn sm" style="height:22px;padding:0 7px">적용</button>`)}
          ${aiRow("좌우반전", "전사판채취법 사진", `<button class="btn sm warn" style="height:22px;padding:0 7px">반전</button>`)}`, "border-color:#1d4a44;background:linear-gradient(160deg,#0d1f21,var(--panel2))")}</div>
        ${side("원본 → 편집본", `<div style="display:grid;grid-template-columns:1fr 14px 1fr;gap:4px;align-items:center">
            <span style="position:relative;height:96px;border-radius:5px;overflow:hidden;border:1px solid var(--line3)">${photo({ zones: ZONES, rot: -4.2, tag: "" })}</span>
            <span style="color:var(--dim);font:600 11px var(--font-mono);text-align:center">›</span>
            <span style="position:relative;height:96px;border-radius:5px;overflow:hidden;border:1px solid #2b4a78">${photo({ zones: ZONES, rot: 0, flip: true, tag: "" })}</span></div>
          <span style="display:flex;justify-content:space-between;color:var(--dim);font-size:10px"><span>받은 그대로</span><span style="color:var(--blue)">저장될 모습</span></span>`)}
        <div class="pinbox">${apin(12, "plus")}${side(`<span style="display:flex;align-items:center">편집 이력<button class="btn sm" style="margin-left:auto;height:20px;padding:0 6px;font-weight:400">↶ 되돌리기</button></span>`, `
          ${[["1", "좌로 4° 회전", "09:41:12"], ["2", "자르기 1,088×2,964", "09:41:30"], ["3", "좌우반전(전사판)", "09:41:34"]].map(([n, t, tm]) => `<div style="display:grid;grid-template-columns:16px minmax(0,1fr) auto;gap:6px;align-items:center;font-size:11px"><b class="mono" style="color:var(--blue)">${n}</b><span style="color:var(--fg2)">${t}</span><span class="mono" style="color:var(--dim);font-size:10px">${tm}</span></div>`).join("")}
          <div style="display:grid;gap:2px;margin-top:2px;padding-top:6px;border-top:1px solid var(--line2);font-size:10.5px;color:var(--dim)">
            <span>원본 보관 · SHA-256</span><b class="mono" style="color:var(--fg2);font-weight:500">9f3a 71c0 … 4be2 c21e</b>
            <span>저장하면 편집본 해시와 이 이력이 사용 기록(S14)에 남습니다</span></div>`)}</div>
      </div>`;

    /* A — 1차 이미지 커팅(사건관리 팝업 위 2번째 겹) */
    const aBody = `<div style="display:grid;gap:8px;padding:10px 12px 12px">
        <div class="pinbox" style="display:flex;gap:10px;align-items:center">${apin(1, "keep", true)}
          ${zoomRot("100", "−4")}<span class="pinbox" style="width:1px;height:20px">${apin(2, "voice")}</span>
          <span style="margin-left:auto;display:inline-flex;gap:4px"><button class="btn sm">취소</button><button class="btn sm">확인</button><button class="btn sm pri" data-lock="investigator analyst admin">저장</button></span>
        </div>
        <div style="display:flex;gap:4px;align-items:center;padding:4px 6px;border:1px dashed var(--line3);border-radius:8px">
          <span style="color:var(--dim);font-size:11px;margin-right:2px">도구(덧붙임)</span>
          <button class="btn sm" style="box-shadow:inset 0 0 0 1px var(--blue);background:var(--blue-bg);color:var(--fg)">⬚ 자르기</button><button class="btn sm">↻ 회전 손잡이</button>
          <button class="btn sm pinbox">⌖ 4점 각도 보정${apin(9, "plus")}</button>
          <span class="pinbox" style="display:inline-flex">${apin(3, "voice")}<button class="btn sm">📏 길이 측정</button></span>
        </div>
        <div style="display:grid;grid-template-columns:minmax(0,1fr) 186px;gap:10px">${canvas}${sidePanel}</div>
        ${bottomRow({ hl: "좌우반전" })}
        <div class="pinbox" style="display:flex;gap:8px;align-items:center;padding:7px 10px;border:1px solid #1f4a2f;border-radius:8px;background:var(--green-bg);color:#86efac;font-size:11.5px">${apin(5, "voice", true)}
          <b>저장함</b> · 잘린 사진이 사건 이미지가 되고, 받은 원본은 해시와 함께 따로 보관됩니다(되돌리기 가능).</div>
      </div>`;

    /* B — 검색 중 보기용 뷰어, 두 장 나란히. 같은 자리에 십자선(함께 움직임) */
    const cross = (c) => `<span style="position:absolute;left:46%;top:0;bottom:0;width:1px;background:${c};opacity:.75"></span><span style="position:absolute;top:36%;left:0;right:0;height:1px;background:${c};opacity:.75"></span><span style="position:absolute;left:46%;top:36%;width:18px;height:18px;margin:-9px 0 0 -9px;border:1.5px solid ${c};border-radius:50%"></span>`;
    const loupe = `<span style="position:absolute;left:52%;top:42%;width:84px;height:84px;border-radius:50%;overflow:hidden;border:2px solid var(--teal);box-shadow:0 6px 18px rgba(0,0,0,.7),0 0 0 3px rgba(45,212,191,.18)">
        <span style="position:absolute;left:-160%;top:-90%;width:420%;height:420%">${photo({ zones: ZONES, rot: 0, flip: true, look: "eq", tag: "" })}</span>
        <span class="mono" style="position:absolute;left:0;right:0;bottom:4px;text-align:center;color:var(--teal);font-size:9.5px;text-shadow:0 0 3px #000">×4</span></span>`;
    const pane = (t, img, on, extra = "") => `<div style="display:grid;gap:6px;padding:8px;border:1px solid var(--line);border-radius:10px;background:var(--panel2)">
        <div style="display:flex;align-items:center;gap:6px;font-size:11.5px"><b>${t}</b>${on.length ? `<span style="margin-left:auto;display:flex;gap:3px">${on.map((o) => `<span class="chip blue" style="height:17px;padding:0 5px;font-size:9.5px">${o}</span>`).join("")}</span>` : ""}</div>
        <div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap">${zoomRot("288", "0")}</div>
        <span style="position:relative;display:block;height:262px;border-radius:8px;overflow:hidden;border:1px solid var(--line)">${img}${cross("var(--teal)")}${extra}</span>
        ${bottomRow({ on, small: true })}
      </div>`;
    const bBody = `<div style="display:grid;gap:8px;padding:10px 12px 12px">
        <div class="pinbox" style="display:flex;align-items:center;gap:8px;padding-right:14px">${apin(13, "plus")}
          <span style="color:var(--dim);font-size:11px">보기 방식</span>
          <span class="seg"><button aria-pressed="true">나란히</button><button aria-pressed="false">겹쳐 보기</button><button aria-pressed="false">밀어서 비교</button></span>
          <span style="margin-left:auto;display:inline-flex;align-items:center;gap:5px;color:var(--teal);font-size:11px"><span class="fx-live" style="width:6px;height:6px"></span>십자선 함께 움직임</span>
        </div>
        <div class="pinbox" style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${apin(6, "voice", true)}
          ${pane("유류 이미지 · _2", photo({ zones: ZONES, rot: 0, flip: true, look: "eq", tag: "" }), ["평준화"], loupe)}
          ${pane("발견 이미지 · 305659", `<span style="position:absolute;inset:0;background:#e9ecf0">${sole({ kind: "shoe", zones: ZONES })}</span>`, [])}
        </div>
        <div style="display:flex;gap:6px;align-items:center;justify-content:center"><span class="seg"><button aria-pressed="true">🔗 함께 확대·이동</button><button aria-pressed="false">따로</button></span></div>
        <div class="pinbox" style="display:flex;gap:8px;align-items:center;padding:7px 10px;border:1px solid var(--line3);border-radius:8px;background:var(--panel3);color:var(--fg2);font-size:11.5px">${apin(7, "voice", true)}
          <b>저장 안 함</b> · 평준화·확대는 보기용이라 닫으면 원본 그대로입니다.</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap" class="pinbox">${apin(8, "plus")}
          <button class="btn sm ai" data-lock="analyst admin">✦ 이 화면 그대로 AI 문양 다시 추출 → S04</button>
          <button class="btn sm ai" data-lock="analyst admin">AI 보정 ▾ 이진화·노이즈 제거</button>
        </div>
      </div>`;

    return M.shell(
      { active: "사건관리", tabs: ["사건관리", "감정서작성", "족윤적 검증", "결재 대기함", "문서접수대장"], title: "사건관리 · 이미지 편집", h: 900 },
      `<div style="position:relative;height:790px">
        ${ghost}
        <div style="position:absolute;inset:0;background:rgba(5,8,13,.72);border-radius:12px"></div>
        ${cap("A · 1차 작업 — 사건관리 팝업에서 족윤적 이미지를 누를 때", 4)}
        ${cap("B · 2차 작업 — 검색 중 이미지를 두 번 누를 때", 664)}
        ${modal({ x: 0, y: 24, w: 650, title: "이미지 커팅 <span class='mono' style='font-weight:400;color:var(--mute)'>00001-25-0649_2</span>", btns: `<span class="chip blue" style="height:20px">1차 작업</span><button class="btn sm ghost">✕</button>`, body: aBody })}
        ${modal({
          x: 660, y: 24, w: 512, title: "이미지 뷰어 · 나란히",
          btns: `<span class="chip" style="height:20px">보기용</span><span class="chip" data-role="verifier" style="height:20px">기술책임자 · 보기만</span><span class="pinbox" style="display:inline-flex;gap:6px;padding-right:6px">${apin(10, "better")}<button class="btn sm">닫기</button></span>`,
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
    lead: "SCAS 이미지 커팅·이미지 뷰어 창의 버튼 자리와 이름을 그대로 둡니다. 편집은 두 가지입니다 — A 사건 이미지를 바로잡는 1차 이미지 커팅(저장함), B 검색하면서 문양을 잘 보려고 잠깐 바꾸는 보기용 뷰어(저장 안 함). r3: A는 자르기 틀·회전 손잡이가 있는 진짜 작업 화면으로, 오른쪽에 AI 제안(기울기·자르기·반전)과 원본→편집본, 편집 이력·원본 해시를 붙였습니다. B는 두 장에 같은 자리 십자선이 함께 움직이고, 돋보기와 보기 방식(나란히·겹쳐 보기·밀어서 비교)을 더했습니다.",
    scas,
    ours,
    fit: {
      area: ["same", "위 버튼 줄 · 가운데 그림 · 아래 버튼 줄, 뷰어는 두 장 나란히(오른쪽 칸만 덧붙임)"],
      buttons: ["same", "−[100]+ 좌[90]우 … 취소·확인·저장 / 처음상태~상하반전 이름·순서 그대로, 새 도구는 아래 한 줄로 덧붙임"],
      popup: ["near", "OS 창 → 앱 안 레이어(사건관리·문양 상세보기 팝업 위 2번째 겹)"],
      columns: ["na", "표·폼 없음"],
    },
    notes: [
      { n: 1, kind: "keep", title: "SCAS 버튼 자리 그대로", text: "위 줄 왼쪽 −[100]+ · 좌[90]우, 오른쪽 취소·확인·저장. 아래 줄 처음상태·평준화·색상반전·좌우반전·밝게·어둡게·상하반전. 이미지 뷰어도 같은 배치에 「닫기」입니다.", src: "5613 S1·S9 · 5614 P1" },
      { n: 2, kind: "voice", title: "좌/우 버튼으로 조금씩", text: "「그냥 좌측 딱 누르면 바로 좌측으로 되고 우측 누르면 우측으로 되니까… 이게 조금만 틀어주면 될 것 같아요.」 좌/우 버튼과 각도 칸을 그대로 두고, 자르기 틀 위 회전 손잡이(지금 −4.2° → 0°)는 덧붙이기만 했습니다.", src: "5613 00:48–01:06" },
      { n: 3, kind: "voice", title: "자가 있으면 길이, 없으면 자르기만", text: "「자가 없잖아요. 여기는 자가 없지만 우리가 임의대로 할 수가 있어요.」 자가 보이면 AI가 눈금을 읽어(1 cm = 120 px) 자르기 틀 크기를 cm로도 보여 주고 「길이 측정」을 켭니다. 자가 없는 사진은 길이 측정을 끄고 자르기·회전만으로 끝냅니다.", src: "5613 00:32–00:34" },
      { n: 4, kind: "voice", title: "전사판은 좌우반전 추천", text: "「전사지에다가 딱 찍고 뒤집어가지고 자를 대는 거기 때문에… 좌우 반전을 해야지 찍힌 상황인 거예요.」 채취 방법이 전사판채취법이면 「좌우반전」 버튼을 주황으로 표시해 먼저 누르게 합니다(자동으로 뒤집지는 않음).", src: "5613 02:18–02:42" },
      { n: 5, kind: "voice", title: "A 1차 이미지 커팅 = 저장함", text: "「똑바로 해서 확인을 누르면 잘라져요. 저장을 누른단 말이에요.」 1차 작업에서 자르고 돌린 사진은 사건 이미지로 저장됩니다. 받은 원본은 따로 보관해 되돌릴 수 있습니다.", src: "5613 00:05–00:07" },
      { n: 6, kind: "voice", title: "두 화면 나란히", text: "「여기서 더블클릭을 해. 그래서 옆에다가 놓고… 두 개 화면을 띄워놓고」 유류·발견 이미지를 한 레이어 안에 나란히 띄우고, 확대·이동과 십자선이 함께 움직입니다(따로도 가능). 유류 이미지에는 ×4 돋보기를 띄울 수 있습니다.", src: "5613 06:02–06:08" },
      { n: 7, kind: "voice", title: "B 보기용 뷰어 = 저장 안 함", text: "「편집해서 저렇게 문양을 보기 위한 용도지 저장할 필요는 없다는 거예요… 원본이기 때문에 저장을 안 해.」 검색 중 뷰어에서 바꾼 밝기·반전은 닫으면 사라지고, 「저장」 버튼이 없습니다. 지금 켜진 보기(예 평준화)는 아래 버튼 줄과 그림 위 칩에 파랗게 표시됩니다.", src: "5613 07:48–07:56" },
      { n: 8, kind: "plus", title: "보이는 그대로 AI 다시 추출", text: "「이렇게 바꾼 걸로 한 번 더 인공지능으로 추출해 볼 수 있는… 변경해서 추출하는 걸 원하는 거지.」 보기용 뷰어에서 잘 보이게 바꾼 화면을 임시 편집본으로 S04에 넘겨 AI 문양 추출을 다시 돌립니다. 저장은 하지 않습니다.", src: "5613 08:02–08:38" },
      { n: 9, kind: "plus", title: "4점 각도 보정 · AI 보정은 접어 둠", text: "비스듬히 찍힌 사진을 반듯하게 펴는 4점 각도 보정을 도구 줄에 덧붙였습니다. 이진화·노이즈 제거 같은 AI 보정은 감정관 반응(「이런 기능보다는 그냥.」)이 미지근해 「AI 보정 ▾」 하나로 접어 두었습니다.", src: "사업계획서 p36 · 5616 14:08" },
      { n: 10, kind: "better", title: "어디서나 같은 뷰어 · 보는 사람별 권한", text: "「언제 어디서든 확대해서 볼 수 있게」 — 사건관리·문양 상세보기·검색결과 어디서 열어도 같은 뷰어가 한 겹으로 뜹니다. 1차 커팅 「저장」과 AI 다시 추출은 감정관·관리자(수사관은 등록 때 저장 가능), 기술책임자는 보기만 합니다.", src: "5613 07:44" },
      { n: 11, kind: "plus", title: "AI 제안 — 기울기·족적만 자르기·좌우반전(r3)", text: "감정관이 좌/우 버튼으로 조금씩 하던 일을 AI가 먼저 계산해 둡니다: 족적 축이 −4.2° 기울었으니 맞추기, 족적 둘레에 여백 6%만 남기고 자르기, 전사판 사진이니 좌우반전. 버튼을 눌러야 반영되고, 누른 결과는 자르기 틀과 「원본 → 편집본」 그림에 바로 보입니다.", src: "5613 00:00–02:42 · 사업계획서 p36" },
      { n: 12, kind: "plus", title: "편집 이력 · 원본 해시(r3)", text: "회전·자르기·반전을 한 순서대로 시각과 함께 남기고 한 단계씩 되돌립니다. 받은 원본은 SHA-256 해시(파일 지문)와 함께 그대로 보관하고, 저장하면 편집본 해시와 이력이 사용 기록(S14)에 남습니다 — 감정서에 「어떤 원본을 어떻게 손댔는지」를 댈 수 있습니다.", src: "사업계획서 p16–19 기록·보안" },
      { n: 13, kind: "plus", title: "십자선 · 돋보기 · 보기 방식(r3)", text: "두 장의 같은 자리에 십자선이 함께 움직여 「이 무늬가 저 무늬와 같은 자리인가」를 바로 봅니다. 「나란히」(SCAS처럼)가 기본이고, 「겹쳐 보기」(투명도)와 「밀어서 비교」(가운데 선을 끌어 반씩)는 고를 때만 바뀝니다.", src: "5613 06:02–06:44 · 18:30" },
    ],
  });
})();
