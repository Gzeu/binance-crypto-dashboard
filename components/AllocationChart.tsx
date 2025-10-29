'use client';

import { useEffect, useRef, useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { AllocationChartProps } from '@/lib/types';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Color palette for the chart
const CHART_COLORS = [
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F472B6', // Pink light
];

export function AllocationChart({ balances }: AllocationChartProps) {
  const chartRef = useRef<ChartJS<'doughnut'>>(null);

  // Prepare chart data - show top 10 assets and group rest as "Others"
  const chartData = useMemo(() => {
    if (!balances || balances.length === 0) {
      return {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 0,
        }]
      };
    }

    // Sort by value and take top 10
    const sortedBalances = [...balances]
      .filter(balance => parseFloat(balance.valueUSDT) > 0.01)
      .sort((a, b) => parseFloat(b.valueUSDT) - parseFloat(a.valueUSDT));

    const topAssets = sortedBalances.slice(0, 10);
    const otherAssets = sortedBalances.slice(10);
    
    const labels = topAssets.map(balance => balance.asset);
    const data = topAssets.map(balance => parseFloat(balance.valueUSDT));
    
    // Add "Others" if there are more assets
    if (otherAssets.length > 0) {
      const othersValue = otherAssets.reduce((sum, balance) => 
        sum + parseFloat(balance.valueUSDT), 0
      );
      labels.push(`Others (${otherAssets.length})`);
      data.push(othersValue);
    }

    const backgroundColors = labels.map((_, index) => 
      CHART_COLORS[index % CHART_COLORS.length]
    );

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color + '80'), // Add transparency
        borderWidth: 2,
        hoverBorderWidth: 3,
      }]
    };
  }, [balances]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
          },
          color: 'hsl(var(--foreground))',
        },
      },
      tooltip: {
        backgroundColor: 'hsl(var(--card))',
        titleColor: 'hsl(var(--card-foreground))',
        bodyColor: 'hsl(var(--card-foreground))',
        borderColor: 'hsl(var(--border))',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: $${value.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })} (${percentage}%)`;
          },
        },
      },
    },
    cutout: '60%',
    animation: {
      animateRotate: true,
      animateScale: false,
    },
  };

  // Calculate total value for center text
  const totalValue = balances.reduce((sum, balance) => 
    sum + parseFloat(balance.valueUSDT), 0
  );

  if (balances.length === 0) {
    return (
      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-xl font-semibold text-card-foreground mb-6">Portfolio Allocation</h2>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card p-6 rounded-lg border">
      <h2 className="text-xl font-semibold text-card-foreground mb-6">Portfolio Allocation</h2>
      
      <div className="relative">
        <div className="chart-container">
          <Doughnut 
            ref={chartRef}
            data={chartData} 
            options={chartOptions} 
          />
        </div>
        
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Total Value</div>
            <div className="text-lg font-semibold text-primary">
              ${totalValue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-muted-foreground text-center">
        Top {Math.min(10, balances.length)} assets by value
        {balances.length > 10 && ` (+${balances.length - 10} others)`}
      </div>
    </div>
  );
}
