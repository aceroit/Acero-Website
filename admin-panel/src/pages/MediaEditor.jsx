import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Input, Button, Select, message, Space } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import * as mediaLibraryService from '../services/mediaLibraryService';

const { Option } = Select;
const { TextArea } = Input;

const MediaEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isEdit] = useState(!!id);

  useEffect(() => {
    if (isEdit) {
      fetchMedia();
    }
  }, [id]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const response = await mediaLibraryService.getMediaById(id);
      if (response.success) {
        form.setFieldsValue(response.data.media);
      }
    } catch (error) {
      message.error('Failed to fetch media');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (isEdit) {
        const response = await mediaLibraryService.updateMedia(id, values);
        if (response.success) {
          message.success('Media updated successfully');
          navigate('/media-library');
        }
      } else {
        // For new media, YouTube link creation
        if (values.youtubeUrl) {
          const response = await mediaLibraryService.createMedia({
            youtubeUrl: values.youtubeUrl,
            filename: values.filename,
            description: values.description,
            folder: values.folder || 'videos',
            tags: values.tags ? values.tags.split(',').map(t => t.trim()) : [],
          });
          if (response.success) {
            message.success('YouTube link added successfully');
            navigate('/media-library');
          }
        } else {
          message.warning('Please provide a YouTube URL or upload a file');
        }
      }
    } catch (error) {
      message.error(isEdit ? 'Failed to update media' : 'Failed to create media');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 lg:space-y-8 w-full max-w-full overflow-x-hidden">
      <Card className="w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {isEdit ? 'Edit Media' : 'Add Media'}
          </h1>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/media-library')}
          >
            Back
          </Button>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            folder: 'media',
          }}
        >
          {!isEdit && (
            <Form.Item
              name="youtubeUrl"
              label="YouTube URL"
              tooltip="Enter a YouTube video URL to add it to the media library"
              rules={[
                {
                  pattern: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/,
                  message: 'Please enter a valid YouTube URL',
                },
              ]}
            >
              <Input
                placeholder="https://www.youtube.com/watch?v=..."
                size="large"
              />
            </Form.Item>
          )}

          <Form.Item
            name="filename"
            label="Filename"
            rules={[{ required: true, message: 'Filename is required' }]}
          >
            <Input placeholder="Enter filename" size="large" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea
              placeholder="Enter description"
              rows={4}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="folder"
            label="Folder"
          >
            <Input placeholder="Enter folder path" size="large" />
          </Form.Item>

          <Form.Item
            name="tags"
            label="Tags"
            tooltip="Comma-separated tags"
          >
            <Input placeholder="tag1, tag2, tag3" size="large" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
                size="large"
                style={{
                  backgroundColor: '#1f2937',
                  borderColor: '#1f2937',
                }}
              >
                {isEdit ? 'Update Media' : 'Add Media'}
              </Button>
              <Button
                onClick={() => navigate('/media-library')}
                size="large"
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default MediaEditor;
