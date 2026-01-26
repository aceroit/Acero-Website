import { Card, Button, Input, Select, Space, Form, DatePicker } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import ImageUpload from '../common/ImageUpload';
import dayjs from 'dayjs';
import './CompanyUpdatesEditor.css';

const { TextArea } = Input;
const { Option } = Select;

/**
 * Company Updates Editor Component
 * Custom editor for company updates/news sections
 */
const CompanyUpdatesEditor = ({ value = {}, onChange, form }) => {
  return (
    <div className="company-updates-editor">
      <div className="space-y-6">
        {/* Title */}
        <Form.Item
          name={['content', 'title']}
          label="Section Title"
          rules={[{ required: true, message: 'Title is required' }]}
        >
          <Input
            placeholder="e.g., Company Updates"
            size="large"
            maxLength={200}
          />
        </Form.Item>

        {/* Subtitle */}
        <Form.Item
          name={['content', 'subtitle']}
          label="Subtitle"
          tooltip="Optional subtitle displayed below the title"
        >
          <TextArea
            placeholder="e.g., Stay updated with our latest news and announcements"
            rows={2}
            size="large"
            maxLength={300}
            showCount
          />
        </Form.Item>

        {/* Company Updates */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Company Updates <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-4">
            Add company updates/news to display in the grid. Each update will show an image, title, description, date, category badge, and link.
          </p>
          <Form.List name={['content', 'updates']} initialValue={value.updates || []}>
            {(fields, { add, remove }) => {
              return (
                <div className="updates-editor">
                  {fields.length === 0 ? (
                    <Card className="border border-gray-200 border-dashed bg-gray-50 text-center py-6">
                      <p className="text-gray-500 mb-4">No updates added yet</p>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => add({ 
                          id: '', 
                          title: '', 
                          description: '', 
                          image: '', 
                          date: dayjs().format('YYYY-MM-DD'), 
                          category: '', 
                          link: '' 
                        })}
                        size="large"
                        style={{
                          backgroundColor: '#1f2937',
                          borderColor: '#1f2937',
                        }}
                      >
                        Add First Update
                      </Button>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <Card
                          key={field.key}
                          className="border border-gray-200 shadow-sm bg-white"
                          title={
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-gray-700">
                                Update {index + 1}
                              </span>
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => remove(field.name)}
                                size="small"
                              >
                                Remove
                              </Button>
                            </div>
                          }
                        >
                          <div className="space-y-4">
                            {/* Update Image */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'image']}
                              label="Update Image"
                              tooltip="Main image for the update card"
                              rules={[{ required: true, message: 'Image is required' }]}
                              valuePropName="value"
                              getValueFromEvent={(imageData) => {
                                return imageData?.url || '';
                              }}
                              getValueProps={(value) => {
                                return {
                                  value: value ? { url: value } : null
                                };
                              }}
                            >
                              <ImageUpload
                                folder="company-updates"
                                label=""
                                maxSize={10}
                              />
                            </Form.Item>

                            {/* Update ID */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'id']}
                              label="Update ID"
                              tooltip="Unique identifier for the update"
                              rules={[{ required: true, message: 'Update ID is required' }]}
                            >
                              <Input
                                placeholder="e.g., 1, update-1"
                                size="large"
                                maxLength={100}
                              />
                            </Form.Item>

                            {/* Update Title */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'title']}
                              label="Update Title"
                              tooltip="Title displayed on the update card"
                              rules={[{ required: true, message: 'Title is required' }]}
                            >
                              <Input
                                placeholder="e.g., New Manufacturing Facility Expansion"
                                size="large"
                                maxLength={200}
                              />
                            </Form.Item>

                            {/* Update Description */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'description']}
                              label="Update Description"
                              tooltip="Brief description of the update"
                              rules={[{ required: true, message: 'Description is required' }]}
                            >
                              <TextArea
                                placeholder="e.g., We're excited to announce the expansion of our manufacturing facility..."
                                rows={3}
                                size="large"
                                maxLength={500}
                                showCount
                              />
                            </Form.Item>

                            {/* Date and Category */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Form.Item
                                {...field}
                                name={[field.name, 'date']}
                                label="Update Date"
                                tooltip="Date when the update was published"
                                rules={[{ required: true, message: 'Date is required' }]}
                                getValueProps={(value) => {
                                  if (!value) return { value: null };
                                  // If it's already a dayjs object, return as is
                                  if (dayjs.isDayjs(value)) return { value };
                                  // If it's a string, convert to dayjs
                                  if (typeof value === 'string') {
                                    const dayjsValue = dayjs(value);
                                    return { value: dayjsValue.isValid() ? dayjsValue : null };
                                  }
                                  // If it's a Date object, convert to dayjs
                                  if (value instanceof Date) {
                                    const dayjsValue = dayjs(value);
                                    return { value: dayjsValue.isValid() ? dayjsValue : null };
                                  }
                                  return { value: null };
                                }}
                                normalize={(value) => {
                                  if (!value) return null;
                                  if (dayjs.isDayjs(value)) {
                                    return value.format('YYYY-MM-DD');
                                  }
                                  return value;
                                }}
                              >
                                <DatePicker
                                  placeholder="Select date"
                                  size="large"
                                  style={{ width: '100%' }}
                                  format="YYYY-MM-DD"
                                />
                              </Form.Item>

                              <Form.Item
                                {...field}
                                name={[field.name, 'category']}
                                label="Category"
                                tooltip="Category badge displayed on the update card (e.g., Company News, Awards, Products)"
                              >
                                <Input
                                  placeholder="e.g., Company News, Awards, Products"
                                  size="large"
                                  maxLength={50}
                                />
                              </Form.Item>
                            </div>

                            {/* Update Link */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'link']}
                              label="Update Link"
                              tooltip="URL or path to the full update detail page"
                            >
                              <Input
                                placeholder="e.g., /media/company-update/facility-expansion"
                                size="large"
                                maxLength={500}
                              />
                            </Form.Item>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {fields.length > 0 && (
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => add({ 
                        id: '', 
                        title: '', 
                        description: '', 
                        image: '', 
                        date: dayjs().format('YYYY-MM-DD'), 
                        category: '', 
                        link: '' 
                      })}
                      block
                      size="large"
                      className="mt-4"
                    >
                      Add Another Update
                    </Button>
                  )}
                </div>
              );
            }}
          </Form.List>
        </div>

        {/* Display Settings */}
        <Card className="border border-gray-200 shadow-sm bg-white">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Display Settings</h3>
          <Form.Item
            name={['content', 'columns']}
            label="Number of Columns"
            tooltip="How many columns to display updates in (3 or 4 columns)"
            initialValue="3"
          >
            <Select size="large" placeholder="Select number of columns">
              <Option value="3">3 Columns</Option>
              <Option value="4">4 Columns</Option>
            </Select>
          </Form.Item>
        </Card>
      </div>
    </div>
  );
};

export default CompanyUpdatesEditor;

