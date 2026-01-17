# Tree Management Restrictions Testing Guide

## Overview
This guide provides comprehensive test cases for page tree management operations (move and reorder) with different user roles, permissions, and workflow statuses.

## Prerequisites
- All system roles created (Editor, Reviewer, Approver, Admin, Super Admin)
- Test users created for each role
- Multiple pages created in different workflow statuses
- Pages with parent-child relationships (hierarchy)

## Test Setup

### Create Test Pages
1. **Root Level Pages**:
   - Page A: "Test Page A" (draft)
   - Page B: "Test Page B" (draft)
   - Page C: "Test Page C" (in_review)
   - Page D: "Test Page D" (pending_approval)

2. **Child Pages**:
   - Page A1: Child of Page A (draft)
   - Page A2: Child of Page A (draft)
   - Page C1: Child of Page C (draft)
   - Page C2: Child of Page C (in_review)

3. **Grandchild Pages**:
   - Page A1a: Child of Page A1 (draft)
   - Page A1b: Child of Page A1 (draft)

## Test Scenarios

### Scenario 1: Move Page - Editor (Without Update Permission)

#### Test 1.1: Move Draft Page
- **User**: Editor (no special permissions)
- **Action**: Move Page A (draft) to new parent
- **Expected**: ✅ Can move (page is in draft status)
- **Verify**: Page path and level updated correctly
- **Verify**: All descendants' paths updated

#### Test 1.2: Move Page in Review
- **User**: Editor (no special permissions)
- **Action**: Try to move Page C (in_review) to new parent
- **Expected**: ❌ Cannot move (no permission + page not in draft)
- **Error Message**: Should mention status restriction

#### Test 1.3: Move Page in Pending Approval
- **User**: Editor (no special permissions)
- **Action**: Try to move Page D (pending_approval) to new parent
- **Expected**: ❌ Cannot move (no permission + page not in draft)

#### Test 1.4: Move Page with Children in Review
- **User**: Editor (no special permissions)
- **Action**: Try to move Page C (draft) that has child Page C2 (in_review)
- **Expected**: ❌ Cannot move (descendant in non-draft status)
- **Note**: This may need to be checked if implemented

---

### Scenario 2: Move Page - Editor (With Update Permission)

#### Test 2.1: Move Draft Page
- **User**: Editor (with `pages:update` permission)
- **Action**: Move Page A (draft) to new parent
- **Expected**: ✅ Can move (has permission + appropriate role for draft)

#### Test 2.2: Move Page in Review
- **User**: Editor (with `pages:update` permission)
- **Action**: Try to move Page C (in_review) to new parent
- **Expected**: ❌ Cannot move (has permission BUT role not appropriate - requires Reviewer+)
- **Error Message**: Should mention role hierarchy requirement

#### Test 2.3: Move Page in Pending Approval
- **User**: Editor (with `pages:update` permission)
- **Action**: Try to move Page D (pending_approval) to new parent
- **Expected**: ❌ Cannot move (has permission BUT role not appropriate - requires Approver+)

#### Test 2.4: Move Page in Pending Publish
- **User**: Editor (with `pages:update` permission)
- **Action**: Try to move page in `pending_publish` status
- **Expected**: ❌ Cannot move (has permission BUT role not appropriate - requires Admin+)

---

### Scenario 3: Move Page - Reviewer (With Update Permission)

#### Test 3.1: Move Draft Page
- **User**: Reviewer (with `pages:update` permission)
- **Action**: Move Page A (draft) to new parent
- **Expected**: ✅ Can move (has permission + appropriate role)

#### Test 3.2: Move Page in Review
- **User**: Reviewer (with `pages:update` permission)
- **Action**: Move Page C (in_review) to new parent
- **Expected**: ✅ Can move (has permission + appropriate role - Reviewer+)

