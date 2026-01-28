# Phase 3 - Approval Workflow v2 (Permission-Based) Postman Collection

## Overview

This is the updated version of the Phase 3 Approval Workflow Postman collection that includes comprehensive permission-based test cases. This collection tests the complete approval workflow system with role hierarchy and permission-based restrictions.

## What's New in v2

### Enhanced Features
1. **changeSummary Support**: All workflow transitions now include `changeSummary` validation and testing
2. **Permission-Based CRUD Restrictions**: Tests for page CRUD operations based on workflow status and user permissions
3. **Tree Management Restrictions**: Tests for page move/reorder operations with different roles and permissions
4. **Section CRUD Restrictions**: Tests for section operations based on parent page status and user permissions
5. **Comprehensive Error Messages**: Tests verify that error messages include permission, role, and status information

## Collection Structure

### 01 - Content Workflow Lifecycle (Updated with changeSummary)
- Complete workflow lifecycle from draft → published
- All transitions include `changeSummary` requirement
- Tests for invalid transitions
- Tests for missing `changeSummary` validation

### 02 - Permission-Based Page CRUD Restrictions
- **Editor (No Permission)**: 
  - ✅ Can update draft pages (creator privilege)
  - ❌ Cannot update pages in review/pending approval
- **Editor (With Permission)**:
  - ✅ Can update draft pages
  - ❌ Cannot update pages in review (role not appropriate)
- **Reviewer (With Permission)**:
  - ✅ Can update pages in review (has permission + appropriate role)
- **Admin**:
  - ✅ Can update any page status (bypasses all restrictions)

### 03 - Tree Management Restrictions
- **Editor (No Permission)**:
  - ✅ Can move/reorder draft pages (creator privilege)
  - ❌ Cannot move pages in review/pending approval
- **Reviewer (With Permission)**:
  - ✅ Can move pages in review (has permission + appropriate role)
- **Admin**:
  - ✅ Can move any page status (bypasses all restrictions)

### 04 - Section CRUD Restrictions
- **Editor (No Permission)**:
  - ✅ Can create/update sections on draft pages (creator privilege)
  - ❌ Cannot create sections on pages in review
- **Reviewer (With Permission)**:
  - ✅ Can create sections on pages in review (has permission + appropriate role)
- **Admin**:
  - ✅ Can create sections on any page status (bypasses all restrictions)

### 05 - Version Management (with changeSummary)
- Get version history with `changeSummary`
- Compare versions
- Restore previous versions

### 06 - Notifications (with changeSummary)
- Get notifications with `changeSummary` metadata
- Verify notifications include change summaries

## Prerequisites

1. **Phase 1 Completed**: Users and tokens created
2. **Phase 2 Completed**: Pages and sections created
3. **Backend Server Running**: On `{{base_url}}`
4. **Environment Variables Set**:
   - `base_url`: Backend server URL
   - `editor_token`: Editor user token
   - `reviewer_token`: Reviewer user token
   - `approver_token`: Approver user token
   - `admin_token`: Admin user token
   - `editor_with_permission_token`: Editor with update permission token
   - `reviewer_with_permission_token`: Reviewer with update permission token

## Test Users Setup

You need to create test users with different permission configurations:

### Basic Users (Default Role Permissions Only)
- **Editor**: `editor@test.com` - No additional permissions
- **Reviewer**: `reviewer@test.com` - No additional permissions
- **Approver**: `approver@test.com` - No additional permissions

### Users with Additional Permissions
- **Editor with Permission**: `editor-perms@test.com` - Has `pages:update` permission
- **Reviewer with Permission**: `reviewer-perms@test.com` - Has `pages:update` permission

### Admin Users
- **Admin**: `admin@test.com` - Admin role (bypasses all restrictions)
- **Super Admin**: `superadmin@test.com` - Super Admin role (bypasses all restrictions)

## Usage Instructions

