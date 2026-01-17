const mongoose = require('mongoose');
const Permission = require('../models/Permission');
const User = require('../models/User');
const Page = require('../models/Page');
const Role = require('../models/Role');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
if (!process.env.MONGODB_URI) {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
}

/**
 * Migration Script: Convert String Roles to Role Documents
 * 
 * This script:
 * 1. Creates Role documents for system roles (super_admin, admin, approver, reviewer, editor, viewer)
 * 2. Updates User documents: convert role string to Role ObjectId
 * 3. Updates Permission documents: convert role string to Role ObjectId
 * 4. Updates Page documents: convert allowedRoles strings to Role ObjectIds
 * 5. Includes rollback capability
 */

// Default system roles with hierarchy and colors
const defaultRoles = [
    {
        name: 'Super Admin',
        slug: 'super_admin',
        description: 'Full system access with all permissions',
        level: 100,
        color: 'red',
        isSystem: true
    },
    {
        name: 'Admin',
        slug: 'admin',
        description: 'Administrative access with most permissions',
        level: 80,
        color: 'purple',
        isSystem: true
    },
    {
        name: 'Approver',
        slug: 'approver',
        description: 'Can approve and publish content',
        level: 60,
        color: 'green',
        isSystem: true
    },
    {
        name: 'Reviewer',
        slug: 'reviewer',
        description: 'Can review content before approval',
        level: 50,
        color: 'orange',
        isSystem: true
    },
    {
        name: 'Editor',
        slug: 'editor',
        description: 'Can create and edit content',
        level: 40,
        color: 'blue',
        isSystem: true
    },
    {
        name: 'Viewer',
        slug: 'viewer',
        description: 'Read-only access',
        level: 10,
        color: 'default',
        isSystem: true
    }
];

// Store for rollback data
let rollbackData = {
    roles: [],
    users: [],
    permissions: [],
    pages: []
};

/**
 * Create default system roles
 * @returns {Promise<Map>} Map of role slug to Role ObjectId
 */
