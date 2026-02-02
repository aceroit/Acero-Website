/**
 * Map Project Areas based on Country and Region
 * 
 * This script maps each project's area based on its country and region.
 * 
 * Areas available:
 * - Central Asia
 * - East Africa
 * - East Europe
 * - GCC (Gulf Cooperation Council)
 * - Middle East
 * - North Africa
 * - Oceania
 * - South Africa
 * - South America
 * - South Asia
 * - Western Africa
 * - Central Africa
 */

const fs = require('fs');
const path = require('path');

const SCRAPED_DATA_PATH = path.join(__dirname, 'scraped-projects.json');

// Country to Area mapping
const countryAreaMap = {
    // Africa - East Africa
    'Ethiopia': 'East Africa',
    'Kenya': 'East Africa',
    'Tanzania': 'East Africa',
    'Rwanda': 'East Africa',
    'Uganda': 'East Africa',
    'Djibouti': 'East Africa',
    'Somalia': 'East Africa',
    'Seychelles': 'East Africa',
    'Madagascar': 'East Africa',
    'Mauritius': 'East Africa',
    
    // Africa - West Africa
    'Nigeria': 'Western Africa',
    'Ghana': 'Western Africa',
    'Senegal': 'Western Africa',
    'Cote D\'Ivoire': 'Western Africa',
    'Liberia': 'Western Africa',
    'Sierra Leone': 'Western Africa',
    'Guinea': 'Western Africa',
    'Guinea-Bissau': 'Western Africa',
    'Togo': 'Western Africa',
    'Benin': 'Western Africa',
    'Burkina Faso': 'Western Africa',
    'Cape Verde': 'Western Africa',
    
    // Africa - North Africa
    'Morocco': 'North Africa',
    'Algeria': 'North Africa',
    'Sudan': 'North Africa',
    
    // Africa - Central Africa
    'Cameroon': 'Central Africa',
    'Republic Of The Congo': 'Central Africa',
    
    // Africa - South Africa (region)
    'Mozambique': 'South Africa',
    'Zambia': 'South Africa',
    'Angola': 'South Africa',
    
    // Asia - GCC (Gulf Cooperation Council)
    'United Arab Emirates': 'GCC',
    'Saudi Arabia': 'GCC',
    'Qatar': 'GCC',
    'Kuwait': 'GCC',
    'Oman': 'GCC',
    
    // Asia - Middle East
    'Iraq': 'Middle East',
    'Jordan': 'Middle East',
    
    // Asia - Central Asia
    'Georgia': 'Central Asia',
    'Armenia': 'Central Asia',
    'Azerbaijan': 'Central Asia',
    'Kazakhstan': 'Central Asia',
    'Turkmenistan': 'Central Asia',
    'Uzbekistan': 'Central Asia',
    
    // Asia - South Asia
    'India': 'South Asia',
    'Sri Lanka': 'South Asia',
    
    // Americas - South America
    'Argentina': 'South America',
    'Bolivia': 'South America',
    
    // Europe - East Europe
    'Czech Republic': 'East Europe',
    
    // Oceania
    'New Zealand': 'Oceania',
};

// Fallback: Region to Area mapping (when country not in map)
const regionAreaFallback = {
    'Africa': 'Western Africa', // Default Africa area
    'Asia': 'GCC', // Default Asia area
    'Americas': 'South America', // Default Americas area
    'Europe': 'East Europe', // Default Europe area
    'Oceania': 'Oceania',
};

function mapAreas() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('      MAP PROJECT AREAS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Load data
    if (!fs.existsSync(SCRAPED_DATA_PATH)) {
        throw new Error('scraped-projects.json not found');
    }
    
    const data = JSON.parse(fs.readFileSync(SCRAPED_DATA_PATH, 'utf8'));
    
    let mapped = 0;
    let unmapped = 0;
    const unmappedCountries = new Set();
    
    for (const industry of data.industries) {
        for (const project of industry.projects) {
            const country = project.country;
            const region = project.region;
            
            // Try to map by country first
            if (country && countryAreaMap[country]) {
                project.area = countryAreaMap[country];
                mapped++;
            }
            // Fallback to region
            else if (region && regionAreaFallback[region]) {
                project.area = regionAreaFallback[region];
                mapped++;
            }
            else {
                unmapped++;
                if (country && country !== 'Unknown' && country !== 'Select Country') {
                    unmappedCountries.add(country);
                }
            }
        }
    }
    
    // Save updated data
    data.areasUpdatedAt = new Date().toISOString();
    fs.writeFileSync(SCRAPED_DATA_PATH, JSON.stringify(data, null, 2));
    
    console.log('Area Mapping Summary:');
    console.log(`  Mapped:   ${mapped}`);
    console.log(`  Unmapped: ${unmapped}`);
    
    if (unmappedCountries.size > 0) {
        console.log('\nUnmapped countries (need to add to countryAreaMap):');
        for (const c of unmappedCountries) {
            console.log(`  - ${c}`);
        }
    }
    
    console.log('\n✅ Areas mapped successfully!');
}

mapAreas();
