import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

/**
 * Confirm Modal Component
 * Reusable confirmation dialog
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether modal is visible
 * @param {string} props.title - Modal title
 * @param {string} props.content - Modal content/message
 * @param {Function} props.onConfirm - Callback when confirmed
 * @param {Function} props.onCancel - Callback when cancelled
 * @param {string} props.okText - OK button text (default: 'Confirm')
 * @param {string} props.cancelText - Cancel button text (default: 'Cancel')
 * @param {string} props.okType - OK button type (default: 'danger')
 * @param {boolean} props.loading - Loading state
 * @returns {React.ReactNode}
 */
const ConfirmModal = ({
  open,
  title = 'Confirm Action',
  content,
  onConfirm,
  onCancel,
  okText = 'Confirm',
  cancelText = 'Cancel',
  okType = 'danger',
  loading = false,
}) => {
  return (
    <Modal
      open={open}
      title={
        <div className="flex items-center gap-2">
          <ExclamationCircleOutlined className="text-red-600" />
          <span>{title}</span>
        </div>
      }
      onOk={onConfirm}
      onCancel={onCancel}
      okText={okText}
      cancelText={cancelText}
      okButtonProps={{ type: okType, loading }}
      cancelButtonProps={{ disabled: loading }}
    >
      <p>{content}</p>
    </Modal>
  );
};

export default ConfirmModal;

