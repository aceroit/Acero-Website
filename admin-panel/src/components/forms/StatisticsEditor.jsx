import { Card, Button, Input, Select, Space, Form, ColorPicker } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import './StatisticsEditor.css';

const { Option } = Select;

/**
 * Statistics Editor Component
 * Custom editor for statistics sections with easy stat management
 */
const StatisticsEditor = ({ value = {}, onChange, form }) => {
  return (
    <div className="statistics-editor">
      <div className="space-y-6">
        {/* Heading (Optional - not used by frontend but in schema) */}
        <Form.Item
          name={['content', 'heading']}
          label="Section Heading"
          tooltip="Optional heading for the statistics section (currently not displayed on frontend)"
        >
          <Input
            placeholder="e.g., By The Numbers, Our Achievements"
            size="large"
            maxLength={200}
          />
        </Form.Item>

        {/* Statistics */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Statistics <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-4">
            Add statistics to showcase your company achievements. Each statistic displays a value, label, and optional sublabel.
          </p>
          <Form.List name={['content', 'stats']} initialValue={value.stats || []}>
            {(fields, { add, remove }) => {
              return (
                <div className="stats-editor">
                  {fields.length === 0 ? (
                    <Card className="border border-gray-200 border-dashed bg-gray-50 text-center py-6">
                      <p className="text-gray-500 mb-4">No statistics added yet</p>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => add({ value: '', label: '', sublabel: '' })}
                        size="large"
                        style={{
                          backgroundColor: '#1f2937',
                          borderColor: '#1f2937',
                        }}
                      >
                        Add First Statistic
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
                                Statistic {index + 1}
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
                            {/* Value */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'value']}
                              label="Value"
                              tooltip="The main statistic value (e.g., '100+', '1,000+', '50')"
                              rules={[{ required: true, message: 'Value is required' }]}
                            >
                              <Input
                                placeholder="e.g., 100+, 1,000+, 50"
                                size="large"
                                maxLength={50}
                              />
                            </Form.Item>

                            {/* Label */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'label']}
                              label="Label"
                              tooltip="Main label for the statistic (e.g., 'Countries', 'MT / year')"
                              rules={[{ required: true, message: 'Label is required' }]}
                            >
                              <Input
                                placeholder="e.g., Countries, MT / year, Number of Employees"
                                size="large"
                                maxLength={100}
                              />
                            </Form.Item>

                            {/* Sublabel (Optional) */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'sublabel']}
                              label="Sublabel (Optional)"
                              tooltip="Additional descriptive text (e.g., 'Sales Distribution Network', 'Manufacturing Capacity')"
                            >
                              <Input
                                placeholder="e.g., Sales Distribution Network, Manufacturing Capacity"
                                size="large"
                                maxLength={200}
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
                      onClick={() => add({ value: '', label: '', sublabel: '' })}
                      block
                      size="large"
                      className="mt-4"
                    >
                      Add Another Statistic
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
          <div className="space-y-4">
            <Form.Item
              name={['content', 'columns']}
              label="Number of Columns"
              tooltip="How many columns to display statistics in (3 or 4 columns)"
              initialValue={3}
              getValueFromEvent={(value) => {
                // Ensure we return a number
                return typeof value === 'number' ? value : parseInt(value);
              }}
              normalize={(value) => {
                // Normalize to number
                return typeof value === 'number' ? value : parseInt(value) || 3;
              }}
            >
              <Select size="large" placeholder="Select number of columns">
                <Option value={3}>3 Columns</Option>
                <Option value={4}>4 Columns</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name={['content', 'backgroundColor']}
              label="Background Color"
              tooltip="Background color for the statistics section (currently not used by frontend)"
              initialValue="#f3f4f6"
              getValueFromEvent={(color) => color.toHexString()}
            >
              <ColorPicker
                showText
                format="hex"
                size="large"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StatisticsEditor;

