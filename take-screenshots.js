const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log('Navigating to login...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
  
  await page.type('input[type="email"]', 'admin@demo.com');
  await page.type('input[type="password"]', '123456');
  await page.click('button[type="submit"]');
  
  console.log('Waiting for login to complete...');
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  
  // Dashboard
  console.log('Capturing dashboard...');
  await page.screenshot({ path: 'dashboard.png' });
  
  // Pacientes
  console.log('Navigating to pacientes...');
  await page.goto('http://localhost:3000/pacientes', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'pacientes.png' });
  
  // Agenda
  console.log('Navigating to agenda...');
  await page.goto('http://localhost:3000/agenda', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'agenda.png' });

  // Reportes
  console.log('Navigating to reportes...');
  await page.goto('http://localhost:3000/reportes', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: 'reportes.png' });

  await browser.close();
  console.log('Screenshots captured successfully.');
})();
