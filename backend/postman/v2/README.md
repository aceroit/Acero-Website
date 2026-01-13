# V2 - Dynamic Resources & User Permissions Postman Collection

## Overview

This collection provides comprehensive testing for the Dynamic Resources and User Permissions System. It covers the complete flow from user creation to permission assignment and verification.

## Prerequisites

1. **Empty Database**: Start with a fresh, empty MongoDB database
2. **Backend Running**: Ensure the backend server is running on `http://localhost:5000` (or update `base_url` in environment)
3. **Environment Imported**: Import the `ACERO_CMS_Environment.postman_environment.json` file

## Collection Structure

### 01 - Setup: User Creation
- Register Super Admin (first user)
- Login Super Admin
- Register Admin User
- Register Editor User

**Purpose**: Create the initial users needed for testing. Super Admin is required to create resources and manage permissions.

### 02 - Create Resources
- Create Dashboard Resource
- Create Users Resource
- Create Permissions Resource
- Create Pages Resource
- Create Page Tree Resource (child of Pages)
- Create Section Types Resource
- Create Resources Resource
- Get All Resources
- Get Menu Resources

**Purpose**: Create all default resources that will appear in the sidebar and be used for permission management.

### 03 - Assign Role Permissions
- Get Resources and Actions
- Assign Admin Role Permissions
- Assign Editor Role Permissions
- Get Admin Role Permissions

**Purpose**: Set up role-based permissions. This defines what each role can do by default.

### 04 - User-Specific Permissions
- Get Users by Role (Admin)
- Get User Permissions (Admin User)
- Update User-Specific Permissions (Give Admin Delete Permission)
- Verify User Permissions After Update

**Purpose**: Test user-specific permission overrides. This allows individual users to have different permissions than their role.

### 05 - Verify Dynamic Sidebar
- Login as Admin
- Get My Permissions (Admin)
- Get Menu Resources (Admin)
- Check Permission (Admin - Users Delete)

**Purpose**: Verify that the dynamic sidebar correctly filters resources based on user permissions (role + user overrides).

### 06 - Resource CRUD Operations
- Create New Resource
- Get Resource by ID
- Update Resource
- Get Resource Tree
- Delete Resource

**Purpose**: Test all CRUD operations for resources to ensure the system works correctly.

## Usage Instructions

### Step 1: Import Collection and Environment
1. Open Postman
2. Import `Dynamic_Resources_User_Permissions.postman_collection.json`
3. Import `ACERO_CMS_Environment.postman_environment.json`
4. Select the environment in Postman

### Step 2: Run Collection in Order
**Important**: Run the folders in order (01 → 02 → 03 → 04 → 05 → 06)

You can:
- Run individual requests manually
- Run entire folders using "Run folder"
- Run the entire collection using "Run collection"

### Step 3: Verify Results
After running the collection:
1. Check that all tests pass (green checkmarks)
2. Verify environment variables are set (tokens, IDs)
3. Test the frontend to see the dynamic sidebar

## Environment Variables

The collection automatically sets these variables:
- `super_admin_token` - Authentication token for super admin
- `super_admin_id` - User ID of super admin
- `admin_id` - User ID of admin user
- `editor_id` - User ID of editor user
- `admin_token` - Authentication token for admin
- `resource_*_id` - IDs of created resources
- `new_resource_id` - ID of test resource created in CRUD section

## Expected Results

### After Step 01 (User Creation)
- 3 users created: Super Admin, Admin, Editor
- All users can log in successfully

### After Step 02 (Resources)
- 7 resources created
- Resources include Dashboard, Users, Permissions, Pages, Page Tree, Section Types, Resources
- Page Tree is a child of Pages (hierarchical structure)

### After Step 03 (Role Permissions)
- Admin role has permissions for: Dashboard (read), Users (read/create/update), Pages (all), Section Types (read)
- Editor role has permissions for: Dashboard (read), Pages (read/create/update)

### After Step 04 (User Permissions)
- Admin user has additional delete permission for Users (user-specific override)
- User permissions override role permissions

### After Step 05 (Sidebar Verification)
- Admin user sees only resources they have 'read' permission for
- Menu resources are filtered correctly
- Permission checks work with merged permissions (role + user)

### After Step 06 (CRUD)
- All CRUD operations work correctly
- Resource tree shows hierarchical structure
- Resources can be created, read, updated, and deleted

## Troubleshooting

### Issue: "User already exists"
- **Solution**: Empty your database and start fresh

### Issue: "Resource already exists"
- **Solution**: Delete existing resources or use different slugs

### Issue: "Permission denied"
- **Solution**: Ensure you're using the correct token (super_admin_token for resource creation)

### Issue: "Token expired"
- **Solution**: Re-run the login request to get a fresh token

## Testing the Frontend

After running the collection:

1. **Login to Frontend** as `admin@acero.com` / `Admin@123`
2. **Check Sidebar**: Should show Dashboard, Users, Pages, Section Types (based on permissions)
3. **Check Permissions Page**: Navigate to Permissions → Click Admin role → See users
4. **Test User Permissions**: Click three dots on admin user → Manage Permissions → Should see toggles for all resources
5. **Verify Override**: Admin user should have delete permission for Users (user-specific override)

## Notes

- All requests include authentication headers
- Tests automatically verify responses
- Environment variables are set automatically
- The collection follows the exact flow needed for the system to work

## Next Steps

After completing this collection:
1. Test the frontend thoroughly
2. Create additional resources as needed
3. Assign permissions to other roles (approver, reviewer, viewer)
4. Test user-specific permission overrides for different users

