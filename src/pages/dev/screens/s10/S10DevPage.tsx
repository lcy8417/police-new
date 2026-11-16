import * as React from "react";
import { toast } from "sonner";

import type { Shoe } from "@/entities/shoe";
import {
  ShoeDbScreen,
  type ShoeDbFilters,
  type ShoeDbView,
  type ShoeDialogState,
} from "@/widgets/shoe-db";

import {
  DevScreenFrame,
  SCREEN_CASES,
  devScreen,
  useDevCase,
  useDevViewer,
} from "../frame";
import {
  makeS10Shoes,
  S10_DUPLICATE_MESSAGE,
  S10_EMPTY_FILTERS,
  S10_OFFICES,
  S10_PAGE_SIZE,
  S10_TOTAL,
  type S10Case,
} from "./mock-cases";

const info = devScreen("s10");

const BLANK: Shoe = {
  ftwrId: "",
  modlNm: "",
  brandCode: "",
  makrCode: "",
  colctPlace: "",
  colctYear: "",
  image: null,
  top: [],
  mid: [],
  bottom: [],
  outline: [],
};

// S10 신발문양 관리 진열 페이지. 값은 가짜, 저장은 토스트로만 확인한다.
export function S10DevPage() {
  const caseName = useDevCase(SCREEN_CASES.s10, "ready");
  // 케이스를 바꾸면 안쪽 상태를 새로 시작한다(전환 막대는 다시 불러오지 않고 주소만 바꾸므로)
  return (
    <DevScreenFrame screen={info.screen} title={info.title} cases={info.cases}>
      <S10Body key={caseName} caseName={caseName} />
    </DevScreenFrame>
  );
}

function S10Body({ caseName }: { caseName: S10Case }) {
  const viewer = useDevViewer();
  const [shoes] = React.useState(makeS10Shoes);
  const [filters, setFilters] =
    React.useState<ShoeDbFilters>(S10_EMPTY_FILTERS);
  const [view, setView] = React.useState<ShoeDbView>("list");
  const [page, setPage] = React.useState(1);
  const [selectedId, setSelectedId] = React.useState<string | undefined>();
  const [dialog, setDialog] = React.useState<ShoeDialogState | null>(() =>
    caseName === "duplicate"
      ? {
          mode: "new",
          form: { ...BLANK, ftwrId: "00758", modlNm: "모델 100" },
          saveError: S10_DUPLICATE_MESSAGE,
        }
      : null,
  );

  const status =
    caseName === "loading"
      ? "loading"
      : caseName === "error"
        ? "error"
        : caseName === "empty"
          ? "empty"
          : "ready";

  const open = (ftwrId: string) => {
    const shoe = shoes.find((s) => s.ftwrId === ftwrId);
    if (!shoe) return;
    setSelectedId(ftwrId);
    setDialog({ mode: "edit", form: shoe });
  };

  const save = () => {
    if (!dialog) return;
    const id = dialog.form.ftwrId;
    if (dialog.mode === "new") {
      if (id.trim() === "")
        return setDialog({ ...dialog, saveError: "신발ID를 입력하세요" });
      if (shoes.some((s) => s.ftwrId === id))
        return setDialog({ ...dialog, saveError: S10_DUPLICATE_MESSAGE });
    }
    toast.success(`저장했습니다 (시안): ${id}`);
    setDialog(null);
  };

  return (
    <ShoeDbScreen
      status={status}
      errorAt="14:32"
      onRetry={() => toast("다시 조회합니다 (시안)")}
      isAdmin={viewer.isAdmin}
      features={viewer.features}
      filters={filters}
      onFiltersChange={setFilters}
      officeItems={S10_OFFICES}
      onSearch={() => toast("조회합니다 (시안)")}
      onReset={() => setFilters(S10_EMPTY_FILTERS)}
      view={view}
      onViewChange={setView}
      shoes={shoes}
      total={S10_TOTAL}
      page={page}
      pageSize={S10_PAGE_SIZE}
      onPageChange={setPage}
      selectedId={selectedId}
      onOpenShoe={open}
      onRegister={() => setDialog({ mode: "new", form: BLANK })}
      dialog={dialog}
      onFormChange={(form) =>
        setDialog((d) => (d ? { ...d, form, saveError: undefined } : d))
      }
      onSave={save}
      onCloseDialog={() => setDialog(null)}
      onReplaceImage={() => toast("이미지를 고릅니다 (시안)")}
      onRotateImage={() => toast("이미지를 90도 돌립니다 (시안)")}
    />
  );
}
