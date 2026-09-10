import { test, expect, type Page } from '@playwright/test';
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

test.describe('Dashboard layout', () => {
  async function seedLayoutCourse(page: Page) {
    const course = makeCourse({ name: 'Layout Course' });
    await seedLocalStorage(page, {
      courses: [course],
      selectedCourseId: course.id,
      records: {
        [course.id]: {
          '2026-06-02': { status: 'present' },
          '2026-06-03': { status: 'late', entryTime: '09:15' },
        },
      },
    });
  }

  test('D-040: mobile keeps a stacked dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedLayoutCourse(page);
    await gotoTab(page, 'dashboard');
    await expect(page.locator('.dashboard-page')).toHaveCSS('display', 'block');
    const hero = await page.locator('.hero').boundingBox();
    const metrics = await page.locator('.metrics-grid').boundingBox();
    expect(hero && metrics).toBeTruthy();
    expect(metrics!.y).toBeGreaterThan(hero!.y + hero!.height - 8);
    await expect(page.locator('.period-board')).toBeHidden();
  });

  test('D-041: tablet places hero beside metrics', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    await seedLayoutCourse(page);
    await gotoTab(page, 'dashboard');
    await expect(page.locator('.dashboard-page')).toHaveCSS('display', 'grid');
    const hero = await page.locator('.hero').boundingBox();
    const metrics = await page.locator('.metrics-grid').boundingBox();
    expect(hero && metrics).toBeTruthy();
    expect(hero!.x + hero!.width).toBeLessThanOrEqual(metrics!.x + 8);
    expect(Math.abs(hero!.y - metrics!.y)).toBeLessThan(48);
    await expect(page.locator('.period-board')).toBeVisible();
    await expect(page.locator('.period-day').first()).toBeVisible();
  });

  test('D-042: desktop shows three metric cards in a row', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await seedLayoutCourse(page);
    await gotoTab(page, 'dashboard');
    await expect(page.locator('.dashboard-page')).toHaveCSS('display', 'grid');
    const absences = await page.locator('.metrics-grid .metric-card').nth(0).boundingBox();
    const tardiness = await page.locator('.metrics-grid .metric-card').nth(1).boundingBox();
    const hours = await page.locator('.hours-card').boundingBox();
    expect(absences && tardiness && hours).toBeTruthy();
    expect(tardiness!.x).toBeGreaterThan(absences!.x + absences!.width - 8);
    expect(hours!.x).toBeGreaterThan(tardiness!.x + tardiness!.width - 8);
    expect(Math.abs(absences!.y - hours!.y)).toBeLessThan(24);
    await expect(page.locator('.period-board')).toBeVisible();
    await page.locator('.period-link').click();
    await expect(page).toHaveURL(/\/log/);
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
