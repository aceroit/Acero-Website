# Section CRUD Restrictions Testing Guide

## Overview
This guide provides comprehensive test cases for section CRUD operations (Create, Read, Update, Delete) based on parent page status and user permissions.

## Prerequisites
- All system roles created (Editor, Reviewer, Approver, Admin, Super Admin)
- Test users created for each role
- Test pages created in different workflow statuses
- Section types available in the system

## Test Setup

### Create Test Pages
1. **Page A**: "Test Page A" (draft) - Created by Editor
2. **Page B**: "Test Page B" (in_review) - Created by Editor
3. **Page C**: "Test Page C" (pending_approval) - Created by Editor
4. **Page D**: "Test Page D" (changes_requested) - Created by Editor
5. **Page E**: "Test Page E" (pending_publish) - Created by Editor
6. **Page F**: "Test Page F" (published) - Created by Editor

### Create Test Sections (Initial Setup)
- Section A1: On Page A (draft)
- Section B1: On Page B (draft)
- Section C1: On Page C (draft)

## Test Scenarios

### Scenario 1: Create Section - Editor (Without Create Permission)

#### Test 1.1: Create Section on Draft Page (As Creator)
- **User**: Editor (no special permissions, creator of Page A)
- **Parent Page**: Page A (draft)
- **Action**: Create new section on Page A
- **Expected**: ✅ Can create (parent page in draft, user is creator)

#### Test 1.2: Create Section on Draft Page (Not Creator)
- **User**: Editor (no special permissions, NOT creator of Page A)
- **Parent Page**: Page A (draft)
- **Action**: Try to create new section on Page A
- **Expected**: ❌ Cannot create (not creator, no permission)

#### Test 1.3: Create Section on Page in Review
- **User**: Editor (no special permissions, creator of Page B)
- **Parent Page**: Page B (in_review)
- **Action**: Try to create new section on Page B
- **Expected**: ❌ Cannot create (parent page not in draft/changes_requested)

#### Test 1.4: Create Section on Changes Requested Page (As Creator)
- **User**: Editor (no special permissions, creator of Page D)
- **Parent Page**: Page D (changes_requested)
- **Action**: Create new section on Page D
- **Expected**: ✅ Can create (parent page in changes_requested, user is creator)

#### Test 1.5: Create Section on Pending Approval Page
- **User**: Editor (no special permissions, creator of Page C)
- **Parent Page**: Page C (pending_approval)
- **Action**: Try to create new section on Page C
- **Expected**: ❌ Cannot create (parent page not in draft/changes_requested)

---

### Scenario 2: Create Section - Editor (With Create Permission)

#### Test 2.1: Create Section on Draft Page
- **User**: Editor (with `sections:create` permission)
- **Parent Page**: Page A (draft)
- **Action**: Create new section on Page A
- **Expected**: ✅ Can create (has permission + appropriate role for draft)

#### Test 2.2: Create Section on Page in Review
- **User**: Editor (with `sections:create` permission)
- **Parent Page**: Page B (in_review)
- **Action**: Try to create new section on Page B
- **Expected**: ❌ Cannot create (has permission BUT role not appropriate - requires Reviewer+)

#### Test 2.3: Create Section on Pending Approval Page
- **User**: Editor (with `sections:create` permission)
- **Parent Page**: Page C (pending_approval)
- **Action**: Try to create new section on Page C
- **Expected**: ❌ Cannot create (has permission BUT role not appropriate - requires Approver+)

#### Test 2.4: Create Section on Pending Publish Page
- **User**: Editor (with `sections:create` permission)
- **Parent Page**: Page E (pending_publish)
- **Action**: Try to create new section on Page E
- **Expected**: ❌ Cannot create (has permission BUT role not appropriate - requires Admin+)

---

### Scenario 3: Create Section - Reviewer (With Create Permission)

#### Test 3.1: Create Section on Draft Page
- **User**: Reviewer (with `sections:create` permission)
- **Parent Page**: Page A (draft)
- **Action**: Create new section on Page A
- **Expected**: ✅ Can create (has permission + appropriate role)

#### Test 3.2: Create Section on Page in Review
- **User**: Reviewer (with `sections:create` permission)
- **Parent Page**: Page B (in_review)
- **Action**: Create new section on Page B
- **Expected**: ✅ Can create (has permission + appropriate role - Reviewer+)