#### Test 3.3: Move Page in Pending Approval
- **User**: Reviewer (with `pages:update` permission)
- **Action**: Try to move Page D (pending_approval) to new parent
- **Expected**: ❌ Cannot move (has permission BUT role not appropriate - requires Approver+)

---

### Scenario 4: Move Page - Approver (With Update Permission)

#### Test 4.1: Move Draft Page
- **User**: Approver (with `pages:update` permission)
- **Action**: Move Page A (draft) to new parent
- **Expected**: ✅ Can move (has permission + appropriate role)

#### Test 4.2: Move Page in Review
- **User**: Approver (with `pages:update` permission)
- **Action**: Move Page C (in_review) to new parent
- **Expected**: ✅ Can move (has permission + appropriate role - Reviewer+)

#### Test 4.3: Move Page in Pending Approval
- **User**: Approver (with `pages:update` permission)
- **Action**: Move Page D (pending_approval) to new parent
- **Expected**: ✅ Can move (has permission + appropriate role - Approver+)

#### Test 4.4: Move Page in Pending Publish
- **User**: Approver (with `pages:update` permission)
- **Action**: Try to move page in `pending_publish` status
- **Expected**: ❌ Cannot move (has permission BUT role not appropriate - requires Admin+)

---

### Scenario 5: Move Page - Admin/Super Admin

#### Test 5.1: Move Page in Any Status
- **User**: Admin or Super Admin
- **Action**: Move Page C (in_review) to new parent
- **Expected**: ✅ Can move (bypass all restrictions)

#### Test 5.2: Move Page in Pending Approval
- **User**: Admin or Super Admin
- **Action**: Move Page D (pending_approval) to new parent
- **Expected**: ✅ Can move (bypass all restrictions)

#### Test 5.3: Move Published Page
- **User**: Admin or Super Admin
- **Action**: Move published page to new parent
- **Expected**: ✅ Can move (bypass all restrictions)

---

### Scenario 6: Reorder Pages - Editor (Without Update Permission)

#### Test 6.1: Reorder Draft Pages
- **User**: Editor (no special permissions)
- **Action**: Reorder Page A and Page B (both in draft)
- **Expected**: ✅ Can reorder (all pages in draft)

#### Test 6.2: Reorder Mixed Status Pages
- **User**: Editor (no special permissions)
- **Action**: Try to reorder Page A (draft) and Page C (in_review)
- **Expected**: ❌ Cannot reorder (Page C is not in draft)
- **Error Message**: Should list which pages are blocked

#### Test 6.3: Reorder Pages in Review
- **User**: Editor (no special permissions)
- **Action**: Try to reorder multiple pages in `in_review` status
- **Expected**: ❌ Cannot reorder (no permission + pages not in draft)

---

### Scenario 7: Reorder Pages - Editor (With Update Permission)

#### Test 7.1: Reorder Draft Pages
- **User**: Editor (with `pages:update` permission)
- **Action**: Reorder Page A and Page B (both in draft)
- **Expected**: ✅ Can reorder (has permission + appropriate role)

#### Test 7.2: Reorder Pages in Review
- **User**: Editor (with `pages:update` permission)
- **Action**: Try to reorder pages in `in_review` status
- **Expected**: ❌ Cannot reorder (has permission BUT role not appropriate - requires Reviewer+)

#### Test 7.3: Reorder Mixed Status Pages
- **User**: Editor (with `pages:update` permission)
- **Action**: Try to reorder Page A (draft) and Page C (in_review)
- **Expected**: ❌ Cannot reorder (Page C requires Reviewer+ role)

---

### Scenario 8: Reorder Pages - Reviewer (With Update Permission)

#### Test 8.1: Reorder Draft Pages
- **User**: Reviewer (with `pages:update` permission)
- **Action**: Reorder Page A and Page B (both in draft)
- **Expected**: ✅ Can reorder (has permission + appropriate role)

