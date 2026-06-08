import { test, expect } from '@playwright/test';
import { gotoTab, clickTab, markFirstPastDayPresent } from './helpers/navigation';
import { seedLocalStorage, makeCourse } from './helpers/storage';

const course = makeCourse({
  name: 'MCP Workflow Test',
  startDate: '2026-06-01',
  endDate: '2026-06-30',
});

test.describe('History', () => {
  test('H-001: shows month card when attendance is logged', async ({ page }) => {
    await seedLocalStorage(page, {
      courses: [course],
      selectedCourseId: course.id,
      records: { [course.id]: { '2026-06-01': { status: 'present' } } },
    });
    await gotoTab(page, 'history');

    await expect(page.locator('.month-card')).toHaveCount(1);
    await expect(page.locator('.month-label')).toContainText(/junio de 2026/i);
    await expect(page.locator('.empty-state')).not.toBeVisible();
  });

  test('H-002: month card shows label, percent, working days, and present count', async ({ page }) => {
    await seedLocalStorage(page, {
      courses: [course],
      selectedCourseId: course.id,
      records: {
        [course.id]: {
          '2026-06-01': { status: 'present' },
          '2026-06-02': { status: 'present' },
        },
      },
    });
    await gotoTab(page, 'history');

    const card = page.locator('.month-card').first();
    await expect(card.locator('.month-label')).toContainText(/junio de 2026/i);
    await expect(card.locator('.month-days')).toContainText(/22.*días hábiles/i);
    await expect(card.locator('.att-value')).toContainText('%');
    await expect(card.locator('.stat-chip').first()).toContainText('2');
    await expect(card.locator('.stat-chip').first()).toContainText(/presentes/i);
  });

  test('H-008: logging attendance on Log tab updates History on navigate', async ({ page }) => {
    await seedLocalStorage(page, {
      courses: [course],
      selectedCourseId: course.id,
    });
    await gotoTab(page, 'log');
    await markFirstPastDayPresent(page);
    await clickTab(page, 'history');

    const card = page.locator('.month-card').first();
    await expect(card.locator('.att-value')).not.toHaveText('0%');
    await expect(card.locator('.stat-chip').first()).toContainText('1');
    await expect(card.locator('.stat-chip').first()).toContainText(/presentes/i);
  });
});
