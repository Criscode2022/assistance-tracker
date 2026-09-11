import { CREATE_COURSE_NAV, EMPTY_COURSES_COPY } from './empty-courses';

describe('EMPTY_COURSES_COPY', () => {
  it('exposes a single set of i18n keys for every tab', () => {
    expect(EMPTY_COURSES_COPY.titleKey).toBe('COMMON.NO_COURSES');
    expect(EMPTY_COURSES_COPY.hintKey).toBe('COMMON.NO_COURSES_HINT');
    expect(EMPTY_COURSES_COPY.actionKey).toBe('COMMON.CREATE_COURSE');
    expect(EMPTY_COURSES_COPY.icon).toBe('book-outline');
  });

  it('points the create action at the courses tab', () => {
    expect(CREATE_COURSE_NAV.path).toBe('/courses');
    expect(CREATE_COURSE_NAV.queryParam).toBe('create');
    expect(CREATE_COURSE_NAV.queryValue).toBe('1');
  });
});
