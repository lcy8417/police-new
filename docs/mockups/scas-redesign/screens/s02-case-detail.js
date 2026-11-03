/* S02 사건 상세·등록 — SCAS 「사건관리」 레이어 팝업 (IMG_5613 00:00–01:45, 03:05, 11:52, 16:22, 20:52) */
(function () {
  const { pin, apin, sole } = M;

  /* 이미지 12장 — SCAS는 문자열 정렬(_1,_10,_11,_12,_2…), 우리는 자연 정렬(_1,_2,…,_12) */
  const IMGS = [
    { n: 1, mb: "5.6", ok: true, z: ["dots", "grid", "herring"] },
    { n: 2, mb: "6.6", ok: true, z: ["tri", "wave", "blocks"] },
    { n: 3, mb: "4.9", ok: true, z: ["grid", "grid", "lines"] },
    { n: 4, mb: "5.1", ok: false, z: ["herring", "dots", "grid"] },
    { n: 5, mb: "5.3", ok: false, z: ["wave", "wave", "tri"] },
    { n: 6, mb: "4.7", ok: false, z: ["blocks", "lines", "dots"] },
  ];
  const chk = (on) => `<span style="color:${on ? "var(--blue)" : "var(--faint)"};font-size:13px">${on ? "☑" : "☐"}</span>`;
  const sel = (t, mono) => `<span class="inp w100 ${mono ? "mono" : ""}">${t}<span class="caret">▾</span></span>`;
  const txt = (t, mono) => `<span class="inp w100 ${mono ? "mono" : ""}">${t}</span>`;
  const ro = (t) => `<span class="mono" style="color:var(--fg)">${t}</span>`;
  const F = (l, v, o = {}) => `<div class="l ${o.req ? "req" : ""}">${l}</div><div class="v ${o.span ? "span3" : ""}">${v}</div>`;
  const pick = (t) => `<span class="inp w100">${t}<span class="caret" style="color:var(--blue)">⌕</span></span>`;

  function ours() {
    const strip = IMGS.map(
      (im, i) => `<div style="display:grid;grid-template-columns:16px 30px minmax(0,1fr);gap:8px;align-items:center;padding:6px 8px;border-radius:8px;${i === 0 ? "background:var(--blue-bg);box-shadow:inset 0 0 0 1px #2b4a78" : ""}">
        ${chk(i < 3)}
        <span class="imgbox" style="display:block;width:30px;height:42px;border-radius:5px">${sole({ kind: "scene", zones: im.z, cut: i === 1 })}</span>
        <span style="display:grid;line-height:1.3"><b class="mono" style="font-size:12px;color:var(--fg)">_${im.n}</b>
          <span style="font-size:11px;color:var(--dim)"><span class="num">${im.mb} MB</span> · ${im.ok ? `<span style="color:#4ade80">입력됨</span>` : `<span style="color:var(--amber)">미입력</span>`}</span></span>
      </div>`
    ).join("");

    return M.shell(
      { active: "사건관리", tabs: ["사건관리", "00001-25-0649"], tabOn: "00001-25-0649", title: "사건 상세", h: 1030 },
      `<div class="page-head">
        <div>
          <div class="crumb">족윤적 · 사건관리 · 사건 상세</div>
          <h3><span class="mono">00001-25-0649</span> 주거침입</h3>
          <div class="pinbox" style="display:flex;gap:6px;align-items:center;margin-top:8px;padding-right:14px">${apin(8, "plus")}
            <span class="chip green"><span class="dot"></span>의뢰 07-24 09:10 · 이○○ 경사</span><span style="color:var(--dim)">→</span>
            <span class="chip amber"><span class="dot"></span>접수 대기</span><span style="color:var(--dim)">→</span>
            <span class="chip">배당 —</span><span style="color:var(--dim)">→</span>
            <span class="chip">문양 코딩·검색</span>
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="pinbox" style="display:inline-flex;gap:6px">${apin(7, "keep", true)}
            <button class="btn">‹ 이전</button><button class="btn">다음 ›</button><button class="btn">사건복사</button>
            <button class="btn" data-lock="investigator analyst admin">수정</button></span>
          <span style="width:1px;height:24px;background:var(--line)"></span>
          <span class="pinbox" style="display:inline-flex;gap:6px">${apin(9, "better")}
            <button class="btn pri" data-role="investigator admin">등록·의뢰</button>
            <button class="btn ok" data-role="analyst admin">접수</button>
            <button class="btn" data-role="analyst admin">배당 ▾</button>
            <button class="btn pri" data-role="analyst admin">문양 코딩 →</button>
            <span class="chip" data-role="verifier">읽기 전용</span></span>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:190px minmax(0,1fr) 520px;gap:12px;align-items:start">
        <!-- 왼쪽: 이미지 목록 -->
        <div class="panel">
          <div class="panel-h"><span class="t">이미지 목록</span><span class="r"><span class="chip num" style="height:20px">12장</span></span></div>
          <div class="panel-b" style="display:grid;gap:8px;padding:10px">
            <div class="pinbox" style="display:grid;place-items:center;gap:2px;height:74px;border:1px dashed #2b4a78;border-radius:10px;background:rgba(21,34,56,.45);color:var(--fg2);font-size:12px;text-align:center">${apin(4, "better")}
              <span style="font-size:18px;color:var(--blue)">⤓</span>사진을 끌어 놓기<span style="color:var(--dim);font-size:11px">여러 장 한 번에</span></div>
            <div style="display:flex;gap:6px"><button class="btn sm" data-role="investigator analyst admin">＋ 추가</button><button class="btn sm" data-role="investigator analyst admin">삭제</button>
              <span class="pinbox" style="margin-left:auto;color:var(--dim);font-size:11px;padding-right:14px">${apin(3, "better")}1→12순</span></div>
            <div style="display:grid;gap:2px">${strip}</div>
            <div style="padding:2px 8px;color:var(--dim);font-size:11px;line-height:1.5">… <span class="mono">_7 _8 _9 _10 _11 _12</span><br>☑ 3장 선택됨 → 오른쪽 일괄 적용</div>
          </div>
        </div>

        <!-- 가운데: 큰 미리보기 -->
        <div class="panel tc">
          <div class="panel-h"><span class="lbl">족윤적 이미지</span><span class="t mono">00001-25-0649_1</span>${pin(6, "better")}
            <span class="r"><button class="btn sm ghost">‹</button><span class="num" style="color:var(--mute);font-size:12px">1 / 12</span><button class="btn sm ghost">›</button></span></div>
          <div class="panel-b">
            <div class="imgbox" style="height:600px">
              ${sole({ kind: "scene", zones: ["dots", "grid", "herring"], ruler: true })}
              <span class="cap">원본 · 4032×3024 · 사진촬영법</span>
              <div style="position:absolute;left:50%;bottom:14px;transform:translateX(-50%);display:flex;gap:4px;padding:5px;border:1px solid var(--line3);border-radius:10px;background:rgba(11,18,29,.88)">
                <button class="btn sm">↻ 회전</button><button class="btn sm">⬚ 자르기</button><button class="btn sm">◐ 평준화</button><button class="btn sm pri">이미지 편집 열기 (S03)</button>
              </div>
            </div>
            <p style="margin:8px 2px 0;color:var(--dim);font-size:11.5px">이미지를 두 번 누르거나 「이미지 편집 열기」를 누르면 편집창이 이 화면 위에 한 겹으로 열립니다. 별도 창이 뜨지 않습니다.</p>
          </div>
        </div>

        <!-- 오른쪽: 폼 -->
        <div style="display:grid;gap:12px">
          <div class="panel">
            <div class="panel-h"><span class="t">사건정보</span><span class="r pinbox" style="padding-right:12px">${apin(1, "keep")}<span style="color:var(--dim);font-size:11px">SCAS 칸 이름 그대로</span></span></div>
            <div class="form" style="grid-template-columns:92px minmax(0,1fr) 92px minmax(0,1fr)">
              ${F("감정번호", ro("00001-25-0649"))}${F("문서번호", ro("SCAS수사부-871"))}
              ${F("SCAS사건번호", ro("2025-03321"))}${F("피해자 성명", txt("김○○"))}
              ${F("사건명", sel("주거침입"), { req: 1 })}${F("출생년도", txt("1968", 1))}
              ${F("용의자 유무", `<span class="radio"><span>유</span><span class="on">무</span></span>`, { req: 1 })}${F("검거여부", sel("수사중"))}
              ${F("의뢰관서", `<div class="pinbox" style="display:flex;gap:8px;align-items:center;padding-right:12px">${apin(2, "better")}<span style="white-space:nowrap;color:var(--mute)">${chk(false)} 타기관</span>${pick("대구청 › 동부서")}</div>`, { req: 1, span: 1 })}
              ${F("발생관서", pick("대구청 › 동부서"), { req: 1, span: 1 })}
              ${F("사건일시", `<div style="display:flex;gap:6px;align-items:center"><span style="color:var(--dim)">시작</span><span class="inp mono" style="font-size:11.5px">2025-07-22 23:00</span><span style="color:var(--dim)">~ ${chk(true)} 종료</span><span class="inp mono" style="font-size:11.5px">2025-07-23 06:30</span></div>`, { req: 1, span: 1 })}
              ${F("사건장소", sel("주택 › 단독주택"), { req: 1 })}${F("감정의뢰 담당자", txt("경사 이○○"))}
              ${F("사건주소", txt("대구광역시 동구 ○○로 ○○"), { req: 1, span: 1 })}
              ${F("사건개요", `<div style="color:var(--fg2);line-height:1.5">피의자는 2025. 7. 22. 23:00경부터 다음 날 06:30경 사이 피해자 주거지 뒷문으로 침입하여 거실 서랍장의 현금을 절취한 것임.</div>`, { req: 1, span: 1 })}
              ${F("비고", `<span style="color:var(--faint)">—</span>`, { span: 1 })}
            </div>
          </div>

          <div class="panel">
            <div class="panel-h"><span class="t">현장 이미지 정보</span><span class="chip blue mono" style="height:20px">_1</span>
              <span class="r"><button class="btn sm" data-lock="investigator analyst admin">수정</button></span></div>
            <div class="pinbox" style="display:flex;gap:8px;align-items:center;padding:8px 14px;border-bottom:1px solid var(--line2);background:rgba(21,34,56,.35)">${apin(5, "better", true)}
              <span style="font-size:12px;color:var(--fg2)">☑ 3장 선택 <span class="mono" style="color:var(--dim)">_1 _2 _3</span> · ☑ 표시한 칸만</span>
              <button class="btn sm pri" style="margin-left:auto" data-lock="investigator analyst admin">선택한 이미지 모두 적용</button>
            </div>
            <div class="form" style="grid-template-columns:92px minmax(0,1fr) 92px minmax(0,1fr);border-top:0">
              ${F("구분", `<span class="radio"><span class="on">신발</span><span>타이어</span></span>`, { req: 1 })}${F("이미지 이름", sel("00001-25-0649_1", 1))}
              ${F("채취 일시", `<span style="display:flex;gap:6px;align-items:center">${chk(true)}<span class="inp w100 mono">07-23 08:40</span></span>`, { req: 1 })}${F("채취자 계급", `<span style="display:flex;gap:6px;align-items:center">${chk(true)}${sel("경사")}</span>`, { req: 1 })}
              ${F("채취 장소", `<span style="display:flex;gap:6px;align-items:center">${chk(true)}${sel("거실 바닥")}</span>`, { req: 1 })}${F("채취자 이름", `<span style="display:flex;gap:6px;align-items:center">${chk(true)}${txt("이○○")}</span>`, { req: 1 })}
              ${F("채취 방법", `<span style="display:flex;gap:6px;align-items:center">${chk(true)}${sel("사진촬영법")}</span>`, { req: 1 })}${F("감정물 종류", `<span style="display:flex;gap:6px;align-items:center">${chk(true)}${sel("사진")}</span>`, { req: 1 })}
              ${F("제조사", `<span style="display:flex;gap:6px;align-items:center">${chk(false)}${sel("미상")}</span>`)}${F("족적 구분", `<span style="display:flex;gap:6px;align-items:center">${chk(false)}<span class="radio" style="gap:6px"><span class="on">좌</span><span>우</span><span>불상</span></span></span>`)}
              ${F("상표", `<span style="display:flex;gap:6px;align-items:center">${chk(false)}${sel("—")}</span>`)}${F("굽 유무", `<span style="display:flex;gap:6px;align-items:center">${chk(false)}<span class="radio" style="gap:6px"><span class="on">유</span><span>무</span><span>불상</span></span></span>`)}
              ${F("화종", `<span style="display:flex;gap:6px;align-items:center">${chk(false)}${sel("운동화")}</span>`)}${F("", "")}
            </div>
          </div>
        </div>
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
      <div style="height:560px"></div>
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
              <tr>${L("채취 방법*")}<td>☐ ${dd("사진촬영법")}</td>${L("감정물 종류*")}<td>☐ ${dd("사진")}</td></tr>
              <tr>${L("제조사")}<td>☐ ${dd("")}</td>${L("족적 구분")}<td>☐ ◉좌 ○우 ○불상</td></tr>
              <tr>${L("상표")}<td>☐ ${dd("")}</td>${L("굽 유무")}<td>☐ ◉유 ○무 ○불상</td></tr>
              <tr>${L("화종")}<td>☐ ${dd("")}</td><td class="lbl"></td><td></td></tr>
            </tbody></table>
          </div>
        </div>
      </div>
      ${M.pain(40, 560, "<b>이미지 목록이 _1, _10, _11, _12, _2 순</b> — 문자열 정렬이라 12장 사건에서 순서가 뒤섞임 (5613 16:22)", 250)}
      ${M.pain(840, 470, "<b>이미지마다 현장 이미지 정보를 따로 입력</b> — 칸 앞 ☐의 뜻도 화면에 설명이 없음 (5613 01:30–01:45)", 260)}
      ${M.pain(560, 92, "<b>관서는 드롭다운 2단</b> — 지방청 고르고 다시 경찰서. 이미지를 누르면 이미지 커팅이 별도 OS 창으로 뜸 (5613 00:00–01:25)", 270)}`
    );
  }

  M.add({
    id: "s02",
    code: "S02",
    group: "사건관리",
    title: "사건 상세·등록",
    refs: [{ t: "SCAS 사건관리 팝업", v: "5613 00:00–01:45 · 16:22 · 20:52" }],
    lead: "SCAS 팝업의 사건정보·현장 이미지 정보 칸을 이름 그대로 옮기고, 팝업 대신 한 페이지(이미지 목록 | 큰 미리보기 | 입력 폼)로 펼쳤습니다. 이미지가 많은 사건도 순서대로 보이고, 채취 정보는 여러 장에 한 번에 넣습니다.",
    scas,
    ours,
    notes: [
      { n: 1, kind: "keep", title: "사건정보 칸 그대로", text: "감정번호·문서번호·SCAS사건번호·피해자 성명·출생년도·의뢰관서·사건명·용의자 유무·사건일시(시작~종료)·사건장소·발생관서·검거여부·사건주소·감정의뢰 담당자·사건개요·비고를 이름과 필수(*) 표시까지 그대로 둡니다.", src: "5613 01:30 사건정보 폼" },
      { n: 2, kind: "better", title: "관서 고르기 2단 → 검색 한 칸", text: "지방청 드롭다운 → 경찰서 드롭다운 2번 대신, 한 칸에 「동부」만 쳐도 「대구청 › 동부서」가 나옵니다. ☐타기관 체크는 그대로 남깁니다.", src: "SCAS 의뢰관서·발생관서 드롭다운 2개" },
      { n: 3, kind: "better", title: "이미지 목록 자연 정렬", text: "SCAS는 글자 순서라 _1, _10, _11, _12, _2로 섞였습니다. 숫자 순서(_1 → _12)로 보여 주고, 파일크기는 바이트 대신 MB로 씁니다.", src: "5613 16:22 (0649, 12장)" },
      { n: 4, kind: "better", title: "끌어 놓아 여러 장 올리기", text: "SCAS의 「추가」「삭제」 버튼은 그대로 두고, 사진 여러 장을 한꺼번에 끌어 놓는 칸을 더했습니다." },
      { n: 5, kind: "better", title: "채취 정보 일괄 적용", text: "왼쪽에서 이미지를 여러 장 고르고 「선택한 이미지 모두 적용」을 누르면 ☑한 칸(채취 일시·장소·방법·채취자 등)이 한 번에 들어갑니다. 뜻이 불분명했던 칸 앞 ☐를 「적용할 칸 고르기」로 이름 붙였고, 아직 안 넣은 이미지는 「미입력」으로 표시합니다.", src: "5613 01:30–01:45" },
      { n: 6, kind: "better", title: "팝업 → 한 페이지 + 큰 미리보기", text: "족윤적 이미지를 가운데 크게 보여 주고, 회전·자르기·평준화를 바로 누를 수 있습니다. 자세한 편집은 S03 편집창이 이 화면 위에 한 겹으로 열립니다(별도 OS 창 없음).", src: "5613 00:00–01:25 이미지 커팅 창" },
      { n: 7, kind: "keep", title: "이전·다음·사건복사·수정", text: "SCAS 팝업 위쪽 버튼을 같은 이름·같은 순서로 둡니다. 「닫기」는 위쪽 화면 탭의 ✕가 맡습니다." },
      { n: 8, kind: "plus", title: "의뢰 → 접수 → 배당 상태 줄", text: "수사관이 의뢰한 시각·사람과 감정관 접수·배당 여부를 제목 아래 한 줄로 보여 줍니다. 누가 지금 공을 들고 있는지 바로 알 수 있습니다.", src: "사업계획서 p25·p36 판단·기록 워크플로우" },
      { n: 9, kind: "better", title: "보는 사람마다 다른 버튼", text: "수사관에게는 「등록·의뢰」, 감정관에게는 「접수」「배당」「문양 코딩 →」이 보입니다. 검증자는 「읽기 전용」으로 보고 수정 버튼이 잠깁니다." },
    ],
  });
})();
