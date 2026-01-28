/**
 * Icon Mapper Utility
 * Maps icon string names to Ant Design icon components
 */
import React from 'react';
import * as Icons from '@ant-design/icons';

/**
 * Get icon component from string name
 * @param {string} iconName - Icon name (e.g., 'FileTextOutlined', 'UserOutlined')
 * @param {React.Component} defaultIcon - Default icon if iconName not found
 * @returns {React.Component} - Icon component
 */
export const getIcon = (iconName, defaultIcon = Icons.FileTextOutlined) => {
  if (!iconName || typeof iconName !== 'string') {
    return defaultIcon;
  }

  // Try to get icon from Icons object
  const IconComponent = Icons[iconName];
  
  if (IconComponent) {
    return IconComponent;
  }

  // If not found, return default
  return defaultIcon;
};

/**
 * Render icon component from string name
 * @param {string} iconName - Icon name
 * @param {Object} props - Props to pass to icon component
 * @param {React.Component} defaultIcon - Default icon if iconName not found
 * @returns {React.ReactNode} - Rendered icon
 */
export const renderIcon = (iconName, props = {}, defaultIcon = Icons.FileTextOutlined) => {
  const IconComponent = getIcon(iconName, defaultIcon);
  return React.createElement(IconComponent, props);
};