#### Test 3.3: Create Section on Pending Approval Page
- **User**: Reviewer (with `sections:create` permission)
- **Parent Page**: Page C (pending_approval)
- **Action**: Try to create new section on Page C
- **Expected**: ❌ Cannot create (has permission BUT role not appropriate - requires Approver+)

---

### Scenario 4: Create Section - Approver (With Create Permission)

#### Test 4.1: Create Section on Draft Page
- **User**: Approver (with `sections:create` permission)
- **Parent Page**: Page A (draft)
- **Action**: Create new section on Page A
- **Expected**: ✅ Can create (has permission + appropriate role)

#### Test 4.2: Create Section on Page in Review
- **User**: Approver (with `sections:create` permission)
- **Parent Page**: Page B (in_review)
- **Action**: Create new section on Page B
- **Expected**: ✅ Can create (has permission + appropriate role - Reviewer+)

#### Test 4.3: Create Section on Pending Approval Page
- **User**: Approver (with `sections:create` permission)
- **Parent Page**: Page C (pending_approval)
- **Action**: Create new section on Page C
- **Expected**: ✅ Can create (has permission + appropriate role - Approver+)

#### Test 4.4: Create Section on Pending Publish Page
- **User**: Approver (with `sections:create` permission)
- **Parent Page**: Page E (pending_publish)
- **Action**: Try to create new section on Page E
- **Expected**: ❌ Cannot create (has permission BUT role not appropriate - requires Admin+)

---

### Scenario 5: Create Section - Admin/Super Admin

#### Test 5.1: Create Section on Page in Any Status
- **User**: Admin or Super Admin
- **Parent Page**: Page B (in_review)
- **Action**: Create new section on Page B
- **Expected**: ✅ Can create (bypass all restrictions)

#### Test 5.2: Create Section on Published Page
- **User**: Admin or Super Admin
- **Parent Page**: Page F (published)
- **Action**: Create new section on Page F
- **Expected**: ✅ Can create (bypass all restrictions)

---

### Scenario 6: Update Section - Editor (Without Update Permission)

#### Test 6.1: Update Section on Draft Page (As Creator)
- **User**: Editor (no special permissions, creator of Section A1)
- **Parent Page**: Page A (draft)
- **Section**: Section A1 (draft)
- **Action**: Update Section A1
- **Expected**: ✅ Can update (section in draft, user is creator)

#### Test 6.2: Update Section on Draft Page (Not Creator)
- **User**: Editor (no special permissions, NOT creator of Section A1)
- **Parent Page**: Page A (draft)
- **Section**: Section A1 (draft)
- **Action**: Try to update Section A1
- **Expected**: ❌ Cannot update (not creator, no permission)

#### Test 6.3: Update Section on Page in Review
- **User**: Editor (no special permissions, creator of Section B1)
- **Parent Page**: Page B (in_review)
- **Section**: Section B1 (draft)
- **Action**: Try to update Section B1
- **Expected**: ❌ Cannot update (parent page not in draft/changes_requested, no permission)

#### Test 6.4: Update Section in Review Status
- **User**: Editor (no special permissions, creator of Section B1)
- **Parent Page**: Page B (in_review)
- **Section**: Section B1 (in_review)
- **Action**: Try to update Section B1
- **Expected**: ❌ Cannot update (section in in_review, no permission, role not appropriate)

---

### Scenario 7: Update Section - Editor (With Update Permission)

#### Test 7.1: Update Section on Draft Page
- **User**: Editor (with `sections:update` permission)
- **Parent Page**: Page A (draft)
- **Section**: Section A1 (draft)
- **Action**: Update Section A1
- **Expected**: ✅ Can update (has permission + appropriate role for draft)

#### Test 7.2: Update Section on Page in Review
- **User**: Editor (with `sections:update` permission)
- **Parent Page**: Page B (in_review)
- **Section**: Section B1 (draft)
- **Action**: Try to update Section B1
- **Expected**: ❌ Cannot update (parent page in in_review, role not appropriate)

#### Test 7.3: Update Section in Review Status
- **User**: Editor (with `sections:update` permission)
- **Parent Page**: Page B (in_review)
- **Section**: Section B1 (in_review)
- **Action**: Try to update Section B1
- **Expected**: ❌ Cannot update (has permission BUT role not appropriate - requires Reviewer+)

---

### Scenario 8: Update Section - Reviewer (With Update Permission)

#### Test 8.1: Update Section on Draft Page
- **User**: Reviewer (with `sections:update` permission)
- **Parent Page**: Page A (draft)
- **Section**: Section A1 (draft)
- **Action**: Update Section A1
- **Expected**: ✅ Can update (has permission + appropriate role)

