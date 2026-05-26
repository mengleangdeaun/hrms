import React, { useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { IconHeartRateMonitor } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { itemVariants, DAYS, HOURS, STATUS_CATEGORIES } from './constants';

interface AttendanceWorkHealthProps {
    data: any;
    isDark: boolean;
    apiFilters: { start_date?: string; end_date?: string };
    onInspect: (type: string) => void;
}

const AttendanceWorkHealth: React.FC<AttendanceWorkHealthProps> = ({ 
    data, 
    isDark, 
    apiFilters, 
    onInspect 
}) => {
    const navigate = useNavigate();
    const [heatmapType, setHeatmapType] = useState<'checkin' | 'checkout' | 'status'>('checkin');

    const heatmapSeries = useMemo(() => {
        if (!data) return [];

        if (heatmapType === 'status') {
            const maxVal = Math.max(...(data.status_heatmap?.map((h: any) => parseInt(h.count)) || [1]));
            
            return DAYS.slice().reverse().map(day => ({
                name: day,
                data: STATUS_CATEGORIES.map(cat => {
                    const matches = data?.status_heatmap?.filter((h: any) => h.day_name === day && h.status === cat.name);
                    const count = matches ? matches.reduce((acc: number, curr: any) => acc + curr.count, 0) : 0;
                    
                    let step = 0;
                    if (count > 0) {
                        step = count <= Math.floor(maxVal * 0.3) ? 1 : count <= Math.floor(maxVal * 0.7) ? 2 : 3;
                    }

                    return { x: cat.name, y: count > 0 ? (cat.id + step) : 0, realCount: count };
                })
            }));
        }

        const activityMax = Math.max(...[(data.heatmap_checkin?.map((d:any)=>parseInt(d.count))||[0]), (data.heatmap_checkout?.map((d:any)=>parseInt(d.count))||[0])].flat());
        return DAYS.slice().reverse().map(day => ({
            name: day,
            data: HOURS.map(hour => {
                const rawData = heatmapType === 'checkin' ? data?.heatmap_checkin : data?.heatmap_checkout;
                const match = rawData?.find((h: any) => h.day_name === day && parseInt(h.hour) === hour);
                const count = match ? match.count : 0;
                let step = 0;
                if (count > 0) {
                    step = Math.min(5, Math.ceil((count / (activityMax || 1)) * 5));
                }
                return { x: `${hour}:00`, y: step };
            })
        }));
    }, [data, heatmapType]);

    const dynamicColorScale = useMemo(() => {
        if (!data) return [];
        
        if (heatmapType === 'status') {
            return STATUS_CATEGORIES.flatMap(cat => [
                { from: cat.id + 1, to: cat.id + 1, color: cat.shades[0] },
                { from: cat.id + 2, to: cat.id + 2, color: cat.shades[1] },
                { from: cat.id + 3, to: cat.id + 3, color: cat.shades[2] }
            ]);
        }

        return [
            { from: 0, to: 0, color: isDark ? '#1e293b' : '#f8fafc' },
            { from: 1, to: 1, color: '#eff6ff' },
            { from: 2, to: 2, color: '#bfdbfe' },
            { from: 3, to: 3, color: '#60a5fa' },
            { from: 4, to: 4, color: '#3b82f6' },
            { from: 5, to: 1000, color: '#1e40af' }
        ];
    }, [data, heatmapType, isDark]);

    const heatmapChartOptions: any = {
        chart: {
            type: 'heatmap',
            toolbar: { show: false },
            fontFamily: 'Inter, sans-serif',
            background: 'transparent',
            events: {
                dataPointSelection: (event: any, chartContext: any, config: any) => {
                    const { seriesIndex, dataPointIndex } = config;
                    if (heatmapType === 'status') {
                        const statusName = config.w.config.series[seriesIndex].data[dataPointIndex].x;
                        
                        if (statusName === 'Absent') {
                            onInspect('absent');
                            return;
                        }

                        const inStatuses = ['In-on time', 'Early', 'Warning', 'Late'];
                        const outStatuses = ['Out-on time', 'Stay Late', 'Overtime', 'Early Departure'];
                        
                        const params = new URLSearchParams();
                        params.set('start_date', apiFilters.start_date || '');
                        params.set('end_date', apiFilters.end_date || '');
                        
                        if (inStatuses.includes(statusName)) {
                            params.set('in_status', statusName);
                        } else if (outStatuses.includes(statusName)) {
                            params.set('out_status', statusName);
                        }
                        
                        navigate(`/attendance/records?${params.toString()}`);
                    }
                }
            }
        },
        theme: { mode: isDark ? 'dark' : 'light' },
        stroke: {
            show: true,
            width: 1,
            colors: [isDark ? '#020617' : '#fff']
        },
        dataLabels: { enabled: false },
xaxis: {
  type: 'category',
  axisBorder: { show: false },
  axisTicks: { show: false },
  tooltip: { enabled: false },
  crosshairs: { show: false }
},
        plotOptions: {
            heatmap: {
                shadeIntensity: 0.5,
                radius: 4,
                useFillColorAsStroke: false,
                colorScale: {
                    ranges: dynamicColorScale
                }
            }
        },
tooltip: {
  theme: isDark ? 'dark' : 'light',
  y: {
    formatter: (val: number, { seriesIndex, dataPointIndex, w }: any) => {
      if (heatmapType === 'status') {
        const realVal = w.config.series[seriesIndex].data[dataPointIndex].realCount;
        return `${realVal} Times`;
      }
      return `${val} Times`;
    }
  }
},
        legend: { show: false }
    };

    return (
        <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-white/20 overflow-hidden h-full">
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800 pb-4">
                    <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <IconHeartRateMonitor size={20} className="text-primary" />
                            Workforce Health Analysis
                        </CardTitle>
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Dynamics Intensity Analysis</div>
                    </div>
                    <div className="flex shadow-inner bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg border border-white dark:border-slate-800">
                        {['checkin', 'checkout', 'status'].map((type) => (
                            <button 
                                key={type}
                                onClick={() => setHeatmapType(type as any)}
                                className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-md transition-all duration-200 ${
                                    heatmapType === type 
                                        ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                {type === 'status' ? 'Work Health' : type}
                            </button>
                        ))}
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <ReactApexChart 
                        options={heatmapChartOptions} 
                        series={heatmapSeries} 
                        type="heatmap" 
                        height={heatmapType === 'status' ? 380 : 320} 
                    />
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default React.memo(AttendanceWorkHealth);
