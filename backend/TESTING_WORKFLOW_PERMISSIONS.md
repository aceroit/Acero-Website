# Workflow Permissions Testing Guide

## Overview
This guide provides comprehensive test cases for the complete approval workflow cycle with different user roles and permission combinations.

## Prerequisites
- All system roles created (Editor, Reviewer, Approver, Admin, Super Admin)
- Test users created for each role
- Pages resource with proper permissions configured
- Workflow resource with proper permissions configured

## Test Users Setup

### Create Test Users (if not already created)
1. **Editor (No Special Permissions)**
   - Email: `editor@test.com`
   - Role: Editor
   - Permissions: Only default role permissions (no additional permissions)

2. **Editor (With Update Permission)**
   - Email: `editor-perms@test.com`
   - Role: Editor
   - Permissions: `pages:update` permission added

3. **Reviewer (No Special Permissions)**
   - Email: `reviewer@test.com`
   - Role: Reviewer
   - Permissions: Only default role permissions

4. **Reviewer (With Update Permission)**
   - Email: `reviewer-perms@test.com`
   - Role: Reviewer
   - Permissions: `pages:update` permission added

5. **Approver (No Special Permissions)**
   - Email: `approver@test.com`
   - Role: Approver
   - Permissions: Only default role permissions

6. **Approver (With Update Permission)**
   - Email: `approver-perms@test.com`
   - Role: Approver
   - Permissions: `pages:update` permission added

## Test Scenarios

### Scenario 1: Editor (Without Update Permission) - Complete Workflow Cycle

#### Test 1.1: Create and Edit Draft Page
- **User**: Editor (no special permissions)
- **Action**: Create a new page
- **Expected**: ✅ Page created in `draft` status
- **Action**: Edit the page content
- **Expected**: ✅ Can edit (creator in draft status)

#### Test 1.2: Submit for Review
- **User**: Editor (no special permissions)
- **Action**: Submit page for review (with change summary)
- **Expected**: ✅ Page status changes to `in_review`
- **Action**: Try to edit the page
- **Expected**: ❌ Cannot edit (no permission + role not appropriate for in_review)

#### Test 1.3: Changes Requested
- **User**: Reviewer
- **Action**: Request changes on the page
- **Expected**: ✅ Page status changes to `changes_requested`
- **User**: Editor (no special permissions)
- **Action**: Try to edit the page
- **Expected**: ✅ Can edit (creator in changes_requested status)

#### Test 1.4: Resubmit After Changes
- **User**: Editor (no special permissions)
- **Action**: Resubmit page for review
- **Expected**: ✅ Page status changes to `in_review`
- **Action**: Try to edit the page
- **Expected**: ❌ Cannot edit (no permission + role not appropriate)

---

### Scenario 2: Editor (With Update Permission) - Permission + Role Hierarchy

#### Test 2.1: Edit Draft Page
- **User**: Editor (with `pages:update` permission)
- **Action**: Edit page in `draft` status
- **Expected**: ✅ Can edit (has permission + appropriate role for draft)

#### Test 2.2: Edit Page in Review
- **User**: Editor (with `pages:update` permission)
- **Action**: Try to edit page in `in_review` status
- **Expected**: ❌ Cannot edit (has permission BUT role not appropriate - requires Reviewer+)
- **Error Message**: Should mention role hierarchy requirement

#### Test 2.3: Edit Page in Pending Approval
- **User**: Editor (with `pages:update` permission)
- **Action**: Try to edit page in `pending_approval` status
- **Expected**: ❌ Cannot edit (has permission BUT role not appropriate - requires Approver+)

#### Test 2.4: Edit Page in Pending Publish
- **User**: Editor (with `pages:update` permission)
- **Action**: Try to edit page in `pending_publish` status
- **Expected**: ❌ Cannot edit (has permission BUT role not appropriate - requires Admin+)

#### Test 2.5: Edit Published Page
- **User**: Editor (with `pages:update` permission)
- **Action**: Try to edit page in `published` status
- **Expected**: ❌ Cannot edit (has permission BUT role not appropriate - requires Admin+)

---

### Scenario 3: Reviewer (Without Update Permission) - Review Actions Only

#### Test 3.1: Review Content
- **User**: Reviewer (no special permissions)
- **Action**: Review page in `in_review` status
- **Expected**: ✅ Can mark as reviewed (moves to `pending_approval`)
- **Action**: Try to edit the page
- **Expected**: ❌ Cannot edit (no permission)

