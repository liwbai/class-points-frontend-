import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Typography, Avatar, Dropdown } from 'antd';
import { UserOutlined, LogoutOutlined, HomeOutlined } from '@ant-design/icons';
import './Header.css';

const { Header: AntHeader } = Layout;
const { Title } = Typography;

const Header: React.FC = () => {
  const [userName, setUserName] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 获取用户信息
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsedInfo = JSON.parse(userInfo);
        setUserName(parsedInfo.name || '用户');
      } catch (error) {
        console.error('解析用户信息失败', error);
      }
    }
  }, []);

  const handleLogout = () => {
    // 清除所有本地存储的用户信息和token
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    // 跳转到登录页面
    navigate('/login');
  };

  const items = [
    {
      key: '1',
      label: <span>{userName}</span>,
      icon: <UserOutlined />,
    },
    {
      key: '2',
      label: <span onClick={handleLogout}>退出登录</span>,
      icon: <LogoutOutlined />,
    },
  ];

  // 如果在登录或注册页面，不显示头部
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <AntHeader className="header">
      <div className="header-content">
        <div className="logo-container">
          <Link to="/">
            <Title level={3} className="logo-text">
              班级积分系统
            </Title>
          </Link>
        </div>
        <div className="nav-container">
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            className="nav-menu"
          >
            <Menu.Item key="/" icon={<HomeOutlined />}>
              <Link to="/">班级管理</Link>
            </Menu.Item>
          </Menu>
        </div>
        <div className="user-container">
          <Dropdown menu={{ items }} placement="bottomRight">
            <Avatar 
              size="large" 
              icon={<UserOutlined />} 
              className="user-avatar"
              style={{ backgroundColor: '#ff8c00', cursor: 'pointer' }}
            />
          </Dropdown>
        </div>
      </div>
    </AntHeader>
  );
};

export default Header; 