import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Row, Col } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import './LoginPage.css';

const { Title } = Typography;

interface LoginFormData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: LoginFormData) => {
    try {
      setLoading(true);
      
      // 模拟API请求延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟验证 - 在实际应用中，这部分会由后端API处理
      if (values.email === 'admin@example.com' && values.password === 'password') {
        // 创建模拟用户数据
        const mockUserData = {
          id: '1',
          name: '管理员',
          email: values.email,
          token: 'mock-jwt-token-' + Date.now(),
        };
        
        // 保存token和用户信息到localStorage
        localStorage.setItem('token', mockUserData.token);
        localStorage.setItem('userInfo', JSON.stringify(mockUserData));
        
        message.success('登录成功！');
        navigate('/');
      } else {
        // 任何用户名密码都可以登录，方便演示
        const mockUserData = {
          id: Date.now().toString(),
          name: '测试用户',
          email: values.email,
          token: 'mock-jwt-token-' + Date.now(),
        };
        
        localStorage.setItem('token', mockUserData.token);
        localStorage.setItem('userInfo', JSON.stringify(mockUserData));
        
        message.success('登录成功！');
        navigate('/');
      }
    } catch (error: any) {
      message.error('登录失败，请检查您的邮箱和密码');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Row justify="center" align="middle" className="login-row">
        <Col xs={22} sm={16} md={12} lg={8}>
          <Card className="login-card">
            <div className="login-header">
              <Title level={2} className="login-title">班级积分系统</Title>
              <div className="login-subtitle">登录您的账户</div>
            </div>
            
            <Form
              name="login"
              initialValues={{ remember: true }}
              onFinish={onFinish}
              layout="vertical"
              className="login-form"
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: '请输入您的邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="邮箱" 
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入您的密码' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="密码"
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  className="login-button" 
                  size="large"
                  loading={loading}
                  block
                >
                  登录
                </Button>
              </Form.Item>
            </Form>
            
            <div className="login-footer">
              <p>还没有账户？ <Link to="/register">立即注册</Link></p>
              <p className="login-demo-hint">演示账户: admin@example.com / password</p>
              <p className="login-demo-hint">（或任意邮箱/密码组合）</p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LoginPage; 