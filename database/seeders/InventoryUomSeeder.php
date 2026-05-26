<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class InventoryUomSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $uoms = [
            ['code' => 'PCS', 'name' => 'Piece'],
            ['code' => 'M', 'name' => 'Meter'],
            ['code' => 'M2', 'name' => 'Square Meter'],
            ['code' => 'ROLL', 'name' => 'Roll'],
            ['code' => 'SET', 'name' => 'Set'],
            ['code' => 'BTL', 'name' => 'Bottle'],
            ['code' => 'BOX', 'name' => 'Box'],
        ];

        foreach ($uoms as $uom) {
            \App\Models\Inventory\Uom::updateOrCreate(
                ['code' => $uom['code']],
                ['name' => $uom['name'], 'is_active' => true]
            );
        }
    }
}
