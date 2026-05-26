<?php

namespace Database\Seeders;

use App\Models\Vehicle\VehicleBrand;
use App\Models\Vehicle\VehicleModel;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CarBrandModelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $data = [
            ["brand" => "Aion", "models" => [
                ["name" => "Aion Y Plus", "segment" => "MPV"],
                ["name" => "Aion ES", "segment" => "Sedan"],
                ["name" => "Aion V", "segment" => "SUV"],
                ["name" => "Hyper HT", "segment" => "SUV"]
            ]],
            ["brand" => "Aston Martin", "models" => [
                ["name" => "DBX 707", "segment" => "SUV"],
                ["name" => "DB12", "segment" => "Coupe"],
                ["name" => "Vantage", "segment" => "Coupe"]
            ]],
            ["brand" => "Audi", "models" => [
                ["name" => "Q5", "segment" => "SUV"],
                ["name" => "Q7", "segment" => "SUV"],
                ["name" => "Q8", "segment" => "SUV"],
                ["name" => "A8 L", "segment" => "Sedan"],
                ["name" => "e-tron GT", "segment" => "Sedan"]
            ]],
            ["brand" => "Avatr", "models" => [
                ["name" => "Avatr 06", "segment" => "Sedan"],
                ["name" => "Avatr 07", "segment" => "SUV"],
                ["name" => "Avatr 11", "segment" => "SUV"],
                ["name" => "Avatr 12", "segment" => "Sedan"]
            ]],
            ["brand" => "Baojun", "models" => [
                ["name" => "Yep", "segment" => "SUV"],
                ["name" => "Yep Plus", "segment" => "SUV"],
                ["name" => "530", "segment" => "SUV"]
            ]],
            ["brand" => "Bentley", "models" => [
                ["name" => "Bentayga", "segment" => "SUV"],
                ["name" => "Flying Spur", "segment" => "Sedan"],
                ["name" => "Continental GT", "segment" => "Coupe"]
            ]],
            ["brand" => "BMW", "models" => [
                ["name" => "X3", "segment" => "SUV"],
                ["name" => "X5 xDrive40i", "segment" => "SUV"],
                ["name" => "X6", "segment" => "SUV"],
                ["name" => "X7 xDrive40i", "segment" => "SUV"],
                ["name" => "XM", "segment" => "SUV"],
                ["name" => "735i", "segment" => "Sedan"],
                ["name" => "740i", "segment" => "Sedan"],
                ["name" => "i7", "segment" => "Sedan"],
                ["name" => "iX", "segment" => "SUV"],
                ["name" => "5 Series", "segment" => "Sedan"]
            ]],
            ["brand" => "BYD", "models" => [
                ["name" => "Atto 3", "segment" => "SUV"],
                ["name" => "Dolphin", "segment" => "Hatchback"],
                ["name" => "Seal", "segment" => "Sedan"],
                ["name" => "Sealion 7", "segment" => "SUV"],
                ["name" => "Han", "segment" => "Sedan"],
                ["name" => "Tang", "segment" => "SUV"],
                ["name" => "Song Plus", "segment" => "SUV"],
                ["name" => "Leopard 5", "segment" => "SUV"],
                ["name" => "Leopard 8", "segment" => "SUV"],
                ["name" => "Leopard 3", "segment" => "SUV"],
                ["name" => "Shark 6", "segment" => "Pickup"],
                ["name" => "Yangwang U8", "segment" => "SUV"]
            ]],
            ["brand" => "Cadillac", "models" => [
                ["name" => "Escalade Sport Platinum", "segment" => "SUV"],
                ["name" => "Escalade-V", "segment" => "SUV"],
                ["name" => "Escalade ESV", "segment" => "SUV"],
                ["name" => "Escalade IQ", "segment" => "SUV"]
            ]],
            ["brand" => "Changan", "models" => [
                ["name" => "CS75 Plus", "segment" => "SUV"],
                ["name" => "Uni-K", "segment" => "SUV"],
                ["name" => "Uni-V", "segment" => "Sedan"],
                ["name" => "Hunter", "segment" => "Pickup"]
            ]],
            ["brand" => "Chery", "models" => [
                ["name" => "Tiggo 8 Pro", "segment" => "SUV"],
                ["name" => "Tiggo 7 Pro", "segment" => "SUV"],
                ["name" => "Omoda 5", "segment" => "SUV"]
            ]],
            ["brand" => "Chevrolet", "models" => [
                ["name" => "Tahoe", "segment" => "SUV"],
                ["name" => "Suburban", "segment" => "SUV"],
                ["name" => "Silverado", "segment" => "Pickup"],
                ["name" => "Colorado", "segment" => "Pickup"],
                ["name" => "Traverse", "segment" => "SUV"]
            ]],
            ["brand" => "Denza", "models" => [
                ["name" => "D9", "segment" => "MPV"],
                ["name" => "N7", "segment" => "SUV"],
                ["name" => "N8", "segment" => "SUV"],
                ["name" => "Z9 GT", "segment" => "Wagon"]
            ]],
            ["brand" => "Ferrari", "models" => [
                ["name" => "Purosangue", "segment" => "SUV"],
                ["name" => "296 GTB", "segment" => "Coupe"],
                ["name" => "SF90 Stradale", "segment" => "Coupe"],
                ["name" => "Roma", "segment" => "Coupe"]
            ]],
            ["brand" => "Ford", "models" => [
                ["name" => "Ranger", "segment" => "Pickup"],
                ["name" => "Everest", "segment" => "SUV"],
                ["name" => "Ranger Raptor", "segment" => "Pickup"],
                ["name" => "Territory", "segment" => "SUV"],
                ["name" => "F-150", "segment" => "Pickup"]
            ]],
            ["brand" => "GAC", "models" => [
                ["name" => "GS8", "segment" => "SUV"],
                ["name" => "M8", "segment" => "MPV"],
                ["name" => "GS4", "segment" => "SUV"],
                ["name" => "Emkoo", "segment" => "SUV"]
            ]],
            ["brand" => "Geely", "models" => [
                ["name" => "Coolray", "segment" => "SUV"],
                ["name" => "Okavango", "segment" => "SUV"],
                ["name" => "Monjaro", "segment" => "SUV"],
                ["name" => "Starray", "segment" => "SUV"]
            ]],
            ["brand" => "Genesis", "models" => [
                ["name" => "GV70", "segment" => "SUV"],
                ["name" => "GV80", "segment" => "SUV"],
                ["name" => "G80", "segment" => "Sedan"]
            ]],
            ["brand" => "GWM", "models" => [
                ["name" => "Haval H6", "segment" => "SUV"],
                ["name" => "Tank 300", "segment" => "SUV"],
                ["name" => "Ora Good Cat", "segment" => "Hatchback"]
            ]],
            ["brand" => "Honda", "models" => [
                ["name" => "City", "segment" => "Sedan"],
                ["name" => "Civic", "segment" => "Sedan"],
                ["name" => "Accord", "segment" => "Sedan"],
                ["name" => "CR-V", "segment" => "SUV"],
                ["name" => "HR-V", "segment" => "SUV"],
                ["name" => "BR-V", "segment" => "SUV"]
            ]],
            ["brand" => "Hyundai", "models" => [
                ["name" => "Creta", "segment" => "SUV"],
                ["name" => "Santa Fe", "segment" => "SUV"],
                ["name" => "Palisade", "segment" => "SUV"],
                ["name" => "Staria", "segment" => "MPV"],
                ["name" => "Custin", "segment" => "MPV"],
                ["name" => "Ioniq 5", "segment" => "SUV"]
            ]],
            ["brand" => "Infiniti", "models" => [
                ["name" => "QX50", "segment" => "SUV"],
                ["name" => "QX60", "segment" => "SUV"],
                ["name" => "QX80", "segment" => "SUV"]
            ]],
            ["brand" => "Isuzu", "models" => [
                ["name" => "D-Max", "segment" => "Pickup"],
                ["name" => "MU-X", "segment" => "SUV"]
            ]],
            ["brand" => "Jeep", "models" => [
                ["name" => "Wrangler Rubicon", "segment" => "SUV"],
                ["name" => "Grand Cherokee", "segment" => "SUV"],
                ["name" => "Gladiator", "segment" => "Pickup"]
            ]],
            ["brand" => "Jetour", "models" => [
                ["name" => "Dashing", "segment" => "SUV"],
                ["name" => "X70 Plus", "segment" => "SUV"],
                ["name" => "T2 (Traveler)", "segment" => "SUV"]
            ]],
            ["brand" => "KIA", "models" => [
                ["name" => "Sonet", "segment" => "SUV"],
                ["name" => "Seltos", "segment" => "SUV"],
                ["name" => "Sportage", "segment" => "SUV"],
                ["name" => "Carnival", "segment" => "MPV"],
                ["name" => "EV6", "segment" => "SUV"],
                ["name" => "EV9", "segment" => "SUV"]
            ]],
            ["brand" => "Lamborghini", "models" => [
                ["name" => "Urus S", "segment" => "SUV"],
                ["name" => "Urus Performante", "segment" => "SUV"],
                ["name" => "Revuelto", "segment" => "Coupe"],
                ["name" => "Huracán Sterrato", "segment" => "Coupe"]
            ]],
            ["brand" => "Land Rover", "models" => [
                ["name" => "Range Rover Autobiography", "segment" => "SUV"],
                ["name" => "Range Rover SV", "segment" => "SUV"],
                ["name" => "Range Rover Sport", "segment" => "SUV"],
                ["name" => "Defender 110", "segment" => "SUV"],
                ["name" => "Defender 130", "segment" => "SUV"]
            ]],
            ["brand" => "Lexus", "models" => [
                ["name" => "LX 570", "segment" => "SUV"],
                ["name" => "LX 600", "segment" => "SUV"],
                ["name" => "LX 700h", "segment" => "SUV"],
                ["name" => "GX 550", "segment" => "SUV"],
                ["name" => "RX 350", "segment" => "SUV"],
                ["name" => "RX 550h", "segment" => "SUV"],
                ["name" => "NX Series", "segment" => "SUV"],
                ["name" => "ES 300h", "segment" => "Sedan"],
                ["name" => "UX 250h", "segment" => "SUV"],
                ["name" => "LM 500", "segment" => "MPV"]
            ]],
            ["brand" => "Li Auto", "models" => [
                ["name" => "L7", "segment" => "SUV"],
                ["name" => "L8", "segment" => "SUV"],
                ["name" => "L9", "segment" => "SUV"]
            ]],
            ["brand" => "Lincoln", "models" => [
                ["name" => "Navigator", "segment" => "SUV"],
                ["name" => "Aviator", "segment" => "SUV"],
                ["name" => "Nautilus", "segment" => "SUV"]
            ]],
            ["brand" => "Mazda", "models" => [
                ["name" => "Mazda 3", "segment" => "Sedan"],
                ["name" => "CX-30", "segment" => "SUV"],
                ["name" => "CX-5", "segment" => "SUV"],
                ["name" => "CX-8", "segment" => "SUV"],
                ["name" => "BT-50", "segment" => "Pickup"],
                ["name" => "EZ-60", "segment" => "SUV"]
            ]],
            ["brand" => "Mercedes-Benz", "models" => [
                ["name" => "C-Class", "segment" => "Sedan"],
                ["name" => "E-Class", "segment" => "Sedan"],
                ["name" => "S450", "segment" => "Sedan"],
                ["name" => "S500", "segment" => "Sedan"],
                ["name" => "G63 AMG", "segment" => "SUV"],
                ["name" => "GLS-Class", "segment" => "SUV"],
                ["name" => "Maybach GLS 600", "segment" => "SUV"],
                ["name" => "GLE 300d", "segment" => "SUV"],
                ["name" => "GLE 450", "segment" => "SUV"],
                ["name" => "GLE 450d", "segment" => "SUV"],
                ["name" => "V-Class", "segment" => "MPV"],
                ["name" => "EQE", "segment" => "Sedan"],
                ["name" => "EQS", "segment" => "Sedan"]
            ]],
            ["brand" => "MG", "models" => [
                ["name" => "ZS", "segment" => "SUV"],
                ["name" => "HS", "segment" => "SUV"],
                ["name" => "MG5", "segment" => "Sedan"],
                ["name" => "MG4 EV", "segment" => "Hatchback"],
                ["name" => "Marvel R", "segment" => "SUV"],
                ["name" => "Cyberster", "segment" => "Convertible"]
            ]],
            ["brand" => "Mitsubishi", "models" => [
                ["name" => "Xpander", "segment" => "MPV"],
                ["name" => "Xforce", "segment" => "SUV"],
                ["name" => "Triton", "segment" => "Pickup"],
                ["name" => "Pajero Sport", "segment" => "SUV"],
                ["name" => "Outlander", "segment" => "SUV"]
            ]],
            ["brand" => "Nio", "models" => [
                ["name" => "ES6", "segment" => "SUV"],
                ["name" => "ET5", "segment" => "Sedan"],
                ["name" => "ET7", "segment" => "Sedan"]
            ]],
            ["brand" => "Nissan", "models" => [
                ["name" => "Almera", "segment" => "Sedan"],
                ["name" => "Kicks e-Power", "segment" => "SUV"],
                ["name" => "X-Trail", "segment" => "SUV"],
                ["name" => "Terra", "segment" => "SUV"],
                ["name" => "Navara", "segment" => "Pickup"]
            ]],
            ["brand" => "Peugeot", "models" => [
                ["name" => "2008", "segment" => "SUV"],
                ["name" => "3008", "segment" => "SUV"],
                ["name" => "5008", "segment" => "SUV"],
                ["name" => "408", "segment" => "Sedan"]
            ]],
            ["brand" => "Porsche", "models" => [
                ["name" => "Cayenne Coupé", "segment" => "SUV"],
                ["name" => "Panamera", "segment" => "Sedan"],
                ["name" => "911 Carrera", "segment" => "Coupe"],
                ["name" => "Taycan", "segment" => "Sedan"]
            ]],
            ["brand" => "Ram", "models" => [
                ["name" => "1500 TRX", "segment" => "Pickup"],
                ["name" => "1500 Limited", "segment" => "Pickup"],
                ["name" => "2500 Heavy Duty", "segment" => "Pickup"]
            ]],
            ["brand" => "Subaru", "models" => [
                ["name" => "Forester", "segment" => "SUV"],
                ["name" => "Crosstrek", "segment" => "SUV"],
                ["name" => "Outback", "segment" => "Wagon"]
            ]],
            ["brand" => "Suzuki", "models" => [
                ["name" => "Swift", "segment" => "Hatchback"],
                ["name" => "Ciaz", "segment" => "Sedan"],
                ["name" => "Ertiga", "segment" => "MPV"],
                ["name" => "XL7", "segment" => "SUV"]
            ]],
            ["brand" => "Tesla", "models" => [
                ["name" => "Model 3", "segment" => "Sedan"],
                ["name" => "Model Y", "segment" => "SUV"],
                ["name" => "Model S", "segment" => "Sedan"],
                ["name" => "Model X", "segment" => "SUV"]
            ]],
            ["brand" => "Toyota", "models" => [
                ["name" => "Corolla Cross", "segment" => "SUV"],
                ["name" => "Corolla Altis", "segment" => "Sedan"],
                ["name" => "Camry", "segment" => "Sedan"],
                ["name" => "Prius", "segment" => "Sedan"],
                ["name" => "Raize", "segment" => "SUV"],
                ["name" => "Fortuner", "segment" => "SUV"],
                ["name" => "Hilux Revo / Rally", "segment" => "Pickup"],
                ["name" => "Land Cruiser 300", "segment" => "SUV"],
                ["name" => "Alphard", "segment" => "MPV"],
                ["name" => "Veloz", "segment" => "MPV"],
                ["name" => "Yaris Cross", "segment" => "SUV"]
            ]],
            ["brand" => "Volkswagen", "models" => [
                ["name" => "Tiguan", "segment" => "SUV"],
                ["name" => "Touareg", "segment" => "SUV"],
                ["name" => "Passat", "segment" => "Sedan"]
            ]],
            ["brand" => "Volvo", "models" => [
                ["name" => "XC60", "segment" => "SUV"],
                ["name" => "XC90", "segment" => "SUV"],
                ["name" => "C40 Recharge", "segment" => "SUV"]
            ]],
            ["brand" => "Xiaomi", "models" => [
                ["name" => "SU7", "segment" => "Sedan"],
                ["name" => "YU7", "segment" => "SUV"]
            ]],
            ["brand" => "Xpeng", "models" => [
                ["name" => "G6", "segment" => "SUV"],
                ["name" => "G9", "segment" => "SUV"],
                ["name" => "P7i", "segment" => "Sedan"]
            ]],
            ["brand" => "Zeekr", "models" => [
                ["name" => "Zeekr 001", "segment" => "Wagon"],
                ["name" => "Zeekr X", "segment" => "SUV"]
            ]]
        ];

        // Specific mappings for non-standard logo names
        $logoMappings = [
            'Land Rover' => 'Landrover.svg',
            'Mercedes-Benz' => 'Mercedesbenz.svg',
            'Aston Martin' => 'Astonmartin.svg',
            'Li Auto' => 'Liauto.svg',
        ];

        foreach ($data as $item) {
            $brandName = $item['brand'];
            
            // Determine logo filename
            if (isset($logoMappings[$brandName])) {
                $logoFile = $logoMappings[$brandName];
            } else {
                // Default: Remove spaces/hyphens and capitalize first letter
                $normalized = str_replace([' ', '-'], '', $brandName);
                $logoFile = ucfirst($normalized) . '.svg';
            }

            // Check if logo exists in resources (Optional, but helps with placeholder logic)
            // For now, we'll just set the path as assets/car_brand_logo/Filename.svg
            // The frontend will handle the placeholder if the file is missing.
            $imagePath = 'assets/car_brand_logo/' . $logoFile;

            // Create or update brand
            $brand = VehicleBrand::updateOrCreate(
                ['name' => $brandName],
                [
                    'image' => $imagePath,
                    'is_active' => true
                ]
            );

            // Seed models
            foreach ($item['models'] as $m) {
                VehicleModel::updateOrCreate(
                    [
                        'brand_id' => $brand->id,
                        'name' => $m['name']
                    ],
                    [
                        'segment' => $m['segment'],
                        'is_active' => true
                    ]
                );
            }
        }
    }
}
