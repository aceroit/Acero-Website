import React, { useEffect } from 'react';
import { Card, Button, Input, Form, Alert } from 'antd';
import { PlusOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import './ComparisonTableEditor.css';

/**
 * Comparison Table Editor Component
 * Custom editor for comparison table sections with factors and systems
 */
const ComparisonTableEditor = ({ value = {}, onChange, form }) => {
  // Watch factors to show count
  const factors = Form.useWatch(['content', 'factors'], form) || [];
  const factorsCount = factors.length;
  const systems = Form.useWatch(['content', 'systems'], form) || [];

  // Sync systems' values arrays when factors count changes
  useEffect(() => {
    if (factorsCount > 0 && systems.length > 0) {
      systems.forEach((system, systemIndex) => {
        const currentValues = form.getFieldValue(['content', 'systems', systemIndex, 'values']) || [];
        if (currentValues.length !== factorsCount) {
          const newValues = Array(factorsCount).fill('').map((_, i) => currentValues[i] || '');
          form.setFieldValue(['content', 'systems', systemIndex, 'values'], newValues);
        }
      });
    }
  }, [factorsCount, form, systems.length]);

  return (
    <div className="comparison-table-editor">
      <div className="space-y-6">
        {/* Title */}
        <Form.Item
          name={['content', 'title']}
          label="Table Title"
          tooltip="Title for the comparison table"
          rules={[{ required: true, message: 'Title is required' }]}
        >
          <Input
            placeholder="e.g., Factors to consider while selecting the right racking system"
            size="large"
            maxLength={200}
          />
        </Form.Item>

        {/* Factors */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Comparison Factors <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-4">
            Add factors to compare across different systems. These will be the rows in the comparison table.
          </p>
          <Form.List name={['content', 'factors']} initialValue={value.factors || []}>
            {(fields, { add, remove }) => {
              return (
                <div className="factors-editor">
                  {fields.length === 0 ? (
                    <Card className="border border-gray-200 border-dashed bg-gray-50 text-center py-6">
                      <p className="text-gray-500 mb-4">No factors added yet</p>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => add('')}
                        size="large"
                        style={{
                          backgroundColor: '#1f2937',
                          borderColor: '#1f2937',
                        }}
                      >
                        Add First Factor
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
                                Factor {index + 1}
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
                          <Form.Item
                            name={[field.name]}
                            rules={[{ required: true, message: 'Factor name is required' }]}
                          >
                            <Input
                              placeholder="e.g., Budget"
                              size="large"
                              maxLength={200}
                            />
                          </Form.Item>
                        </Card>
                      ))}
                    </div>
                  )}

                  {fields.length > 0 && (
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => add('')}
                      block
                      size="large"
                      className="mt-4"
                    >
                      Add Another Factor
                    </Button>
                  )}
                </div>
              );
            }}
          </Form.List>
        </div>

        {/* Systems */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Systems to Compare <span className="text-red-500">*</span>
          </label>
          {factorsCount > 0 && (
            <Alert
              message={`Each system needs ${factorsCount} value${factorsCount !== 1 ? 's' : ''} (one for each factor)`}
              type="info"
              icon={<InfoCircleOutlined />}
              showIcon
              className="mb-4"
            />
          )}
          <p className="text-xs text-gray-500 mb-4">
            Add systems to compare. Each system must have a value for each factor defined above.
          </p>
          <Form.List name={['content', 'systems']} initialValue={value.systems || []}>
            {(fields, { add, remove }) => {
              return (
                <div className="systems-editor">
                  {fields.length === 0 ? (
                    <Card className="border border-gray-200 border-dashed bg-gray-50 text-center py-6">
                      <p className="text-gray-500 mb-4">No systems added yet</p>
                      {factorsCount === 0 && (
                        <p className="text-xs text-orange-600 mb-4">
                          Please add factors first before adding systems
                        </p>
                      )}
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => add({ name: '', values: Array(factorsCount).fill('') })}
                        size="large"
                        disabled={factorsCount === 0}
                        style={{
                          backgroundColor: '#1f2937',
                          borderColor: '#1f2937',
                        }}
                      >
                        Add First System
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
                                System {index + 1}
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
                            {/* System Name */}
                            <Form.Item
                              name={[field.name, 'name']}
                              label="System Name"
                              tooltip="Name of the system to compare"
                              rules={[{ required: true, message: 'System name is required' }]}
                            >
                              <Input
                                placeholder="e.g., Drive-in System"
                                size="large"
                                maxLength={200}
                              />
                            </Form.Item>

                            {/* Values Array */}
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Values <span className="text-red-500">*</span>
                              </label>
                              <p className="text-xs text-gray-500 mb-4">
                                Add one value for each factor. Current factors: {factorsCount > 0 ? factors.map((f, i) => `${i + 1}. ${f || 'Factor ' + (i + 1)}`).join(', ') : 'None'}
                              </p>
                              <Form.List name={[field.name, 'values']} initialValue={Array(factorsCount).fill('')}>
                                {(valueFields, { add: addValue, remove: removeValue }) => {
                                  return (
                                    <div className="values-editor">
                                      {factorsCount === 0 ? (
                                        <Alert
                                          message="Please add factors first"
                                          type="warning"
                                          showIcon
                                        />
                                      ) : (
                                        <div className="space-y-3">
                                          {valueFields.map((valueField, valueIndex) => {
                                            const { key, ...valueFieldProps } = valueField;
                                            return (
                                              <Form.Item
                                                key={key}
                                                {...valueFieldProps}
                                                name={[valueField.name]}
                                                label={factors[valueIndex] ? `Value for "${factors[valueIndex]}"` : `Value ${valueIndex + 1}`}
                                                rules={[{ required: true, message: 'Value is required' }]}
                                              >
                                                <Input
                                                  placeholder={`Enter value for ${factors[valueIndex] || 'factor ' + (valueIndex + 1)}`}
                                                  size="large"
                                                  maxLength={200}
                                                />
                                              </Form.Item>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                }}
                              </Form.List>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  {fields.length > 0 && (
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => add({ name: '', values: Array(factorsCount).fill('') })}
                      block
                      size="large"
                      className="mt-4"
                      disabled={factorsCount === 0}
                    >
                      Add Another System
                    </Button>
                  )}
                </div>
              );
            }}
          </Form.List>
        </div>
      </div>
    </div>
  );
};

export default ComparisonTableEditor;

