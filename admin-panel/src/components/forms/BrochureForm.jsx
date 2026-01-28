import { Form, Input, InputNumber, Button, Switch } from 'antd';
import { useEffect } from 'react';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import ImageUpload from '../common/ImageUpload';
import PdfUpload from '../common/PdfUpload';

const { TextArea } = Input;

/**
 * Brochure Form Component
 * Reusable form for creating and editing brochures
 * 
 * @param {Object} props
 * @param {Object} props.initialValues - Initial form values
 * @param {Function} props.onSubmit - Submit handler
 * @param {Function} props.onCancel - Cancel handler
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.isEdit - Whether form is for editing (default: false)
 * @returns {React.ReactNode}
 */
const BrochureForm = ({
  initialValues = {},
  onSubmit,
  onCancel,
  loading = false,
  isEdit = false,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialValues) {
      const formValues = {
        ...initialValues,
        order: initialValues.order !== undefined ? initialValues.order : 0,
        featured: initialValues.featured !== undefined ? initialValues.featured : false,
        isActive: initialValues.isActive !== undefined ? initialValues.isActive : true,
        languages: Array.isArray(initialValues.languages) ? initialValues.languages : [],
      };
      form.setFieldsValue(formValues);
    }
  }, [initialValues, form]);

  const handleSubmit = async (values) => {
    const languages = (values.languages || [])
      .filter((l) => l?.languageCode?.trim() && l?.languageName?.trim() && l?.fileUrl?.trim())
      .map((l) => ({
        languageCode: l.languageCode.trim(),
        languageName: l.languageName.trim(),
        fileUrl: l.fileUrl.trim(),
      }));
    const cleanedValues = {
      ...values,
      title: values.title?.trim(),
      description: values.description?.trim() || null,
      downloadLink: values.downloadLink?.trim() || null,
      languages,
      order: values.order || 0,
      featured: values.featured !== undefined ? values.featured : false,
      isActive: values.isActive !== undefined ? values.isActive : true,
    };
    await onSubmit(cleanedValues);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        order: 0,
        featured: false,
        isActive: true,
        ...initialValues,
      }}
    >
      {/* Basic Information */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        
        <Form.Item
          name="title"
          label="Brochure Title"
          rules={[
            { required: true, message: 'Please enter brochure title' },
            { min: 2, message: 'Title must be at least 2 characters' },
            { max: 200, message: 'Title must not exceed 200 characters' },
          ]}
        >
          <Input
            placeholder="Enter brochure title"
            size="large"
          />
        </Form.Item>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="order"
            label="Display Order"
            tooltip="Lower numbers appear first (0 = highest priority)"
          >
            <InputNumber
              placeholder="Enter order"
              size="large"
              min={0}
              className="w-full"
            />
          </Form.Item>
        </div>

        <Form.Item
          name="description"
          label="Description"
          tooltip="Optional description of the brochure"
        >
          <TextArea
            placeholder="Enter description"
            size="large"
            rows={4}
          />
        </Form.Item>

        <Form.Item
          name="downloadLink"
          label="Legacy Download Link (optional)"
          tooltip="Single URL fallback if no language PDFs are set. Prefer PDFs by language below."
        >
          <Input
            placeholder="https://example.com/brochure.pdf"
            size="large"
          />
        </Form.Item>

        <Form.List name="languages">
          {(fields, { add, remove }) => (
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  PDFs by language (upload one PDF per language)
                </span>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  size="large"
                >
                  Add language
                </Button>
              </div>
              {fields.map(({ key, name, ...restField }) => (
                <div
                  key={key}
                  className="flex flex-wrap gap-4 p-4 border border-gray-200 rounded-lg mb-3 bg-gray-50"
                >
                  <Form.Item
                    {...restField}
                    name={[name, 'languageCode']}
                    label="Language code"
                    rules={[{ required: true, message: 'Required' }]}
                    className="mb-0"
                  >
                    <Input placeholder="e.g. en" size="large" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'languageName']}
                    label="Language name"
                    rules={[{ required: true, message: 'Required' }]}
                    className="mb-0"
                  >
                    <Input placeholder="e.g. English" size="large" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'fileUrl']}
                    label="PDF file"
                    rules={[{ required: true, message: 'Upload PDF for this language' }]}
                    className="mb-0 flex-1 min-w-[200px]"
                  >
                    <PdfUpload folder="brochures/pdfs" label="" maxSize={20} />
                  </Form.Item>
                  <Button
                    type="text"
                    danger
                    icon={<MinusCircleOutlined />}
                    onClick={() => remove(name)}
                    className="self-end"
                  />
                </div>
              ))}
            </>
          )}
        </Form.List>
      </div>

      {/* Brochure Image */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Brochure Image</h3>
        
        <Form.Item
          name="brochureImage"
          label="Brochure Image"
          tooltip="Main image for the brochure (min: 300×400px)"
        >
          <ImageUpload
            value={form.getFieldValue('brochureImage')}
            onChange={(image) => {
              form.setFieldsValue({ brochureImage: image });
              form.validateFields(['brochureImage']);
            }}
            folder="brochures"
            dimensions={{ minWidth: 300, minHeight: 400 }}
            maxSize={10}
          />
        </Form.Item>
      </div>

      {/* Status & Visibility */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status & Visibility</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="featured"
            label="Featured"
            valuePropName="checked"
            tooltip="Featured brochures are visible on the public website (must also be published)"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
            tooltip="Inactive brochures are hidden from all views"
          >
            <Switch />
          </Form.Item>
        </div>
      </div>

      <Form.Item className="mb-0 mt-6">
        <div className="flex justify-end gap-2">
          <Button
            onClick={onCancel}
            disabled={loading}
            size="large"
          >
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            className="text-white"
            style={{
              backgroundColor: '#1f2937',
              borderColor: '#1f2937',
              fontWeight: '600'
            }}
          >
            {isEdit ? 'Update Brochure' : 'Create Brochure'}
          </Button>
        </div>
      </Form.Item>
    </Form>
  );
};

export default BrochureForm;

