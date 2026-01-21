import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Breadcrumb, Spin, Space, Button, Form, Input, Select, Switch, Collapse } from 'antd';
import { HomeOutlined, HistoryOutlined } from '@ant-design/icons';
import MainLayout from '../components/MainLayout';
import { usePermissions } from '../contexts/PermissionContext';
import { WorkflowStatusBadge, WorkflowActions, WorkflowTimeline, WorkflowStatusGuard } from '../components/workflow';
import useWorkflowStatus from '../hooks/useWorkflowStatus';
import * as vacancyService from '../services/vacancyService';
import { toast } from 'react-toastify';

const { TextArea } = Input;
const { Option } = Select;
const { Panel } = Collapse;

const typeOptions = ['Full-time', 'Part-time', 'Contract'];

const VacancyEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const isEdit = !!id;

  const [form] = Form.useForm();
  const [vacancy, setVacancy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  const workflowStatus = useWorkflowStatus({
    status: vacancy?.status || 'draft',
    resourceType: 'vacancy',
    createdBy: vacancy?.createdBy?._id || vacancy?.createdBy,
  });

  useEffect(() => {
    if (isEdit) {
      fetchVacancy();
    }
  }, [id]);

  const fetchVacancy = async () => {
    setFetching(true);
    try {
      const response = await vacancyService.getVacancy(id);
      if (response.success) {
        const data = response.data?.vacancy || response.data?.vacancy || response.data?.vacancy;
        setVacancy(data);
        form.setFieldsValue({
          ...data,
          requirements: Array.isArray(data?.requirements) ? data.requirements.join('\n') : '',
          responsibilities: Array.isArray(data?.responsibilities) ? data.responsibilities.join('\n') : '',
          experienceLevels: Array.isArray(data?.experienceLevels) ? data.experienceLevels.map(e => e.value) : [],
          educationLevels: Array.isArray(data?.educationLevels) ? data.educationLevels.map(e => e.value) : [],
          languages: Array.isArray(data?.languages) ? data.languages.map(l => l.value || l) : [],
        });
      } else {
        toast.error('Vacancy not found');
        navigate('/vacancies');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch vacancy');
      navigate('/vacancies');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        requirements: values.requirements
          ? values.requirements.split('\n').map(r => r.trim()).filter(Boolean)
          : [],
        responsibilities: values.responsibilities
          ? values.responsibilities.split('\n').map(r => r.trim()).filter(Boolean)
          : [],
        experienceLevels: (values.experienceLevels || []).map(v => ({ value: v, label: v })),
        educationLevels: (values.educationLevels || []).map(v => ({ value: v, label: v })),
        languages: (values.languages || []).map(v => ({ value: v, label: v })),
      };

      let response;
      if (isEdit) {
        if (!workflowStatus.canEdit?.canEdit) {
          toast.error(workflowStatus.canEdit?.reason || 'You do not have permission to edit this vacancy');
          setLoading(false);
          return;
        }
        response = await vacancyService.updateVacancy(id, payload);
      } else {
        response = await vacancyService.createVacancy(payload);
      }

      if (response.success) {
        toast.success(isEdit ? 'Vacancy updated successfully' : 'Vacancy created successfully');
        if (isEdit) {
          await fetchVacancy();
        } else {
          const newId = response.data?.vacancy?._id || response.data?._id;
          if (newId) {
            navigate(`/vacancies/${newId}`);
          } else {
            navigate('/vacancies');
          }
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || (isEdit ? 'Failed to update vacancy' : 'Failed to create vacancy');
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/vacancies');
  };

  const handleWorkflowActionComplete = async () => {
    if (isEdit) {
      await fetchVacancy();
      setTimeout(() => {
        fetchVacancy();
      }, 500);
    }
  };

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
        <a href="/enquiries-applications/vacancies">
          <span>Vacancies</span>
        </a>
      ),
    },
    ...(isEdit && vacancy
      ? [
          {
            title: <span>{vacancy.title || 'Vacancy'}</span>,
          },
          {
            title: <span>Edit</span>,
          },
        ]
      : [
          {
            title: <span>Create New Vacancy</span>,
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

  const requiredPermission = isEdit ? 'update' : 'create';
  if (!hasPermission('vacancies', requiredPermission)) {
    return (
      <MainLayout>
        <Card className="border border-gray-200 shadow-md bg-white">
          <div className="text-center py-8">
            <p className="text-gray-600">You don't have permission to {isEdit ? 'edit' : 'create'} vacancies.</p>
          </div>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 md:space-y-8 p-4 md:p-0">
        <Breadcrumb items={breadcrumbItems} className="text-sm" />

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
              {isEdit ? `Edit Vacancy: ${vacancy?.title || ''}` : 'Create New Vacancy'}
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              {isEdit ? 'Update vacancy details and metadata' : 'Create a new job vacancy for your website'}
            </p>
          </div>
          {isEdit && vacancy && (
            <div className="flex flex-col items-start md:items-end gap-2">
              <WorkflowStatusBadge status={vacancy.status} size="large" />
              <Space>
                <WorkflowActions
                  resource="vacancy"
                  resourceId={id}
                  currentStatus={vacancy.status}
                  createdBy={vacancy.createdBy?._id || vacancy.createdBy}
                  onActionComplete={handleWorkflowActionComplete}
                  showLabels={true}
                  size="middle"
                />
              </Space>
            </div>
          )}
        </div>

        <Card className="border border-gray-200 shadow-md bg-white">
          {isEdit && vacancy ? (
            <WorkflowStatusGuard
              status={vacancy.status}
              resourceType="vacancy"
              resourceId={id}
              createdBy={vacancy.createdBy?._id || vacancy.createdBy}
              action="edit"
              showMessage={true}
              messageType="warning"
            >
              <VacancyForm form={form} onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} isEdit={isEdit} />
            </WorkflowStatusGuard>
          ) : (
            <VacancyForm form={form} onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} isEdit={isEdit} />
          )}
        </Card>

        {isEdit && vacancy && (
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
                  children: (
                    <WorkflowTimeline resource="vacancy" resourceId={id} />
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

const VacancyForm = ({ form, onSubmit, onCancel, loading, isEdit }) => {
  return (
    <Form
      layout="vertical"
      form={form}
      onFinish={onSubmit}
      initialValues={{
        type: 'Full-time',
        featured: false,
      }}
    >
      <Form.Item
        name="title"
        label="Title"
        rules={[{ required: true, message: 'Title is required' }]}
      >
        <Input placeholder="Job title" />
      </Form.Item>

      <Form.Item
        name="department"
        label="Department"
        rules={[{ required: true, message: 'Department is required' }]}
      >
        <Input placeholder="Department" />
      </Form.Item>

      <Form.Item
        name="location"
        label="Location"
        rules={[{ required: true, message: 'Location is required' }]}
      >
        <Input placeholder="Location" />
      </Form.Item>

      <Form.Item
        name="type"
        label="Type"
        rules={[{ required: true, message: 'Type is required' }]}
      >
        <Select>
          {typeOptions.map(type => (
            <Option key={type} value={type}>{type}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
      >
        <TextArea rows={4} placeholder="Job description" />
      </Form.Item>

      <Form.Item
        name="requirements"
        label="Requirements (one per line)"
      >
        <TextArea rows={4} placeholder="Requirement 1\nRequirement 2" />
      </Form.Item>

      <Form.Item
        name="responsibilities"
        label="Responsibilities (one per line)"
      >
        <TextArea rows={4} placeholder="Responsibility 1\nResponsibility 2" />
      </Form.Item>

      <Form.Item
        name="experienceLevels"
        label="Experience Levels"
      >
        <Select mode="tags" placeholder="Add experience levels (e.g., entry, mid, senior)" />
      </Form.Item>

      <Form.Item
        name="educationLevels"
        label="Education Levels"
      >
        <Select mode="tags" placeholder="Add education levels" />
      </Form.Item>

      <Form.Item
        name="languages"
        label="Languages"
      >
        <Select mode="tags" placeholder="Add languages" />
      </Form.Item>

      <Form.Item
        name="notificationEmail"
        label="Notification Email"
        rules={[
          { required: true, message: 'Notification email is required' },
          { type: 'email', message: 'Enter a valid email' },
        ]}
      >
        <Input placeholder="example@company.com" />
      </Form.Item>

      <Form.Item
        name="featured"
        label="Featured"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      <Form.Item className="mb-0 mt-6">
        <div className="flex justify-end gap-2">
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            className="text-white"
            style={{
              backgroundColor: '#1f2937',
              borderColor: '#1f2937',
              height: '44px',
              borderRadius: '8px',
              fontWeight: '600'
            }}
          >
            {isEdit ? 'Update Vacancy' : 'Create Vacancy'}
          </Button>
          <Button onClick={onCancel} size="large">
            Cancel
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

export default VacancyEditor;