const createDefaultRoles = async () => {
    console.log('📝 Step 1: Creating default system roles...\n');
    
    const roleMap = new Map();
    
    for (const roleData of defaultRoles) {
        // Check if role already exists
        let role = await Role.findOne({ slug: roleData.slug });
        
        if (role) {
            console.log(`  ⚠️  Role "${roleData.slug}" already exists, skipping creation`);
            // Update existing role to ensure it's marked as system role
            if (!role.isSystem) {
                role.isSystem = true;
                role.level = roleData.level;
                role.color = roleData.color;
                role.description = roleData.description;
                await role.save();
                console.log(`  ✅ Updated role "${roleData.slug}" to system role`);
            }
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
 * Find unique string roles from User documents
 * @returns {Promise<Set>} Set of unique role strings
 */
const findUniqueStringRolesFromUsers = async () => {
    console.log('🔍 Step 2: Finding unique string roles from Users...\n');
    
    // Find all users and check their role type
    const allUsers = await User.find({}).select('role');
    
    const usersWithStringRoles = [];
    const uniqueRoles = new Set();
    
    allUsers.forEach(user => {
        // Check if role is a string (not ObjectId, not null/undefined)
        if (user.role && typeof user.role === 'string' && !mongoose.Types.ObjectId.isValid(user.role)) {
            usersWithStringRoles.push(user);
            uniqueRoles.add(user.role);
        }
    });
    
    console.log(`  📊 Found ${usersWithStringRoles.length} users with string roles`);
    if (uniqueRoles.size > 0) {
        console.log(`  📊 Unique role strings: ${Array.from(uniqueRoles).join(', ')}`);
    } else {
        console.log(`  📊 No string roles found (all roles are ObjectIds or null)`);
    }
    console.log('');
    
    return uniqueRoles;
};

/**
 * Find unique string roles from Permission documents
 * @returns {Promise<Set>} Set of unique role strings
 */
const findUniqueStringRolesFromPermissions = async () => {
    console.log('🔍 Step 3: Finding unique string roles from Permissions...\n');
    
    // Find all permissions and check their role type
    const allPermissions = await Permission.find({ role: { $exists: true } }).select('role');
    
    const permissionsWithStringRoles = [];
    const uniqueRoles = new Set();
    
    allPermissions.forEach(perm => {
        // Check if role is a string (not ObjectId, not null/undefined)
        if (perm.role && typeof perm.role === 'string' && !mongoose.Types.ObjectId.isValid(perm.role)) {
            permissionsWithStringRoles.push(perm);
            uniqueRoles.add(perm.role);
        }
    });
    
    console.log(`  📊 Found ${permissionsWithStringRoles.length} permissions with string roles`);
    if (uniqueRoles.size > 0) {
        console.log(`  📊 Unique role strings: ${Array.from(uniqueRoles).join(', ')}`);
    } else {
        console.log(`  📊 No string roles found (all roles are ObjectIds or null)`);
    }
    console.log('');
    
    return uniqueRoles;
};

/**
 * Find unique string roles from Page documents
 * @returns {Promise<Set>} Set of unique role strings
 */
const findUniqueStringRolesFromPages = async () => {
    console.log('🔍 Step 4: Finding unique string roles from Pages...\n');
    
    // Find pages with string allowedRoles
    const pagesWithStringRoles = await Page.find({
        'permissions.allowedRoles': { $type: 'string' }
    }).select('permissions.allowedRoles');
    
    const uniqueRoles = new Set();
    pagesWithStringRoles.forEach(page => {
        if (page.permissions && page.permissions.allowedRoles) {
            page.permissions.allowedRoles.forEach(role => {
                if (typeof role === 'string') {
                    uniqueRoles.add(role);
                }
            });
        }
    });
    
    console.log(`  📊 Found ${pagesWithStringRoles.length} pages with string allowedRoles`);
    console.log(`  📊 Unique role strings: ${Array.from(uniqueRoles).join(', ')}\n`);
    
    return uniqueRoles;
};

/**
 * Create roles for found string roles (if not in default roles)
 * @param {Set} stringRoles - Set of unique role strings
 * @param {Map} defaultRoleMap - Map of default role slugs to ObjectIds
 * @returns {Promise<Map>} Complete map of role slug to ObjectId
 */
const createRolesFromStrings = async (stringRoles, defaultRoleMap) => {
    console.log('📝 Step 5: Creating roles for found string roles...\n');
    
    const allRoleMap = new Map(defaultRoleMap);
    let createdCount = 0;
    
    for (const roleString of stringRoles) {
        // Skip if already in default roles
        if (defaultRoleMap.has(roleString)) {
            continue;
        }
        
        // Check if role already exists
        let role = await Role.findOne({ slug: roleString });
        
        if (!role) {
            // Create new role from string
            const roleName = roleString
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            
            role = await Role.create({
                name: roleName,
                slug: roleString,
                description: `Auto-created role from migration: ${roleString}`,
                level: 20, // Default level for custom roles
                color: 'default',
                isSystem: false
            });
            
            console.log(`  ✅ Created role: ${roleName} (${roleString})`);
            createdCount++;
        } else {
            console.log(`  ⚠️  Role "${roleString}" already exists, skipping creation`);
        }
        
        allRoleMap.set(roleString, role._id);
    }
    
    if (createdCount === 0) {
        console.log('  ℹ️  No additional roles needed to be created\n');
    } else {
        console.log(`\n  ✅ Created ${createdCount} additional roles\n`);
    }
    
    return allRoleMap;
};

/**
 * Update User documents to use Role ObjectIds
 * @param {Map} roleMap - Map of role slug to ObjectId
 */
const updateUserReferences = async (roleMap) => {
    console.log('🔄 Step 6: Updating User documents...\n');
    
    // Find all users and filter those with string roles
    const allUsers = await User.find({});
    const usersWithStringRoles = allUsers.filter(user => {
        return user.role && typeof user.role === 'string' && !mongoose.Types.ObjectId.isValid(user.role);
    });
    
    if (usersWithStringRoles.length === 0) {
        console.log('  ℹ️  No users with string roles found\n');
        return;
    }
    
    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const user of usersWithStringRoles) {
        try {
            const oldRole = user.role;
            
            // Validate oldRole is a valid string
            if (!oldRole || typeof oldRole !== 'string') {
                console.log(`  ⚠️  User ${user._id}: Invalid role value "${oldRole}", skipping`);
                skippedCount++;
                continue;
            }
            
            // Store for rollback
            rollbackData.users.push({
                userId: user._id,
                oldRole: oldRole
            });
            
            // Get role ObjectId
            const roleId = roleMap.get(oldRole);
            
            if (!roleId) {
                console.log(`  ⚠️  User ${user._id}: Role "${oldRole}" not found in role map, skipping`);
                errorCount++;
                continue;
            }
            
            // Update user role
            user.role = roleId;
            await user.save();
            
            updatedCount++;
            
            if (updatedCount % 10 === 0) {
                process.stdout.write(`  ✅ Updated ${updatedCount} users...\r`);
            }
        } catch (error) {
            console.error(`  ❌ Error updating user ${user._id}:`, error.message);
            errorCount++;
        }
    }
    
    console.log(`\n  ✅ Updated ${updatedCount} users`);
    if (skippedCount > 0) {
        console.log(`  ⚠️  ${skippedCount} users skipped (invalid role values)`);
    }
    if (errorCount > 0) {
        console.log(`  ⚠️  ${errorCount} users had errors\n`);
    } else {
        console.log('');
    }
};

/**
 * Update Permission documents to use Role ObjectIds
 * @param {Map} roleMap - Map of role slug to ObjectId
 */
const updatePermissionReferences = async (roleMap) => {
    console.log('🔄 Step 7: Updating Permission documents...\n');
    
    // Find all permissions with role field and filter those with string roles
    const allPermissions = await Permission.find({ role: { $exists: true } });
    const permissionsWithStringRoles = allPermissions.filter(perm => {
        return perm.role && typeof perm.role === 'string' && !mongoose.Types.ObjectId.isValid(perm.role);
    });
    
    if (permissionsWithStringRoles.length === 0) {
        console.log('  ℹ️  No permissions with string roles found\n');
        return;
    }
    
    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const perm of permissionsWithStringRoles) {
        try {
            const oldRole = perm.role;
            
            // Validate oldRole is a valid string
            if (!oldRole || typeof oldRole !== 'string') {
                console.log(`  ⚠️  Permission ${perm._id}: Invalid role value "${oldRole}", skipping`);
                skippedCount++;
                continue;
            }
            
            // Store for rollback
            rollbackData.permissions.push({
                permissionId: perm._id,
                oldRole: oldRole
            });
            
            // Get role ObjectId
            const roleId = roleMap.get(oldRole);
            
            if (!roleId) {
                console.log(`  ⚠️  Permission ${perm._id}: Role "${oldRole}" not found in role map, skipping`);
                errorCount++;
                continue;
            }
            
            // Update permission role
            perm.role = roleId;
            await perm.save();
            
            updatedCount++;
            
            if (updatedCount % 50 === 0) {
                process.stdout.write(`  ✅ Updated ${updatedCount} permissions...\r`);
            }
        } catch (error) {
            console.error(`  ❌ Error updating permission ${perm._id}:`, error.message);
            errorCount++;
        }
    }
    
    console.log(`\n  ✅ Updated ${updatedCount} permissions`);
    if (skippedCount > 0) {
        console.log(`  ⚠️  ${skippedCount} permissions skipped (invalid role values)`);
    }
    if (errorCount > 0) {
        console.log(`  ⚠️  ${errorCount} permissions had errors\n`);
    } else {
        console.log('');
    }
};

/**
 * Update Page documents to use Role ObjectIds in allowedRoles
 * @param {Map} roleMap - Map of role slug to ObjectId
 */
const updatePageReferences = async (roleMap) => {
    console.log('🔄 Step 8: Updating Page documents...\n');
    
    // Find all pages with string allowedRoles
    const pages = await Page.find({
        'permissions.allowedRoles': { $type: 'string' }
    });
    
    if (pages.length === 0) {
        console.log('  ℹ️  No pages with string allowedRoles found\n');
        return;
    }
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const page of pages) {
        try {
            if (!page.permissions || !page.permissions.allowedRoles) {
                continue;
            }
            
            const oldAllowedRoles = [...page.permissions.allowedRoles];
            
            // Store for rollback
            rollbackData.pages.push({
                pageId: page._id,
                oldAllowedRoles: oldAllowedRoles.filter(r => typeof r === 'string')
            });
            
            // Convert string roles to ObjectIds
            const updatedAllowedRoles = page.permissions.allowedRoles.map(role => {
                if (typeof role === 'string') {
                    const roleId = roleMap.get(role);
                    if (!roleId) {
                        console.log(`  ⚠️  Page ${page._id}: Role "${role}" not found in role map, keeping as string`);
                        return role; // Keep as string if role not found
                    }
                    return roleId;
                }
                return role; // Already ObjectId
            });
            
            // Update page allowedRoles
            page.permissions.allowedRoles = updatedAllowedRoles;
            await page.save();
            
            updatedCount++;
            
            if (updatedCount % 10 === 0) {
                process.stdout.write(`  ✅ Updated ${updatedCount} pages...\r`);
            }
        } catch (error) {
            console.error(`  ❌ Error updating page ${page._id}:`, error.message);
            errorCount++;
        }
    }
    
    console.log(`\n  ✅ Updated ${updatedCount} pages`);
    if (errorCount > 0) {
        console.log(`  ⚠️  ${errorCount} pages had errors\n`);
    } else {
        console.log('');
    }
};

