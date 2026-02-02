/**
 * Process Project Images Script
 * 
 * This script processes the scraped-projects.json file to:
 * 1. Remove the logo image from all projects
 * 2. Download all unique images to public folder organized by industry/buildingType
 * 3. Upload to Cloudinary
 * 4. Update the JSON with Cloudinary links
 * 
 * Usage: node scripts/processProjectImages.js
 * 
 * Options:
 *   --remove-logo-only    Only remove logo images without downloading/uploading
 *   --download-only       Only download images without uploading to Cloudinary
 *   --skip-download       Skip download, only upload existing images to Cloudinary
 *   --dry-run             Show what would be done without making changes
 */

const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.CLOUD_NAME) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
}

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

// Parse command line arguments
const args = process.argv.slice(2);
const REMOVE_LOGO_ONLY = args.includes('--remove-logo-only');
const DOWNLOAD_ONLY = args.includes('--download-only');
const SKIP_DOWNLOAD = args.includes('--skip-download');
const DRY_RUN = args.includes('--dry-run');

// Paths
const SCRAPED_DATA_PATH = path.join(__dirname, 'scraped-projects.json');
const OUTPUT_PATH = path.join(__dirname, 'scraped-projects-processed.json');
const PUBLIC_IMAGES_PATH = path.join(__dirname, '..', '..', 'frontend', 'public', 'images', 'scraped-projects');

// Logo image to remove (the URL contains this filename)
const LOGO_FILENAME = 'ShrA6hToinWEqMmV0Pd6Nui99JbY4nHzJtN5PVNA.png';

// Helper function to generate slug
function generateSlug(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Helper function to get filename from URL
function getFilenameFromUrl(url) {
    const urlPath = new URL(url).pathname;
    return path.basename(urlPath);
}

// Helper function to check if URL is the logo
function isLogoImage(url) {
    return url && url.includes(LOGO_FILENAME);
}

// Helper function to download a file
function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        
        // Create directory if it doesn't exist
        const dir = path.dirname(destPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Skip if file already exists
        if (fs.existsSync(destPath)) {
            console.log(`   Already exists: ${path.basename(destPath)}`);
            resolve(destPath);
            return;
        }
        
        const file = fs.createWriteStream(destPath);
        
        protocol.get(url, (response) => {
            // Handle redirects
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                file.close();
                fs.unlinkSync(destPath);
                downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
                return;
            }
            
            if (response.statusCode !== 200) {
                file.close();
                fs.unlinkSync(destPath);
                reject(new Error(`HTTP ${response.statusCode}`));
                return;
            }
            
            response.pipe(file);
            
            file.on('finish', () => {
                file.close();
                resolve(destPath);
            });
        }).on('error', (err) => {
            fs.unlink(destPath, () => {}); // Delete partial file
            reject(err);
        });
    });
}

// Helper function to upload to Cloudinary
async function uploadToCloudinary(localPath, publicId, folder) {
    try {
        const result = await cloudinary.uploader.upload(localPath, {
            public_id: publicId,
            folder: folder,
            resource_type: 'image',
            overwrite: true,
        });
        return {
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
        };
    } catch (error) {
        console.error(`   Error uploading ${localPath}:`, error.message);
        throw error;
    }
}

// Main processor class
class ProjectImagesProcessor {
    constructor() {
        this.stats = {
            logoRemoved: 0,
            imagesDownloaded: 0,
            imagesUploaded: 0,
            imagesFailed: 0,
            projectsProcessed: 0,
        };
        this.imageMap = new Map(); // Map original URL to Cloudinary URL
        this.downloadedImages = new Map(); // Map original URL to local path
    }
    
