import { Card, Button, Input, Select, Space, Form } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import './FeaturesGridEditor.css';

const { TextArea } = Input;
const { Option } = Select;

/**
 * Features Grid Editor Component
 * Custom editor for features grid sections
 */
const FeaturesGridEditor = ({ value = {}, onChange, form }) => {
  return (
    <div className="features-grid-editor">
      <div className="space-y-6">
        {/* Title */}
        <Form.Item
          name={['content', 'title']}
          label="Section Title"
          rules={[{ required: true, message: 'Title is required' }]}
        >
          <Input
            placeholder="e.g., Why Acero?"
            size="large"
            maxLength={200}
          />
        </Form.Item>

        {/* Features */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Features <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-4">
            Add features to display in the grid. Each feature will show an icon, title, and description.
          </p>
          <Form.List name={['content', 'features']} initialValue={value.features || []}>
            {(fields, { add, remove }) => {
              return (
                <div className="features-editor">
                  {fields.length === 0 ? (
                    <Card className="border border-gray-200 border-dashed bg-gray-50 text-center py-6">
                      <p className="text-gray-500 mb-4">No features added yet</p>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => add({ icon: '', title: '', description: '' })}
                        size="large"
                        style={{
                          backgroundColor: '#1f2937',
                          borderColor: '#1f2937',
                        }}
                      >
                        Add First Feature
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
                                Feature {index + 1}
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
                            {/* Icon Name */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'icon']}
                              label="Icon Name"
                              tooltip="Icon name from Lucide React (e.g., Globe, Factory, Code, Award, Users, TrendingUp)"
                            >
                              <Input
                                placeholder="e.g., Globe, Factory, Code, Award, Users, TrendingUp"
                                size="large"
                                maxLength={50}
                              />
                            </Form.Item>

                            {/* Feature Title */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'title']}
                              label="Feature Title"
                              tooltip="Title displayed on the feature card"
                              rules={[{ required: true, message: 'Title is required' }]}
                            >
                              <Input
                                placeholder="e.g., Global Reach, Local Expertise"
                                size="large"
                                maxLength={200}
                              />
                            </Form.Item>

                            {/* Feature Description */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'description']}
                              label="Feature Description"
                              tooltip="Description text for the feature"
                              rules={[{ required: true, message: 'Description is required' }]}
                            >
                              <TextArea
                                placeholder="e.g., Worldwide presence with localized service..."
                                rows={3}
                                size="large"
                                maxLength={500}
                                showCount
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
                      onClick={() => add({ icon: '', title: '', description: '' })}
                      block
                      size="large"
                      className="mt-4"
                    >
                      Add Another Feature
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
            tooltip="How many columns to display features in (3 or 4 columns)"
            initialValue={3}
            getValueFromEvent={(value) => {
              return typeof value === 'number' ? value : parseInt(value);
            }}
            normalize={(value) => {
              return typeof value === 'number' ? value : parseInt(value) || 3;
            }}
          >
            <Select size="large" placeholder="Select number of columns">
              <Option value={3}>3 Columns</Option>
              <Option value={4}>4 Columns</Option>
            </Select>
          </Form.Item>
        </Card>
      </div>
    </div>
  );
};

export default FeaturesGridEditor;

