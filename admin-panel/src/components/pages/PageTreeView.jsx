import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tree, Tag, Button, Space, Tooltip, Spin, Empty } from 'antd';
import {
  FileTextOutlined,
  EditOutlined,
  DeleteOutlined,
  DragOutlined,
  FolderOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import { usePermissions } from '../../contexts/PermissionContext';
import * as pageService from '../../services/pageService';
import { toast } from 'react-toastify';
import ConfirmModal from '../common/ConfirmModal';

const { DirectoryTree } = Tree;

// Status color mapping
const getStatusColor = (status) => {
  const colors = {
    draft: 'default',
    in_review: 'blue',
    changes_requested: 'orange',
    pending_approval: 'purple',
    pending_publish: 'cyan',
    published: 'green',
    archived: 'red',
  };
  return colors[status] || 'default';
};

// Status display names
const getStatusLabel = (status) => {
  const labels = {
    draft: 'Draft',
    in_review: 'In Review',
    changes_requested: 'Changes Requested',
    pending_approval: 'Pending Approval',
    pending_publish: 'Pending Publish',
    published: 'Published',
    archived: 'Archived',
  };
  return labels[status] || status;
};

/**
 * Convert backend tree structure to Ant Design Tree format
 */
const convertToTreeData = (tree, onDelete, hasUpdatePermission, hasDeletePermission) => {
  return tree.map((page) => {
    const hasChildren = page.children && page.children.length > 0;
    
    return {
      key: page._id,
      title: (
        <div className="flex items-center justify-between group hover:bg-gray-50 p-1 rounded -ml-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-gray-900 font-medium truncate">{page.title}</span>
            <Tag 
              color={getStatusColor(page.status)}
              className="text-xs px-2 py-0"
            >
              {getStatusLabel(page.status)}
            </Tag>
            <span className="text-xs text-gray-500 font-mono truncate hidden md:inline">{page.slug}</span>
          </div>
          <Space className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            {hasUpdatePermission && (
              <Tooltip title="Edit">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Navigate will be handled by parent
                  }}
                />
              </Tooltip>
            )}
            {hasDeletePermission && (
              <Tooltip title="Delete">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(page);
                  }}
                />
              </Tooltip>
            )}
          </Space>
        </div>
      ),
      icon: hasChildren ? <FolderOutlined /> : <FileTextOutlined />,
      isLeaf: !hasChildren,
      children: hasChildren 
        ? convertToTreeData(page.children, onDelete, hasUpdatePermission, hasDeletePermission)
        : undefined,
      pageData: page, // Store original page data
    };
  });
};

