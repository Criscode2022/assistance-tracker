import { test, expect } from '@playwright/test';
import {
  gotoTab,
  gotoConfig,
  clickTab,
  createCourse,
  logDayRows,
  markFirstPastDayPresent,
  switchLanguage,
  expectTabBar,
} from './helpers/navigation';
import { seedLocalStorage, makeCourse } from './helpers/storage';

test.describe('Dashboard', () => {
  test('D-032: gear icon opens settings', async ({ page }) => {
    const course = makeCourse();
    await seedLocalStorage(page, {
      courses: [course],
      selectedCourseId: course.id,
      records: { [course.id]: { '2026-06-02': { status: 'present' } } },
    });
    await gotoTab(page, 'dashboard');
    await page.locator('ion-button').filter({ has: page.locator('ion-icon[name="settings-outline"]') }).click();
    await expect(page).toHaveURL(/\/config/);
  });

  test('D-001: loads stats for selected course', async ({ page }) => {
    const course = makeCourse({ name: 'Dashboard Stats Course' });
    await seedLocalStorage(page, {
      courses: [course],
      selectedCourseId: course.id,
      records: {
        [course.id]: {
          '2026-06-02': { status: 'present' },
          '2026-06-03': { status: 'present' },
        },
      },
    });
    await gotoTab(page, 'dashboard');
    await expect(page.locator('.course-name')).toHaveText('Dashboard Stats Course');
    await expect(page.locator('.ring-wrap')).toBeVisible();
    await expect(page.locator('.ring-pct')).toBeVisible();
  });

  test('D-001 + L-050: MCP workflow — present day updates dashboard stats', async ({ page }) => {
    await seedLocalStorage(page, {});
    await gotoTab(page, 'courses');
    await createCourse(page, {
      name: 'MCP Workflow Test',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
    });
    await clickTab(page, 'log');
    await expect(logDayRows(page).first()).toBeVisible();
    await markFirstPastDayPresent(page);
    await clickTab(page, 'dashboard');
    await expect(page.locator('.course-name')).toHaveText('MCP Workflow Test');
    await expect(page.getByText(/1 presentes|1 present/i)).toBeVisible();
    await expect(page.locator('.hours-card .metric-num')).toContainText('5h');
  });
});

test.describe('Settings', () => {
  test('S-020: switch language to English', async ({ page }) => {
    await seedLocalStorage(page, { lang: 'es' });
    await gotoConfig(page);
    await switchLanguage(page, 'en');
    await page.getByRole('button').first().click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expectTabBar(page, 'en');
  });
});
