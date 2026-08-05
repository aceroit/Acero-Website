import { Card, Button, Input, Form } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import ImageUpload from '../../common/ImageUpload';

const { TextArea } = Input;

const defaultProducts = [
  {
    id: 'peb',
    title: 'PEB',
    image: 'https://res.cloudinary.com/dwaw2hfch/image/upload/v1769157366/acero-cms/products/lpupgr1rmihi5tioxxse.jpg',
    imageAlt: 'PEB',
    link: '/products/peb',
  },
  {
    id: 'conventional-steel',
    title: 'Conventional Steel',
    image: 'https://res.cloudinary.com/dwaw2hfch/image/upload/v1769157770/acero-cms/products/cvzl5ivsk3ykofyurdik.png',
    imageAlt: 'Conventional Steel',
    link: '/products/conventional-steel',
  },
  {
    id: 'racking-systems',
    title: 'Racking Systems',
    image: 'https://res.cloudinary.com/dwaw2hfch/image/upload/v1769157787/acero-cms/products/ryrxjiyqotf3gd7eyshn.jpg',
    imageAlt: 'Racking Systems',
    link: '/products/racking-systems',
  },
  {
    id: 'porta-cabins',
    title: 'Porta Cabins',
    image: 'https://res.cloudinary.com/dwaw2hfch/image/upload/v1769157806/acero-cms/products/zwkb8gz7dqlijnvpkyxn.jpg',
    imageAlt: 'Porta Cabins',
    link: '/products/porta-cabins',
  },
];

const ProductsGridEditor = ({ value = {} }) => {
  return (
    <div className="products-grid-editor">
      <div className="space-y-6">
        <Form.Item
          name={['content', 'title']}
          label="Section Title"
          tooltip="Optional title shown above the products grid"
        >
          <Input placeholder="e.g., Our Products" size="large" maxLength={200} />
        </Form.Item>

        <Form.Item
          name={['content', 'subtitle']}
          label="Subtitle"
          tooltip="Optional subtitle shown below the title"
        >
          <TextArea
            placeholder="e.g., Comprehensive steel building solutions designed for industrial, commercial and infrastructure projects."
            rows={3}
            size="large"
            maxLength={300}
            showCount
          />
        </Form.Item>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Product Cards <span className="text-red-500">*</span>
          </label>
          <p className="mb-4 text-xs text-gray-500">
            Manage the cards shown in the home page Our Products section. Each card supports image upload, title, alt text, and link.
          </p>
          <Form.List name={['content', 'products']} initialValue={value.products?.length ? value.products : defaultProducts}>
            {(fields, { add, remove }) => (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    className="border border-gray-200 bg-white shadow-sm"
                    title={
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">Product {index + 1}</span>
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
                        name={[field.name, 'id']}
                        label="Product ID"
                        tooltip="Unique identifier for the product card"
                        rules={[{ required: true, message: 'Product ID is required' }]}
                      >
                        <Input placeholder="e.g., peb" size="large" maxLength={100} />
                      </Form.Item>

                      <Form.Item
                        {...field}
                        name={[field.name, 'title']}
                        label="Product Title"
                        tooltip="Title shown on the card overlay"
                        rules={[{ required: true, message: 'Product title is required' }]}
                      >
                        <Input placeholder="e.g., PEB" size="large" maxLength={200} />
                      </Form.Item>

                      <Form.Item
                        {...field}
                        name={[field.name, 'image']}
                        label="Product Image"
                        tooltip="Image displayed on the product card"
                        rules={[{ required: true, message: 'Product image is required' }]}
                        valuePropName="value"
                        getValueFromEvent={(imageData) => imageData?.url || ''}
                        getValueProps={(fieldValue) => ({
                          value: fieldValue ? { url: fieldValue } : null,
                        })}
                      >
                        <ImageUpload folder="products" label="" maxSize={10} />
                      </Form.Item>

                      <Form.Item
                        {...field}
                        name={[field.name, 'imageAlt']}
                        label="Image Alt Text"
                        tooltip="Alternative text for accessibility"
                        rules={[{ required: true, message: 'Image alt text is required' }]}
                      >
                        <Input placeholder="e.g., PEB steel structure" size="large" maxLength={200} />
                      </Form.Item>

                      <Form.Item
                        {...field}
                        name={[field.name, 'link']}
                        label="Card Link"
                        tooltip="Page route or full URL to open when the card is clicked"
                        rules={[{ required: true, message: 'Card link is required' }]}
                      >
                        <Input placeholder="e.g., /products/peb" size="large" maxLength={500} />
                      </Form.Item>
                    </div>
                  </Card>
                ))}

                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() =>
                    add({
                      id: '',
                      title: '',
                      image: '',
                      imageAlt: '',
                      link: '',
                    })
                  }
                  block
                  size="large"
                  className="mt-4"
                >
                  Add Another Product Card
                </Button>
              </div>
            )}
          </Form.List>
        </div>
      </div>
    </div>
  );
};

export default ProductsGridEditor;
