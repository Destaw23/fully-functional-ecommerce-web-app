import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { Store } from '../../context/Store';
import { isUserAdmin } from '../../utils/auth';

export default function AdminRoute({ children }) {
  const { state } = useContext(Store);
  const { userInfo } = state;
  const isAdmin = isUserAdmin(userInfo);
  return isAdmin ? children : <Navigate to="/signin?redirect=/admin/dashboard" />;
}
