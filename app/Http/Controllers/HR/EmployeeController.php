<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Employee;
use App\Models\HR\EmployeeDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

use App\Http\Resources\HR\EmployeeResource;

class EmployeeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        if ($request->boolean('compact')) {
            return response()->json(
                Employee::select(['id', 'full_name', 'employee_id'])
                    ->where('is_active', 1)
                    ->orderBy('full_name', 'asc')
                    ->get()
                    ->makeHidden(['profile_image_url'])
            );
        }

        $query = Employee::with([
            'branch:id,name',
            'department:id,name',
            'designation:id,name',
            'workingShift:id,name',
            'attendancePolicy:id,name'
        ]);

        if ($request->has('is_technician')) {
            $query->where('is_technician', $request->is_technician);
            if ($request->is_technician == 1) {
                $query->where('is_active', 1);
            }
        }

        $employees = $query->latest()->get();

        return EmployeeResource::collection($employees);
    }

    /**
     * Export employees to CSV
     */
    public function export(Request $request)
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="employees.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($request) {
            $file = fopen('php://output', 'w');
            
            // Add UTF-8 BOM for Excel compatibility
            fputs($file, "\xEF\xBB\xBF");

            $columns = ['Full Name', 'Employee ID', 'Email', 'Phone', 'Gender', 'Branch', 'Department', 'Designation'];
            fputcsv($file, $columns);

            $query = Employee::with(['branch:id,name', 'department:id,name', 'designation:id,name']);
            if ($request->has('is_technician')) {
                $query->where('is_technician', $request->is_technician);
                if ($request->is_technician == 1) {
                    $query->where('is_active', 1);
                }
            }

            $query->chunk(100, function ($employees) use ($file) {
                foreach ($employees as $employee) {
                    fputcsv($file, [
                        $employee->full_name,
                        $employee->employee_id,
                        $employee->email,
                        $employee->phone,
                        $employee->gender,
                        $employee->branch->name ?? '',
                        $employee->department->name ?? '',
                        $employee->designation->name ?? ''
                    ]);
                }
            });

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Import employees from CSV
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:10240',
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');

        $header = fgetcsv($handle);
        // Clean BOM from first header column if present
        $header[0] = preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $header[0]);
        // Simple validation of headers
        if (!$header || count($header) < 2) {
            return response()->json(['message' => 'Invalid CSV format'], 422);
        }

        $headerMap = array_map(function($val) {
            return strtolower(str_replace(' ', '', preg_replace('/[^a-zA-Z]/', '', $val)));
        }, $header);

        $imported = 0;
        $failed = 0;

        while (($row = fgetcsv($handle)) !== false) {
            if (empty(array_filter($row))) continue;

            $rowData = [];
            foreach ($headerMap as $index => $colName) {
                $rowData[$colName] = $row[$index] ?? null;
            }

            if ($this->processEmployeeRow($rowData)) {
                $imported++;
            } else {
                $failed++;
            }
        }

        fclose($handle);

        return response()->json([
            'message' => "Import completed: $imported employees imported" . ($failed > 0 ? ", $failed skipped" : ""),
            'imported' => $imported,
            'failed' => $failed
        ]);
    }

    /**
     * Import a chunk of employee data sent as an array of objects.
     */
    public function importChunk(Request $request)
    {
        $request->validate([
            'rows' => 'required|array',
            'rows.*' => 'required|array',
        ]);

        $rows = $request->rows;
        $imported = 0;
        $failed = 0;

        foreach ($rows as $rowData) {
            // Normalize keys to lowercase no spaces for consistency
            $normalizedRow = [];
            foreach ($rowData as $key => $value) {
                $cleanKey = strtolower(str_replace(' ', '', preg_replace('/[^a-zA-Z]/', '', $key)));
                $normalizedRow[$cleanKey] = $value;
            }

            if ($this->processEmployeeRow($normalizedRow)) {
                $imported++;
            } else {
                $failed++;
            }
        }

        return response()->json([
            'message' => "$imported rows processed in this batch",
            'imported' => $imported,
            'failed' => $failed
        ]);
    }

    /**
     * Core logic to process a single employee row.
     */
    private function processEmployeeRow(array $rowData)
    {
        // Simple validation for required fields
        if (empty($rowData['fullname']) || empty($rowData['employeeid']) || empty($rowData['email'])) {
            return false;
        }

        try {
            // Relationship resolving
            $branchId = null;
            $branchName = 'Default Branch';
            if (!empty($rowData['branch'])) {
                $branchName = trim($rowData['branch']);
                $branch = \App\Models\HR\Branch::firstOrCreate(['name' => $branchName]);
                $branchId = $branch->id;
            }

            $departmentId = null;
            if (!empty($rowData['department'])) {
                $department = \App\Models\HR\Department::firstOrCreate(['name' => trim($rowData['department'])]);
                $departmentId = $department->id;
            }

            $designationId = null;
            if (!empty($rowData['designation'])) {
                $designation = \App\Models\HR\Designation::firstOrCreate(['name' => trim($rowData['designation'])]);
                $designationId = $designation->id;
            }

            // Prepare password logic: BranchName + EmployeeID (trimmed)
            $rawId = trim($rowData['employeeid']);
            $rawPassword = $branchName . $rawId;
            $password = \Illuminate\Support\Facades\Hash::make($rawPassword);

            // Create or update employee
            Employee::updateOrCreate(
                ['employee_id' => $rawId],
                [
                    'full_name' => trim($rowData['fullname']),
                    'email' => trim($rowData['email']),
                    'phone' => trim($rowData['phone'] ?? ''),
                    'gender' => strtolower(trim($rowData['gender'] ?? 'male')),
                    'branch_id' => $branchId,
                    'department_id' => $departmentId,
                    'designation_id' => $designationId,
                    'password' => $password,
                    'is_active' => 1,
                ]
            );

            return true;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Import error for Row ID {$rowData['employeeid']}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name'   => 'required|string|max:255',
            'employee_id' => 'required|string|max:100|unique:employees,employee_id',
            'email'       => 'required|email|unique:employees,email',
            'password'    => 'required|string|min:6',
            'gender'      => 'nullable|in:male,female,other',
            'branch_id'   => 'nullable|exists:branches,id',
            'department_id' => 'nullable|exists:departments,id',
            'designation_id' => 'nullable|exists:designations,id',
            'line_manager_id' => 'nullable|exists:employees,id',
            'working_shift_id' => 'nullable|exists:working_shifts,id',
            'attendance_policy_id' => 'nullable|exists:attendance_policies,id',
            'employment_type' => 'nullable|in:full_time,part_time,contract,intern,freelance',
            'is_active'       => 'nullable|boolean',
            'is_technician'   => 'nullable|boolean',
            'is_qc_person'    => 'nullable|boolean',
            'employee_code'   => 'nullable|string|max:100',
            'phone'           => 'nullable|string|max:50',
            'date_of_birth'   => 'nullable|date',
            'date_of_joining' => 'nullable|date',
            'address_line_1'  => 'nullable|string|max:255',
            'address_line_2'  => 'nullable|string|max:255',
            'city'            => 'nullable|string|max:100',
            'state'           => 'nullable|string|max:100',
            'country'         => 'nullable|string|max:100',
            'postal_code'     => 'nullable|string|max:20',
            'emergency_contact_name'         => 'nullable|string|max:255',
            'emergency_contact_relationship' => 'nullable|string|max:100',
            'emergency_contact_phone'        => 'nullable|string|max:50',
            'bank_name'           => 'nullable|string|max:255',
            'account_holder_name' => 'nullable|string|max:255',
            'account_number'      => 'nullable|string|max:100',
            'tax_payer_id'        => 'nullable|string|max:100',
            'profile_image' => 'nullable', 
            'base_salary' => 'nullable|numeric|min:0',
            'documents'   => 'nullable|array',
            'documents.*.document_type_id' => 'nullable|exists:document_types,id',
            'documents.*.media_url'  => 'nullable|string',
            'documents.*.media_file' => 'nullable|file|max:10240',
            'documents.*.media_name' => 'nullable|string',
        ]);

        $data = $request->except(['profile_image', 'password', 'documents']);
        $data['password'] = Hash::make($request->password);

        // Ensure nullable fields are null if empty strings
        $nullableFields = [
            'branch_id', 'department_id', 'designation_id', 'line_manager_id', 
            'working_shift_id', 'attendance_policy_id', 'date_of_birth', 'date_of_joining',
            'employee_code', 'phone', 'address_line_1', 'address_line_2', 'city', 'state', 
            'country', 'postal_code', 'emergency_contact_name', 'emergency_contact_relationship', 
            'emergency_contact_phone', 'bank_name', 'account_holder_name', 'account_number', 'tax_payer_id'
        ];
        foreach ($nullableFields as $field) {
            if (isset($data[$field]) && $data[$field] === '') {
                $data[$field] = null;
            }
        }

        if ($request->hasFile('profile_image')) {
            $data['profile_image'] = $request->file('profile_image')->store('employees/profile', 'public');
        } elseif ($request->filled('profile_image') && is_string($request->profile_image)) {
            $path = str_replace('/storage/', '', $request->profile_image);
            $data['profile_image'] = $path;
        }

        $this->validateRequiredDocuments($request);

        $employee = Employee::create($data);

        // Handle initial documents if provided
        if ($request->has('documents')) {
            foreach ($request->documents as $index => $docData) {
                $path = null;
                $originalName = $docData['media_name'] ?? 'document';

                if ($request->hasFile("documents.$index.media_file")) {
                    $path = $request->file("documents.$index.media_file")->store('employees/documents', 'public');
                    $originalName = $request->file("documents.$index.media_file")->getClientOriginalName();
                } elseif (!empty($docData['media_url'])) {
                    $path = str_replace('/storage/', '', $docData['media_url']);
                }

                if ($path) {
                    $employee->documents()->create([
                        'document_type_id' => $docData['document_type_id'],
                        'file_path'        => $path,
                        'original_name'    => $originalName,
                    ]);
                }
            }
        }

        return (new EmployeeResource($employee->load(['branch', 'department', 'designation', 'documents.documentType'])))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Employee $employee)
    {
        return new EmployeeResource(
            $employee->load([
                'branch:id,name',
                'department:id,name',
                'designation:id,name',
                'workingShift:id,name',
                'attendancePolicy:id,name',
                'documents.documentType:id,name'
            ])
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Employee $employee)
    {
        $request->validate([
            'full_name'   => 'required|string|max:255',
            'employee_id' => 'required|string|max:100|unique:employees,employee_id,' . $employee->id,
            'email'       => 'required|email|unique:employees,email,' . $employee->id,
            'password'    => 'nullable|string|min:6',
            'gender'      => 'nullable|in:male,female,other',
            'branch_id'   => 'nullable|exists:branches,id',
            'department_id' => 'nullable|exists:departments,id',
            'designation_id' => 'nullable|exists:designations,id',
            'line_manager_id' => 'nullable|exists:employees,id',
            'working_shift_id' => 'nullable|exists:working_shifts,id',
            'attendance_policy_id' => 'nullable|exists:attendance_policies,id',
            'employment_type' => 'nullable|in:full_time,part_time,contract,intern,freelance',
            'is_active'       => 'nullable|boolean',
            'is_technician'   => 'nullable|boolean',
            'is_qc_person'    => 'nullable|boolean',
            'employee_code'   => 'nullable|string|max:100',
            'phone'           => 'nullable|string|max:50',
            'date_of_birth'   => 'nullable|date',
            'date_of_joining' => 'nullable|date',
            'address_line_1'  => 'nullable|string|max:255',
            'address_line_2'  => 'nullable|string|max:255',
            'city'            => 'nullable|string|max:100',
            'state'           => 'nullable|string|max:100',
            'country'         => 'nullable|string|max:100',
            'postal_code'     => 'nullable|string|max:20',
            'emergency_contact_name'         => 'nullable|string|max:255',
            'emergency_contact_relationship' => 'nullable|string|max:100',
            'emergency_contact_phone'        => 'nullable|string|max:50',
            'bank_name'           => 'nullable|string|max:255',
            'account_holder_name' => 'nullable|string|max:255',
            'account_number'      => 'nullable|string|max:100',
            'tax_payer_id'        => 'nullable|string|max:100',
            'profile_image' => 'nullable',
            'base_salary' => 'nullable|numeric|min:0',
            'documents'   => 'nullable|array',
            'documents.*.id' => 'nullable|exists:employee_documents,id',
            'documents.*.document_type_id' => 'nullable|exists:document_types,id',
            'documents.*.media_url'  => 'nullable|string',
            'documents.*.media_file' => 'nullable|file|max:10240',
            'documents.*.media_name' => 'nullable|string',
        ]);

        $data = $request->except(['profile_image', 'password', 'documents']);

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        // Ensure nullable fields are null if empty strings
        $nullableFields = [
            'branch_id', 'department_id', 'designation_id', 'line_manager_id', 
            'working_shift_id', 'attendance_policy_id', 'date_of_birth', 'date_of_joining',
            'employee_code', 'phone', 'address_line_1', 'address_line_2', 'city', 'state', 
            'country', 'postal_code', 'emergency_contact_name', 'emergency_contact_relationship', 
            'emergency_contact_phone', 'bank_name', 'account_holder_name', 'account_number', 'tax_payer_id'
        ];
        foreach ($nullableFields as $field) {
            if (isset($data[$field]) && $data[$field] === '') {
                $data[$field] = null;
            }
        }

        if ($request->hasFile('profile_image')) {
            // Delete the old image
            if ($employee->profile_image) {
                Storage::disk('public')->delete($employee->profile_image);
            }
            $data['profile_image'] = $request->file('profile_image')->store('employees/profile', 'public');
        } elseif ($request->filled('profile_image') && is_string($request->profile_image)) {
            $path = str_replace('/storage/', '', $request->profile_image);
            $data['profile_image'] = $path;
        }

        $this->validateRequiredDocuments($request);

        $employee->update($data);

        // Synchronize documents
        if ($request->has('documents')) {
            $existingDocIds = [];
            
            foreach ($request->documents as $index => $docData) {
                $path = null;
                $originalName = $docData['media_name'] ?? 'document';
                $docId = $docData['id'] ?? null;

                if ($request->hasFile("documents.$index.media_file")) {
                    $path = $request->file("documents.$index.media_file")->store('employees/documents', 'public');
                    $originalName = $request->file("documents.$index.media_file")->getClientOriginalName();
                } elseif (!empty($docData['media_url'])) {
                    $path = str_replace('/storage/', '', $docData['media_url']);
                }

                if ($docId) {
                    // Update existing document
                    $doc = EmployeeDocument::find($docId);
                    if ($doc) {
                        $updateData = [
                            'document_type_id' => $docData['document_type_id'],
                            'original_name'    => $originalName,
                        ];
                        if ($path) {
                            $updateData['file_path'] = $path;
                        }
                        $doc->update($updateData);
                        $existingDocIds[] = $docId;
                    }
                } elseif ($path) {
                    // Create new document
                    $newDoc = $employee->documents()->create([
                        'document_type_id' => $docData['document_type_id'],
                        'file_path'        => $path,
                        'original_name'    => $originalName,
                    ]);
                    $existingDocIds[] = $newDoc->id;
                }
            }

            // Remove documents that were not in the update request
            $employee->documents()->whereNotIn('id', $existingDocIds)->delete();
        }

        return new EmployeeResource($employee->load(['branch', 'department', 'designation', 'documents.documentType']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Employee $employee)
    {
        $employee->delete();
        return response()->json(null, 204);
    }

    /**
     * Upload a document for the given employee.
     */
    public function uploadDocument(Request $request, Employee $employee)
    {
        $request->validate([
            'document_type_id' => 'nullable|exists:document_types,id',
            'file'             => 'nullable|file|max:10240',
            'media_url'        => 'nullable|string',
            'media_name'       => 'nullable|string',
        ]);

        if ($request->filled('media_url')) {
            // Handle Media Library logic
            $path = str_replace('/storage/', '', $request->media_url);
            $originalName = $request->media_name ?? basename($path);
        } elseif ($request->hasFile('file')) {
            // Original raw file logic
            $path = $request->file('file')->store('employees/documents', 'public');
            $originalName = $request->file('file')->getClientOriginalName();
        } else {
            return response()->json(['message' => 'No file or media url provided'], 422);
        }

        $doc = $employee->documents()->create([
            'document_type_id' => $request->document_type_id,
            'file_path'        => $path,
            'original_name'    => $originalName,
        ]);

        return response()->json($doc->load('documentType'), 201);
    }

    /**
     * Delete a specific document.
     */
    public function deleteDocument(Employee $employee, EmployeeDocument $document)
    {
        Storage::disk('public')->delete($document->file_path);
        $document->delete();
        return response()->json(null, 204);
    }

    /**
     * Validate that all required document types are present in the request.
     */
    private function validateRequiredDocuments(Request $request)
    {
        $requiredTypeIds = \App\Models\HR\DocumentType::where('is_required', true)->pluck('id')->toArray();
        $providedDocs = $request->input('documents', []);
        
        foreach ($requiredTypeIds as $typeId) {
            $hasDoc = false;
            foreach ($providedDocs as $index => $doc) {
                if ((int)$doc['document_type_id'] === (int)$typeId) {
                    // Check if either a file was uploaded or a media URL was provided
                    if ($request->hasFile("documents.$index.media_file") || !empty($doc['media_url'])) {
                        $hasDoc = true;
                        break;
                    }
                }
            }
            
            if (!$hasDoc) {
                $typeName = \App\Models\HR\DocumentType::find($typeId)->name ?? $typeId;
                abort(response()->json([
                    'message' => "The document '{$typeName}' is required.",
                    'errors' => [
                        'documents' => ["The document '{$typeName}' is required."]
                    ]
                ], 422));
            }
        }
    }
}
