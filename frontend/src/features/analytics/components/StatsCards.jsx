// features/analytics/components/StatsCards.jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const StatsCards = ({ stats }) => {
  const cards = [
    { title: 'Total Quotations', value: stats.total, className: 'text-gray-900 dark:text-white' },
    { title: 'Accepted', value: stats.accepted, className: 'text-green-600 dark:text-green-400' },
    { title: 'Rejected', value: stats.rejected, className: 'text-red-600 dark:text-red-400' },
    { title: 'Pending', value: stats.pending, className: 'text-blue-600 dark:text-blue-400' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.className}`}>
              {card.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// features/analytics/components/TrendsChart.jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const TrendsChart = ({ data }) => {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Monthly Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#8884d8" 
                name="Total Quotations"
              />
              <Line 
                type="monotone" 
                dataKey="accepted" 
                stroke="#82ca9d" 
                name="Accepted"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );