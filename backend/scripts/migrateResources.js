const mongoose = require('mongoose');
const Permission = require('../models/Permission');
const Resource = require('../models/Resource');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
}

/**
 * Migration Script: Convert String Resources to Resource Documents
 * 
 * This script:
 * 1. Finds all unique string resources from existing Permission documents
 * 2. Creates Resource documents for each unique resource
 * 3. Updates Permission documents to reference Resource ObjectIds
 * 4. Preserves all existing permission data
 */

// Default resource mappings (slug -> resource config)
const defaultResources = [
    {
        name: 'Users',
        slug: 'users',
        path: '/users',
        icon: 'UserOutlined',
        description: 'User management and administration',
        category: 'Administration',
        showInMenu: true,
        order: 1
    },
    {
        name: 'Permissions',
        slug: 'permissions',
        path: '/permissions',
        icon: 'SafetyOutlined',
        description: 'Permission and role management',
        category: 'Administration',
        showInMenu: true,
        order: 2
    },
    {
        name: 'Pages',
        slug: 'pages',
        path: '/pages',
        icon: 'FileTextOutlined',
        description: 'Page content management',
        category: 'Content',
        showInMenu: true,
        order: 3
    },
    {
        name: 'Page Tree',
        slug: 'page_tree',
        path: '/pages/tree',
        icon: 'BranchesOutlined',
        description: 'Hierarchical page tree view',
        category: 'Content',
        showInMenu: true,
        order: 4,
        parentSlug: 'pages' // Will be set after parent is created
    },
    {
        name: 'Sections',
        slug: 'sections',
        path: '/sections',
        icon: 'AppstoreOutlined',
        description: 'Section content management',
        category: 'Content',
        showInMenu: true,
        order: 5
    },
    {
        name: 'Section Types',
        slug: 'section_types',
        path: '/section-types',
        icon: 'SettingOutlined',
        description: 'Section type definitions and templates',
        category: 'Content',
        showInMenu: false, // Only super_admin can access
        order: 6
    },
    {
        name: 'Products',
        slug: 'products',
        path: '/products',
        icon: 'ShoppingOutlined',
        description: 'Product catalog management',
        category: 'Content',
        showInMenu: true,
        order: 7
    },
    {
        name: 'Projects',
        slug: 'projects',
        path: '/projects',
        icon: 'ProjectOutlined',
        description: 'Project management',
        category: 'Content',
        showInMenu: true,
        order: 8
    },
    {
        name: 'Building Types',
        slug: 'building-types',
        path: '/building-types',
        icon: 'BuildOutlined',
        description: 'Building type classifications',
        category: 'Content',
        showInMenu: true,
        order: 1,
        parentSlug: 'projects'
    },
    {
        name: 'Industries',
        slug: 'industries',
        path: '/industries',
        icon: 'ShopOutlined',
        description: 'Industry classifications',
        category: 'Content',
        showInMenu: true,
        order: 2,
        parentSlug: 'projects'
    },
    {
        name: 'Countries',
        slug: 'countries',
        path: '/countries',
        icon: 'GlobalOutlined',
        description: 'Country reference data',
        category: 'Content',
        showInMenu: true,
        order: 3,
        parentSlug: 'projects'
    },
    {
        name: 'Regions',
        slug: 'regions',
        path: '/regions',
        icon: 'EnvironmentOutlined',
        description: 'Region reference data',
        category: 'Content',
        showInMenu: true,
        order: 4,
        parentSlug: 'projects'
    },
    {
        name: 'Areas',
        slug: 'areas',
        path: '/areas',
        icon: 'EnvironmentOutlined',
        description: 'Area reference data',
        category: 'Content',
        showInMenu: true,
        order: 5,
        parentSlug: 'projects'
    },
    {
        name: 'Company Related Information',
        slug: 'company-related-information',
        path: '/company-related-information',
        icon: 'BankOutlined',
        description: 'Company information and resources',
        category: 'Content',
        showInMenu: true,
        order: 9
    },
    {
        name: 'Website Configurations',
        slug: 'website-configurations',
        path: '/website-configurations',
        icon: 'SettingOutlined',
        description: 'Website configuration management',
        category: 'Settings',
        showInMenu: true,
        order: 20
    },
    {
        name: 'Branches',
        slug: 'branches',
        path: '/branches',
        icon: 'BankOutlined',
        description: 'Company branch locations',
        category: 'Content',
        showInMenu: true,
        order: 1,
        parentSlug: 'company-related-information'
    },
    {
        name: 'Customers',
        slug: 'customers',
        path: '/customers',
        icon: 'TeamOutlined',
        description: 'Company customers',
        category: 'Content',
        showInMenu: true,
        order: 2,
        parentSlug: 'company-related-information'
    },
    {
        name: 'Certifications',
        slug: 'certifications',
        path: '/certifications',
        icon: 'TrophyOutlined',
        description: 'Company certifications',
        category: 'Content',
        showInMenu: true,
        order: 3,
        parentSlug: 'company-related-information'
    },
    {
        name: 'Company Updates',
        slug: 'company-updates',
        path: '/company-updates',
        icon: 'NotificationOutlined',
        description: 'Company news and updates',
        category: 'Content',
        showInMenu: true,
        order: 4,
        parentSlug: 'company-related-information'
    },
    {
        name: 'Company Update Categories',
        slug: 'company-update-categories',
        path: '/company-update-categories',
        icon: 'FolderOutlined',
        description: 'Categories for company updates',
        category: 'Content',
        showInMenu: true,
        order: 5,
        parentSlug: 'company-related-information'
    },
    {
        name: 'Brochures',
        slug: 'brochures',
        path: '/brochures',
        icon: 'FilePdfOutlined',
        description: 'Company brochures and documents',
        category: 'Content',
        showInMenu: true,
        order: 6,
        parentSlug: 'company-related-information'
    },
    {
        name: 'Media Library',
        slug: 'media-library',
        path: '/media-library',
        icon: 'PictureOutlined',
        description: 'Comprehensive media file management including images, videos, and YouTube links',
        category: 'Content',
        showInMenu: true,
        order: 7,
        parentSlug: 'company-related-information'
    },
    {
        name: 'Header Configuration',
        slug: 'header-configurations',
        path: '/website-configurations/header',
        icon: 'MenuOutlined',
        description: 'Website header configuration',
        category: 'Settings',
        showInMenu: true,
        order: 1,
        parentSlug: 'website-configurations'
    },
    {
        name: 'Footer Configuration',
        slug: 'footer-configurations',
        path: '/website-configurations/footer',
        icon: 'BorderBottomOutlined',
        description: 'Website footer configuration',
        category: 'Settings',
        showInMenu: true,
        order: 2,
        parentSlug: 'website-configurations'
    },
    {
        name: 'Website Appearance',
        slug: 'website-appearance',
        path: '/website-configurations/appearance',
        icon: 'HighlightOutlined',
        description: 'Website appearance and theme settings',
        category: 'Settings',
        showInMenu: true,
        order: 3,
        parentSlug: 'website-configurations'
    },
    {
        name: 'SMTP Settings',
        slug: 'smtp-settings',
        path: '/website-configurations/smtp',
        icon: 'MailOutlined',
        description: 'SMTP configuration for emails',
        category: 'Settings',
        showInMenu: true,
        order: 4,
        parentSlug: 'website-configurations'
    },
    {
        name: 'Google ReCaptcha',
        slug: 'google-recaptcha',
        path: '/website-configurations/recaptcha',
        icon: 'RobotOutlined',
        description: 'ReCaptcha configuration',
        category: 'Settings',
        showInMenu: true,
        order: 5,
        parentSlug: 'website-configurations'
    },
    {
        name: 'Google Maps',
        slug: 'google-maps',
        path: '/website-configurations/maps',
        icon: 'EnvironmentOutlined',
        description: 'Google Maps configuration',
        category: 'Settings',
        showInMenu: true,
        order: 6,
        parentSlug: 'website-configurations'
    },
    {
        name: 'Media Library',
        slug: 'media-library',
        path: '/media-library',
        icon: 'PictureOutlined',
        description: 'Comprehensive media file management including images, videos, and YouTube links',
        category: 'Content',
        showInMenu: true,
        order: 10
    },
    {
        name: 'Activity Logs',
        slug: 'activity_logs',
        path: '/activity',
        icon: 'HistoryOutlined',
        description: 'System activity and audit logs',
        category: 'Administration',
        showInMenu: true,
        order: 11
    },
    {
        name: 'Enquiries and Applications',
        slug: 'enquiries-applications',
        path: '/enquiries-applications',
        icon: 'MailOutlined',
        description: 'Enquiries and job applications management',
        category: 'Content',
        showInMenu: true,
        order: 12
    },
    {
        name: 'Vacancies',
        slug: 'vacancies',
        path: '/enquiries-applications/vacancies',
        parentSlug: 'enquiries-applications',
        icon: 'BriefcaseOutlined',
        description: 'Job vacancies management',
        category: 'Content',
        showInMenu: true,
        order: 1
    },
    {
        name: 'Enquiries',
        slug: 'enquiries',
        path: '/enquiries-applications/enquiries',
        parentSlug: 'enquiries-applications',
        icon: 'MessageOutlined',
        description: 'Contact form enquiries',
        category: 'Content',
        showInMenu: true,
        order: 2
    },
    {
        name: 'Applications',
        slug: 'applications',
        path: '/enquiries-applications/applications',
        parentSlug: 'enquiries-applications',
        icon: 'FileTextOutlined',
        description: 'Job applications management',
        category: 'Content',
        showInMenu: true,
        order: 3
    },
    {
        name: 'Form Configuration',
        slug: 'form-configurations',
        path: '/enquiries-applications/form-configuration',
        parentSlug: 'enquiries-applications',
        icon: 'SettingOutlined',
        description: 'Global form settings and notifications',
        category: 'Settings',
        showInMenu: true,
        order: 4
    }
];

