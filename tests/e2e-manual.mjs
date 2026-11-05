import { chromium } from '@playwright/test';

async function runVerification() {
  console.log('Starting Playwright End-to-End Verification...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 1. VERIFY HOMEPAGE & NAVBAR
  console.log('\n--- 1. Testing Homepage & Navbar ---');
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');

  // Verify Issue 1: No stray text fragment below navbar
  const skipLinkExists = await page.$('.mc-skip-link');
  console.log('Skip link element exists:', !!skipLinkExists, '(Expected: false)');
  if (skipLinkExists) throw new Error('Unwanted .mc-skip-link element still exists!');

  const pageText = await page.evaluate(() => document.body.innerText);
  console.log('Page text contains "Skip to content":', pageText.includes('Skip to content'), '(Expected: false)');
  if (pageText.includes('Skip to content')) throw new Error('Stray "Skip to content" text found!');

  // Verify Issue 2: Exactly 6 primary elements
  console.log('\n--- 2. Testing 6 Primary Navbar Elements ---');
  const navMenuButtons = await page.$$eval('nav[aria-label="Primary Navigation"] button', btns =>
    btns.map(b => b.innerText.trim())
  );
  console.log('Primary Menu Buttons:', navMenuButtons);
  if (navMenuButtons.length !== 3) throw new Error(`Expected exactly 3 primary menu buttons, found ${navMenuButtons.length}`);
  if (!navMenuButtons.includes('Care at DeltaCare')) throw new Error('Missing "Care at DeltaCare"');
  if (!navMenuButtons.includes('Health Library')) throw new Error('Missing "Health Library"');
  if (!navMenuButtons.includes('Departments and Specialists')) throw new Error('Missing "Departments and Specialists"');

  // Check Dropdown 1: Care at DeltaCare
  await page.click('button:has-text("Care at DeltaCare")');
  await page.waitForTimeout(300);
  const careLinks = await page.$$eval('div[role="region"] a', links => links.map(l => l.innerText.trim()));
  console.log('Care at DeltaCare items found:');
  const expectedCare = ['Patient-Centred Care', 'About DeltaCare', 'Request Appointment', 'Locations', 'Contact Us'];
  for (const exp of expectedCare) {
    const found = careLinks.some(l => l.includes(exp));
    console.log(`  ✓ ${exp}: ${found}`);
    if (!found) throw new Error(`Missing item in Care at DeltaCare dropdown: ${exp}`);
  }

  // Check Dropdown 2: Health Library
  await page.click('button:has-text("Health Library")');
  await page.waitForTimeout(300);
  const libLinks = await page.$$eval('div[role="region"] a', links => links.map(l => l.innerText.trim()));
  console.log('Health Library items found:');
  const expectedLib = ['Diseases and Conditions', 'Symptoms', 'Tests and Procedures', 'Drugs and Supplements'];
  for (const exp of expectedLib) {
    const found = libLinks.some(l => l.includes(exp));
    console.log(`  ✓ ${exp}: ${found}`);
    if (!found) throw new Error(`Missing item in Health Library dropdown: ${exp}`);
  }

  // Check Dropdown 3: Departments and Specialists
  await page.click('button:has-text("Departments and Specialists")');
  await page.waitForTimeout(300);
  const deptLinks = await page.$$eval('div[role="region"] a', links => links.map(l => l.innerText.trim()));
  console.log('Departments and Specialists items found:');
  const expectedDept = ['All Clinical Departments', 'Verified Specialists'];
  for (const exp of expectedDept) {
    const found = deptLinks.some(l => l.includes(exp));
    console.log(`  ✓ ${exp}: ${found}`);
    if (!found) throw new Error(`Missing item in Departments and Specialists dropdown: ${exp}`);
  }

  // Close dropdown by clicking outside
  await page.mouse.click(10, 10);
  await page.waitForTimeout(300);
  const dropdownVisible = await page.$('div[role="region"]');
  console.log('Dropdown closed on outside click:', !dropdownVisible);

  // Check Element 4: Register / Log in
  const authLink = await page.$('a[href="/login"]:has-text("Register / Log in")');
  console.log('Register / Log in link exists:', !!authLink);
  if (!authLink) throw new Error('Missing Register / Log in link');

  // Check Element 5: Bangla / English Language Switcher
  const langBtn = await page.$('button[aria-label="Toggle language between English and Bangla"]');
  console.log('Language switcher exists:', !!langBtn);
  if (!langBtn) throw new Error('Missing Language switcher');
  await langBtn.click();
  await page.waitForTimeout(300);
  const isBangla = await page.evaluate(() => document.body.innerText.includes('ডেল্টাকেয়ারে সেবা'));
  console.log('Switched to Bangla successfully:', isBangla);
  // Switch back to English
  await langBtn.click();
  await page.waitForTimeout(300);

  // Check Element 6: Search
  const searchBtn = await page.$('button[aria-label="Search"]');
  console.log('Search button exists:', !!searchBtn);
  await searchBtn.click();
  await page.waitForTimeout(300);
  const searchInput = await page.$('#header-global-search');
  console.log('Search input opened:', !!searchInput);
  if (!searchInput) throw new Error('Search drawer did not open');
  await searchInput.fill('Cardiology');
  await page.waitForTimeout(500);
  const searchResults = await page.$$eval('div.divide-y a', items => items.map(i => i.innerText.trim()));
  console.log('Search returned live results:', searchResults.length > 0);
  await page.click('button[aria-label="Close search"]');
  await page.waitForTimeout(300);

  // 3. VERIFY HERO BUTTON (ISSUE 3)
  console.log('\n--- 3. Testing Hero Prominent Request Appointment Button ---');
  const heroBtn = await page.$('section[aria-label="Hero Banner"] a[href="/request-appointment"]');
  console.log('Hero Request Appointment button exists:', !!heroBtn);
  if (!heroBtn) throw new Error('Hero Request Appointment button missing!');
  const heroBtnClass = await heroBtn.getAttribute('class');
  console.log('Hero button classes:', heroBtnClass);
  const isButtonStyled = heroBtnClass.includes('rounded-full') && heroBtnClass.includes('bg-[#0057b8]');
  console.log('Hero button has proper button shape and background:', isButtonStyled);
  if (!isButtonStyled) throw new Error('Hero Request Appointment link is not styled as a button!');

  // Click Hero Button -> Must navigate to /request-appointment
  await heroBtn.click();
  await page.waitForURL('**/request-appointment');
  console.log('Navigated to landing page:', page.url());

  // 4. VERIFY APPOINTMENT LANDING PAGE (ISSUE 5)
  console.log('\n--- 4. Testing Appointment Landing Page (/request-appointment) ---');
  const heading = await page.$eval('h1', el => el.innerText.trim());
  console.log('Landing page heading:', heading);
  if (heading !== 'Start your appointment request here.') {
    throw new Error(`Unexpected heading: "${heading}"`);
  }

  const subtext = await page.$eval('main p', el => el.innerText.trim());
  console.log('Landing page subtext:', subtext);
  if (!subtext.includes('easiest way to reach us')) {
    throw new Error(`Unexpected subtext: "${subtext}"`);
  }

  const newPatientCard = await page.$('a[href*="/register?redirect="]');
  const returningPatientCard = await page.$('a[href*="/login?redirect="]');
  console.log('New Patients card exists:', !!newPatientCard);
  console.log('Returning Patients card exists:', !!returningPatientCard);
  if (!newPatientCard || !returningPatientCard) throw new Error('Patient selection rows missing!');

  // Test Returning Patient Login Flow
  console.log('\n--- 5. Testing Returning Patient Flow: Landing -> Login -> Form ---');
  await returningPatientCard.click();
  await page.waitForURL(url => url.pathname === '/login' && url.searchParams.get('redirect') === '/request-appointment/form');
  console.log('Navigated to login with redirect param:', page.url());

  // Fill credentials for demo patient
  await page.fill('#login-email', 'patient@deltacare.bd');
  await page.fill('#login-password', 'DeltaCare#2026');
  await page.click('button[type="submit"]');

  // Must redirect automatically to /request-appointment/form
  await page.waitForURL(url => url.pathname === '/request-appointment/form', { timeout: 10000 });
  console.log('Redirected after login to:', page.url());

  // 5. VERIFY APPOINTMENT FORM & SUBMISSION
  console.log('\n--- 6. Testing Appointment Form & End-to-End Submission ---');
  const formHeading = await page.$eval('h1', el => el.innerText.trim());
  console.log('Form heading:', formHeading);
  if (!formHeading.includes('Appointment Request Form')) {
    throw new Error('Appointment Form did not load properly!');
  }

  // Verify patient info pre-populated
  const nameVal = await page.$eval('#apt-name', el => el.value);
  const emailVal = await page.$eval('#apt-email', el => el.value);
  console.log('Pre-populated Patient Name:', nameVal);
  console.log('Pre-populated Patient Email:', emailVal);
  if (!emailVal.includes('patient@deltacare.bd')) {
    throw new Error(`Patient email not pre-populated! Got: ${emailVal}`);
  }

  // Pick an available date with open slots
  await page.fill('#apt-date', '2026-11-15');
  await page.waitForTimeout(500);

  // Check consent checkbox and submit
  await page.check('input[type="checkbox"]');
  await page.click('button[type="submit"]');

  // Verify confirmation view
  await page.waitForSelector('text=Appointment Request Submitted Successfully', { timeout: 10000 });
  const refCode = await page.$eval('p.font-mono', el => el.innerText.trim());
  console.log('Appointment persisted! Generated reference code:', refCode);
  if (!refCode || !refCode.startsWith('DC-')) {
    throw new Error(`Invalid reference code received: ${refCode}`);
  }

  // 6. VERIFY NEW PATIENT WORKFLOW (Landing -> Register -> Form -> Submit)
  console.log('\n--- 7. Testing New Patient Flow: Landing -> Register -> Form ---');
  const context2 = await browser.newContext();
  const page2 = await context2.newPage({ viewport: { width: 1440, height: 900 } });
  await page2.goto('http://localhost:3000/request-appointment');
  const newPatCard = await page2.$('a[href*="/register?redirect="]');
  await newPatCard.click();
  await page2.waitForURL(url => url.pathname === '/register' && url.searchParams.get('redirect') === '/request-appointment/form');
  console.log('Navigated to registration with redirect param:', page2.url());

  const testEmail = `newpatient_${Date.now()}@deltacare.bd`;
  await page2.fill('#reg-name', 'Nusrat Jahan');
  await page2.fill('#reg-email', testEmail);
  await page2.fill('#reg-phone', '01799887766');
  await page2.fill('#reg-password', 'DeltaCare#2026');
  await page2.check('input[type="checkbox"]');
  await page2.click('button[type="submit"]');

  // Must automatically redirect to /request-appointment/form
  await page2.waitForURL(url => url.pathname === '/request-appointment/form', { timeout: 10000 });
  console.log('Redirected after registration to:', page2.url());

  const prefilledEmail = await page2.$eval('#apt-email', el => el.value);
  console.log('Prefilled new patient email:', prefilledEmail);
  if (prefilledEmail !== testEmail) throw new Error('New patient email not prefilled!');

  // Pick an available date
  await page2.fill('#apt-date', '2026-11-16');
  await page2.waitForTimeout(500);

  await page2.check('input[type="checkbox"]');
  await page2.click('button[type="submit"]');
  await page2.waitForSelector('text=Appointment Request Submitted Successfully');
  const refCode2 = await page2.$eval('p.font-mono', el => el.innerText.trim());
  console.log('New patient appointment created! Reference:', refCode2);
  await context2.close();

  console.log('\n🎉 ALL E2E VERIFICATIONS (BOTH RETURNING & NEW PATIENT WORKFLOWS) PASSED SUCCESSFULLY!');
  await browser.close();
}

runVerification().catch(err => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
