import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import laravel from "laravel-vite-plugin";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [
        tailwindcss(),
        laravel(["resources/js/src/main.tsx"]), 
        react(),
        VitePWA({
            strategies: 'injectManifest',
            srcDir: 'resources/js',
            filename: 'sw.js',
            outDir: 'public',
            injectManifest: {
                globDirectory: 'public',
                globPatterns: ['build/assets/**/*.{js,css,woff2,png,svg}'],
                maximumFileSizeToCacheInBytes: 5000000,
                manifestTransforms: [
                    (manifestEntries) => {
                        const filtered = manifestEntries.filter(entry => {
                            // 1. Exclude any chunk or asset containing 'admin-' in its filename
                            if (entry.url.includes('admin-')) {
                                return false;
                            }
                            
                            // 2. Exclude large image assets (SVGs, PNGs, JPGs > 100KB)
                            const isImage = /\.(svg|png|jpe?g|gif|webp)$/i.test(entry.url);
                            if (isImage && entry.size > 100 * 1024) {
                                return false;
                            }
                            
                            return true;
                        });
                        return { manifest: filtered };
                    }
                ]
            },
            manifest: false,
            devOptions: {
                enabled: true,
                type: 'module',
            }
        })
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./resources/js/src"),
        },
    },
    build: {
        rollupOptions: {
            output: {
                chunkFileNames: (chunkInfo) => {
                    if (chunkInfo.facadeModuleId) {
                        const id = chunkInfo.facadeModuleId.replace(/\\/g, '/');
                        
                        // Define folders that are exclusively admin/ERP side
                        const adminPatterns = [
                            '/pages/AccessControl/',
                            '/pages/Apps/',
                            '/pages/Attendance/', // except attendance employee PWA login
                            '/pages/CRM/',
                            '/pages/Customers/',
                            '/pages/Dashboard/', // except employee dashboard
                            '/pages/Finance/',
                            '/pages/HR/',
                            '/pages/Inventory/',
                            '/pages/Public/',
                            '/pages/Report/',
                            '/pages/Sales/',
                            '/pages/Services/',
                            '/pages/Settings/', // except employee settings
                            '/pages/Support/',
                            '/pages/TemplateBuilder/',
                            '/pages/Tma/'
                        ];
                        
                        const isEmployee = id.includes('/pages/EmployeeApp/') || id.includes('/pages/Attendance/EmployeeApp/');
                        const isAdmin = adminPatterns.some(pattern => id.includes(pattern)) && !isEmployee;
                        
                        if (isAdmin) {
                            return 'assets/admin-[name]-[hash].js';
                        }
                    }
                    return 'assets/[name]-[hash].js';
                },
                manualChunks: (id) => {
                    if (id.includes('node_modules')) {
                        // Check for admin-only heavy libraries and name them with admin-vendor prefix
                        if (id.includes('three') || id.includes('@react-three')) {
                            return 'admin-vendor-three';
                        }
                        if (id.includes('apexcharts') || id.includes('react-apexcharts')) {
                            return 'admin-vendor-apexcharts';
                        }
                        if (id.includes('jspdf')) {
                            return 'admin-vendor-jspdf';
                        }
                        if (id.includes('quill') || id.includes('react-quill')) {
                            return 'admin-vendor-quill';
                        }
                        if (id.includes('@dnd-kit')) {
                            return 'admin-vendor-dnd-kit';
                        }
                        if (id.includes('qr-code-styling')) {
                            return 'admin-vendor-qr-code-styling';
                        }
                    }
                }
            }
        }
    }
});