/**
 * Create Resource documents from default resources
 */
const createDefaultResources = async () => {
    console.log('📦 Creating default Resource documents...\n');
    
    const createdResources = [];
    const resourceMap = new Map(); // slug -> Resource document

    // First pass: Create all resources without parents
    for (const resourceData of defaultResources) {
        if (resourceData.parentSlug) {
            continue; // Skip resources with parents for now
        }

        // Check if resource already exists
        let resource = await Resource.findOne({ slug: resourceData.slug });
        
        if (!resource) {
            resource = new Resource({
                name: resourceData.name,
                slug: resourceData.slug,
                path: resourceData.path,
                icon: resourceData.icon,
                description: resourceData.description,
                category: resourceData.category,
                showInMenu: resourceData.showInMenu,
                order: resourceData.order,
                isActive: true
            });
            await resource.save();
            console.log(`  ✅ Created resource: ${resourceData.name} (${resourceData.slug})`);
            createdResources.push(resource);
        } else {
            console.log(`  ⏭️  Resource already exists: ${resourceData.name} (${resourceData.slug})`);
        }
        
        resourceMap.set(resourceData.slug, resource);
    }

    // Second pass: Create resources with parents
    for (const resourceData of defaultResources) {
        if (!resourceData.parentSlug) {
            continue; // Already created
        }

        const parentResource = resourceMap.get(resourceData.parentSlug);
        if (!parentResource) {
            console.log(`  ⚠️  Warning: Parent resource '${resourceData.parentSlug}' not found for '${resourceData.slug}'`);
            continue;
        }

        // Check if resource already exists
        let resource = await Resource.findOne({ slug: resourceData.slug });
        
        if (!resource) {
            resource = new Resource({
                name: resourceData.name,
                slug: resourceData.slug,
                path: resourceData.path,
                icon: resourceData.icon,
                description: resourceData.description,
                category: resourceData.category,
                showInMenu: resourceData.showInMenu,
                order: resourceData.order,
                parentId: parentResource._id,
                isActive: true
            });
            await resource.save();
            console.log(`  ✅ Created resource: ${resourceData.name} (${resourceData.slug}) with parent: ${resourceData.parentSlug}`);
            createdResources.push(resource);
        } else {
            // Update parent if not set
            if (!resource.parentId || resource.parentId.toString() !== parentResource._id.toString()) {
                resource.parentId = parentResource._id;
                await resource.save();
                console.log(`  🔄 Updated parent for: ${resourceData.name} (${resourceData.slug})`);
            } else {
                console.log(`  ⏭️  Resource already exists: ${resourceData.name} (${resourceData.slug})`);
            }
        }
        
        resourceMap.set(resourceData.slug, resource);
    }

    console.log(`\n✅ Created/updated ${createdResources.length} default resources\n`);
    return resourceMap;
};

