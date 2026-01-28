const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
}

// Import models
const User = require('../models/User');
const Role = require('../models/Role');
const Resource = require('../models/Resource');
const Permission = require('../models/Permission');

/**
 * Setup Script: Initialize Database with Super Admin
 * 
 * This script:
 * 1. Creates all system roles (super_admin, admin, approver, reviewer, editor, viewer)
 * 2. Creates all default resources
 * 3. Creates a super admin user
 * 4. Assigns all permissions to super_admin role for all resources
 */

// Default system roles
const systemRoles = [
    {
        name: 'Super Admin',
        slug: 'super_admin',
        description: 'Full system access with all permissions',
        level: 100,
        color: 'red',
        isSystem: true,
        isActive: true
    },
    {
        name: 'Admin',
        slug: 'admin',
        description: 'Administrative access with most permissions',
        level: 80,
        color: 'purple',
        isSystem: true,
        isActive: true
    },
    {
        name: 'Approver',
        slug: 'approver',
        description: 'Can approve and publish content',
        level: 60,
        color: 'green',
        isSystem: true,
        isActive: true
    },
    {
        name: 'Reviewer',
        slug: 'reviewer',
        description: 'Can review content before approval',
        level: 50,
        color: 'orange',
        isSystem: true,
        isActive: true
    },
    {
        name: 'Editor',
        slug: 'editor',
        description: 'Can create and edit content',
        level: 40,
        color: 'blue',
        isSystem: true,
        isActive: true
    },
    {
        name: 'Viewer',
        slug: 'viewer',
        description: 'Read-only access',
        level: 10,
        color: 'default',
        isSystem: true,
        isActive: true
    }
];

// Default resources
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
        name: 'Roles',
        slug: 'roles',
        path: '/roles',
        icon: 'SafetyOutlined',
        description: 'Role management',
        category: 'Administration',
        showInMenu: false, // Only accessible via direct URL or sidebar
        order: 2.5
    },
    {
        name: 'Resources',
        slug: 'resources',
        path: '/resources',
        icon: 'AppstoreOutlined',
        description: 'Resource management',
        category: 'Administration',
        showInMenu: false, // Only super_admin can access
        order: 2.6
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
        parentSlug: 'pages'
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
        showInMenu: false,
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
        name: 'Media',
        slug: 'media',
        path: '/media',
        icon: 'PictureOutlined',
        description: 'Media library and file management',
        category: 'Content',
        showInMenu: true,
        order: 9
    },
    {
        name: 'Activity Logs',
        slug: 'activity_logs',
        path: '/activity',
        icon: 'HistoryOutlined',
        description: 'System activity and audit logs',
        category: 'Administration',
        showInMenu: true,
        order: 10
    },
    {
        name: 'Workflow',
        slug: 'workflow',
        path: '/workflow',
        icon: 'ThunderboltOutlined',
        description: 'Content workflow and approval process',
        category: 'Content',
        showInMenu: false,
        order: 11
    }
];

// All available actions
const allActions = ['create', 'read', 'update', 'delete', 'review', 'approve', 'publish'];

/**
 * Create system roles
 */
const createSystemRoles = async () => {
    console.log('📝 Step 1: Creating system roles...\n');
    
    const roleMap = new Map();
    
    for (const roleData of systemRoles) {
        let role = await Role.findOne({ slug: roleData.slug });
        
        if (role) {
            console.log(`  ⚠️  Role "${roleData.slug}" already exists, updating...`);
            // Update existing role
            Object.assign(role, roleData);
            await role.save();
        } else {
            // Create new role
            role = await Role.create(roleData);
            console.log(`  ✅ Created role: ${roleData.name} (${roleData.slug})`);
        }
        
        roleMap.set(roleData.slug, role._id);
    }
    
    console.log(`\n  ✅ Created/updated ${roleMap.size} system roles\n`);
    return roleMap;
};

/**
 * Create default resources
 */
