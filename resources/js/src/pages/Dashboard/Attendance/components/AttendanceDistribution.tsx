import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { itemVariants } from './constants';

interface AttendanceDistributionProps {
    data: any;
    isDark: boolean;
}

const AttendanceDistribution: React.FC<AttendanceDistributionProps> = ({ data, isDark }) => {
    const deptChartOptions: any = {
        chart: { 
            type: 'donut', 
            fontFamily: 'Inter, sans-serif',
            background: 'transparent'
        },
        theme: { mode: isDark ? 'dark' : 'light' },
        labels: data?.departments?.map((d: any) => d.name) || [],
        colors: ['#4361ee', '#805dca', '#00ab55', '#e2a03f', '#e7515a', '#3b3f5c'],
        legend: { position: 'bottom' },
        stroke: { show: false },
        plotOptions: {
            pie: {
                donut: {
                    size: '75%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Present',
                            color: isDark ? '#cbd5e1' : '#64748b',
                            formatter: () => data?.stats?.present || 0
                        }
                    }
                }
            }
        },
        dataLabels: { enabled: false }
    };

    return (
        <motion.div variants={itemVariants}>
            <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-white/20 overflow-hidden h-full">
                <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-4">
                    <CardTitle className="text-lg font-bold">Present by Department</CardTitle>
                </CardHeader>
                <CardContent className="pt-10 flex flex-col items-center">
                    {data?.departments?.length > 0 ? (
                        <ReactApexChart options={deptChartOptions} series={data?.departments?.map((d: any) => d.count) || []} type="donut" height={350} />
                    ) : (
                        <div className="h-[350px] flex items-center flex-col gap-2 justify-center text-slate-400 italic">
                            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" color="none" fill="none" viewBox="0 0 24 24"><path d="M4.97883 9.68508C2.99294 8.89073 2 8.49355 2 8C2 7.50645 2.99294 7.10927 4.97883 6.31492L7.7873 5.19153C9.77318 4.39718 10.7661 4 12 4C13.2339 4 14.2268 4.39718 16.2127 5.19153L19.0212 6.31492C21.0071 7.10927 22 7.50645 22 8C22 8.49355 21.0071 8.89073 19.0212 9.68508L16.2127 10.8085C14.2268 11.6028 13.2339 12 12 12C10.7661 12 9.77318 11.6028 7.7873 10.8085L4.97883 9.68508Z" stroke="currentColor" stroke-width="1.5"></path><path opacity="0.5" d="M22 12C22 12 21.0071 12.8907 19.0212 13.6851L16.2127 14.8085C14.2268 15.6028 13.2339 16 12 16C10.7661 16 9.77318 15.6028 7.7873 14.8085L4.97883 13.6851C2.99294 12.8907 2 12 2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path><path opacity="0.5" d="M22 16C22 16 21.0071 16.8907 19.0212 17.6851L16.2127 18.8085C14.2268 19.6028 13.2339 20 12 20C10.7661 20 9.77318 19.6028 7.7873 18.8085L4.97883 17.6851C2.99294 16.8907 2 16 2 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg>
                            No data available</div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default React.memo(AttendanceDistribution);
