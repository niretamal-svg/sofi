import React from 'react';
import clsx from 'clsx';

export default function Stepper({ currentStep, steps, onStepClick }) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 overflow-x-auto pb-2">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;

        return (
          <div key={stepNumber} className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => onStepClick(stepNumber)}
              disabled={stepNumber > currentStep}
              className={clsx(
                'w-10 h-10 rounded-full font-bold flex items-center justify-center transition-all duration-150 flex-shrink-0',
                isCompleted && 'bg-sofi-teal text-white',
                isActive && 'bg-sofi-purple text-white ring-4 ring-sofi-purple ring-opacity-30',
                stepNumber > currentStep && 'bg-gray-200 text-gray-400 cursor-not-allowed'
              )}
            >
              {isCompleted ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                stepNumber
              )}
            </button>

            <div className="hidden sm:block">
              <p className={clsx(
                'text-sm font-medium',
                isActive && 'text-sofi-purple',
                isCompleted && 'text-sofi-teal',
                stepNumber > currentStep && 'text-gray-400'
              )}>
                {step}
              </p>
            </div>

            {stepNumber < steps.length && (
              <div className={clsx(
                'w-12 h-1 hidden sm:block',
                stepNumber < currentStep ? 'bg-sofi-teal' : 'bg-gray-200'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
