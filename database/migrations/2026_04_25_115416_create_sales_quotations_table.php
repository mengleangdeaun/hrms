<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sales_quotations', function (Blueprint $table) {
            $table->id();
            $table->ulid('ulid')->unique();
            $table->string('quotation_no')->unique();
            $table->foreignId('customer_id')->constrained('customers');
            $table->foreignId('branch_id')->constrained('branches');
            $table->foreignId('vehicle_id')->nullable()->constrained('customer_vehicles');
            $table->date('quotation_date');
            $table->date('expiry_date')->nullable();
            
            $table->decimal('subtotal', 15, 2);
            $table->decimal('tax_total', 15, 2)->default(0);
            $table->decimal('discount_total', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2);
            
            $table->decimal('exchange_rate', 15, 2)->default(4100);
            
            $table->string('status')->default('DRAFT'); // DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED, CONVERTED
            
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_quotations');
    }
};
