# Complete Testing Guide - Dynamic Roles and Permissions System

This guide will walk you through testing all the functionality we've created for the dynamic roles and permissions system.

## Prerequisites

1. **Delete your database** (or use a fresh database)
2. **Ensure backend is set up** with all dependencies installed
3. **Ensure frontend is set up** with all dependencies installed

## Step 1: Initial Setup - Create Super Admin

### 1.1 Run the Setup Script

```bash
cd backend
npm run setup:superadmin
```

This script will:
- ✅ Create all system roles (super_admin, admin, approver, reviewer, editor, viewer)
- ✅ Create all default resources (Users, Permissions, Pages, Sections, etc.)
- ✅ Create a super admin user
- ✅ Assign ALL permissions to super_admin role for ALL resources

### 1.2 Default Super Admin Credentials

The script creates a super admin with these default credentials:
- **Email**: `admin@acero.com` (or set `SUPER_ADMIN_EMAIL` in `.env`)
- **Password**: `Admin@123` (or set `SUPER_ADMIN_PASSWORD` in `.env`)
- **Name**: Super Admin (or set `SUPER_ADMIN_FIRST_NAME` and `SUPER_ADMIN_LAST_NAME` in `.env`)

### 1.3 Verify Setup

After running the script, you should see:
- ✅ 6 roles created
- ✅ 13 resources created
- ✅ 1 super admin user created
- ✅ All permissions assigned to super_admin

## Step 2: Start the Application

### 2.1 Start Backend

```bash
cd backend
npm run dev
```

Backend should start on `http://localhost:4000`

### 2.2 Start Frontend

```bash
cd admin-panel
npm start
```

Frontend should start on `http://localhost:3000`

## Step 3: Login as Super Admin

1. Navigate to `http://localhost:3000`
2. Login with super admin credentials:
   - Email: `admin@acero.com`
   - Password: `Admin@123`
3. You should be redirected to the Dashboard

## Step 4: Test Resource Management

### 4.1 Access Resources Page

1. Navigate to `/resources` (or click Resources in sidebar if visible)
2. You should see all default resources listed
3. Verify you can see:
   - Users
   - Permissions
   - Roles
   - Resources
   - Pages
   - Page Tree
   - Sections
   - Section Types
   - Products
   - Projects
   - Media
   - Activity Logs
   - Workflow

### 4.2 Create a New Resource

1. Click "Create Resource" button
2. Fill in the form:
   - Name: `Test Resource`
   - Slug: `test_resource` (auto-generated)
   - Path: `/test-resource`
   - Icon: Select any icon
   - Description: `Test resource for testing`
   - Category: `Testing`
   - Show in Menu: `Yes`
   - Order: `20`
   - Active: `Yes`
3. Click "Create Resource"
4. Verify the resource appears in the list

### 4.3 Edit a Resource

1. Click the three dots menu on any resource
2. Click "Edit"
3. Modify some fields (e.g., description, order)
4. Click "Update Resource"
5. Verify changes are saved

### 4.4 Delete a Resource

1. Click the three dots menu on a resource
2. Click "Delete"
3. Confirm deletion
4. Verify the resource is removed

## Step 5: Test Role Management

### 5.1 Access Roles Page

1. Navigate to `/roles` (or click Roles in sidebar)
2. You should see all 6 system roles listed:
   - Super Admin
   - Admin
   - Approver
   - Reviewer
   - Editor
   - Viewer

### 5.2 View Role Details

1. Click on any role card
2. Verify you can see:
   - Role name
   - Slug
   - Description
   - Level
   - Status (Active/Inactive)
   - System badge (for system roles)

### 5.3 Create a New Role

1. Click "Create Role" button
2. Fill in the form:
   - Name: `Test Role`
   - Slug: `test_role` (auto-generated)
   - Description: `Test role for testing`
   - Level: `30`
   - Color: Select a color
   - Active: `Yes`
3. Click "Create Role"
4. Verify the role appears in the list

### 5.4 Edit a Role

1. Click the three dots menu on a custom role (not system role)
2. Click "Edit"
3. Modify some fields (e.g., description, level)
4. Click "Update Role"
5. Verify changes are saved
6. **Note**: System roles cannot have their slug changed

### 5.5 Delete a Role

1. Click the three dots menu on a custom role
2. Click "Delete"
3. Check usage statistics (users, permissions, pages)
4. Confirm deletion if no usage
5. Verify the role is removed
6. **Note**: System roles cannot be deleted

