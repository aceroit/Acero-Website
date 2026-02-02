/**
 * Update Project Details Script
 * 
 * This script re-scrapes the project detail pages to get the correct
 * Region, Country, Industry, and Building Type values that were missed
 * in the initial scrape.
 * 
 * Usage: node scripts/updateProjectDetails.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCRAPED_DATA_PATH = path.join(__dirname, 'scraped-projects.json');
const REQUEST_DELAY = 1500;
const PAGE_LOAD_TIMEOUT = 60000;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class ProjectDetailsUpdater {
    constructor() {
        this.browser = null;
        this.page = null;
        this.stats = {
            total: 0,
            updated: 0,
            errors: 0
        };
    }

    async init() {
        console.log('🚀 Initializing browser...');
        
        const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        
        this.browser = await puppeteer.launch({
            headless: true,
            executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1920, height: 1080 });
        await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
        
        // Block unnecessary resources
        await this.page.setRequestInterception(true);
        this.page.on('request', (req) => {
            if (['stylesheet', 'font', 'image'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });
    }

    async close() {
        if (this.browser) await this.browser.close();
    }

    async scrapeProjectDetails(url) {
        try {
            await this.page.goto(url, { 
                waitUntil: 'networkidle0',
                timeout: PAGE_LOAD_TIMEOUT 
            });
            
            // Wait for content
            await delay(2000);
            
            // Extract project details - parse the Project Details section by lines
            const details = await this.page.evaluate(() => {
                const text = document.body.innerText;
                const result = {
                    region: null,
                    country: null,
                    industry: null,
                    buildingType: null,
                    area: null
                };
                
                // Find Project Details section and parse it
                const pdIndex = text.indexOf('Project Details');
                if (pdIndex >= 0) {
                    const section = text.substring(pdIndex, pdIndex + 500);
                    const lines = section.split('\n').map(l => l.trim()).filter(l => l);
                    
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i];
                        const nextLine = lines[i + 1] || '';
                        
                        if (line === 'Region' && nextLine && !nextLine.includes('Select')) {
                            result.region = nextLine;
                        } else if (line === 'Country' && nextLine && !nextLine.includes('Select')) {
                            result.country = nextLine;
                        } else if (line === 'Industry' && nextLine && !nextLine.includes('Select')) {
                            result.industry = nextLine;
                        } else if (line === 'Building type' && nextLine && !nextLine.includes('Select')) {
                            result.buildingType = nextLine;
                        } else if (line === 'Area' && nextLine && !nextLine.includes('Select')) {
                            result.area = nextLine;
                        }
                    }
                }
                
                return result;
            });
            
            return details;
            
        } catch (error) {
            console.error(`   ✗ Error: ${error.message}`);
            return null;
        }
    }

    async run() {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('      UPDATE PROJECT DETAILS');
        console.log('═══════════════════════════════════════════════════════════\n');
        
        // Load existing data
        if (!fs.existsSync(SCRAPED_DATA_PATH)) {
            throw new Error('scraped-projects.json not found. Run scraper first.');
        }
        
        const data = JSON.parse(fs.readFileSync(SCRAPED_DATA_PATH, 'utf8'));
        console.log(`Loaded ${data.industries.length} industries\n`);
        
        await this.init();
        
        try {
            for (let i = 0; i < data.industries.length; i++) {
                const industry = data.industries[i];
                console.log(`[${i + 1}/${data.industries.length}] ${industry.name} (${industry.projects.length} projects)`);
                
                for (let j = 0; j < industry.projects.length; j++) {
                    const project = industry.projects[j];
                    this.stats.total++;
                    
                    // Check if we need to update this project
                    const needsUpdate = !project.country || 
                                       project.country === 'Select Country' ||
                                       project.country === 'Unknown' ||
                                       !project.region ||
                                       project.region === 'Select Region';
                    
                    if (!needsUpdate) {
                        continue;
                    }
                    
                    console.log(`   [${j + 1}/${industry.projects.length}] ${project.buildingType}...`);
                    
                    const details = await this.scrapeProjectDetails(project.url);
                    await delay(REQUEST_DELAY);
                    
                    if (details) {
                        // Update project with new details
                        if (details.region) project.region = details.region;
                        if (details.country) project.country = details.country;
                        if (details.industry) project.industry = details.industry;
                        if (details.buildingType) project.buildingType = details.buildingType;
                        if (details.area) project.area = details.area;
                        
                        this.stats.updated++;
                        console.log(`      ✓ ${details.country || 'Unknown'}, ${details.region || 'Unknown'}`);
                    } else {
                        this.stats.errors++;
                    }
                }
                
                // Save after each industry
                fs.writeFileSync(SCRAPED_DATA_PATH, JSON.stringify(data, null, 2));
            }
            
            // Final save
            data.updatedAt = new Date().toISOString();
            fs.writeFileSync(SCRAPED_DATA_PATH, JSON.stringify(data, null, 2));
            
            console.log('\n═══════════════════════════════════════════════════════════');
            console.log('      UPDATE SUMMARY');
            console.log('═══════════════════════════════════════════════════════════');
            console.log(`Total projects:    ${this.stats.total}`);
            console.log(`Updated:           ${this.stats.updated}`);
            console.log(`Errors:            ${this.stats.errors}`);
            console.log('═══════════════════════════════════════════════════════════');
            console.log('\n✅ Update completed!');
            
        } finally {
            await this.close();
        }
    }
}

const updater = new ProjectDetailsUpdater();
updater.run().catch(console.error);