#### Test 8.2: Update Section on Page in Review
- **User**: Reviewer (with `sections:update` permission)
- **Parent Page**: Page B (in_review)
- **Section**: Section B1 (draft)
- **Action**: Update Section B1
- **Expected**: ✅ Can update (has permission + appropriate role - Reviewer+)

#### Test 8.3: Update Section in Review Status
- **User**: Reviewer (with `sections:update` permission)
- **Parent Page**: Page B (in_review)
- **Section**: Section B1 (in_review)
- **Action**: Update Section B1
- **Expected**: ✅ Can update (has permission + appropriate role - Reviewer+)

#### Test 8.4: Update Section on Pending Approval Page
- **User**: Reviewer (with `sections:update` permission)
- **Parent Page**: Page C (pending_approval)
- **Section**: Section C1 (draft)
- **Action**: Try to update Section C1
- **Expected**: ❌ Cannot update (parent page in pending_approval, role not appropriate)

---

### Scenario 9: Update Section - Approver (With Update Permission)

#### Test 9.1: Update Section on Draft Page
- **User**: Approver (with `sections:update` permission)
- **Parent Page**: Page A (draft)
- **Section**: Section A1 (draft)
- **Action**: Update Section A1
- **Expected**: ✅ Can update (has permission + appropriate role)

#### Test 9.2: Update Section on Page in Review
- **User**: Approver (with `sections:update` permission)
- **Parent Page**: Page B (in_review)
- **Section**: Section B1 (in_review)
- **Action**: Update Section B1
- **Expected**: ✅ Can update (has permission + appropriate role - Reviewer+)

#### Test 9.3: Update Section on Pending Approval Page
- **User**: Approver (with `sections:update` permission)
- **Parent Page**: Page C (pending_approval)
- **Section**: Section C1 (draft)
- **Action**: Update Section C1
- **Expected**: ✅ Can update (has permission + appropriate role - Approver+)

---

### Scenario 10: Delete Section - Editor (Without Delete Permission)

#### Test 10.1: Delete Section on Draft Page (As Creator)
- **User**: Editor (no special permissions, creator of Section A1)
- **Parent Page**: Page A (draft)
- **Section**: Section A1 (draft)
- **Action**: Delete Section A1
- **Expected**: ✅ Can delete (section in draft, user is creator)

#### Test 10.2: Delete Section on Page in Review
- **User**: Editor (no special permissions, creator of Section B1)
- **Parent Page**: Page B (in_review)
- **Section**: Section B1 (draft)
- **Action**: Try to delete Section B1
- **Expected**: ❌ Cannot delete (parent page not in draft/changes_requested, no permission)

#### Test 10.3: Delete Section in Review Status
- **User**: Editor (no special permissions, creator of Section B1)
- **Parent Page**: Page B (in_review)
- **Section**: Section B1 (in_review)
- **Action**: Try to delete Section B1
- **Expected**: ❌ Cannot delete (section in active workflow, no permission)

---

### Scenario 11: Delete Section - Editor (With Delete Permission)

#### Test 11.1: Delete Section on Draft Page
- **User**: Editor (with `sections:delete` permission)
- **Parent Page**: Page A (draft)
- **Section**: Section A1 (draft)
- **Action**: Delete Section A1
- **Expected**: ✅ Can delete (has permission)

#### Test 11.2: Delete Section in Review Status
- **User**: Editor (with `sections:delete` permission)
- **Parent Page**: Page B (in_review)
- **Section**: Section B1 (in_review)
- **Action**: Try to delete Section B1
- **Expected**: ❌ Cannot delete (section in active workflow - in_review, pending_approval, pending_publish)

#### Test 11.3: Delete Section in Changes Requested
- **User**: Editor (with `sections:delete` permission)
- **Parent Page**: Page D (changes_requested)
- **Section**: Section in changes_requested
- **Action**: Delete section
- **Expected**: ✅ Can delete (has permission, section in changes_requested)

---

### Scenario 12: Delete Section - Reviewer/Approver (With Delete Permission)

#### Test 12.1: Delete Section on Draft Page
- **User**: Reviewer (with `sections:delete` permission)
- **Parent Page**: Page A (draft)
- **Section**: Section A1 (draft)
- **Action**: Delete Section A1
- **Expected**: ✅ Can delete (has permission)

