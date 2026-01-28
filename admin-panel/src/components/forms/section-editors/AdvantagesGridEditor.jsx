import { Card, Button, Input, Select, Form } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import './AdvantagesGridEditor.css';

const { Option } = Select;

/**
 * Advantages Grid Editor Component
 * Custom editor for advantages grid sections with icons and titles
 */
const AdvantagesGridEditor = ({ value = {}, onChange, form }) => {
  return (
    <div className="advantages-grid-editor">
      <div className="space-y-6">
        {/* Title (Optional) */}
        <Form.Item
          name={['content', 'title']}
          label="Section Title"
          tooltip="Optional title for the advantages grid section"
        >
          <Input
            placeholder="e.g., Advantages of Porta Cabins"
            size="large"
            maxLength={200}
          />
        </Form.Item>

        {/* Advantages */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Advantages <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-4">
            Add advantages to display in the grid. Each advantage will have a title and an icon. Available icons: DollarSign, Clock, Truck, Settings, Zap, Shield, Leaf, CheckCircle, Layers, Lightbulb, Grid, etc.
          </p>
          <Form.List name={['content', 'advantages']} initialValue={value.advantages || []}>
            {(fields, { add, remove }) => {
              return (
                <div className="advantages-editor">
                  {fields.length === 0 ? (
                    <Card className="border border-gray-200 border-dashed bg-gray-50 text-center py-6">
                      <p className="text-gray-500 mb-4">No advantages added yet</p>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => add({ id: '', title: '', icon: '' })}
                        size="large"
                        style={{
                          backgroundColor: '#1f2937',
                          borderColor: '#1f2937',
                        }}
                      >
                        Add First Advantage
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
                                Advantage {index + 1}
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
                            {/* ID */}
                            <Form.Item
                              name={[field.name, 'id']}
                              label="Advantage ID"
                              tooltip="Unique identifier for this advantage"
                              rules={[{ required: true, message: 'Advantage ID is required' }]}
                            >
                              <Input
                                placeholder="e.g., cost"
                                size="large"
                                maxLength={100}
                              />
                            </Form.Item>

                            {/* Title */}
                            <Form.Item
                              name={[field.name, 'title']}
                              label="Advantage Title"
                              tooltip="Title displayed for this advantage"
                              rules={[{ required: true, message: 'Title is required' }]}
                            >
                              <Input
                                placeholder="e.g., Cost Saving"
                                size="large"
                                maxLength={200}
                              />
                            </Form.Item>

                            {/* Icon */}
                            <Form.Item
                              name={[field.name, 'icon']}
                              label="Icon Name"
                              tooltip="Icon name from Lucide React (e.g., DollarSign, Clock, Truck, Settings, Zap, Shield, Leaf, CheckCircle, Layers, Lightbulb, Grid)"
                              rules={[{ required: true, message: 'Icon name is required' }]}
                            >
                              <Input
                                placeholder="e.g., DollarSign (available: DollarSign, Clock, Truck, Settings, Zap, Shield, Leaf, CheckCircle, Layers, Lightbulb, Grid)"
                                size="large"
                                maxLength={50}
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
                      onClick={() => add({ id: '', title: '', icon: '' })}
                      block
                      size="large"
                      className="mt-4"
                    >
                      Add Another Advantage
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
            tooltip="How many columns to display advantages in (2, 3, or 4 columns)"
            initialValue="4"
          >
            <Select size="large" placeholder="Select number of columns">
              <Option value="2">2 Columns</Option>
              <Option value="3">3 Columns</Option>
              <Option value="4">4 Columns</Option>
            </Select>
          </Form.Item>
        </Card>
      </div>
    </div>
  );
};

export default AdvantagesGridEditor;

