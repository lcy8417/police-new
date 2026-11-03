/* S04 문양 코딩·검색 조건 — SCAS 「문양 상세보기」 팝업 + 「ShoePrintROI」·「인공지능 문양 상세 보기」 다크 창
   (IMG_5613 01:50, 03:37–06:00, 07:07, 12:10–13:27, 21:37–23:32 · IMG_5616 S3' 0:30–2:45)
   r2: SCAS 3열 배치·버튼 줄 유지, 이미지 1장 단위, AI 추출 입력 = 지금 보이는 편집본, AI 문양은 「제안」 상태부터. */
(function () {
  const { pin, apin, sole, picon } = M;

  const SOLE_D =
    "M50 6C78 6 92 32 92 72C92 112 80 132 78 152C76 176 84 202 82 226C80 250 64 258 50 258C36 258 20 250 18 226C16 202 24 176 22 152C20 132 8 112 8 72C8 32 22 6 50 6Z";
  const TABS = ["윤곽", "면", "내부선", "삼각", "사각", "다각", "원", "항목"];
  const modal = ({ x, y, w, title, btns, body }) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;border:1px solid #2b4a78;border-radius:12px;background:var(--panel);box-shadow:0 24px 70px rgba(0,0,0,.7)">
      <div style="display:flex;align-items:center;gap:8px;height:42px;padding:0 10px 0 14px;border-bottom:1px solid #2b4a78;border-radius:12px 12px 0 0;background:linear-gradient(90deg,#132445,#0e1a30)"><b style="font-size:13.5px;white-space:nowrap">${title}</b><span style="margin-left:auto;display:flex;gap:6px;align-items:center">${btns}</span></div>${body}</div>`;
  const band = (t, r = "") => `<div style="display:flex;align-items:center;gap:8px;min-height:30px;padding:0 10px;border-left:3px solid var(--blue2);background:rgba(21,34,56,.7);font-size:12.5px;font-weight:600">${t}<span style="margin-left:auto;display:flex;gap:6px;align-items:center;font-weight:400">${r}</span></div>`;

  /* 문양 행. st: ai(감정관이 확인한 AI 문양) | sug(AI 제안 — 확인 전엔 검색에 안 들어감) | man(수동) */
  const ROWS = [
    { z: "상", on: true, items: [{ p: "n32_04", st: "ai", c: "9", req: 1, cf: 0.93 }, { p: "n21_05", st: "sug", c: "1", cf: 0.61 }] },
    { z: "중", items: [{ p: "n32_04", st: "ai", c: "9", req: 1, cf: 0.88 }, { p: "s81b", st: "sug", c: "1", odd: 1, cf: 0.42 }] },
    { z: "하", items: [{ p: "n32_04", st: "sug", c: "8", cf: 0.71 }] },
    { z: "윤곽", items: [{ p: "s10c", st: "man", c: "1" }], noai: true },
  ];
  const card = (it, pinHtml = "") => {
    const b = it.st === "sug" ? "1px dashed var(--teal)" : it.st === "ai" ? "1px solid #1d4a44" : "1px solid #2b4a78";
    const lab =
      it.st === "sug"
        ? `<span class="ai-mark" style="${it.odd ? "color:var(--amber)" : ""}">AI 제안${it.odd ? "?" : ""}</span>`
        : it.st === "ai"
        ? `<span class="ai-mark">AI · 확인</span>`
        : `<span style="color:var(--blue);font:600 10px var(--font-mono)">수동</span>`;
    const foot =
      it.st === "sug"
        ? `<span style="display:flex;gap:3px"><button class="btn sm ok" style="height:20px;padding:0 7px">✓ 확인</button><button class="btn sm" style="height:20px;padding:0 6px">✕</button></span>`
        : `<span class="chip ${it.req ? "red" : ""}" style="height:19px;padding:0 7px;font-size:10.5px;${it.req ? "" : "color:var(--dim)"}">${it.req ? "● 필수" : "필수"}</span>`;
    return `<div class="pinbox" style="display:grid;justify-items:center;gap:4px;width:92px;padding:7px 4px 6px;border:${b};border-radius:9px;background:${it.st === "sug" ? "rgba(15,38,36,.35)" : "var(--panel2)"};${it.st === "sug" ? "opacity:.92" : ""}">${pinHtml}
      ${picon(it.p, it.st === "man" ? "sel" : "ai", M.PDESC[it.p] || it.p)}${lab}
      ${it.cf ? `<span title="AI 확신도" style="display:flex;align-items:center;gap:4px;width:80px"><span class="fx-bar" style="flex:1;height:3px"><i style="width:${it.cf * 100}%;${it.cf < 0.5 ? "background:var(--amber)" : ""}"></i></span><span class="mono" style="font-size:9.5px;color:${it.cf < 0.5 ? "var(--amber)" : "var(--mute)"}">${it.cf.toFixed(2)}</span></span>` : ""}
      <span class="inp" style="height:20px;padding:0 6px;font-size:11px;gap:10px"><span class="num">${it.c}</span><span style="color:var(--dim)">▾</span></span>${foot}</div>`;
  };

  function ours() {
    const ghost = `<div style="opacity:.3;pointer-events:none"><div class="panel" style="height:150px;margin-bottom:12px"></div>
        <div class="panel" style="height:840px;padding:50px 14px 0">${Array.from({ length: 14 }, () => `<div style="height:44px;border-bottom:1px solid var(--line2)"></div>`).join("")}</div></div>`;

    /* 왼쪽 */
    const imgs = [["_1", "확인완료", "green"], ["_2", "검색 중", "blue", 1], ["_3", "미코딩", ""], ["_4", "미코딩", ""], ["_5", "삭제(중복)", "faint"], ["_6", "미코딩", ""]];
    const left = `<div style="display:grid;gap:8px;align-content:start">
        <div class="pinbox">${apin(9, "better")}${band("현장 이미지", `<span class="seg" style="padding:2px"><button aria-pressed="false" style="padding:2px 8px">원본</button><button aria-pressed="true" style="padding:2px 8px">편집본</button></span>`)}</div>
        <div class="imgbox" style="height:330px">
          ${M.photo({ zones: ["herring", "herring", "herring"], rot: 0, flip: true, look: "bin", tag: "" })}
          <!-- 상·중·하 영역(색 띠) + AI 확신도. 사진 좌표: 족적 x 25–75%, y 1–99% -->
          ${[["상", 1, 35, "74,158,255", "0.93"], ["중", 35, 67, "45,212,191", "0.88"], ["하", 67, 99, "167,139,250", "0.71"]].map(([z, t, b, rgb, cf]) => `<span style="position:absolute;left:22%;right:22%;top:${t}%;height:${b - t}%;background:rgba(${rgb},.14);border-top:${z === "상" ? "0" : `1.5px solid rgb(${rgb})`}"></span>
          <span class="mono" style="position:absolute;left:4px;top:calc(${(t + b) / 2}% - 9px);padding:1px 5px;border-radius:4px;background:rgba(11,18,29,.9);border:1px solid rgba(${rgb},.6);color:rgb(${rgb});font-size:10px"><b>${z}</b> ${cf}</span>`).join("")}
          <span style="position:absolute;left:52%;top:43%;width:14%;height:7%;background:rgba(245,158,11,.25);border:1.5px solid var(--amber)"></span>
          <span class="fx-scan" style="animation-duration:3.6s"></span>
          <span class="chip teal" style="position:absolute;right:6px;top:6px;height:20px">편집본 · 이진화</span>
          <span class="cap">ROI · 경계선 끌어서 조정</span>
        </div>
        <div class="pinbox" style="display:flex;gap:6px;align-items:center;padding:6px 8px;border:1px solid #4d3a12;border-radius:8px;background:var(--amber-bg);color:var(--amber);font-size:11px;line-height:1.4">${apin(8, "voice")}
          ▣ 가격표로 보이는 부분 — 이 자리는 AI가 문양을 못 잡을 수 있습니다</div>
        <div class="pinbox">${apin(3, "voice")}${band("이미지 목록", `<span class="num" style="color:var(--dim);font-size:11px">12장 중 1장 완료</span>`)}</div>
        <table class="grid"><thead><tr><th style="padding:0 8px;height:28px">이미지 번호</th><th style="padding:0 8px;height:28px">상태</th></tr></thead><tbody>
          ${imgs.map(([n, s, col, on]) => `<tr class="${on ? "sel" : ""}"><td class="mono" style="padding:0 8px;height:30px;font-size:11.5px">00001-25-0649${n}</td><td style="padding:0 8px;height:30px"><span class="chip ${col === "green" ? "green" : col === "blue" ? "blue" : ""}" style="height:19px;padding:0 6px;font-size:10.5px;${col === "faint" ? "color:var(--faint);text-decoration:line-through" : ""}">${s}</span></td></tr>`).join("")}
        </tbody></table>
        <div style="display:flex;gap:6px;align-items:center"><span style="color:var(--dim);font-size:11px">… _7 – _12</span><button class="btn sm pri" style="margin-left:auto">다음 이미지 _3 →</button></div>
        ${band("코드 설명")}
        <div style="padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--panel2);font-size:12px;line-height:1.5;color:var(--fg2)"><span class="mono" style="color:var(--blue);font-size:11px">n32_04 · 내부선 › 단선</span><br>${M.PDESC.n32_04}</div>
      </div>`;

    /* 가운데 */
    const rows = ROWS.map((r, i) => {
      const pins = { 0: [apin(6, "voice")], 1: ["", apin(5, "voice")] }[i] || [];
      return `<div style="display:grid;grid-template-columns:54px minmax(0,1fr);gap:10px;align-items:center;padding:8px 10px;border-radius:10px;${r.on ? "box-shadow:inset 0 0 0 2px var(--red);background:rgba(26,16,19,.5)" : "border-bottom:1px solid var(--line2)"}">
        <div style="display:grid;gap:2px"><b style="font-size:15px">${r.z}</b><span style="color:var(--dim);font-size:10.5px;line-height:1.3">${r.on ? "입력 중" : `${r.items.length}개`}</span></div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
          ${r.items.map((it, k) => card(it, pins[k] || "")).join("")}
          ${r.noai ? `<div style="display:grid;place-items:center;width:150px;height:110px;border:1px dashed var(--line3);border-radius:9px;color:var(--mute);font-size:11px;text-align:center;line-height:1.5"><span class="chip" style="height:19px;font-size:10.5px">AI 미지원</span>윤곽은 감정관이<br>직접 넣습니다</div>` : `<div style="display:grid;place-items:center;width:92px;height:110px;border:1px dashed var(--line3);border-radius:9px;color:var(--faint);font-size:11px;text-align:center">＋<br>끌어 놓기</div>`}
        </div></div>`;
    }).join("");

    const mid = `<div style="display:grid;gap:8px;align-content:start">
        ${band("현장 이미지 문양", `<span style="color:var(--teal);font-size:11px">AI 제안 3 · 확인 2</span><button class="btn sm ok" data-lock="analyst admin">제안 모두 확인</button><button class="btn sm" data-lock="analyst admin">상·중·하 같은 문양 한 번에</button>`)}
        <div style="display:grid;gap:4px">${rows}
          <div style="display:grid;grid-template-columns:54px minmax(0,1fr);gap:10px;align-items:center;padding:8px 10px"><b style="font-size:15px">문자열</b><span class="inp w100" style="color:var(--dim)">밑창에 글자가 보이면 입력</span></div>
        </div>
        <div class="pinbox" style="display:grid;gap:8px;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--panel2)">${apin(10, "keep")}
          <div style="display:flex;gap:8px;align-items:center">
            <span class="seg">${TABS.map((t) => `<button aria-pressed="${t === "내부선"}" style="padding:4px 9px">${t}</button>`).join("")}</span>
            <span class="inp" style="flex:1;color:var(--dim);font-size:11.5px">⌕ 이름·설명 찾기</span>
          </div>
          <div style="display:flex;gap:5px;align-items:center"><span style="color:var(--dim);font-size:11px;margin-right:2px">최근 사용</span>${["n32_04", "n21_05", "s10c", "n21_02", "n73_01"].map((p) => picon(p, "sm")).join("")}</div>
          <div style="display:flex;flex-wrap:wrap;gap:5px;padding-top:8px;border-top:1px solid var(--line2)">${M.P.내부선.map((p) => picon(p, p === "n32_04" ? "sel" : "", M.PDESC[p] || p)).join("")}</div>
          <span class="seg" style="justify-self:start">${["단선", "다선1", "다선2"].map((t, i) => `<button aria-pressed="${i === 0}" style="padding:3px 10px">${t}</button>`).join("")}</span>
        </div>
      </div>`;

    /* 오른쪽 */
    const F = (l, v) => `<div class="l" style="padding:6px 8px">${l}</div><div class="v" style="padding:6px 8px">${v}</div>`;
    const radio = (opts, on) => `<span class="radio" style="flex-wrap:wrap;gap:2px 9px;font-size:12px">${opts.map((o) => `<span class="${o === on ? "on" : ""}">${o}</span>`).join("")}</span>`;
    const find = (t) => `<span style="display:flex;gap:4px"><span class="inp w100">${t}</span><button class="btn sm" style="height:26px">찾기</button></span>`;
    const right = `<div style="display:grid;gap:8px;align-content:start">
        ${band("매칭 조건")}
        <div class="form" style="grid-template-columns:66px minmax(0,1fr)">
          ${F("검색구분", radio(["현장문양", "동일범", "용의자문양"], "현장문양"))}
          ${F("등록기간", `<span style="display:grid;gap:3px"><span class="inp mono" style="font-size:11px">2000-01-01</span><span class="inp mono" style="font-size:11px">~ 2025-07-24</span></span>`)}
          ${F("제조사", find(""))}${F("상표", find(""))}${F("화종", find(""))}
          ${F("성별", radio(["전체", "남", "여", "혼용"], "전체"))}
          ${F("굽유무", radio(["전체", "유", "무", "불상"], "전체"))}
          ${F("등록관서", find(""))}
        </div>
        <div class="pinbox">${apin(7, "voice")}${band("검색 방식 <span style='font-weight:400;color:var(--teal);font-size:11px'>덧붙임</span>")}</div>
        <div style="display:grid;gap:6px;font-size:12px">
          <div style="display:grid;gap:2px;padding:8px 10px;border:1px solid var(--teal);border-radius:8px;background:var(--teal-bg)"><span><span style="color:var(--teal)">◉</span> <b>이미지 검색</b> <span class="chip teal" style="height:18px;padding:0 6px;font-size:10.5px">추천</span></span><span style="color:var(--mute);font-size:11px">사진만으로 비슷한 신발을 찾음(문양 몰라도 됨)</span></div>
          <div style="padding:6px 10px;border:1px solid var(--line);border-radius:8px;color:var(--fg2)"><span style="color:var(--faint)">○</span> 문양 검색 <span style="color:var(--dim);font-size:11px">SCAS 방식 그대로</span></div>
          <div style="padding:6px 10px;border:1px solid var(--line);border-radius:8px;color:var(--fg2)"><span style="color:var(--faint)">○</span> 하이브리드 <span style="color:var(--dim);font-size:11px">이미지 + 필수 문양으로 좁힘</span></div>
        </div>
        <div class="pinbox" style="display:grid;gap:6px;padding:10px;border:1px solid #1d4a44;border-radius:10px;background:linear-gradient(160deg,#0d1f21,var(--panel2))">${apin(12, "plus")}
          <span style="display:flex;align-items:center;gap:6px;font-size:11.5px"><span class="fx-live"></span><b style="color:var(--teal)">검색 전 미리보기</b><span style="margin-left:auto;color:var(--dim);font-size:10px">문양 바꾸면 바로 다시 셈</span></span>
          ${[["신발 DB", "128,406", 100, "var(--line3)"], ["매칭 조건 통과", "121,930", 95, "var(--blue3)"], ["필수 문양 상·중 헤링본", "857", 34, "var(--blue2)"], ["먼저 볼 후보(AI 순위)", "Top 10", 12, "var(--teal)"]].map(([k, v, w, c], i) => `<div style="display:grid;gap:3px">
            <span style="display:flex;justify-content:space-between;font-size:11px"><span style="color:${i === 3 ? "var(--teal)" : "var(--mute)"}">${k}</span><b class="mono" style="color:var(--fg)">${v}</b></span>
            <span style="display:block;height:6px;margin:0 ${(100 - w) / 2}%;border-radius:3px;background:${c};${i === 3 ? "box-shadow:0 0 10px rgba(45,212,191,.6)" : ""}"></span></div>`).join("")}
          <span style="color:var(--dim);font-size:10.5px;line-height:1.45">필수를 하나 더 걸면 857 → 312건. 너무 좁히면 정답이 빠질 수 있어 개수를 먼저 보여 줍니다.</span>
        </div>
        ${band("검색이력")}
        <table class="grid" style="font-size:11px"><thead><tr>${["검색번호", "결과건수", "검색방법", "검색결과", "검색일"].map((h) => `<th style="padding:0 4px;height:26px;font-size:10.5px">${h}</th>`).join("")}</tr></thead><tbody>
          ${[["572433", "312", "이미지검색", "07-24"], ["572420", "512", "현장문양검색", "07-24"], ["572419", "869", "인공지능", "07-24"]].map(
            ([a, b, c, d], i) => `<tr class="${i === 0 ? "sel" : ""}"><td class="mono" style="padding:0 4px;height:30px">${a}</td><td class="num r" style="padding:0 4px;height:30px">${b}</td><td style="padding:0 4px;height:30px">${c}</td><td style="padding:0 4px;height:30px"><button class="btn sm" style="height:20px;padding:0 5px">보기</button></td><td class="num" style="padding:0 4px;height:30px">${d}</td></tr>`
          ).join("")}
        </tbody></table>
      </div>`;

    const body = `<div class="pinbox" style="display:grid;grid-template-columns:240px minmax(0,1fr) 270px;gap:12px;padding:12px">${apin(1, "keep", true)}${left}${mid}${right}</div>`;
    const btns = `<span class="pinbox" style="display:inline-flex;gap:6px">${apin(2, "keep", true)}
        <button class="btn sm" style="box-shadow:inset 0 0 0 1px var(--teal);color:var(--teal)" data-lock="analyst admin">인공지능문양관리</button><button class="btn sm">검색결과</button><button class="btn sm pri" data-lock="analyst admin">검색</button><button class="btn sm">다시입력</button><button class="btn sm">닫기</button></span>
      <span style="width:1px;height:20px;background:var(--line3)"></span>
      <span class="pinbox" style="display:inline-flex;gap:6px">${apin(4, "voice")}<button class="btn sm ai" data-lock="analyst admin">✦ 편집한 이미지로 다시 추출</button></span>
      <span class="pinbox" style="display:inline-flex;gap:6px">${apin(11, "better")}<span class="chip" data-role="verifier" style="height:22px">기술책임자 · 보기만</span><span class="chip" data-role="investigator" style="height:22px">수사관 · 볼 수 없음</span></span>`;

    return M.shell(
      { active: "사건관리", tabs: ["사건관리", "감정서작성", "족윤적 검증", "결재 대기함", "문서접수대장"], title: "사건관리 · 문양 상세보기", h: 1010 },
      `<div style="position:relative;min-height:900px">
        ${ghost}
        <div style="position:absolute;inset:0;background:rgba(5,8,13,.72);border-radius:12px"></div>
        ${modal({ x: 0, y: 6, w: 1180, title: "문양 상세보기 <span class='mono' style='font-weight:400;color:var(--mute);margin-left:4px'>00001-25-0649_2</span>", btns, body })}
      </div>`
    );
  }

  function scas() {
    const sic = (p, n) => `<span style="display:inline-grid;justify-items:center;margin-right:4px">${picon(p, "sm")}<span style="font-size:9px;border:1px solid #bbb;padding:0 3px;background:#fff">${n} ▾</span></span>`;
    const rowsHtml = [
      ["상", sic("n32_04", 9) + sic("n21_05", 1), true],
      ["중", sic("n32_04", 9), false],
      ["하", sic("n32_04", 8), false],
      ["윤곽", "", false],
      ["문자열", "", false],
    ].map(([z, h, on]) => `<tr><td class="lbl" style="width:46px;text-align:center">${z}</td><td style="height:44px;${on ? "outline:2px solid #e02424;outline-offset:-2px" : ""}">${h}</td></tr>`).join("");
    return M.scasShell(
      { treeOn: "사건관리", h: 790 },
      `<div class="dim"></div>
      <div class="modal" style="left:12px;top:10px;width:1196px;height:660px">
        <div class="bar">문양 상세보기 <span style="font-weight:400"><span class="sbtn">인공지능문양관리</span> <span class="sbtn">검색결과</span> <span class="sbtn">검색</span> <span class="sbtn">다시입력</span> <span class="sbtn">닫기</span> ✕</span></div>
        <div style="display:grid;grid-template-columns:230px minmax(0,1fr) 290px;gap:8px;padding:8px">
          <div>
            <div class="bar" style="height:22px">현장 이미지</div><div class="ph" style="height:250px;background:#3a3a30;color:#c9b78a">족적 사진</div>
            <div class="bar" style="height:22px;margin-top:6px">이미지 목록</div>
            <table><thead><tr><th>이미지 번호</th></tr></thead><tbody><tr><td style="background:var(--s-yellow)">00001-25-0646_1</td></tr></tbody></table>
            <div class="bar" style="height:22px;margin-top:6px">코드 설명</div>
            <div class="box" style="padding:6px;height:60px;white-space:normal;font-size:11px">${M.PDESC.n32_04}</div>
          </div>
          <div>
            <div class="bar" style="height:22px">현장 이미지 문양</div>
            <table><tbody>${rowsHtml}</tbody></table>
            <div class="bar" style="height:24px;margin-top:6px;justify-content:flex-start;gap:12px;font-weight:400">${TABS.map((t) => `<span style="${t === "면" ? "background:#fff;color:#2d3a8c;padding:0 6px;font-weight:700" : ""}">${t}</span>`).join("")}</div>
            <div class="box" style="display:flex;flex-wrap:wrap;gap:3px;padding:6px"><span class="ph" style="width:28px;height:28px;font-weight:700;color:#555">?</span>${M.P.면.slice(1).concat(M.P.사각.slice(1, 9)).map((p) => picon(p, "sm")).join("")}</div>
            <div style="display:flex;gap:6px;padding:4px;background:#e9ecf3"><span class="sbtn">규칙무늬</span><span class="sbtn">불규칙무늬</span></div>
          </div>
          <div>
            <div class="bar" style="height:22px">매칭 조건</div>
            <table><tbody>
              <tr><td class="lbl">검색구분</td><td>◉현장문양 ○동일범 ○ ○용의자문양</td></tr>
              <tr><td class="lbl">등록기간</td><td>2000-01-01 📅 ~ 2025-07-24 📅</td></tr>
              <tr><td class="lbl">제조사</td><td><span class="sbtn b">찾기</span></td></tr>
              <tr><td class="lbl">상표</td><td><span class="sbtn b">찾기</span></td></tr>
              <tr><td class="lbl">화종</td><td><span class="sbtn b">찾기</span></td></tr>
              <tr><td class="lbl">성별</td><td>◉전체 ○남 ○여 ○혼용</td></tr>
              <tr><td class="lbl">굽유무</td><td>◉전체 ○유 ○무 ○불상</td></tr>
              <tr><td class="lbl">등록관서</td><td><span class="sbtn b">찾기</span></td></tr>
            </tbody></table>
            <div class="bar" style="height:22px;margin-top:6px">검색이력</div>
            <table><thead><tr><th>검색번호</th><th>결과건수</th><th>검색방법</th><th>검색결과</th><th>검색일</th></tr></thead><tbody>
              <tr><td>572415</td><td>481</td><td>현장문양검색</td><td>검색</td><td>2025-07…</td></tr>
              <tr><td>572414</td><td>869</td><td>현장문양검색</td><td>검색</td><td>2025-07…</td></tr></tbody></table>
          </div>
        </div>
      </div>
      <div class="darkwin" style="left:760px;top:250px;width:300px;height:250px">
        <div class="tt">ShoePrintROI - Chrome</div>
        <div style="position:relative;height:190px;margin:6px;background:#000">
          <svg viewBox="0 0 100 264" style="position:absolute;inset:0;width:100%;height:100%"><path d="${SOLE_D}" fill="none" stroke="#3fd16b" stroke-width="2"/><rect x="6" y="4" width="88" height="256" fill="none" stroke="#4a7dff" stroke-width="1.2"/></svg></div>
        <div style="text-align:center"><span class="sbtn b">인공지능 분석 시작</span></div>
      </div>
      <div class="darkwin" style="left:860px;top:330px;width:350px;height:330px">
        <div class="tt">인공지능 문양 상세 보기 - Chrome</div>
        <div style="display:grid;grid-template-columns:110px 1fr;gap:6px;padding:6px">
          <div><div style="font-size:10px">(현장) 이미지 <span class="sbtn">AI 분석🔍</span></div><div class="ph" style="height:170px;background:#111;color:#666;position:relative">사진<span style="position:absolute;left:4px;bottom:2px;color:#fff;font-size:20px;font-weight:700">100%</span></div></div>
          <div style="font-size:10px">현장 이미지 문양
            ${["상", "중", "하"].map((z) => `<div style="display:flex;gap:3px;align-items:center;margin-top:4px">${z} ${picon("n32_04", "sm")}${picon("n51_03", "sm")}${picon("n21_03", "sm")}</div>`).join("")}
            <div style="margin-top:6px;color:#aaa">면 · 내부선 · 삼각 · 사각 · 다각 · 원 · 항목</div></div>
        </div>
        <div style="position:absolute;right:8px;bottom:8px"><span class="sbtn">검색이력 저장</span> <span class="sbtn b">검색결과 보기</span></div>
      </div>
      ${M.pain(260, 610, "<b>아이콘 사냥</b> — 탭 8개 × 하위 탭 × 수십 개, 약 30px 아이콘을 눈으로 찾음 (5613 05:22–06:00 · 5616 0:30–2:45)", 300)}
      ${M.pain(520, 60, "<b>AI는 원본으로만 추출</b> — 뷰어에서 잘 보이게 바꾼 이미지로 다시 추출할 수 없음 (5613 08:02–08:38)", 250)}
      ${M.pain(470, 470, "<b>AI는 따로 뜨는 다크 창 2개</b> — 윤곽은 못 잡고 엉뚱한 문양도 많이 잡음 (5613 03:52–04:34)", 260)}`
    );
  }

  M.add({
    id: "s04",
    code: "S04",
    group: "문양검색",
    title: "문양 코딩·검색 조건",
    refs: [
      { t: "SCAS 문양 상세보기", v: "5613 05:22–06:00 · 21:37" },
      { t: "SCAS ShoePrintROI · 인공지능 문양 상세 보기", v: "5613 03:52–04:52" },
      { t: "인터뷰: 이미지 1장씩 · 편집본 재추출 · 이미지 검색", v: "5613 08:02 · 12:37 · 23:00", voice: true },
    ],
    lead: "SCAS 「문양 상세보기」 팝업의 3열 배치(왼쪽 현장 이미지·이미지 목록·코드 설명 / 가운데 문양 행·팔레트 / 오른쪽 매칭 조건·검색이력)와 버튼 줄을 그대로 둡니다. 따로 뜨던 AI 다크 창 2개는 이 팝업 안 왼쪽 그림으로 들어오고, AI가 넣은 문양은 감정관이 확인하기 전까지 「제안」으로 남습니다. 작업은 SCAS처럼 이미지 1장씩입니다.",
    scas,
    ours,
    fit: {
      area: ["same", "좌 현장 이미지·이미지 목록·코드 설명 / 중 문양 행·팔레트 / 우 매칭 조건·검색이력, 비율 2:5:2"],
      buttons: ["same", "인공지능문양관리·검색결과·검색·다시입력·닫기 같은 순서, 새 버튼은 구분선 뒤 청록"],
      popup: ["near", "같은 자리·크기의 레이어. AI 다크 창 2개는 새 창 대신 같은 레이어 안에서 동작"],
      columns: ["same", "상·중·하·윤곽·문자열 행, 개수 0–9·10이상, 팔레트 8탭·하위 탭, 매칭 조건 순서 그대로"],
    },
    notes: [
      { n: 1, kind: "keep", title: "문양 상세보기 3열 그대로", text: "왼쪽 현장 이미지·이미지 목록·코드 설명, 가운데 현장 이미지 문양·팔레트, 오른쪽 매칭 조건·검색이력. 입력 중인 행의 빨간 테두리도 SCAS 그대로입니다.", src: "5613 S4" },
      { n: 2, kind: "keep", title: "버튼 줄 그대로", text: "인공지능문양관리 · 검색결과 · 검색 · 다시입력 · 닫기를 같은 순서로 둡니다. 「인공지능문양관리」를 누르면 새 창 대신 이 팝업 안에서 AI 모드가 켜집니다." },
      { n: 3, kind: "voice", title: "이미지 1장씩, 다음 이미지로", text: "「두 개를 한꺼번에 할 수가 없잖아. 하나씩 하나씩 하는 거지.」 이미지 목록에 장마다 상태(미코딩·검색 중·확인완료)를 붙이고 「다음 이미지 →」로 넘깁니다. 여러 장을 합친 검색은 만들지 않고, 상만 찍힌 사진은 상만 넣어 검색해도 정상입니다.", src: "5613 12:37–13:27" },
      { n: 4, kind: "voice", title: "편집한 이미지로 다시 추출", text: "「이렇게 바꾼 걸로 한 번 더 인공지능으로 추출해 볼 수 있는… 변경해서 추출하는 걸 원하는 거지.」 AI 추출 입력은 왼쪽에 지금 보이는 그림(원본/편집본 전환)입니다. 버튼 줄 끝 청록 버튼으로 편집본 기준 추출을 다시 돌립니다.", src: "5613 08:02–08:38" },
      { n: 5, kind: "voice", title: "AI 문양은 「제안」부터 · 윤곽은 미지원", text: "「얘는 윤곽을 못 잡아요… 상중하만 잡는 거예요」, 「엉뚱한 걸 많이 잡아놔가지고 얘도 아닐 수 있고」. AI가 넣은 문양은 점선 「AI 제안」으로 두고 ✓ 확인해야 검색에 들어갑니다. 윤곽 행은 「AI 미지원」이라 감정관이 직접 넣습니다. 신뢰도 숫자는 근거가 없어 표시하지 않았습니다.", src: "5613 04:10–04:34" },
      { n: 6, kind: "voice", title: "필수값", text: "「필수갑(필수값)을 적용하면 대체적으로 위로 올라오거든.」 확인한 문양마다 「필수」를 켭니다. SCAS에서 필수를 걸면 개수가 0으로 바뀌던 동작(「0이라는 거는 필수를 적용하기 때문에 0으로 바뀌는 거야」 05:42)의 정확한 뜻은 확인 필요입니다. r1의 가중치는 근거가 없어 뺐습니다.", src: "5613 04:22 · 22:07" },
      { n: 7, kind: "voice", title: "이미지 검색을 첫 후보로", text: "「그냥 이렇게 딱 대면 인공지능이 알아서… 문양이 아니어도 상관없이… 어떤 신발이다라는 도출을 원하는 거잖아요.」 매칭 조건 아래에 검색 방식을 덧붙이고 「이미지 검색」을 추천으로 강조했습니다. 문양 검색(SCAS 방식)과 하이브리드는 그대로 고를 수 있습니다.", src: "5613 23:00–23:32" },
      { n: 8, kind: "voice", title: "가격표 경고", text: "「가격표 그런 것들 때문에 인공지능은 못잡을 수 있겠지.」 가격표처럼 보이는 네모를 주황으로 표시하고, 그 자리 문양은 감정관이 직접 확인하라고 알립니다.", src: "5616 00:31–00:35" },
      { n: 9, kind: "better", title: "AI 다크 창 2개 → 왼쪽 그림 안으로", text: "SCAS는 「ShoePrintROI」 창에서 영역을 잡고 「인공지능 문양 상세 보기」 창에서 결과를 봤습니다. 이제 왼쪽 현장 이미지 위에서 ROI(분석 영역)와 상·중·하 경계선을 끌어 맞추고, 결과는 가운데 문양 행에 바로 채워집니다.", src: "5613 03:52–04:52" },
      { n: 12, kind: "plus", title: "검색 전 미리보기 · AI 확신도(r3)", text: "검색을 누르기 전에 「신발 DB 128,406 → 매칭 조건 통과 121,930 → 필수 문양 857 → 먼저 볼 Top 10」을 깔때기로 보여 줍니다. 필수값을 걸면 정답이 위로 오지만(「필수값을 적용하면 대체적으로 위로 올라오거든」) 너무 걸면 빠질 수 있어 개수를 먼저 봅니다. AI가 넣은 문양 카드마다 확신도 막대(0.42처럼 낮으면 주황)를 달고, 현장 이미지에는 상·중·하 영역을 색 띠로 나눠 영역별 확신도를 적었습니다.", src: "5613 22:07 · 사업계획서 p13" },
      { n: 10, kind: "keep", title: "개수·팔레트·매칭 조건·검색이력 그대로", text: "개수 드롭다운(0–9, 10이상), 팔레트 8탭(윤곽·면·내부선·삼각·사각·다각·원·항목)과 아래쪽 하위 탭, 매칭 조건 순서, 검색이력 열(검색번호·결과건수·검색방법·검색결과·검색일)을 그대로 둡니다. 이름·설명 찾기와 최근 사용 줄만 덧붙였습니다.", src: "5613 05:52 · 5616 S3'" },
      { n: 11, kind: "better", title: "보는 사람마다 다른 권한", text: "감정관·관리자만 인공지능문양관리·검색·다시 추출을 누를 수 있습니다. 기술책임자는 결재 때 코딩 근거를 보기만 하고, 수사관에게는 이 화면이 열리지 않습니다." },
    ],
  });
})();
