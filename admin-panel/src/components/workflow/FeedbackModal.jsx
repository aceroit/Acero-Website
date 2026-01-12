import { useState } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { TextArea } = Input;

/**
 * Feedback Modal Component
 * Used for requesting changes or rejecting content
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether modal is open
 * @param {string} props.title - Modal title
 * @param {string} props.action - Action type ('request-changes' or 'reject')
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
          <ExclamationCircleOutlined className="text-orange-500" />
          <span>{title || (isReject ? 'Reject Content' : 'Request Changes')}</span>
        </div>
      }
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      okText={isReject ? 'Reject' : 'Request Changes'}
      okButtonProps={{ 
        danger: isReject,
        loading,
        style: isReject ? {} : { backgroundColor: '#f97316', borderColor: '#f97316' }
      }}
      cancelText="Cancel"
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-4"
      >
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

        <Form.Item
          name="changeSummary"
          label="Change Summary (Optional)"
          tooltip="Brief summary of the changes requested"
        >
          <Input
            placeholder="e.g., Update title and description"
            maxLength={200}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default FeedbackModal;