const PageTreeView = ({ onPageSelect, onRefresh }) => {
  const [treeData, setTreeData] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [draggedNode, setDraggedNode] = useState(null);

  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const hasUpdatePermission = hasPermission('pages', 'update');
  const hasDeletePermission = hasPermission('pages', 'delete');

  // Fetch page tree
  const fetchTree = async () => {
    setLoading(true);
    try {
      const response = await pageService.getPageTree();
      if (response.success) {
        const tree = response.data.tree || [];
        setTreeData(tree);
        // Auto-expand first level
        if (tree.length > 0 && expandedKeys.length === 0) {
          setExpandedKeys(tree.map(page => page._id));
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch page tree');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  // Handle delete click
  const handleDeleteClick = useCallback((page) => {
    setSelectedPage(page);
    setIsDeleteModalOpen(true);
  }, []);

  // Convert tree data for Ant Design Tree
  const convertedTreeData = useMemo(() => {
    return convertToTreeData(treeData, handleDeleteClick, hasUpdatePermission, hasDeletePermission);
  }, [treeData, hasUpdatePermission, hasDeletePermission, handleDeleteClick]);

  // Handle delete confirmation
  const handleDelete = async () => {
    try {
      const response = await pageService.deletePage(selectedPage._id);
      if (response.success) {
        toast.success('Page deleted successfully');
        if (response.data?.pageWasInHeader) {
          toast.warning(
            'This page was in the header. Update Header Configuration to remove its link and keep the site in sync.',
            { autoClose: 8000 }
          );
        }
        setIsDeleteModalOpen(false);
        setSelectedPage(null);
        fetchTree();
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete page');
    }
  };

  // Handle node select
  const handleSelect = (selectedKeys, info) => {
    if (info.selected && info.node.pageData) {
      if (onPageSelect) {
        onPageSelect(info.node.pageData);
      } else if (hasUpdatePermission) {
        navigate(`/pages/${info.node.pageData._id}`);
      }
    }
  };

  // Handle drag start
  const handleDragStart = (info) => {
    setDraggedNode(info.node);
  };

  // Check if drop is allowed (for visual feedback)
  const allowDrop = ({ dropNode, dropPosition }) => {
    // Use draggedNode state (set in handleDragStart)
    if (!draggedNode || !dropNode) return false;

    const dragPage = draggedNode.pageData;
    const dropPage = dropNode.pageData;

    if (!dragPage || !dropPage) return false;

    // Don't allow dropping on itself
    if (dragPage._id === dropPage._id) return false;

    const isDragPageRoot = dragPage.level === 0 || !dragPage.parentId;
    const isDropPageRoot = dropPage.level === 0 || !dropPage.parentId;

    // Root pages can only be dropped between other root pages
    if (isDragPageRoot) {
      // Can only drop as sibling (before/after), not as child
      if (dropPosition === -1) return false; // Not allowed to drop as child
      // Can only drop before/after other root pages
      return isDropPageRoot;
    }

    // Child pages can only be reordered within same parent
    if (!isDragPageRoot) {
      // Cannot drop as child of another page
      if (dropPosition === -1) return false;
      
      // Can only drop before/after siblings (same parent)
      const dragPageParentId = dragPage.parentId;
      const dropPageParentId = dropPage.parentId || null;
      return dragPageParentId === dropPageParentId;
    }

    return false;
  };

  // Handle drop
  const handleDrop = async (info) => {
    const dropKey = info.node.key;
    const dragKey = info.dragNode.key;

    // Don't allow dropping on itself
    if (dragKey === dropKey) {
      setDraggedNode(null);
      return;
    }

    const dragNode = draggedNode || info.dragNode;
    const dragPage = dragNode.pageData;
    const dropPage = info.node.pageData;

    // Determine if dragPage is a root page (level 0, no parent)
    const isDragPageRoot = dragPage.level === 0 || !dragPage.parentId;
    
    // Determine if dropPage is a root page
    const isDropPageRoot = dropPage.level === 0 || !dropPage.parentId;

    // RESTRICTION 1: Root pages can only be moved between other root pages
    if (isDragPageRoot) {
      // If dragging a root page, it can only be dropped:
      // - Before/after other root pages (as sibling)
      // - NOT as a child of any page
      const dropPos = info.node.pos.split('-');
      const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

      if (dropPosition === -1) {
        // Trying to drop root page as child - NOT ALLOWED
        toast.error('Root pages cannot be moved under other pages');
        setDraggedNode(null);
        return;
      }

      if (!isDropPageRoot) {
        // Trying to drop root page before/after a child page - NOT ALLOWED
        toast.error('Root pages can only be reordered with other root pages');
        setDraggedNode(null);
        return;
      }

      // Both are root pages - allow reordering
      // newParentId should remain null (root level)
      const newParentId = null;
      
      try {
        // For root pages, we need to reorder them
        // Get all root pages and reorder
        const rootPages = treeData.filter(p => p.level === 0 || !p.parentId);
        const dragIndex = rootPages.findIndex(p => p._id === dragPage._id);
        const dropIndex = rootPages.findIndex(p => p._id === dropPage._id);

        if (dragIndex === -1 || dropIndex === -1) {
          toast.error('Failed to reorder pages');
          setDraggedNode(null);
          return;
        }

        // Create reorder list
        const reorderList = rootPages.map((p, index) => {
          let newOrder = index;
          
          if (index === dragIndex) {
            newOrder = dropIndex;
          } else if (dragIndex < dropIndex) {
            // Moving down
            if (index > dragIndex && index <= dropIndex) {
              newOrder = index - 1;
            }
          } else {
            // Moving up
            if (index >= dropIndex && index < dragIndex) {
              newOrder = index + 1;
            }
          }
          
          return {
            _id: p._id,
            order: newOrder,
          };
        });

        await pageService.reorderPages(reorderList);
        toast.success('Pages reordered successfully');
        toast.info('Sync Header from Page Tree in Header Configuration to update the site navigation.', { autoClose: 6000 });
        fetchTree();
        if (onRefresh) onRefresh();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to reorder pages');
      } finally {
        setDraggedNode(null);
      }
      return;
    }

    // RESTRICTION 2: Child pages can only be moved within their parent's children
    // If dragPage is a child (has parent), it can only be reordered with siblings
    if (!isDragPageRoot) {
      const dropPos = info.node.pos.split('-');
      const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

      // Get the parent of the dragged page
      const dragPageParentId = dragPage.parentId;

      if (dropPosition === -1) {
        // Trying to drop child as child of another page - NOT ALLOWED
        toast.error('Child pages cannot be moved to different parents. They can only be reordered within their current parent.');
        setDraggedNode(null);
        return;
      }

      // Dropping before/after - check if same parent
      const dropPageParentId = dropPage.parentId || null;

      // Compare parentIds (handle both string and ObjectId formats)
      const dragParentIdStr = dragPageParentId?.toString() || null;
      const dropParentIdStr = dropPageParentId?.toString() || null;

      if (dragParentIdStr !== dropParentIdStr) {
        // Different parents - NOT ALLOWED
        toast.error('Child pages can only be reordered with siblings under the same parent');
        setDraggedNode(null);
        return;
      }

      // Same parent - allow reordering
      // Get all siblings (children of the same parent)
      const getSiblings = (tree, parentId) => {
        if (!parentId) {
          // Root level pages
          return tree.filter(p => !p.parentId || p.level === 0);
        }
        
        // Find parent in tree and return its children
        const findPage = (nodes, id) => {
          for (const node of nodes) {
            if (node._id === id) return node;
            if (node.children && node.children.length > 0) {
              const found = findPage(node.children, id);
              if (found) return found;
            }
          }
          return null;
        };

        const parent = findPage(tree, parentId);
        return parent?.children || [];
      };

      const siblings = getSiblings(treeData, dragPageParentId);
      const dragIndex = siblings.findIndex(p => p._id === dragPage._id);
      const dropIndex = siblings.findIndex(p => p._id === dropPage._id);

      if (dragIndex === -1 || dropIndex === -1) {
        toast.error('Failed to reorder pages');
        setDraggedNode(null);
        return;
      }

      // Create reorder list
      const reorderList = siblings.map((p, index) => {
        let newOrder = index;
        
        if (index === dragIndex) {
          newOrder = dropIndex;
        } else if (dragIndex < dropIndex) {
          // Moving down
          if (index > dragIndex && index <= dropIndex) {
            newOrder = index - 1;
          }
        } else {
          // Moving up
          if (index >= dropIndex && index < dragIndex) {
            newOrder = index + 1;
          }
        }
        
        return {
          _id: p._id,
          order: newOrder,
        };
      });

      try {
        await pageService.reorderPages(reorderList);
        toast.success('Pages reordered successfully');
        toast.info('Sync Header from Page Tree in Header Configuration to update the site navigation.', { autoClose: 6000 });
        fetchTree();
        if (onRefresh) onRefresh();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to reorder pages');
      } finally {
        setDraggedNode(null);
      }
      return;
    }

    // Fallback - should not reach here
    setDraggedNode(null);
  };

  if (loading && treeData.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  if (treeData.length === 0) {
    return (
      <Empty
        description="No pages found"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div className="page-tree-view">
      <Tree
        treeData={convertedTreeData}
        defaultExpandAll={false}
        expandedKeys={expandedKeys}
        onExpand={setExpandedKeys}
        onSelect={handleSelect}
        draggable={hasUpdatePermission ? { icon: <DragOutlined /> } : false}
        onDragStart={handleDragStart}
        onDrop={handleDrop}
        allowDrop={allowDrop}
        blockNode
        showIcon
        className="bg-white"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={isDeleteModalOpen}
        title="Delete Page"
        content={`Are you sure you want to delete "${selectedPage?.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setSelectedPage(null);
        }}
        okText="Delete"
      />
    </div>
  );
};

export default PageTreeView;