    // Load scraped data
    loadScrapedData() {
        if (!fs.existsSync(SCRAPED_DATA_PATH)) {
            throw new Error(`Scraped data file not found: ${SCRAPED_DATA_PATH}`);
        }
        
        const data = JSON.parse(fs.readFileSync(SCRAPED_DATA_PATH, 'utf8'));
        console.log('Loaded scraped data:');
        console.log(`  - Industries: ${data.industries?.length || 0}`);
        
        let totalProjects = 0;
        let totalImages = 0;
        
        for (const industry of data.industries || []) {
            totalProjects += industry.projects?.length || 0;
            for (const project of industry.projects || []) {
                totalImages += (project.projectImages?.length || 0) + (project.thumbnailImage ? 1 : 0);
            }
        }
        
        console.log(`  - Total Projects: ${totalProjects}`);
        console.log(`  - Total Images: ${totalImages}\n`);
        
        return data;
    }
    
    // Remove logo images from all projects
    removeLogoImages(data) {
        console.log('1. Removing logo images...\n');
        
        for (const industry of data.industries || []) {
            for (const project of industry.projects || []) {
                // Remove from projectImages array
                if (project.projectImages) {
                    const originalLength = project.projectImages.length;
                    project.projectImages = project.projectImages.filter(url => !isLogoImage(url));
                    const removed = originalLength - project.projectImages.length;
                    this.stats.logoRemoved += removed;
                }
                
                // Check thumbnail
                if (project.thumbnailImage && isLogoImage(project.thumbnailImage)) {
                    // Replace with first project image if available
                    if (project.projectImages && project.projectImages.length > 0) {
                        project.thumbnailImage = project.projectImages[0];
                    } else {
                        project.thumbnailImage = null;
                    }
                    this.stats.logoRemoved++;
                }
            }
        }
        
        console.log(`   Removed ${this.stats.logoRemoved} logo images\n`);
        return data;
    }
    
    // Collect all unique images
    collectUniqueImages(data) {
        const images = new Map(); // url -> { industry, buildingType, project }
        
        for (const industry of data.industries || []) {
            // Industry image
            if (industry.image && !isLogoImage(industry.image)) {
                images.set(industry.image, {
                    type: 'industry',
                    industry: industry.name,
                    buildingType: null,
                    project: null,
                });
            }
            
            for (const project of industry.projects || []) {
                // Thumbnail
                if (project.thumbnailImage && !isLogoImage(project.thumbnailImage)) {
                    images.set(project.thumbnailImage, {
                        type: 'thumbnail',
                        industry: industry.name,
                        buildingType: project.buildingType,
                        project: project.jobNumber,
                    });
                }
                
                // Project images
                for (const imgUrl of project.projectImages || []) {
                    if (!isLogoImage(imgUrl)) {
                        images.set(imgUrl, {
                            type: 'project',
                            industry: industry.name,
                            buildingType: project.buildingType,
                            project: project.jobNumber,
                        });
                    }
                }
            }
        }
        
        return images;
    }
    
