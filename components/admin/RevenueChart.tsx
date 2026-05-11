"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const chartData = [
  { day: "T2", revenue: 1200000, orderCount: 12 },
  { day: "T3", revenue: 1800000, orderCount: 15 },
  { day: "T4", revenue: 1450000, orderCount: 11 },
  { day: "T5", revenue: 2200000, orderCount: 18 },
  { day: "T6", revenue: 2700000, orderCount: 21 },
  { day: "T7", revenue: 3100000, orderCount: 24 },
  { day: "CN", revenue: 1900000, orderCount: 16 },
];

const formatPrice = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}tr`;
  if (value >= 1000) return `${Math.round(value / 1000)}k`;
  return `${value}`;
};

export default function RevenueChart() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-[280px] w-full animate-pulse bg-muted/20 rounded-lg" />;

  const isDark = resolvedTheme === "dark";
  const textColor = isDark ? "#ffffff" : "#000000";
  const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis 
            dataKey="day" 
            stroke={textColor} 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
          />
          <YAxis 
            tickFormatter={formatPrice} 
            stroke={textColor} 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? "#121212" : "#ffffff",
              borderColor: isDark ? "#333333" : "#e5e7eb",
              color: isDark ? "#ffffff" : "#000000",
              borderRadius: "8px",
            }}
            itemStyle={{ color: isDark ? "#ffffff" : "#000000" }}
            formatter={(value: any, _name: any, item: any) =>
              `${Number(value).toLocaleString("vi-VN")}đ (${item.payload.orderCount} đơn)`
            }
          />
          <Bar dataKey="revenue" fill="#2D6A4F" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
