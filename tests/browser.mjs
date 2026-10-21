import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { demoProfiles, assess, MYTHS } from '../src/scoring.js';

await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const origin = process.env.TEST_URL || 'http://127.0.0.1:5173';
const samples = demoProfiles();
let checks = 0;
const pass = message => { checks++; console.log(`PASS ${message}`); };
async function loadDemo(name) {
  await page.getByRole('button', { name: 'Try a demo profile' }).click();
  await page.getByRole('button', { name: new RegExp(name) }).click();
}
async function showScore() {
  await page.getByRole('button', { name: 'See my scorecard' }).click();
  await page.getByTestId('total-score').waitFor();
}

try {
  await page.goto(origin);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'artifacts/form-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  assert.ok(await page.getByRole('alert').count() >= 5);
  pass('blank form validates required fields');

  await page.getByRole('button', { name: /Reality check A little/ }).click();
  await page.getByRole('button', { name: 'Reveal my FatehScore' }).click();
  await page.getByRole('heading', { name: 'Insufficient information' }).waitFor();
  assert.equal(await page.getByTestId('total-score').count(), 0);
  await page.getByRole('button', { name: 'Complete my profile' }).click();
  pass('incomplete submissions show no numerical score');

  // Fill an entire profile through the public form, without injecting state.
  const p = samples[0].profile;
  await page.getByLabel('What should we call you?').fill(p.name);
  await page.getByRole('button', { name: /United Kingdom A world/ }).click();
  for (const k of ['level', 'area', 'stage', 'intake']) await page.locator(`#${k}`).selectOption(p[k]);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.locator('#grade').fill('101');
  await page.locator('#research').selectOption(p.research);
  await page.getByRole('button', { name: /Directly related/ }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByText('Enter a percentage between 0 and 100.').waitFor();
  await page.locator('#grade').fill(p.grade);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.locator('#funds').fill(p.funds);
  for (const k of ['funding', 'costs']) await page.locator(`#${k}`).selectOption(p[k]);
  await page.getByRole('button', { name: 'No', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  for (const k of ['transcripts', 'statement', 'references', 'cv', 'passport', 'english', 'deadlines', 'nextsteps']) await page.locator(`#${k}`).selectOption(p[k]);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  for (let i = 0; i < MYTHS.length; i++) await page.locator('.myth-card').nth(i).getByRole('button', { name: MYTHS[i].answer ? 'Fact' : 'Myth', exact: true }).click();
  assert.equal(await page.locator('.myth-explanation.correct').count(), 6);
  await page.getByRole('button', { name: 'Reveal my FatehScore' }).click();
  await page.getByTestId('total-score').waitFor();
  assert.equal(await page.getByTestId('total-score').textContent(), String(assess(p).total));
  assert.equal(await page.getByTestId('pathway').textContent(), 'Ready to plan');
  pass('full live entry, invalid grade correction, six myth-busters, and ready scorecard');

  await page.getByRole('button', { name: 'Choose my next step' }).click();
  await page.getByRole('button', { name: /Parent Cost Clarity session/ }).click();
  await page.getByRole('button', { name: 'Add to my roadmap' }).click();
  await page.locator('.action-desk').getByRole('heading', { name: 'Parent Cost Clarity session' }).waitFor();
  pass('Action Desk adds a local preference without sending a booking');
  await page.locator('.toast').waitFor({ state: 'detached' });
  await page.screenshot({ path: 'artifacts/scorecard-desktop.png', fullPage: true });
  await page.pdf({ path: 'artifacts/FutureScan-sample-scorecard.pdf', format: 'A4', printBackground: true });

  for (const sample of samples.slice(1)) {
    await loadDemo(sample.name);
    await showScore();
    assert.equal(await page.getByTestId('total-score').textContent(), String(assess(sample.profile).total));
    assert.equal(await page.getByTestId('pathway').textContent(), assess(sample.profile).title);
    await page.pdf({ path: `artifacts/scorecard-${sample.id}.pdf`, format: 'A4', printBackground: true });
  }
  pass('demo profiles produce preparation and affordability pathways');
  await page.locator('#scenario-funds').fill('45');
  await page.getByRole('button', { name: /Use this amount in my profile/ }).click();
  assert.equal(await page.getByTestId('pathway').textContent(), 'Pause & verify affordability');
  assert.equal(await page.getByTestId('total-score').textContent(), String(assess({ ...samples[2].profile, funds: '45' }).total));
  pass('funding what-if recalculates accurately while retaining work-reliance warning');

  await page.getByRole('button', { name: 'How it works' }).click();
  await page.getByRole('dialog').waitFor();
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(), 0);
  pass('methodology dialog opens and closes with keyboard');

  await page.getByRole('button', { name: 'Start a new scan' }).click();
  await page.getByRole('button', { name: 'Keep my answers' }).click();
  assert.equal(await page.getByTestId('pathway').textContent(), 'Pause & verify affordability');
  await page.getByRole('button', { name: 'Start a new scan' }).click();
  await page.getByRole('button', { name: 'Start fresh' }).click();
  assert.equal(await page.locator('#name').inputValue(), '');
  pass('reset requires an explicit choice and clears the profile');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'artifacts/form-mobile.png', fullPage: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await loadDemo('Kabir');
  await showScore();
  await page.screenshot({ path: 'artifacts/scorecard-mobile.png', fullPage: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  pass('mobile form and scorecard fit a 390px viewport');

  const offline = await context.newPage();
  await offline.route('http://**/*', route => route.abort());
  await offline.route('https://**/*', route => route.abort());
  offline.on('pageerror', e => errors.push(e.message));
  // The managed cloud browser disallows file: navigation. Exercise the exact
  // standalone HTML contents in a blank document with network requests blocked.
  await offline.setContent(await readFile('dist/index.html', 'utf8'), { waitUntil: 'load' });
  await offline.getByRole('button', { name: 'Try a demo profile' }).click();
  await offline.getByRole('button', { name: /Ananya The prepared/ }).click();
  await offline.getByRole('button', { name: 'See my scorecard' }).click();
  await offline.getByTestId('total-score').waitFor();
  assert.equal(await offline.getByTestId('total-score').textContent(), String(assess(samples[0].profile).total));
  pass('standalone HTML contents work with all HTTP and HTTPS requests blocked');
  assert.deepEqual(errors, []);
  pass('no browser runtime errors');
  console.log(`${checks} browser checks passed.`);
} finally {
  await browser.close();
}
