import { useState } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { ExclamationCircleOutlined, SendOutlined } from '@ant-design/icons';

const { TextArea } = Input;

/**
 * Feedback Modal Component
 * Used for requesting changes, rejecting content, or submitting for review
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether modal is open
 * @param {string} props.title - Modal title
 * @param {string} props.action - Action type ('submit', 'request-changes', or 'reject')
 * @param {Function} props.onSubmit - Submit handler (receives { feedback, changeSummary })
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Loading state
 */
const FeedbackModal = ({
  open,
  title,
  action = 'request-changes',
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const isReject = action === 'reject';
  const isSubmit = action === 'submit';

  const handleSubmit = () => {
    form.validateFields().then(values => {
      onSubmit(values);
      form.resetFields();
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          {isSubmit ? (
            <SendOutlined className="text-blue-500" />
          ) : (
            <ExclamationCircleOutlined className="text-orange-500" />
          )}
          <span>{title || (isReject ? 'Reject Content' : isSubmit ? 'Submit for Review' : 'Request Changes')}</span>
        </div>
      }
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      okText={isReject ? 'Reject' : isSubmit ? 'Submit for Review' : 'Request Changes'}
      okButtonProps={{ 
        danger: isReject,
        loading,
        style: isReject ? {} : isSubmit ? { backgroundColor: '#1890ff', borderColor: '#1890ff' } : { backgroundColor: '#f97316', borderColor: '#f97316' }
      }}
      cancelText="Cancel"
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-4"
      >
        {!isSubmit && (
          <Form.Item
            name="feedback"
            label={isReject ? 'Rejection Reason' : 'Feedback'}
            rules={[
              { required: true, message: `${isReject ? 'Rejection reason' : 'Feedback'} is required` },
              { min: 10, message: `Please provide at least 10 characters of ${isReject ? 'reason' : 'feedback'}` },
              { max: 1000, message: 'Feedback must not exceed 1000 characters' },
            ]}
            tooltip={isReject 
              ? 'Explain why this content is being rejected'
              : 'Provide specific feedback on what needs to be changed'
            }
          >
            <TextArea
              rows={6}
              placeholder={
                isReject
                  ? 'Please explain why this content is being rejected...'
                  : 'Provide specific feedback on what needs to be changed...'
              }
              showCount
              maxLength={1000}
            />
          </Form.Item>
        )}

        <Form.Item
          name="changeSummary"
          label={isSubmit ? 'Change Summary' : 'Change Summary (Optional)'}
          rules={isSubmit ? [
            { required: true, message: 'Change summary is required' },
            { min: 10, message: 'Change summary must be at least 10 characters long' },
            { max: 500, message: 'Change summary must not exceed 500 characters' },
          ] : []}
          tooltip={isSubmit 
            ? 'Describe what changes you made or what this submission includes'
            : 'Brief summary of the changes requested'
          }
        >
          {isSubmit ? (
            <TextArea
              rows={4}
              placeholder="Describe the changes made in this version (e.g., Updated page title, added new sections, improved SEO metadata)..."
              showCount
              maxLength={500}
            />
          ) : (
            <Input
              placeholder="e.g., Update title and description"
              maxLength={200}
              showCount
            />
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default FeedbackModal;

