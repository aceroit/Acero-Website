# Acero CMS - Postman Testing Collections

Complete API testing suite for the Acero CMS RBAC system with 5 modular Postman collections covering all phases of implementation.

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Collection Details](#collection-details)
- [Environment Setup](#environment-setup)
- [Execution Order](#execution-order)
- [Pre-Populated Test Data](#pre-populated-test-data)
- [Expected Results](#expected-results)
- [Troubleshooting](#troubleshooting)
- [CI/CD Integration](#cicd-integration)

## 🎯 Overview

This testing suite provides **comprehensive end-to-end testing** for the Acero CMS RBAC implementation across 5 phases:

| Phase | Collection File | Requests | Description |
|-------|----------------|----------|-------------|
| **Phase 1** | `Phase1_Authentication_RBAC.postman_collection.json` | 34 | Authentication, User Management, Permission System |
| **Phase 2** | `Phase2_Page_Section_System.postman_collection.json` | 54 | Page Tree, Section Management, Section Types |
| **Phase 3** | `Phase3_Approval_Workflow.postman_collection.json` | 44 | Workflow State Machine, Versioning, Notifications |
| **Phase 4** | `Phase4_Activity_Services.postman_collection.json` | 36 | Activity Logging, Media Management, Validation |
| **Phase 5** | `Phase5_E2E_Workflows.postman_collection.json` | 27 | Complete User Journeys, Integration Testing |

**Total:** **195 API test requests** with automated validation scripts.

### ✨ Key Features

- ✅ **Automated Testing** - All requests include comprehensive test scripts
- ✅ **Token Management** - JWT tokens captured and reused automatically
- ✅ **Dynamic Data** - Environment variables capture IDs for chained requests
- ✅ **RBAC Validation** - Permission boundary testing across all 6 roles
- ✅ **Workflow Testing** - Complete state machine validation
- ✅ **Negative Testing** - Invalid data, XSS attempts, permission denials
- ✅ **CI/CD Ready** - Can be run via Newman for automation

## 🚀 Quick Start

### 1. Prerequisites

- ✅ Backend server running on `http://localhost:5000` (or configure `base_url`)
- ✅ MongoDB connected and empty/clean database
- ✅ Postman installed (Desktop or Web)
- ✅ `.env` file configured with required credentials

### 2. Import Collections

1. Open Postman
2. Click **Import** button
3. Select all 5 collection files:
   - `Phase1_Authentication_RBAC.postman_collection.json`
   - `Phase2_Page_Section_System.postman_collection.json`
   - `Phase3_Approval_Workflow.postman_collection.json`
   - `Phase4_Activity_Services.postman_collection.json`
   - `Phase5_E2E_Workflows.postman_collection.json`
4. Import the environment file:
   - `ACERO_CMS_Environment.postman_environment.json`

### 3. Configure Environment

1. Select **ACERO CMS Environment** from the environment dropdown
2. Edit environment variables:
   - Set `base_url` to your backend URL (default: `http://localhost:5000`)
   - Leave all token and ID variables empty (they'll be auto-populated)
3. Save environment

### 4. Run Collections

**First-Time Setup (Complete Flow):**

Run collections in order:

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
```

**Individual Testing (After Phase 1):**

You can run any individual phase after Phase 1 is complete (tokens captured).

### 5. View Results

- ✅ Green checkmarks = Tests passed
- ❌ Red X marks = Tests failed
- 📊 View test results in Postman's **Test Results** tab
- 📝 Check **Console** for detailed logs

## 📁 Collection Details

### Phase 1 - Authentication & RBAC (34 requests)

**Folders:**
1. **Register & Login** (16 requests)
   - Register 6 users (one per role)
   - Login all users and capture tokens
   - Test invalid credentials
   - Profile management

2. **User Management** (9 requests)
   - Get all users (RBAC tested)
   - Create/update/delete users
   - Role management
   - User statistics

3. **Permission Management** (10 requests)
   - Get permission matrix
   - Role permissions CRUD
   - Permission checking
   - Update permissions (Super Admin only)

**Key Features:**
- Captures all 6 role tokens automatically
- Tests RBAC boundaries
- Validates permission inheritance

---

### Phase 2 - Page-Section System (54 requests)

**Folders:**
1. **Section Types** (8 requests)
   - Seed default types (hero, text_block, image_gallery, etc.)
   - Custom section type creation
   - Usage tracking
   - CRUD operations

2. **Page Tree Management** (16 requests)
   - Create hierarchical page structure
   - Tree navigation (breadcrumb, children)
   - Move pages between parents
   - Reorder siblings
   - Duplicate pages

3. **Section Management** (16 requests)
   - Create sections for all types
   - Content validation
   - Reorder sections
   - Toggle visibility
   - Duplicate sections

4. **Public API** (6 requests)
   - Get published page tree
   - Get page by slug
   - Verify draft content not exposed
   - Cache header validation

**Key Features:**
- Tests hierarchical path calculations
- Validates content schemas per section type
- Tests public vs authenticated endpoints

---

### Phase 3 - Approval Workflow (44 requests)

**Folders:**
1. **Content Workflow Lifecycle** (17 requests)
   - Complete state machine: `draft → in_review → pending_approval → pending_publish → published`
   - Test changes requested flow
   - Archive/restore operations
   - Invalid transition attempts

2. **Section Workflow** (5 requests)
   - Complete workflow cycle for sections
   - Parallel workflows tested

3. **Version Management** (4 requests)
   - Get version history
   - Compare versions
   - Restore previous versions
   - Diff visualization

4. **Dashboard & Analytics** (12 requests)
   - Workflow metrics
   - User workload
   - Team activity
   - Pending items by role
   - Productivity statistics
   - Bottleneck detection

5. **Notifications** (6 requests)
   - Get notifications (paginated)
   - Unread count
   - Mark as read (single/bulk)
   - Delete notifications

**Key Features:**
- Validates state machine logic
- Tests role-based workflow actions
- Verifies notification triggers

---

### Phase 4 - Activity Logging & Services (36 requests)

**Folders:**
1. **Activity Logs** (10 requests)
   - Query all activities
   - Filter by date, action, resource
   - User-specific activity
   - Resource history
   - Export logs (CSV)
   - Activity statistics

2. **Media Management** (13 requests)
   - Upload images/videos
   - File validation (type, size)
   - Search media
   - Organize by folders
   - Track media usage
   - Bulk operations
   - Invalid file testing

3. **Validation Testing** (6 requests)
   - XSS prevention
   - Invalid ObjectId handling
   - Email validation
   - Pagination limits
   - Required field validation

**Key Features:**
- Auto-logging verification
- File upload testing
- Input sanitization validation

---

### Phase 5 - End-to-End Workflows (27 requests)

**Folders:**
1. **Complete Content Creation Flow** (15 requests)
   - Step-by-step journey from draft to published
   - Multi-role collaboration
   - Verification in public API
   - Activity log validation

2. **User Management Flow** (6 requests)
   - Create user → Assign role → Test permissions
   - Verify default permissions
   - Test action boundaries

3. **Permission Boundary Testing** (6 requests)
   - Viewer read-only access
   - Editor creation rights
   - Reviewer approval rights
   - Admin publish rights
   - Super Admin full access

**Key Features:**
- Real-world user journeys
- Integration testing across all modules
- Permission boundary validation

## ⚙️ Environment Setup

### Required Variables

The environment file includes 40+ variables that are automatically populated during test execution:

**Base Configuration:**
- `base_url` - Backend API URL (default: `http://localhost:5000`)

**Authentication Tokens (auto-captured):**
- `super_admin_token`
- `admin_token`
- `approver_token`
- `reviewer_token`
- `editor_token`
- `viewer_token`

**User IDs (auto-captured):**
- `super_admin_id`, `admin_id`, `approver_id`, `reviewer_id`, `editor_id`, `viewer_id`

**Dynamic Test Data (auto-captured):**
- Page IDs: `home_page_id`, `about_page_id`, `workflow_page_id`, etc.
- Section IDs: `hero_section_id`, `text_section_id`, etc.
- Media IDs: `test_media_id`
- Workflow IDs: `notification_id`, `version_1`, `version_2`

### Manual Configuration

Only `base_url` needs manual configuration if not using default `http://localhost:5000`.

## 📝 Execution Order

### First Run (Complete Setup)

**Run in this exact order:**

1. **Phase 1** - Authentication & RBAC (~2 minutes)
   - Creates 6 users (one per role)
   - Captures JWT tokens
   - **Required** for all other phases

2. **Phase 2** - Page-Section System (~3 minutes)
   - Creates pages and sections
   - Used in Phase 3-5 testing

3. **Phase 3** - Approval Workflow (~3 minutes)
   - Tests workflow on created content
   - Generates notifications

4. **Phase 4** - Activity Logging & Services (~2 minutes)
   - Validates logging of previous actions
   - Tests media upload

5. **Phase 5** - End-to-End Workflows (~4 minutes)
   - Complete integration testing
   - Real-world scenarios

**Total Runtime:** ~14 minutes

### Ongoing Development

After initial setup, you can run individual phases:

- **Working on workflow?** → Run Phase 3 only
- **Testing new section type?** → Run Phase 2 folder: "Section Types"
- **Permission changes?** → Run Phase 1 folder: "Permission Management"

**Note:** Always ensure Phase 1 has been run at least once so tokens exist in environment.

## 👥 Pre-Populated Test Data

### User Accounts

All users have the same password pattern: `{Role}@123`

| Role | Email | Password | Capabilities |
|------|-------|----------|-------------|
| **Super Admin** | `superadmin@acero.com` | `SuperAdmin@123` | Full system access, permission management |
| **Admin** | `admin@acero.com` | `Admin@123` | Publish content, manage users |
| **Approver** | `approver@acero.com` | `Approver@123` | Approve content for publishing |
| **Reviewer** | `reviewer@acero.com` | `Reviewer@123` | Review and provide feedback |
| **Editor** | `editor@acero.com` | `Editor@123` | Create and edit content |
| **Viewer** | `viewer@acero.com` | `Viewer@123` | Read-only access |

### Sample Content Created

**Pages:**
- Home (`/home`)
- About Us (`/about-us`)
  - Our History (`/about-us/our-history`)
    - Leadership Team (`/about-us/our-history/leadership-team`)
- Products (`/products`)
- Workflow Test Page (for workflow testing)

**Section Types:**
- Hero (large banner with CTA)
- Text Block (rich text content)
- Image Gallery (multiple images in grid)
- Features Grid (feature cards)
- Video (embedded video)
- Timeline (chronological events)

**Sections:**
- Hero sections on Home
- Text blocks on multiple pages
- Features grid showcasing services
- Image galleries
- Timeline on History page

## ✅ Expected Results

### Phase 1 Success Criteria

- ✅ All 6 users registered successfully
- ✅ All 6 users logged in, tokens captured
- ✅ Invalid login returns 401
- ✅ Editor cannot access user management (403)
- ✅ Super Admin can manage permissions
- ✅ All tests passing: **34/34**

### Phase 2 Success Criteria

- ✅ Default section types seeded
- ✅ Pages created with correct hierarchy
- ✅ Paths calculated correctly (e.g., `/about-us/our-history`)
- ✅ Sections created for all types
- ✅ Content validation working
- ✅ Public API returns only published content
- ✅ All tests passing: **54/54**

### Phase 3 Success Criteria

- ✅ Page transitions through all workflow states
- ✅ Invalid transitions rejected (400)
- ✅ Notifications created for workflow events
- ✅ Version history captured
- ✅ Dashboard shows correct metrics
- ✅ All tests passing: **44/44**

### Phase 4 Success Criteria

- ✅ Activity logs capture all actions
- ✅ Media uploads successfully
- ✅ Invalid files rejected
- ✅ XSS attempts sanitized
- ✅ Activity export works (CSV)
- ✅ All tests passing: **36/36**

### Phase 5 Success Criteria

- ✅ Complete E2E flow: draft → published
- ✅ Content accessible in public API
- ✅ All workflow steps logged
- ✅ Permission boundaries enforced
- ✅ Viewer cannot create content (403)
- ✅ Admin can publish content
- ✅ All tests passing: **27/27**

## 🔧 Troubleshooting

### Issue: Tests Failing in Phase 1

**Symptoms:**
- Registration fails with 500 error
- Login returns 401 for valid credentials

**Solutions:**
1. **Check backend is running:**
   ```bash
   curl http://localhost:5000/health
   ```

2. **Verify MongoDB connection:**
   - Check backend logs for connection errors
   - Ensure MongoDB is running: `mongosh`

3. **Check environment variables:**
   - Verify `.env` file exists in backend folder
   - Check JWT_SECRET is set
   - Verify MONGODB_URI is correct

4. **Clear database (if re-running):**
   ```bash
   mongosh
   use acero_cms
   db.dropDatabase()
   ```

### Issue: 401 Unauthorized in Phase 2+

**Symptoms:**
- All requests return 401
- Token seems invalid

**Solutions:**
1. **Re-run Phase 1:**
   - Tokens may have expired
   - Run entire Phase 1 collection to get fresh tokens

2. **Check token in environment:**
   - Click environment dropdown → Edit
   - Verify tokens are populated (not empty)
   - Check token format: should start with `eyJ`

3. **Check JWT expiration:**
   - Default expiration is 7 days
   - If testing over multiple sessions, tokens may expire

### Issue: 404 Not Found for Pages/Sections

**Symptoms:**
- Requests to get page by ID return 404
- Page IDs seem invalid

**Solutions:**
1. **Ensure Phase 2 ran successfully:**
   - Check that pages were created
   - Verify environment variables contain page IDs

2. **Check database:**
   ```javascript
   db.pages.find()
   ```

3. **Re-run Phase 2:**
   - Clear page-related environment variables
   - Run Phase 2 again

### Issue: 403 Forbidden Errors

**Symptoms:**
- Requests return 403 when they should succeed
- Permission denied messages

**Solutions:**
1. **Verify correct token is being used:**
   - Check request uses correct role's token
   - Example: Only `admin_token` can publish

2. **Check permissions seeded:**
   - Run: `GET /api/permissions/matrix`
   - Verify role has required permissions

3. **Re-seed permissions:**
   - If permissions missing, run seeder:
   ```bash
   npm run seed:permissions
   ```

### Issue: Workflow Transitions Fail

**Symptoms:**
- Cannot move from draft to in_review
- "Invalid transition" errors

**Solutions:**
1. **Check current status:**
   - Get page: `GET /api/pages/{id}`
   - Verify current status

2. **Verify correct endpoint:**
   - `draft → in_review`: Use `/submit`
   - `in_review → pending_approval`: Use `/review`
   - `pending_approval → pending_publish`: Use `/approve`

3. **Check role permissions:**
   - Editor can submit
   - Reviewer can review
   - Approver can approve
   - Admin can publish

### Issue: Media Upload Fails

**Symptoms:**
- 400 error on upload
- "Invalid file type" message

**Solutions:**
1. **Check file type:**
   - Supported: jpg, jpeg, png, gif, webp, mp4, mov
   - Not supported: exe, zip, rar, etc.

2. **Check file size:**
   - Images: Max 10MB
   - Videos: Max 100MB

3. **Verify Cloudinary configured:**
   - Check `.env` for Cloudinary credentials
   - Test Cloudinary connection

### Issue: Newman CLI Errors

**Symptoms:**
- Newman reports missing environment variables
- Tests fail in CI/CD

**Solutions:**
1. **Export environment:**
   ```bash
   newman run Phase1_Authentication_RBAC.postman_collection.json \
     -e ACERO_CMS_Environment.postman_environment.json
   ```

2. **Set base_url:**
   ```bash
   newman run ... --env-var "base_url=https://api.production.com"
   ```

3. **Check Newman version:**
   ```bash
   newman --version  # Should be 5.x or higher
   ```

## 🔄 CI/CD Integration

### Using Newman (Postman CLI)

Install Newman:
```bash
npm install -g newman
```

### Run Single Collection

```bash
newman run Phase1_Authentication_RBAC.postman_collection.json \
  -e ACERO_CMS_Environment.postman_environment.json \
  --reporters cli,json \
  --reporter-json-export results.json
```

### Run All Collections (Sequential)

```bash
#!/bin/bash

# Navigate to postman directory
cd backend/postman

# Run Phase 1 (required for tokens)
newman run Phase1_Authentication_RBAC.postman_collection.json \
  -e ACERO_CMS_Environment.postman_environment.json \
  --export-environment temp-env.json

# Run Phase 2 (uses tokens from Phase 1)
newman run Phase2_Page_Section_System.postman_collection.json \
  -e temp-env.json \
  --export-environment temp-env.json

# Run Phase 3
newman run Phase3_Approval_Workflow.postman_collection.json \
  -e temp-env.json \
  --export-environment temp-env.json

# Run Phase 4
newman run Phase4_Activity_Services.postman_collection.json \
  -e temp-env.json \
  --export-environment temp-env.json

# Run Phase 5
newman run Phase5_E2E_Workflows.postman_collection.json \
  -e temp-env.json

# Cleanup
rm temp-env.json
```

### GitHub Actions Example

```yaml
name: API Tests

on: [push, pull_request]

jobs:
  api-tests:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:6
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend
          npm install
          npm install -g newman
      
      - name: Start backend server
        run: |
          cd backend
          npm start &
          sleep 10
      
      - name: Run Postman Tests
        run: |
          cd backend/postman
          ./run-all-tests.sh
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: newman-results
          path: backend/postman/*.json
```

### Jenkins Pipeline Example

```groovy
pipeline {
    agent any
    
    stages {
        stage('Setup') {
            steps {
                sh 'npm install -g newman'
                sh 'cd backend && npm install'
            }
        }
        
        stage('Start Services') {
            steps {
                sh 'docker-compose up -d mongodb'
                sh 'cd backend && npm start &'
                sleep 10
            }
        }
        
        stage('Run API Tests') {
            steps {
                dir('backend/postman') {
                    sh './run-all-tests.sh'
                }
            }
        }
    }
    
    post {
        always {
            junit 'backend/postman/**/*.xml'
            archiveArtifacts 'backend/postman/**/*.json'
        }
    }
}
```

## 📊 Test Coverage Summary

| Category | Coverage |
|----------|----------|
| **Authentication** | Login, Register, Token Management, Profile |
| **RBAC** | 6 roles, Permission matrix, Boundary testing |
| **Pages** | CRUD, Hierarchy, Tree navigation, Public API |
| **Sections** | All 6 types, Content validation, Reordering |
| **Workflow** | 8 states, All transitions, Notifications |
| **Versioning** | History, Comparison, Restore |
| **Activity Logging** | All actions logged, Export, Filtering |
| **Media** | Upload, Validation, Usage tracking |
| **Validation** | XSS prevention, Input sanitization |
| **E2E Scenarios** | Complete user journeys, Integration testing |

## 🎯 Best Practices

1. **Always run Phase 1 first** - Other phases depend on captured tokens
2. **Use Collection Runner** - Run entire collections, not individual requests
3. **Check Console** - Valuable debug information in logs
4. **Clear data between full runs** - Drop database for clean state
5. **Export environment after changes** - Save dynamic variables
6. **Use folders for focused testing** - No need to run entire collection every time

## 📚 Additional Resources

- [Postman Documentation](https://learning.postman.com/)
- [Newman CLI Documentation](https://github.com/postmanlabs/newman)
- [Backend API Documentation](../API_DOCUMENTATION.md)
- [RBAC Implementation Guide](../RBAC_GUIDE.md)

## 🤝 Support

For issues or questions:
1. Check **Troubleshooting** section above
2. Review backend logs for detailed error messages
3. Verify environment configuration
4. Check MongoDB data state

## 📄 License

Copyright © 2025 Acero Steel. All rights reserved.

---

**Happy Testing! 🚀**

