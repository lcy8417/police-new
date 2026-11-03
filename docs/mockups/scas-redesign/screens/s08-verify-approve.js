/* S08 검증·결재 — SCAS 「족윤적 검증」 탭(S16) + 「결재 대기함」 탭(S17)
   (IMG_5613 18:22–18:37, 18:52) */
(function () {
  const { pin, apin, sole } = M;

  const STAGES = ["기안", "1차 검증(팀장)", "2차 결재(기술책임자)", "결재완료"];
  /* st: 지금 단계 번호, flag: 반려·보완 표시 */
  const QUEUE = [
    { kind: "족윤적 감정서", title: "주거침입 족적 감정 결과", no: "00001-25-0646", sus: "용의자 S-25-0112", req: "대구청", at: "2025-07-24", biz: "족윤적 감정", dept: "범죄분석과", who: "박○○", res: "발견", st: 1 },
    { kind: "족윤적 감정서", title: "절도 족적 감정 결과", no: "00001-25-0640", sus: "대조 572201", req: "부산청", at: "2025-07-22", biz: "족윤적 감정", dept: "범죄분석과", who: "김○○", res: "발견", st: 2 },
    { kind: "검증요청", title: "강도 현장 족적 검색 결과", no: "00001-25-0633", sus: "—", req: "서울청", at: "2025-07-21", biz: "족윤적 검증", dept: "범죄분석과", who: "박○○", res: "불발견", st: 1 },
    { kind: "족윤적 감정서", title: "기타 족적 감정 결과", no: "00001-25-0621", sus: "—", req: "경기남부청", at: "2025-07-18", biz: "족윤적 감정", dept: "범죄분석과", who: "김○○", res: "감정불능", st: 1, flag: "보완 요청됨" },
    { kind: "족윤적 감정서", title: "절도 족적 감정 결과", no: "00001-25-0612", sus: "용의자 S-25-0098", req: "인천청", at: "2025-07-16", biz: "족윤적 감정", dept: "범죄분석과", who: "박○○", res: "발견", st: 3 },
  ];
  const resChip = (r) => (r === "발견" ? `<span class="chip green">발견</span>` : r === "불발견" ? `<span class="chip">불발견</span>` : `<span class="chip amber">감정불능</span>`);
  const stage = (q) =>
    `<div style="display:grid;gap:3px"><span class="stepper">${STAGES.map((_, i) => `<i style="width:16px" class="${i < q.st || q.st === 3 ? "done" : i === q.st ? "now" : ""}"></i>`).join("")}</span>
      <span style="font-size:11.5px;line-height:1.2;color:${q.flag ? "var(--amber)" : q.st === 3 ? "#4ade80" : "var(--fg2)"}">${q.flag || (q.st === 3 ? "결재완료" : STAGES[q.st] + " 대기")}</span></div>`;

  const CHECKS = [
    { ok: true, t: "족적 기본정보", d: "감정번호·감정물 3점·채취방법 채움" },
    { ok: true, t: "분석결과", d: "이미지 3장 모두 판정 + 판정 사유" },
    { ok: true, t: "유사도/검색결과", d: "검색 572355·572420, 종합 신뢰도 87%" },
    { ok: false, t: "판독소견", d: "_1 하 부위 「판단 제외」 근거 문장 없음" },
    { ok: true, t: "종합의견", d: "발견 1 · 불발견 1 · 감정불능 1과 일치" },
    { ok: true, t: "감정물 해시값", d: "원본 파일 해시 3건 일치" },
    { ok: true, t: "제외 후보 사유", d: "288410 제외 사유 기재됨" },
  ];

  function ours() {
    const rows = QUEUE.map(
      (q, i) => `<tr class="${i === 0 ? "sel" : ""}">
        <td>${q.st === 3 ? "" : "☐"}</td>
        <td><div style="color:var(--fg);line-height:1.3">${q.title}</div><div style="color:var(--dim);font-size:11px;line-height:1.3">${q.kind}</div></td>
        <td><div class="mono" style="color:var(--fg);line-height:1.3">${q.no}</div><div class="mono" style="color:var(--dim);font-size:11px;line-height:1.3">${q.sus}</div></td>
        <td><div style="line-height:1.3">${q.req}</div><div class="num" style="color:var(--dim);font-size:11px;line-height:1.3">${q.at}</div></td>
        <td><div style="line-height:1.3">${q.biz}</div><div style="color:var(--dim);font-size:11px;line-height:1.3">${q.dept}</div></td>
        <td>${q.who}</td><td>${resChip(q.res)}</td><td>${stage(q)}</td>
        <td><button class="btn sm">확인</button> <button class="btn sm">검증결과</button></td></tr>`
    ).join("");

    const checks = CHECKS.map(
      (c) => `<div style="display:grid;grid-template-columns:18px minmax(0,1fr);gap:6px;padding:5px 0;border-top:1px solid var(--line2);font-size:12px">
        <b style="color:${c.ok ? "#4ade80" : "var(--amber)"}">${c.ok ? "✓" : "!"}</b>
        <span><span style="color:var(--fg2)">${c.t}</span> <span style="color:var(--dim)">— ${c.d}</span></span></div>`
    ).join("");

    const TL = [
      { s: "done", t: "기안 · 결과확인완료", w: "박○○ 경위(감정관)", at: "07-24 17:52" },
      { s: "now", t: "1차 검증 · 팀장", w: "최○○ 경감", at: "07-25 09:12 열람 · 대기 중" },
      { s: "", t: "2차 결재 · 기술책임자", w: "정○○ 경정", at: "예정" },
      { s: "", t: "결재완료 → 감정서 출지", w: "자동", at: "—" },
    ];
    const tl = TL.map(
      (x) => `<div style="display:grid;grid-template-columns:14px minmax(0,1fr);gap:8px;position:relative;padding-bottom:12px">
        <span style="width:10px;height:10px;margin-top:4px;border-radius:50%;background:${x.s === "done" ? "var(--blue2)" : x.s === "now" ? "var(--amber)" : "var(--line3)"};${x.s === "now" ? "box-shadow:0 0 8px var(--amber)" : ""}"></span>
        <div><div style="font-size:12.5px;color:${x.s ? "var(--fg)" : "var(--mute)"}">${x.t}</div><div style="font-size:11.5px;color:var(--dim)">${x.w} · <span class="num">${x.at}</span></div></div></div>`
    ).join("");

    return M.shell(
      { active: ["족윤적 검증", "결재 대기함"], tabs: ["사건관리", "감정서작성", "족윤적 검증", "결재 대기함"], title: "검증·결재", h: 1200 },
      `<div class="page-head">
        <div><div class="crumb">족윤적 · 감정서관리 · 검증·결재</div><h3>검증·결재</h3>
          <p>「족윤적 검증」과 「결재 대기함」을 한 받은함으로 합쳤습니다. 행을 고르면 아래에 감정관 판정·근거·점검 결과가 열립니다.</p></div>
        <div style="display:flex;gap:8px"><button class="btn">엑셀</button><button class="btn ok" data-role="verifier admin">선택 2건 일괄 승인</button></div>
      </div>

      <div class="panel pinbox" style="margin-bottom:12px">${apin(2, "keep", true)}
        <div class="panel-b" style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr)) auto;gap:10px 14px;align-items:end">
          <div><div class="crumb" style="margin-bottom:4px">기안일자</div><span class="inp w100 mono">2025-07-01 ~ 2025-07-25</span></div>
          <div><div class="crumb" style="margin-bottom:4px">기안자</div><span class="inp w100" style="color:var(--dim)">이름</span></div>
          <div><div class="crumb" style="margin-bottom:4px">제목</div><span class="inp w100" style="color:var(--dim)">제목 일부</span></div>
          <div><div class="crumb" style="margin-bottom:4px">수신처</div><span class="inp w100">경찰청 범죄분석과<span class="caret">▾</span></span></div>
          <div><div class="crumb" style="margin-bottom:4px">감정번호</div><span class="inp w100 mono">00001-25-</span></div>
          <div style="display:flex;gap:6px"><button class="btn">초기화</button><button class="btn pri">조회</button></div>
          <div class="pinbox" style="grid-column:1/-1;display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            <span style="color:var(--dim);font-size:12px;margin-right:4px">단계 ${pin(3, "better")}</span>
            <span class="chip blue"><span class="dot"></span>내 차례 3</span>
            <span class="chip">1차 검증(팀장) 3</span><span class="chip">2차 결재(기술책임자) 1</span>
            <span class="chip amber">반려·보완 1</span><span class="chip green">결재완료</span>
            <span class="chip" data-role="analyst">내가 올린 문서 4</span>
          </div>
        </div>
      </div>

      <div class="panel tc pinbox" style="margin-bottom:12px">${apin(1, "better")}
        <div class="panel-h"><span class="lbl">INBOX</span><span class="t">검증·결재 대기 5건</span><span class="r" style="color:var(--dim);font-size:12px">족윤적 검증 + 결재 대기함</span></div>
        <table class="grid"><thead><tr><th>☐</th><th>제목 / 문서종류</th><th>감정번호 / 대조번호·용의자번호</th><th>의뢰관서 / 접수일자</th><th>업무구분 / 담당부서</th><th>작성자</th><th>사건결과</th><th>단계</th><th>검증결과확인</th></tr></thead>
        <tbody>${rows}</tbody></table>
      </div>

      <div class="panel pinbox">${apin(4, "better", true)}
        <div class="panel-h"><span class="lbl">REVIEW</span><span class="t mono">00001-25-0646</span><span class="t">주거침입 족적 감정 결과</span>
          <span class="r"><span class="chip amber"><span class="dot"></span>1차 검증(팀장) 대기</span></span></div>
        <div class="panel-b" style="display:grid;grid-template-columns:350px minmax(0,1fr) 300px;gap:16px">
          <div style="display:grid;gap:10px;align-content:start">
            <div class="crumb">감정관 판정 · 박○○ 경위</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">${resChip("발견")}<span class="chip">_2 불발견</span><span class="chip amber">_3 감정불능</span></div>
            <div style="padding:8px 10px;border-left:2px solid var(--blue);background:var(--panel2);border-radius:0 8px 8px 0;font-size:12px;color:var(--fg2);line-height:1.5">“상·중 부위 헤링본·격자 문양과 각도·간격이 일치(종합 신뢰도 87%). 하 부위는 현장 족적 일부 소실로 판단 제외.”<div style="margin-top:3px;color:var(--dim);font-size:11px">발견상표 ○○스포츠 운동화 · S07 판정 사유</div></div>
            <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px">
              <span class="imgbox" style="display:block;height:112px">${sole({ kind: "scene", zones: ["herring", "grid", "blocks"], cut: true })}<span class="cap">유류 _1</span></span>
              <span class="imgbox" style="display:block;height:112px">${sole({ kind: "shoe", zones: ["herring", "grid", "tri"] })}<span class="cap" style="color:#1f2a3a;text-shadow:none">305659</span></span>
              <span class="imgbox" style="display:block;height:112px">${sole({ kind: "shoe", zones: ["wave", "grid", "blocks"] })}<span class="cap" style="color:#1f2a3a;text-shadow:none">301122</span></span>
            </div>
            <div style="padding:8px 10px;border:1px solid #1d4a44;border-radius:10px;background:var(--teal-bg)">
              <div style="display:flex;justify-content:space-between;align-items:baseline"><span class="ai-mark">● S06 정밀 대조 요약</span><b class="mono" style="color:var(--teal);font-size:16px">87%</b></div>
              <div class="mono" style="display:grid;grid-template-columns:1fr 1fr;gap:2px 10px;margin-top:4px;font-size:11.5px;color:var(--fg2)">
                <span>Inlier Ratio 0.72</span><span>NCC 0.81</span><span>Wasserstein 0.14</span><span>MI 1.36</span></div>
              <div style="margin-top:4px;font-size:11.5px;color:var(--mute)">상 일치 · 중 일치 · 하 불일치 <span style="color:var(--blue)">정밀 대조 열기 ↗</span></div>
            </div>
          </div>

          <div class="pinbox" style="display:grid;gap:10px;align-content:start">${apin(5, "plus")}
            <div><div style="display:flex;justify-content:space-between;align-items:baseline"><span class="crumb">규칙 기반 점검</span><span class="ai-mark">● AI · 6 / 7 통과</span></div>
              <div style="margin-top:4px">${checks}</div></div>
            <div class="pinbox" style="display:grid;gap:6px">${apin(6, "better")}
              <div data-role="verifier admin" style="display:grid;gap:6px">
                <div class="crumb">검증 의견 <span style="color:var(--dim)">(반려 시 필수)</span></div>
                <div class="inp w100" style="height:56px;align-items:flex-start;padding:6px 8px;white-space:normal;color:var(--dim)">예) 판독소견에 하 부위 판단 제외 근거를 한 문장 보완해 주세요.</div>
                <div style="display:flex;gap:6px">
                  <button class="btn ok">승인</button><button class="btn warn">보완 요청</button><button class="btn danger">반려</button>
                  <span style="margin-left:auto;color:var(--dim);font-size:11px;align-self:center">승인하면 2차 결재(기술책임자)로</span>
                </div>
              </div>
              <div data-role="analyst investigator" style="padding:10px 12px;border:1px solid var(--line3);border-radius:10px;background:var(--panel2);font-size:12.5px;color:var(--fg2)">
                <b style="color:var(--amber)">검증 대기 중</b> — 1차 최○○ 경감(팀장)이 07-25 09:12에 열람했습니다. 승인·반려 버튼은 검증자에게만 보입니다.</div>
            </div>
          </div>

          <div class="pinbox" style="display:grid;gap:8px;align-content:start;padding-left:16px;border-left:1px solid var(--line2)">${apin(7, "plus")}
            <div class="crumb">결재 흐름</div>
            <div>${tl}</div>
            <div style="padding:8px 10px;border-radius:8px;background:var(--panel2);font-size:11.5px;color:var(--mute);line-height:1.5">
              <b style="color:var(--fg2)">감사 기록</b> · 열람·승인·반려·보완 요청이 누가·언제·어떤 사유로 했는지 사용 기록에 남고 지울 수 없습니다.
              <div class="mono" style="margin-top:4px;color:var(--dim)">07-25 09:12 최○○ 열람 · 07-24 17:52 박○○ 기안</div></div>
          </div>
        </div>
      </div>
      <div class="pinbox" style="margin-top:10px;display:flex;gap:8px;align-items:center;color:var(--mute);font-size:12px">${pin(8, "better")}
        <span>검증자·관리자는 승인·보완 요청·반려 버튼과 일괄 승인을, 감정관은 내가 올린 문서의 단계만 봅니다. 수사관에게는 이 메뉴가 없습니다.</span>
      </div>`
    );
  }

  function scas() {
    const vrows = QUEUE.slice(0, 4).map(
      (q) => `<tr><td>${q.no}</td><td>${q.sus === "—" ? "" : q.sus.replace("용의자 ", "").replace("대조 ", "")}</td><td>${q.at}</td><td>${q.req}</td><td>${q.who}</td><td>${q.res}</td><td><span class="sbtn n">확인</span> <span class="sbtn n">검증결과</span></td></tr>`
    ).join("");
    return M.scasShell(
      { treeOn: "감정서관리 ▸", tabOn: "족윤적 검증", h: 700 },
      `<div class="box" style="padding:8px;margin-bottom:8px">📅 2025-06-25 ~ 📅 2025-07-24 <span class="sbtn">조회</span></div>
      <div class="bar">족윤적 검증</div>
      <div class="box"><table><thead><tr><th>감정번호</th><th>대조번호/용의자번호</th><th>접수일자</th><th>의뢰관서</th><th>작성자</th><th>사건결과</th><th>검증결과확인</th></tr></thead><tbody>${vrows}</tbody></table></div>
      <div style="margin:22px 0 8px;padding-top:8px;border-top:2px dashed #b9bfcc;color:#7a808c;font-size:11px">↓ 탭을 「결재 대기함」으로 바꿔야 보이는 화면</div>
      <div class="box" style="padding:8px;margin-bottom:8px"><table><tbody>
        <tr><td class="lbl">기안일자</td><td>📅 ~ 📅</td><td class="lbl">기안자</td><td></td><td class="lbl">제목</td><td></td><td class="lbl">수신처</td><td></td></tr>
      </tbody></table><div style="margin-top:6px;text-align:right"><span class="sbtn">조회</span> <span class="sbtn">초기화</span> <span class="sbtn b">결재</span></div></div>
      <div class="bar">결재 대기함</div>
      <div class="box"><table><thead><tr><th>☐</th><th>문서종류</th><th>제목</th><th>업무구분</th><th>담당부서</th><th>작성자</th></tr></thead>
        <tbody><tr><td colspan="6" style="height:120px;text-align:center;color:#999">(녹화 시점에 비어 있음)</td></tr></tbody></table></div>
      ${M.pain(640, 30, "<b>검증과 결재가 다른 탭</b> — 「족윤적 검증」과 「결재 대기함」을 오가야 내 차례가 보임 (5613 18:37, 18:52)", 300)}
      ${M.pain(700, 150, "<b>「확인」 = 상세조회 팝업 다시 열기</b> — 검증자가 감정관이 본 후보를 처음부터 다시 대조, 뷰어 2개 나란히 (5613 18:22–18:30)", 300)}
      ${M.pain(600, 400, "<b>결재 버튼 하나</b> — 팀장·기술책임자 중 어느 단계인지, 반려 사유는 어디 남는지 목록에서 안 보임 (5613 18:52)", 300)}`
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
      { t: "사업계획서", v: "p13 · p25 · p36 · p42" },
    ],
    lead: "SCAS의 「족윤적 검증」과 「결재 대기함」 두 탭을 검증자용 받은함 하나로 합쳤습니다. 검색 조건과 열 이름은 그대로 두고, 고른 문서의 판정·근거·S06 지표·규칙 점검·결재 흐름을 한 화면 아래칸에서 보며 승인·보완 요청·반려합니다.",
    scas,
    ours,
    notes: [
      { n: 1, kind: "better", title: "두 탭 → 받은함 하나", text: "「족윤적 검증」(검증요청 건)과 「결재 대기함」(감정서 결재 건)을 한 목록에 섞고 문서종류로 구분합니다. 사이드바의 두 메뉴는 그대로 두고 같은 화면을 엽니다.", src: "5613 18:37 · 18:52" },
      { n: 2, kind: "keep", title: "검색 조건·열 이름 그대로", text: "기안일자·기안자·제목·수신처 + 조회·초기화를 유지하고, 열은 감정번호·대조번호/용의자번호·접수일자·의뢰관서·작성자·사건결과(검증 탭)와 ☐·문서종류·제목·업무구분·담당부서(결재 탭)를 2줄 셀로 합쳤습니다. SCAS의 「결재」 버튼은 아래 승인 버튼과 「일괄 승인」이 됩니다.", src: "5613 18:37 · 18:52" },
      { n: 3, kind: "better", title: "단계가 보이는 결재", text: "기안 → 1차 검증(팀장) → 2차 결재(기술책임자) → 결재완료를 막대로 보여 주고, 「내 차례」「반려·보완」 칩으로 걸러 봅니다.", src: "BP p25 · p36" },
      { n: 4, kind: "better", title: "「확인」「검증결과」 → 아래 상세칸", text: "SCAS는 「확인」을 누르면 상세조회 팝업을 다시 열어 처음부터 대조했습니다. 개선안은 감정관 판정·판정 사유, 확인대상 썸네일, S06 지표 요약(87% · Inlier · NCC · Wasserstein · MI)을 한 칸에 모으고 필요할 때만 정밀 대조를 엽니다.", src: "5613 18:22–18:30" },
      { n: 5, kind: "plus", title: "규칙 기반 점검", text: "필수 항목(족적 기본정보·분석결과·유사도/검색결과·판독소견·종합의견) 누락, 해시값 불일치, 제외 사유 누락을 자동으로 확인합니다. 통과 못 한 항목은 주황 「!」로 보여 검증자가 그 부분만 봅니다.", src: "BP p13 · p42 · 발표 s15" },
      { n: 6, kind: "better", title: "승인 / 보완 요청 / 반려(사유 필수)", text: "버튼을 셋으로 나눴습니다. 반려와 보완 요청은 검증 의견이 있어야 눌리고, 의견은 감정관에게 그대로 전달됩니다.", src: "BP p25 · p36" },
      { n: 7, kind: "plus", title: "결재 흐름과 감사 기록", text: "누가 언제 열람·승인했는지 이름을 가려 시간순으로 보여 줍니다. 모든 결재 행동은 사용 기록(관리자 화면)에 남고 지울 수 없습니다.", src: "BP p16–19" },
      { n: 8, kind: "better", title: "보는 사람에 따라", text: "검증자·관리자는 승인·보완 요청·반려와 일괄 승인 버튼을 봅니다. 감정관은 「내가 올린 문서」 칩과 진행 상태 안내만 보고, 수사관에게는 메뉴가 없습니다." },
    ],
  });
})();