#### Test 8.2: Reorder Pages in Review
- **User**: Reviewer (with `pages:update` permission)
- **Action**: Reorder pages in `in_review` status
- **Expected**: ✅ Can reorder (has permission + appropriate role - Reviewer+)

#### Test 8.3: Reorder Pages in Pending Approval
- **User**: Reviewer (with `pages:update` permission)
- **Action**: Try to reorder pages in `pending_approval` status
- **Expected**: ❌ Cannot reorder (has permission BUT role not appropriate - requires Approver+)

---

### Scenario 9: Reorder Pages - Approver (With Update Permission)

#### Test 9.1: Reorder Draft Pages
- **User**: Approver (with `pages:update` permission)
- **Action**: Reorder Page A and Page B (both in draft)
- **Expected**: ✅ Can reorder (has permission + appropriate role)

#### Test 9.2: Reorder Pages in Review
- **User**: Approver (with `pages:update` permission)
- **Action**: Reorder pages in `in_review` status
- **Expected**: ✅ Can reorder (has permission + appropriate role - Reviewer+)

#### Test 9.3: Reorder Pages in Pending Approval
- **User**: Approver (with `pages:update` permission)
- **Action**: Reorder pages in `pending_approval` status
- **Expected**: ✅ Can reorder (has permission + appropriate role - Approver+)

#### Test 9.4: Reorder Pages in Pending Publish
- **User**: Approver (with `pages:update` permission)
- **Action**: Try to reorder pages in `pending_publish` status
- **Expected**: ❌ Cannot reorder (has permission BUT role not appropriate - requires Admin+)

---

### Scenario 10: Reorder Pages - Admin/Super Admin

#### Test 10.1: Reorder Pages in Any Status
- **User**: Admin or Super Admin
- **Action**: Reorder pages in `in_review` status
- **Expected**: ✅ Can reorder (bypass all restrictions)

#### Test 10.2: Reorder Published Pages
- **User**: Admin or Super Admin
- **Action**: Reorder published pages
- **Expected**: ✅ Can reorder (bypass all restrictions)

---

## Edge Cases

### Edge Case 1: Move Page with Descendants
- **Setup**: Page A (draft) has children A1 (draft) and A2 (draft)
- **User**: Editor (no special permissions)
- **Action**: Move Page A to new parent
- **Expected**: ✅ Can move
- **Verify**: All descendants' paths updated correctly
- **Verify**: All descendants' levels updated correctly

### Edge Case 2: Move Page with Mixed Status Descendants
- **Setup**: Page C (draft) has children C1 (draft) and C2 (in_review)
- **User**: Editor (no special permissions)
- **Action**: Try to move Page C
- **Expected**: ❌ Cannot move (descendant C2 is not in draft)
- **Note**: This depends on implementation - may need to check all descendants

### Edge Case 3: Circular Reference Prevention
- **Setup**: Page A has child Page A1
- **User**: Any user with permission
- **Action**: Try to move Page A to be child of Page A1
- **Expected**: ❌ Cannot move (would create circular reference)
- **Error Message**: Should mention circular reference

### Edge Case 4: Reorder Large Batch
- **Setup**: 10 pages all in draft status
- **User**: Editor (no special permissions)
- **Action**: Reorder all 10 pages
- **Expected**: ✅ Can reorder all
- **Verify**: All orders updated correctly

### Edge Case 5: Reorder Mixed Status Batch
- **Setup**: 5 pages in draft, 3 pages in in_review
- **User**: Editor (no special permissions)
- **Action**: Try to reorder all 8 pages together
- **Expected**: ❌ Cannot reorder
- **Error Message**: Should list which pages are blocked (the 3 in in_review)

---

## Path and Level Verification

### After Moving Page
1. **Page Path**: Should be updated based on new parent
   - Example: Moving `/about` to be child of `/company` → `/company/about`
2. **Page Level**: Should be updated based on new parent
   - Example: Root page (level 0) moved under level 1 page → becomes level 2