#### Test 3.2: Request Changes
- **User**: Reviewer (no special permissions)
- **Action**: Request changes on page in `in_review` status
- **Expected**: ✅ Can request changes (moves to `changes_requested`)
- **Action**: Try to edit the page
- **Expected**: ❌ Cannot edit (no permission)

#### Test 3.3: Approve Content
- **User**: Reviewer (no special permissions)
- **Action**: Try to approve page in `pending_approval` status
- **Expected**: ❌ Cannot approve (needs approve permission)

---

### Scenario 4: Reviewer (With Update Permission) - Can Edit in Appropriate States

#### Test 4.1: Edit Draft Page
- **User**: Reviewer (with `pages:update` permission)
- **Action**: Edit page in `draft` status
- **Expected**: ✅ Can edit (has permission + appropriate role)

#### Test 4.2: Edit Page in Review
- **User**: Reviewer (with `pages:update` permission)
- **Action**: Edit page in `in_review` status
- **Expected**: ✅ Can edit (has permission + appropriate role - Reviewer+)

#### Test 4.3: Edit Page in Pending Approval
- **User**: Reviewer (with `pages:update` permission)
- **Action**: Try to edit page in `pending_approval` status
- **Expected**: ❌ Cannot edit (has permission BUT role not appropriate - requires Approver+)

#### Test 4.4: Review and Edit
- **User**: Reviewer (with `pages:update` permission)
- **Action**: Review page in `in_review` status
- **Expected**: ✅ Can review
- **Action**: Edit the page while in `in_review`
- **Expected**: ✅ Can edit (has permission + appropriate role)

---

### Scenario 5: Approver (Without Update Permission) - Approval Actions Only

#### Test 5.1: Approve Content
- **User**: Approver (no special permissions)
- **Action**: Approve page in `pending_approval` status
- **Expected**: ✅ Can approve (moves to `pending_publish`)
- **Action**: Try to edit the page
- **Expected**: ❌ Cannot edit (no permission)

#### Test 5.2: Reject Content
- **User**: Approver (no special permissions)
- **Action**: Reject page in `pending_approval` status
- **Expected**: ✅ Can reject (moves to `changes_requested`)
- **Action**: Try to edit the page
- **Expected**: ❌ Cannot edit (no permission)

---

### Scenario 6: Approver (With Update Permission) - Can Edit in Appropriate States

#### Test 6.1: Edit Draft Page
- **User**: Approver (with `pages:update` permission)
- **Action**: Edit page in `draft` status
- **Expected**: ✅ Can edit (has permission + appropriate role)

#### Test 6.2: Edit Page in Review
- **User**: Approver (with `pages:update` permission)
- **Action**: Edit page in `in_review` status
- **Expected**: ✅ Can edit (has permission + appropriate role - Reviewer+)

#### Test 6.3: Edit Page in Pending Approval
- **User**: Approver (with `pages:update` permission)
- **Action**: Edit page in `pending_approval` status
- **Expected**: ✅ Can edit (has permission + appropriate role - Approver+)

#### Test 6.4: Edit Page in Pending Publish
- **User**: Approver (with `pages:update` permission)
- **Action**: Try to edit page in `pending_publish` status
- **Expected**: ❌ Cannot edit (has permission BUT role not appropriate - requires Admin+)

#### Test 6.5: Approve and Edit
- **User**: Approver (with `pages:update` permission)
- **Action**: Approve page in `pending_approval` status
- **Expected**: ✅ Can approve
- **Action**: Try to edit page in `pending_publish` status
- **Expected**: ❌ Cannot edit (role not appropriate)

---

### Scenario 7: Admin/Super Admin - Bypass All Restrictions

#### Test 7.1: Edit in Any Status
- **User**: Admin or Super Admin
- **Action**: Edit page in `in_review` status
- **Expected**: ✅ Can edit (bypass all restrictions)

#### Test 7.2: Edit in Pending Approval
- **User**: Admin or Super Admin
- **Action**: Edit page in `pending_approval` status
- **Expected**: ✅ Can edit (bypass all restrictions)

#### Test 7.3: Edit Published Content
- **User**: Admin or Super Admin
- **Action**: Edit page in `published` status
- **Expected**: ✅ Can edit (bypass all restrictions)

#### Test 7.4: Publish Directly
- **User**: Admin or Super Admin
- **Action**: Publish page directly from `draft` status
- **Expected**: ✅ Can publish (bypass workflow)

