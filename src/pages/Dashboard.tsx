import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Row, Col, Empty, Modal, Form, Input, message } from 'antd';
import { PlusOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { classAPI } from '../services/api';
import './Dashboard.css';

const { Title, Text } = Typography;

interface ClassData {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
}

const Dashboard: React.FC = () => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [createLoading, setCreateLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await classAPI.getClasses();
      setClasses(response.data);
    } catch (error) {
      message.error('获取班级列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (values: { name: string; description: string }) => {
    try {
      setCreateLoading(true);
      await classAPI.createClass(values);
      message.success('班级创建成功');
      setModalVisible(false);
      form.resetFields();
      fetchClasses();
    } catch (error: any) {
      message.error(error.response?.data?.message || '创建班级失败');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleClassClick = (classId: string) => {
    navigate(`/class/${classId}`);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <Title level={2} className="dashboard-title">班级管理</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          size="large"
          onClick={() => setModalVisible(true)}
          className="create-class-btn"
        >
          创建班级
        </Button>
      </div>
      
      <div className="classes-container">
        {loading ? (
          <div className="loading-container">加载中...</div>
        ) : classes.length === 0 ? (
          <Empty 
            description="暂无班级，点击创建班级按钮开始使用" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            className="empty-container"
          />
        ) : (
          <Row gutter={[24, 24]}>
            {classes.map((cls) => (
              <Col xs={24} sm={12} md={8} lg={6} key={cls.id}>
                <Card 
                  className="class-card"
                  hoverable
                  onClick={() => handleClassClick(cls.id)}
                >
                  <div className="class-card-icon">
                    <TeamOutlined />
                  </div>
                  <div className="class-card-content">
                    <Title level={4} className="class-name">{cls.name}</Title>
                    {cls.description && (
                      <Text className="class-description">{cls.description}</Text>
                    )}
                    {cls.createdAt && (
                      <Text className="class-creation-date">
                        创建时间: {new Date(cls.createdAt).toLocaleDateString()}
                      </Text>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>

      <Modal
        title="创建新班级"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateClass}
        >
          <Form.Item
            name="name"
            label="班级名称"
            rules={[{ required: true, message: '请输入班级名称' }]}
          >
            <Input placeholder="例如：三年级一班" />
          </Form.Item>
          <Form.Item
            name="description"
            label="班级描述"
          >
            <Input.TextArea rows={4} placeholder="可选，班级的简要描述" />
          </Form.Item>
          <Form.Item className="form-buttons">
            <Button onClick={() => setModalVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={createLoading}>
              创建
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Dashboard; 