#### Test 12.2: Delete Section in Review Status
- **User**: Reviewer (with `sections:delete` permission)
- **Parent Page**: Page B (in_review)
- **Section**: Section B1 (in_review)
- **Action**: Try to delete Section B1
- **Expected**: ❌ Cannot delete (section in active workflow)

---

### Scenario 13: Reorder Sections - Editor (Without Update Permission)

#### Test 13.1: Reorder Sections on Draft Page (As Creator)
- **User**: Editor (no special permissions, creator of Page A)
- **Parent Page**: Page A (draft)
- **Sections**: Multiple sections on Page A (all in draft)
- **Action**: Reorder sections
- **Expected**: ✅ Can reorder (parent page in draft, user is creator)

#### Test 13.2: Reorder Sections on Page in Review
- **User**: Editor (no special permissions, creator of Page B)
- **Parent Page**: Page B (in_review)
- **Sections**: Multiple sections on Page B
- **Action**: Try to reorder sections
- **Expected**: ❌ Cannot reorder (parent page not in draft, no permission)

---

### Scenario 14: Reorder Sections - Editor (With Update Permission)

#### Test 14.1: Reorder Sections on Draft Page
- **User**: Editor (with `sections:update` permission)
- **Parent Page**: Page A (draft)
- **Sections**: Multiple sections on Page A
- **Action**: Reorder sections
- **Expected**: ✅ Can reorder (has permission + appropriate role)

#### Test 14.2: Reorder Sections on Page in Review
- **User**: Editor (with `sections:update` permission)
- **Parent Page**: Page B (in_review)
- **Sections**: Multiple sections on Page B
- **Action**: Try to reorder sections
- **Expected**: ❌ Cannot reorder (parent page in in_review, role not appropriate)

#### Test 14.3: Reorder Sections with Mixed Status
- **User**: Editor (with `sections:update` permission)
- **Parent Page**: Page A (draft)
- **Sections**: Some in draft, some in in_review
- **Action**: Try to reorder all sections
- **Expected**: ❌ Cannot reorder (some sections not in draft, role not appropriate for in_review)

---

### Scenario 15: Reorder Sections - Reviewer (With Update Permission)

#### Test 15.1: Reorder Sections on Draft Page
- **User**: Reviewer (with `sections:update` permission)
- **Parent Page**: Page A (draft)
- **Sections**: Multiple sections on Page A
- **Action**: Reorder sections
- **Expected**: ✅ Can reorder (has permission + appropriate role)

#### Test 15.2: Reorder Sections on Page in Review
- **User**: Reviewer (with `sections:update` permission)
- **Parent Page**: Page B (in_review)
- **Sections**: Multiple sections on Page B
- **Action**: Reorder sections
- **Expected**: ✅ Can reorder (has permission + appropriate role - Reviewer+)

---

### Scenario 16: Admin/Super Admin - All Operations

#### Test 16.1: Create Section on Published Page
- **User**: Admin or Super Admin
- **Parent Page**: Page F (published)
- **Action**: Create new section
- **Expected**: ✅ Can create (bypass all restrictions)

#### Test 16.2: Update Section on Published Page
- **User**: Admin or Super Admin
- **Parent Page**: Page F (published)
- **Section**: Section on published page
- **Action**: Update section
- **Expected**: ✅ Can update (bypass all restrictions)

#### Test 16.3: Delete Section in Review Status
- **User**: Admin or Super Admin
- **Parent Page**: Page B (in_review)
- **Section**: Section B1 (in_review)
- **Action**: Delete section
- **Expected**: ✅ Can delete (bypass all restrictions)

---

## Edge Cases

### Edge Case 1: Parent Page Status Changes During Section Edit
- **Setup**: Section on Page A (draft)
- **User**: Editor (no special permissions, creator)
- **Action**: Start editing section
- **Action**: Another user changes Page A to in_review
- **Action**: Try to save section edit
- **Expected**: ❌ Cannot save (parent page status changed)

### Edge Case 2: Multiple Sections on Same Page
- **Setup**: Page A (draft) has 5 sections
- **User**: Editor (no special permissions, creator)
- **Action**: Create 6th section
- **Expected**: ✅ Can create
- **Action**: Update all 5 existing sections
- **Expected**: ✅ Can update all

### Edge Case 3: Section Status vs Parent Page Status
- **Setup**: Page B (in_review) has Section B1 (draft)
- **User**: Editor (with `sections:update` permission)
- **Action**: Try to update Section B1
- **Expected**: ❌ Cannot update (parent page in in_review, role not appropriate)

