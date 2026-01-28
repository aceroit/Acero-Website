import { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Form } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import ImageUpload from '../../common/ImageUpload';
import * as certificationService from '../../../services/certificationService';

const { TextArea } = Input;
const { Option } = Select;

/**
 * Certificates Grid Editor Component
 * Custom editor for certificates_grid sections. Each certificate row has name, image, imageAlt.
 * User can pick from Certifications master to fill name and image, or enter custom.
 */
const CertificatesGridEditor = ({ value = {}, onChange, form }) => {
  const [certifications, setCertifications] = useState([]);
  const [loadingCerts, setLoadingCerts] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingCerts(true);
    certificationService
      .getAllCertifications({ limit: 200, status: 'published' })
      .then((res) => {
        if (cancelled) return;
        const list = res?.data?.certifications || res?.certifications || res?.data || [];
        setCertifications(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setCertifications([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCerts(false);
      });
    return () => { cancelled = true; };
  }, []);

  const loadFromMaster = (fieldIndex, certificationId) => {
    const cert = certifications.find((c) => c._id === certificationId);
    if (!cert) return;
    form.setFieldsValue({
      content: {
        ...form.getFieldValue('content'),
        certificates: (form.getFieldValue(['content', 'certificates']) || []).map((row, i) =>
          i === fieldIndex
            ? {
                name: cert.name,
                image: cert.certificationImage?.url || '',
                imageAlt: row?.imageAlt ?? `${cert.name} Certificate`,
              }
            : row
        ),
      },
    });
    if (typeof onChange === 'function') {
      const next = { ...value, certificates: form.getFieldValue(['content', 'certificates']) };
      onChange(next);
    }
  };

  return (
    <div className="certificates-grid-editor">
      <div className="space-y-6">
        <Form.Item
          name={['content', 'title']}
          label="Section Title"
          rules={[{ required: true, message: 'Title is required' }]}
        >
          <Input placeholder="e.g., Quality Policy" size="large" maxLength={200} />
        </Form.Item>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Content Paragraphs <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-4">
            Add paragraphs shown above the certificates grid.
          </p>
          <Form.List name={['content', 'paragraphs']} initialValue={value.paragraphs || ['']}>
            {(fields, { add, remove }) => (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.key} className="flex gap-2 items-start">
                    <Form.Item
                      {...field}
                      name={[field.name]}
                      rules={[{ required: true, message: 'Paragraph is required' }]}
                      className="flex-1 mb-0"
                    >
                      <TextArea placeholder="Paragraph text" rows={3} size="large" maxLength={1000} />
                    </Form.Item>
                    {fields.length > 1 && (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(field.name)}
                        size="small"
                      />
                    )}
                  </div>
                ))}
                <Button type="dashed" icon={<PlusOutlined />} onClick={() => add('')} block size="large">
                  Add Paragraph
                </Button>
              </div>
            )}
          </Form.List>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Certificates <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-4">
            Add certificates. Use &quot;Pick from Certifications master&quot; to fill name and image from your Certifications module, or enter custom name and image.
          </p>
          <Form.List name={['content', 'certificates']} initialValue={value.certificates || []}>
            {(fields, { add, remove }) => (
              <>
                {fields.length === 0 ? (
                  <Card className="border border-gray-200 border-dashed bg-gray-50 text-center py-6">
                    <p className="text-gray-500 mb-4">No certificates added yet</p>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => add({ name: '', image: '', imageAlt: '' })}
                      size="large"
                      style={{ backgroundColor: '#1f2937', borderColor: '#1f2937' }}
                    >
                      Add First Certificate
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <Card
                        key={field.key}
                        size="small"
                        className="border border-gray-200 shadow-sm bg-white"
                        title={
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-700">
                              Certificate {index + 1}
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
                          <Form.Item
                            label="Pick from Certifications master"
                            tooltip="Select a certification to fill name and image from the Certifications module"
                          >
                            <Select
                              placeholder={loadingCerts ? 'Loading…' : 'Select certification…'}
                              size="large"
                              allowClear
                              loading={loadingCerts}
                              style={{ width: '100%' }}
                              onChange={(id) => loadFromMaster(field.name, id)}
                            >
                              {certifications.map((c) => (
                                <Option key={c._id} value={c._id}>
                                  {c.name}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>

                          <Form.Item
                            name={[field.name, 'name']}
                            label="Name"
                            rules={[{ required: true, message: 'Name is required' }]}
                          >
                            <Input placeholder="e.g., ISO 9001" size="large" maxLength={200} />
                          </Form.Item>

                          <Form.Item
                            name={[field.name, 'image']}
                            label="Image"
                            rules={[{ required: true, message: 'Image is required' }]}
                            valuePropName="value"
                            getValueFromEvent={(d) => d?.url || ''}
                            getValueProps={(v) => ({ value: v ? { url: v } : null })}
                          >
                            <ImageUpload folder="certificates" label="" maxSize={10} />
                          </Form.Item>

                          <Form.Item name={[field.name, 'imageAlt']} label="Image Alt Text">
                            <Input placeholder="e.g., ISO 9001 Certificate" size="large" maxLength={200} />
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
                    onClick={() => add({ name: '', image: '', imageAlt: '' })}
                    block
                    size="large"
                    className="mt-4"
                  >
                    Add Certificate
                  </Button>
                )}
              </>
            )}
          </Form.List>
        </div>
      </div>
    </div>
  );
};

export default CertificatesGridEditor;