3. **Descendant Paths**: All children should have updated paths
   - Example: `/about/history` → `/company/about/history`
4. **Descendant Levels**: All children should have updated levels

### After Reordering Pages
1. **Order Values**: Should be sequential (0, 1, 2, ...)
2. **Sibling Order**: Pages should appear in correct order
3. **No Gaps**: Order values should not have gaps

---

## Error Message Verification

For each blocked operation, verify the error message includes:
1. **Permission status**: Whether user has permission or not
2. **Role information**: User's current role
3. **Status information**: Current workflow status of page(s)
4. **Requirement**: What's needed (role + permission)
5. **Blocked Pages**: For batch operations, which pages are blocked

Example error messages:
- "User has 'update' permission but role 'editor' is not appropriate for status 'in_review'. Requires reviewer+"
- "Cannot modify page tree. Page is in 'pending_approval' status. Only draft pages can be modified without permission."
- "Cannot reorder pages. The following pages cannot be reordered: Page C (in_review), Page D (pending_approval)"

---

## Test Checklist

### Move Page Tests
- [ ] Editor (no permission) can move draft page
- [ ] Editor (no permission) cannot move page in review
- [ ] Editor (no permission) cannot move page in pending approval
- [ ] Editor (with permission) can move draft page
- [ ] Editor (with permission) cannot move page in review (role not appropriate)
- [ ] Reviewer (with permission) can move draft page
- [ ] Reviewer (with permission) can move page in review
- [ ] Reviewer (with permission) cannot move page in pending approval
- [ ] Approver (with permission) can move page in pending approval
- [ ] Approver (with permission) cannot move page in pending publish
- [ ] Admin can move page in any status
- [ ] Path and level updated correctly after move
- [ ] Descendant paths updated correctly after move

### Reorder Pages Tests
- [ ] Editor (no permission) can reorder draft pages
- [ ] Editor (no permission) cannot reorder pages in review
- [ ] Editor (no permission) cannot reorder mixed status pages
- [ ] Editor (with permission) can reorder draft pages
- [ ] Editor (with permission) cannot reorder pages in review (role not appropriate)
- [ ] Reviewer (with permission) can reorder pages in review
- [ ] Reviewer (with permission) cannot reorder pages in pending approval
- [ ] Approver (with permission) can reorder pages in pending approval
- [ ] Approver (with permission) cannot reorder pages in pending publish
- [ ] Admin can reorder pages in any status
- [ ] Order values updated correctly after reorder
- [ ] Batch validation works correctly

### Edge Cases
- [ ] Circular reference prevention works
- [ ] Descendant path updates work correctly
- [ ] Large batch reorder works
- [ ] Mixed status batch shows correct error messages

---

## API Endpoints to Test

### Move Page
```http
PUT /api/pages/:id/move
Content-Type: application/json
Authorization: Bearer {token}

{
  "parentId": "new_parent_id" // or null for root
}
```

### Reorder Pages
```http
PUT /api/pages/reorder
Content-Type: application/json
Authorization: Bearer {token}

{
  "pageOrders": [
    { "pageId": "page1_id", "order": 0 },
    { "pageId": "page2_id", "order": 1 },
    { "pageId": "page3_id", "order": 2 }
  ]
}
```

---

## Success Criteria

✅ All test scenarios pass
✅ Error messages are clear and informative
✅ Permissions and role hierarchy work together correctly
✅ Admin/Super Admin bypass works
✅ Path and level calculations are correct
✅ Descendant updates work correctly
✅ Batch operations validate all pages
✅ Circular reference prevention works

---

## Notes

1. **Permission + Role Hierarchy**: Both must align for tree modifications
2. **Draft Status**: Without permission, only draft pages can be moved/reordered
3. **Admin Bypass**: Admin/Super Admin always bypass all restrictions
4. **Batch Operations**: All pages in batch must pass validation
5. **Descendant Updates**: Moving a page should update all descendant paths and levels

