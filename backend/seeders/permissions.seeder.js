const mongoose = require('mongoose');
const Permission = require('../models/Permission');
const Resource = require('../models/Resource');
const path = require('path');

// Load environment variables from backend root directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
// Fallback to .env.local if .env doesn't exist
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
}

/**
 * Real-World Permission Seeder
 * 
 * This seeder creates comprehensive, realistic permissions for all roles.
 * 
 * Permission Hierarchy:
 * - super_admin: Full access to everything (handled specially in code, but we seed for consistency)
 * - admin: Full access except managing permissions (can only read permissions)
 * - approver: Can approve and publish content, manage users (except super_admin)
 * - reviewer: Can review content, provide feedback, update content
 * - editor: Can create and edit own content, submit for review
 * - viewer: Read-only access to published content
 */

const defaultPermissions = [
    // ============================================================================
    // SUPER ADMIN - Full access to everything
    // ============================================================================
    {
        role: 'super_admin',
        resource: 'users',
        actions: ['create', 'read', 'update', 'delete'],
        conditions: {},
        isActive: true
    },
    {
        role: 'super_admin',
        resource: 'permissions',
        actions: ['create', 'read', 'update', 'delete'],
        conditions: {},
        isActive: true
    },
    {
        role: 'super_admin',
        resource: 'pages',
        actions: ['create', 'read', 'update', 'delete', 'approve', 'publish'],
        conditions: {},
        isActive: true
    },
    {
        role: 'super_admin',
        resource: 'sections',
        actions: ['create', 'read', 'update', 'delete', 'approve', 'publish'],
        conditions: {},
        isActive: true
    },
    {
        role: 'super_admin',
        resource: 'section_types',
        actions: ['create', 'read', 'update', 'delete'],
        conditions: {},
        isActive: true
    },
    {
        role: 'super_admin',
        resource: 'products',
        actions: ['create', 'read', 'update', 'delete', 'approve', 'publish'],
        conditions: {},
        isActive: true
    },
    {
        role: 'super_admin',
        resource: 'projects',
        actions: ['create', 'read', 'update', 'delete', 'approve', 'publish'],
        conditions: {},
        isActive: true
    },
    {
        role: 'super_admin',
        resource: 'media',
        actions: ['create', 'read', 'update', 'delete'],
        conditions: {},
        isActive: true
    },
    {
        role: 'super_admin',
        resource: 'activity_logs',
        actions: ['read', 'delete'],
        conditions: {},
        isActive: true
    },

    // ============================================================================
    // ADMIN - Full access except managing permissions (can only read)
    // ============================================================================
    {
        role: 'admin',
        resource: 'users',
        actions: ['create', 'read', 'update', 'delete'],
        conditions: {},
        isActive: true
    },
    {
        role: 'admin',
        resource: 'permissions',
        actions: ['read'], // Can view but not modify permissions
        conditions: {},
        isActive: true
    },
    {
        role: 'admin',
        resource: 'pages',
        actions: ['create', 'read', 'update', 'delete', 'approve', 'publish'],
        conditions: {},
        isActive: true
    },
    {
        role: 'admin',
        resource: 'sections',
        actions: ['create', 'read', 'update', 'delete', 'approve', 'publish'],
        conditions: {},
        isActive: true
    },
    {
        role: 'admin',
        resource: 'section_types',
        actions: ['create', 'read', 'update', 'delete'],
        conditions: {},
        isActive: true
    },
    {
        role: 'admin',
        resource: 'products',
        actions: ['create', 'read', 'update', 'delete', 'approve', 'publish'],
        conditions: {},
        isActive: true
    },
    {
        role: 'admin',
        resource: 'projects',
        actions: ['create', 'read', 'update', 'delete', 'approve', 'publish'],
        conditions: {},
        isActive: true
    },
    {
        role: 'admin',
        resource: 'media',
        actions: ['create', 'read', 'update', 'delete'],
        conditions: {},
        isActive: true
    },
    {
        role: 'admin',
        resource: 'activity_logs',
        actions: ['read'],
        conditions: {},
        isActive: true
    },

    // ============================================================================
    // APPROVER - Can approve and publish content, manage users (except super_admin)
    // ============================================================================
    {
        role: 'approver',
        resource: 'users',
        actions: ['read'], // Can view users but not modify
        conditions: {},
        isActive: true
    },
    {
        role: 'approver',
        resource: 'permissions',
        actions: ['read'], // Can view permissions
        conditions: {},
        isActive: true
    },
    {
        role: 'approver',
        resource: 'pages',
        actions: ['read', 'update', 'approve', 'publish'], // Can approve and publish
        conditions: {},
        isActive: true
    },
    {
        role: 'approver',
        resource: 'sections',
        actions: ['read', 'update', 'approve', 'publish'], // Can approve and publish
        conditions: {},
        isActive: true
    },
    {
        role: 'approver',
        resource: 'section_types',
        actions: ['read'], // Can view section types
        conditions: {},
        isActive: true
    },
    {
        role: 'approver',
        resource: 'products',
        actions: ['read', 'update', 'approve', 'publish'],
        conditions: {},
        isActive: true
    },
    {
        role: 'approver',
        resource: 'projects',
        actions: ['read', 'update', 'approve', 'publish'],
        conditions: {},
        isActive: true
    },
    {
        role: 'approver',
        resource: 'media',
        actions: ['read', 'update'], // Can view and update media
        conditions: {},
        isActive: true
    },
    {
        role: 'approver',
        resource: 'activity_logs',
        actions: ['read'], // Can view activity logs
        conditions: {},
        isActive: true
    },

    // ============================================================================
    // REVIEWER - Can review content, provide feedback, update content
    // ============================================================================
    {
        role: 'reviewer',
        resource: 'users',
        actions: ['read'], // Can view users
        conditions: {},
        isActive: true
    },
    {
        role: 'reviewer',
        resource: 'permissions',
        actions: ['read'], // Can view permissions
        conditions: {},
        isActive: true
    },
    {
        role: 'reviewer',
        resource: 'pages',
        actions: ['read', 'update'], // Can review and update content
        conditions: {},
        isActive: true
    },
    {
        role: 'reviewer',
        resource: 'sections',
        actions: ['read', 'update'], // Can review and update sections
        conditions: {},
        isActive: true
    },
    {
        role: 'reviewer',
        resource: 'section_types',
        actions: ['read'], // Can view section types
        conditions: {},
        isActive: true
    },
    {
        role: 'reviewer',
        resource: 'products',
        actions: ['read', 'update'], // Can review products
        conditions: {},
        isActive: true
    },
    {
        role: 'reviewer',
        resource: 'projects',
        actions: ['read', 'update'], // Can review projects
        conditions: {},
        isActive: true
    },
    {
        role: 'reviewer',
        resource: 'media',
        actions: ['read'], // Can view media
        conditions: {},
        isActive: true
    },
    {
        role: 'reviewer',
        resource: 'activity_logs',
        actions: ['read'], // Can view own activity logs
        conditions: { ownOnly: true },
        isActive: true
    },

    // ============================================================================
    // EDITOR - Can create and edit own content, submit for review
    // ============================================================================
    {
        role: 'editor',
        resource: 'users',
        actions: ['read'], // Can view own profile
        conditions: { ownOnly: true },
        isActive: true
    },
    {
        role: 'editor',
        resource: 'permissions',
        actions: ['read'], // Can view permissions (to know what they can do)
        conditions: {},
        isActive: true
    },
    {
        role: 'editor',
        resource: 'pages',
        actions: ['create', 'read', 'update'], // Can create and edit own pages
        conditions: { ownOnly: true },
        isActive: true
    },
    {
        role: 'editor',
        resource: 'sections',
        actions: ['create', 'read', 'update'], // Can create and edit own sections
        conditions: { ownOnly: true },
        isActive: true
    },
    {
        role: 'editor',
        resource: 'section_types',
        actions: ['read'], // Can view section types to create content
        conditions: {},
        isActive: true
    },
    {
        role: 'editor',
        resource: 'products',
        actions: ['create', 'read', 'update'], // Can create and edit own products
        conditions: { ownOnly: true },
        isActive: true
    },
    {
        role: 'editor',
        resource: 'projects',
        actions: ['create', 'read', 'update'], // Can create and edit own projects
        conditions: { ownOnly: true },
        isActive: true
    },
    {
        role: 'editor',
        resource: 'media',
        actions: ['create', 'read', 'update', 'delete'], // Can manage own media
        conditions: { ownOnly: true },
        isActive: true
    },
    {
        role: 'editor',
        resource: 'activity_logs',
        actions: ['read'], // Can view own activity logs
        conditions: { ownOnly: true },
        isActive: true
    },

    // ============================================================================
    // VIEWER - Read-only access to published content
    // ============================================================================
    {
        role: 'viewer',
        resource: 'users',
        actions: ['read'], // Can view own profile
        conditions: { ownOnly: true },
        isActive: true
    },
    {
        role: 'viewer',
        resource: 'permissions',
        actions: ['read'], // Can view permissions (to know what they can do)
        conditions: {},
        isActive: true
    },
    {
        role: 'viewer',
        resource: 'pages',
        actions: ['read'], // Can view published pages
        conditions: {},
        isActive: true
    },
    {
        role: 'viewer',
        resource: 'sections',
        actions: ['read'], // Can view published sections
        conditions: {},
        isActive: true
    },
    {
        role: 'viewer',
        resource: 'section_types',
        actions: ['read'], // Can view section types
        conditions: {},
        isActive: true
    },
    {
        role: 'viewer',
        resource: 'products',
        actions: ['read'], // Can view published products
        conditions: {},
        isActive: true
    },
    {
        role: 'viewer',
        resource: 'projects',
        actions: ['read'], // Can view published projects
        conditions: {},
        isActive: true
    },
    {
        role: 'viewer',
        resource: 'media',
        actions: ['read'], // Can view media
        conditions: {},
        isActive: true
    },
    {
        role: 'viewer',
        resource: 'activity_logs',
        actions: ['read'], // Can view own activity logs
        conditions: { ownOnly: true },
        isActive: true
    }
];

