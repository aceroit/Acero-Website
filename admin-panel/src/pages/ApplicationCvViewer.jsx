import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Button, Spin } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import * as applicationService from '../services/applicationService';

const getFilenameFromDisposition = (disposition) => {
  const match = String(disposition || '').match(/filename="?([^"]+)"?/i);
  return match?.[1] || 'cv.pdf';
};

const ApplicationCvViewer = () => {
  const { id } = useParams();
  const [fileUrl, setFileUrl] = useState('');
  const [filename, setFilename] = useState('cv.pdf');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let objectUrl = '';

    const loadCv = async () => {
      try {
        const response = await applicationService.viewApplicationCv(id);
        const blob = new Blob([response.data], {
          type: response.headers?.['content-type'] || 'application/pdf',
        });

        objectUrl = window.URL.createObjectURL(blob);
        setFilename(getFilenameFromDisposition(response.headers?.['content-disposition']));
        setFileUrl(objectUrl);
      } catch (loadError) {
        setError(loadError.response?.data?.message || 'Failed to open CV');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadCv();
    }

    return () => {
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    };
  }, [id]);

  const handleDownload = () => {
    if (!fileUrl) return;

    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <Alert type="error" message={error} showIcon />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-100">
      <div className="flex items-center justify-between border-b bg-white px-4 py-3">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-gray-900">{filename}</h1>
          <p className="text-xs text-gray-500">Protected CV preview</p>
        </div>
        <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>
          Download
        </Button>
      </div>
      <iframe
        src={fileUrl}
        title={filename}
        className="min-h-0 flex-1 border-0"
      />
    </div>
  );
};

export default ApplicationCvViewer;
