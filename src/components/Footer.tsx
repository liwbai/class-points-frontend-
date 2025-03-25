import React from 'react';
import { Layout, Typography } from 'antd';
import './Footer.css';

const { Footer: AntFooter } = Layout;
const { Text } = Typography;

const Footer: React.FC = () => {
  return (
    <AntFooter className="footer">
      <div className="footer-content">
        <Text className="copyright">管理系统/期刊/征文/课题专属定制微信：liwbai</Text>
      </div>
    </AntFooter>
  );
};

export default Footer; 