    // Download all images
    async downloadImages(uniqueImages) {
        console.log(`2. Downloading ${uniqueImages.size} unique images...\n`);
        
        let count = 0;
        const total = uniqueImages.size;
        
        for (const [url, info] of uniqueImages) {
            count++;
            
            try {
                const filename = getFilenameFromUrl(url);
                const industrySlug = generateSlug(info.industry || 'other');
                const buildingTypeSlug = info.buildingType ? generateSlug(info.buildingType) : 'general';
                
                const localDir = path.join(PUBLIC_IMAGES_PATH, industrySlug, buildingTypeSlug);
                const localPath = path.join(localDir, filename);
                
                if (DRY_RUN) {
                    console.log(`   [${count}/${total}] Would download: ${filename}`);
                    this.downloadedImages.set(url, localPath);
                } else {
                    console.log(`   [${count}/${total}] Downloading: ${filename}`);
                    await downloadFile(url, localPath);
                    this.downloadedImages.set(url, localPath);
                    this.stats.imagesDownloaded++;
                }
            } catch (error) {
                console.error(`   [${count}/${total}] Failed: ${url.substring(0, 50)}... - ${error.message}`);
                this.stats.imagesFailed++;
            }
            
            // Small delay to avoid overwhelming the server
            if (!DRY_RUN) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        console.log(`\n   Downloaded: ${this.stats.imagesDownloaded}, Failed: ${this.stats.imagesFailed}\n`);
    }
    
    // Upload all images to Cloudinary
    async uploadToCloudinary(uniqueImages) {
        console.log(`3. Uploading ${uniqueImages.size} images to Cloudinary...\n`);
        
        if (!process.env.CLOUD_NAME || !process.env.API_KEY || !process.env.API_SECRET) {
            throw new Error('Cloudinary credentials not configured. Please set CLOUD_NAME, API_KEY, and API_SECRET in .env');
        }
        
        const mediaFolder = process.env.MEDIA_FOLDER_PREFIX || 'acero-cms';
        let count = 0;
        const total = uniqueImages.size;
        
        for (const [url, info] of uniqueImages) {
            count++;
            
            const localPath = this.downloadedImages.get(url);
            
            if (!localPath) {
                console.error(`   [${count}/${total}] No local file for: ${url.substring(0, 50)}...`);
                this.stats.imagesFailed++;
                continue;
            }
            
            if (!DRY_RUN && !fs.existsSync(localPath)) {
                console.error(`   [${count}/${total}] File not found: ${localPath}`);
                this.stats.imagesFailed++;
                continue;
            }
            
            try {
                const filename = path.basename(localPath, path.extname(localPath));
                const industrySlug = generateSlug(info.industry || 'other');
                const buildingTypeSlug = info.buildingType ? generateSlug(info.buildingType) : 'general';
                
                const folder = `${mediaFolder}/projects/${industrySlug}/${buildingTypeSlug}`;
                const publicId = filename;
                
                if (DRY_RUN) {
                    console.log(`   [${count}/${total}] Would upload: ${filename} to ${folder}`);
                    // Mock Cloudinary URL for dry run
                    this.imageMap.set(url, {
                        url: `https://res.cloudinary.com/demo/image/upload/${folder}/${publicId}.png`,
                        publicId: `${folder}/${publicId}`,
                        width: 800,
                        height: 600,
                    });
                } else {
                    console.log(`   [${count}/${total}] Uploading: ${filename}`);
                    const result = await uploadToCloudinary(localPath, publicId, folder);
                    this.imageMap.set(url, result);
                    this.stats.imagesUploaded++;
                }
            } catch (error) {
                console.error(`   [${count}/${total}] Failed to upload: ${error.message}`);
                this.stats.imagesFailed++;
            }
            
            // Rate limiting for Cloudinary
            if (!DRY_RUN) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
        
        console.log(`\n   Uploaded: ${this.stats.imagesUploaded}, Failed: ${this.stats.imagesFailed}\n`);
    }
    
    // Update JSON with Cloudinary URLs
    updateJsonWithCloudinaryUrls(data) {
        console.log('4. Updating JSON with Cloudinary URLs...\n');
        
        for (const industry of data.industries || []) {
            // Update industry image
            if (industry.image) {
                const cloudinaryData = this.imageMap.get(industry.image);
                if (cloudinaryData) {
                    industry.image = cloudinaryData.url;
                    industry.imageData = cloudinaryData;
                }
            }
            
            for (const project of industry.projects || []) {
                this.stats.projectsProcessed++;
                
                // Update thumbnail
                if (project.thumbnailImage) {
                    const cloudinaryData = this.imageMap.get(project.thumbnailImage);
                    if (cloudinaryData) {
                        project.thumbnailImage = cloudinaryData.url;
                        project.thumbnailImageData = cloudinaryData;
                    }
                }
                
                // Update project images
                if (project.projectImages) {
                    project.projectImages = project.projectImages.map(url => {
                        const cloudinaryData = this.imageMap.get(url);
                        return cloudinaryData ? cloudinaryData.url : url;
                    });
                    
                    // Also store full image data
                    project.projectImagesData = project.projectImages.map(url => {
                        // Find the original URL that mapped to this Cloudinary URL
                        for (const [origUrl, data] of this.imageMap) {
                            if (data.url === url) {
                                return data;
                            }
                        }
                        return { url };
                    });
                }
            }
        }
        
        console.log(`   Updated ${this.stats.projectsProcessed} projects\n`);
        return data;
    }
    
    // Save processed data
    saveProcessedData(data) {
        data.processedAt = new Date().toISOString();
        data.processingStats = this.stats;
        
        if (!DRY_RUN) {
            fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2));
            console.log(`Saved processed data to: ${OUTPUT_PATH}`);
        } else {
            console.log(`Would save processed data to: ${OUTPUT_PATH}`);
        }
    }
    
