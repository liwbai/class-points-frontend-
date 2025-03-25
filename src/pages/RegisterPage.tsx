import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import './RegisterPage.css';

const { Title } = Typography;

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const RegisterPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: RegisterFormData) => {
    try {
      if (values.password !== values.confirmPassword) {
        message.error('两次输入的密码不一致');
        return;
      }

      setLoading(true);
      
      // 模拟API请求延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 创建模拟用户数据
      const mockUserData = {
        id: Date.now().toString(),
        name: values.name,
        email: values.email,
        token: 'mock-jwt-token-' + Date.now(),
      };
      
      // 保存token和用户信息到localStorage
      localStorage.setItem('token', mockUserData.token);
      localStorage.setItem('userInfo', JSON.stringify(mockUserData));
      
      message.success('注册成功！');
      navigate('/');
    } catch (error: any) {
      message.error('注册失败，请稍后再试');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <Row justify="center" align="middle" className="register-row">
        <Col xs={22} sm={16} md={12} lg={8}>
          <Card className="register-card">
            <div className="register-header">
              <Title level={2} className="register-title">班级积分系统</Title>
              <div className="register-subtitle">创建您的账户</div>
            </div>
            
            <Form
              name="register"
              onFinish={onFinish}
              layout="vertical"
              className="register-form"
            >
              <Form.Item
                name="name"
                rules={[{ required: true, message: '请输入您的姓名' }]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="姓名" 
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="email"
                rules={[
                  { required: true, message: '请输入您的邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input 
                  prefix={<MailOutlined />} 
                  placeholder="邮箱" 
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入您的密码' },
                  { min: 6, message: '密码至少6个字符' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="密码"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                rules={[
                  { required: true, message: '请确认您的密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="确认密码"
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  className="register-button" 
                  size="large"
                  loading={loading}
                  block
                >
                  注册
                </Button>
              </Form.Item>
            </Form>
            
            <div className="register-footer">
              <p>已有账户？ <Link to="/login">立即登录</Link></p>
              <p className="register-demo-hint">只需填写表单并提交即可注册</p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RegisterPage; 