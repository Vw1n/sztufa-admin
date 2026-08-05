import React from 'react';
import { Download } from 'lucide-react';

interface ExcelTemplateFooterProps {
  onDownloadTemplate: () => void;
}

export const ExcelTemplateFooter: React.FC<ExcelTemplateFooterProps> = ({
  onDownloadTemplate,
}) => {
  return (
    <div className="template-info">
      <div className="template-header">
        <p>Excel 模板格式：</p>
        <button onClick={onDownloadTemplate} className="download-template-btn">
          <Download size={16} />
          下载模板
        </button>
      </div>
      <ul>
        <li>列名：姓名、学号、球衣号码、照片（可选，支持图片 URL 链接）</li>
        <li>第一行为表头，从第二行开始为数据</li>
        <li>
          除在 Excel 中填写照片 URL 外，解析后还可在预览界面批量选择本地照片（文件名需与学号或姓名一致，如{' '}
          <code>20210001.jpg</code> 或 <code>张三.png</code>）
        </li>
      </ul>
    </div>
  );
};

export default ExcelTemplateFooter;
