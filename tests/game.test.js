import { describe, it, expect, beforeEach } from 'vitest';
import { chromium } from 'vitest/browser';

describe('Dirt Bike Racing Game', () => {
  let page;

  beforeEach(async () => {
    const browser = await chromium.launch();
    page = await browser.newPage();
    await page.goto('http://localhost:5173/');
    // Wait for loading to complete
    await page.waitForSelector('#loading-bar-container', { timeout: 10000 });
    await page.waitForSelector('#title-screen.active', { timeout: 10000 });
  });

  it('displays the title screen', async () => {
    const title = await page.textContent('.title-logo');
    expect(title).toContain('MOTOCROSS MADNESS 3D');
  });

  it('has all menu buttons', async () => {
    const buttons = await page.$$('[class*="title-btn"]');
    expect(buttons.length).toBeGreaterThanOrEqual(4);
  });

  it('starts a race when clicking Start Race', async () => {
    await page.click('[id="btn-start"]');
    // Should show countdown
    await page.waitForSelector('#countdown-overlay.active', { timeout: 5000 });
    // Then should show HUD
    await page.waitForSelector('#hud.active', { timeout: 10000 });
    const hud = await page.$('#hud.active');
    expect(hud).toBeTruthy();
  });

  it('shows HUD elements during race', async () => {
    await page.click('[id="btn-start"]');
    await page.waitForSelector('#hud.active', { timeout: 10000 });
    const speed = await page.$('#hud-speed-val');
    expect(speed).toBeTruthy();
    const lap = await page.$('#hud-lap');
    expect(lap).toBeTruthy();
    const timer = await page.$('#hud-timer');
    expect(timer).toBeTruthy();
  });

  it('renders a 3D canvas', async () => {
    const canvasCount = await page.$$eval('canvas', els => els.length);
    expect(canvasCount).toBeGreaterThanOrEqual(2); // Three.js canvas + minimap + particle overlay
  });

  it('has no console errors', async () => {
    const errors = await page.evaluate(() => {
      return window._consoleErrors || [];
    });
    expect(errors.length).toBe(0);
  });

  afterAll(async () => {
    await page.close();
  });
});