/**
 * Verify migration
 */
const verifyMigration = async () => {
    console.log('🔍 Step 9: Verifying migration...\n');
    
    // Check for remaining string roles in Users
    const allUsers = await User.find({}).select('_id role');
    const usersWithStringRoles = allUsers.filter(user => {
        return user.role && typeof user.role === 'string' && !mongoose.Types.ObjectId.isValid(user.role);
    });
    
    if (usersWithStringRoles.length > 0) {
        console.log(`  ⚠️  Found ${usersWithStringRoles.length} users still with string roles:`);
        usersWithStringRoles.slice(0, 5).forEach(user => {
            console.log(`    - User ${user._id}: role = "${user.role}"`);
        });
        if (usersWithStringRoles.length > 5) {
            console.log(`    ... and ${usersWithStringRoles.length - 5} more`);
        }
        console.log('');
    } else {
        console.log('  ✅ All users now use Role ObjectId references\n');
    }
    
    // Check for remaining string roles in Permissions
    const allPermissions = await Permission.find({ role: { $exists: true } }).select('_id role');
    const permissionsWithStringRoles = allPermissions.filter(perm => {
        return perm.role && typeof perm.role === 'string' && !mongoose.Types.ObjectId.isValid(perm.role);
    });
    
    if (permissionsWithStringRoles.length > 0) {
        console.log(`  ⚠️  Found ${permissionsWithStringRoles.length} permissions still with string roles:`);
        permissionsWithStringRoles.slice(0, 5).forEach(perm => {
            console.log(`    - Permission ${perm._id}: role = "${perm.role}"`);
        });
        if (permissionsWithStringRoles.length > 5) {
            console.log(`    ... and ${permissionsWithStringRoles.length - 5} more`);
        }
        console.log('');
    } else {
        console.log('  ✅ All permissions now use Role ObjectId references\n');
    }
    
    // Check for remaining string roles in Pages
    const allPages = await Page.find({ 'permissions.allowedRoles': { $exists: true } }).select('permissions.allowedRoles');
    const pagesWithStringRoles = allPages.filter(page => {
        if (!page.permissions || !page.permissions.allowedRoles) return false;
        return page.permissions.allowedRoles.some(role => {
            return typeof role === 'string' && !mongoose.Types.ObjectId.isValid(role);
        });
    });
    
    if (pagesWithStringRoles.length > 0) {
        console.log(`  ⚠️  Found ${pagesWithStringRoles.length} pages still with string allowedRoles\n`);
    } else {
        console.log('  ✅ All pages now use Role ObjectId references\n');
    }
    
    // Count roles
    const roleCount = await Role.countDocuments({ isActive: true });
    const systemRoleCount = await Role.countDocuments({ isSystem: true });
    console.log(`  ✅ Total active roles: ${roleCount}`);
    console.log(`  ✅ System roles: ${systemRoleCount}\n`);
};