/**
 * Find all unique string resources from Permission documents
 */
const findUniqueStringResources = async () => {
    console.log('🔍 Finding unique string resources from Permissions...\n');
    
    // Find all permissions with string resources (not ObjectId)
    const permissions = await Permission.find({
        resource: { $type: 'string' }
    });

    const uniqueResources = new Set();
    permissions.forEach(permission => {
        if (typeof permission.resource === 'string') {
            uniqueResources.add(permission.resource);
        }
    });

    console.log(`  Found ${uniqueResources.size} unique string resources: ${Array.from(uniqueResources).join(', ')}\n`);
    return Array.from(uniqueResources);
};

/**
 * Create Resource documents for string resources found in Permissions
 */
const createResourcesFromPermissions = async (stringResources, existingResourceMap) => {
    console.log('📦 Creating Resource documents for permissions...\n');
    
    const createdResources = [];
    const resourceMap = new Map(existingResourceMap);

    for (const resourceSlug of stringResources) {
        // Skip if already in default resources
        if (existingResourceMap.has(resourceSlug)) {
            continue;
        }

        // Check if resource already exists
        let resource = await Resource.findOne({ slug: resourceSlug });
        
        if (!resource) {
            // Create resource with default values
            const resourceName = resourceSlug
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            
            resource = new Resource({
                name: resourceName,
                slug: resourceSlug,
                path: `/${resourceSlug.replace(/_/g, '-')}`,
                icon: 'FileTextOutlined',
                description: `Resource for ${resourceName}`,
                category: 'General',
                showInMenu: true,
                order: 100, // Higher order for auto-created resources
                isActive: true
            });
            await resource.save();
            console.log(`  ✅ Created resource: ${resourceName} (${resourceSlug})`);
            createdResources.push(resource);
        } else {
            console.log(`  ⏭️  Resource already exists: ${resource.name} (${resourceSlug})`);
        }
        
        resourceMap.set(resourceSlug, resource);
    }

    console.log(`\n✅ Created ${createdResources.length} additional resources from permissions\n`);
    return resourceMap;
};

