/* S02 사건 상세·등록 — SCAS 「사건관리」 레이어 팝업 (IMG_5613 00:00–03:30, 11:52, 16:22, 19:45–21:21)
   r2: 한 페이지로 펼쳤던 r1을 SCAS와 같은 자리·크기의 레이어 팝업으로 되돌림(좌 족윤적 이미지·이미지 목록 / 우 사건정보·현장 이미지 정보). */
(function () {
  const { pin, apin, sole } = M;

  /* ── 우리 앱의 레이어(모달) 한 겹 ── */
  const modal = ({ x, y, w, title, btns, body }) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;border:1px solid #2b4a78;border-radius:12px;background:var(--panel);box-shadow:0 24px 70px rgba(0,0,0,.7)">
      <div style="display:flex;align-items:center;gap:8px;height:42px;padding:0 10px 0 14px;border-bottom:1px solid #2b4a78;border-radius:12px 12px 0 0;background:linear-gradient(90deg,#132445,#0e1a30)"><b style="font-size:13.5px">${title}</b><span style="margin-left:auto;display:flex;gap:6px;align-items:center">${btns}</span></div>${body}</div>`;
  const band = (t, r = "") => `<div style="display:flex;align-items:center;gap:8px;min-height:30px;padding:0 10px;border-left:3px solid var(--blue2);background:rgba(21,34,56,.7);font-size:12.5px;font-weight:600">${t}<span style="margin-left:auto;display:flex;gap:6px;align-items:center;font-weight:400">${r}</span></div>`;

  /* 이미지 목록(자연 정렬). dup = 같은 사진으로 의심되는 다른 장 */
  const FILES = [
    { n: 1, kb: "5,762" }, { n: 2, kb: "6,829", on: true }, { n: 3, kb: "5,001" }, { n: 4, kb: "4,763" },
    { n: 5, kb: "4,763", dup: 4 }, { n: 6, kb: "5,871" }, { n: 7, kb: "5,402" }, { n: 8, kb: "4,926" },
  ];
  const chk = (on) => `<span style="color:${on ? "var(--blue)" : "var(--faint)"}">${on ? "☑" : "☐"}</span>`;
  const sel = (t, x = "") => `<span class="inp w100" style="${x}">${t}<span class="caret">▾</span></span>`;
  const txt = (t, x = "") => `<span class="inp w100" style="${x}">${t}</span>`;
  const ro = (t) => `<span class="mono" style="color:var(--fg)">${t}</span>`;
  const F = (l, v, o = {}) => `<div class="l ${o.req ? "req" : ""}">${l}</div><div class="v ${o.span ? "span3" : ""}" ${o.x ? `style="${o.x}"` : ""}>${v}</div>`;
  const pick = (t) => `<span class="inp w100">${t}<span class="caret" style="color:var(--blue)">⌕</span></span>`;
  const radio = (opts, on) => `<span class="radio" style="gap:8px">${opts.map((o) => `<span class="${o === on ? "on" : ""}">${o}</span>`).join("")}</span>`;

  function ours() {
    const ghost = `<div style="opacity:.3;pointer-events:none">
        <div class="panel" style="height:150px;margin-bottom:12px"></div>
        <div class="panel" style="height:760px;padding:50px 14px 0">${Array.from({ length: 12 }, () => `<div style="height:44px;border-bottom:1px solid var(--line2)"></div>`).join("")}</div></div>`;

    const list = FILES.map(
      (f) => `<tr class="${f.on ? "sel" : ""}"><td style="padding:0 6px;height:30px">${chk(f.on)}</td>
        <td style="padding:0 6px;height:30px"><span class="mono" style="font-size:11.5px">00001-25-0649_${f.n}.jpg</span>${f.dup ? ` <span class="chip amber pinbox" style="height:18px;padding:0 6px;font-size:10.5px">중복? _${f.dup}${apin(4, "voice")}</span>` : ""}</td>
        <td class="r num" style="padding:0 6px;height:30px;color:var(--mute)">${f.kb} KB</td></tr>`
    ).join("");

    const body = `<div style="display:grid;grid-template-columns:300px minmax(0,1fr);gap:12px;padding:12px" class="pinbox">${apin(1, "keep", true)}
      <!-- 왼쪽: 족윤적 이미지 + 이미지 목록 (SCAS 자리 그대로) -->
      <div style="display:grid;gap:8px;align-content:start">
        ${band("족윤적 이미지", `<span style="color:var(--dim);font-size:11px">누르면 이미지 커팅</span>`)}
        <div class="imgbox pinbox" style="height:300px;cursor:zoom-in">
          ${sole({ kind: "scene", zones: ["herring", "grid", "blocks"], ruler: true })}
          <span class="cap">00001-25-0649_2 · 전사판</span>
        </div>
        <div class="pinbox" style="display:flex;gap:6px;align-items:center;padding-right:14px">${apin(8, "better")}<span class="chip amber" style="height:22px">전사판 → 좌우반전 필요</span><button class="btn sm">이미지 커팅 열기</button></div>
        ${band("이미지 목록", `<span class="num" style="color:var(--dim);font-size:11px">12장 · 1→12순</span><button class="btn sm" data-role="investigator analyst admin">추가</button><button class="btn sm" data-role="investigator analyst admin">삭제</button>`)}
        <div class="pinbox">${apin(3, "better")}
          <table class="grid"><thead><tr><th style="padding:0 6px;height:28px"></th><th style="padding:0 6px;height:28px">파일명칭</th><th class="r" style="padding:0 6px;height:28px">파일크기</th></tr></thead><tbody>${list}</tbody></table>
          <div style="padding:6px 8px;color:var(--dim);font-size:11px">… <span class="mono">_9 _10 _11 _12</span></div>
          <div style="display:grid;place-items:center;height:40px;border:1px dashed #2b4a78;border-radius:8px;color:var(--fg2);font-size:11.5px">⤓ 여기에 사진을 끌어 놓으면 여러 장 추가</div>
        </div>
        <div style="padding:7px 10px;border:1px solid #4d3a12;border-radius:8px;background:var(--amber-bg);color:var(--amber);font-size:11.5px;line-height:1.5" data-role="analyst admin">1차 작업 점검 · 같은 사진 의심 1 · 확인 필요 칸 1</div>
      </div>

      <!-- 오른쪽: 사건정보 + 현장 이미지 정보 (SCAS 라벨 순서 그대로) -->
      <div style="display:grid;gap:8px;align-content:start">
        <div class="pinbox" style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:11.5px;color:var(--mute);padding-right:16px">${apin(9, "plus")}
          <span class="chip blue" style="height:20px">공문 자동 접수 · 07-24 09:10</span><span>문서접수대장 연동</span>
          <span style="color:var(--dim)">·</span><span>담당 감정관 박○○ 경위</span>
          <span style="color:var(--dim)">·</span><span class="chip" style="height:20px;color:var(--amber);border-color:#4d3a12">배당 절차: 확인 필요</span>
        </div>
        ${band("사건정보", `<span style="color:var(--dim);font-size:11px">대부분 공문 그대로 · 수정은 「수정」으로</span>`)}
        <div class="form" style="grid-template-columns:108px minmax(0,1fr) 108px minmax(0,1fr)">
          ${F("감정번호", ro("00001-25-0649"))}${F("문서번호", ro("SCAS수사부-871"))}
          ${F("SCAS사건번호", ro("2025-03321"))}${F("피해자 성명", txt("김○○"))}
          ${F("의뢰관서", `<div class="pinbox" style="display:flex;gap:8px;align-items:center;padding-right:12px">${apin(7, "better")}<span style="white-space:nowrap;color:var(--mute)">${chk(false)} 타기관</span>${pick("대구청 › 동부서")}</div>`, { req: 1 })}${F("출생년도", txt("1968"))}
          ${F("사건명", sel("주거침입"), { req: 1 })}${F("용의자 유무", radio(["유", "무"], "무"), { req: 1 })}
          ${F("사건일시", `<div style="display:grid;gap:4px;font-size:11.5px"><span style="display:flex;gap:6px;align-items:center"><span style="color:var(--dim);width:44px;white-space:nowrap">시작</span><span class="inp mono" style="flex:1;font-size:11.5px">2025-07-22 23:00</span></span><span style="display:flex;gap:6px;align-items:center"><span style="color:var(--dim);width:44px;white-space:nowrap">${chk(true)} 종료</span><span class="inp mono" style="flex:1;font-size:11.5px">2025-07-23 06:30</span></span></div>`, { req: 1 })}${F("사건장소", sel("주택 › 단독주택"), { req: 1 })}
          ${F("발생관서", pick("대구청 › 동부서"), { req: 1 })}${F("검거여부", sel("수사중"))}
          ${F("사건주소", txt("대구광역시 동구 ○○로 ○○"), { req: 1 })}${F("감정의뢰 담당자", txt("경사 이○○"))}
          ${F("사건개요", `<div style="color:var(--fg2);line-height:1.5">피의자는 2025. 7. 22. 23:00경부터 다음 날 06:30경 사이 피해자 주거지 뒷문으로 침입하여 거실 서랍장의 현금을 절취한 것임.</div>`, { req: 1, span: 1 })}
          ${F("비고", `<span style="color:var(--faint)">—</span>`, { span: 1 })}
        </div>
        <div class="pinbox">${apin(6, "voice")}${band(`현장 이미지 정보 <span class="chip blue mono" style="height:20px">_2</span>`, `<span class="seg"><button aria-pressed="true">이 이미지만</button><button aria-pressed="false">선택한 이미지 모두 적용</button></span><button class="btn sm" data-lock="investigator analyst admin">수정</button>`)}</div>
        <div class="form" style="grid-template-columns:108px minmax(0,1fr) 108px minmax(0,1fr)">
          ${F("구분", radio(["신발", "타이어"], "신발"), { req: 1 })}${F("이미지 이름", sel("00001-25-0649_2.jpg", "font-family:var(--font-mono);font-size:11.5px"))}
          ${F("채취 일시", `<span class="inp w100 mono" style="font-size:11.5px">2025-07-23 08:40</span>`, { req: 1 })}${F("채취자 계급", sel("경사"), { req: 1 })}
          ${F("채취 장소", sel("거실 바닥"), { req: 1 })}${F("채취자 이름", txt("이○○"), { req: 1 })}
          ${F("채취 방법", `<div class="pinbox" style="display:grid;gap:4px;padding-right:12px">${apin(5, "voice")}${sel(`기타 <span class="chip amber" style="height:18px;padding:0 6px;font-size:10.5px;margin-left:6px">확인 필요</span>`, "border-color:#4d3a12")}<span style="font-size:11px;color:var(--amber)">사진에 전사지가 보임 → 「전사판채취법」?</span></div>`, { req: 1 })}${F("감정물 종류", sel("사진"), { req: 1 })}
          ${F("제조사", sel("미상"))}${F("족적 구분", radio(["좌", "우", "불상"], "우"))}
          ${F("상표", sel("—"))}${F("굽 유무", radio(["유", "무", "불상"], "유"))}
          ${F("화종", sel("운동화"))}<div class="l"></div><div class="v"></div>
        </div>
      </div>
    </div>`;

    const btns = `<span class="pinbox" style="display:inline-flex;gap:6px">${apin(2, "keep", true)}
        <button class="btn sm">이전</button><button class="btn sm">다음</button><button class="btn sm">사건복사</button><button class="btn sm" data-lock="investigator analyst admin">수정</button><button class="btn sm">닫기</button></span>
      <span style="width:1px;height:20px;background:var(--line3)"></span>
      <span class="pinbox" style="display:inline-flex;gap:6px">${apin(10, "better")}
        <button class="btn sm pri" data-role="analyst admin">검색 (문양 상세보기) →</button>
        <span class="chip" data-role="verifier" style="height:22px">기술책임자 · 읽기 전용</span>
        <span class="chip" data-role="investigator" style="height:22px">수사관 · 의뢰한 사건만</span></span>`;

    return M.shell(
      { active: "사건관리", tabs: ["사건관리", "감정서작성", "족윤적 검증", "결재 대기함", "문서접수대장"], title: "사건관리", h: 1020 },
      `<div style="position:relative;min-height:920px">
        ${ghost}
        <div style="position:absolute;inset:0;background:rgba(5,8,13,.7);border-radius:12px"></div>
        ${modal({ x: 0, y: 6, w: 1180, title: "사건관리 <span class='mono' style='font-weight:400;color:var(--mute);margin-left:6px'>00001-25-0649</span>", btns, body })}
      </div>`
    );
  }

  function scas() {
    const files = ["_1", "_10", "_11", "_12", "_2", "_3", "_4", "_5"];
    const sizes = ["5900362", "6992910", "5120944", "4877120", "6012384", "5530211", "5310076", "4980544"];
    const L = (t) => `<td class="lbl">${t}</td>`;
    const box = '<span class="ph" style="display:inline-block;width:110px;height:14px;vertical-align:middle"></span>';
    const dd = (t) => `${t || ""} ▾`;
    return M.scasShell(
      { treeOn: "사건관리", h: 750 },
      `<div class="box" style="padding:8px;height:120px"><table><tbody>
          <tr><td class="lbl">감정번호</td><td></td><td class="lbl">문서번호</td><td></td><td class="lbl">사건명</td><td>전체 ▾</td></tr>
          <tr><td class="lbl">등록일자</td><td>2025-06-25 📅 ~ 2025-07-24 📅</td><td class="lbl">피해자</td><td></td><td class="lbl">구분</td><td>◉전체 ○신발 ○타이어</td></tr></tbody></table></div>
      <div class="dim"></div>
      <div class="modal" style="left:16px;top:14px;width:1190px;height:650px">
        <div class="bar">사건관리 <span style="font-weight:400"><span class="sbtn">이전</span> <span class="sbtn">다음</span> <span class="sbtn">사건복사</span> <span class="sbtn">수정</span> <span class="sbtn">닫기</span> &nbsp;✕</span></div>
        <div style="display:grid;grid-template-columns:270px minmax(0,1fr);gap:8px;padding:8px">
          <div>
            <div class="bar" style="height:22px">족윤적 이미지</div>
            <div class="ph" style="height:230px;background:#8fb3f0;color:#fff">현장 사진</div>
            <div class="bar" style="height:22px;margin-top:8px">이미지 목록 <span style="font-weight:400"><span class="sbtn">추가</span> <span class="sbtn">삭제</span></span></div>
            <table><thead><tr><th>파일명칭</th><th>파일크기</th></tr></thead><tbody>
              ${files.map((f, i) => `<tr><td style="${i === 1 ? "background:var(--s-yellow)" : ""}">00001-25-0649${f}.jpg</td><td style="text-align:right;${i === 1 ? "background:var(--s-yellow)" : ""}">${sizes[i]}</td></tr>`).join("")}
            </tbody></table>
          </div>
          <div>
            <div class="bar" style="height:22px">사건정보</div>
            <table><tbody>
              <tr>${L("감정번호")}<td>00001-25-0649</td>${L("문서번호")}<td>SCAS수사부-871</td></tr>
              <tr>${L("SCAS사건번호")}<td>2025-03321</td>${L("피해자 성명")}<td>${box}</td></tr>
              <tr>${L("의뢰관서*")}<td>☐타기관 ${dd("대구지방경찰청")} ${dd("동부경찰서")}</td>${L("출생년도")}<td>${box}</td></tr>
              <tr>${L("사건명*")}<td>${dd("주거침입")}</td>${L("용의자 유무*")}<td>○유 ◉무</td></tr>
              <tr>${L("사건일시*")}<td>시작 2025-07-22 📅 23 ▾ 00 ▾<br>☑종료 2025-07-23 📅 06 ▾ 30 ▾</td>${L("사건장소*")}<td>${dd("주택")} ${dd("단독주택")}<br>${dd("")}</td></tr>
              <tr>${L("발생관서*")}<td>${dd("대구지방경찰청")} ${dd("동부경찰서")}</td>${L("검거여부")}<td>${dd("수사중")}</td></tr>
              <tr>${L("사건주소*")}<td>[주소]</td>${L("감정의뢰 담당자")}<td>[계급] [이름]</td></tr>
              <tr>${L("사건개요*")}<td colspan="3" style="height:40px;white-space:normal">피의자는 … 절취한 것임.</td></tr>
              <tr>${L("비고")}<td colspan="3"></td></tr>
            </tbody></table>
            <div class="bar" style="height:22px;margin-top:8px">현장 이미지 정보 <span class="sbtn" style="font-weight:400">수정</span></div>
            <table><tbody>
              <tr>${L("구분*")}<td>◉신발 ○타이어</td>${L("이미지 이름")}<td>${dd("00001-25-0649_10.jpg")}</td></tr>
              <tr>${L("채취 일시*")}<td>☐ 2025-07-23 📅 08 ▾ 40 ▾</td>${L("채취자 계급*")}<td>☐ ${dd("경사")}</td></tr>
              <tr>${L("채취 장소*")}<td>☐ ${dd("거실 바닥")}</td>${L("채취자 이름*")}<td>☐ [이름]</td></tr>
              <tr>${L("채취 방법*")}<td>☐ ${dd("기타")}</td>${L("감정물 종류*")}<td>☐ ${dd("사진")}</td></tr>
              <tr>${L("제조사")}<td>☐ ${dd("")}</td>${L("족적 구분")}<td>☐ ◉좌 ○우 ○불상</td></tr>
              <tr>${L("상표")}<td>☐ ${dd("")}</td>${L("굽 유무")}<td>☐ ◉유 ○무 ○불상</td></tr>
              <tr>${L("화종")}<td>☐ ${dd("")}</td><td class="lbl"></td><td></td></tr>
            </tbody></table>
          </div>
        </div>
      </div>
      ${M.pain(40, 560, "<b>이미지 목록이 _1, _10, _11, _12, _2 순</b> — 문자열 정렬이라 12장 사건에서 순서가 뒤섞임 (5613 16:22)", 250)}
      ${M.pain(840, 470, "<b>채취 방법이 「기타」로 와서 손으로 고침</b> — 이미지마다 현장 이미지 정보를 따로 확인 (5613 02:56–03:24)", 260)}
      ${M.pain(560, 92, "<b>관서는 드롭다운 2단</b> — 지방청 고르고 다시 경찰서. 이미지를 누르면 이미지 커팅이 별도 OS 창으로 뜸 (5613 00:00–01:25)", 270)}`
    );
  }

  M.add({
    id: "s02",
    code: "S02",
    group: "사건관리",
    title: "사건 상세·등록",
    refs: [
      { t: "SCAS 사건관리 팝업", v: "5613 00:00–03:30 · 16:22 · 20:52" },
      { t: "인터뷰: 1차 작업·현장 이미지 정보 수정", v: "5613 02:56–03:24 · 20:46–21:21", voice: true },
    ],
    lead: "SCAS 「사건관리」 레이어 팝업의 자리와 크기를 그대로 둡니다(왼쪽 족윤적 이미지·이미지 목록, 오른쪽 사건정보·현장 이미지 정보, 오른쪽 위 버튼 줄). 감정관이 실제로 하는 「1차 작업」 — 같은 사진 지우기, 채취 방법 「기타」 바로잡기, 전사판 좌우반전 — 을 그 자리에서 바로 보이게 했습니다.",
    scas,
    ours,
    fit: {
      area: ["same", "좌 족윤적 이미지·이미지 목록 / 우 사건정보·현장 이미지 정보, 비율 1:3"],
      buttons: ["same", "이전·다음·사건복사·수정·닫기 같은 순서, 다음 단계 버튼은 구분선 뒤"],
      popup: ["near", "같은 자리·크기의 레이어 팝업. 테마만 다크로 통일, 이미지 커팅은 그 위 2번째 겹"],
      columns: ["same", "사건정보·현장 이미지 정보 라벨과 좌우 배치 그대로"],
    },
    notes: [
      { n: 1, kind: "keep", title: "SCAS 팝업 배치 그대로", text: "목록 위에 레이어로 뜨고 뒤 화면은 어둡게 깔립니다. 왼쪽 약 1/4에 족윤적 이미지와 이미지 목록, 오른쪽에 사건정보와 현장 이미지 정보 — SCAS와 같은 자리입니다.", src: "5613 S2" },
      { n: 2, kind: "keep", title: "이전·다음·사건복사·수정·닫기", text: "오른쪽 위 버튼 줄을 같은 이름·순서로 둡니다. 다음 단계로 가는 「검색 (문양 상세보기) →」는 구분선 뒤에 덧붙였습니다." },
      { n: 3, kind: "better", title: "이미지 목록 숫자 순서 + 끌어 놓기", text: "SCAS의 글자 순서(_1, _10, _11, _12, _2) 대신 _1 → _12로 보여 줍니다. 파일명칭·파일크기 열과 「추가」「삭제」는 그대로이고, 여러 장을 끌어 놓는 칸을 아래에 덧붙였습니다.", src: "5613 16:22 (0649, 12장)" },
      { n: 4, kind: "voice", title: "같은 사진 다시 보낸 것 찾기", text: "1차 작업은 의뢰 이미지 점검입니다. 「똑같은 거를 또 보냈는지 해가지고 삭제도 해야 되고 여기서 추가… 추가도 해야 되고」 같은 크기·같은 그림으로 보이는 장에 「중복? _4」를 붙여 지울지 바로 판단하게 합니다.", src: "5613 20:46–21:15" },
      { n: 5, kind: "voice", title: "채취 방법 「기타」 → 확인 필요", text: "「아, 이거 전사판 채취법인데 왜 기타로 되어있지? 이런 거를 수정을 해주는 거지.」 「기타」로 온 칸에 주황 「확인 필요」를 붙이고, 사진에 전사지가 보이면 「전사판채취법」을 제안합니다(고치는 건 감정관).", src: "5613 02:56–03:04" },
      { n: 6, kind: "voice", title: "현장 이미지 정보는 이미지마다", text: "「이 위 상황은 거의 수정은 안 하지만 여기 밑에 상황은 우리가 수정을 제대로 하거든요.」 좌/우·채취 방법은 장마다 다르므로 「이 이미지만」을 기본으로 두고, 같은 값을 여러 장에 넣을 때만 「선택한 이미지 모두 적용」을 씁니다. 사건정보는 공문 그대로 두는 경우가 많아 읽기 위주로 보입니다.", src: "5613 03:06–03:24" },
      { n: 7, kind: "better", title: "관서 드롭다운 2단 → 검색 한 칸", text: "지방청 → 경찰서 드롭다운 2번 대신 「동부」만 쳐도 「대구청 › 동부서」가 나옵니다. ☐타기관은 그대로 둡니다.", src: "SCAS 의뢰관서·발생관서 드롭다운 2개" },
      { n: 8, kind: "better", title: "이미지 커팅은 그 위 한 겹", text: "족윤적 이미지를 누르면 SCAS처럼 이미지 커팅이 열리되, 별도 OS 창이 아니라 이 팝업 위 2번째 겹(S03)으로 뜹니다. 채취 방법이 전사판이면 「좌우반전 필요」를 미리 알려 줍니다.", src: "5613 00:00–01:25 · 02:18–02:42" },
      { n: 9, kind: "plus", title: "접수 경로 표시 · 배당은 확인 필요", text: "공문이 오면 사건이 자동으로 들어오므로 「공문 자동 접수」와 시각을 보여 줍니다. 「배당」 절차는 인터뷰에서 나오지 않아 「확인 필요」로 두었습니다(다음 인터뷰 질문).", src: "5613 11:31 · interview-needs 6절 질문 3" },
      { n: 10, kind: "better", title: "보는 사람마다 다른 버튼", text: "감정관·관리자는 「검색 (문양 상세보기) →」로 바로 넘어갑니다. 수사관은 의뢰한 사건의 이미지 추가·수정만, 기술책임자는 읽기 전용이라 「수정」이 잠깁니다." },
    ],
  });
})();
