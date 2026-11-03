/* S14 사용·감사 기록 — SCAS 영상에 해당 화면 없음(SCAS 화면 생략).
   police-new 현행 /manage/logs(ManageLogsPage: LogFilterBar + 로그인 기록/기능 기록 탭 + SessionEventTimeline + ResultChip)를 바탕으로
   사업계획서 p16–19 감사 항목(조회·등록·수정·삭제·검색·보고서 생성·다운로드·출력), 관리자 행위 탭, 엑셀 내보내기, 보존 기간을 더함. */
(function () {
  const { pin, apin } = M;

  /* 결과 칩: 현행 앱 ResultChip 문구(SUCCESS 성공 / FAIL 실패 / DENIED 권한 없음). 시안에서는 청록을 AI 전용으로 두려고 성공은 초록. */
  const RES = { ok: `<span class="chip green">✓ 성공</span>`, fail: `<span class="chip red">⚠ 실패</span>`, deny: `<span class="chip amber">⛔ 권한 없음</span>` };
  const ACT = {
    조회: "", 검색: "blue", 등록: "green", 수정: "amber", 삭제: "red", "보고서 생성": "violet", 다운로드: "blue", 출력: "violet", 로그인: "",
    "교차 검증": "violet", 결재: "violet", "신발 승인": "green",
  };
  const act = (a) => `<span class="chip ${ACT[a] || ""}" style="height:20px;font-size:11px">${a}</span>`;

  /* t[6] = 이 줄에 붙일 주석 핀 번호 */
  const TL = [
    ["09:02", "로그인", "로그인", "park0412 · 10.14.43.***", "ok"],
    ["09:05", "조회", "사건 조회", "00001-25-0646", "ok"],
    ["09:12", "검색", "문양 검색", "검색번호 572414 · 후보 869건", "ok"],
    ["09:20", "수정", "신발 문양 수정", "화류번호 305657 · 하 n32_04", "ok"],
    ["09:24", "등록", "확인대상 등록", "00001-25-0646_1 ↔ 305657", "ok"],
    ["09:28", "교차 검증", "결과확인완료 → 교차 검증 요청", "00001-25-0646 → kim0301(감정관)", "ok", "", 8],
    ["11:40", "교차 검증", "교차 검증 결과 확인 · 의견 일치", "00001-25-0646 · 검증 kim0301", "ok"],
    ["11:52", "보고서 생성", "감정서 생성", "SCAS수사부-2944", "ok"],
    ["11:55", "결재", "감정서 결재 요청", "SCAS수사부-2944 → choi0115(기술책임자)", "ok"],
    ["11:58", "다운로드", "감정서 PDF 다운로드", "SCAS수사부-2944 · 워터마크 포함", "ok"],
    ["12:01", "출력", "감정서 출력", "프린터 3층-A", "fail", "프린터 응답 없음 (상태 코드 504)"],
    ["12:04", "신발 승인", "신발 승인", "화류번호 303349", "deny", "SHOE_APPROVE 권한 없음 — 승인 담당만"],
    ["12:06", "삭제", "사건 삭제", "00001-25-0612", "deny", "CRIME_DELETE 권한 없음 — 삭제는 관리자만"],
  ];

  const SESS = [
    { nm: "박○○ 경위", id: "park0412", in: "07-24 09:02", out: null, why: "—", ip: "10.14.43.***", ev: 18, fail: 3, open: true },
    { nm: "김○○ 경위", id: "kim0301", in: "07-24 08:47", out: "07-24 12:10", why: "로그아웃", ip: "10.14.43.***", ev: 9, fail: 0 },
    { nm: "최○○ 경감", id: "choi0115", in: "07-24 08:31", out: "07-24 11:02", why: "시간 초과(30분)", ip: "10.14.41.***", ev: 6, fail: 0 },
    { nm: "이○○ 경사", id: "lee0508", in: "07-22 17:58", out: "07-22 18:03", why: "로그인 실패 5회 → 잠금", ip: "10.21.8.***", ev: 5, fail: 5, bad: true },
    { nm: "시스템 관리자", id: "admin01", in: "07-24 08:51", out: null, why: "—", ip: "10.14.40.***", ev: 7, fail: 0 },
  ];

  function ours() {
    const tl = TL.map(
      (t) => `<div style="display:grid;grid-template-columns:44px 14px 96px minmax(0,1fr) auto;gap:8px;align-items:center;min-height:30px">
        <span class="mono" style="color:var(--dim);font-size:11.5px">${t[0]}</span>
        <span style="width:9px;height:9px;border-radius:50%;background:${t[4] === "ok" ? "var(--line3)" : t[4] === "fail" ? "var(--red)" : "var(--amber)"};box-shadow:0 0 0 3px var(--bg2)"></span>
        <span>${act(t[1])}</span>
        <span style="min-width:0">${t[6] ? pin(t[6], "voice") + " " : ""}<span style="color:var(--fg2)">${t[2]}</span> <span class="mono" style="color:var(--mute);font-size:11.5px">${t[3]}</span>${t[5] ? `<div style="color:var(--dim);font-size:11px;line-height:1.3">▾ ${t[5]}</div>` : ""}</span>
        <span>${RES[t[4]]}</span></div>`
    ).join("");

    const rows = SESS.map((s) => {
      const tr = `<tr class="${s.open ? "sel" : ""}"><td style="color:var(--mute)">${s.open ? "▾" : "▸"}</td>
        <td><span style="color:var(--fg)">${s.nm}</span> <span class="mono" style="color:var(--dim);font-size:11.5px">${s.id}</span></td>
        <td class="mono" style="font-size:12px">${s.in}</td><td>${s.out ? `<span class="mono" style="font-size:12px">${s.out}</span>` : `<span class="chip green">사용 중</span>`}</td>
        <td style="${s.bad ? "color:var(--red)" : "color:var(--mute)"}">${s.why}</td><td class="mono" style="color:var(--mute);font-size:12px">${s.ip}</td>
        <td class="r num">${s.ev}</td><td class="r num" style="${s.fail ? "color:var(--red);font-weight:600" : "color:var(--faint)"}">${s.fail}</td></tr>`;
      const open = s.open
        ? `<tr><td colspan="8" style="height:auto;padding:10px 14px 12px 34px;background:var(--bg2);white-space:normal">
            <div class="pinbox" style="position:relative;display:grid;gap:2px">${apin(2, "better", true)}
              <span style="position:absolute;left:56px;top:12px;bottom:12px;width:1px;background:var(--line)"></span>${tl}</div></td></tr>`
        : "";
      return tr + open;
    }).join("");

    const kinds = [
      ["조회", 212, "사건·신발·이미지를 열어 본 기록"], ["검색", 96, "문양 검색·재검색(검색번호)"], ["등록", 34, "사건·신발·확인대상 등록"], ["수정", 41, "문양·기본정보·판단 수정"],
      ["삭제", 3, "무엇을 지웠는지 원본 값과 함께"], ["보고서 생성", 8, "감정서 초안·확정"], ["다운로드", 11, "파일·이미지 내려받기"], ["출력", 7, "인쇄(프린터 이름)"],
      ["교차 검증", 6, "요청·접수·의견 일치/불일치"], ["결재", 4, "결재 요청·완료(기술책임자)"], ["신발 승인", 37, "신발 DB 확정(승인 담당)"],
    ]
      .map((k) => `<div style="display:grid;grid-template-columns:86px 36px minmax(0,1fr);gap:8px;align-items:center;font-size:12px">${act(k[0])}<span class="num" style="text-align:right;color:var(--fg)">${k[1]}</span><span style="color:var(--dim);font-size:11.5px">${k[2]}</span></div>`)
      .join("");

    const adminActs = [
      ["07-24 09:10", "admin01", "park0412 문양 입력 담당 지정"],
      ["07-23 14:00", "admin01", "jang0105 신발 승인 담당 지정"],
      ["07-23 16:40", "admin01", "기초코드 FT002200 사용여부 Y → N"],
      ["07-22 18:20", "admin01", "lee0508 잠금 사유 확인 요청(대구청)"],
      ["07-22 10:00", "admin01", "모델 검색 v3.1 운영 전환"],
    ]
      .map((a) => `<div style="display:grid;grid-template-columns:76px minmax(0,1fr);gap:8px;font-size:12px;line-height:1.4"><span class="mono" style="color:var(--dim);font-size:11px">${a[0]}</span><span style="color:var(--fg2)"><span class="mono" style="color:var(--blue);font-size:11.5px">${a[1]}</span> ${a[2]}</span></div>`)
      .join("");

    const lab = (t) => `<div class="crumb" style="margin-bottom:4px">${t}</div>`;

    /* r3: 시간대별 사용량(오늘 기능 기록 412건, 18시 기준) + 최근 7일 평균 점선 */
    const HR = [0, 0, 0, 0, 0, 0, 0, 0, 6, 58, 61, 55, 24, 34, 52, 49, 41, 32, 0, 0, 0, 0, 0, 0];
    const AVG = [0, 0, 0, 0, 0, 0, 0, 1, 9, 50, 57, 52, 22, 36, 49, 47, 40, 26, 6, 1, 0, 2, 0, 0];
    const X0 = 24, BW = 15.5, BASE = 124, SC = 96 / 70;
    const hx = (h) => X0 + h * BW;
    const chart = `<svg viewBox="0 0 400 142" width="100%" style="display:block" aria-label="시간대별 사용량">
        <rect x="${hx(0)}" y="14" width="${8 * BW}" height="${BASE - 14}" style="fill:var(--strip)"/><rect x="${hx(18)}" y="14" width="${6 * BW}" height="${BASE - 14}" style="fill:var(--strip)"/>
        <text x="${hx(4)}" y="24" text-anchor="middle" style="fill:var(--faint);font:9px var(--font-ui)">업무 시간 밖</text><text x="${hx(21)}" y="24" text-anchor="middle" style="fill:var(--faint);font:9px var(--font-ui)">업무 시간 밖</text>
        ${[20, 40, 60].map((v) => `<line x1="${X0}" x2="${hx(24)}" y1="${BASE - v * SC}" y2="${BASE - v * SC}" style="stroke:var(--line2)"/><text x="${X0 - 4}" y="${BASE - v * SC + 3}" text-anchor="end" style="fill:var(--faint);font:8.5px var(--font-mono)">${v}</text>`).join("")}
        ${HR.map((v, h) => (v ? `<rect x="${hx(h) + 2}" y="${BASE - v * SC}" width="${BW - 4}" height="${v * SC}" rx="2" style="fill:${h === 10 ? "var(--blue)" : "var(--blue2)"};opacity:${h === 10 ? 1 : 0.75}"/>` : "")).join("")}
        <polyline points="${AVG.map((v, h) => `${hx(h) + BW / 2},${BASE - v * SC}`).join(" ")}" style="fill:none;stroke:var(--fg2);stroke-width:1.2;stroke-dasharray:3 3;opacity:.7"/>
        <line x1="${hx(18)}" x2="${hx(18)}" y1="10" y2="${BASE}" style="stroke:var(--amber);stroke-width:1.2"/><text x="${hx(18) + 3}" y="12" style="fill:var(--amber);font:9px var(--font-mono)">지금 18:00</text>
        <text x="${hx(10) + BW / 2}" y="${BASE - 61 * SC - 4}" text-anchor="middle" style="fill:var(--fg);font:600 9px var(--font-mono)">61</text>
        <line x1="${X0}" x2="${hx(24)}" y1="${BASE}" y2="${BASE}" style="stroke:var(--line3)"/>
        ${[0, 6, 9, 12, 18, 24].map((h) => `<text x="${hx(h)}" y="${BASE + 12}" text-anchor="middle" style="fill:var(--dim);font:9px var(--font-mono)">${h}시</text>`).join("")}
      </svg>`;

    const alerts = [
      ["bad", "!", "업무 시간 밖 대량 내려받기", "seo0322 · 07-23 21:47 · 원본 이미지 46건 (기준 20건·예시)", `<span class="chip red" style="height:19px;font-size:10.5px">확인 전</span>`],
      ["bad", "!", "로그인 연속 실패 → 계정 잠금", "lee0508 · 07-22 17:58–18:03 · 5회 · 10.21.8.***", `<span class="chip amber" style="height:19px;font-size:10.5px">잠금 유지</span>`],
      ["warn", "?", "관리자가 본인 권한 변경 시도", "admin01 · 07-20 10:02 · 서버가 거절", `<span class="chip" style="height:19px;font-size:10.5px">거절됨</span>`],
      ["warn", "?", "권한 없는 기능 반복 시도", "park0412 · 오늘 12:04·12:06 · 승인·삭제", `<span class="chip" style="height:19px;font-size:10.5px">2건</span>`],
      ["ok", "✓", "같은 아이디 두 곳 동시 로그인", "없음", `<span style="color:var(--faint);font-size:11px">0건</span>`],
    ]
      .map((a) => `<div class="check"><span class="ic ${a[0]}">${a[1]}</span><span style="min-width:0"><span style="color:var(--fg2)">${a[2]}</span><br><span class="mono" style="color:var(--dim);font-size:10.5px">${a[3]}</span></span>${a[4]}</div>`)
      .join("");

    const chain = `<svg viewBox="0 0 270 40" width="100%" height="40" aria-label="해시 사슬">
        ${[455, 456, 457, 458, 459].map((n, i) => `${i ? `<line x1="${4 + i * 54 - 10}" x2="${4 + i * 54}" y1="20" y2="20" style="stroke:#2f6a43;stroke-width:2"/>` : ""}<rect x="${4 + i * 54}" y="7" width="44" height="26" rx="5" style="fill:var(--green-bg);stroke:${i === 4 ? "#4ade80" : "#1f4a2f"}"/><text x="${26 + i * 54}" y="18" text-anchor="middle" style="fill:var(--fg2);font:8.5px var(--font-mono)">#${n}</text><text x="${26 + i * 54}" y="28" text-anchor="middle" style="fill:var(--dim);font:7.5px var(--font-mono)">${["a91f", "07c2", "e4b8", "5d30", "c16e"][i]}…</text>`).join("")}
      </svg>`;

    const pulse = `<div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) 340px;gap:12px;margin-bottom:10px;align-items:stretch">
        <div class="panel pinbox">
          ${apin(10, "plus")}
          <div class="panel-h"><span class="lbl">ACTIVITY</span><span class="t">시간대별 사용량 · 오늘</span><span class="r"><span style="display:inline-flex;align-items:center;gap:5px;color:var(--dim);font-size:11px"><span class="fx-live" style="width:6px;height:6px;background:var(--blue)"></span>기능 기록 <b class="num" style="color:var(--fg)">412</b>건</span></span></div>
          <div class="panel-b" style="display:grid;gap:8px;padding-top:6px">
            ${chart}
            <div style="display:flex;flex-wrap:wrap;gap:4px 14px;color:var(--dim);font-size:11px">
              <span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:var(--blue2);vertical-align:-1px"></i> 오늘 한 시간 건수</span>
              <span><i style="display:inline-block;width:14px;border-top:1.5px dashed var(--fg2);vertical-align:3px"></i> 최근 7일 평균</span>
              <span style="margin-left:auto">가장 바쁜 때 <b class="num" style="color:var(--fg2)">10시 61건</b></span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px">
              <div class="stat" style="padding:7px 10px;gap:2px"><span class="k">로그인</span><span class="v" style="font-size:17px">38</span></div>
              <div class="stat" style="padding:7px 10px;gap:2px"><span class="k">업무 시간 밖</span><span class="v" style="font-size:17px">0</span></div>
              <div class="stat" style="padding:7px 10px;gap:2px;--glow:rgba(239,68,68,.16)"><span class="k">실패·권한 없음</span><span class="v" style="font-size:17px;color:#f87171">3</span></div>
            </div>
          </div>
        </div>
        <div class="panel pinbox">
          ${apin(11, "plus")}
          <div class="panel-h"><span class="lbl">ALERT</span><span class="t">이상 징후 · 최근 7일</span><span class="r"><span class="chip red" style="height:20px;font-size:11px">확인 전 1</span></span></div>
          <div class="panel-b" style="padding-top:4px;padding-bottom:6px">${alerts}</div>
        </div>
        <div class="panel pinbox">
          ${apin(12, "plus")}
          <div class="panel-h"><span class="lbl">INTEGRITY</span><span class="t">기록 무결성</span><span class="r"><span class="chip green" style="height:20px;font-size:11px">✓ 변조 없음</span></span></div>
          <div class="panel-b" style="display:grid;gap:6px;padding-top:6px">
            ${chain}
            <div style="color:var(--dim);font-size:10.5px;line-height:1.4">기록마다 바로 앞 기록의 지문(해시)을 품고 저장됩니다. 한 줄이라도 고치면 뒤 사슬이 모두 어긋나 바로 드러납니다.</div>
            <div>
              <div class="check"><span class="ic ok">✓</span><span>오늘 기록 <b class="num">459</b>건 · 사슬 끊김 <b class="num">0</b></span><span class="mono" style="color:var(--dim);font-size:10.5px">18:00 검사</span></div>
              <div class="check"><span class="ic ok">✓</span><span>보관 저장소 사본과 일치</span><span class="mono" style="color:var(--dim);font-size:10.5px">매일 02:00</span></div>
              <div class="check"><span class="ic ok">✓</span><span>지운 기록 0 · 고친 기록 0</span><span style="color:var(--dim);font-size:10.5px">고칠 수 없음</span></div>
              <div class="check"><span class="ic ok">✓</span><span>이 화면을 본 일도 기록됨</span><span class="mono" style="color:var(--dim);font-size:10.5px">오늘 6회</span></div>
            </div>
          </div>
        </div>
      </div>`;

    return M.shell(
      { active: "사용 기록", tabs: ["사건관리", "사용자 관리", "사용 기록"], title: "사용·감사 기록", h: 1560 },
      `<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;padding:9px 12px;border:1px solid color-mix(in srgb,var(--amber) 35%,var(--panel));border-radius:10px;background:var(--amber-bg);color:var(--fg2);font-size:12.5px">
        <b style="color:var(--amber)">관리자 전용 메뉴</b> — 다른 역할은 메뉴가 없습니다. 내 접속 기록은 오른쪽 위 내 이름 → 「내 접속 기록」에서 봅니다.
      </div>
      <div class="page-head">
        <div><div class="crumb">족윤적 · 족윤적관리 · 사용 기록</div><h3>사용·감사 기록</h3><p>누가 언제 로그인해 어떤 기능을 썼는지, 실패·권한 없음 기록까지 확인합니다. 기록은 고칠 수 없습니다.</p></div>
        <div style="display:flex;gap:8px;align-items:center" class="pinbox">
          <button class="btn" data-lock="admin">엑셀 내보내기 ${pin(6, "plus")}</button>
        </div>
      </div>

      <div class="panel" style="margin-bottom:10px">
        <div class="panel-b pinbox" style="display:grid;grid-template-columns:200px 230px 150px 180px minmax(0,1fr) auto;gap:10px 12px;align-items:end">
          ${apin(1, "better", true)}
          <div>${lab("사용자")}<span class="inp w100">전체 사용자<span class="caret">▾</span></span></div>
          <div>${lab("기간")}<span class="inp w100 mono">2025-07-24 ~ 2025-07-24</span></div>
          <div>${lab("결과")}<span class="inp w100">전체<span class="caret">▾</span></span></div>
          <div>${lab("기능")}<span class="inp w100">전체 기능<span class="caret">▾</span></span></div>
          <div>${lab("대상 번호")}<span class="inp w100" style="color:var(--dim)">감정번호·화류번호 등</span></div>
          <div><button class="btn ghost">필터 초기화</button></div>
        </div>
      </div>

      <div class="pinbox" style="display:flex;align-items:center;gap:10px;margin-bottom:10px;padding:8px 12px;border:1px solid var(--line);border-radius:10px;background:var(--strip);color:var(--mute);font-size:12px">
        ${apin(7, "plus", true)}
        <span style="color:var(--blue)">ⓘ</span> 보존 기간: 접속·사용 기록 <b style="color:var(--fg2)">3년</b>, 관리자 행위 <b style="color:var(--fg2)">5년</b> (예시 — 기관 규정 확인 필요). 지난 기록은 자동으로 보관 저장소로 옮겨지고, 내보내기·조회도 이 화면에 다시 기록됩니다.
      </div>
      ${pulse}

      <div style="display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:12px;align-items:start">
        <div class="panel tc">
          <div class="panel-h">
            <span class="seg pinbox"><button aria-pressed="true">로그인 기록 <span class="num" style="color:var(--dim)">38</span></button><button aria-pressed="false">기능 기록 <span class="num" style="color:var(--dim)">412</span></button><button aria-pressed="false">관리자 행위 <span class="num" style="color:var(--dim)">9</span> ${pin(5, "plus")}</button></span>
            <span class="r"><span style="color:var(--dim);font-size:12px">50개씩 · 최신순</span></span>
          </div>
          <table class="grid"><thead><tr><th></th><th>사용자</th><th>로그인</th><th>로그아웃</th><th>종료 사유</th><th>IP</th><th class="r">이벤트 수</th><th class="r">실패 수</th></tr></thead><tbody>${rows}</tbody></table>
          <div style="padding:10px 14px;text-align:center"><button class="btn sm">더 보기</button></div>
        </div>

        <div style="display:grid;gap:12px">
          <div class="panel pinbox">
            ${apin(3, "plus")}
            <div class="panel-h"><span class="lbl">AUDIT</span><span class="t">감사 항목 · 오늘</span></div>
            <div class="panel-b" style="display:grid;gap:7px">${kinds}</div>
          </div>
          <div class="panel pinbox">
            ${apin(4, "plus")}
            <div class="panel-h"><span class="lbl">EXPORT</span><span class="t">다운로드·출력 제한</span></div>
            <div class="panel-b" style="display:grid;gap:6px;font-size:12px;color:var(--fg2);line-height:1.5">
              <div>· 감정서·원본 이미지 내려받기는 감정관·관리자만</div>
              <div>· 모든 파일에 <b>내려받은 사람·시각</b> 워터마크</div>
              <div>· 하루 20건 넘으면 관리자 확인 <span style="color:var(--dim)">(예시 기준)</span></div>
              <div>· 원본 이미지와 처리 이미지는 따로 저장, 원본은 고칠 수 없음</div>
            </div>
          </div>
          <div class="panel">
            <div class="panel-h"><span class="lbl">ADMIN</span><span class="t">관리자 행위 · 최근</span></div>
            <div class="panel-b" style="display:grid;gap:7px">${adminActs}</div>
          </div>
        </div>
      </div>
      <div class="pinbox" style="display:inline-flex;gap:8px;align-items:center;margin-top:12px;padding:8px 12px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--mute);font-size:12px">
        ${apin(9, "better")}<span class="chip blue">관리자</span> 모든 사람의 기록 · 내보내기 &nbsp;|&nbsp; <span class="chip">그 밖의 역할</span> 내 접속 기록만
      </div>`
    );
  }

  M.add({
    id: "s14",
    code: "S14",
    group: "족윤적관리",
    title: "사용·감사 기록",
    refs: [{ t: "police-new /manage/logs" }, { t: "사업계획서 보안·로그", v: "p16–19" }, { t: "인터뷰 교차 검증·결재", v: "5613 17:34–19:36", voice: true }],
    lead: "지금 police-new 사용 기록 화면(필터 막대 + 로그인 기록·기능 기록 탭, 로그인을 펼치면 그때 쓴 기능이 시간순으로)을 그대로 둡니다. 여기에 사업계획서의 감사 항목 8가지와 업무 단계(교차 검증·결재·신발 승인) 기록, 관리자 행위 탭, 엑셀 내보내기를 더했습니다. SCAS 영상에는 이런 화면이 없어 SCAS 화면은 생략합니다. r3: 표 위에 시간대별 사용량 차트, 이상 징후 목록(업무 시간 밖 대량 내려받기·연속 로그인 실패 등), 기록 무결성(해시 사슬) 칸을 한 줄로 더했습니다.",
    fit: {
      area: ["na", "SCAS에 없는 화면 — 현행 police-new /manage/logs 배치(필터 막대 → 탭 → 표) 그대로, 오른쪽에 요약 칸만 덧붙임"],
      buttons: ["na", "현행 앱 버튼(필터 초기화 · 더 보기) 그대로 + 엑셀 내보내기"],
      popup: ["na", "창 없음 — 행을 펼쳐 타임라인을 봄(현행 그대로)"],
      columns: ["na", "현행 앱 열(사용자·로그인·로그아웃·종료 사유·IP·이벤트 수·실패 수) 순서 그대로"],
    },
    ours,
    notes: [
      { n: 1, kind: "better", title: "필터 막대 그대로 + 대상 번호", text: "현행 필터(사용자·기간·결과·기능·필터 초기화)에 「대상 번호」를 더했습니다. 감정번호 00001-25-0646을 넣으면 그 사건을 누가 열고 고치고 내려받았는지 한 번에 나옵니다.", src: "police-new LogFilterBar" },
      { n: 2, kind: "better", title: "로그인을 펼치면 기능 타임라인", text: "로그인 한 번 동안 쓴 기능을 시간순 점선으로 보여 줍니다(현행 SessionEventTimeline). 실패·권한 없음 줄은 눌러서 오류 내용을 펼칩니다. 결과 문구는 현행 앱 그대로 성공·실패·권한 없음입니다.", src: "police-new SessionTable · ResultChip" },
      { n: 3, kind: "plus", title: "감사 항목 8가지 + 업무 단계 3가지", text: "조회·검색·등록·수정·삭제·보고서 생성·다운로드·출력을 종류별로 셉니다. 여기에 교차 검증·결재·신발 승인을 따로 셉니다. 삭제는 지운 원본 값까지 남겨 되돌릴 근거를 둡니다.", src: "사업계획서 p16–19 조회·등록·수정·삭제·검색·보고서 생성 이력" },
      { n: 4, kind: "plus", title: "다운로드·출력 기록과 제한", text: "누가 어떤 감정서·이미지를 내려받고 출력했는지 남기고, 파일에 워터마크를 넣습니다. 원본 이미지와 처리 이미지를 나눠 저장해 원본이 바뀌지 않게 합니다. 숫자 기준(하루 20건)은 예시입니다.", src: "사업계획서 p16–19 다운로드·출력 제한 · 원본·처리 데이터 분리" },
      { n: 5, kind: "plus", title: "관리자 행위 탭", text: "권한 변경·잠금 해제·코드 수정·모델 전환처럼 관리자가 한 일만 따로 모읍니다. 사용자 관리(S13), 기초코드관리(S12), 모델 관리(S15)의 이력이 여기로 모입니다.", src: "사업계획서 p16–19 관리자 로그" },
      { n: 6, kind: "plus", title: "엑셀 내보내기", text: "지금 거른 조건 그대로 엑셀로 내보냅니다. 내보낸 일 자체도 기록에 남습니다.", src: "실무자 설문: 결과를 엑셀 형식으로" },
      { n: 7, kind: "plus", title: "보존 기간 안내", text: "기록을 얼마나 보관하는지 화면에 적어 둡니다. 3년·5년은 예시이며 기관 규정을 확인해야 합니다. 기록은 고칠 수 없습니다.", src: "사업계획서 p16–19" },
      { n: 8, kind: "voice", title: "교차 검증·결재도 기록", text: "결과확인완료 → 교차 검증 요청(누구에게) → 의견 일치/불일치 → 감정서 결재 요청(기술책임자)까지 한 줄씩 남깁니다. 권한이 없는 신발 승인 시도는 「권한 없음」으로 남습니다. 「교차 검증 할 수 있는 사람한테 요청을 한단 말이에요」, 「교차 검증 결과 의견이 일치한다고 해서 끝내」.", src: "5613 17:54 · 18:42" },
      { n: 9, kind: "better", title: "보는 사람에 따라", text: "관리자는 모든 사람의 기록을 보고 내보냅니다. 다른 역할은 이 메뉴가 없고, 자기 접속 기록만 내 이름 메뉴에서 봅니다(시안에서는 안내 막대와 흐린 내보내기 버튼으로 표시)." },
      { n: 10, kind: "plus", title: "시간대별 사용량 차트(r3)", text: "오늘 기능 기록 412건을 한 시간 단위 막대로 보여 주고, 최근 7일 평균을 점선으로 겹칩니다. 업무 시간 밖(18시~8시)은 회색 띠로 칠해, 밤중에 기록이 생기면 바로 눈에 띕니다. 숫자는 예시입니다.", src: "사업계획서 p16–19 접속·사용 기록 관리" },
      { n: 11, kind: "plus", title: "이상 징후 목록(r3)", text: "규칙에 걸린 기록만 위로 올립니다: 업무 시간 밖 대량 내려받기, 로그인 연속 실패로 잠긴 계정(lee0508, S13과 같은 건), 관리자 본인 권한 변경 시도(S13 이력의 거절 건), 권한 없는 기능 반복 시도. 관리자가 확인하면 「확인 전」이 빠집니다. 46건·20건 기준은 예시입니다.", src: "사업계획서 p16–19 다운로드·출력 제한 · 관리자 권한 오남용 방지 · S00 5회 실패 잠금" },
      { n: 12, kind: "plus", title: "기록 무결성(해시 사슬)(r3)", text: "기록 한 줄마다 바로 앞 줄의 지문(해시 — 내용이 한 글자만 달라도 완전히 바뀌는 짧은 값)을 함께 저장합니다. 누가 기록을 몰래 고치면 사슬이 끊겨 드러나고, 매일 보관 저장소 사본과 맞춰 봅니다. 감사 기록 자체를 믿을 수 있게 하는 장치입니다. 459건 = 로그인 38 + 기능 412 + 관리자 행위 9.", src: "사업계획서 p16–19 감사 로그 관리 · 해시 사슬 방식은 시안 제안(확인 필요)" },
    ],
  });
})();
