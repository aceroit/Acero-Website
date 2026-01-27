import { Card, Button, Input, Form } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { TextArea } = Input;

/** Extract YouTube video ID from URL or return as-is if already an ID (11 chars) */
function parseYouTubeId(input) {
  if (!input || typeof input !== 'string') return '';
  const t = input.trim();
  if (t.length === 11 && !t.includes('/') && !t.includes('.')) return t;
  const m = t.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : t;
}

/**
 * Video Cards Editor – section type video_cards.
 * Content.videos = [{ youtubeId, title?, description? }].
 * Accepts YouTube URL or video ID; normalizes to youtubeId before save.
 */
const VideoCardsEditor = ({ value = {}, onChange, form }) => {
  return (
    <div className="video-cards-editor">
      <div className="space-y-6">
        <p className="text-sm text-gray-600">
          Add YouTube videos by link or video ID. They will be shown in a grid on the Videos page.
        </p>
        <Form.List name={['content', 'videos']} initialValue={value.videos || []}>
          {(fields, { add, remove }) => (
            <div className="space-y-4">
              {fields.length === 0 ? (
                <Card className="border border-gray-200 border-dashed bg-gray-50 text-center py-6">
                  <p className="text-gray-500 mb-4">No videos added yet</p>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => add({ youtubeId: '', title: '', description: '' })}
                    size="large"
                    className="text-white"
                    style={{ backgroundColor: '#1f2937', borderColor: '#1f2937' }}
                  >
                    Add first video
                  </Button>
                </Card>
              ) : (
                <>
                  {fields.map((field, index) => (
                    <Card
                      key={field.key}
                      className="border border-gray-200 shadow-sm bg-white"
                      title={
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-700">
                            Video {index + 1}
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
                          {...field}
                          name={[field.name, 'youtubeId']}
                          label="YouTube link or video ID"
                          rules={[{ required: true, message: 'YouTube link or ID is required' }]}
                          normalize={(v) => (v ? parseYouTubeId(v) : '')}
                        >
                          <Input
                            placeholder="e.g. https://www.youtube.com/watch?v=xxx or video ID"
                            size="large"
                          />
                        </Form.Item>
                        <Form.Item
                          {...field}
                          name={[field.name, 'title']}
                          label="Title"
                        >
                          <Input placeholder="Video title" size="large" />
                        </Form.Item>
                        <Form.Item
                          {...field}
                          name={[field.name, 'description']}
                          label="Description"
                        >
                          <TextArea placeholder="Short description (optional)" rows={2} size="large" />
                        </Form.Item>
                      </div>
                    </Card>
                  ))}
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => add({ youtubeId: '', title: '', description: '' })}
                    size="large"
                    block
                  >
                    Add another video
                  </Button>
                </>
              )}
            </div>
          )}
        </Form.List>
      </div>
    </div>
  );
};

export default VideoCardsEditor;
