/**
 * Debug script to see what's on the Acero website pages
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://acero.ae';

async function debug() {
    console.log('Starting debug...');
    
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    try {
        // Test the industrial page
        const url = `${BASE_URL}/projects?industry=industrial`;
        console.log(`\nLoading: ${url}`);
        
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        
        // Wait for content
        await new Promise(r => setTimeout(r, 5000));
        
        // Get all links
        const links = await page.evaluate(() => {
            const allLinks = [];
            document.querySelectorAll('a').forEach(a => {
                const href = a.getAttribute('href') || '';
                const text = a.textContent.trim().substring(0, 100);
                if (href.includes('project')) {
                    allLinks.push({ href, text });
                }
            });
            return allLinks;
        });
        
        console.log('\n=== Links containing "project" ===');
        links.forEach(l => console.log(`  ${l.href} -> "${l.text}"`));
        
        // Also try to find any clickable elements with project data
        const clickables = await page.evaluate(() => {
            const items = [];
            // Look for divs/sections that might be cards
            document.querySelectorAll('div, section, article').forEach(el => {
                const onclick = el.getAttribute('onclick') || '';
                const dataHref = el.getAttribute('data-href') || '';
                const role = el.getAttribute('role') || '';
                
                if (onclick.includes('project') || dataHref.includes('project')) {
                    items.push({ onclick, dataHref, role, text: el.textContent.substring(0, 50) });
                }
            });
            return items;
        });
        
        console.log('\n=== Clickable elements with project data ===');
        clickables.forEach(c => console.log(`  ${JSON.stringify(c)}`));
        
        // Save the page HTML for inspection
        const html = await page.content();
        const htmlPath = path.join(__dirname, 'debug-page.html');
        fs.writeFileSync(htmlPath, html);
        console.log(`\nPage HTML saved to: ${htmlPath}`);
        
        // Look for Next.js data
        const nextData = await page.evaluate(() => {
            const script = document.querySelector('#__NEXT_DATA__');
            if (script) {
                try {
                    return JSON.parse(script.textContent);
                } catch (e) {
                    return null;
                }
            }
            return null;
        });
        
        if (nextData) {
            console.log('\n=== Next.js Data Found! ===');
            const dataPath = path.join(__dirname, 'debug-nextdata.json');
            fs.writeFileSync(dataPath, JSON.stringify(nextData, null, 2));
            console.log(`Next.js data saved to: ${dataPath}`);
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
    
    await browser.close();
    console.log('\nDebug complete!');
}

debug();
