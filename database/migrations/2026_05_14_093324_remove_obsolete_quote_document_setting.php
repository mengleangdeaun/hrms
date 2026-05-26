<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\System\DocumentSetting;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DocumentSetting::where('document_type', 'quote')->delete();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No strict need to restore it as 'quote' is obsolete, 
        // but can safely be ignored on rollback.
    }
};
