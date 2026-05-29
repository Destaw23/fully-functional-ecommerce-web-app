import React, { useContext, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Store } from '../context/Store';
import CheckoutSteps from '../components/layout/CheckoutSteps';
import { Truck } from 'lucide-react';

const ETHIOPIAN_PHONE_REGEX = /^(?:09\d{8}|07\d{8}|\+?251\d{9})$/;
const POSTAL_CODE_REGEX = /^\d{6}$/;

export default function ShippingAddressScreen() {
  const navigate = useNavigate();
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const {
    fullBox,
    userInfo,
    cart: { shippingAddress },
  } = state;

  const [fullName, setFullName] = useState(shippingAddress.fullName || '');
  const [address, setAddress] = useState(shippingAddress.address || '');
  const [city, setCity] = useState(shippingAddress.city || '');
  const [postalCode, setPostalCode] = useState(shippingAddress.postalCode || '');
  const [country, setCountry] = useState(shippingAddress.country || 'Ethiopia');
  const [phone, setPhone] = useState(shippingAddress.phone || '');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!userInfo) {
      navigate('/signin?redirect=/shipping');
    }
  }, [userInfo, navigate]);

  const validateForm = () => {
    const nextErrors = {};

    if (!postalCode.trim() || !POSTAL_CODE_REGEX.test(postalCode.trim())) {
      nextErrors.postalCode = 'Postal code must be a 6-digit number.';
    }

    if (!phone.trim() || !ETHIOPIAN_PHONE_REGEX.test(phone.trim())) {
      nextErrors.phone = 'Phone number must be Ethiopian format (09XXXXXXXX, 07XXXXXXXX, or +251/251XXXXXXXXX).';
    }

    if (!country.trim()) {
      nextErrors.country = 'Country is required.';
    }

    setErrors(nextErrors);
    return nextErrors;
  };

  const submitHandler = (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      toast.error('Please fix the highlighted shipping address fields.');
      return;
    }

    const shippingData = {
      fullName,
      address,
      city,
      postalCode: postalCode.trim(),
      country: country.trim() || 'Ethiopia',
      phone: phone.trim(),
      location: shippingAddress.location,
    };

    ctxDispatch({
      type: 'SAVE_SHIPPING_ADDRESS',
      payload: shippingData,
    });
    localStorage.setItem('shippingAddress', JSON.stringify(shippingData));
    navigate('/payment');
  };

  useEffect(() => {
    ctxDispatch({ type: 'SET_FULLBOX_OFF' });
  }, [ctxDispatch, fullBox]);

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <Helmet>
        <title>Shipping Address</title>
      </Helmet>

      <CheckoutSteps step1 step2></CheckoutSteps>
      
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center space-x-2">
          <Truck className="text-blue-600" />
          <span>Shipping Address</span>
        </h1>
        
        <form onSubmit={submitHandler} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="w-full border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Postal Code</label>
              <input
                type="text"
                inputMode="numeric"
                value={postalCode}
                onChange={(e) => {
                  const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setPostalCode(onlyDigits);
                  if (errors.postalCode) {
                    setErrors((prev) => ({ ...prev, postalCode: '' }));
                  }
                }}
                required
                className={`w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white ${errors.postalCode ? 'border-red-400' : 'border-slate-200'}`}
              />
              {errors.postalCode ? <p className="text-xs text-red-500 mt-1">{errors.postalCode}</p> : null}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) {
                  setErrors((prev) => ({ ...prev, phone: '' }));
                }
              }}
              required
              className={`w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white ${errors.phone ? 'border-red-400' : 'border-slate-200'}`}
            />
            {errors.phone ? <p className="text-xs text-red-500 mt-1">{errors.phone}</p> : null}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Country</label>
            <input
              type="text"
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                if (errors.country) {
                  setErrors((prev) => ({ ...prev, country: '' }));
                }
              }}
              required
              className={`w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white ${errors.country ? 'border-red-400' : 'border-slate-200'}`}
            />
            {errors.country ? <p className="text-xs text-red-500 mt-1">{errors.country}</p> : null}
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <p className="text-xxs font-semibold text-slate-400">
              Map location selection is unavailable. Please enter your shipping address manually.
            </p>
            {shippingAddress.location && shippingAddress.location.lat ? (
              <span className="text-xxs font-bold text-slate-400">
                LAT: {shippingAddress.location.lat.toFixed(4)}, LNG: {shippingAddress.location.lng.toFixed(4)}
              </span>
            ) : null}
          </div>

          <button
            type="submit"
            className="w-full bg-green-800 hover:bg-green-900 text-white font-bold py-2.5 rounded-lg text-sm shadow transition-colors"
          >
            Continue to Payment
          </button>
        </form>
      </div>
    </div>
  );
}
