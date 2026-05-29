
import React, { useContext, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import CheckoutSteps from '../components/layout/CheckoutSteps';
import { Store } from '../context/Store';
import { CreditCard, Building } from 'lucide-react';

export default function PaymentMethodScreen() {
  const navigate = useNavigate();
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const {
    cart: { shippingAddress, paymentMethod },
  } = state;

  const [paymentMethodName, setPaymentMethod] = useState(
    paymentMethod || 'Chapa'
  );

  useEffect(() => {
    if (!shippingAddress.address) {
      navigate('/shipping');
    }
  }, [shippingAddress, navigate]);

  const submitHandler = (e) => {
    e.preventDefault();
    ctxDispatch({ type: 'SAVE_PAYMENT_METHOD', payload: paymentMethodName });
    localStorage.setItem('paymentMethod', paymentMethodName);
    navigate('/placeorder');
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <Helmet>
        <title>Payment Method</title>
      </Helmet>
      
      <CheckoutSteps step1 step2 step3></CheckoutSteps>
      
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center space-x-2">
          <CreditCard className="text-blue-600" />
          <span>Payment Method</span>
        </h1>
        
        <form onSubmit={submitHandler} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <label className={`border rounded-xl p-4 flex items-center space-x-3 cursor-pointer transition-all ${
              paymentMethodName === 'Chapa' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'
            }`}>
              <input
                type="radio"
                name="paymentMethod"
                value="Chapa"
                checked={paymentMethodName === 'Chapa'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div className="flex items-center space-x-2">
                <Building className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-bold text-slate-800">Chapa (Credit Card / Telebirr / CBE / Bank)</span>
              </div>
            </label>

            <label className={`border rounded-xl p-4 flex items-center space-x-3 cursor-pointer transition-all ${
              paymentMethodName === 'Stripe' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'
            }`}>
              <input
                type="radio"
                name="paymentMethod"
                value="Stripe"
                checked={paymentMethodName === 'Stripe'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-bold text-slate-800">Stripe Gateway</span>
              </div>
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-green-800 hover:bg-green-900 text-white font-bold py-2.5 rounded-lg text-sm shadow transition-colors"
          >
            Continue to Place Order
          </button>
        </form>
      </div>
    </div>
  );
}
