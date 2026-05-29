import React, { useContext, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Store } from '../context/Store';

export default function MapScreen() {
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { cart } = state;
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [addressStatus, setAddressStatus] = useState('Resolving delivery address...');

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoading(false);
      },
      () => {
        setError('Unable to access your location. Please allow location access and try again.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    ctxDispatch({ type: 'SET_FULLBOX_OFF' });
    getCurrentLocation();
  }, [ctxDispatch]);

  useEffect(() => {
    const resolveDeliveryAddress = async () => {
      const query = [cart.shippingAddress?.address, cart.shippingAddress?.city, cart.shippingAddress?.country]
        .filter(Boolean)
        .join(', ');

      if (!query) {
        setAddressStatus('No delivery address is saved yet.');
        setDeliveryLocation(null);
        return;
      }

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`
        );
        const data = await response.json();

        if (data && data.length > 0) {
          setDeliveryLocation({
            label: query,
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          });
          setAddressStatus('');
        } else {
          setDeliveryLocation(null);
          setAddressStatus('The delivery address could not be located on the map.');
        }
      } catch (err) {
        setDeliveryLocation(null);
        setAddressStatus('Unable to resolve the delivery address right now.');
      }
    };

    resolveDeliveryAddress();
  }, [cart.shippingAddress?.address, cart.shippingAddress?.city, cart.shippingAddress?.country]);

  const haversineKm = (lat1, lng1, lat2, lng2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

    return 2 * R * Math.asin(Math.sqrt(a));
  };

  const distanceKm =
    location && deliveryLocation
      ? haversineKm(location.lat, location.lng, deliveryLocation.lat, deliveryLocation.lng)
      : null;

  const mapEmbedUrl = location
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${(location.lng - 0.03).toFixed(6)}%2C${(location.lat - 0.03).toFixed(6)}%2C${(location.lng + 0.03).toFixed(6)}%2C${(location.lat + 0.03).toFixed(6)}&layer=mapnik&marker=${location.lat.toFixed(6)}%2C${location.lng.toFixed(6)}`
    : '';

  return (
    <div className="min-h-[70vh] px-4 py-10">
      <Helmet>
        <title>Live Location Map</title>
      </Helmet>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="space-y-2 text-center sm:text-left">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-600">Location tracking</p>
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Live map for your current location</h1>
          <p className="text-sm text-slate-500">
            This map uses your browser location and OpenStreetMap to show the current area in real time.
          </p>
        </div>

        <div className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-[1fr,auto] md:items-center">
          <div className="text-sm text-slate-600">
            {loading
              ? 'Detecting your location...'
              : location
                ? `Latitude: ${location.lat.toFixed(6)} · Longitude: ${location.lng.toFixed(6)}`
                : 'Location unavailable'}
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Delivery tracking ready
          </div>
          <button
            type="button"
            onClick={getCurrentLocation}
            className="rounded-xl bg-green-800 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-900"
          >
            Refresh location
          </button>
        </div>

        <div className="grid gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Delivery tracking</p>
            <p className="text-sm text-slate-600">
              This view helps customers confirm the delivery area and makes order tracking easier for both shoppers and delivery staff.
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Address confirmation</p>
            <p className="text-sm text-slate-600">
              Use the live location to verify the nearest delivery point and confirm the address before placing or following up on an order.
            </p>
          </div>
        </div>

        <div className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-2">
          <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-600">Customer location</p>
            <p className="mt-2 text-sm text-slate-700">
              {location
                ? `Lat ${location.lat.toFixed(6)} · Lng ${location.lng.toFixed(6)}`
                : 'Location permission is required to show the customer position.'}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Delivery address</p>
            <p className="mt-2 text-sm text-slate-700">
              {deliveryLocation
                ? `${deliveryLocation.label} · Lat ${deliveryLocation.lat.toFixed(6)} · Lng ${deliveryLocation.lng.toFixed(6)}`
                : 'The saved delivery address will appear here once it is resolved.'}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {addressStatus || (distanceKm !== null
                ? `Estimated distance from customer to delivery address: ${distanceKm.toFixed(1)} km`
                : 'Distance will appear once the customer location is detected.')}
            </p>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
            Detecting your current position...
          </div>
        ) : location ? (
          <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-sm">
            <iframe
              title="Live location map"
              src={mapEmbedUrl}
              className="h-[420px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
