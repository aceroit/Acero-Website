import React from 'react';
import { Card, Button, Input, Form } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import './TabbedComparisonEditor.css';

const { TextArea } = Input;

/** Convert legacy { value, label } or { color } to string so we never store object in color-class fields */
function toColorClassString(val) {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return val.value ?? val.color ?? '';
  return '';
}

/**
 * Input that displays a string; normalizes legacy object values so we don't show "[object Object]".
 * Use for Pre-Engineered / Conventional Steel / Reinforced Concrete color class fields.
 */
function ColorClassInput({ value, onChange, ...rest }) {
  const str = toColorClassString(value);
  return (
    <Input
      {...rest}
      value={str}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/**
 * Tabbed Comparison Editor Component
 * Custom editor for tabbed comparison sections with complex nested structure
 */
const TabbedComparisonEditor = ({ value = {}, onChange, form }) => {
  return (
    <div className="tabbed-comparison-editor">
      <div className="space-y-6">
        {/* Title */}
        <Form.Item
          name={['content', 'title']}
          label="Section Title"
          tooltip="Title for the tabbed comparison section"
          rules={[{ required: true, message: 'Title is required' }]}
        >
          <Input
            placeholder="e.g., PEB Comparison"
            size="large"
            maxLength={200}
          />
        </Form.Item>

        {/* Subtitle */}
        <Form.Item
          name={['content', 'subtitle']}
          label="Subtitle"
          tooltip="Subtitle text displayed above the tabs"
          rules={[{ required: true, message: 'Subtitle is required' }]}
        >
          <TextArea
            placeholder="e.g., To learn more about PEB Comparison, click to see comparison"
            rows={3}
            size="large"
            maxLength={300}
            showCount
          />
        </Form.Item>

        {/* Tabs */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Comparison Tabs <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-4">
            Add tabs for different comparison categories. Each tab contains a legend and comparison data.
          </p>
          <Form.List name={['content', 'tabs']} initialValue={value.tabs || []}>
            {(tabFields, { add: addTab, remove: removeTab }) => {
              return (
                <div className="tabs-editor">
                  {tabFields.length === 0 ? (
                    <Card className="border border-gray-200 border-dashed bg-gray-50 text-center py-6">
                      <p className="text-gray-500 mb-4">No tabs added yet</p>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => addTab({
                          id: '',
                          label: '',
                          legend: [],
                          data: [],
                          textBelowTable: ''
                        })}
                        size="large"
                        style={{
                          backgroundColor: '#1f2937',
                          borderColor: '#1f2937',
                        }}
                      >
                        Add First Tab
                      </Button>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {tabFields.map((tabField, tabIndex) => (
                        <Card
                          key={tabField.key}
                          className="border border-gray-200 shadow-sm bg-white"
                          title={
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-gray-700">
                                Tab {tabIndex + 1}
                              </span>
                              <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => removeTab(tabField.name)}
                                size="small"
                              >
                                Remove Tab
                              </Button>
                            </div>
                          }
                        >
                          <div className="space-y-4">
                            {/* Tab ID */}
                            <Form.Item
                              {...tabField}
                              name={[tabField.name, 'id']}
                              label="Tab ID"
                              tooltip="Unique identifier for this tab (e.g., 'general')"
                              rules={[{ required: true, message: 'Tab ID is required' }]}
                            >
                              <Input
                                placeholder="e.g., general"
                                size="large"
                                maxLength={100}
                              />
                            </Form.Item>

                            {/* Tab Label */}
                            <Form.Item
                              {...tabField}
                              name={[tabField.name, 'label']}
                              label="Tab Label"
                              tooltip="Label displayed on the tab"
                              rules={[{ required: true, message: 'Tab label is required' }]}
                            >
                              <Input
                                placeholder="e.g., General Criteria"
                                size="large"
                                maxLength={200}
                              />
                            </Form.Item>

                            {/* Legend: Color Class only (value and label removed) */}
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Legend <span className="text-red-500">*</span>
                              </label>
                              <p className="text-xs text-gray-500 mb-4">
                                Add legend items with Tailwind colour class (e.g. bg-green-500). Used for legend dots and table cells.
                              </p>
                              <Form.List name={[tabField.name, 'legend']} initialValue={[]}>
                                {(legendFields, { add: addLegend, remove: removeLegend }) => {
                                  return (
                                    <div className="legend-editor">
                                      {legendFields.length === 0 ? (
                                        <Card className="border border-gray-200 border-dashed bg-gray-50 text-center py-4">
                                          <p className="text-gray-500 mb-2 text-sm">No legend items</p>
                                          <Button
                                            type="dashed"
                                            icon={<PlusOutlined />}
                                            onClick={() => addLegend({ color: '', label: '' })}
                                            size="small"
                                          >
                                            Add Legend Item
                                          </Button>
                                        </Card>
                                      ) : (
                                        <div className="space-y-3">
                                          {legendFields.map((legendField, legendIndex) => (
                                            <Card
                                              key={legendField.key}
                                              size="small"
                                              className="border border-gray-200"
                                              title={
                                                <div className="flex items-center justify-between">
                                                  <span className="text-xs font-semibold text-gray-600">
                                                    Legend {legendIndex + 1}
                                                  </span>
                                                  <Button
                                                    type="text"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={() => removeLegend(legendField.name)}
                                                    size="small"
                                                  >
                                                    Remove
                                                  </Button>
                                                </div>
                                              }
                                            >
                                              <Form.Item
                                                {...legendField}
                                                name={[legendField.name, 'color']}
                                                label="Color Class"
                                                rules={[{ required: true, message: 'Color class is required' }]}
                                              >
                                                <Input
                                                  placeholder="e.g., bg-green-500"
                                                  size="small"
                                                  maxLength={50}
                                                />
                                              </Form.Item>
                                              <Form.Item
                                                {...legendField}
                                                name={[legendField.name, 'label']}
                                                label="Label"
                                                tooltip="Display label for this legend item (e.g., Good, Low, On-Time)"
                                                rules={[{ required: true, message: 'Label is required' }]}
                                              >
                                                <Input
                                                  placeholder="e.g., Good, Low, On-Time"
                                                  size="small"
                                                  maxLength={50}
                                                />
                                              </Form.Item>
                                            </Card>
                                          ))}
                                        </div>
                                      )}
                                      {legendFields.length > 0 && (
                                        <Button
                                          type="dashed"
                                          icon={<PlusOutlined />}
                                          onClick={() => addLegend({ color: '', label: '' })}
                                          block
                                          size="small"
                                          className="mt-2"
                                        >
                                          Add Legend Item
                                        </Button>
                                      )}
                                    </div>
                                  );
                                }}
                              </Form.List>
                            </div>

                            {/* Text below table for this tab */}
                            <Form.Item
                              {...tabField}
                              name={[tabField.name, 'textBelowTable']}
                              label="Text below table"
                              tooltip="Optional text shown below the comparison table when this tab is active"
                            >
                              <TextArea
                                placeholder="e.g., Summary or notes for this tab"
                                rows={3}
                                size="large"
                                maxLength={500}
                                showCount
                              />
                            </Form.Item>

                            {/* Data */}
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Comparison Data <span className="text-red-500">*</span>
                              </label>
                              <p className="text-xs text-gray-500 mb-4">
                                Add comparison criteria with values for Pre-Engineered, Conventional Steel, and Reinforced Concrete.
                              </p>
                              <Form.List name={[tabField.name, 'data']} initialValue={[]}>
                                {(dataFields, { add: addData, remove: removeData }) => {
                                  return (
                                    <div className="data-editor">
                                      {dataFields.length === 0 ? (
                                        <Card className="border border-gray-200 border-dashed bg-gray-50 text-center py-4">
                                          <p className="text-gray-500 mb-2 text-sm">No data items</p>
                                          <Button
                                            type="dashed"
                                            icon={<PlusOutlined />}
                                            onClick={() => addData({
                                              criteria: '',
                                              preEngineered: '',
                                              conventionalSteel: '',
                                              reinforcedConcrete: ''
                                            })}
                                            size="small"
                                          >
                                            Add Data Item
                                          </Button>
                                        </Card>
                                      ) : (
                                        <div className="space-y-3">
                                          {dataFields.map((dataField, dataIndex) => (
                                            <Card
                                              key={dataField.key}
                                              size="small"
                                              className="border border-gray-200"
                                              title={
                                                <div className="flex items-center justify-between">
                                                  <span className="text-xs font-semibold text-gray-600">
                                                    Criteria {dataIndex + 1}
                                                  </span>
                                                  <Button
                                                    type="text"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={() => removeData(dataField.name)}
                                                    size="small"
                                                  >
                                                    Remove
                                                  </Button>
                                                </div>
                                              }
                                            >
                                              <div className="space-y-3">
                                                {/* Criteria */}
                                                <Form.Item
                                                  {...dataField}
                                                  name={[dataField.name, 'criteria']}
                                                  label="Criteria"
                                                  rules={[{ required: true, message: 'Criteria is required' }]}
                                                >
                                                  <Input
                                                    placeholder="e.g., Design dimension"
                                                    size="small"
                                                    maxLength={200}
                                                  />
                                                </Form.Item>

                                                {/* Pre-Engineered: colour class only (normalize legacy object to string) */}
                                                <Form.Item
                                                  {...dataField}
                                                  name={[dataField.name, 'preEngineered']}
                                                  label="Pre-Engineered (Color Class)"
                                                  normalize={toColorClassString}
                                                  rules={[{ required: true, message: 'Color class is required' }]}
                                                >
                                                  <ColorClassInput
                                                    placeholder="e.g., bg-green-500"
                                                    size="small"
                                                    maxLength={50}
                                                  />
                                                </Form.Item>

                                                {/* Conventional Steel: colour class only */}
                                                <Form.Item
                                                  {...dataField}
                                                  name={[dataField.name, 'conventionalSteel']}
                                                  label="Conventional Steel (Color Class)"
                                                  normalize={toColorClassString}
                                                  rules={[{ required: true, message: 'Color class is required' }]}
                                                >
                                                  <ColorClassInput
                                                    placeholder="e.g., bg-yellow-500"
                                                    size="small"
                                                    maxLength={50}
                                                  />
                                                </Form.Item>

                                                {/* Reinforced Concrete: colour class only */}
                                                <Form.Item
                                                  {...dataField}
                                                  name={[dataField.name, 'reinforcedConcrete']}
                                                  label="Reinforced Concrete (Color Class)"
                                                  normalize={toColorClassString}
                                                  rules={[{ required: true, message: 'Color class is required' }]}
                                                >
                                                  <ColorClassInput
                                                    placeholder="e.g., bg-red-500"
                                                    size="small"
                                                    maxLength={50}
                                                  />
                                                </Form.Item>
                                              </div>
                                            </Card>
                                          ))}
                                        </div>
                                      )}
                                      {dataFields.length > 0 && (
                                        <Button
                                          type="dashed"
                                          icon={<PlusOutlined />}
                                          onClick={() => addData({
                                            criteria: '',
                                            preEngineered: '',
                                            conventionalSteel: '',
                                            reinforcedConcrete: ''
                                          })}
                                          block
                                          size="small"
                                          className="mt-2"
                                        >
                                          Add Data Item
                                        </Button>
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

                  {tabFields.length > 0 && (
                    <Button
                      type="dashed"
                      icon={<PlusOutlined />}
                      onClick={() => addTab({
                        id: '',
                        label: '',
                        legend: [],
                        data: [],
                        textBelowTable: ''
                      })}
                      block
                      size="large"
                      className="mt-4"
                    >
                      Add Another Tab
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

export default TabbedComparisonEditor;