---

## Complete Workflow Cycle Test

### Full Cycle: Draft → In Review → Pending Approval → Pending Publish → Published

#### Step 1: Editor Creates Page
- **User**: Editor (no special permissions)
- **Action**: Create page "Test Workflow Page"
- **Expected**: ✅ Page created in `draft` status
- **Verify**: Can edit the page

#### Step 2: Editor Submits for Review
- **User**: Editor (no special permissions)
- **Action**: Submit page with change summary: "Initial page creation"
- **Expected**: ✅ Page status → `in_review`
- **Verify**: Cannot edit the page anymore
- **Verify**: Notification sent to reviewers

#### Step 3: Reviewer Reviews
- **User**: Reviewer
- **Action**: Review page (mark as reviewed)
- **Expected**: ✅ Page status → `pending_approval`
- **Verify**: Notification sent to approvers

#### Step 4: Approver Approves
- **User**: Approver
- **Action**: Approve page
- **Expected**: ✅ Page status → `pending_publish`
- **Verify**: Notification sent to publishers/admins

#### Step 5: Admin Publishes
- **User**: Admin
- **Action**: Publish page
- **Expected**: ✅ Page status → `published`
- **Verify**: Page is now live

#### Step 6: Editor Tries to Edit Published Page
- **User**: Editor (no special permissions)
- **Action**: Try to edit published page
- **Expected**: ❌ Cannot edit (no permission + role not appropriate)

---

## Error Message Verification

For each blocked operation, verify the error message includes:
1. **Permission status**: Whether user has permission or not
2. **Role information**: User's current role
3. **Status information**: Current workflow status
4. **Requirement**: What's needed (role + permission)

Example error messages:
- "User has 'update' permission but role 'editor' (level 1) is not appropriate for status 'in_review'. Requires reviewer+ role (level 2)"
- "Cannot edit content in 'pending_approval' status. Requires approver+ role and 'update' permission"

---

## Test Checklist

### Editor (No Permissions)
- [ ] Can create page in draft
- [ ] Can edit page in draft (as creator)
- [ ] Can submit for review
- [ ] Cannot edit page in in_review
- [ ] Can edit page in changes_requested (as creator)
- [ ] Cannot edit page in pending_approval
- [ ] Cannot edit page in pending_publish
- [ ] Cannot edit page in published

### Editor (With Update Permission)
- [ ] Can edit page in draft
- [ ] Can edit page in changes_requested
- [ ] Cannot edit page in in_review (role not appropriate)
- [ ] Cannot edit page in pending_approval (role not appropriate)
- [ ] Cannot edit page in pending_publish (role not appropriate)
- [ ] Cannot edit page in published (role not appropriate)

### Reviewer (No Permissions)
- [ ] Can review content in in_review
- [ ] Can request changes
- [ ] Cannot edit content (no permission)
- [ ] Cannot approve content (no permission)

### Reviewer (With Update Permission)
- [ ] Can edit page in draft
- [ ] Can edit page in changes_requested
- [ ] Can edit page in in_review (appropriate role)
- [ ] Cannot edit page in pending_approval (role not appropriate)
- [ ] Cannot edit page in pending_publish (role not appropriate)

### Approver (No Permissions)
- [ ] Can approve content in pending_approval
- [ ] Can reject content
- [ ] Cannot edit content (no permission)

### Approver (With Update Permission)
- [ ] Can edit page in draft
- [ ] Can edit page in changes_requested
- [ ] Can edit page in in_review (appropriate role)
- [ ] Can edit page in pending_approval (appropriate role)
- [ ] Cannot edit page in pending_publish (role not appropriate)

### Admin/Super Admin
- [ ] Can edit page in any status (bypass)
- [ ] Can publish directly from draft
- [ ] Can perform any workflow action

---

## Notes

1. **Permission + Role Hierarchy**: Both must align - having permission alone is not enough if role is not appropriate
2. **Creator Privilege**: Only works in `draft` and `changes_requested` statuses
3. **Admin Bypass**: Admin/Super Admin always bypass all restrictions
4. **Error Messages**: Should clearly explain why operation is blocked

---

## Success Criteria

✅ All test scenarios pass
✅ Error messages are clear and informative
✅ Permissions and role hierarchy work together correctly
✅ Admin/Super Admin bypass works
✅ Creator privilege works in appropriate states
✅ Complete workflow cycle works end-to-end

