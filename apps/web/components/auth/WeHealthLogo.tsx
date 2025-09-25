import React from 'react';

export const WeHealthLogo: React.FC = () => {
  return (
    <div className="flex items-center space-x-3">
      <div className="relative">
        <div className="w-10 h-10 bg-gradient-to-br from-wehealth-blue-500 to-wehealth-teal-500 rounded-lg flex items-center justify-center">
          <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
            <div className="w-4 h-4 bg-gradient-to-br from-wehealth-orange-500 to-wehealth-blue-500 rounded-sm"></div>
          </div>
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-wehealth-orange-500 rounded-full"></div>
      </div>
      <span className="text-2xl font-bold text-gray-800">WeHealth</span>
    </div>
  );
};