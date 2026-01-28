import { useState, useEffect } from 'react';
import { Card, Button, Input, Space, Form } from 'antd';
import { PlusOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import ImageUpload from '../common/ImageUpload';
import './HeroCarouselSlidesEditor.css';

const { TextArea } = Input;

/**
 * Slide Item Component
 */
const SlideItem = ({ slideField, index, onRemove, onMoveUp, onMoveDown, totalSlides }) => {
  const form = Form.useFormInstance();
  
  return (
    <div className="hero-slide-item">
      <Card
        className="border border-gray-200 shadow-sm bg-white mb-4"
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">
                Slide {index + 1}
              </span>
            </div>
            <Space>
              {index > 0 && (
                <Button
                  type="text"
                  icon={<ArrowUpOutlined />}
                  onClick={() => onMoveUp(index)}
                  size="small"
                  title="Move up"
                />
              )}
              {index < totalSlides - 1 && (
                <Button
                  type="text"
                  icon={<ArrowDownOutlined />}
                  onClick={() => onMoveDown(index)}
                  size="small"
                  title="Move down"
                />
              )}
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => onRemove(slideField.name)}
                size="small"
              >
                Remove
              </Button>
            </Space>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Image Upload */}
          <Form.Item
            {...slideField}
            name={[slideField.name, 'image']}
            label="Slide Image"
            rules={[{ required: true, message: 'Image is required' }]}
            valuePropName="value"
            getValueFromEvent={(imageData) => {
              // ImageUpload's onChange returns { url, publicId, width, height }
              // We only need the URL string for the slide
              return imageData?.url || '';
            }}
            getValueProps={(value) => {
              // Convert string URL back to object format for ImageUpload component
              return {
                value: value ? { url: value } : null
              };
            }}
          >
            <ImageUpload
              folder="carousel"
              label=""
              maxSize={10}
            />
          </Form.Item>

          {/* Title */}
          <Form.Item
            {...slideField}
            name={[slideField.name, 'title']}
            label="Slide Title"
            rules={[{ required: true, message: 'Title is required' }]}
          >
            <Input
              placeholder="e.g., GLOBAL REACH, LOCAL IMPACT"
              size="large"
              maxLength={200}
            />
          </Form.Item>

          {/* Description */}
          <Form.Item
            {...slideField}
            name={[slideField.name, 'description']}
            label="Slide Description"
            rules={[{ required: true, message: 'Description is required' }]}
          >
            <TextArea
              placeholder="Enter slide description..."
              rows={4}
              size="large"
              maxLength={500}
              showCount
            />
          </Form.Item>
        </div>
      </Card>
    </div>
  );
};

/**
 * Hero Carousel Slides Editor Component
 * Custom editor for managing hero carousel slides with easy reordering
 */
const HeroCarouselSlidesEditor = ({ value = [], onChange, form }) => {
  return (
    <div className="hero-carousel-slides-editor">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-gray-700">
            Carousel Slides
          </label>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Add, edit, and reorder slides for your hero carousel. Use the arrow buttons to reorder slides.
        </p>
      </div>

      <Form.List name={['content', 'slides']} initialValue={value || []}>
        {(fields, { add, remove, move }) => {
          const handleAddSlide = () => {
            add({
              image: '',
              title: '',
              description: '',
            });
          };

          const handleMoveUp = (index) => {
            if (index > 0) {
              move(index, index - 1);
            }
          };

          const handleMoveDown = (index) => {
            if (index < fields.length - 1) {
              move(index, index + 1);
            }
          };

          return (
            <>
              {fields.length === 0 ? (
                <Card className="border border-gray-200 border-dashed bg-gray-50 text-center py-8">
                  <p className="text-gray-500 mb-4">No slides added yet</p>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddSlide}
                    size="large"
                    style={{
                      backgroundColor: '#1f2937',
                      borderColor: '#1f2937',
                    }}
                  >
                    Add First Slide
                  </Button>
                </Card>
              ) : (
                <div className="slides-list">
                  {fields.map((field, index) => (
                    <SlideItem
                      key={field.key}
                      slideField={field}
                      index={index}
                      onRemove={remove}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      totalSlides={fields.length}
                    />
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddSlide}
                  size="large"
                  style={{
                    backgroundColor: '#1f2937',
                    borderColor: '#1f2937',
                  }}
                >
                  Add Slide
                </Button>
                {fields.length > 0 && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600">
                      <strong>{fields.length}</strong> slide{fields.length !== 1 ? 's' : ''} configured
                    </p>
                  </div>
                )}
              </div>
            </>
          );
        }}
      </Form.List>
    </div>
  );
};

export default HeroCarouselSlidesEditor;

