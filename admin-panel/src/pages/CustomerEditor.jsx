import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Breadcrumb, Spin, Collapse, Space, Button } from 'antd';
import { HomeOutlined, HistoryOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import CustomerForm from '../components/forms/CustomerForm';
import { usePermissions } from '../contexts/PermissionContext';
import { WorkflowStatusBadge, WorkflowActions, WorkflowTimeline, WorkflowStatusGuard } from '../components/workflow';
import useWorkflowStatus from '../hooks/useWorkflowStatus';
import * as customerService from '../services/customerService';
import * as versionService from '../services/versionService';
import { toast } from 'react-toastify';

const { Panel } = Collapse;

const CustomerEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const isEdit = !!id;
  
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  // Check workflow status permissions
  const workflowStatus = useWorkflowStatus({
    status: customer?.status || 'draft',
    resourceType: 'customer',
    createdBy: customer?.createdBy?._id || customer?.createdBy,
  });

  // Fetch customer data if editing
  useEffect(() => {
    if (isEdit) {
      fetchCustomer();
    }
  }, [id]);

  const fetchCustomer = async () => {
    setFetching(true);
    try {
      const response = await customerService.getCustomer(id);
      if (response.success) {
        setCustomer(response.data.customer);
      } else {
        toast.error('Customer not found');
        navigate('/customers');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch customer');
      navigate('/customers');
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
          toast.error(workflowStatus.canEdit.reason || 'You do not have permission to edit this customer');
          setLoading(false);
          return;
        }
        
        response = await customerService.updateCustomer(id, values);
      } else {
        response = await customerService.createCustomer(values);
      }

      if (response.success) {
        toast.success(isEdit ? 'Customer updated successfully' : 'Customer created successfully');
        
        if (isEdit) {
          // After updating, refresh the customer data
          await fetchCustomer();
        } else {
          // After creating, redirect to the edit page
          const newCustomerId = response.data?.customer?._id || response.data?.customer?.id;
          if (newCustomerId) {
            navigate(`/customers/${newCustomerId}`);
          } else {
            navigate('/customers');
          }
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        (isEdit ? 'Failed to update customer' : 'Failed to create customer');
      toast.error(errorMessage);
      throw error; // Re-throw to prevent form from resetting
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/customers');
  };

  // Handle workflow action completion
  const handleWorkflowActionComplete = async (action, response) => {
    // Refresh customer data to get updated status
    if (isEdit) {
      // Immediate refresh
      await fetchCustomer();
      // Additional refresh after short delay to ensure backend has processed
      setTimeout(() => {
        fetchCustomer();
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
        <a href="/customers">
          <span>Customers</span>
        </a>
      ),
    },
    ...(isEdit && customer
      ? [
          {
            title: <span>{customer.name || 'Customer'}</span>,
          },
          {
            title: <span>Edit</span>,
          },
        ]
      : [
          {
            title: <span>Create New Customer</span>,
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
  if (!hasPermission('customers', requiredPermission)) {
    return (
      <MainLayout>
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="text-center py-8">
            <p className="text-gray-600">You don't have permission to {isEdit ? 'edit' : 'create'} customers.</p>
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
              {isEdit ? `Edit Customer: ${customer?.name || ''}` : 'Create New Customer'}
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              {isEdit 
                ? 'Update customer details and information'
                : 'Create a new customer entry'
              }
            </p>
          </div>
          {isEdit && customer && (
            <div className="flex flex-col items-start md:items-end gap-2">
              <WorkflowStatusBadge status={customer.status} size="large" />
              <Space>
                <WorkflowActions
                  resource="customer"
                  resourceId={id}
                  currentStatus={customer.status}
                  createdBy={customer.createdBy?._id || customer.createdBy}
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
          {isEdit && customer ? (
            <WorkflowStatusGuard
              status={customer.status}
              resourceType="customer"
              resourceId={id}
              createdBy={customer.createdBy?._id || customer.createdBy}
              action="edit"
              showMessage={true}
              messageType="warning"
            >
              <CustomerForm
                initialValues={customer || {}}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
                isEdit={isEdit}
              />
            </WorkflowStatusGuard>
          ) : (
            <CustomerForm
              initialValues={customer || {}}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={loading}
              isEdit={isEdit}
            />
          )}
        </Card>

        {/* Workflow Timeline - Only show when editing */}
        {isEdit && customer && (
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
                        navigate(`/versions/customer/${id}`);
                      }}
                    >
                      View Full History
                    </Button>
                  ),
                  children: (
                    <WorkflowTimeline
                      resource="customer"
                      resourceId={id}
                      onVersionSelect={(version) => {
                        // Handle version selection (could open a comparison view)
                        console.log('Version selected:', version);
                      }}
                      onRestoreVersion={async (version) => {
                        try {
                          const response = await versionService.restoreVersion('customer', id, version);
                          if (response.success) {
                            toast.success('Version restored successfully');
                            await fetchCustomer();
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

export default CustomerEditor;

