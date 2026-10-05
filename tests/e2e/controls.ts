import { expect, type Page } from "./fixtures";
export async function choose(page: Page, label: string, option: string) {
  await page.getByRole("button", { name: new RegExp(label) }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
  await expect(page.getByRole("listbox")).toHaveCount(0);
}
export async function segment(
  page: Page,
  name: string,
  part: string,
  value: string,
) {
  const control = page
    .locator(`[data-field-name="${name}"]`)
    .getByRole("spinbutton", { name: new RegExp(`^${part},`) });
  await control.focus();
  await control.press("ControlOrMeta+A");
  await control.pressSequentially(value);
}
export async function canonical(page: Page, name: string, value: string) {
  await expect(page.locator(`input[name="${name}"]`)).toHaveCount(1);
  await expect(page.locator(`input[name="${name}"]`)).toHaveValue(value);
}
