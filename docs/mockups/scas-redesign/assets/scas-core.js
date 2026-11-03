/* SCAS 재현 페이지(scas.html) 도우미 — 시안 전용, 실제 앱 코드 아님.
   화면 파일 scas-screens/*.js 가 R.add 로 화면을 등록한다. 우리 시안 화면(M.screens)은 assets/core.js + screens/*.js 가 등록한다. */
(function () {
  "use strict";
  const R = (window.R = { screens: [] });

  /* R.add({ id:"sc-list", group:"사건 감정", title:"사건관리 목록", ours:"S01", ref:"5613 02:00 · 10:04",
             render: () => html,           // R.win(...) 으로 만든 1440px SCAS 창 전체
             memo: ["불편점 한 줄", ...] })   // 영상에서 본 불편점(쉬운 말, 시각 포함) */
  R.add = (s) => R.screens.push(s);

  /* 버튼: go 가 있으면 누를 때 그 화면으로 이동(SCAS 흐름 따라가기) */
  R.btn = (label, go = "", cls = "") => `<span class="r-btn ${cls}" ${go ? `data-go="${go}" title="→ ${go}"` : ""}>${label}</span>`;
  R.btns = (list) => `<span class="r-btns">${list.map((b) => (typeof b === "string" ? R.btn(b) : R.btn(b[0], b[1] || "", b[2] || ""))).join("")}</span>`;
  R.inp = (v = "", w = 140, cls = "") => `<span class="r-inp ${cls}" style="min-width:${w}px">${v}</span>`;
  R.sel = (v = "전체", w = 90) => `<span class="r-inp r-sel" style="min-width:${w}px">${v}</span>`;
  R.icon = (name, on = false) => `<span class="r-icon ${on ? "on" : ""}"><img src="assets/patterns/${name}.png" alt="${name}"></span>`;
  R.img = (w, h, opts = {}) => `<span class="r-ph" style="width:${w}px;height:${h}px">${window.M ? M.sole(opts) : ""}</span>`;

  /* SCAS 공통 틀: 브라우저 주소줄 + GNB + MDI 탭 + 왼쪽 트리 + 작업 영역 */
  const TREE = [
    ["사건관리 ▾", 0, "sc-list"], ["사건관리", 1, "sc-list"], ["용의자관리", 1],
    ["문양관리 ▾", 0], ["신발문양 관리", 1, "sc-shoe-list"], ["신발문양 조회", 1], ["타이어문양 관리", 1], ["타이어문양 조회", 1], ["신발그룹 관리", 1],
    ["문양검색 ▸", 0], ["문양대조 ▸", 0], ["감정서관리 ▸", 0],
    ["족윤적관리 ▾", 0], ["불발견족윤적관리", 1], ["문양아이콘관리", 1], ["진행상태변경", 1], ["신발정보일괄관리", 1], ["신발정보일괄등록", 1], ["타이어정보일괄등록", 1],
    ["기초코드관리", 1, "sc-code"], ["사용자 관리", 1], ["족윤적 검증", 1, "sc-verify"],
    ["족윤적감정 역량평가", 0],
  ];
  const TABS = [
    ["사건관리", "sc-list"], ["시험품질경영절차서"], ["시험품질경영지침서"], ["감정서작성", "sc-report-list"], ["족윤적 검증", "sc-verify"],
    ["결재 대기함", "sc-approve"], ["수신 문서함"], ["문서접수대장"],
  ];
  R.win = function ({ url = "10.14.43.6/kcsi/uat/uia/actionMain.do?menuno=10191010", tabOn = "사건관리", treeOn = "사건관리", extraTabs = [], h = 900, title = "과학수사 플랫폼(SCAS+)" } = {}, inner = "") {
    const tabs = TABS.concat(extraTabs.map((t) => [t[0], t[1]]));
    return `<div class="rp" style="height:${h}px">
      <div class="r-chrome"><span>◀ ▶ ⟳</span><span style="color:#666">${title}</span><span class="url">${url}</span></div>
      <div class="r-gnb"><span class="logo">SCAS<em>+</em></span><span>현장감식</span><span>사건조회</span><span>몽타주</span><span class="on">족윤적</span><span>특수감식</span><span>KOLAS</span><span>통합증거물</span><span>통합감정의뢰</span><span>통계</span><span>모니터링</span><span>전자결재</span></div>
      <div class="r-tabs">${tabs.map(([t, go]) => `<span class="${t === tabOn ? "on" : ""}" ${go ? `data-go="${go}"` : ""}>${t} ×</span>`).join("")}</div>
      <div class="r-wrap" style="height:${h - 100}px"><div class="r-tree">${TREE.map(([t, sub, go]) => `<div class="${sub ? "sub" : ""} ${t === treeOn ? "on" : ""}" ${go ? `data-go="${go}"` : ""}>${sub ? "▪ " : "📁 "}${t}</div>`).join("")}</div>
      <div class="r-work">${inner}</div></div></div>`;
  };
  /* 브라우저 밖에 따로 뜨는 창(크롬 팝업 창·OS 창)만 있는 화면을 그릴 때: 바탕은 흐린 SCAS 틀 */
  R.dim = () => `<div class="r-dim"></div>`;

  /* ── 페이지 렌더 ── */
  let mode = "scas"; // scas | pair
  function scaleAll() {
    document.querySelectorAll(".rp-scale").forEach((box) => {
      const inner = box.firstElementChild;
      const s = Math.min(1, box.clientWidth / 1440);
      inner.style.transform = `scale(${s})`;
      box.style.height = inner.offsetHeight * s + "px";
    });
  }
  function show(id) {
    const s = R.screens.find((x) => x.id === id) || R.screens[0];
    document.querySelectorAll(".rp-list a").forEach((a) => a.classList.toggle("on", a.dataset.id === s.id));
    const ours = window.M && M.screens.find((x) => x.code === s.ours);
    const cap = `<div class="rp-cap"><b>${s.title}</b><span>영상 ${s.ref || ""}</span>${ours ? `<span>↔ 우리 시안 <b style="font-size:13px;color:var(--blue)">${ours.code} ${ours.title}</b></span>` : ""}</div>`;
    const memo = (s.memo || []).length ? `<div class="rp-memo">${s.memo.map((m) => `<div><b>불편</b> ${m}</div>`).join("")}</div>` : "";
    const view = document.getElementById("rp-view");
    if (mode === "pair" && ours) {
      view.innerHTML = `${cap}<div class="rp-pair"><div><div class="lab">SCAS 지금 (재현)</div><div class="rp-scale"><div class="inner">${s.render()}</div></div></div>
        <div><div class="lab">우리 시안 ${ours.code}</div><div class="rp-scale"><div class="inner">${ours.ours()}</div></div></div></div>${memo}`;
    } else {
      // 화면 폭이 1440px보다 좁으면 창 전체가 보이게 줄여 그린다(가로 스크롤 없이)
      view.innerHTML = `${cap}<div class="rp-scale"><div class="inner">${s.render()}</div></div>${memo}`;
    }
    scaleAll();
    try { localStorage.setItem("scas-replica-last", s.id); } catch (e) { /* 저장 불가 무시 */ }
  }
  R.start = function () {
    const list = document.getElementById("rp-list");
    let g = "";
    R.screens.forEach((s) => {
      if (s.group !== g) { g = s.group; list.insertAdjacentHTML("beforeend", `<h4>${g}</h4>`); }
      list.insertAdjacentHTML("beforeend", `<a href="#${s.id}" data-id="${s.id}"><span>${s.title}</span><small>${s.ours || ""}</small>${s.kind ? `<span class="k">${s.kind}</span>` : ""}</a>`);
    });
    document.body.dataset.viewer = "analyst";
    const route = () => show((location.hash || "").slice(1) || (function () { try { return localStorage.getItem("scas-replica-last"); } catch (e) { return ""; } })() || R.screens[0].id);
    window.addEventListener("hashchange", route);
    document.addEventListener("click", (e) => {
      const go = e.target.closest("[data-go]");
      if (go && R.screens.some((s) => s.id === go.dataset.go)) { location.hash = go.dataset.go; }
      const m = e.target.closest("#rp-mode button");
      if (m) {
        mode = m.dataset.mode;
        document.querySelectorAll("#rp-mode button").forEach((b) => b.setAttribute("aria-pressed", String(b === m)));
        route();
      }
    });
    window.addEventListener("resize", scaleAll);
    route();
  };
})();
