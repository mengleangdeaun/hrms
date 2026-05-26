<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Services\TelegramService;

// Setup mock objects with new criteria
$job = new \App\Models\Workshop\JobCard();
$job->job_no = 'JOB-TEST-001';
$job->status = 'In Progress';

// 1. Vehicle with VIN fallback
$vehicle = new \App\Models\CRM\CustomerVehicle();
$vehicle->plate_number = null;
$vehicle->vin_last_4 = '5678';
$vehicle->setRelation('model', (object)['name' => 'Land Cruiser']);
$job->setRelation('vehicle', $vehicle);

// 2. Lead Tech
$job->setRelation('leadTechnician', (object)['full_name' => 'John Wick']);

// 3. Items with progress
$item1 = new \App\Models\Workshop\JobCardItem();
$item1->setRelation('part', (object)['name' => 'Front Film']);
$item1->completion_percentage = 100;

$item2 = new \App\Models\Workshop\JobCardItem();
$item2->setRelation('service', (object)['name' => 'Body Coating']);
$item2->completion_percentage = 40;

$job->setRelation('items', collect([$item1, $item2]));

$service = app(TelegramService::class);
$reflection = new ReflectionClass($service);

echo "=== CUSTOMER FORMAT ===\n";
$customerMethod = $reflection->getMethod('formatCustomerJobCard');
$customerMethod->setAccessible(true);
echo $customerMethod->invoke($service, $job, '🔵 បច្ចុប្បន្នភាពពីរថយន្តរបស់លោកអ្នក');

echo "\n\n=== INTERNAL TEAM FORMAT ===\n";
$teamMethod = $reflection->getMethod('formatJobCard');
$teamMethod->setAccessible(true);
echo $teamMethod->invoke($service, $job, '🛠️ JOB STATUS UPDATE');