    // Main process function
    async process() {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('      PROJECT IMAGES PROCESSOR');
        console.log('═══════════════════════════════════════════════════════════');
        
        if (DRY_RUN) {
            console.log('🔍 DRY RUN MODE - No changes will be made\n');
        }
        
        try {
            // Load data
            let data = this.loadScrapedData();
            
            // Step 1: Remove logo images
            data = this.removeLogoImages(data);
            
            if (REMOVE_LOGO_ONLY) {
                this.saveProcessedData(data);
                this.printSummary();
                return;
            }
            
            // Collect unique images
            const uniqueImages = this.collectUniqueImages(data);
            console.log(`Found ${uniqueImages.size} unique images to process\n`);
            
            // Step 2: Download images
            if (!SKIP_DOWNLOAD) {
                await this.downloadImages(uniqueImages);
            } else {
                // Load existing downloaded images
                console.log('Skipping download, loading existing images...\n');
                for (const [url, info] of uniqueImages) {
                    const filename = getFilenameFromUrl(url);
                    const industrySlug = generateSlug(info.industry || 'other');
                    const buildingTypeSlug = info.buildingType ? generateSlug(info.buildingType) : 'general';
                    const localPath = path.join(PUBLIC_IMAGES_PATH, industrySlug, buildingTypeSlug, filename);
                    if (fs.existsSync(localPath)) {
                        this.downloadedImages.set(url, localPath);
                    }
                }
                console.log(`Found ${this.downloadedImages.size} existing images\n`);
            }
            
            if (DOWNLOAD_ONLY) {
                this.saveProcessedData(data);
                this.printSummary();
                return;
            }
            
            // Step 3: Upload to Cloudinary
            await this.uploadToCloudinary(uniqueImages);
            
            // Step 4: Update JSON with Cloudinary URLs
            data = this.updateJsonWithCloudinaryUrls(data);
            
            // Save processed data
            this.saveProcessedData(data);
            
            this.printSummary();
            
        } catch (error) {
            console.error('\n❌ Fatal error:', error.message);
            console.error(error.stack);
            process.exit(1);
        }
    }
    
    printSummary() {
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('      PROCESSING SUMMARY');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`Logo Images Removed:    ${this.stats.logoRemoved}`);
        console.log(`Images Downloaded:      ${this.stats.imagesDownloaded}`);
        console.log(`Images Uploaded:        ${this.stats.imagesUploaded}`);
        console.log(`Images Failed:          ${this.stats.imagesFailed}`);
        console.log(`Projects Processed:     ${this.stats.projectsProcessed}`);
        console.log('═══════════════════════════════════════════════════════════');
        
        if (DRY_RUN) {
            console.log('\n🔍 This was a DRY RUN. No changes were made.');
            console.log('   Run without --dry-run to apply changes.');
        } else {
            console.log('\n✅ Processing completed!');
            console.log(`\n📝 Output file: ${OUTPUT_PATH}`);
            if (!REMOVE_LOGO_ONLY && !DOWNLOAD_ONLY) {
                console.log('\n📌 Next steps:');
                console.log('   1. Review the processed JSON file');
                console.log('   2. Run the seeder with: npm run seed:scraped-projects');
            }
        }
    }
}

// Run processor
const processor = new ProjectImagesProcessor();
processor.process().catch(console.error);