/**
 * Seed permissions into the database
 * This will:
 * 1. Clear all existing permissions
 * 2. Insert new permissions
 * 3. Display a summary
 */
const seedPermissions = async () => {
    try {
        // Check if MONGODB_URI is defined
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables. Please create a .env file in the backend directory with MONGODB_URI=your_connection_string');
        }

        console.log('🌱 Starting Permission Seeder...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing permissions
        const deletedCount = await Permission.deleteMany({});
        console.log(`🗑️  Cleared ${deletedCount.deletedCount} existing permissions`);

        // Fetch all resources and create slug-to-ObjectId mapping
        const allResources = await Resource.find({});
        const resourceMap = new Map();
        allResources.forEach(resource => {
            resourceMap.set(resource.slug, resource._id);
        });

        console.log(`📦 Found ${allResources.length} resources in database`);

        // Convert resource strings to ObjectIds
        const permissionsWithObjectIds = defaultPermissions.map(perm => {
            const resourceSlug = perm.resource;
            const resourceId = resourceMap.get(resourceSlug);
            
            if (!resourceId) {
                console.warn(`⚠️  Warning: Resource "${resourceSlug}" not found in database. Skipping permission.`);
                return null;
            }

            // For role-based permissions, explicitly exclude userId (don't set it to null)
            // This ensures clean data: role-based permissions have no userId field
            const permissionData = {
                role: perm.role,
                resource: resourceId,
                actions: perm.actions,
                conditions: perm.conditions,
                isActive: perm.isActive
            };
            
            // Only include userId if it's explicitly provided (for user-specific permissions)
            if (perm.userId !== undefined) {
                permissionData.userId = perm.userId;
            }
            // Otherwise, userId will be undefined (not stored in DB) for role-based permissions

            return permissionData;
        }).filter(perm => perm !== null); // Remove null entries

        console.log(`📝 Converting ${defaultPermissions.length} permissions, ${permissionsWithObjectIds.length} valid after resource lookup\n`);

        // Insert default permissions
        const result = await Permission.insertMany(permissionsWithObjectIds);
        console.log(`✅ Successfully seeded ${result.length} permissions\n`);

        // Display detailed summary
        const roles = ['super_admin', 'admin', 'approver', 'reviewer', 'editor', 'viewer'];
        const resources = ['users', 'permissions', 'pages', 'sections', 'section_types', 'products', 'projects', 'media', 'activity_logs'];
        
        console.log('📊 Permissions Summary by Role:');
        console.log('='.repeat(60));
        
        for (const role of roles) {
            const rolePermissions = await Permission.find({ role }).populate('resource', 'slug name');
            const resourceCount = new Set(rolePermissions.map(p => p.resource?._id?.toString() || p.resource?.toString())).size;
            const totalActions = rolePermissions.reduce((sum, p) => sum + p.actions.length, 0);
            
            console.log(`\n${role.toUpperCase()}:`);
            console.log(`  - Resources: ${resourceCount}/${resources.length}`);
            console.log(`  - Total Permissions: ${rolePermissions.length}`);
            console.log(`  - Total Actions: ${totalActions}`);
            
            // Show permissions by resource
            resources.forEach(resource => {
                const perm = rolePermissions.find(p => p.resource === resource);
                if (perm && perm.actions.length > 0) {
                    console.log(`    ✓ ${resource}: [${perm.actions.join(', ')}]`);
                }
            });
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ Permission seeding completed successfully!\n');

        // Close connection
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error seeding permissions:', error);
        console.error(error.stack);
        process.exit(1);
    }
};

// Run seeder if called directly
if (require.main === module) {
    seedPermissions();
}

module.exports = { seedPermissions, defaultPermissions };
