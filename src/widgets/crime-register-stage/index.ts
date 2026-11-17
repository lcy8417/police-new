export { RegisterStage } from "./ui/RegisterStage"
export { HeaderTitle as RegisterHeaderTitle } from "./ui/HeaderContent"
// 새 사건 등록 창(`/cases?new=1`)도 같은 검사 · 번호 조립을 쓴다
export { validateCrimeRegister } from "./model/validate-crime-register"
export { buildAprthngNo } from "./model/form"
export type { CrimeRegisterForm } from "./model/form"
