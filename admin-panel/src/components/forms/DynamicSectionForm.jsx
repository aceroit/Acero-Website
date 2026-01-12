import { Form, Input, InputNumber, Select, Switch, DatePicker, ColorPicker, Upload, Button } from 'antd';
import { 
  UploadOutlined, 
  PlusOutlined, 
  MinusCircleOutlined,
  PictureOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

/**
 * Dynamic Section Form Component
 * Renders form fields dynamically based on section type field schema
 */
const DynamicSectionForm = ({
  sectionType,
  initialContent = {},
  form,
  loading = false,
}) => {
  // Sort fields by order
  const sortedFields = sectionType?.fields
    ? [...sectionType.fields].sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];

  // Render field based on type
  const renderField = (field) => {
    const fieldName = field.name;
    const fieldValue = initialContent[fieldName] ?? field.defaultValue ?? null;

    // Common form item props
    const formItemProps = {
      name: ['content', fieldName],
      label: field.label,
      tooltip: field.helpText || undefined,
      required: field.required || false,
      initialValue: fieldValue,
    };

    // Add validation rules
    const rules = [];
    if (field.required) {
      rules.push({ required: true, message: `${field.label} is required` });
    }
    if (field.validation) {
      if (field.validation.minLength) {
        rules.push({ 
          min: field.validation.minLength, 
          message: `${field.label} must be at least ${field.validation.minLength} characters` 
        });
      }
      if (field.validation.maxLength) {
        rules.push({ 
          max: field.validation.maxLength, 
          message: `${field.label} must not exceed ${field.validation.maxLength} characters` 
        });
      }
      if (field.validation.pattern) {
        rules.push({ 
          pattern: new RegExp(field.validation.pattern), 
          message: `${field.label} format is invalid` 
        });
      }
    }

    switch (field.type) {
      case 'text':
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
          >
            <Input
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              size="large"
              maxLength={field.validation?.maxLength}
            />
          </Form.Item>
        );

      case 'textarea':
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
          >
            <TextArea
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              rows={4}
              size="large"
              maxLength={field.validation?.maxLength}
              showCount={field.validation?.maxLength ? true : false}
            />
          </Form.Item>
        );

      case 'richtext':
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
          >
            <TextArea
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()} (HTML supported)`}
              rows={8}
              size="large"
              maxLength={field.validation?.maxLength}
              showCount={field.validation?.maxLength ? true : false}
            />
          </Form.Item>
        );

      case 'number':
        return (
          <Form.Item
            {...formItemProps}
            rules={[
              ...rules,
              { type: 'number', message: `${field.label} must be a number` },
            ]}
          >
            <InputNumber
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              size="large"
              style={{ width: '100%' }}
              min={field.validation?.min}
              max={field.validation?.max}
            />
          </Form.Item>
        );

      case 'email':
        return (
          <Form.Item
            {...formItemProps}
            rules={[
              ...rules,
              { type: 'email', message: `${field.label} must be a valid email` },
            ]}
          >
            <Input
              type="email"
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              size="large"
            />
          </Form.Item>
        );

      case 'url':
        return (
          <Form.Item
            {...formItemProps}
            rules={[
              ...rules,
              { type: 'url', message: `${field.label} must be a valid URL` },
            ]}
          >
            <Input
              type="url"
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              size="large"
            />
          </Form.Item>
        );

      case 'tel':
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
          >
            <Input
              type="tel"
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              size="large"
            />
          </Form.Item>
        );

      case 'date':
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
            getValueProps={(value) => ({
              value: value ? dayjs(value) : null,
            })}
            normalize={(value) => {
              if (!value) return null;
              return value.format('YYYY-MM-DD');
            }}
          >
            <DatePicker
              placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`}
              size="large"
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
            />
          </Form.Item>
        );

      case 'datetime':
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
            getValueProps={(value) => ({
              value: value ? dayjs(value) : null,
            })}
            normalize={(value) => {
              if (!value) return null;
              return value.format('YYYY-MM-DD HH:mm:ss');
            }}
          >
            <DatePicker
              showTime
              placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`}
              size="large"
              style={{ width: '100%' }}
              format="YYYY-MM-DD HH:mm:ss"
            />
          </Form.Item>
        );

      case 'time':
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
          >
            <Input
              type="time"
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              size="large"
            />
          </Form.Item>
        );

      case 'boolean':
        return (
          <Form.Item
            {...formItemProps}
            valuePropName="checked"
            rules={rules}
          >
            <Switch />
          </Form.Item>
        );

      case 'color':
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
            getValueFromEvent={(color) => color.toHexString()}
          >
            <ColorPicker
              showText
              format="hex"
              size="large"
            />
          </Form.Item>
        );

      case 'select':
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
          >
            <Select
              placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`}
              size="large"
              allowClear={!field.required}
            >
              {field.options?.map((option, idx) => (
                <Option key={idx} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        );

      case 'multiselect':
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
          >
            <Select
              mode="multiple"
              placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`}
              size="large"
              allowClear={!field.required}
            >
              {field.options?.map((option, idx) => (
                <Option key={idx} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        );

      case 'radio':
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
          >
            <Select
              placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`}
              size="large"
              allowClear={!field.required}
            >
              {field.options?.map((option, idx) => (
                <Option key={idx} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        );

      case 'checkbox':
        return (
          <Form.Item
            {...formItemProps}
            valuePropName="checked"
            rules={rules}
          >
            <Switch />
          </Form.Item>
        );

      case 'image':
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e?.fileList;
            }}
          >
            <Upload
              listType="picture-card"
              maxCount={1}
              beforeUpload={() => false} // Prevent auto upload
              accept="image/*"
            >
              <div>
                <PictureOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
          </Form.Item>
        );

      case 'file':
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e?.fileList;
            }}
          >
            <Upload
              beforeUpload={() => false} // Prevent auto upload
            >
              <Button icon={<UploadOutlined />}>Upload File</Button>
            </Upload>
          </Form.Item>
        );

      case 'array':
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
          >
            <Form.List name={['content', fieldName]} initialValue={fieldValue || []}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name]}
                        rules={[{ required: true, message: 'Item is required' }]}
                      >
                        <Input placeholder="Enter item" size="large" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    </Space>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                      size="large"
                    >
                      Add Item
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>
        );

      case 'json':
        return (
          <Form.Item
            {...formItemProps}
            rules={[
              ...rules,
              {
                validator: (_, value) => {
                  if (!value) {
                    if (field.required) {
                      return Promise.reject(new Error(`${field.label} is required`));
                    }
                    return Promise.resolve();
                  }
                  try {
                    if (typeof value === 'string') {
                      JSON.parse(value);
                    }
                    return Promise.resolve();
                  } catch {
                    return Promise.reject(new Error(`${field.label} must be valid JSON`));
                  }
                },
              },
            ]}
          >
            <TextArea
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()} as JSON`}
              rows={6}
              size="large"
            />
          </Form.Item>
        );

      default:
        return (
          <Form.Item
            {...formItemProps}
            rules={rules}
          >
            <Input
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
              size="large"
            />
          </Form.Item>
        );
    }
  };

  if (!sectionType || !sectionType.fields || sectionType.fields.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No fields defined for this section type.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedFields.map((field) => (
        <div key={field.name}>
          {renderField(field)}
        </div>
      ))}
    </div>
  );
};

export default DynamicSectionForm;

