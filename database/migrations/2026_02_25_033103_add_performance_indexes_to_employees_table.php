<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {

            $indexes = collect(DB::select("SHOW INDEX FROM employees"))
                ->pluck('Key_name')
                ->toArray();

            if (!in_array('employees_branch_id_index', $indexes)) {
                $table->index('branch_id');
            }

            if (!in_array('employees_department_id_index', $indexes)) {
                $table->index('department_id');
            }

            if (!in_array('employees_designation_id_index', $indexes)) {
                $table->index('designation_id');
            }

            if (!in_array('employees_status_index', $indexes)) {
                $table->index('status');
            }

            if (!in_array('employees_full_name_index', $indexes)) {
                $table->index('full_name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropIndex(['branch_id']);
            $table->dropIndex(['department_id']);
            $table->dropIndex(['designation_id']);
            $table->dropIndex(['status']);
            $table->dropIndex(['full_name']);
        });
    }
};
