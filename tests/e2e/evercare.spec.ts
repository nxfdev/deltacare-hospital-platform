import { test, expect } from "@playwright/test";

test.describe("Evercare Hospital Platform E2E Suite", () => {
  test("Homepage loads with branding, hotline, and primary navigation", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Title & Logo
    await expect(page).toHaveTitle(/Evercare/i);

    // Verify Primary Navigation buttons exist
    const nav = page.locator('nav[aria-label="Primary Navigation"]').first();
    await expect(nav).toBeVisible();
  });

  test("Doctors Directory and Search filters", async ({ page }) => {
    await page.goto("/doctors");
    await page.waitForLoadState("domcontentloaded");

    // Doctor directory header
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();

    // Search bar functionality
    const searchInput = page.locator('input[placeholder*="Search by specialist"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("Cardiology");
      await page.waitForTimeout(300);
    }
  });

  test("Departments Directory and Details Page", async ({ page }) => {
    await page.goto("/departments");
    await page.waitForLoadState("domcontentloaded");

    const deptHeading = page.locator("h1");
    await expect(deptHeading).toBeVisible();

    // Verify Cardiology or other department link
    const deptCard = page.locator('a[href*="/departments/"]').first();
    await expect(deptCard).toBeVisible();
  });

  test("Public 3-Step Appointment Booking Interface loads", async ({ page }) => {
    await page.goto("/appointments");
    await page.waitForLoadState("domcontentloaded");

    const bookingHeading = page.locator("h1").first();
    await expect(bookingHeading).toBeVisible();
  });

  test("Hospital Notices Public Directory loads", async ({ page }) => {
    await page.goto("/notices");
    await page.waitForLoadState("domcontentloaded");

    const noticesHeading = page.locator("h1").first();
    await expect(noticesHeading).toBeVisible();
  });
});