const createDefaultResources = async () => {
    console.log('📦 Step 2: Creating default resources...\n');
    
    const resourceMap = new Map();
    const createdResources = [];
    
    // First pass: Create all resources without parents
    for (const resourceData of defaultResources) {
        if (resourceData.parentSlug) {
            continue; // Skip resources with parents for now
        }
        
        let resource = await Resource.findOne({ slug: resourceData.slug });
        
        if (!resource) {
            resource = await Resource.create({
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
            continue;
        }
        
        const parentResource = resourceMap.get(resourceData.parentSlug);
        if (!parentResource) {
            console.log(`  ⚠️  Parent resource "${resourceData.parentSlug}" not found for "${resourceData.slug}", skipping`);
            continue;
        }
        
        let resource = await Resource.findOne({ slug: resourceData.slug });
        
        if (!resource) {
            resource = await Resource.create({
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
            console.log(`  ✅ Created resource: ${resourceData.name} (${resourceData.slug})`);
            createdResources.push(resource);
        } else {
            console.log(`  ⏭️  Resource already exists: ${resourceData.name} (${resourceData.slug})`);
        }
        
        resourceMap.set(resourceData.slug, resource);
    }
    
    console.log(`\n  ✅ Created/updated ${resourceMap.size} resources\n`);
    return resourceMap;
};

/**
 * Create super admin user
 */
const createSuperAdmin = async (superAdminRoleId) => {
    console.log('👤 Step 3: Creating super admin user...\n');
    
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@acero.com';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123';
    const superAdminFirstName = process.env.SUPER_ADMIN_FIRST_NAME || 'Super';
    const superAdminLastName = process.env.SUPER_ADMIN_LAST_NAME || 'Admin';
    
    // Check if super admin already exists (include password field for potential update)
    let superAdmin = await User.findOne({ email: superAdminEmail }).select('+password');
    
    if (superAdmin) {
        console.log(`  ⚠️  Super admin user already exists: ${superAdminEmail}`);
        // Update role if needed
        if (superAdmin.role.toString() !== superAdminRoleId.toString()) {
            superAdmin.role = superAdminRoleId;
        }
        // Reset password to default (allows re-running script to reset password)
        // User model's pre-save hook will hash it automatically
        superAdmin.password = superAdminPassword;
        await superAdmin.save();
        console.log(`  ✅ Updated super admin (role and password reset)`);
        return superAdmin;
    }
    
    // Create super admin user
    // Note: Don't hash password here - User model's pre-save hook will hash it automatically
    superAdmin = await User.create({
        email: superAdminEmail,
        password: superAdminPassword, // Will be hashed by User model's pre-save hook
        firstName: superAdminFirstName,
        lastName: superAdminLastName,
        role: superAdminRoleId,
        isActive: true
    });
    
    console.log(`  ✅ Created super admin user:`);
    console.log(`     Email: ${superAdminEmail}`);
    console.log(`     Password: ${superAdminPassword}`);
    console.log(`     Name: ${superAdminFirstName} ${superAdminLastName}\n`);
    
    return superAdmin;
};

/**
 * Assign all permissions to super_admin role
 */
const assignSuperAdminPermissions = async (superAdminRoleId, resourceMap) => {
    console.log('🔐 Step 4: Assigning all permissions to super_admin role...\n');
    
    let permissionCount = 0;
    
    for (const [slug, resource] of resourceMap) {
        // Check if permission already exists
        let permission = await Permission.findOne({
            role: superAdminRoleId,
            resource: resource._id
        });
        
        if (permission) {
            // Update existing permission to include all actions
            permission.actions = [...allActions];
            permission.isActive = true;
            await permission.save();
            console.log(`  ✅ Updated permissions for: ${resource.name}`);
        } else {
            // Create new permission
            permission = await Permission.create({
                role: superAdminRoleId,
                resource: resource._id,
                actions: [...allActions],
                conditions: {},
                isActive: true
            });
            console.log(`  ✅ Created permissions for: ${resource.name}`);
        }
        
        permissionCount++;
    }
    
    console.log(`\n  ✅ Assigned all permissions to super_admin for ${permissionCount} resources\n`);
};

/**
 * Main setup function
 */
const setupSuperAdmin = async () => {
    try {
        // Check if MONGODB_URI is defined
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables. Please create a .env file in the backend directory with MONGODB_URI=your_connection_string');
        }

        console.log('🚀 Starting Super Admin Setup...\n');
        console.log('='.repeat(60));
        console.log('This will:');
        console.log('  1. Create all system roles');
        console.log('  2. Create all default resources');
        console.log('  3. Create a super admin user');
        console.log('  4. Assign all permissions to super_admin role');
        console.log('='.repeat(60));
        console.log('');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Step 1: Create system roles
        const roleMap = await createSystemRoles();
        const superAdminRoleId = roleMap.get('super_admin');

        // Step 2: Create default resources
        const resourceMap = await createDefaultResources();

        // Step 3: Create super admin user
        const superAdmin = await createSuperAdmin(superAdminRoleId);

        // Step 4: Assign all permissions to super_admin
        await assignSuperAdminPermissions(superAdminRoleId, resourceMap);

        // Summary
        console.log('='.repeat(60));
        console.log('✅ Setup completed successfully!\n');
        console.log('📊 Summary:');
        console.log(`   - Roles created: ${roleMap.size}`);
        console.log(`   - Resources created: ${resourceMap.size}`);
        console.log(`   - Super admin user: ${superAdmin.email}`);
        console.log(`   - Permissions assigned: All actions for all resources\n`);
        console.log('🔑 Login Credentials:');
        console.log(`   Email: ${superAdmin.email}`);
        console.log(`   Password: ${process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123'}\n`);
        console.log('='.repeat(60));

        // Close connection
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error during setup:', error);
        console.error(error.stack);
        process.exit(1);
    }
};

// Run setup if called directly
if (require.main === module) {
    setupSuperAdmin();
}

module.exports = { setupSuperAdmin };

