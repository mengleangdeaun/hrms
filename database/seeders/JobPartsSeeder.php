<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class JobPartsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (!\App\Models\Inventory\Category::where('id', 1)->exists()) {
            \App\Models\Inventory\Category::insert([
                'id' => 1,
                'code' => 'HPF',
                'name' => 'Heat Protection Film',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        if (!\App\Models\Inventory\Category::where('id', 2)->exists()) {
            \App\Models\Inventory\Category::insert([
                'id' => 2,
                'code' => 'PPF',
                'name' => 'Paint Protection Film',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $data = [
            // HPF (Heat Protection Film) - Glass Parts
            [
                'type' => 'HPF',
                'sides' => [
                    'Main' => [
                        'កញ្ចក់មុខ',
                        'កញ្ចក់ក្រោយ',
                        'កញ្ចក់ដំបូល',
                    ],
                    'Right' => [
                        'កញ្ចក់ទ្វារអ្នករួមដំណើរ',
                        'កញ្ចក់ទ្វារក្រោយ (ស្ដាំ)',
                        'កញ្ចក់តូចគ្មានចលនា (ស្ដាំ)',
                    ],
                    'Left' => [
                        'កញ្ចក់ទ្វារអ្នកបើកបរ',
                        'កញ្ចក់ទ្វារក្រោយ (ឆ្វេង)',
                        'កញ្ចក់តូចគ្មានចលនា (ឆ្វេង)',
                    ],
                ]
            ],
            // PPF (Paint Protection Film) - Body Parts
            [
                'type' => 'PPF',
                'sides' => [
                    'Main' => [
                        'ដំបូលម៉ាសុីន',
                        'គូទក្រោយ',
                        'កាងមុខ',
                        'កាងក្រោយ',
                    ],
                    'Right' => [
                        'ថ្ពាល់ស្ដាំ',
                        'ស៊ុមកង់មុខស្ដាំ',
                        'ច្រចៀកក្ដោបស្ដាំ',
                        'ទ្វារមុខស្ដាំ',
                        'ស្មារលើស្ដាំ',
                        'ឈ្នាន់ជើងស្ដាំ',
                        'ទ្វារក្រោយស្ដាំ',
                        'ស៊ុមកង់ក្រោយស្ដាំ',
                        'ត្រគៀកស្ដាំ',
                    ],
                    'Left' => [
                        'ថ្ពាល់ឆ្វេង',
                        'ស៊ុមកង់មុខឆ្វេង',
                        'ច្រចៀកក្ដោបឆ្វេង',
                        'ទ្វារមុខឆ្វេង',
                        'ស្មារលើឆ្វេង',
                        'ឈ្នាន់ជើងឆ្វេង',
                        'ទ្វារក្រោយឆ្វេង',
                        'ស៊ុមកង់ក្រោយឆ្វេង',
                        'ត្រគៀកឆ្វេង',
                        
                    ],
                ]
            ]
        ];

        foreach ($data as $group) {
            foreach ($group['sides'] as $side => $names) {
                foreach ($names as $name) {
                    \App\Models\Workshop\JobPartMaster::updateOrCreate([
                        'name' => $name,
                        'type' => $group['type'],
                        'side' => $side,
                    ], [
                        'category_id' => $group['type'] === 'HPF' ? 1 : ($group['type'] === 'PPF' ? 2 : null),
                        'is_active' => true,
                    ]);
                }
            }
        }
    }
}
