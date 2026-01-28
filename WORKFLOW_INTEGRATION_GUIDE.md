# Approval Workflow Integration Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Backend Integration](#backend-integration)
5. [Frontend Integration](#frontend-integration)
6. [Testing Checklist](#testing-checklist)
7. [Common Patterns & Examples](#common-patterns--examples)
8. [Troubleshooting](#troubleshooting)

---

## Overview

This guide provides step-by-step instructions for integrating new modules (e.g., Projects, Media, Branches) into the existing approval workflow system. The workflow system supports:

- **Multi-stage approval**: draft → in_review → pending_approval → pending_publish → published
- **Role-based permissions**: Editor, Reviewer, Approver, Admin, Super Admin
- **Status-based restrictions**: CRUD operations blocked based on workflow status
- **Version tracking**: Automatic version history for all changes
- **Notifications**: In-app and email notifications for workflow events
- **Creator privileges**: Special permissions for content creators

---

## Architecture

### Workflow States
```
draft → in_review → pending_approval → pending_publish → published
         ↓              ↓                    ↓
    changes_requested ← ← ← ← ← ← ← ← ← ← ← ←
         ↓
      archived
```

### Key Components

**Backend:**
- `workflowValidator.js` - Validates state transitions and permissions
- `workflowStatusValidator.js` - Checks CRUD permissions based on status
- `workflowController.js` - Handles all workflow actions
- `notificationService.js` - Sends notifications for workflow events

**Frontend:**
- `WorkflowActions.jsx` - Displays workflow action buttons
- `WorkflowStatusBadge.jsx` - Shows current status
- `WorkflowTimeline.jsx` - Shows workflow history
- `WorkflowStatusGuard.jsx` - Disables forms based on status
- `useWorkflowStatus.js` - Hook for permission checks

---

## Prerequisites

Before integrating a new module, ensure you have:

1. ✅ A MongoDB model for your resource (e.g., `Project.js`, `Media.js`)
2. ✅ A controller for CRUD operations (e.g., `projectController.js`)
3. ✅ Routes set up for your resource
4. ✅ Basic CRUD functionality working
5. ✅ Understanding of your resource's data structure

---

## Backend Integration

### Step 1: Update Model Schema

Add workflow status field to your model schema:

```javascript
// backend/models/Project.js (example)
const projectSchema = new mongoose.Schema({
    // ... your existing fields ...
    
    // Workflow status field (REQUIRED)
    status: {
        type: String,
        enum: [
            'draft',
            'in_review',
            'pending_approval',
            'pending_publish',
            'published',
            'changes_requested',
            'archived'
        ],
        default: 'draft',
        index: true // Important for queries
    },
    
    // Creator tracking (REQUIRED for creator privileges)
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    
    // Updater tracking (REQUIRED for version history)
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    
    // Soft delete flag (if using soft deletes)
    isActive: {
        type: Boolean,
        default: true,
        index: true
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});
```

**Important Notes:**
- The `status` field must use the exact enum values shown above
- `createdBy` is required for creator privilege checks
- `updatedBy` is used for version history tracking
- Always index `status` and `createdBy` for performance

---

### Step 2: Create Resource Document

Create a Resource document in the database for your new module. This is used for permission checks.

**Option A: Using Migration Script**

Add your resource to `backend/scripts/migrateResources.js`:

```javascript
const defaultResources = [
    // ... existing resources ...
    {
        name: 'Projects',
        slug: 'projects', // Must be plural
        path: '/projects',
        icon: 'ProjectOutlined',
        description: 'Project management',
        category: 'Content',
        showInMenu: true,
        order: 10
    }
];
```

Then run:
```bash
node backend/scripts/migrateResources.js
```

**Option B: Manual Creation**

```javascript
// Run in MongoDB shell or create a script
const Resource = require('./models/Resource');

const projectResource = new Resource({
    name: 'Projects',
    slug: 'projects', // Must be plural
    path: '/projects',
    icon: 'ProjectOutlined',
    description: 'Project management',
    category: 'Content',
    showInMenu: true,
    order: 10,
    isActive: true
});

await projectResource.save();
```

**Important:**
- Resource slug must be **plural** (e.g., `projects`, `media`, `branches`)
- This is used for permission checks throughout the system

---

### Step 3: Update Workflow Routes

Add your resource to the valid resources list in `backend/routes/workflowRoutes.js`:

```javascript
// backend/routes/workflowRoutes.js
const validateResource = (req, res, next) => {
    const { resource } = req.params;
    const validResources = ['page', 'section', 'project']; // Add your resource here
    
    if (!validResources.includes(resource)) {
        return res.status(400).json({
            success: false,
            message: `Invalid resource type. Must be one of: ${validResources.join(', ')}`
        });
    }
    
    next();
};
```

**Note:** The resource name in routes should be **singular** (e.g., `project`, `media`, `branch`), but the Resource document slug should be **plural** (e.g., `projects`, `media`, `branches`).

---

### Step 4: Update Workflow Controller

Add your model to the `getModel` function in `backend/controllers/workflowController.js`:

```javascript
// backend/controllers/workflowController.js
function getModel(resource) {
    const models = {
        page: Page,
        section: Section,
        project: require('../models/Project') // Add your model here
    };
    return models[resource];
}
```

**Update `getResourceTitle` function** to handle your resource's title field:

```javascript
// backend/controllers/workflowController.js
function getResourceTitle(resource) {
    // For pages, use title
    if (resource.title) {
        return resource.title;
    }
    
    // For projects, use name or title
    if (resource.name) {
        return resource.name;
    }
    
    // For sections, try to get title from content
    if (resource.content) {
        if (resource.content.title) {
            return resource.content.title;
        }
        // ... rest of section logic
    }
    
    return 'Untitled';
}
```

**Add section synchronization logic** (if your resource has child resources):

If your resource has associated child resources (like pages have sections), you need to update their status when the parent status changes. For example, in `submitForReview`:

```javascript
// If this is a project, update all its tasks to in_review as well
if (resource === 'project') {
    const Task = require('../models/Task');
    await Task.updateMany(
        { projectId: item._id, status: { $in: ['draft', 'changes_requested'] } },
        { 
            $set: { 
                status: WORKFLOW_STATES.IN_REVIEW,
                updatedBy: req.user._id
            } 
        }
    );
}
```

Apply similar logic to all workflow actions:
- `submitForReview` - Update children to `in_review`
- `markReviewed` - Update children to `pending_approval`
- `requestChanges` - Update children to `changes_requested`
- `approveContent` - Update children to `pending_publish`
- `rejectContent` - Update children to `changes_requested`
- `publishContent` - Update children to `published`
- `unpublishContent` - Update children to `draft`
- `archiveContent` - Update children to `archived`
- `restoreContent` - Update children to `draft`

---

### Step 5: Update Controller with Workflow Validation

Update your resource controller (e.g., `projectController.js`) to use workflow status validation:

```javascript
// backend/controllers/projectController.js
const { 
    canEditContent, 
    canDeleteContent, 
    canCreateContent 
} = require('../utils/workflowStatusValidator');

// In your update function
exports.updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project.findById(id);
        
        if (!project) {
            return errorResponse(res, 404, 'Project not found');
        }
        
        // Check if user can edit based on workflow status
        const canEdit = await canEditContent(
            req.user._id,
            'projects', // Use plural form
            project,
            project.createdBy
        );
        
        if (!canEdit.allowed) {
            return errorResponse(res, 403, canEdit.message);
        }
        
        // ... rest of update logic
    } catch (error) {
        // ... error handling
    }
};

// In your delete function
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(id);
        
        if (!project) {
            return errorResponse(res, 404, 'Project not found');
        }
        
        // Check if user can delete based on workflow status
        const canDelete = await canDeleteContent(
            req.user._id,
            'projects', // Use plural form
            project,
            project.createdBy
        );
        
        if (!canDelete.allowed) {
            return errorResponse(res, 403, canDelete.message);
        }
        
        // ... rest of delete logic
    } catch (error) {
        // ... error handling
    }
};
```

**Important:**
- Always use the **plural form** (`projects`, `media`, `branches`) when calling workflow validators
- The validators will automatically normalize singular to plural internally

---

### Step 6: Update Workflow Validator (if needed)

The `workflowValidator.js` should work automatically for new resources, but verify:

1. **Resource type normalization** - The validator automatically converts singular to plural:
   ```javascript
   // 'project' → 'projects'
   // 'media' → 'media' (already plural)
   // 'branch' → 'branches'
   ```

2. **Permission checks** - The validator checks permissions on both:
   - The `workflow` resource (generic workflow permissions)
   - The actual resource (e.g., `projects`, `media`, `branches`)

No changes needed unless you have special requirements.

---

### Step 7: Set Up Permissions

Assign permissions to roles for your new resource. You can do this:

**Option A: Via Admin Panel**
1. Navigate to `/permissions`
2. Select a role
3. Grant permissions for your resource (e.g., `projects:read`, `projects:create`, `projects:update`, `projects:delete`)

**Option B: Via Script**

```javascript
// backend/scripts/setupPermissions.js (example)
const Permission = require('../models/Permission');
const Resource = require('../models/Resource');
const Role = require('../models/Role');

async function setupProjectPermissions() {
    const projectsResource = await Resource.findOne({ slug: 'projects' });
    const editorRole = await Role.findOne({ slug: 'editor' });
    
    // Grant editor permissions
    await Permission.findOneAndUpdate(
        { resource: projectsResource._id, role: editorRole._id },
        {
            resource: projectsResource._id,
            role: editorRole._id,
            actions: ['read', 'create', 'update'], // Editors can read, create, update
            isActive: true
        },
        { upsert: true, new: true }
    );
    
    // Similar for other roles...
}
```

**Required Permissions by Role:**
- **Editor**: `read`, `create`, `update`
- **Reviewer**: `read`, `update` (for review actions)
- **Approver**: `read`, `approve`
- **Admin**: `read`, `create`, `update`, `delete`, `publish`
- **Super Admin**: All permissions (bypasses checks)

---

## Frontend Integration

### Step 1: Create Service File

Create a service file for your resource API calls (if not already created):

```javascript
// admin-panel/src/services/projectService.js
import API from './api';

export const getAllProjects = async (params = {}) => {
    const response = await API.get('/projects', { params });
    return response.data;
};

export const getProject = async (id) => {
    const response = await API.get(`/projects/${id}`);
    return response.data;
};

export const createProject = async (data) => {
    const response = await API.post('/projects', data);
    return response.data;
};

export const updateProject = async (id, data) => {
    const response = await API.put(`/projects/${id}`, data);
    return response.data;
};

export const deleteProject = async (id) => {
    const response = await API.delete(`/projects/${id}`);
    return response.data;
};
```

The workflow service (`workflowService.js`) already supports all resources, so no changes needed there.

---

### Step 2: Create Editor Page

Create an editor page for your resource (e.g., `ProjectEditor.jsx`):

```javascript
// admin-panel/src/pages/ProjectEditor.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Spin, message } from 'antd';
import { getProject, createProject, updateProject } from '../services/projectService';
import WorkflowStatusBadge from '../components/workflow/WorkflowStatusBadge';
import WorkflowActions from '../components/workflow/WorkflowActions';
import WorkflowTimeline from '../components/workflow/WorkflowTimeline';
import WorkflowStatusGuard from '../components/workflow/WorkflowStatusGuard';
import useWorkflowStatus from '../hooks/useWorkflowStatus';

const ProjectEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [project, setProject] = useState(null);
    const [availableActions, setAvailableActions] = useState(null);

    // Workflow status hook
    const workflowStatus = useWorkflowStatus({
        status: project?.status || 'draft',
        resourceType: 'project', // Singular form
        createdBy: project?.createdBy?._id
    });

    // Fetch project
    useEffect(() => {
        if (id && id !== 'new') {
            fetchProject();
        }
    }, [id]);

    const fetchProject = async () => {
        setLoading(true);
        try {
            const response = await getProject(id);
            if (response.success) {
                setProject(response.project);
                form.setFieldsValue(response.project);
            }
        } catch (error) {
            message.error('Failed to load project');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            let response;
            if (id === 'new') {
                response = await createProject(values);
            } else {
                response = await updateProject(id, values);
            }
            
            if (response.success) {
                message.success(response.message);
                if (id === 'new') {
                    navigate(`/projects/${response.project._id}`);
                } else {
                    fetchProject(); // Refresh to get updated status
                }
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to save project');
        } finally {
            setLoading(false);
        }
    };

    const handleWorkflowAction = () => {
        // Refresh project after workflow action
        fetchProject();
    };

    if (loading && !project) {
        return <Spin size="large" />;
    }

    return (
        <div style={{ padding: '24px' }}>
            <Card>
                {/* Workflow Status Badge */}
                {project && (
                    <div style={{ marginBottom: '16px' }}>
                        <WorkflowStatusBadge status={project.status} />
                    </div>
                )}

                {/* Workflow Actions */}
                {project && (
                    <div style={{ marginBottom: '16px' }}>
                        <WorkflowActions
                            resource="project" // Singular form
                            resourceId={project._id}
                            currentStatus={project.status}
                            createdBy={project.createdBy?._id}
                            availableActions={availableActions}
                            onActionComplete={handleWorkflowAction}
                        />
                    </div>
                )}

                {/* Form with Workflow Guard */}
                <WorkflowStatusGuard
                    resourceType="project" // Singular form
                    status={project?.status || 'draft'}
                    createdBy={project?.createdBy?._id}
                    action="edit"
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                    >
                        <Form.Item
                            name="name"
                            label="Project Name"
                            rules={[{ required: true, message: 'Project name is required' }]}
                        >
                            <Input placeholder="Enter project name" />
                        </Form.Item>

                        {/* Add more form fields as needed */}

                        <Form.Item>
                            <Button 
                                type="primary" 
                                htmlType="submit" 
                                loading={loading}
                            >
                                {id === 'new' ? 'Create Project' : 'Update Project'}
                            </Button>
                        </Form.Item>
                    </Form>
                </WorkflowStatusGuard>

                {/* Workflow Timeline */}
                {project && (
                    <div style={{ marginTop: '24px' }}>
                        <WorkflowTimeline
                            resource="project" // Singular form
                            resourceId={project._id}
                        />
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ProjectEditor;
```

**Key Points:**
- Use `resource="project"` (singular) in all workflow components
- Wrap your form with `WorkflowStatusGuard` to disable it when needed
- Use `useWorkflowStatus` hook for permission checks
- Refresh data after workflow actions

---

### Step 3: Update App Routes

Add routes for your resource in `admin-panel/src/App.jsx`:

```javascript
// admin-panel/src/App.jsx
import ProjectEditor from './pages/ProjectEditor';
import Projects from './pages/Projects'; // List page

// In Routes:
<Route
    path="/projects"
    element={
        <ProtectedRoute resource="projects" action="read">
            <Projects />
        </ProtectedRoute>
    }
/>
<Route
    path="/projects/new"
    element={
        <ProtectedRoute resource="projects" action="create">
            <ProjectEditor />
        </ProtectedRoute>
    }
/>
<Route
    path="/projects/:id"
    element={
        <ProtectedRoute resource="projects" action="read">
            <ProjectEditor />
        </ProtectedRoute>
    }
/>
```

---

### Step 4: Create List Page (Optional)

If you need a list page, create it similar to `Pages.jsx`:

```javascript
// admin-panel/src/pages/Projects.jsx
import { useState, useEffect } from 'react';
import { Table, Button, Tag, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getAllProjects } from '../services/projectService';
import WorkflowStatusBadge from '../components/workflow/WorkflowStatusBadge';
import useWorkflowStatus from '../hooks/useWorkflowStatus';

const Projects = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const response = await getAllProjects();
            if (response.success) {
                setProjects(response.projects);
            }
        } catch (error) {
            console.error('Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => <WorkflowStatusBadge status={status} />
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button onClick={() => navigate(`/projects/${record._id}`)}>
                        Edit
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                <h1>Projects</h1>
                <Button type="primary" onClick={() => navigate('/projects/new')}>
                    Create Project
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={projects}
                loading={loading}
                rowKey="_id"
            />
        </div>
    );
};

export default Projects;
```

---

### Step 5: Use Workflow Components

All workflow components are reusable. Here's how to use them:

**WorkflowStatusBadge:**
```javascript
<WorkflowStatusBadge status={project.status} />
```

**WorkflowActions:**
```javascript
<WorkflowActions
    resource="project" // Singular
    resourceId={project._id}
    currentStatus={project.status}
    createdBy={project.createdBy?._id}
    onActionComplete={handleRefresh}
/>
```

**WorkflowTimeline:**
```javascript
<WorkflowTimeline
    resource="project" // Singular
    resourceId={project._id}
/>
```

**WorkflowStatusGuard:**
```javascript
<WorkflowStatusGuard
    resourceType="project" // Singular
    status={project.status}
    createdBy={project.createdBy?._id}
    action="edit" // or "createSection", "modifyTree"
>
    {/* Your form or component */}
</WorkflowStatusGuard>
```

**useWorkflowStatus Hook:**
```javascript
const workflowStatus = useWorkflowStatus({
    status: project.status,
    resourceType: 'project', // Singular
    createdBy: project.createdBy?._id
});

// Use: workflowStatus.canEdit, workflowStatus.canDelete, etc.
```

---

## Testing Checklist

After integration, test the following:

### ✅ Basic Workflow
- [ ] Create new resource in `draft` status
- [ ] Submit for review (draft → in_review)
- [ ] Mark as reviewed (in_review → pending_approval)
- [ ] Approve (pending_approval → pending_publish)
- [ ] Publish (pending_publish → published)
- [ ] Request changes (in_review → changes_requested)
- [ ] Reject (pending_approval → changes_requested)
- [ ] Resubmit after changes (changes_requested → in_review)
- [ ] Archive (published → archived)
- [ ] Restore (archived → draft)
- [ ] Unpublish (published → draft)

### ✅ Permissions
- [ ] Editor can create and submit for review
- [ ] Editor cannot edit when in_review
- [ ] Reviewer can review and request changes
- [ ] Approver can approve/reject
- [ ] Admin can publish/unpublish/archive
- [ ] Creator can edit their own draft content

### ✅ Status Restrictions
- [ ] Cannot edit when status is `in_review`, `pending_approval`, or `pending_publish`
- [ ] Cannot delete when status is not `draft` or `archived`
- [ ] Form is disabled when user doesn't have permission

### ✅ Notifications
- [ ] Editor receives notification when content is reviewed
- [ ] Reviewer receives notification when content is submitted
- [ ] Approver receives notification when content is marked as reviewed
- [ ] All relevant roles receive notifications on publish/approve/reject

### ✅ Child Resources (if applicable)
- [ ] Child resources status updates when parent status changes
- [ ] Individual child resources can have their own workflow when parent is draft

### ✅ Version History
- [ ] Versions are created on status changes
- [ ] Version history is accessible
- [ ] Version comparison works

---

## Common Patterns & Examples

### Pattern 1: Resource with Child Resources

If your resource has child resources (like Projects → Tasks):

```javascript
// In workflowController.js - submitForReview
if (resource === 'project') {
    const Task = require('../models/Task');
    await Task.updateMany(
        { projectId: item._id, status: { $in: ['draft', 'changes_requested'] } },
        { 
            $set: { 
                status: WORKFLOW_STATES.IN_REVIEW,
                updatedBy: req.user._id
            } 
        }
    );
}
```

### Pattern 2: Custom Title Extraction

If your resource has a different title field:

```javascript
// In workflowController.js - getResourceTitle
function getResourceTitle(resource) {
    // For projects
    if (resource.name) {
        return resource.name;
    }
    
    // For media
    if (resource.filename) {
        return resource.filename;
    }
    
    // Default
    return 'Untitled';
}
```

### Pattern 3: Conditional Workflow Actions

If you need to conditionally show/hide workflow actions:

```javascript
// In your editor component
const shouldShowPublish = project.status === 'pending_publish' && 
                          (userRole === 'admin' || userRole === 'super_admin');

// Filter available actions
const filteredActions = availableActions.filter(action => {
    if (action === 'publish' && !shouldShowPublish) {
        return false;
    }
    return true;
});
```

### Pattern 4: Custom Status Validation

If you need custom validation before workflow transitions:

```javascript
// In your controller
exports.submitForReview = async (req, res) => {
    // Custom validation
    if (!project.requiredField) {
        return errorResponse(res, 400, 'Required field must be filled before submission');
    }
    
    // Then call workflow controller
    // ... or use workflowController.submitForReview
};
```

---

## Troubleshooting

### Issue: "Invalid resource type" error

**Solution:** Add your resource to `backend/routes/workflowRoutes.js`:
```javascript
const validResources = ['page', 'section', 'project']; // Add here
```

### Issue: "Resource not found" in permission checks

**Solution:** 
1. Ensure Resource document exists with plural slug (`projects`, not `project`)
2. Check that the resource slug matches exactly (case-sensitive)

### Issue: Workflow actions not showing

**Solution:**
1. Check that user has appropriate permissions on the resource
2. Verify `getNextPossibleStates` is returning actions for your resource
3. Check browser console for errors
4. Ensure `availableActions` is being fetched correctly

### Issue: Form not disabling when in review

**Solution:**
1. Verify `WorkflowStatusGuard` is wrapping your form
2. Check that `resourceType` prop matches your resource (singular)
3. Ensure `status` prop is being passed correctly
4. Verify `useWorkflowStatus` hook is working

### Issue: Child resources not updating status

**Solution:**
1. Check that you've added synchronization logic in `workflowController.js`
2. Verify the child resource model has the correct parent reference
3. Ensure the update query matches your schema

### Issue: Notifications not sending

**Solution:**
1. Check that `notificationService` is being called in workflow actions
2. Verify user roles are correctly set
3. Check email service configuration
4. Review notification service logs

### Issue: Creator cannot edit their own content

**Solution:**
1. Verify `createdBy` field is populated correctly
2. Check that `useWorkflowStatus` hook receives `createdBy` prop
3. Ensure role checks are case-insensitive (they should be)

---

## Quick Reference

### Resource Naming Convention

| Context | Format | Example |
|---------|--------|---------|
| Route parameter | Singular | `project`, `media`, `branch` |
| Resource document slug | Plural | `projects`, `media`, `branches` |
| Model name | Singular | `Project`, `Media`, `Branch` |
| Controller file | Singular | `projectController.js` |
| Service file | Singular | `projectService.js` |
| Component prop `resource` | Singular | `resource="project"` |
| Workflow validator | Plural | `'projects'` |

### Required Model Fields

```javascript
{
    status: String (enum), // Required
    createdBy: ObjectId,    // Required
    updatedBy: ObjectId,    // Optional but recommended
    isActive: Boolean       // Optional but recommended
}
```

### Required Permissions by Action

| Action | Required Permission |
|--------|---------------------|
| Create | `{resource}:create` |
| Read | `{resource}:read` |
| Update | `{resource}:update` |
| Delete | `{resource}:delete` |
| Submit for Review | `{resource}:update` OR creator |
| Review | `{resource}:review` OR `workflow:review` |
| Approve | `{resource}:approve` OR `workflow:approve` |
| Publish | `{resource}:publish` OR `workflow:publish` |

---

## Support

If you encounter issues not covered in this guide:

1. Check the existing `Page` and `Section` implementations as reference
2. Review `backend/TESTING_WORKFLOW_PERMISSIONS.md` for permission patterns
3. Check workflow controller logs for detailed error messages
4. Verify all steps in this guide have been completed

---

**Last Updated:** [Current Date]
**Version:** 1.0

