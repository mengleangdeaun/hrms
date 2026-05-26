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
        Schema::create('sales_invoices', function (Blueprint $table) {
            $table->id();
            $table->ulid('ulid')->unique();
            $table->string('invoice_no')->unique();
            $table->foreignId('sales_order_id')->constrained('sales_orders')->onDelete('cascade');
            $table->foreignId('customer_id')->constrained('customers');
            $table->foreignId('branch_id')->constrained('branches');
            $table->date('invoice_date');
            $table->date('due_date')->nullable();
            
            $table->decimal('subtotal', 15, 2);
            $table->decimal('tax_total', 15, 2)->default(0);
            $table->decimal('discount_total', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2);
            
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('balance_amount', 15, 2)->default(0);
            
            $table->string('status')->default('FINALIZED'); // DRAFT, FINALIZED, CANCELLED
            $table->string('payment_status')->default('UNPAID'); // UNPAID, PARTIAL, PAID
            
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_invoices');
    }
};
