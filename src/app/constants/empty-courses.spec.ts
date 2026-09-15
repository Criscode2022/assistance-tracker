import { CREATE_COURSE_NAV, EMPTY_COURSES_COPY, SIGN_IN_NAV } from './empty-courses';

describe('EMPTY_COURSES_COPY', () => {
  it('exposes a single set of i18n keys for every tab', () => {
    expect(EMPTY_COURSES_COPY.titleKey).toBe('COMMON.NO_COURSES');
    expect(EMPTY_COURSES_COPY.hintKey).toBe('COMMON.NO_COURSES_HINT');
    expect(EMPTY_COURSES_COPY.actionKey).toBe('COMMON.CREATE_COURSE');
    expect(EMPTY_COURSES_COPY.importKey).toBe('COMMON.IMPORT_COURSE');
    expect(EMPTY_COURSES_COPY.signInHintKey).toBe('COMMON.NO_COURSES_SIGNIN_HINT');
    expect(EMPTY_COURSES_COPY.signInKey).toBe('COMMON.SIGN_IN');
    expect(EMPTY_COURSES_COPY.icon).toBe('book-outline');
  });

  it('points the create action at the courses tab', () => {
    expect(CREATE_COURSE_NAV.path).toBe('/courses');
    expect(CREATE_COURSE_NAV.queryParam).toBe('create');
    expect(CREATE_COURSE_NAV.queryValue).toBe('1');
  });

  it('points the sign-in action at the auth page', () => {
    expect(SIGN_IN_NAV.path).toBe('/auth');
    expect(SIGN_IN_NAV.queryParam).toBe('tab');
    expect(SIGN_IN_NAV.queryValue).toBe('signin');
  });
});
