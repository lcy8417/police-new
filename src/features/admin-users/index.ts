// features/admin-users — 관리자 사용자·권한 관리(설계서 §6·§7-3). 화면 조립은 `pages/manage-users`.
// FSD: entities·shared만 import(features/auth 금지 — 본인 수정 후 세션 재확인은 페이지가 `onUserChanged`로).
export {
  useCreateUser,
  useFeaturesQuery,
  useOrgsQuery,
  useReplaceFeatures,
  useReplaceRoles,
  useResetPassword,
  useRolesQuery,
  useUnlockUser,
  useUpdateUser,
  useUsersQuery,
  type AdminUserMutationOptions,
} from "./model/use-admin-users"
export { userStatus, type UserStatus } from "./model/user-rules"
export { adminErrorMessage } from "./model/error-message"
// 화면 표시 위젯(widgets/admin-users-screen)이 같은 규칙을 쓰도록 순수 규칙만 더 내보낸다.
export {
  USER_FORM_MESSAGES,
  USER_ID_PATTERN,
  USER_STATUS_LABELS,
  grantsNationwidePhotos,
  isImpliedFeature,
  isStaffUser,
  needsOrgAssignment,
  sameFeatures,
  sameRoles,
  toggleFeature,
  toggleRole,
} from "./model/user-rules"
