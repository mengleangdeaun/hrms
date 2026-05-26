<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SaleRemarkSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $remarks = [
            [
                'name' => 'Sale',
                'description' => 'Normal customer sales transaction',
                'color_code' => '#3B82F6',
            ],
            [
                'name' => 'Claim',
                'description' => 'Warranty or insurance claim processing',
                'color_code' => '#EF4444',
            ],
            [
                'name' => 'Referral',
                'description' => 'Sales referred by partners or agents',
                'color_code' => '#8B5CF6',
            ],
            [
                'name' => 'Warranty',
                'description' => 'Standard warranty service/maintenance',
                'color_code' => '#10B981',
            ],
        ];

        foreach ($remarks as $remark) {
            \App\Models\Sales\SaleRemark::updateOrCreate(
                ['name' => $remark['name']],
                [
                    'description' => $remark['description'],
                    'color_code' => $remark['color_code'],
                    'is_active' => true,
                ]
            );
        }
    }
}