## Step 6: Test Permission Management

### 6.1 Access Permissions Page

1. Navigate to `/permissions`
2. You should see role cards for all roles
3. Each card shows:
   - Role name and description
   - Resource count
   - Permission count
   - Level

### 6.2 View Role Permissions

1. Click "View Permissions" on any role card
2. You should navigate to `/permissions/role/{roleId}`
3. Verify you can see:
   - Role information card
   - Users in that role
   - User management options

### 6.3 Assign Permissions to a Role

1. Navigate to `/permissions/role/{roleId}` for any role
2. Look for permission toggles (if available in the UI)
3. Or use the API to assign permissions:
   ```bash
   POST /api/permissions/role/{roleId}
   {
     "permissions": [
       {
         "resource": "resourceId",
         "actions": ["create", "read", "update"]
       }
     ]
   }
   ```

## Step 7: Test User Management

### 7.1 Access Users Page

1. Navigate to `/users`
2. You should see the super admin user listed
3. Verify user details:
   - Name: Super Admin
   - Email: admin@acero.com
   - Role: Super Admin (with badge)
   - Status: Active

### 7.2 Create a New User

1. Click "Create User" button
2. Fill in the form:
   - First Name: `Test`
   - Last Name: `User`
   - Email: `test@example.com`
   - Password: `Test@123`
   - Role: Select any role from dropdown (should show role names, not slugs)
3. Click "Create User"
4. Verify the user appears in the list

### 7.3 Edit a User

1. Click the three dots menu on a user
2. Click "Edit"
3. Modify some fields (e.g., first name, last name)
4. Click "Update User"
5. Verify changes are saved

### 7.4 Change User Role

1. Click the three dots menu on a user (not super admin)
2. Click "Change Role"
3. Select a different role from the buttons
4. Verify the role is updated
5. Check the user's role badge in the table

### 7.5 Manage User Permissions

1. Navigate to `/permissions/role/{roleId}` for a role that has users
2. Find a user in the "Users in Role" section
3. Click the three dots menu on the user
4. Click "Manage Permissions"
5. You should see a modal with permission toggles for all resources
6. Toggle some permissions on/off
7. Click "Save Changes"
8. Verify permissions are saved

### 7.6 Test User-Specific Permissions