/**
 * Update Permission documents to use Resource ObjectIds
 */
const updatePermissionReferences = async (resourceMap) => {
    console.log('🔄 Updating Permission documents to use Resource ObjectIds...\n');
    
    // Find all permissions with string resources
    const permissions = await Permission.find({
        resource: { $type: 'string' }
    });

    console.log(`  Found ${permissions.length} permissions with string resources\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const permission of permissions) {
        try {
            const resourceSlug = permission.resource;
            const resource = resourceMap.get(resourceSlug);

            if (!resource) {
                console.log(`  ⚠️  Warning: Resource not found for '${resourceSlug}', skipping permission ${permission._id}`);
                skippedCount++;
                continue;
            }

            // Update permission to use Resource ObjectId
            permission.resource = resource._id;
            await permission.save();
            updatedCount++;

            if (updatedCount % 10 === 0) {
                console.log(`  📝 Updated ${updatedCount} permissions...`);
            }
        } catch (error) {
            console.error(`  ❌ Error updating permission ${permission._id}:`, error.message);
            errorCount++;
        }
    }

    console.log(`\n✅ Migration Summary:`);
    console.log(`  - Updated: ${updatedCount} permissions`);
    console.log(`  - Skipped: ${skippedCount} permissions`);
    console.log(`  - Errors: ${errorCount} permissions\n`);
};

/**
 * Verify migration results
 */
const verifyMigration = async () => {
    console.log('🔍 Verifying migration results...\n');

    // Check for any remaining string resources
    const stringPermissions = await Permission.find({
        resource: { $type: 'string' }
    });

    if (stringPermissions.length > 0) {
        console.log(`  ⚠️  Warning: Found ${stringPermissions.length} permissions still using string resources:`);
        stringPermissions.forEach(perm => {
            console.log(`    - Permission ${perm._id}: resource = "${perm.resource}"`);
        });
        console.log('');
    } else {
        console.log('  ✅ All permissions now use Resource ObjectId references\n');
    }

    // Count resources
    const resourceCount = await Resource.countDocuments({ isActive: true });
    console.log(`  ✅ Total active resources: ${resourceCount}`);

    // Count permissions by type
    const rolePermissions = await Permission.countDocuments({ role: { $exists: true } });
    const userPermissions = await Permission.countDocuments({ userId: { $exists: true } });
    console.log(`  ✅ Role-based permissions: ${rolePermissions}`);
    console.log(`  ✅ User-specific permissions: ${userPermissions}\n`);
};

/**
 * Main migration function
 */
const migrateResources = async () => {
    try {
        // Check if MONGODB_URI is defined
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables. Please create a .env file in the backend directory with MONGODB_URI=your_connection_string');
        }

        console.log('🚀 Starting Resource Migration...\n');
        console.log('='.repeat(60));
        console.log('This will:');
        console.log('  1. Create Resource documents from default resources');
        console.log('  2. Find unique string resources from existing Permissions');
        console.log('  3. Create Resource documents for found resources');
        console.log('  4. Update Permission documents to reference Resource ObjectIds');
        console.log('  5. Preserve all existing permission data');
        console.log('='.repeat(60));
        console.log('');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Step 1: Create default resources
        const defaultResourceMap = await createDefaultResources();

        // Step 2: Find unique string resources from permissions
        const stringResources = await findUniqueStringResources();

        // Step 3: Create resources for found string resources
        const allResourceMap = await createResourcesFromPermissions(stringResources, defaultResourceMap);

        // Step 4: Update permission references
        await updatePermissionReferences(allResourceMap);

        // Step 5: Verify migration
        await verifyMigration();

        console.log('='.repeat(60));
        console.log('✅ Migration completed successfully!\n');

        // Close connection
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error during migration:', error);
        console.error(error.stack);
        process.exit(1);
    }
};

// Run migration if called directly
if (require.main === module) {
    migrateResources();
}

module.exports = { migrateResources, defaultResources };

