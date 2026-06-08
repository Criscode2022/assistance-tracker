import { expect, type Page } from '@playwright/test';

export type TabName = 'dashboard' | 'log' | 'history' | 'courses';

const TAB_LABELS: Record<TabName, { es: string; en: string }> = {
  dashboard: { es: 'Resumen', en: 'Overview' },
  log: { es: 'Registro', en: 'Log' },
  history: { es: 'Historial', en: 'History' },
  courses: { es: 'Cursos', en: 'Courses' },
};

export async function gotoTab(page: Page, tab: TabName): Promise<void> {
  await page.goto(`/${tab}`);
  await page.waitForLoadState('domcontentloaded');
  await page.locator('ion-tab-bar').waitFor({ state: 'visible' });
}

export async function clickTab(page: Page, tab: TabName, lang: 'es' | 'en' = 'es'): Promise<void> {
  await page.getByRole('tab', { name: TAB_LABELS[tab][lang] }).click();
  await page.waitForURL(`**/${tab}`);
}

export async function expectTabBar(
  page: Page,
  lang: 'es' | 'en' = 'es',
): Promise<void> {
  for (const tab of Object.keys(TAB_LABELS) as TabName[]) {
    await expect(page.getByRole('tab', { name: TAB_LABELS[tab][lang] })).toBeVisible();
  }
}

export async function gotoConfig(page: Page): Promise<void> {
  await page.goto('/config');
  await page.waitForLoadState('domcontentloaded');
}

export async function gotoAuth(page: Page): Promise<void> {
  await page.goto('/auth');
  await page.waitForLoadState('domcontentloaded');
}

export async function openNewCourseForm(page: Page): Promise<void> {
  await page.locator('ion-fab-button').click();
  await expect(page.locator('.form-wrap')).toBeVisible();
}

export async function fillCourseForm(
  page: Page,
  data: { name?: string; startDate?: string; endDate?: string },
): Promise<void> {
  if (data.name !== undefined) {
    await page.locator('input.modern-input[type="text"]').fill(data.name);
  }
  if (data.startDate !== undefined) {
    await page.locator('input.modern-input[type="date"]').first().fill(data.startDate);
  }
  if (data.endDate !== undefined) {
    await page.locator('input.modern-input[type="date"]').nth(1).fill(data.endDate);
  }
}

export async function saveCourseForm(page: Page): Promise<void> {
  await page.getByRole('button', { name: /guardar curso|save course/i }).click();
}

export async function createCourse(
  page: Page,
  data: { name: string; startDate: string; endDate: string },
): Promise<void> {
  await openNewCourseForm(page);
  await fillCourseForm(page, data);
  await saveCourseForm(page);
  await page.waitForFunction(
    (name) => localStorage.getItem('courses_v1')?.includes(name),
    data.name,
  );
  await expect(page.getByRole('heading', { name: data.name })).toBeVisible();
}

export function logDayRows(page: Page) {
  return page.locator('app-log ion-item-sliding, ion-item-sliding:not(.course-sliding)');
}

export async function markFirstPastDayPresent(page: Page): Promise<void> {
  const pastDay = logDayRows(page).first();
  await pastDay.locator('ion-item').click();
  await page.getByRole('button', { name: /presente|present/i }).click();
  await expect(pastDay.getByText(/presente|present/i)).toBeVisible();
}

export async function switchLanguage(page: Page, lang: 'es' | 'en'): Promise<void> {
  await page.locator(`ion-segment-button[value="${lang}"]`).click();
  await expect.poll(async () => page.evaluate(() => localStorage.getItem('app_lang_v1'))).toBe(lang);
}

export async function deleteCourseByName(page: Page, name: string): Promise<void> {
  await page
    .locator('.course-list')
    .filter({ hasText: name })
    .locator('.course-actions ion-button[color="danger"], ion-item-option[color="danger"]')
    .first()
    .click({ force: true });
  const confirm = page.locator('ion-alert, [role="alertdialog"]').last();
  await confirm.getByRole('button', { name: /^delete$|^eliminar$/i }).click();
  await expect(page.getByRole('heading', { name })).not.toBeVisible();
}