/**
 * Rollback migration (restore string roles)
 */
const rollbackMigration = async () => {
    console.log('🔄 Rolling back migration...\n');
    
    try {
        // Rollback Users
        if (rollbackData.users.length > 0) {
            console.log('  🔄 Rolling back Users...');
            for (const userData of rollbackData.users) {
                await User.updateOne(
                    { _id: userData.userId },
                    { $set: { role: userData.oldRole } }
                );
            }
            console.log(`  ✅ Rolled back ${rollbackData.users.length} users\n`);
        }
        
        // Rollback Permissions
        if (rollbackData.permissions.length > 0) {
            console.log('  🔄 Rolling back Permissions...');
            for (const permData of rollbackData.permissions) {
                await Permission.updateOne(
                    { _id: permData.permissionId },
                    { $set: { role: permData.oldRole } }
                );
            }
            console.log(`  ✅ Rolled back ${rollbackData.permissions.length} permissions\n`);
        }
        
        // Rollback Pages
        if (rollbackData.pages.length > 0) {
            console.log('  🔄 Rolling back Pages...');
            for (const pageData of rollbackData.pages) {
                await Page.updateOne(
                    { _id: pageData.pageId },
                    { $set: { 'permissions.allowedRoles': pageData.oldAllowedRoles } }
                );
            }
            console.log(`  ✅ Rolled back ${rollbackData.pages.length} pages\n`);
        }
        
        // Delete created roles (only non-system roles)
        if (rollbackData.roles.length > 0) {
            console.log('  🔄 Deleting created roles...');
            for (const roleId of rollbackData.roles) {
                await Role.deleteOne({ _id: roleId, isSystem: false });
            }
            console.log(`  ✅ Deleted ${rollbackData.roles.length} created roles\n`);
        }
        
        console.log('✅ Rollback completed\n');
    } catch (error) {
        console.error('❌ Error during rollback:', error);
        throw error;
    }
};

