import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { Store } from '../../context/Store';

export default function DeliveryRoute({ children }) {
  const { state } = useContext(Store);
  const { userInfo } = state;

  return userInfo && userInfo.role === 'delivery' ? children : <Navigate to="/signin" />;
}
