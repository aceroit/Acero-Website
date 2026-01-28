import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Breadcrumb, Spin, Collapse, Space, Button } from 'antd';
import { HomeOutlined, HistoryOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import CompanyUpdateCategoryForm from '../components/forms/CompanyUpdateCategoryForm';
import { usePermissions } from '../contexts/PermissionContext';
import { WorkflowStatusBadge, WorkflowActions, WorkflowTimeline, WorkflowStatusGuard } from '../components/workflow';
import useWorkflowStatus from '../hooks/useWorkflowStatus';
import * as companyUpdateCategoryService from '../services/companyUpdateCategoryService';
import * as versionService from '../services/versionService';
import { toast } from 'react-toastify';

const { Panel } = Collapse;

const CompanyUpdateCategoryEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const isEdit = !!id;
  
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // Check workflow status permissions
  const workflowStatus = useWorkflowStatus({
    status: category?.status || 'draft',
    resourceType: 'company-update-category',
    createdBy: category?.createdBy?._id || category?.createdBy,
  });

  // Fetch category data if editing
  useEffect(() => {
    if (isEdit) {
      fetchCategory();
    }
  }, [id]);

  const fetchCategory = async () => {
    setFetching(true);
    try {
      const response = await companyUpdateCategoryService.getCompanyUpdateCategory(id);
      if (response.success) {
        setCategory(response.data.category || response.data.companyUpdateCategory);
      } else {
        toast.error('Category not found');
        navigate('/company-update-categories');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch category');
      navigate('/company-update-categories');
    } finally {
      setFetching(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      let response;
      if (isEdit) {
        // Check workflow status permissions before submitting
        if (!workflowStatus.canEdit.canEdit) {
          toast.error(workflowStatus.canEdit.reason || 'You do not have permission to edit this category');
          setLoading(false);
          return;
        }
        
        response = await companyUpdateCategoryService.updateCompanyUpdateCategory(id, values);
      } else {
        response = await companyUpdateCategoryService.createCompanyUpdateCategory(values);
      }

      if (response.success) {
        toast.success(isEdit ? 'Category updated successfully' : 'Category created successfully');
        
        if (isEdit) {
          // After updating, refresh the category data
          await fetchCategory();
        } else {
          // After creating, redirect to the edit page
          const newCategoryId = response.data?.category?._id || response.data?.companyUpdateCategory?._id || response.data?.category?.id;
          if (newCategoryId) {
            navigate(`/company-update-categories/${newCategoryId}`);
          } else {
            navigate('/company-update-categories');
          }
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        (isEdit ? 'Failed to update category' : 'Failed to create category');
      toast.error(errorMessage);
      throw error; // Re-throw to prevent form from resetting
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/company-update-categories');
  };

  // Handle workflow action completion
  const handleWorkflowActionComplete = async (action, response) => {
    // Refresh category data to get updated status
    if (isEdit) {
      // Immediate refresh
      await fetchCategory();
      // Additional refresh after short delay to ensure backend has processed
      setTimeout(() => {
        fetchCategory();
      }, 500);
    }
  };

  // Build breadcrumb items
  const breadcrumbItems = [
    {
      title: (
        <a href="/dashboard">
          <HomeOutlined />
        </a>
      ),
    },
    {
      title: (
        <a href="/company-update-categories">
          <span>Company Update Categories</span>
        </a>
      ),
    },
    ...(isEdit && category
      ? [
          {
            title: <span>{category.name || 'Category'}</span>,
          },
          {
            title: <span>Edit</span>,
          },
        ]
      : [
          {
            title: <span>Create New Category</span>,
          },
        ]),
  ];

  if (fetching) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  // Check permissions
  const requiredPermission = isEdit ? 'update' : 'create';
  if (!hasPermission('company-update-categories', requiredPermission)) {
    return (
      <MainLayout>
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="text-center py-8">
            <p className="text-gray-600">You don't have permission to {isEdit ? 'edit' : 'create'} categories.</p>
          </div>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 md:space-y-8 p-4 md:p-0">
        {/* Breadcrumb */}
        <Breadcrumb
          items={breadcrumbItems}
          className="text-sm"
        />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
              {isEdit ? `Edit Category: ${category?.name || ''}` : 'Create New Category'}
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              {isEdit 
                ? 'Update category details'
                : 'Create a new category for company updates'
              }
            </p>
          </div>
          {isEdit && category && (
            <div className="flex flex-col items-start md:items-end gap-2">
              <WorkflowStatusBadge status={category.status} size="large" />
              <Space>
                <WorkflowActions
                  resource="company-update-category"
                  resourceId={id}
                  currentStatus={category.status}
                  createdBy={category.createdBy?._id || category.createdBy}
                  onActionComplete={handleWorkflowActionComplete}
                  showLabels={true}
                  size="middle"
                />
              </Space>
            </div>
          )}
        </div>

        {/* Form Card */}
        <Card className="border border-gray-200 shadow-md bg-white">
          {isEdit && category ? (
            <WorkflowStatusGuard
              status={category.status}
              resourceType="company-update-category"
              resourceId={id}
              createdBy={category.createdBy?._id || category.createdBy}
              action="edit"
              showMessage={true}
              messageType="warning"
            >
              <CompanyUpdateCategoryForm
                initialValues={category || {}}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
                isEdit={isEdit}
              />
            </WorkflowStatusGuard>
          ) : (
            <CompanyUpdateCategoryForm
              initialValues={category || {}}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={loading}
              isEdit={isEdit}
            />
          )}
        </Card>

        {/* Workflow Timeline - Only show when editing */}
        {isEdit && category && (
          <Card className="border border-gray-200 shadow-md bg-white">
            <Collapse
              items={[
                {
                  key: 'timeline',
                  label: (
                    <Space>
                      <HistoryOutlined />
                      <span>Version History & Workflow Timeline</span>
                    </Space>
                  ),
                  extra: (
                    <Button
                      type="link"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/versions/company-update-category/${id}`);
                      }}
                    >
                      View Full History
                    </Button>
                  ),
                  children: (
                    <WorkflowTimeline
                      resource="company-update-category"
                      resourceId={id}
                      onVersionSelect={(version) => {
                        // Handle version selection (could open a comparison view)
                        console.log('Version selected:', version);
                      }}
                      onRestoreVersion={async (version) => {
                        try {
                          const response = await versionService.restoreVersion('company-update-category', id, version);
                          if (response.success) {
                            toast.success('Version restored successfully');
                            await fetchCategory();
                          }
                        } catch (error) {
                          toast.error(error.response?.data?.message || 'Failed to restore version');
                        }
                      }}
                    />
                  ),
                },
              ]}
            />
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default CompanyUpdateCategoryEditor;

