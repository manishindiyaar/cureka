'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '@headlessui/react';
import { Bell, X, AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertType } from '../../types/schema';

interface AlertPanelProps {
  alerts: Alert[];
  onDismiss: (alertId: string) => void;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({ alerts, onDismiss }) => {
  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case AlertType.URGENT:
        return <AlertTriangle size={20} className="text-red-500" />;
      case AlertType.WARNING:
        return <AlertTriangle size={20} className="text-yellow-500" />;
      case AlertType.INFO:
        return <Info size={20} className="text-blue-500" />;
      default:
        return <Bell size={20} className="text-gray-500" />;
    }
  };

  const getAlertBorderColor = (type: AlertType) => {
    switch (type) {
      case AlertType.URGENT:
        return 'border-l-red-500';
      case AlertType.WARNING:
        return 'border-l-yellow-500';
      case AlertType.INFO:
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-500';
    }
  };

  return (
    <Card className="h-fit">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Bell size={20} className="mr-2" />
          Real-Time Alerts
        </h3>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No alerts at this time</p>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 border-l-4 bg-gray-50 rounded-r-lg ${getAlertBorderColor(alert.type)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => onDismiss(alert.id)}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};