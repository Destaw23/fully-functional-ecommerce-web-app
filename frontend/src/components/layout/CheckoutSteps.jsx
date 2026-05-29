import React from 'react';

export default function CheckoutSteps(props) {
  const steps = [
    { name: 'Sign-In', active: props.step1 },
    { name: 'Shipping', active: props.step2 },
    { name: 'Payment', active: props.step3 },
    { name: 'Place Order', active: props.step4 },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-b border-slate-200 mb-8">
      {steps.map((step, idx) => (
        <div key={idx} className="flex items-center w-full sm:w-auto">
          {/* Step bubble & name */}
          <div className="flex items-center space-x-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
              step.active
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-400'
            }`}>
              {idx + 1}
            </div>
            <span className={`text-sm font-bold ${
              step.active ? 'text-slate-800' : 'text-slate-400'
            }`}>
              {step.name}
            </span>
          </div>

          {/* Line separator (except last step) */}
          {idx < steps.length - 1 && (
            <div className={`hidden sm:block flex-1 h-0.5 mx-4 min-w-[50px] ${
              steps[idx + 1].active ? 'bg-blue-600' : 'bg-slate-200'
            }`}></div>
          )}
        </div>
      ))}
    </div>
  );
}
