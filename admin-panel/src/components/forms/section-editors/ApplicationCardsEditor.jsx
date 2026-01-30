import { Card, Button, Input, Form, Select } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import './ApplicationCardsEditor.css';

const { TextArea } = Input;

/**
 * Application Cards Editor Component
 * Custom editor for application cards sections with icon grid
 */
const ApplicationCardsEditor = ({ value = {}, onChange, form }) => {
  return (
    <div className="application-cards-editor">
      <div className="space-y-6">
        {/* Title (Optional) */}
        <Form.Item
          name={['content', 'title']}
          label="Section Title"
          tooltip="Optional title for the application cards section"
        >
          <Input
            placeholder="e.g., Application of PEB"
            size="large"
            maxLength={200}
          />
        </Form.Item>

        {/* Subtitle (Required) */}
        <Form.Item
          name={['content', 'subtitle']}
          label="Subtitle"
          tooltip="Subtitle text displayed above the application cards"
          rules={[{ required: true, message: 'Subtitle is required' }]}
        >
          <TextArea
            placeholder="e.g., We are dedicated to providing versatile solutions, with applications extending to, but not limited to:"
            rows={3}
            size="large"
            maxLength={500}
            showCount
          />
        </Form.Item>

        {/* Applications */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Applications <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-4">
            Add applications to display in the grid. Each application will have a name and an icon. Available icons: Plane, Warehouse, Building2, Factory, Layers, Droplets, Home, Building, Palette, etc.
          </p>
          <Form.List name={['content', 'applications']} initialValue={value.applications || []}>
            {(fields, { add, remove }) => {
              return (
                <div className="applications-editor">
                  {fields.length === 0 ? (
                    <Card className="border border-gray-200 border-dashed bg-gray-50 text-center py-6">
                      <p className="text-gray-500 mb-4">No applications added yet</p>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => add({ id: '', name: '', icon: '' })}
                        size="large"
                        style={{
                          backgroundColor: '#1f2937',
                          borderColor: '#1f2937',
                        }}
                      >
                        Add First Application
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
                                Application {index + 1}
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
                              {...field}
                              name={[field.name, 'id']}
                              label="Application ID"
                              tooltip="Unique identifier for this application"
                              rules={[{ required: true, message: 'Application ID is required' }]}
                            >
                              <Input
                                placeholder="e.g., aircraft-hangar"
                                size="large"
                                maxLength={100}
                              />
                            </Form.Item>

                            {/* Name */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'name']}
                              label="Application Name"
                              tooltip="Name of the application"
                              rules={[{ required: true, message: 'Application name is required' }]}
                            >
                              <Input
                                placeholder="e.g., Aircraft Hangar"
                                size="large"
                                maxLength={200}
                              />
                            </Form.Item>

                            {/* Icon */}
                            <Form.Item
                              {...field}
                              name={[field.name, 'icon']}
                              label="Icon Name"
                              tooltip="Icon name from Lucide React (e.g., Plane, Warehouse, Building2, Factory, Layers, Droplets, Home, Building, Palette)"
                              rules={[{ required: true, message: 'Icon name is required' }]}
                            >
                              <Input
                                placeholder="e.g., Plane (available: Plane, Warehouse, Building2, Factory, Layers, Droplets, Home, Building, Palette)"
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
                      onClick={() => add({ id: '', name: '', icon: '' })}
                      block
                      size="large"
                      className="mt-4"
                    >
                      Add Another Application
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
            tooltip="How many columns to display applications in (2–6). Use 6 for Application of PEB."
            initialValue={4}
            normalize={(value) => {
              const n = typeof value === 'number' ? value : parseInt(value, 10);
              return (n >= 2 && n <= 6) ? n : 4;
            }}
          >
            <Select
              size="large"
              placeholder="Select columns"
              options={[
                { value: 2, label: '2 columns' },
                { value: 3, label: '3 columns' },
                { value: 4, label: '4 columns' },
                { value: 5, label: '5 columns' },
                { value: 6, label: '6 columns' },
              ]}
            />
          </Form.Item>
        </Card>
      </div>
    </div>
  );
};

export default ApplicationCardsEditor;

