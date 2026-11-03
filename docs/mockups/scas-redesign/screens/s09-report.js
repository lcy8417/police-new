/* S09 감정서 작성 — SCAS 「감정서작성」 탭(S13) → 「결재문서정보」 팝업 + 문서 뷰어(S14) → 한글 편집기 별도 창(S15)
   (IMG_5613 14:37–16:07, 18:07, 19:07–19:37) */
(function () {
  const { pin, apin, sole } = M;

  /* AI가 채운 칸(청록) + 근거 링크 */
  const ai = (html, src) =>
    `<span style="background:var(--teal-bg);box-shadow:inset 0 -1px 0 var(--teal);padding:0 4px;border-radius:3px;color:var(--fg)">${html}</span>${src ? `<sup style="margin-left:3px;color:var(--teal);font:600 10px var(--font-mono)">↗${src}</sup>` : ""}`;
  /* 핵심 결과 자동 강조 */
  const key = (t) => `<b style="color:var(--amber)">${t}</b>`;

  const sideShoe = () =>
    `<svg viewBox="0 0 200 90" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-label="측면 이미지(가짜 예시)"><rect width="200" height="90" style="fill:var(--panel)"/>
      <path d="M20 62C20 40 40 30 70 28L95 18C110 12 125 22 130 32C150 36 175 44 182 56L182 68L20 70Z" style="fill:var(--panel3);stroke:var(--line3)"/>
      <path d="M18 70L184 70L182 76L22 78Z" style="fill:var(--dim)"/><path d="M98 24L120 40M92 30L114 44" style="stroke:var(--line3);stroke-width:2"/></svg>`;

  const WAIT = [
    { no: "00001-25-0646", doc: "SCAS수사부-2944", nm: "주거침입", req: "대구청", occ: "2025-07-19", reg: "2025-07-23", prog: "작성 중", cur: true },
    { no: "00001-25-0640", doc: "SCAS수사부-2911", nm: "절도", req: "부산청", occ: "2025-07-15", reg: "2025-07-22", prog: "결재 중" },
    { no: "00001-25-0612", doc: "SCAS수사부-2755", nm: "절도", req: "인천청", occ: "2025-07-10", reg: "2025-07-16", prog: "결재완료", out: true },
  ];
  const progChip = (p) => (p === "작성 중" ? `<span class="chip teal">작성 중 · AI 초안</span>` : p === "결재 중" ? `<span class="chip amber">결재 중</span>` : `<span class="chip green">결재완료</span>`);

  const RULES = [
    { ok: true, t: "족적 기본정보", d: "1·2항, 감정물 3점 + 해시값" },
    { ok: true, t: "분석결과", d: "7항 표 3행 = 이미지 3장" },
    { ok: true, t: "유사도/검색결과", d: "검색 572355·572420, 87%" },
    { ok: false, t: "판독소견", d: "AI 초안 그대로 — 감정관 확인 필요" },
    { ok: true, t: "종합의견", d: "판정 3건과 문장 일치" },
  ];
  const HIST = [
    { at: "07-24 17:52", who: "보고서 Agent", t: "초안 v1 생성 (S06·S07 근거 12건 인용)" },
    { at: "07-24 17:55", who: "보고서 Agent", t: "이미지 페이지 자동 구성 (후보 1건 + 근거 그림 1장)" },
    { at: "07-24 17:58", who: "박○○ 경위", t: "판독소견 수정 v2 — 「일치함」→「일치하는 것으로 판단됨」" },
  ];

  function ours() {
    const wrows = WAIT.map(
      (w) => `<tr class="${w.cur ? "sel" : ""}"><td class="mono" style="color:var(--fg)">${w.no}</td><td class="mono">${w.doc}</td><td>${w.nm}</td><td>${w.req}</td>
        <td class="num">${w.occ}</td><td class="num">${w.reg}</td><td>${progChip(w.prog)}</td>
        <td><button class="btn sm ${w.cur ? "pri" : ""}">감정서</button></td><td>${w.out ? "✓" : `<span style="color:var(--faint)">—</span>`}</td>
        <td>${w.prog === "결재 중" ? `<button class="btn sm danger" data-role="analyst admin">결재회수</button>` : `<span style="color:var(--faint)">—</span>`}</td></tr>`
    ).join("");

    const rules = RULES.map(
      (r) => `<div style="display:grid;grid-template-columns:18px minmax(0,1fr);gap:6px;padding:5px 0;border-top:1px solid var(--line2);font-size:12px">
        <b style="color:${r.ok ? "#4ade80" : "var(--amber)"}">${r.ok ? "✓" : "!"}</b><span><span style="color:var(--fg2)">${r.t}</span> <span style="color:var(--dim)">— ${r.d}</span></span></div>`
    ).join("");
    const hist = HIST.map(
      (h) => `<div style="display:grid;grid-template-columns:76px minmax(0,1fr);gap:6px;font-size:11.5px;padding:4px 0;border-top:1px solid var(--line2)">
        <span class="mono" style="color:var(--dim)">${h.at}</span><span style="color:var(--mute)"><span style="color:${h.who === "보고서 Agent" ? "var(--teal)" : "var(--fg2)"}">${h.who}</span> · ${h.t}</span></div>`
    ).join("");

    const sec = (n, t, body) => `<div style="display:grid;grid-template-columns:118px minmax(0,1fr);gap:10px;padding:6px 0;border-bottom:1px solid var(--line2);font-size:12.5px"><b style="color:var(--fg2)">${n}. ${t}</b><div style="color:var(--fg2);min-width:0">${body}</div></div>`;
    const td = `style="white-space:normal;height:auto;padding:6px 8px;line-height:1.4"`;
    const tdn = `style="height:auto;padding:6px 8px;line-height:1.4"`; /* 줄바꿈 없는 짧은 칸 */

    const paper = `<div style="padding:22px 30px;border:1px solid var(--line3);border-radius:10px;background:var(--panel2)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:10px;border-bottom:2px solid var(--line3)">
          <div><div class="mono" style="color:var(--dim);font-size:10.5px">KPSI-KQP-16-F05 (REV.03)</div><b style="font-size:20px;letter-spacing:.3em">감 정 서</b><div style="color:var(--mute);font-size:11.5px">경찰청 · [주소 가림]</div></div>
          <div style="text-align:right;font-size:11.5px;color:var(--mute)"><div>감정서번호 : <span class="mono" style="color:var(--fg2)">00001-25-0646</span></div><div class="mono">1/2</div><div style="margin-top:4px"><span class="chip" style="height:18px;font-size:10px">ILAC-MRA</span> <span class="chip" style="height:18px;font-size:10px">KOLAS</span></div></div>
        </div>
        ${sec(1, "의뢰 관서", `대구청 수성서 (SCAS번호 2025-03321)`)}
        ${sec(2, "감정물", `현장 족적 사진 3점 <span style="color:var(--dim)">· SCAS사건번호 2025-11710 · 문서번호 SCAS수사부-2944</span>
          <div class="mono" style="font-size:11px;color:var(--mute);line-height:1.6">00001-25-0646_1.jpg (690dda…e41c)<br>00001-25-0646_2.jpg (1b7f03…9a02)<br>00001-25-0646_3.jpg (c45e88…07bd)</div>`)}
        ${sec(3, "감정 방법", `윤적감정방법 지침서(KPSI-KQI-305 : 2022)`)}
        ${sec(4, "감정 장소", `경찰청 범죄분석과`)}
        ${sec(5, "감정 기간", `<span class="num">2025-07-23 ~ 2025-07-25</span>`)}
        ${sec(6, "시험 환경", `온도 (24 ± 5) ℃ 습도 70 % R.H. 이하`)}
        <div class="pinbox" style="padding:8px 0;border-bottom:1px solid var(--line2)">${apin(6, "plus")}
          <b style="color:var(--fg2);font-size:12.5px">7. 감정 결과</b>
          <table class="grid" style="margin-top:6px;font-size:12px"><thead><tr><th>연번</th><th>검색구분</th><th>감정물</th><th>채취장소</th><th>감정결과</th><th>발견상표</th><th>비고</th></tr></thead><tbody>
            <tr><td ${tdn}>1</td><td ${tdn}>현장문양검색</td><td ${tdn}>전사판채취법 1 건</td><td ${tdn}>주방 바닥</td><td ${td}>${ai(key("발견"), "S07")}</td><td ${td}>${ai("○○스포츠 운동화", "S07")}</td><td ${td}>${ai("용의자신발과 상·중 문양 일치", "S06")}</td></tr>
            <tr><td ${tdn}>2</td><td ${tdn}>현장문양검색</td><td ${tdn}>전사판채취법 1 건</td><td ${tdn}>주방 바닥</td><td ${td}>${ai("불발견", "S07")}</td><td ${td}>—</td><td ${td}></td></tr>
            <tr><td ${tdn}>3</td><td ${tdn}>—</td><td ${tdn}>전사판채취법 1 건</td><td ${tdn}>현관</td><td ${td}>${ai("감정불능", "S07")}</td><td ${td}>—</td><td ${td}>${ai("족적 약 30%만 남음", "S07")}</td></tr>
          </tbody></table>
        </div>
        <div class="pinbox" style="padding:8px 0;border-bottom:1px solid var(--line2);font-size:12.5px;line-height:1.65">${apin(4, "plus")}
          <b style="color:var(--fg2)">8. 비고</b>
          <div style="margin-top:4px;color:var(--fg2)"><span style="color:var(--mute)">판독소견</span> — ${ai(`감정물 _1의 상·중 부위 헤링본·격자 문양은 신발 305659와 기울기(32° ↔ 31°)·간격(4.1 ↔ 4.0 mm)·방향이 ${key("일치하는 것으로 판단됨")}. 정밀 대조 ${key("종합 신뢰도 87%")}. 하 부위는 현장 족적 일부 소실로 판단에서 제외함.`, "S06")}</div>
          <div style="margin-top:4px;color:var(--fg2)"><span style="color:var(--mute)">종합의견</span> — ${ai(`감정물 3점 중 1점 ${key("발견")}(○○스포츠 운동화), 1점 불발견, 1점 감정불능.`, "S07")}</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px;text-align:center;font-size:12px">
          ${[["감정관", "박○○ 경위"], ["감정관", "김○○ 경사"], ["기술책임자", "정○○ 경정"]].map(([r, n]) => `<div style="padding:8px;border:1px solid var(--line3);border-radius:8px"><div style="color:var(--dim)">${r}</div><div style="color:var(--fg2)">${n}</div><div style="color:var(--faint);font-size:11px">(서명 · 결재 후)</div></div>`).join("")}
        </div>
        <div style="margin-top:10px;text-align:center;color:var(--mute);font-size:11.5px;line-height:1.6">KOLAS 인정 문구 · 한국인정기구 인정 &nbsp; <b style="color:var(--fg2)">경찰청장</b> [직인]<br><span style="color:var(--dim)">Commissioner General of Korean National Police Agency · 경찰청 범죄분석과</span></div>
      </div>`;

    const imgPage = `<div class="pinbox" style="margin-top:14px;padding:18px 30px;border:1px solid var(--line3);border-radius:10px;background:var(--panel2)">${apin(7, "better", true)}
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px"><b style="font-size:13px">감정서 이미지 페이지 <span class="mono" style="color:var(--dim);font-weight:400">2/2</span></b>
          <span class="ai-mark">● 자동 구성 · 같은 창에서 편집</span></div>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border:1px solid var(--line3);border-radius:8px;overflow:hidden">
          <div style="padding:8px;border-right:1px solid var(--line3);border-bottom:1px solid var(--line3)"><div class="crumb" style="margin-bottom:4px">유류이미지</div>
            <span class="imgbox" style="display:block;height:200px">${sole({ kind: "scene", zones: ["herring", "grid", "blocks"], ruler: true, cut: true })}</span>
            <div class="mono" style="margin-top:4px;font-size:10.5px;color:var(--dim)">00001-25-0646_1.jpg (690dda…e41c)</div></div>
          <div style="padding:8px;border-bottom:1px solid var(--line3)"><div class="crumb" style="margin-bottom:4px">발견이미지</div>
            <span class="imgbox" style="display:block;height:200px">${sole({ kind: "shoe", zones: ["herring", "grid", "tri"] })}</span>
            <div class="mono" style="margin-top:4px;font-size:10.5px;color:var(--dim)">305659</div></div>
          <div style="padding:8px;border-right:1px solid var(--line3)"><div class="crumb" style="margin-bottom:4px">측면이미지</div>
            <span class="imgbox" style="display:block;height:110px">${sideShoe()}</span>
            <div style="margin-top:8px;display:flex;gap:6px;align-items:center"><span class="imgbox" style="display:block;width:70px;height:60px">${sole({ kind: "scene", zones: ["herring", "grid", "blocks"], heat: true })}</span>
              <span style="font-size:11.5px;color:var(--mute)">${ai("근거 그림 · 대응점 5쌍 + 히트맵", "S06")}</span></div></div>
          <div style="padding:8px"><div class="crumb" style="margin-bottom:4px">이미지정보</div>
            <div class="form" style="grid-template-columns:76px minmax(0,1fr)">
              <div class="l">화류번호</div><div class="v mono">305659</div>
              <div class="l">화종</div><div class="v">운동화</div>
              <div class="l">상표</div><div class="v">○○스포츠</div>
              <div class="l">모델번호</div><div class="v" style="color:var(--faint)">—</div>
              <div class="l">성별</div><div class="v">남자</div>
              <div class="l">수집년도</div><div class="v">2025년3월</div>
              <div class="l">비고</div><div class="v">용의자신발</div>
            </div></div>
        </div>
        <div style="margin-top:6px;color:var(--dim);font-size:11px">확인대상이 여러 개면 2×2 표가 후보마다 자동으로 이어집니다. 이미지를 두 번 누르면 이 자리에서 편집 창이 열립니다.</div>
      </div>`;

    return M.shell(
      { active: "감정서작성", tabs: ["사건관리", "검색결과 확인", "감정서작성", "결재 대기함"], title: "감정서 작성", h: 1960 },
      `<div class="page-head">
        <div><div class="crumb">족윤적 · 감정서관리 · 감정서작성</div><h3>감정서 작성</h3>
          <p>위 목록에서 사건을 고르면 아래에서 바로 감정서를 편집합니다. 결재문서정보 팝업과 한글 편집기 창이 없습니다.</p></div>
        <div style="display:flex;gap:6px"><button class="btn">엑셀</button></div>
      </div>

      <div class="panel pinbox" style="margin-bottom:12px">${apin(1, "keep", true)}
        <div class="panel-h"><span class="lbl">WAITING</span><span class="t">감정 작성 대기 목록</span>
          <span class="r" style="display:flex;gap:6px;align-items:center">
            <span class="inp" style="width:140px;color:var(--dim);white-space:nowrap">감정번호·문서번호</span><span class="inp mono" style="width:212px;white-space:nowrap">2025-03-01 ~ 2025-07-24</span>
            <span class="inp" style="width:100px;white-space:nowrap">의뢰관서<span class="caret">▾</span></span><span class="inp" style="width:130px;white-space:nowrap">처리관서 경찰청<span class="caret">▾</span></span><span class="inp" style="width:86px;white-space:nowrap">사건명<span class="caret">▾</span></span>
            <button class="btn sm">초기화</button><button class="btn sm pri">조회</button></span></div>
        <table class="grid"><thead><tr><th>감정번호</th><th>문서번호</th><th>사건명</th><th>의뢰관서</th><th>발생일</th><th>등록일</th><th>감정의뢰 진행</th><th>감정서</th><th>출지</th><th>결재</th></tr></thead><tbody>${wrows}</tbody></table>
      </div>

      <div style="display:grid;grid-template-columns:minmax(0,1fr) 390px;gap:12px;align-items:start">
        <div class="panel tc pinbox">${apin(2, "better")}
          <div class="panel-h"><span class="lbl">DOCUMENT</span><span class="t">감정서 <span class="mono">00001-25-0646</span></span>
            <span class="r"><span class="seg"><button aria-pressed="true">1쪽 본문</button><button aria-pressed="false">2쪽 이미지</button></span>
              <span class="mono" style="color:var(--mute);font-size:12px">100% ▾</span><span class="chip teal" style="height:20px;font-size:10.5px">AI 초안 v2</span></span></div>
          <div class="panel-b pinbox">${apin(3, "keep", true)}
            <div style="display:flex;gap:12px;margin-bottom:10px;font-size:11.5px;color:var(--mute)"><span>${ai("청록", "")} = AI가 채운 칸 · ↗ = 근거 화면</span><span>${key("주황 굵게")} = 핵심 결과 자동 강조</span><span style="margin-left:auto">나머지는 SCAS 양식 그대로</span></div>
            ${paper}
            ${imgPage}
          </div>
        </div>

        <div class="panel" style="border-color:#1d4a44">
          <div class="panel-h"><span class="ai-mark">● AI</span><span class="t">보고서 Agent</span>
            <span class="r"><span class="inp" style="width:150px;font-size:11.5px">경찰청 F05 (REV.03)<span class="caret">▾</span></span></span></div>
          <div class="panel-b" style="display:grid;gap:8px;border-bottom:1px solid var(--line2)">
            <div style="display:flex;gap:6px"><button class="btn ai" data-role="analyst admin">초안 생성</button><button class="btn sm ghost" data-role="analyst admin">이 칸만 다시 쓰기</button></div>
            <div style="font-size:11.5px;color:var(--mute);line-height:1.5">참고한 자료(RAG — 관련 문서를 찾아 근거로 붙이는 방식):
              <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px"><span class="chip teal" style="height:19px;font-size:10.5px">S07 판정 사유 3</span><span class="chip teal" style="height:19px;font-size:10.5px">S06 지표·부위 근거</span><span class="chip" style="height:19px;font-size:10.5px">사건정보</span><span class="chip" style="height:19px;font-size:10.5px">KPSI-KQI-305 : 2022</span></div></div>
          </div>
          <div class="panel-b pinbox" style="border-bottom:1px solid var(--line2)">${apin(5, "plus")}
            <div style="display:flex;justify-content:space-between;align-items:baseline"><span class="crumb">규칙 기반 검증 · 필수 항목</span><span style="font-size:11.5px;color:var(--amber)">4 / 5</span></div>
            <div style="margin-top:4px">${rules}</div>
            <div style="margin-top:6px;font-size:11px;color:var(--dim)">「!」 항목을 확인하기 전에는 결재 올리기가 잠깁니다.</div>
          </div>
          <div class="panel-b" style="border-bottom:1px solid var(--line2)">
            <div style="display:flex;justify-content:space-between;align-items:center"><span class="crumb">핵심 결과 자동 강조</span><span class="seg"><button aria-pressed="true">켜기</button><button aria-pressed="false">끄기</button></span></div>
            <div style="margin-top:6px;font-size:12px;color:var(--mute)">감정결과(발견) · 종합 신뢰도 87% · 일치 판단 문장 → ${key("주황 굵게")}</div>
          </div>
          <div class="panel-b pinbox" style="border-bottom:1px solid var(--line2)">${apin(8, "better")}
            <div class="crumb" style="margin-bottom:2px">수정 이력</div>${hist}
          </div>
          <div class="panel-b" style="display:grid;gap:8px">
            <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn">PDF 내보내기</button><button class="btn">HWP 내보내기</button><button class="btn ghost">인쇄</button></div>
            <div style="font-size:11px;color:var(--dim)">내보내기·인쇄는 사용 기록에 남습니다(배포용 다운로드 포함).</div>
            <button class="btn pri locked" data-role="analyst admin" style="justify-content:center">결재 올리기 → 검증·결재(S08)</button>
            <div class="pinbox" style="display:flex;gap:8px;align-items:flex-start;font-size:11.5px;color:var(--mute)">${pin(9, "better")}
              <span data-role="analyst admin">감정관: 작성·초안 생성·결재 올리기·결재회수</span>
              <span data-role="verifier">검증자: 읽기 전용 · 문장에 메모만 남김</span>
              <span data-role="investigator">수사관: 결재완료된 감정서 PDF만 내려받음</span></div>
          </div>
        </div>
      </div>`
    );
  }

  function scas() {
    const rows = [
      ["00001-25-0646", "SCAS수사부-2944", "주거침입", "대구청", "2025-07-19", "2025-07-23", ""],
      ["00001-25-0640", "SCAS수사부-2911", "절도", "부산청", "2025-07-15", "2025-07-22", "결재 중"],
      ["00001-25-0612", "SCAS수사부-2755", "절도", "인천청", "2025-07-10", "2025-07-16", "결재 중"],
    ].map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}<td><span class="sbtn b">감정서</span></td><td></td><td>${r[6] ? '<span class="sbtn r">결재회수</span>' : ""}</td></tr>`).join("");
    const line = (w) => `<div style="height:6px;width:${w}%;margin:5px 0;background:#e3e6ec"></div>`;
    return M.scasShell(
      { treeOn: "감정서관리 ▸", tabOn: "감정서작성", h: 820 },
      `<div style="min-height:750px">
      <div class="box" style="padding:8px;margin-bottom:8px"><table><tbody>
        <tr><td class="lbl">감정번호</td><td></td><td class="lbl">등록일자</td><td>📅 2025-03-01 ~ 📅 2025-07-24</td><td class="lbl">의뢰관서</td><td><span class="sbtn b">검색</span></td></tr>
        <tr><td class="lbl">처리관서</td><td>경찰청 <span class="sbtn b">검색</span></td><td class="lbl">문서번호</td><td></td><td class="lbl">사건명</td><td>전체 ▾</td></tr>
      </tbody></table></div>
      <div class="bar">감정 작성 대기 목록 <span><span class="sbtn">엑셀</span> <span class="sbtn">조회</span> <span class="sbtn">초기화</span></span></div>
      <div class="box"><table><thead><tr><th>감정번호</th><th>문서번호</th><th>사건명</th><th>의뢰관서</th><th>발생일</th><th>등록일</th><th>감정의뢰 진행</th><th>감정서</th><th>출지</th><th>결재</th></tr></thead><tbody>${rows}</tbody></table></div>
      </div>
      <div class="dim"></div>
      <div class="modal" style="left:40px;top:60px;width:620px;height:680px">
        <div class="bar">결재문서정보 <span>×</span></div>
        <div style="display:flex;gap:6px;align-items:center;padding:4px 8px;background:#f3f4f7;border-bottom:1px solid var(--s-line);font-size:11px">💾 🖨 ⏫ ⏶ ⏷ ⏬ <span class="sbtn">2</span> / 2 🔍− 🔍+ 100% ▾ <span class="sbtn" style="margin-left:auto">배포용 다운로드</span></div>
        <div style="height:470px;overflow:hidden;background:#d9dce3;padding:10px">
          <div style="background:#fff;height:100%;padding:14px 22px;font-size:10.5px;color:#333">
            <div style="display:flex;justify-content:space-between"><b>경찰청</b><span>감정서번호 : 00001-25-0602 · 1/1 · ILAC-MRA KOLAS</span></div>
            <div style="color:#999;font-size:9.5px">KPSI-KQP-16-F05 (REV.03)</div>
            <div style="margin-top:8px">1. 의뢰 관서</div>${line(60)}
            <div>2. 감정물 (파일명 + 해시값) · SCAS사건번호 · 문서번호</div>${line(80)}
            <div>3. 감정 방법 : 윤적감정방법 지침서(KPSI-KQI-305 : 2022)</div>
            <div>4. 감정 장소</div><div>5. 감정 기간</div>
            <div>6. 시험 환경 : 온도 (24 ± 5) ℃ 습도 70 % R.H. 이하</div>
            <div>7. 감정 결과</div>
            <table style="margin:3px 0"><thead><tr><th>연번</th><th>검색구분</th><th>감정물</th><th>채취장소</th><th>감정결과</th><th>발견상표</th><th>비고</th></tr></thead>
              <tbody><tr><td>1</td><td>현장문양검색</td><td>사진촬영법 1 건</td><td>…</td><td>발견</td><td>○○표 외 1종</td><td></td></tr></tbody></table>
            <div>8. 비고</div>${line(40)}
            <div style="display:flex;justify-content:space-around;margin-top:8px"><span>감정관</span><span>감정관</span><span>기술책임자</span></div>
            <div style="text-align:center;margin-top:8px;color:#666">KOLAS 인정 문구 · 한국인정기구 인정 경찰청장 <span style="color:#d24b4b">[직인]</span></div>
          </div>
        </div>
        <div style="padding:3px 8px;font-size:10px;color:#666;background:#f3f4f7">준비 · 메시지 · 이미지: (속성편집=불가능), (이동=불가능), (입력=불가능), (링크=불가능) · 2/2</div>
        <div class="bar" style="background:#e9ecf3;color:#555">첨부파일 목록 ▾</div>
        <table><thead><tr><th>순번</th><th>첨부 문서</th><th>파일 명칭</th><th>파일 크기</th></tr></thead><tbody><tr><td>1</td><td></td><td>족윤적 감정서 출지</td><td></td></tr></tbody></table>
      </div>
      <div class="oswin" style="left:560px;top:120px;width:640px;height:600px">
        <div class="tt">🧑 용지 — 웹 한글 편집기<span style="margin-left:auto"><span class="sbtn">파일 저장</span> <span class="sbtn">PDF 저장</span> <span class="sbtn">닫기</span></span></div>
        <div style="padding:3px 8px;border-bottom:1px solid #ccc">파일(F) 편집(E) 보기(U) 입력(D) 모양(J) 도구(K) 표(Q) 도움말(H)</div>
        <div style="padding:3px 8px;border-bottom:1px solid #ccc;color:#666">바탕글 ▾ · 대표 ▾ · 함초롬바탕 ▾ · 10 · 160 % · 폭 맞춤</div>
        <div style="background:#c9ccd3;padding:12px;height:520px;overflow:hidden">
          <div style="background:#fff;padding:12px">
            ${[0, 1].map(() => `<table style="margin-bottom:10px"><tbody>
              <tr><th>유류이미지</th><th>발견이미지</th></tr>
              <tr><td style="padding:4px"><div style="height:100px">${sole({ kind: "scene", zones: ["herring", "grid", "blocks"], bg: "#2a2d33" })}</div><div style="font-size:9.5px">00001-25-0640_1.jpg (690dda…)</div></td>
                <td style="padding:4px"><div style="height:114px">${sole({ kind: "shoe", zones: ["herring", "grid", "tri"], bg: "#ffffff" })}</div></td></tr>
              <tr><th>측면이미지</th><th>이미지정보</th></tr>
              <tr><td class="ph" style="height:60px">측면 사진</td><td style="font-size:10px;white-space:normal">화류번호 275178 · 화종 슬리퍼 · 상표 기타 · 모델번호 · 성별 남자 · 수집년도 2021년7월 · 비고</td></tr>
            </tbody></table>`).join("")}
          </div>
        </div>
      </div>
      ${M.pain(680, 10, "<b>창 3종이 겹침</b> — 감정서작성 탭 → 결재문서정보 팝업(문서 뷰어) → 한글 편집기 별도 창 (5613 14:37–16:07)", 330)}
      ${M.pain(880, 660, "<b>이미지 페이지를 HWP에서 손으로 확인</b> — 후보마다 2×2 표가 반복되고 창을 따로 열어 고침 (5613 14:52–16:07)", 320)}
      ${M.pain(60, 600, "<b>본문은 보기만</b> — 뷰어 상태바 「속성편집=불가능」, 근거가 어디서 왔는지 문서에 안 보임 (5613 15:25–15:40)", 300)}`
    );
  }

  M.add({
    id: "s09",
    code: "S09",
    group: "감정서관리",
    title: "감정서 작성",
    plus: true,
    refs: [
      { t: "SCAS 감정서작성 탭", v: "5613 14:37 · 18:07 · 19:37" },
      { t: "SCAS 결재문서정보", v: "5613 15:25 · 19:07" },
      { t: "SCAS 한글 편집기", v: "5613 14:52–16:07" },
      { t: "사업계획서", v: "p13 · p42" },
      { t: "발표", v: "s15" },
    ],
    lead: "「감정 작성 대기 목록」과 경찰청 감정서 양식(KPSI-KQP-16-F05)은 그대로 둡니다. 결재문서정보 팝업·문서 뷰어·한글 편집기 창 3개를 한 화면 편집기로 합치고, 오른쪽 「보고서 Agent」가 S06·S07 근거로 초안을 쓰고 필수 항목을 점검합니다.",
    scas,
    ours,
    notes: [
      { n: 1, kind: "keep", title: "감정 작성 대기 목록과 결재회수", text: "검색 조건(감정번호·등록일자·의뢰관서·처리관서·문서번호·사건명)과 열(감정번호·문서번호·사건명·의뢰관서·발생일·등록일·감정의뢰 진행·감정서·출지·결재)을 그대로 두고, 「결재 중」 행의 「결재회수」 버튼도 유지합니다.", src: "5613 18:07 · 19:37" },
      { n: 2, kind: "better", title: "팝업·뷰어·HWP 창 → 한 화면 편집", text: "「감정서」를 누르면 결재문서정보 팝업 대신 아래에서 바로 문서가 열리고 편집됩니다. SCAS 뷰어의 쪽 이동·확대(100%)는 머리줄에 남깁니다.", src: "5613 14:37–16:07" },
      { n: 3, kind: "keep", title: "KOLAS 감정서 양식 그대로", text: "KPSI-KQP-16-F05 (REV.03)의 1. 의뢰 관서 ~ 8. 비고, 감정물 파일명 + 해시값, 지침서 KPSI-KQI-305 : 2022, 시험 환경 문구, 서명란(감정관·감정관·기술책임자), KOLAS 인정 문구를 같은 순서로 둡니다.", src: "5613 15:25–15:40" },
      { n: 4, kind: "plus", title: "AI 초안 칸은 청록 + 근거 링크", text: "보고서 Agent가 채운 문장은 청록 밑줄로 표시하고, 옆의 ↗S06·↗S07을 누르면 그 문장의 근거(정밀 대조 지표, 판정 사유)로 이동합니다. 감정관이 고치면 청록이 사라집니다.", src: "BP p13 · p42 · 발표 s15" },
      { n: 5, kind: "plus", title: "규칙 기반 검증(필수 5항목)", text: "족적 기본정보·분석결과·유사도/검색결과·판독소견·종합의견이 채워졌고 서로 맞는지 확인합니다. 확인 안 된 「!」 항목이 있으면 결재 올리기가 잠깁니다.", src: "BP p42" },
      { n: 6, kind: "plus", title: "핵심 결과 자동 강조", text: "감정결과(발견), 종합 신뢰도, 일치 판단 문장처럼 결재자가 먼저 봐야 할 말을 주황 굵게 표시합니다. 끄기 버튼으로 원래 서식으로 돌릴 수 있습니다.", src: "BP p13 · 설문 문항(글씨체·색상 변경)" },
      { n: 7, kind: "better", title: "이미지 페이지 자동 구성(같은 창)", text: "SCAS가 HWP로 만들던 2×2 표(유류이미지·발견이미지·측면이미지·이미지정보)를 같은 화면 2쪽에 자동으로 만들고, S06에서 첨부한 대응점·히트맵 근거 그림을 함께 넣습니다. 한글 편집기 창이 없습니다.", src: "5613 14:52–16:07" },
      { n: 8, kind: "better", title: "수정 이력 + PDF / HWP 내보내기", text: "AI 초안과 사람의 고침을 시간순으로 남깁니다. SCAS의 저장·인쇄·배포용 다운로드는 PDF·HWP 내보내기와 인쇄로 남기되, 모두 사용 기록에 남깁니다.", src: "5613 14:37 · BP p16–19" },
      { n: 9, kind: "better", title: "보는 사람에 따라", text: "감정관·관리자는 초안 생성·편집·결재 올리기·결재회수를, 검증자는 읽기 전용과 메모만, 수사관은 결재완료된 감정서 PDF 내려받기만 봅니다." },
    ],
  });
})();
