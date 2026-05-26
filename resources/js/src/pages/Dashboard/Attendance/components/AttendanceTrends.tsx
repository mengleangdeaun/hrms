import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { itemVariants } from './constants';

interface AttendanceTrendsProps {
    data: any;
    isDark: boolean;
}

const AttendanceTrends: React.FC<AttendanceTrendsProps> = ({ data, isDark }) => {
    const trendChartOptions: any = {
        chart: {
            id: 'attendance-trend',
            toolbar: { show: false },
            zoom: { enabled: false },
            fontFamily: 'Inter, sans-serif',
            background: 'transparent'
        },
        theme: { mode: isDark ? 'dark' : 'light' },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3 },
        colors: ['#4361ee'],
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.6,
                opacityTo: 0.1,
                stops: [0, 90, 100]
            }
        },
        xaxis: {
            categories: data?.trend?.map((t: any) => t.date) || [],
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: { labels: { offsetX: -10 } },
        grid: {
            borderColor: isDark ? 'rgba(30, 41, 59, 0.4)' : '#e2e8f0',
            strokeDashArray: 4,
            xaxis: { lines: { show: true } }
        },
        tooltip: {
            theme: isDark ? 'dark' : 'light',
            x: { show: true },
            y: { formatter: (val: number) => `${val} Times` }
        }
    };

    return (
        <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-white/20 overflow-hidden h-full">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-4">
                    <CardTitle className="text-lg font-bold">Attendance Trends</CardTitle>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Daily Presence Wave</div>
                </CardHeader>
                <CardContent className="pt-6">
                    <ReactApexChart 
                        options={trendChartOptions} 
                        series={[{ name: 'Present', data: data?.trend?.map((t: any) => t.count) || [] }]} 
                        type="area" 
                        height={320} 
                    />
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default React.memo(AttendanceTrends);
