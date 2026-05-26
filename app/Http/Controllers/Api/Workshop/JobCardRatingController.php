<?php

namespace App\Http\Controllers\Api\Workshop;

use App\Http\Controllers\Controller;
use App\Models\Workshop\JobCardRating;
use Illuminate\Http\Request;

class JobCardRatingController extends Controller
{
    /**
     * List job card ratings (Admin)
     */
    public function index(Request $request)
    {
        $query = JobCardRating::whereHas('jobCard')->with([
            'jobCard' => function($q) {
                $q->select('id', 'job_no', 'branch_id');
            },
            'jobCard.branch:id,name',
            'customer:id,name'
        ])->latest();

        // Filter by branch
        if ($request->has('branch_id') && $request->branch_id !== 'all') {
            $query->whereHas('jobCard', function($q) use ($request) {
                $q->where('branch_id', $request->branch_id);
            });
        }

        // Search by Job No or Customer Name
        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('comment', 'like', "%$search%")
                  ->orWhereHas('jobCard', function($jq) use ($search) {
                      $jq->where('job_no', 'like', "%$search%");
                  })
                  ->orWhereHas('customer', function($cq) use ($search) {
                      $cq->where('name', 'like', "%$search%");
                  });
            });
        }

        return response()->json($query->paginate($request->per_page ?? 15));
    }

    public function export(Request $request)
    {
        $query = JobCardRating::whereHas('jobCard')->with([
            'jobCard' => function($q) {
                $q->select('id', 'job_no', 'branch_id');
            },
            'jobCard.branch:id,name',
            'customer:id,name'
        ])->latest();

        if ($request->has('branch_id') && $request->branch_id !== 'all') {
            $query->whereHas('jobCard', function($q) use ($request) {
                $q->where('branch_id', $request->branch_id);
            });
        }

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('comment', 'like', "%$search%")
                  ->orWhereHas('jobCard', function($jq) use ($search) {
                      $jq->where('job_no', 'like', "%$search%");
                  })
                  ->orWhereHas('customer', function($cq) use ($search) {
                      $cq->where('name', 'like', "%$search%");
                  });
            });
        }

        $ratings = $query->get();
        $filename = "job_card_ratings_" . date('Ymd_His') . ".csv";

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$filename",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['ID', 'Job No', 'Customer', 'Branch', 'Service Rating', 'Technical Rating', 'Comment', 'Date'];

        $callback = function() use($ratings, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($ratings as $item) {
                fputcsv($file, [
                    $item->id,
                    $item->jobCard?->job_no,
                    $item->customer?->name,
                    $item->jobCard?->branch?->name,
                    $item->service_rating,
                    $item->technical_rating,
                    $item->comment,
                    $item->created_at
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