1. Create a user with "Editor" role
2. Navigate to `/permissions/role/{editorRoleId}`
3. Find the user and click "Manage Permissions"
4. Give the user "approve" permission on "pages" resource
5. Logout and login as that user
6. Verify the user can now approve pages (even though their role doesn't have approve permission)

## Step 8: Test Dynamic Sidebar

### 8.1 Verify Sidebar Items

1. As super admin, check the sidebar
2. You should see:
   - Dashboard (always visible)
   - Roles (super admin only)
   - All resources that have `showInMenu: true`
3. Verify icons are displayed correctly

### 8.2 Test Resource Visibility

1. Create a new resource with `showInMenu: true`
2. Refresh the page
3. Verify the resource appears in the sidebar
4. Create a resource with `showInMenu: false`
5. Refresh the page
6. Verify the resource does NOT appear in the sidebar

### 8.3 Test Permission-Based Visibility

1. Create a user with limited permissions
2. Login as that user
3. Verify only resources the user has "read" permission for appear in the sidebar
4. Verify Dashboard is always visible

## Step 9: Test Workflow Permissions

### 9.1 Create Content with Workflow

1. Navigate to `/pages`
2. Create a new page
3. Verify workflow states: DRAFT → IN_REVIEW → PENDING_APPROVAL → PENDING_PUBLISH → PUBLISHED

### 9.2 Test Review Permission

1. Create a user with "reviewer" role
2. Assign "review" permission on "workflow" resource to that role
3. Login as that user
4. Try to transition a page from DRAFT to IN_REVIEW
5. Verify the transition works (user has review permission)

### 9.3 Test Approve Permission

1. Create a user with "approver" role
2. Assign "approve" permission on "workflow" resource to that role
3. Login as that user
4. Try to transition a page from PENDING_APPROVAL to PENDING_PUBLISH
5. Verify the transition works (user has approve permission)

### 9.4 Test Publish Permission

1. Create a user with "publisher" role (or assign publish permission)
2. Assign "publish" permission on "workflow" resource to that role
3. Login as that user
4. Try to transition a page from PENDING_PUBLISH to PUBLISHED
5. Verify the transition works (user has publish permission)

## Step 10: Test API Endpoints

### 10.1 Test Role API

```bash
# Get all roles
GET /api/roles

# Get role by ID
GET /api/roles/{roleId}

# Get role by slug
GET /api/roles/slug/super_admin

# Create role (super admin only)
POST /api/roles
{
  "name": "Test Role",
  "slug": "test_role",
  "description": "Test",
  "level": 30,
  "color": "blue",
  "isActive": true
}

# Update role (super admin only)
PUT /api/roles/{roleId}
{
  "description": "Updated description"
}

# Delete role (super admin only)
DELETE /api/roles/{roleId}

# Get role usage
GET /api/roles/{roleId}/usage
```

### 10.2 Test Resource API

```bash
# Get all resources
GET /api/resources

# Get resource by ID
GET /api/resources/{resourceId}

# Get menu resources
GET /api/resources/menu

# Create resource (super admin only)
POST /api/resources
{
  "name": "Test Resource",
  "slug": "test_resource",
  "path": "/test",
  "icon": "TestOutlined",
  "isActive": true
}
```

### 10.3 Test Permission API

```bash
# Get all permissions
GET /api/permissions

# Get role permissions
GET /api/permissions/role/{roleId}

# Update role permissions
PUT /api/permissions/role/{roleId}
{
  "permissions": [...]
}

# Get user permissions
GET /api/permissions/user/{userId}

# Update user permissions
PUT /api/permissions/user/{userId}
{
  "permissions": [...]
}

# Check user permission
GET /api/permissions/check?userId={userId}&resource={resource}&action={action}
```

## Step 11: Test Edge Cases

### 11.1 Test System Role Protection

1. Try to edit a system role's slug
2. Verify it's not allowed
3. Try to delete a system role
4. Verify it's not allowed

### 11.2 Test Role Usage

1. Create a role
2. Assign it to a user
3. Try to delete the role
4. Verify usage warning is shown
5. Verify deletion is prevented if role is in use

### 11.3 Test Permission Merging

1. Create a user with "Editor" role
2. Give the role "read" and "update" permissions on "pages"
3. Give the user "approve" permission on "pages" (user-specific override)
4. Login as that user
5. Verify the user has: read, update, and approve permissions
6. Verify user-specific permission overrides role permission

### 11.4 Test Super Admin Access

1. As super admin, verify you can:
   - Access all pages
   - Create/edit/delete all resources
   - Create/edit/delete all roles
   - Manage all users
   - Assign all permissions

## Step 12: Test Migration Scripts (Optional)

If you want to test the migration scripts:

```bash
# Migrate resources (if you have old string-based resources)
npm run migrate:resources

# Migrate roles (if you have old string-based roles)
npm run migrate:roles
```

## Troubleshooting

### Issue: Super admin can't see sidebar items

**Solution**: 
1. Check if resources are created: `GET /api/resources`
2. Check if permissions are assigned: `GET /api/permissions/role/{superAdminRoleId}`
3. Check browser console for errors
4. Verify `menuResources` in PermissionContext

### Issue: User can't access a resource

**Solution**:
1. Check user's role permissions: `GET /api/permissions/role/{roleId}`
2. Check user-specific permissions: `GET /api/permissions/user/{userId}`
3. Verify resource exists and is active
4. Check if user has "read" permission for that resource

### Issue: Role dropdown is empty

**Solution**:
1. Check if roles are created: `GET /api/roles`
2. Check browser console for API errors
3. Verify roleService is working
4. Check network tab for failed requests

## Success Criteria

✅ All system roles are created
✅ All default resources are created
✅ Super admin user can login
✅ Super admin has all permissions
✅ Resources can be created/edited/deleted
✅ Roles can be created/edited/deleted
✅ Users can be created/edited/deleted
✅ Permissions can be assigned to roles
✅ User-specific permissions can be assigned
✅ Sidebar shows correct items based on permissions
✅ Workflow transitions work with permissions
✅ API endpoints return correct data
✅ All edge cases are handled properly

## Next Steps

After testing:
1. Create additional resources as needed
2. Create custom roles for your organization
3. Assign appropriate permissions to roles
4. Create users and assign roles
5. Fine-tune user-specific permissions as needed

---

**Happy Testing! 🚀**

