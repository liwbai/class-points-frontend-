import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // 从localStorage获取token
  const token = localStorage.getItem('token');

  // 如果没有token，重定向到登录页面
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 如果有token，显示子组件
  return <>{children}</>;
};

export default ProtectedRoute; 