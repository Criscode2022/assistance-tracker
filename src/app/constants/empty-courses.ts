/** Shared no-courses empty state. Reuse these keys on every tab. */
export const EMPTY_COURSES_COPY = {
  titleKey: 'COMMON.NO_COURSES',
  hintKey: 'COMMON.NO_COURSES_HINT',
  actionKey: 'COMMON.CREATE_COURSE',
  importKey: 'COMMON.IMPORT_COURSE',
  signInHintKey: 'COMMON.NO_COURSES_SIGNIN_HINT',
  signInKey: 'COMMON.SIGN_IN',
  icon: 'book-outline',
} as const;

/** Navigation used by the empty-state create button. */
export const CREATE_COURSE_NAV = {
  path: '/courses',
  queryParam: 'create',
  queryValue: '1',
} as const;

/** Navigation used by the empty-state sign-in button. */
export const SIGN_IN_NAV = {
  path: '/auth',
  queryParam: 'tab',
  queryValue: 'signin',
} as const;

export type EmptyCoursesCopy = typeof EMPTY_COURSES_COPY;
