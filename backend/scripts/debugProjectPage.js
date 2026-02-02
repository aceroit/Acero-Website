/**
 * Debug script to see the project detail page structure
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function debug() {
    console.log('Starting debug...');
    
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    try {
        const url = 'https://acero.ae/projects/chemical-warehouse-ng-a0878';
        console.log(`\nLoading: ${url}`);
        
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
        await new Promise(r => setTimeout(r, 3000));
        
        // Get the page text structure
        const textContent = await page.evaluate(() => {
            return document.body.innerText;
        });
        
        console.log('\n=== PAGE TEXT CONTENT ===');
        console.log(textContent);
        console.log('\n=========================\n');
        
        // Look specifically for Project Details section
        const details = await page.evaluate(() => {
            const text = document.body.innerText;
            
            // Find the Project Details section
            const pdIndex = text.indexOf('Project Details');
            if (pdIndex >= 0) {
                // Get text after "Project Details" for about 500 chars
                return text.substring(pdIndex, pdIndex + 500);
            }
            return 'Project Details section not found';
        });
        
        console.log('=== PROJECT DETAILS SECTION ===');
        console.log(details);
        console.log('================================\n');
        
        // Try to extract using improved regex
        const extracted = await page.evaluate(() => {
            const text = document.body.innerText;
            const result = {};
            
            // Find Project Details section and parse it
            const pdIndex = text.indexOf('Project Details');
            if (pdIndex >= 0) {
                const section = text.substring(pdIndex, pdIndex + 500);
                const lines = section.split('\n').map(l => l.trim()).filter(l => l);
                
                console.log('Lines:', lines);
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const nextLine = lines[i + 1] || '';
                    
                    if (line === 'Region' && nextLine) {
                        result.region = nextLine;
                    } else if (line === 'Country' && nextLine) {
                        result.country = nextLine;
                    } else if (line === 'Industry' && nextLine) {
                        result.industry = nextLine;
                    } else if (line === 'Building type' && nextLine) {
                        result.buildingType = nextLine;
                    }
                }
            }
            
            return result;
        });
        
        console.log('=== EXTRACTED DATA ===');
        console.log(JSON.stringify(extracted, null, 2));
        console.log('======================\n');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
    
    await browser.close();
    console.log('Debug complete!');
}

debug();