/**
 * Main migration function
 */
const migrateRoles = async () => {
    try {
        // Check if MONGODB_URI is defined
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables. Please create a .env file in the backend directory with MONGODB_URI=your_connection_string');
        }

        console.log('🚀 Starting Role Migration...\n');
        console.log('='.repeat(60));
        console.log('This will:');
        console.log('  1. Create Role documents for system roles');
        console.log('  2. Find unique string roles from Users, Permissions, and Pages');
        console.log('  3. Create Role documents for found roles');
        console.log('  4. Update User documents to reference Role ObjectIds');
        console.log('  5. Update Permission documents to reference Role ObjectIds');
        console.log('  6. Update Page documents to reference Role ObjectIds');
        console.log('  7. Preserve all existing data');
        console.log('='.repeat(60));
        console.log('');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Step 1: Create default system roles
        const defaultRoleMap = await createDefaultRoles();

        // Step 2-4: Find unique string roles from all sources
        const userRoles = await findUniqueStringRolesFromUsers();
        const permissionRoles = await findUniqueStringRolesFromPermissions();
        const pageRoles = await findUniqueStringRolesFromPages();

        // Combine all unique roles
        const allStringRoles = new Set([...userRoles, ...permissionRoles, ...pageRoles]);

        // Step 5: Create roles for found string roles
        const allRoleMap = await createRolesFromStrings(allStringRoles, defaultRoleMap);

        // Step 6-8: Update references
        await updateUserReferences(allRoleMap);
        await updatePermissionReferences(allRoleMap);
        await updatePageReferences(allRoleMap);

        // Step 9: Verify migration
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
        
        // Ask if user wants to rollback
        console.log('\n⚠️  Migration failed. Rollback data has been saved.');
        console.log('To rollback, run: node scripts/migrateRoles.js --rollback');
        
        process.exit(1);
    }
};

// Run migration if called directly
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--rollback')) {
        // Rollback mode
        (async () => {
            try {
                if (!process.env.MONGODB_URI) {
                    throw new Error('MONGODB_URI is not defined');
                }
                await mongoose.connect(process.env.MONGODB_URI);
                await rollbackMigration();
                await mongoose.connection.close();
                process.exit(0);
            } catch (error) {
                console.error('❌ Rollback failed:', error);
                process.exit(1);
            }
        })();
    } else {
        migrateRoles();
    }
}

module.exports = { migrateRoles, defaultRoles };

