import React from 'react';
import { Navigate } from 'react-router-dom';

export const RecommendedJobsPage: React.FC = () => {
  return <Navigate to="/available-jobs" replace />;
};
export default RecommendedJobsPage;