### Step 1: Import Collection and Environment
1. Open Postman
2. Import `Phase3_Approval_Workflow_v2.postman_collection.json`
3. Import `ACERO_CMS_Environment.postman_environment.json` (from parent folder)
4. Select the environment in Postman

### Step 2: Set Environment Variables
Make sure these variables are set:
- `base_url`: Your backend server URL (e.g., `http://localhost:5000`)
- `editor_token`: Token from editor user login
- `reviewer_token`: Token from reviewer user login
- `approver_token`: Token from approver user login
- `admin_token`: Token from admin user login
- `editor_with_permission_token`: Token from editor with permission user login
- `reviewer_with_permission_token`: Token from reviewer with permission user login

### Step 3: Run Tests
You can:
- Run individual requests manually
- Run entire folders using "Run folder"
- Run the entire collection using "Run collection"

**Note**: Some tests depend on previous tests creating test data. Run folders in order (01 → 02 → 03 → 04 → 05 → 06).

## Test Coverage

### Workflow Lifecycle
- ✅ Draft → in_review (with changeSummary)
- ✅ in_review → changes_requested
- ✅ changes_requested → in_review (resubmit with changeSummary)
- ✅ in_review → pending_approval
- ✅ pending_approval → pending_publish
- ✅ pending_publish → published
- ✅ Invalid transitions (should fail)
- ✅ Missing changeSummary (should fail)

### Permission-Based Restrictions
- ✅ Editor without permission: Can edit draft, cannot edit in review
- ✅ Editor with permission: Can edit draft, cannot edit in review (role not appropriate)
- ✅ Reviewer with permission: Can edit in review (has permission + appropriate role)
- ✅ Admin: Can edit any status (bypass)

### Tree Management
- ✅ Move draft pages (Editor without permission - creator privilege)
- ✅ Cannot move pages in review (Editor without permission)
- ✅ Can move pages in review (Reviewer with permission)
- ✅ Admin can move any status (bypass)

### Section CRUD
- ✅ Create section on draft page (Editor without permission - creator privilege)
- ✅ Cannot create section on page in review (Editor without permission)
- ✅ Can create section on page in review (Reviewer with permission)
- ✅ Admin can create section on any status (bypass)

## Expected Results

### Success Criteria
- ✅ All workflow transitions work correctly
- ✅ changeSummary is required and validated
- ✅ Permission-based restrictions work correctly
- ✅ Role hierarchy is enforced
- ✅ Admin/Super Admin bypass works
- ✅ Creator privilege works in appropriate states
- ✅ Error messages are clear and informative

### Error Message Verification
All blocked operations should return error messages that include:
1. **Permission status**: Whether user has permission or not
2. **Role information**: User's current role
3. **Status information**: Current workflow status
4. **Requirement**: What's needed (role + permission)

Example error messages:
- "User has 'update' permission but role 'editor' is not appropriate for page status 'in_review'. Requires reviewer+"
- "Cannot update page. Page is in 'pending_approval' status. Requires approver+ role and 'update' permission."

## Troubleshooting

### Issue: "changeSummary is required"
- **Solution**: Make sure you're including `changeSummary` in the request body for submit operations

### Issue: "Permission denied"
- **Solution**: Check that the user has the required permission and appropriate role for the current workflow status

### Issue: "Token expired"
- **Solution**: Re-run the login request to get a fresh token

### Issue: "Test page not found"
- **Solution**: Run the setup requests first to create test pages in different statuses

## Related Documentation

- `backend/TESTING_WORKFLOW_PERMISSIONS.md`: Detailed testing guide for workflow permissions
- `backend/TESTING_TREE_MANAGEMENT.md`: Detailed testing guide for tree management
- `backend/TESTING_SECTION_CRUD_RESTRICTIONS.md`: Detailed testing guide for section CRUD restrictions

## Notes

- All requests include authentication headers
- Tests automatically verify responses
- Environment variables are set automatically
- The collection follows the exact flow needed for the system to work
- Admin/Super Admin always bypass all restrictions
- Creator privilege only works when content is in `draft` or `changes_requested` status
