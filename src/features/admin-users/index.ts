// features/admin-users — 관리자 사용자·권한 관리(설계서 §6·§7-3). 화면 조립은 `pages/manage-users`.
// FSD: entities·shared만 import(features/auth 금지 — 본인 수정 후 세션 재확인은 페이지가 `onUserChanged`로).
export {
  useCreateUser,
  useReplaceFeatures,
  useResetPassword,
  useUnlockUser,
  useUpdateUser,
  useUsersQuery,
  type AdminUserMutationOptions,
} from "./model/use-admin-users"
export { userStatus, type UserStatus } from "./model/user-rules"
export { UserTable } from "./ui/UserTable"
export { UserDetailPanel } from "./ui/UserDetailPanel"
export { FeatureToggles } from "./ui/FeatureToggles"
export { CreateUserDialog } from "./ui/CreateUserDialog"
export { PasswordResetDialog } from "./ui/PasswordResetDialog"