### Edge Case 4: Section in Active Workflow
- **Setup**: Section B1 (in_review) on Page B (in_review)
- **User**: Editor (with `sections:delete` permission)
- **Action**: Try to delete Section B1
- **Expected**: ❌ Cannot delete (section in active workflow)

---

## Error Message Verification

For each blocked operation, verify the error message includes:
1. **Permission status**: Whether user has permission or not
2. **Role information**: User's current role
3. **Parent page status**: Current workflow status of parent page
4. **Section status**: Current workflow status of section (for update/delete)
5. **Requirement**: What's needed (role + permission)

Example error messages:
- "User has 'create' permission but role 'editor' is not appropriate for parent page status 'in_review'. Requires reviewer+"
- "Cannot create section. Parent page is in 'pending_approval' status. Requires 'create' permission for sections and appropriate role, or parent page must be in 'draft'/'changes_requested' status (if creator)."
- "Cannot update section. Parent page is in 'in_review' status. Requires reviewer+ role and 'update' permission."

---

## Test Checklist

### Create Section Tests
- [ ] Editor (no permission, creator) can create on draft page
- [ ] Editor (no permission, not creator) cannot create on draft page
- [ ] Editor (no permission) cannot create on page in review
- [ ] Editor (with permission) can create on draft page
- [ ] Editor (with permission) cannot create on page in review (role not appropriate)
- [ ] Reviewer (with permission) can create on page in review
- [ ] Reviewer (with permission) cannot create on pending approval page
- [ ] Approver (with permission) can create on pending approval page
- [ ] Admin can create on any page status

### Update Section Tests
- [ ] Editor (no permission, creator) can update on draft page
- [ ] Editor (no permission) cannot update on page in review
- [ ] Editor (with permission) can update on draft page
- [ ] Editor (with permission) cannot update on page in review (role not appropriate)
- [ ] Reviewer (with permission) can update on page in review
- [ ] Approver (with permission) can update on pending approval page
- [ ] Admin can update on any page status

### Delete Section Tests
- [ ] Editor (no permission, creator) can delete on draft page
- [ ] Editor (no permission) cannot delete on page in review
- [ ] Editor (with permission) can delete on draft page
- [ ] Editor (with permission) cannot delete section in active workflow
- [ ] Reviewer (with permission) cannot delete section in active workflow
- [ ] Admin can delete section in any status

### Reorder Sections Tests
- [ ] Editor (no permission, creator) can reorder on draft page
- [ ] Editor (no permission) cannot reorder on page in review
- [ ] Editor (with permission) can reorder on draft page
- [ ] Editor (with permission) cannot reorder on page in review (role not appropriate)
- [ ] Reviewer (with permission) can reorder on page in review
- [ ] Admin can reorder on any page status

---

## API Endpoints to Test

### Create Section
```http
POST /api/sections/pages/:pageId/sections
Content-Type: application/json
Authorization: Bearer {token}

{
  "sectionTypeSlug": "text_block",
  "content": { "text": "Section content" },
  "order": 0,
  "isVisible": true
}
```

### Update Section
```http
PUT /api/sections/:id
Content-Type: application/json
Authorization: Bearer {token}

{
  "content": { "text": "Updated content" },
  "isVisible": true
}
```

### Delete Section
```http
DELETE /api/sections/:id
Authorization: Bearer {token}
```

### Reorder Sections
```http
PUT /api/sections/reorder
Content-Type: application/json
Authorization: Bearer {token}

{
  "sectionOrders": [
    { "sectionId": "section1_id", "order": 0 },
    { "sectionId": "section2_id", "order": 1 },
    { "sectionId": "section3_id", "order": 2 }
  ]
}
```

---

## Success Criteria

✅ All test scenarios pass
✅ Error messages are clear and informative
✅ Permissions and role hierarchy work together correctly
✅ Parent page status restrictions work correctly
✅ Section status restrictions work correctly
✅ Admin/Super Admin bypass works
✅ Creator privilege works in appropriate states
✅ Active workflow protection works (cannot delete sections in in_review, pending_approval, pending_publish)

---

## Notes

1. **Parent Page Status**: Sections inherit restrictions from parent page status
2. **Section Status**: Sections also have their own status that affects operations
3. **Permission + Role Hierarchy**: Both must align for section operations
4. **Creator Privilege**: Only works when parent page is in `draft` or `changes_requested`
5. **Active Workflow**: Sections in `in_review`, `pending_approval`, or `pending_publish` cannot be deleted
6. **Admin Bypass**: Admin/Super Admin always bypass all restrictions

