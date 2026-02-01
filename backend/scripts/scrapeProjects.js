/**
 * Scraper Script for Acero Projects
 * 
 * This script scrapes all project data from the old Acero website (https://acero.ae)
 * Structure:
 * 1. /projects/category - Lists all industries
 * 2. /projects?industry={slug} - Lists all building types/projects for an industry
 * 3. /projects/{buildingType-slug}-{jobNumber} - Project detail with images
 * 
 * Output: scraped-projects.json in the same directory
 * 
 * Usage: node scripts/scrapeProjects.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://acero.ae';
const PROJECTS_CATEGORY_URL = `${BASE_URL}/projects/category`;

// Rate limiting
const REQUEST_DELAY = 2000;
const PAGE_LOAD_TIMEOUT = 60000;

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to generate slug from text
function generateSlug(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Main scraper class
class AceroProjectScraper {
    constructor() {
        this.browser = null;
        this.page = null;
        this.data = {
            industries: [],
            scrapedAt: new Date().toISOString(),
            stats: {
                totalIndustries: 0,
                totalBuildingTypes: 0,
                totalProjects: 0,
                totalImages: 0,
                errors: []
            }
        };
    }

    async init() {
        console.log('🚀 Initializing browser...');
        
        // Try to find Chrome on macOS
        const possiblePaths = [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Chromium.app/Contents/MacOS/Chromium',
            process.env.PUPPETEER_EXECUTABLE_PATH
        ].filter(Boolean);
        
        let executablePath = null;
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                executablePath = p;
                console.log(`   Using Chrome at: ${p}`);
                break;
            }
        }
        
        this.browser = await puppeteer.launch({
            headless: true,
            executablePath: executablePath,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--no-zygote'
            ]
        });
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1920, height: 1080 });
        await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Enable request interception to block unnecessary resources
        await this.page.setRequestInterception(true);
        this.page.on('request', (req) => {
            const resourceType = req.resourceType();
            if (['stylesheet', 'font'].includes(resourceType)) {
                req.abort();
            } else {
                req.continue();
            }
        });
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    // Wait for Next.js hydration and content to load
    async waitForContent() {
        try {
            // Wait for Next.js to hydrate
            await this.page.waitForFunction(() => {
                return document.readyState === 'complete' && 
                       document.querySelectorAll('a').length > 10;
            }, { timeout: 15000 });
        } catch (e) {
            // Continue anyway
        }
        await delay(3000);
    }

    // Step 1: Scrape all industries from /projects/category
    async scrapeIndustries() {
        console.log('\n📂 Step 1: Scraping industries from /projects/category...');
        
        try {
            await this.page.goto(PROJECTS_CATEGORY_URL, { 
                waitUntil: 'networkidle0',
                timeout: PAGE_LOAD_TIMEOUT 
            });
            
            await this.waitForContent();
            
            // Get page content and parse it
            const industries = await this.page.evaluate(() => {
                const industriesData = [];
                const seenSlugs = new Set();
                
                // Find all links to industry pages
                document.querySelectorAll('a[href*="/projects?industry="]').forEach(link => {
                    const href = link.getAttribute('href') || '';
                    const match = href.match(/industry=([^&]+)/);
                    
                    if (match && !seenSlugs.has(match[1])) {
                        const slug = match[1];
                        seenSlugs.add(slug);
                        
                        // Get text content - look for the industry name
                        let name = '';
                        const textElements = link.querySelectorAll('*');
                        for (const el of textElements) {
                            const text = el.textContent.trim();
                            if (text && text.length > 2 && text.length < 50) {
                                name = text;
                                break;
                            }
                        }
                        
                        // Fallback: format slug as name
                        if (!name) {
                            name = slug.split('-').map(w => 
                                w.charAt(0).toUpperCase() + w.slice(1)
                            ).join(' ');
                        }
                        
                        // Get image
                        const img = link.querySelector('img');
                        const image = img ? img.src : null;
                        
                        industriesData.push({
                            name: name,
                            slug: slug,
                            image: image
                        });
                    }
                });
                
                return industriesData;
            });
            
            console.log(`   ✓ Found ${industries.length} industries`);
            industries.forEach(ind => console.log(`     - ${ind.name} (${ind.slug})`));
            
            this.data.stats.totalIndustries = industries.length;
            return industries;
            
        } catch (error) {
            console.error(`   ✗ Error scraping industries: ${error.message}`);
            this.data.stats.errors.push({ stage: 'industries', error: error.message });
            return [];
        }
    }

    // Step 2: Scrape all projects for an industry
    async scrapeProjectsForIndustry(industry) {
        console.log(`\n🏗️  Scraping projects for: ${industry.name}...`);
        
        try {
            const url = `${BASE_URL}/projects?industry=${industry.slug}`;
            await this.page.goto(url, { 
                waitUntil: 'networkidle0',
                timeout: PAGE_LOAD_TIMEOUT 
            });
            
            await this.waitForContent();
            
            // Scroll to load all lazy-loaded content
            await this.autoScroll();
            await delay(2000);
            
            // Extract project links and names
            const projects = await this.page.evaluate((baseUrl) => {
                const projectsData = [];
                const seenUrls = new Set();
                
                // Find all anchor tags
                document.querySelectorAll('a').forEach(link => {
                    const href = link.getAttribute('href') || '';
                    
                    // Check if it's a project link (absolute or relative)
                    // Match patterns like:
                    // https://acero.ae/projects/chemical-warehouse-ng-a0878
                    // /projects/chemical-warehouse-ng-a0878
                    const projectPattern = /(?:https?:\/\/[^\/]+)?\/projects\/([a-z0-9-]+)-([a-z]{2})-a(\d+)$/i;
                    const match = href.match(projectPattern);
                    
                    if (!match) return;
                    
                    // Skip category and other non-detail pages
                    if (href.includes('category') || href.includes('?')) return;
                    
                    // Normalize URL
                    const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
                    
                    if (seenUrls.has(fullUrl)) return;
                    seenUrls.add(fullUrl);
                    
                    // Extract job number from URL
                    const countryCode = match[2].toUpperCase();
                    const jobNum = match[3];
                    const jobNumber = `${countryCode}-A${jobNum}`;
                    
                    // Get the building type name from link text
                    let name = link.textContent.trim();
                    
                    // Clean up the name
                    if (name === 'Image' || !name || name.length < 3) {
                        // Try to get from child elements
                        const textEl = link.querySelector('h1, h2, h3, h4, h5, h6, p, span');
                        if (textEl) {
                            name = textEl.textContent.trim();
                        }
                    }
                    
                    // Last resort: extract from URL
                    if (!name || name === 'Image' || name.length < 3) {
                        // URL path like "chemical-warehouse-ng-a0878"
                        const urlPath = match[1]; // Just the building type part
                        name = urlPath.split('-').map(w => 
                            w.charAt(0).toUpperCase() + w.slice(1)
                        ).join(' ');
                    }
                    
                    // Get thumbnail image
                    const img = link.querySelector('img');
                    const thumbnail = img ? (img.src || img.dataset.src) : null;
                    
                    projectsData.push({
                        name: name,
                        jobNumber: jobNumber,
                        url: fullUrl,
                        thumbnailImage: thumbnail
                    });
                });
                
                return projectsData;
            }, BASE_URL);
            
            console.log(`   ✓ Found ${projects.length} projects`);
            this.data.stats.totalBuildingTypes += projects.length;
            
            return projects;
            
        } catch (error) {
            console.error(`   ✗ Error scraping projects for ${industry.name}: ${error.message}`);
            this.data.stats.errors.push({ 
                stage: 'projects', 
                industry: industry.name, 
                error: error.message 
            });
            return [];
        }
    }

    // Step 3: Scrape project details and images
    async scrapeProjectDetails(projectUrl, industryName) {
        try {
            await this.page.goto(projectUrl, { 
                waitUntil: 'networkidle0',
                timeout: PAGE_LOAD_TIMEOUT 
            });
            
            await this.waitForContent();
            
            // Extract project details
            const projectData = await this.page.evaluate(() => {
                const data = {
                    region: null,
                    country: null,
                    industry: null,
                    buildingType: null,
                    area: null,
                    images: []
                };
                
                // Get all text content
                const bodyText = document.body.innerText;
                
                // Parse project details using regex patterns
                // Region
                const regionMatch = bodyText.match(/Region\s*\n?\s*([A-Za-z\s]+?)(?=\n|Country|$)/i);
                if (regionMatch) data.region = regionMatch[1].trim();
                
                // Country  
                const countryMatch = bodyText.match(/Country\s*\n?\s*([A-Za-z\s']+?)(?=\n|Industry|$)/i);
                if (countryMatch) data.country = countryMatch[1].trim();
                
                // Industry
                const industryMatch = bodyText.match(/Industry\s*\n?\s*([A-Za-z\s&]+?)(?=\n|Building|$)/i);
                if (industryMatch) data.industry = industryMatch[1].trim();
                
                // Building type
                const buildingMatch = bodyText.match(/Building\s*type\s*\n?\s*([A-Za-z\s&]+?)(?=\n|Project|$)/i);
                if (buildingMatch) data.buildingType = buildingMatch[1].trim();
                
                // Extract all project images
                const images = new Set();
                document.querySelectorAll('img').forEach(img => {
                    const src = img.src || img.dataset.src || '';
                    
                    // Filter for actual project images
                    if (src && 
                        !src.includes('logo') && 
                        !src.includes('icon') &&
                        !src.includes('.svg') &&
                        !src.includes('favicon') &&
                        (src.includes('cloudinary') || 
                         src.includes('project') || 
                         src.includes('upload') ||
                         src.includes('image'))) {
                        
                        // Clean up cloudinary URLs to get full resolution
                        let cleanUrl = src;
                        if (src.includes('cloudinary')) {
                            // Remove width/height transformations for full quality
                            cleanUrl = src
                                .replace(/\/w_\d+,?/g, '/')
                                .replace(/\/h_\d+,?/g, '/')
                                .replace(/\/c_\w+,?/g, '/')
                                .replace(/\/f_\w+,?/g, '/')
                                .replace(/\/q_\w+,?/g, '/')
                                .replace(/\/\/+/g, '/');
                        }
                        
                        images.add(cleanUrl);
                    }
                });
                
                data.images = Array.from(images);
                
                return data;
            });
            
            // Extract job number from URL
            const jobMatch = projectUrl.match(/([a-z]{2}-a\d+)$/i);
            projectData.jobNumber = jobMatch ? jobMatch[1].toUpperCase() : null;
            projectData.url = projectUrl;
            
            // Use fallback for industry if not found
            if (!projectData.industry) {
                projectData.industry = industryName;
            }
            
            this.data.stats.totalImages += projectData.images.length;
            
            return projectData;
            
        } catch (error) {
            console.error(`   ✗ Error scraping ${projectUrl}: ${error.message}`);
            this.data.stats.errors.push({ 
                stage: 'projectDetails', 
                url: projectUrl, 
                error: error.message 
            });
            return null;
        }
    }

    // Auto scroll to trigger lazy loading
    async autoScroll() {
        await this.page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 400;
                const maxScrolls = 30;
                let scrollCount = 0;
                
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    scrollCount++;
                    
                    if (totalHeight >= scrollHeight || scrollCount >= maxScrolls) {
                        clearInterval(timer);
                        // Scroll back to top
                        window.scrollTo(0, 0);
                        resolve();
                    }
                }, 150);
            });
        });
    }

    // Main scraping function
    async scrape() {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('      ACERO PROJECTS SCRAPER');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`Started at: ${new Date().toISOString()}\n`);

        await this.init();

        try {
            // Step 1: Get all industries
            const industries = await this.scrapeIndustries();
            
            if (industries.length === 0) {
                console.log('No industries found. Exiting...');
                return;
            }

            // Step 2 & 3: For each industry, get projects and their details
            for (let i = 0; i < industries.length; i++) {
                const industry = industries[i];
                console.log(`\n[${i + 1}/${industries.length}] Processing industry: ${industry.name}`);
                
                const industryData = {
                    name: industry.name,
                    slug: industry.slug,
                    image: industry.image,
                    projects: []
                };
                
                // Get projects for this industry
                const projectLinks = await this.scrapeProjectsForIndustry(industry);
                await delay(REQUEST_DELAY);
                
                // Get details for each project
                for (let j = 0; j < projectLinks.length; j++) {
                    const proj = projectLinks[j];
                    console.log(`   [${j + 1}/${projectLinks.length}] Scraping: ${proj.name || proj.url}...`);
                    
                    const details = await this.scrapeProjectDetails(proj.url, industry.name);
                    await delay(REQUEST_DELAY);
                    
                    if (details) {
                        const project = {
                            jobNumber: details.jobNumber || proj.jobNumber,
                            buildingType: details.buildingType || proj.name,
                            region: details.region || 'Unknown',
                            area: details.area || 'Unknown',
                            country: details.country || 'Unknown',
                            industry: details.industry || industry.name,
                            thumbnailImage: proj.thumbnailImage,
                            projectImages: details.images,
                            url: proj.url
                        };
                        
                        industryData.projects.push(project);
                        this.data.stats.totalProjects++;
                        
                        console.log(`      ✓ ${project.buildingType} - ${project.country} (${project.projectImages.length} images)`);
                    }
                }
                
                this.data.industries.push(industryData);
                
                // Save intermediate results
                await this.saveData();
            }

            // Final save
            await this.saveData();
            
            // Print summary
            this.printSummary();
            
        } finally {
            await this.close();
        }
    }

    async saveData() {
        const outputPath = path.join(__dirname, 'scraped-projects.json');
        fs.writeFileSync(outputPath, JSON.stringify(this.data, null, 2));
    }

    printSummary() {
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('      SCRAPING SUMMARY');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`Total Industries:     ${this.data.stats.totalIndustries}`);
        console.log(`Total Projects:       ${this.data.stats.totalProjects}`);
        console.log(`Total Images:         ${this.data.stats.totalImages}`);
        console.log(`Errors:               ${this.data.stats.errors.length}`);
        console.log('═══════════════════════════════════════════════════════════');
        
        if (this.data.stats.errors.length > 0) {
            console.log('\nErrors encountered:');
            this.data.stats.errors.slice(0, 10).forEach(err => {
                console.log(`  - [${err.stage}] ${err.error}`);
            });
        }
        
        console.log(`\n💾 Data saved to: ${path.join(__dirname, 'scraped-projects.json')}`);
        console.log('\n✅ Scraping completed!');
        console.log('\nNext steps:');
        console.log('   1. Review the scraped data');
        console.log('   2. Run: npm run seed:scraped-projects:dry');
        console.log('   3. Run: npm run seed:scraped-projects');
    }
}

// Run the scraper
const scraper = new AceroProjectScraper();
scraper.scrape().catch(console.error);
