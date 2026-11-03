/* S08 검증·결재 — SCAS 「족윤적 검증」 탭(S16) + 「결재 대기함」 탭(S17)
   (IMG_5613 17:34–18:55, 18:52, 19:32)
   r2: 1차 팀장/2차 기술책임자 삭제. 흐름 = 결과확인완료 → 교차 검증(다른 감정관) → 감정서작성 → 결재(기술책임자).
       두 탭은 SCAS처럼 따로, 같은 화면 틀에서 탭 전환. 교차 검증 = analyst, 결재 = verifier */
(function () {
  const { pin, apin, sole } = M;

  const layer = ({ l, t, w, title, head = "" }, body) => `
    <div style="position:absolute;inset:0;z-index:5;background:rgba(5,8,13,.6);border-radius:14px"></div>
    <div class="panel pinbox" style="position:absolute;left:${l}px;top:${t}px;width:${w}px;z-index:6;box-shadow:0 24px 70px rgba(0,0,0,.65)">
      <div class="panel-h" style="background:var(--blue-bg)"><span class="t">${title}</span>${head}<span class="r"><span style="color:var(--mute)">✕</span></span></div>
      ${body}
    </div>`;

  const resChip = (r) => (r === "발견" ? `<span class="chip green">발견</span>` : r === "불발견" ? `<span class="chip">불발견</span>` : `<span class="chip amber">감정불능</span>`);

  /* 족윤적 검증 탭: 내게 온 교차 검증 요청 + 내가 보낸 것 */
  const VQ = [
    { no: "00001-25-0640", sus: "", at: "2025-07-24", req: "부산청", who: "김○○ 경사", res: "발견", st: "요청 받음", mine: false, sel: true },
    { no: "00001-25-0633", sus: "S-25-0107", at: "2025-07-23", req: "서울청", who: "이○○ 경위", res: "불발견", st: "접수함", mine: false },
    { no: "00001-25-0646", sus: "S-25-0112", at: "2025-07-24", req: "대구청", who: "박○○ 경위", res: "발견", st: "보냄 → 김○○ 검증 중", mine: true },
    { no: "00001-25-0612", sus: "S-25-0098", at: "2025-07-16", req: "인천청", who: "김○○ 경사", res: "발견", st: "의견 일치", mine: false },
  ];
  const vst = (s) =>
    s === "의견 일치" ? `<span class="chip green">✓ 의견 일치</span>` : s === "요청 받음" ? `<span class="chip amber"><span class="dot"></span>요청 받음</span>` : s === "접수함" ? `<span class="chip blue">접수함</span>` : `<span class="chip">${s}</span>`;

  /* 결재 대기함 탭 */
  const AQ = [
    { kind: "족윤적 감정서", title: "절도 족적 감정 결과 (00001-25-0612)", biz: "족윤적 감정", dept: "범죄분석과", who: "박○○ 경위", cross: "의견 일치 · 김○○", at: "2025-07-24", sel: true },
    { kind: "족윤적 감정서", title: "주거침입 족적 감정 결과 (00001-25-0601)", biz: "족윤적 감정", dept: "범죄분석과", who: "이○○ 경위", cross: "의견 일치 · 박○○", at: "2025-07-23" },
    { kind: "족윤적 감정서", title: "강도 족적 감정 결과 (00001-25-0598)", biz: "족윤적 감정", dept: "범죄분석과", who: "김○○ 경사", cross: "의견 일치 · 이○○", at: "2025-07-22" },
  ];

  function ours() {
    const vrows = VQ.map(
      (q) => `<tr class="${q.sel ? "sel" : ""}"><td class="mono" style="color:var(--fg)">${q.no}</td><td class="mono">${q.sus || `<span style="color:var(--faint)">—</span>`}</td>
        <td class="num">${q.at}</td><td>${q.req}</td><td>${q.who}${q.mine ? ` <span class="chip" style="height:18px;font-size:10px">나</span>` : ""}</td><td>${resChip(q.res)}</td>
        <td>${q.mine ? `<span style="color:var(--dim);font-size:11.5px">본인 건 — 검증 불가</span>` : `<button class="btn sm" style="background:var(--blue-bg);border-color:#2b4a78;color:var(--blue)">확인</button> <button class="btn sm" style="background:var(--blue-bg);border-color:#2b4a78;color:var(--blue)">검증결과</button>`}</td>
        <td>${vst(q.st)}</td></tr>`
    ).join("");

    const arows = AQ.map(
      (q) => `<tr class="${q.sel ? "sel" : ""}"><td>${q.sel ? "☑" : "☐"}</td><td>${q.kind}</td><td style="color:var(--fg)">${q.title}</td><td>${q.biz}</td><td>${q.dept}</td><td>${q.who}</td>
        <td><span class="chip green" style="height:19px;font-size:10.5px">✓ ${q.cross}</span></td><td class="num">${q.at}</td></tr>`
    ).join("");

    const flow = [
      ["결과확인완료", "감정관 · S07", "done"],
      ["교차 검증", "다른 감정관 · 이 탭", "now"],
      ["감정서작성", "감정관 · S09", ""],
      ["결재", "기술책임자 · 결재 대기함", ""],
    ].map(
      ([t, s, st], i) => `${i ? `<span style="color:var(--dim)">→</span>` : ""}<span style="display:inline-grid;padding:4px 10px;border-radius:8px;border:1px solid ${st === "now" ? "#4d3a12" : "var(--line3)"};background:${st === "now" ? "var(--amber-bg)" : st === "done" ? "var(--blue-bg)" : "var(--panel2)"}">
        <b style="font-size:12px;color:${st === "now" ? "var(--amber)" : "var(--fg2)"}">${t}</b><span style="font-size:10.5px;color:var(--dim)">${s}</span></span>`
    ).join("");

    const tdL = "padding:3px 6px;border:1px solid var(--line2);background:rgba(13,20,32,.6);color:var(--mute);white-space:nowrap";
    const tdV = "padding:3px 6px;border:1px solid var(--line2);color:var(--fg2);white-space:nowrap";

    const modalBody = `<div style="padding:10px 14px 0;display:flex;align-items:center;gap:8px">
        <span class="seg"><button aria-pressed="true">_1 발견</button><button aria-pressed="false">_2 불발견</button></span>
        <span style="font-size:12px;color:var(--mute)">작성자 <b style="color:var(--fg2)">김○○ 경사</b> 판정 메모: 「상·중 칸 수 일치, 하 부위 소실」</span>
        <span style="margin-left:auto;display:flex;gap:5px">
          <button class="btn sm">이전</button><button class="btn sm">다음</button>
          <button class="btn sm locked" title="작성자만">그룹등록</button><button class="btn sm locked" title="작성자만">확인대상</button>
          <button class="btn sm">프린트</button><button class="btn sm">닫기</button></span>
      </div>
      <div style="display:grid;grid-template-columns:250px 210px 320px minmax(0,1fr);gap:10px;padding:10px 14px">
        <div class="pinbox">${apin(5, "voice", true)}<span class="crumb" style="display:block;padding:3px 6px;margin-bottom:4px;border-radius:4px;background:var(--strip)">유류 이미지</span>
          <span class="imgbox" style="display:block;height:300px">${sole({ kind: "scene", zones: ["lines", "grid", "blocks"], ruler: true })}<span class="cap">00001-25-0640_1</span></span></div>
        <div><span class="crumb" style="display:block;padding:3px 6px;margin-bottom:4px;border-radius:4px;background:var(--strip)">발견 이미지</span>
          <span class="imgbox" style="display:block;height:300px">${sole({ kind: "shoe", zones: ["lines", "grid", "blocks"] })}<span class="cap" style="color:#1f2a3a;text-shadow:none">275178</span></span></div>
        <div style="display:grid;gap:6px;align-content:start">
          <span class="crumb" style="display:block;padding:3px 6px;border-radius:4px;background:var(--strip)">측면 이미지</span>
          <span class="imgbox" style="display:block;height:84px;display:grid;place-items:center;color:var(--dim);font-size:11px">측면 사진</span>
          <table style="width:100%;border-collapse:collapse;font-size:11.5px"><tbody>
            <tr><td style="${tdL}">이미지번호</td><td style="${tdV}" class="mono">00001-25-0640_1</td><td style="${tdL}">화류번호</td><td style="${tdV}" class="mono">275178</td></tr>
            <tr><td style="${tdL}">사건명</td><td style="${tdV}">절도</td><td style="${tdL}">화종</td><td style="${tdV}">슬리퍼</td></tr>
            <tr><td style="${tdL}">채취방법</td><td style="${tdV}">사진촬영법</td><td style="${tdL}">상표명</td><td style="${tdV}">기타</td></tr>
          </tbody></table>
          <span style="font-size:11px;color:var(--dim)">사건정보 · 신발정보 전체 라벨은 S06과 같음 ▾</span>
          <div style="display:flex;gap:6px;align-items:center;font-size:11.5px;color:var(--mute)"><span class="chip blue" style="height:19px;font-size:10.5px">두 이미지 함께</span>− 160% ＋ · 처음상태 · 평준화 · 색상반전 …</div>
        </div>
        <div class="pinbox" style="display:grid;gap:8px;align-content:start;padding-left:10px;border-left:1px dashed #1d4a44">${apin(7, "plus")}
          <span class="ai-mark">● 누락 점검</span>
          ${[["이미지 2장 모두 판정", 1], ["확인대상 저장됨 (1건)", 1], ["판정 메모 있음", 1], ["_2 확인대상 없음 — 불발견과 맞음", 1]]
            .map(([t, ok]) => `<div style="display:flex;gap:6px;font-size:11.5px;color:var(--fg2)"><b style="color:${ok ? "#4ade80" : "var(--amber)"}">${ok ? "✓" : "!"}</b>${t}</div>`)
            .join("")}
          <div style="padding:7px 9px;border:1px solid #1d4a44;border-radius:8px;background:var(--teal-bg);font-size:11.5px">
            <div style="display:flex;justify-content:space-between"><span class="ai-mark">● 정밀 대조 참고</span><b class="mono" style="color:var(--teal)">82%</b></div>
            <div class="mono" style="margin-top:3px;color:var(--fg2);font-size:10.5px">Inlier 0.66 · NCC 0.78 · W 0.17 · MI 1.21</div>
            <div style="margin-top:3px;color:var(--mute)">현장 사건이라 참고용 · 판단은 눈으로</div></div>
        </div>
      </div>
      <div class="pinbox" style="display:flex;gap:10px;align-items:center;padding:10px 14px;background:var(--strip);border-radius:0 0 14px 14px" data-role="analyst admin">${pin(6, "voice")}
        <span class="chip blue">교차 검증 접수함 · 07-25 09:12</span>
        <span style="font-size:12.5px;color:var(--fg2)">교차 검증 결과</span>
        <span class="radio" style="font-size:12.5px"><span class="on">의견 일치</span><span>의견 불일치</span></span>
        <span class="inp" style="flex:1;color:var(--dim)">의견 (불일치면 사유 필수 — 작성자에게 돌아감)</span>
        <button class="btn pri">검증결과 저장</button>
      </div>`;

    return M.shell(
      { active: ["족윤적 검증", "결재 대기함"], tabs: ["사건관리", "감정서작성", "족윤적 검증", "결재 대기함"], tabOn: "족윤적 검증", title: "족윤적 검증 · 결재 대기함", h: 1120 },
      `<div class="page-head">
        <div><div class="crumb">족윤적 · 족윤적관리 / 감정서관리</div><h3>족윤적 검증 · 결재 대기함</h3>
          <p>SCAS처럼 두 탭을 따로 두고 같은 화면 틀에서 바꿉니다. 교차 검증은 감정관끼리, 결재는 기술책임자가 합니다.</p></div>
        <div class="pinbox" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end">${apin(9, "better", true)}${flow}</div>
      </div>

      <div class="pinbox" style="display:flex;gap:10px;align-items:center;margin-bottom:10px">${pin(2, "better")}
        <span class="seg" data-role="analyst admin"><button aria-pressed="true">족윤적 검증 <span class="mono" style="color:var(--amber)">1</span></button><button aria-pressed="false">결재 대기함</button></span>
        <span class="seg" data-role="verifier"><button aria-pressed="false">족윤적 검증</button><button aria-pressed="true">결재 대기함 <span class="mono" style="color:var(--amber)">3</span></button></span>
        <span style="color:var(--dim);font-size:12px">보는 사람에 맞는 탭이 먼저 열립니다</span>
      </div>

      <div data-role="analyst admin" class="pinbox" style="position:relative;min-height:760px;margin-bottom:14px">
        <div class="panel pinbox" style="margin-bottom:10px">${apin(1, "keep", true)}
          <div class="panel-b" style="display:flex;gap:10px;align-items:center">
            <span class="crumb">접수일자</span><span class="inp mono" style="width:220px">2025-06-25 ~ 2025-07-24</span><button class="btn pri">조회</button>
            <span style="margin-left:auto;display:flex;gap:6px"><span class="chip amber"><span class="dot"></span>내게 온 요청 1</span><span class="chip">내가 보낸 요청 1</span></span>
          </div>
        </div>
        <div class="panel tc">
          <div class="panel-h"><span class="lbl">CROSS CHECK</span><span class="t">족윤적 검증</span></div>
          <table class="grid"><thead><tr><th>감정번호</th><th>대조번호/용의자번호</th><th>접수일자</th><th>의뢰관서</th><th>작성자</th><th>사건결과</th><th>검증결과확인</th><th class="pinbox">교차 검증 ${pin(3, "voice")}</th></tr></thead><tbody>${vrows}</tbody></table>
        </div>
        ${layer(
          {
            l: 10,
            t: 236,
            w: 1160,
            title: "현장문양검색결과 상세조회 · 교차 검증",
            head: `<span style="margin-left:8px">${pin(4, "keep")}</span><span style="margin-left:8px;color:var(--mute);font-size:12px">00001-25-0640 · 「확인」으로 열림</span>`,
          },
          modalBody
        )}
      </div>

      <div data-role="verifier admin" class="pinbox" style="display:grid;gap:10px">
        <div class="crumb" data-role="admin">관리자 보기 — 아래는 「결재 대기함」 탭 (기술책임자)</div>
        <div class="panel pinbox">${apin(8, "keep", true)}
          <div class="panel-b" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr)) auto;gap:10px 12px;align-items:end">
            <div><div class="crumb" style="margin-bottom:4px">기안일자</div><span class="inp w100 mono">2025-07-01 ~ 2025-07-25</span></div>
            <div><div class="crumb" style="margin-bottom:4px">기안자</div><span class="inp w100" style="color:var(--dim)">이름</span></div>
            <div><div class="crumb" style="margin-bottom:4px">제목</div><span class="inp w100" style="color:var(--dim)">제목 일부</span></div>
            <div><div class="crumb" style="margin-bottom:4px">수신처</div><span class="inp w100">경찰청 범죄분석과<span class="caret">▾</span></span></div>
            <div style="display:flex;gap:6px;align-items:center"><button class="btn">조회</button><button class="btn">초기화</button><button class="btn pri">결재</button>
              <span style="width:1px;height:20px;background:var(--line3)"></span><button class="btn danger">반려</button></div>
          </div>
        </div>
        <div class="panel tc">
          <div class="panel-h"><span class="lbl">APPROVAL</span><span class="t">결재 대기함</span><span class="r" style="color:var(--dim);font-size:12px">교차 검증이 끝난 감정서만 옵니다</span></div>
          <table class="grid"><thead><tr><th>☐</th><th>문서종류</th><th>제목</th><th>업무구분</th><th>담당부서</th><th>작성자</th><th>교차 검증</th><th>기안일</th></tr></thead><tbody>${arows}</tbody></table>
        </div>
        <div class="panel pinbox">${apin(10, "plus", true)}
          <div class="panel-h"><span class="lbl">DOCUMENT</span><span class="t mono">00001-25-0612</span><span class="t">절도 족적 감정 결과</span><span class="r"><button class="btn sm">감정서 열기 (S09)</button></span></div>
          <div class="panel-b" style="display:grid;grid-template-columns:150px minmax(0,1fr) 320px;gap:16px">
            <div style="height:190px;padding:12px;border:1px solid var(--line3);border-radius:8px;background:var(--panel2);display:grid;gap:6px;align-content:start">
              <b style="font-size:11px;letter-spacing:.2em;text-align:center">감 정 서</b>${[90, 70, 80, 60, 85, 50, 75].map((w) => `<span style="display:block;height:4px;width:${w}%;background:var(--line3);border-radius:2px"></span>`).join("")}
              <span style="display:flex;gap:4px;margin-top:6px">${["감정관", "감정관", "기술책임자"].map((r) => `<span style="flex:1;padding:2px;border:1px solid var(--line3);border-radius:4px;font-size:8.5px;text-align:center;color:var(--dim)">${r}</span>`).join("")}</span>
            </div>
            <div>
              <div class="crumb" style="margin-bottom:6px">결재 흐름 (이름 가림)</div>
              ${[
                ["done", "결과확인완료", "박○○ 경위(감정관)", "07-23 10:05"],
                ["done", "교차 검증 · 의견 일치", "김○○ 경사(감정관)", "07-24 09:40"],
                ["done", "감정서작성 · 결재 올림", "박○○ 경위(감정관)", "07-24 17:52"],
                ["now", "결재", "최○○ 경감(기술책임자)", "대기 중"],
              ]
                .map(
                  ([s, t, w, at]) => `<div style="display:grid;grid-template-columns:14px minmax(0,1fr) auto;gap:8px;align-items:center;padding:4px 0;border-top:1px solid var(--line2);font-size:12px">
                  <span style="width:9px;height:9px;border-radius:50%;background:${s === "now" ? "var(--amber)" : "var(--blue2)"}"></span><span><span style="color:var(--fg)">${t}</span> <span style="color:var(--dim)">· ${w}</span></span><span class="num" style="color:var(--mute)">${at}</span></div>`
                )
                .join("")}
            </div>
            <div style="display:grid;gap:8px;align-content:start">
              <div class="crumb">반려 사유 <span style="color:var(--dim)">(반려 시 필수)</span></div>
              <span class="inp w100" style="height:52px;align-items:flex-start;padding:6px 8px;white-space:normal;color:var(--dim)">예) 이미지 페이지 _2 블록 누락</span>
              <div style="padding:7px 9px;border-radius:8px;background:var(--panel2);font-size:11.5px;color:var(--mute);line-height:1.5"><b style="color:var(--fg2)">감사 기록</b> · 열람·결재·반려를 누가 언제 했는지 사용 기록에 남고 지울 수 없습니다.</div>
            </div>
          </div>
        </div>
      </div>
      <div class="pinbox" style="margin-top:10px;display:flex;gap:8px;align-items:center;color:var(--mute);font-size:12px">${pin(11, "better")}
        <span>감정관은 「족윤적 검증」 탭(남이 보낸 요청만 확인 가능), 기술책임자는 「결재 대기함」 탭이 먼저 열립니다. 관리자는 둘 다 봅니다. 수사관에게는 두 메뉴가 없습니다.</span>
      </div>`
    );
  }

  function scas() {
    const vrows = VQ.map(
      (q) => `<tr><td>${q.no}</td><td>${q.sus}</td><td>${q.at}</td><td>${q.req}</td><td>${q.who.replace(/ .*/, "")}</td><td>${q.res}</td><td><span class="sbtn n">확인</span> <span class="sbtn n">검증결과</span></td></tr>`
    ).join("");
    return M.scasShell(
      { treeOn: "족윤적관리 ▸", tabOn: "족윤적 검증", h: 700 },
      `<div class="box" style="padding:8px;margin-bottom:8px">📅 2025-06-25 ~ 📅 2025-07-24 <span class="sbtn">조회</span></div>
      <div class="bar">족윤적 검증</div>
      <div class="box"><table><thead><tr><th>감정번호</th><th>대조번호/용의자번호</th><th>접수일자</th><th>의뢰관서</th><th>작성자</th><th>사건결과</th><th>검증결과확인</th></tr></thead><tbody>${vrows}</tbody></table></div>
      <div style="margin:22px 0 8px;padding-top:8px;border-top:2px dashed #b9bfcc;color:#7a808c;font-size:11px">↓ 탭을 「결재 대기함」으로 바꾸면 보이는 화면</div>
      <div class="box" style="padding:8px;margin-bottom:8px"><table><tbody>
        <tr><td class="lbl">기안일자</td><td>📅 ~ 📅</td><td class="lbl">기안자</td><td></td><td class="lbl">제목</td><td></td><td class="lbl">수신처</td><td></td></tr>
      </tbody></table><div style="margin-top:6px;text-align:right"><span class="sbtn">조회</span> <span class="sbtn">초기화</span> <span class="sbtn b">결재</span></div></div>
      <div class="bar">결재 대기함</div>
      <div class="box"><table><thead><tr><th>☐</th><th>문서종류</th><th>제목</th><th>업무구분</th><th>담당부서</th><th>작성자</th></tr></thead>
        <tbody><tr><td colspan="6" style="height:120px;text-align:center;color:#999">(녹화 시점에 비어 있음)</td></tr></tbody></table></div>
      ${M.pain(640, 30, "<b>누가 누구에게 보낸 요청인지 안 보임</b> — 「교차 검증 할 수 있는 사람한테 요청」하지만 목록에 요청자·상태 열이 없음 (5613 17:54, 18:37)", 300)}
      ${M.pain(700, 160, "<b>「확인」 = 상세조회 팝업 + 뷰어 창</b> — 검증자가 뷰어 2개를 다시 나란히 띄워 비교 (5613 18:22–18:30)", 300)}
      ${M.pain(600, 400, "<b>결과는 말로만</b> — 「교차 검증 결과 의견이 일치한다고 해서 끝내」, 결재 대기함에서 그 결과가 안 보임 (5613 18:42, 18:52)", 300)}`
    );
  }

  M.add({
    id: "s08",
    code: "S08",
    group: "감정서관리",
    title: "검증·결재",
    refs: [
      { t: "SCAS 족윤적 검증 탭", v: "5613 18:22 · 18:37" },
      { t: "SCAS 결재 대기함 탭", v: "5613 18:52" },
      { t: "인터뷰", v: "5613 17:42–18:48 · 19:32", voice: true },
      { t: "사업계획서", v: "p13 · p16–19 · p42" },
    ],
    lead: "흐름은 결과확인완료 → 교차 검증(다른 감정관) → 감정서작성 → 결재(기술책임자)입니다. SCAS처럼 「족윤적 검증」과 「결재 대기함」을 따로 두고 같은 화면 틀에서 탭으로 바꿉니다. 교차 검증자는 「확인」으로 상세조회 팝업을 열어 유류·발견 이미지를 나란히 보고 「의견 일치 / 불일치」를 남깁니다.",
    fit: {
      area: ["same", "두 탭 모두 위 검색 폼 · 아래 목록 그대로"],
      buttons: ["same", "행 끝 [확인][검증결과], 결재 대기함 조회·초기화·결재 순서 그대로, 반려만 끝에 추가"],
      popup: ["near", "「확인」 → 상세조회 레이어 팝업 1겹(뷰어 창 대신 팝업 안 나란히 비교)"],
      columns: ["same", "두 탭 열 순서 원문 그대로, 끝에 교차 검증 열 1개만 추가"],
    },
    scas,
    ours,
    notes: [
      { n: 1, kind: "keep", title: "족윤적 검증 탭 그대로", text: "날짜 범위 + 조회, 열 감정번호 · 대조번호/용의자번호 · 접수일자 · 의뢰관서 · 작성자 · 사건결과 · 검증결과확인[확인][검증결과]를 같은 순서로 둡니다. 새 「교차 검증」 상태 열은 맨 끝에만 붙였습니다.", src: "5613 18:37" },
      { n: 2, kind: "better", title: "두 탭은 따로, 같은 틀에서 전환", text: "SCAS MDI 탭처럼 「족윤적 검증」과 「결재 대기함」을 합치지 않고 탭으로 바꿉니다. 하는 사람(감정관 / 기술책임자)과 시점(감정서 전 / 후)이 달라서입니다. 보는 사람에 맞는 탭이 먼저 열립니다.", src: "5613 18:37 · 18:52" },
      { n: 3, kind: "voice", title: "교차 검증 = 다른 감정관", text: "「제 다음 사람이 교차 검증이 일어나야 되는데… 교차 검증 할 수 있는 사람한테 요청을 한단 말이에요」 — 이 탭은 감정관이 받는 요청함입니다. 본인이 작성한 건은 「확인」 버튼 없이 「보냄 → 김○○ 검증 중」만 보입니다.", src: "5613 17:42–17:59" },
      { n: 4, kind: "keep", title: "「확인」 = 상세조회 팝업 1겹", text: "SCAS처럼 「확인」을 누르면 현장문양검색결과 상세조회 팝업이 열립니다(S06과 같은 틀, 이전·다음·그룹등록·확인대상·프린트·닫기 순서). 그룹등록·확인대상은 작성자만 쓸 수 있어 흐리게 둡니다. 뷰어 창은 뜨지 않습니다.", src: "5613 18:22–18:30" },
      { n: 5, kind: "voice", title: "유류 ↔ 발견 이미지 나란히가 기본", text: "「내가 이 사람 거를 보고… 이거랑 이거랑 보니까 맞아」 — 팝업을 열면 이미지별(_1, _2) 유류·발견 이미지가 같은 배율로 나란히 펼쳐져 있습니다. 작성자의 판정 메모도 같은 줄에 보입니다.", src: "5613 18:14–18:34" },
      { n: 6, kind: "voice", title: "결과는 「의견 일치 / 불일치」", text: "「교차 검증을 접수를 해… 결과 값을 교차 검증 결과 의견이 일치한다고 해서 끝내」 — 접수 표시 뒤 의견 일치 / 의견 불일치를 고르고 「검증결과 저장」. 불일치면 사유를 적어 작성자에게 돌려보냅니다. 승인·반려라는 말은 결재에만 씁니다.", src: "5613 18:34–18:48" },
      { n: 7, kind: "plus", title: "누락 점검 + 정밀 대조 참고", text: "이미지마다 판정이 있는지, 확인대상이 저장됐는지, 불발견인데 확인대상이 남아 있지 않은지를 규칙으로 점검합니다. 정밀 대조 지표는 「현장 사건 참고용」으로만 작게 붙였습니다.", src: "BP p13 · p42" },
      { n: 8, kind: "keep", title: "결재 대기함 탭 그대로", text: "기안일자 · 기안자 · 제목 · 수신처와 조회 · 초기화 · 결재 버튼 순서, 열 ☐ · 문서종류 · 제목 · 업무구분 · 담당부서 · 작성자를 유지합니다. 새 버튼 「반려」는 구분선 뒤 끝에, 새 열 「교차 검증」 · 「기안일」은 맨 끝에 붙였습니다.", src: "5613 18:52" },
      { n: 9, kind: "better", title: "흐름 표시 — 팀장 단계 없음", text: "r1의 「1차 팀장 → 2차 기술책임자」는 인터뷰 근거가 없어 지웠습니다. 화면 위에 결과확인완료 → 교차 검증 → 감정서작성 → 결재 4칸을 두고 지금 칸을 주황으로 표시합니다. 결재의 세부 단계는 열린 질문입니다.", src: "5613 17:34–19:36" },
      { n: 10, kind: "plus", title: "결재 흐름 이력 · 감사 기록", text: "결재 대기함에서 문서를 고르면 결과확인완료 · 교차 검증 · 감정서작성 · 결재를 누가 언제 했는지 이름을 가려 보여 줍니다. 열람·결재·반려는 사용 기록에 남고 지울 수 없습니다.", src: "BP p16–19" },
      { n: 11, kind: "better", title: "보는 사람에 따라", text: "감정관은 「족윤적 검증」 탭과 의견 일치/불일치 저장을, 기술책임자는 「결재 대기함」 탭과 결재·반려를 봅니다. 관리자는 둘 다, 수사관은 메뉴가 없습니다." },
    ],
  });
})();
