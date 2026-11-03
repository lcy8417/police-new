/* S07 검색결과 확인 — SCAS 「검색결과 확인」 레이어 팝업(S12) + 알림(S10)
   (IMG_5613 13:46–14:22, 16:07–17:59, 26:22, 29:37)
   r2: SCAS 팝업 배치 유지 · 판정과 결과확인완료는 이미지마다 · 끝나면 교차 검증 요청(동료 감정관) */
(function () {
  const { pin, apin, sole } = M;

  const layer = ({ l, t, w, title, head = "" }, body) => `
    <div style="position:absolute;inset:0;z-index:5;background:rgba(5,8,13,.74)"></div>
    <div class="panel pinbox" style="position:absolute;left:${l}px;top:${t}px;width:${w}px;z-index:6;box-shadow:0 24px 70px rgba(0,0,0,.65)">
      <div class="panel-h" style="background:var(--blue-bg)"><span class="t">${title}</span>${head}<span class="r"><span style="color:var(--mute)">✕</span></span></div>
      ${body}
    </div>`;

  const th = "height:28px;padding:0 6px;background:var(--blue-bg);color:var(--fg2);font-size:11px;font-weight:600;text-align:left;white-space:nowrap;border-bottom:1px solid var(--line)";
  const td = "height:30px;padding:0 6px;border-bottom:1px solid var(--line2);font-size:11.5px;color:var(--fg2);white-space:nowrap";
  const stChip = (s) =>
    `<span class="chip ${s === "확인대상선정" ? "blue" : s === "결과확인완료" ? "green" : ""}" style="height:18px;font-size:10px">${s}</span>`;

  /* 이미지 블록 데이터. hist 결과수 = 확인대상 수 / 전체 후보 수 (SCAS 형식) */
  const BLOCKS = [
    {
      img: "00001-25-0646_1", z: ["herring", "grid", "tri"], cut: true, on: "발견", done: false,
      hist: [
        ["572355", "현장문양검색", "확인대상선정", "1/2355", "2025-07-23 09:42:14"],
        ["572414", "현장문양검색", "검색", "0/869", "2025-07-24 17:29:41"],
        ["572420", "하이브리드검색", "확인대상선정", "2/500", "2025-07-24 17:40:05", true],
      ],
      cands: [
        { no: "305659", z: ["herring", "grid", "tri"], from: "572355 · 572420", ai: "" },
        { no: "301122", z: ["wave", "grid", "blocks"], from: "572420", ai: "AI ↑ 14→2위" },
        { no: "288410", z: ["herring", "grid", "lines"], from: "572420", ai: "AI ↑ 31→5위", ex: true },
      ],
    },
    {
      img: "00001-25-0646_2", z: ["dots", "grid", "lines"], on: "불발견", done: true,
      hist: [["572356", "현장문양검색", "결과확인완료", "0/1204", "2025-07-23 09:51:02"]],
      cands: [],
    },
    {
      img: "00001-25-0646_3", z: ["grid", "grid", "lines"], cut: true, on: "감정불능", done: true,
      hist: [],
      cands: [],
    },
  ];

  function block(b, i) {
    const first = i === 0;
    const rows = b.hist.length
      ? b.hist.map(
          (h) => `<tr><td style="${td}">☑</td><td style="${td}" class="mono">${h[0]}</td><td style="${td}">${h[1]}${h[5] ? ` <span class="ai-mark">AI</span>` : ""}</td><td style="${td}">${stChip(h[2])}</td><td style="${td}" class="mono">${h[3]}</td><td style="${td};color:var(--mute)" class="num">${h[4]}</td></tr>`
        ).join("")
      : `<tr><td style="${td};color:var(--dim)" colspan="6">검색 이력 없음 — 족적이 약 30%만 남아 검색하지 않음</td></tr>`;
    const cards = b.cands.length
      ? b.cands.map(
          (c) => `<div style="display:grid;gap:2px;justify-items:center;width:112px;${c.ex ? "opacity:.45" : ""}">
            <span class="imgbox" style="display:block;width:62px;height:88px">${sole({ kind: "shoe", zones: c.z })}</span>
            <b class="mono" style="font-size:11px;color:var(--fg);${c.ex ? "text-decoration:line-through" : ""}">${c.no}</b>
            <span class="mono" style="font-size:9.5px;color:var(--dim)">${c.from}</span>
            ${c.ai ? `<span class="chip teal" style="height:16px;font-size:9.5px;padding:0 5px">${c.ai}</span>` : `<span style="height:16px"></span>`}
            <span style="font-size:11px;color:${c.ex ? "var(--amber)" : "var(--mute)"}">${c.ex ? "☑" : "☐"} 제외</span></div>`
        ).join("")
      : `<span style="align-self:center;color:var(--dim);font-size:12px">확인대상 없음</span>`;
    return `<div class="${first ? "pinbox" : ""}" style="display:grid;grid-template-columns:120px minmax(0,1fr) 430px;gap:6px 12px;padding:10px 14px;border-bottom:1px solid var(--line2)">
        ${first ? apin(3, "keep", true) : ""}
        <span class="mono" style="font-size:12px;color:var(--fg)">${b.img}</span>
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--mute)"><span>☑ 전체선택</span>
          <span style="display:flex;gap:6px;align-items:center">검색방법 <span class="inp" style="width:120px">전체<span class="caret">▾</span></span></span></div>
        <div class="${first ? "pinbox" : ""}" style="display:flex;justify-content:space-between;align-items:center">
          <span class="radio" style="font-size:12.5px">${["발견", "불발견", "감정불능"].map((v) => `<span class="${v === b.on ? "on" : ""}">${v}</span>`).join("")}</span>${first ? pin(4, "voice") : ""}
          ${b.done ? `<button class="btn sm ok" data-role="analyst admin">✓ 결과확인완료</button>` : `<button class="btn sm pri" data-role="analyst admin">결과확인완료</button>`}
        </div>
        ${first ? `<div style="grid-column:3;display:flex;gap:8px;align-items:center;justify-content:flex-end;padding:4px 6px 4px 10px;border:1px solid #4d3a12;border-radius:8px;background:var(--amber-bg);font-size:12px;color:var(--fg2)" data-role="analyst admin">${pin(7, "better")}확인대상을 저장하시겠습니까? <button class="btn sm ok">예</button><button class="btn sm">아니오</button></div>` : ""}
        <span class="imgbox" style="display:block;height:${b.hist.length > 1 ? 150 : 104}px">${sole({ kind: "scene", zones: b.z, cut: b.cut })}</span>
        <div style="min-width:0"><table style="width:100%;border-collapse:collapse"><thead><tr><th style="${th}">☑</th><th style="${th}">검색번호</th><th style="${th}">검색방법</th><th style="${th}">진행상태</th><th style="${th}">결과수</th><th style="${th}">검색일</th></tr></thead><tbody>${rows}</tbody></table></div>
        <div style="display:grid;gap:6px;align-content:start">
          <div class="${first ? "pinbox" : ""}" style="display:flex;gap:8px;min-height:${b.cands.length ? 150 : 60}px;padding:8px;border:1px solid var(--line);border-radius:10px;background:var(--panel2)">${first ? apin(5, "better") + apin(6, "plus", true) : ""}${cards}</div>
          ${first ? `<div class="pinbox" style="display:flex;gap:6px;align-items:center">${pin(10, "better")}<span class="inp w100" style="color:var(--dim)">판정 메모(선택) — 예) 상·중 부위 칸 수 일치, 하 부위 소실</span></div>` : ""}
        </div>
      </div>`;
  }

  function ours() {
    const bgRows = Array.from({ length: 14 }, (_, i) => `<tr><td class="mono">00001-25-06${49 - i}</td><td class="mono">SCAS수사부-${871 + i * 37}</td><td>${["주거침입", "절도", "강도"][i % 3]}</td><td>대구청</td><td class="num">2025-07-${24 - (i >> 1)}</td></tr>`).join("");
    const td2 = "padding:6px 10px;border-bottom:1px solid var(--line2);font-size:12.5px;color:var(--fg2)";
    const tl = "padding:6px 10px;border-bottom:1px solid var(--line2);font-size:12px;color:var(--mute);background:rgba(13,20,32,.55);white-space:nowrap;width:84px";

    const body = `
      <div class="pinbox" style="padding:10px 14px 4px">${apin(2, "keep", true)}
        <table style="width:100%;border-collapse:collapse;border-top:1px solid var(--line2)"><tbody>
          <tr><td style="${tl}">감정번호</td><td style="${td2}" class="mono">00001-25-0646</td><td style="${tl}">범죄명</td><td style="${td2}">주거침입</td><td style="${tl}">의뢰관서</td><td style="${td2}">대구청</td><td style="${tl}">범행장소</td><td style="${td2}">단독주택</td></tr>
          <tr><td style="${tl}">문서번호</td><td style="${td2}" class="mono">SCAS수사부-2944</td><td style="${tl}">용의자유무</td><td style="${td2}">유</td><td style="${tl}">시작</td><td style="${td2}" class="num">2025-07-19 02:10</td><td style="${tl}">종료</td><td style="${td2}" class="num">2025-07-19 04:30</td></tr>
          <tr><td style="${tl}">범행주소</td><td style="${td2}" colspan="7">대구 수성구 ○○동 [주소 가림]</td></tr>
          <tr><td style="${tl}">사건개요</td><td style="${td2};color:var(--mute)" colspan="7">피의자가 주방 창문으로 침입하여 현금을 훔쳐 달아난 사건. 주방 바닥·현관에서 족적 3점 채취.</td></tr>
        </tbody></table>
      </div>
      <div class="pinbox" style="display:flex;align-items:center;gap:10px;margin:8px 14px 0;padding:0 12px;height:32px;border-radius:8px;background:var(--blue3);color:#fff;font-weight:600;font-size:12.5px">검색이력
        <span style="margin-left:auto;display:flex;gap:5px;align-items:center;font-weight:400;font-size:11.5px">${pin(9, "voice")} 이미지 바로가기
          <span class="chip amber" style="height:19px;font-size:10.5px">_1 확인 중</span><span class="chip green" style="height:19px;font-size:10.5px">_2 ✓</span><span class="chip green" style="height:19px;font-size:10.5px">_3 ✓</span>
          <span style="margin-left:6px">결과확인완료 <b class="mono">2 / 3</b></span></span>
      </div>
      ${BLOCKS.map(block).join("")}
      <div class="pinbox" style="display:flex;gap:10px;align-items:center;justify-content:flex-end;padding:10px 14px;background:var(--strip);border-radius:0 0 14px 14px">${pin(8, "voice")}
        <span style="font-size:12px;color:var(--mute)" data-role="analyst admin">모든 이미지가 결과확인완료되면 → 검증요청(교차 검증)</span>
        <span style="font-size:12px;color:var(--fg2)" data-role="analyst admin">교차 검증자</span>
        <span class="inp" style="width:200px" data-role="analyst admin">김○○ 경사 · 감정관<span class="caret">▾</span></span>
        <button class="btn pri" style="opacity:.5" data-role="analyst admin">교차 검증 요청</button>
        <span style="font-size:11px;color:var(--dim)" data-role="analyst admin">_1 완료 후 켜짐 · 본인은 고를 수 없음</span>
        <span class="chip" data-role="verifier">기술책임자: 읽기 전용</span>
        <span class="chip" data-role="investigator">수사관: 판정은 결재완료 뒤 공개</span>
        ${pin(11, "better")}
      </div>`;

    return M.shell(
      { active: "사건관리", tabs: ["사건관리", "감정서작성", "족윤적 검증", "결재 대기함"], title: "사건관리", h: 1010 },
      `<div style="min-height:880px">
        <div class="page-head"><div><div class="crumb">족윤적 · 사건관리</div><h3>사건관리 목록</h3></div></div>
        <div class="panel"><table class="grid"><thead><tr><th>감정번호</th><th>문서번호</th><th>사건명</th><th>의뢰관서</th><th>등록일자</th></tr></thead><tbody>${bgRows}</tbody></table></div>
      </div>
      ${layer({ l: 10, t: 8, w: 1160, title: "검색결과 확인", head: `<span style="margin-left:8px">${pin(1, "keep")}</span><span style="color:var(--mute);font-size:12px;margin-left:8px">사건관리 목록 「확인」에서 열림 · 이미지마다 따로 확인합니다</span>` }, body)}`
    );
  }

  function scas() {
    const bgRows = Array.from({ length: 14 }, (_, i) => `<tr><td>${i + 15}</td><td><span class="ph" style="display:block;width:16px;height:20px"></span></td><td>00001-25-06${35 - i}</td><td>SCAS수사부-${692 + i * 51}</td><td>절도</td><td>경찰청 범죄분석과</td></tr>`).join("");
    const cand = (z) => `<div style="display:grid;gap:2px;justify-items:center"><span style="display:block;width:38px;height:58px">${sole({ kind: "shoe", zones: z, bg: "#ffffff" })}</span><span>☐ 제외</span></div>`;
    const block = (img, rows, cands, on) => `<div style="padding:6px 8px;border-bottom:1px solid var(--s-line)">
        <div style="display:grid;grid-template-columns:90px minmax(0,1fr) 300px;gap:8px;align-items:center;margin-bottom:4px">
          <span style="font-size:11px">${img}</span>
          <div style="display:flex;justify-content:space-between"><span>☑ 전체선택</span><span>검색방법 <span class="sbtn" style="background:#e3f6ea">전체 ▾</span></span></div>
          <div style="display:flex;justify-content:space-between">${["발견", "불발견", "감정불능"].map((v) => (v === on ? `◉${v}` : `○${v}`)).join(" ")}<span class="sbtn">결과확인완료</span></div>
        </div>
        <div style="display:grid;grid-template-columns:90px minmax(0,1fr) 300px;gap:8px">
          <div class="ph" style="height:96px">현장 사진</div>
          <table><thead><tr><th>☐</th><th>검색번호</th><th>검색방법</th><th>진행상태</th><th>결과수</th><th>검색일</th></tr></thead><tbody>${rows}</tbody></table>
          <div class="box" style="display:flex;gap:6px;padding:6px;min-height:80px">${cands}</div>
        </div>
      </div>`;
    return M.scasShell(
      { treeOn: "사건관리", h: 760 },
      `<div class="bar">사건관리 목록</div>
      <div class="box"><table><thead><tr><th>순번</th><th>이미지</th><th>감정번호</th><th>문서번호</th><th>사건명</th><th>처리관서</th></tr></thead><tbody>${bgRows}</tbody></table></div>
      <div class="dim"></div>
      <div class="modal" style="left:60px;top:20px;width:1000px">
        <div class="bar">검색결과 확인 <span>×</span></div>
        <div style="padding:6px">
          <table><tbody>
            <tr><td class="lbl">감정번호</td><td>00001-25-0646</td><td class="lbl">범죄명</td><td>주거침입</td><td class="lbl">의뢰관서</td><td>대구청</td><td class="lbl">범행장소</td><td>단독주택</td></tr>
            <tr><td class="lbl">문서번호</td><td>SCAS수사부-2944</td><td class="lbl">용의자유무</td><td>유</td><td class="lbl">시작</td><td>2025-07-19 02:10</td><td class="lbl">종료</td><td>2025-07-19 04:30</td></tr>
            <tr><td class="lbl">범행주소</td><td colspan="7">대구 수성구 ○○동 [주소]</td></tr>
            <tr><td class="lbl">사건개요</td><td colspan="7" style="white-space:normal;color:#666">피의자가 주방 창문으로 침입하여 …</td></tr>
          </tbody></table>
        </div>
        <div class="bar">검색이력</div>
        ${block("00001-25-0646_1", `<tr><td>☑</td><td>572355</td><td>현장문양검색</td><td>확인대상선정</td><td>1/2355</td><td>2025-07-23 09:42:14</td></tr><tr><td>☑</td><td>572414</td><td>현장문양검색</td><td>검색</td><td>0/869</td><td>2025-07-24 17:29:41</td></tr>`, cand(["herring", "grid", "tri"]), "발견")}
        ${block("00001-25-0646_2", `<tr><td>☐</td><td>572356</td><td>현장문양검색</td><td>검색</td><td>0/1204</td><td>2025-07-23 09:51:02</td></tr>`, "", "불발견")}
        <div style="height:120px"></div>
      </div>
      <div class="modal" style="left:430px;top:300px;width:280px">
        <div class="bar">알림 <span>×</span></div>
        <div style="padding:14px;text-align:center">❔ 확인대상을 저장하시겠습니까?<div style="margin-top:10px"><span class="sbtn b">예</span> <span class="sbtn">아니오</span></div></div>
      </div>
      ${M.pain(740, 420, "<b>알림이 단계마다</b> — 확인대상 저장·결과확인완료 때마다 예/아니오 (5613 17:35)", 260)}
      ${M.pain(120, 470, "<b>어느 검색이 찾은 후보인지 안 보임</b> — 이력 행(4/799, 4/804)과 후보 상자가 따로 놀아 이력 간 비교 불가 (5613 29:37)", 280)}
      ${M.pain(470, 560, "<b>교차 검증자는 화면 밖에서</b> — 「교차 검증 할 수 있는 사람한테 요청」하지만 누구에게 갔는지 이 팝업에 안 보임 (5613 17:42–17:59)", 300)}`
    );
  }

  M.add({
    id: "s07",
    code: "S07",
    group: "문양검색",
    title: "검색결과 확인",
    refs: [
      { t: "SCAS 검색결과 확인", v: "5613 13:46 · 17:35 · 29:37" },
      { t: "인터뷰", v: "5613 14:09 · 16:28 · 17:34–17:59", voice: true },
      { t: "플랫폼 개선 사항", v: "p1–5" },
    ],
    lead: "SCAS 「검색결과 확인」 레이어 팝업을 같은 자리·같은 배치로 둡니다. 위 사건 요약표, 파란 「검색이력」 띠, 이미지마다 [사진 | 검색이력 표 | 확인대상 상자] 블록과 블록 오른쪽 위의 발견/불발견/감정불능·결과확인완료 그대로입니다. 판정은 이미지마다 따로 하고, 모든 이미지가 끝나면 맨 아래에서 동료 감정관에게 교차 검증을 요청합니다.",
    fit: {
      area: ["same", "요약표 → 검색이력 띠 → 이미지 블록(사진|이력표|확인대상) 반복 그대로"],
      buttons: ["same", "전체선택·검색방법·판정 라디오·결과확인완료가 블록마다 같은 자리, 교차 검증 요청만 팝업 끝에 추가"],
      popup: ["near", "사건관리 목록 위 레이어 팝업 1겹 그대로, 알림 창만 블록 안 확인 막대로"],
      columns: ["same", "요약 라벨 배치와 이력표 ☐·검색번호·검색방법·진행상태·결과수·검색일 순서 그대로"],
    },
    scas,
    ours,
    notes: [
      { n: 1, kind: "keep", title: "같은 자리의 레이어 팝업", text: "사건관리 목록에서 「확인」을 누르면 목록 위에 같은 크기로 뜹니다. 뒤 목록은 어둡게 보이고, 창은 우리 다크 모달 1겹뿐입니다.", src: "5613 13:46 · 17:35" },
      { n: 2, kind: "keep", title: "사건 요약표 배치 그대로", text: "1줄 감정번호·범죄명·의뢰관서·범행장소, 2줄 문서번호·용의자유무·시작·종료, 3줄 범행주소, 4줄 사건개요 — SCAS 칸 배치를 바꾸지 않았습니다. 주소는 가려 표시합니다.", src: "5613 17:35" },
      { n: 3, kind: "keep", title: "이미지 블록 구성 그대로", text: "블록마다 왼쪽 이미지번호·사진, 가운데 ☑전체선택·검색방법·이력표(☐·검색번호·검색방법·진행상태·결과수·검색일), 오른쪽 확인대상 상자와 ☐제외가 SCAS와 같은 자리입니다. 결과수는 「확인대상 수 / 전체 후보 수」입니다.", src: "5613 14:15 · 29:37" },
      { n: 4, kind: "voice", title: "판정은 이미지마다 따로", text: "「찍힌 곳이 다르잖아. 다르기 때문에 똑같은 값이 나와도 따로따로 넣는 거에요」 — 발견/불발견/감정불능과 「결과확인완료」를 블록마다 두고, 사건 결과는 이미지 판정을 모아 자동으로 셉니다.", src: "5613 13:56–14:09" },
      { n: 5, kind: "better", title: "확인대상은 같은 이미지 안에서만 합침", text: "한 이미지에서 검색을 여러 번 하면 확인대상을 한 상자에 모으고, 썸네일 밑에 찾은 검색번호(572355 · 572420)를 적습니다. 다른 이미지의 결과와는 합치지 않습니다.", src: "5613 14:09 · 29:37" },
      { n: 6, kind: "plus", title: "AI 리랭킹 도움 표시", text: "하이브리드검색(문양 + 이미지)에서 AI 리랭킹(후보 순서 다시 매기기)으로 올라온 후보에 「AI ↑ 14→2위」를 붙여, 사람이 찾은 것과 AI가 도운 것을 구분합니다.", src: "BP p3 · p12 · 발표 s10" },
      { n: 7, kind: "better", title: "알림 창 → 블록 안 확인 막대", text: "「확인대상을 저장하시겠습니까?」 질문은 그대로 묻되, 팝업 위 알림 창 대신 그 이미지 블록 안 작은 막대(예 / 아니오)로 띄웁니다.", src: "5613 17:35" },
      { n: 8, kind: "voice", title: "결과확인완료 → 동료에게 교차 검증 요청", text: "「결과 확인 완료 누르면… 검증 요청이 되는 거야」, 「교차 검증 할 수 있는 사람한테 요청을 한단 말이에요」 — 모든 이미지가 완료되면 맨 아래에서 교차 검증자(다른 감정관, 본인 제외)를 고르고 요청합니다. 요청은 그 사람의 「족윤적 검증」 탭(S08)으로 갑니다.", src: "5613 17:34–17:59" },
      { n: 9, kind: "voice", title: "이미지가 많아도 길을 잃지 않게", text: "「20개도 보내는 경우도 있거든」, 「12장이 파일이 엄청나게 많겠지… 엄청나게 많아」 — 검색이력 띠에 이미지별 상태 칩(_1 확인 중 · _2 ✓)과 「결과확인완료 2 / 3」을 두어 바로 이동합니다.", src: "5613 16:07–16:44" },
      { n: 10, kind: "better", title: "판정 메모(선택)", text: "판정 이유를 적는 칸을 더했지만 필수는 아닙니다. 인터뷰에 근거가 없어 필수로 할지는 열린 질문으로 남깁니다. 적은 메모는 교차 검증자와 감정서 판독소견 초안에 함께 보입니다." },
      { n: 11, kind: "better", title: "보는 사람에 따라", text: "감정관·관리자는 결과확인완료·확인 막대·교차 검증 요청을 봅니다. 기술책임자는 읽기 전용, 수사관은 결재완료 뒤 공개 안내만 봅니다." },
    ],
  });
})();
