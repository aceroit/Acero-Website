const mongoose = require('mongoose');
const Permission = require('../models/Permission');
require('dotenv').config();

const defaultPermissions = [
    // ==================== SUPER ADMIN ====================
    // Super admin has all permissions on all resources
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
        resource: 'activity_logs',
        actions: ['read', 'delete'],
        conditions: {},
        isActive: true
    },

    // ==================== ADMIN ====================
    // Admin has most permissions but cannot manage super admins or system permissions
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
        actions: ['read'],
        conditions: {},
        isActive: true
    },
    {
        role: 'admin',
        resource: 'pages',
        actions: ['create', 'read', 'update', 'delete', 'publish'],
        conditions: {},
        isActive: true
    },
    {
        role: 'admin',
        resource: 'sections',
        actions: ['create', 'read', 'update', 'delete', 'publish'],
        conditions: {},
        isActive: true
    },
    {
        role: 'admin',
        resource: 'section_types',
        actions: ['read'],
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

    // ==================== APPROVER ====================
    // Approver can approve content but not publish
    {
        role: 'approver',
        resource: 'users',
        actions: ['read'],
        conditions: {},
        isActive: true
    },
    {
        role: 'approver',
        resource: 'permissions',
        actions: ['read'],
        conditions: {},
        isActive: true
    },
    {
        role: 'approver',
        resource: 'pages',
        actions: ['read', 'update', 'approve'],
        conditions: {},
        isActive: true
    },
    {
        role: 'approver',
        resource: 'sections',
        actions: ['read', 'update', 'approve'],
        conditions: {},
        isActive: true
    },
    {
        role: 'approver',
        resource: 'section_types',
        actions: ['read'],
        conditions: {},
        isActive: true
    },
    {
        role: 'approver',
        resource: 'activity_logs',
        actions: ['read'],
        conditions: { ownOnly: true },
        isActive: true
    },

    // ==================== REVIEWER ====================
    // Reviewer can review content and provide feedback
    {
        role: 'reviewer',
        resource: 'users',
        actions: ['read'],
        conditions: {},
        isActive: true
    },
    {
        role: 'reviewer',
        resource: 'permissions',
        actions: ['read'],
        conditions: {},
        isActive: true
    },
    {
        role: 'reviewer',
        resource: 'pages',
        actions: ['read', 'update'],
        conditions: {},
        isActive: true
    },
    {
        role: 'reviewer',
        resource: 'sections',
        actions: ['read', 'update'],
        conditions: {},
        isActive: true
    },
    {
        role: 'reviewer',
        resource: 'section_types',
        actions: ['read'],
        conditions: {},
        isActive: true
    },
    {
        role: 'reviewer',
        resource: 'activity_logs',
        actions: ['read'],
        conditions: { ownOnly: true },
        isActive: true
    },

    // ==================== EDITOR ====================
    // Editor can create and edit own content
    {
        role: 'editor',
        resource: 'users',
        actions: ['read'],
        conditions: { ownOnly: true },
        isActive: true
    },
    {
        role: 'editor',
        resource: 'permissions',
        actions: [],
        conditions: {},
        isActive: true
    },
    {
        role: 'editor',
        resource: 'pages',
        actions: ['create', 'read', 'update'],
        conditions: { ownOnly: true },
        isActive: true
    },
    {
        role: 'editor',
        resource: 'sections',
        actions: ['create', 'read', 'update'],
        conditions: { ownOnly: true },
        isActive: true
    },
    {
        role: 'editor',
        resource: 'section_types',
        actions: ['read'],
        conditions: {},
        isActive: true
    },
    {
        role: 'editor',
        resource: 'activity_logs',
        actions: ['read'],
        conditions: { ownOnly: true },
        isActive: true
    },

    // ==================== VIEWER ====================
    // Viewer has read-only access
    {
        role: 'viewer',
        resource: 'users',
        actions: ['read'],
        conditions: { ownOnly: true },
        isActive: true
    },
    {
        role: 'viewer',
        resource: 'permissions',
        actions: [],
        conditions: {},
        isActive: true
    },
    {
        role: 'viewer',
        resource: 'pages',
        actions: ['read'],
        conditions: {},
        isActive: true
    },
    {
        role: 'viewer',
        resource: 'sections',
        actions: ['read'],
        conditions: {},
        isActive: true
    },
    {
        role: 'viewer',
        resource: 'section_types',
        actions: ['read'],
        conditions: {},
        isActive: true
    },
    {
        role: 'viewer',
        resource: 'activity_logs',
        actions: [],
        conditions: {},
        isActive: true
    }
];

const seedPermissions = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing permissions
        await Permission.deleteMany({});
        console.log('Cleared existing permissions');

        // Insert default permissions
        await Permission.insertMany(defaultPermissions);
        console.log(`Successfully seeded ${defaultPermissions.length} permissions`);

        // Display summary
        const roles = ['super_admin', 'admin', 'approver', 'reviewer', 'editor', 'viewer'];
        console.log('\nPermissions Summary:');
        console.log('===================');
        
        for (const role of roles) {
            const count = await Permission.countDocuments({ role });
            console.log(`${role}: ${count} permissions`);
        }

        process.exit(0);

    } catch (error) {
        console.error('Error seeding permissions:', error);
        process.exit(1);
    }
};

// Run seeder if called directly
if (require.main === module) {
    seedPermissions();
}

module.exports = { seedPermissions, defaultPermissions };

