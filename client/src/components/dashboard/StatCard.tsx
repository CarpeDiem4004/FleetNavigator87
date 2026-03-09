import React from 'react';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  iconBgColor: string;
  iconColor: string;
  children?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ 
  icon, 
  title, 
  value, 
  iconBgColor, 
  iconColor, 
  children 
}) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md ${iconBgColor} p-3 ${iconColor}`}>
            {icon}
          </div>
          <div className="ml-5">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-xl font-semibold text-gray-800">{value}</h3>
          </div>
        </div>
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
