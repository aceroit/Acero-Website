import { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Form, 
  Input, 
  Select, 
  Switch, 
  InputNumber,
  Space,
  Popconfirm,
  Modal,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'richtext', label: 'Rich Text' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'url', label: 'URL' },
  { value: 'tel', label: 'Phone' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'time', label: 'Time' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'color', label: 'Color' },
  { value: 'image', label: 'Image' },
  { value: 'file', label: 'File' },
  { value: 'select', label: 'Select' },
  { value: 'multiselect', label: 'Multi Select' },
  { value: 'radio', label: 'Radio' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'array', label: 'Array' },
  { value: 'json', label: 'JSON' },
];

// Field Item Component
const FieldItem = ({ field, index, onEdit, onDelete, onMove }) => {
  return (
    <div className="mb-2">
      <Card
        size="small"
        className="border border-gray-200 hover:border-gray-400 transition-colors"
        actions={[
          <Button
            type="text"
            icon={<UpOutlined />}
            onClick={() => onMove(index, 'up')}
            disabled={index === 0}
            title="Move Up"
          />,
          <Button
            type="text"
            icon={<DownOutlined />}
            onClick={() => onMove(index, 'down')}
            title="Move Down"
          />,
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEdit(index)}
            title="Edit"
          />,
          <Popconfirm
            title="Delete Field"
            description="Are you sure you want to delete this field?"
            onConfirm={() => onDelete(index)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              title="Delete"
            />
          </Popconfirm>,
        ]}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-900">{field.label || 'Unnamed Field'}</span>
              <span className="text-xs text-gray-500 font-mono">({field.name || 'no-name'})</span>
              {field.required && (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Required</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded">
                {FIELD_TYPES.find(t => t.value === field.type)?.label || field.type}
              </span>
              {field.helpText && (
                <span className="text-gray-500">{field.helpText}</span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Field Form Modal Component
const FieldForm = ({ field, onSave, onCancel, visible }) => {
  const [form] = Form.useForm();
  const [fieldType, setFieldType] = useState(field?.type || 'text');

  useEffect(() => {
    if (field) {
      // Ensure options is an array
      const fieldData = {
        ...field,
        options: field.options && Array.isArray(field.options) ? field.options : [],
      };
      form.setFieldsValue(fieldData);
      setFieldType(field.type || 'text');
    } else {
      form.resetFields();
      setFieldType('text');
    }
  }, [field, form, visible]);

  const handleSubmit = () => {
    form.validateFields().then(values => {
      onSave(values);
      form.resetFields();
    });
  };

  const needsOptions = ['select', 'multiselect', 'radio'].includes(fieldType);
  const needsValidation = ['text', 'textarea', 'richtext', 'number', 'array'].includes(fieldType);

  return (
    <Modal
      title={field ? 'Edit Field' : 'Add New Field'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      width="90%"
      style={{ maxWidth: 800 }}
      okText="Save Field"
      cancelText="Cancel"
    >
      <Form form={form} layout="vertical">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="name"
            label="Field Name"
            rules={[
              { required: true, message: 'Field name is required' },
              { pattern: /^[a-z][a-z0-9_]*$/, message: 'Must start with letter, only lowercase letters, numbers, and underscores' },
            ]}
            tooltip="Internal field name (e.g., 'title', 'description')"
          >
            <Input placeholder="e.g., title" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Field Type"
            rules={[{ required: true, message: 'Field type is required' }]}
          >
            <Select onChange={setFieldType}>
              {FIELD_TYPES.map(type => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <Form.Item
          name="label"
          label="Field Label"
          rules={[{ required: true, message: 'Field label is required' }]}
          tooltip="Display label for this field"
        >
          <Input placeholder="e.g., Title" />
        </Form.Item>

        <Form.Item
          name="placeholder"
          label="Placeholder"
        >
          <Input placeholder="Enter placeholder text" />
        </Form.Item>

        <Form.Item
          name="helpText"
          label="Help Text"
        >
          <TextArea rows={2} placeholder="Help text shown to users" />
        </Form.Item>

        <Form.Item
          name="required"
          label="Required"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="defaultValue"
          label="Default Value"
        >
          <Input placeholder="Default value for this field" />
        </Form.Item>

        {needsOptions && (
          <>
            <Divider>Options</Divider>
            <Form.List name="options">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'label']}
                        rules={[{ required: true, message: 'Label required' }]}
                      >
                        <Input placeholder="Label" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'value']}
                        rules={[{ required: true, message: 'Value required' }]}
                      >
                        <Input placeholder="Value" />
                      </Form.Item>
                      <Button onClick={() => remove(name)} danger icon={<DeleteOutlined />} />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Add Option
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </>
        )}

        {needsValidation && (
          <>
            <Divider>Validation Rules</Divider>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fieldType === 'number' && (
                <>
                  <Form.Item name={['validation', 'min']} label="Min Value">
                    <InputNumber style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name={['validation', 'max']} label="Max Value">
                    <InputNumber style={{ width: '100%' }} />
                  </Form.Item>
                </>
              )}
              {(fieldType === 'text' || fieldType === 'textarea' || fieldType === 'richtext') && (
                <>
                  <Form.Item name={['validation', 'minLength']} label="Min Length">
                    <InputNumber style={{ width: '100%' }} min={0} />
                  </Form.Item>
                  <Form.Item name={['validation', 'maxLength']} label="Max Length">
                    <InputNumber style={{ width: '100%' }} min={0} />
                  </Form.Item>
                  <Form.Item name={['validation', 'pattern']} label="Pattern (Regex)" className="md:col-span-2">
                    <Input placeholder="e.g., ^[A-Za-z]+$" />
                  </Form.Item>
                </>
              )}
              {fieldType === 'array' && (
                <>
                  <Form.Item name={['validation', 'minItems']} label="Min Items">
                    <InputNumber style={{ width: '100%' }} min={0} />
                  </Form.Item>
                  <Form.Item name={['validation', 'maxItems']} label="Max Items">
                    <InputNumber style={{ width: '100%' }} min={0} />
                  </Form.Item>
                </>
              )}
            </div>
          </>
        )}
      </Form>
    </Modal>
  );
};

// Main FieldBuilder Component
const FieldBuilder = ({ fields = [], onChange }) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleAddField = () => {
    setEditingIndex(null);
    setIsModalVisible(true);
  };

  const handleEditField = (index) => {
    setEditingIndex(index);
    setIsModalVisible(true);
  };

  const handleSaveField = (fieldData) => {
    const newFields = [...fields];
    if (editingIndex !== null) {
      newFields[editingIndex] = { ...newFields[editingIndex], ...fieldData };
    } else {
      newFields.push({ ...fieldData, _tempId: Date.now() });
    }
    onChange(newFields);
    setIsModalVisible(false);
    setEditingIndex(null);
  };

  const handleDeleteField = (index) => {
    const newFields = fields.filter((_, i) => i !== index);
    onChange(newFields);
  };

  const handleMoveField = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    
    const newFields = [...fields];
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    onChange(newFields);
  };

  return (
    <div>
      <div className="mb-4">
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={handleAddField}
          block
          size="large"
        >
          Add Field
        </Button>
      </div>

      {fields.length > 0 && (
        <div>
          {fields.map((field, index) => (
            <FieldItem
              key={field._tempId || index}
              field={field}
              index={index}
              onEdit={handleEditField}
              onDelete={handleDeleteField}
              onMove={handleMoveField}
            />
          ))}
        </div>
      )}

      <FieldForm
        field={editingIndex !== null ? fields[editingIndex] : null}
        onSave={handleSaveField}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingIndex(null);
        }}
        visible={isModalVisible}
      />
    </div>
  );
};

export default FieldBuilder;

