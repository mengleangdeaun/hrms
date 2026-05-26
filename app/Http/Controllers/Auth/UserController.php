<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Auth\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use App\Http\Resources\Auth\UserResource;

class UserController extends Controller
{
    public function index(Request $request)
    {
        if ($request->has('selection')) {
            $users = User::select(['id', 'name', 'is_active'])
                  ->where('is_active', true)
                  ->whereDoesntHave('roles', function ($q) {
                      $q->where('slug', 'super-admin');
                  })
                  ->get();
            return UserResource::collection($users);
        }

        $query = User::with(['roles.permissions', 'branches']);
        return UserResource::collection($query->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', Rules\Password::min(6)],
            'roles' => 'array',
            'branches' => 'array',
            'is_active' => 'boolean',
            'telegram_user_id' => 'nullable|string|unique:users,telegram_user_id',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'is_active' => $request->get('is_active', true),
            'telegram_user_id' => $request->telegram_user_id,
        ]);

        if ($request->has('roles')) {
            $user->roles()->sync($request->roles);
        }

        if ($request->has('branches')) {
            $user->branches()->sync($request->branches);
        }

        return (new UserResource($user->load(['roles', 'branches'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(User $user)
    {
        return new UserResource($user->load(['roles', 'branches']));
    }

    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => ['nullable', Rules\Password::min(6)],
            'roles' => 'array',
            'branches' => 'array',
            'is_active' => 'boolean',
            'telegram_user_id' => 'nullable|string|unique:users,telegram_user_id,' . $user->id,
        ]);

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
            'is_active' => $request->get('is_active', $user->is_active),
            'telegram_user_id' => $request->telegram_user_id,
        ]);

        if ($request->password) {
            $user->update(['password' => Hash::make($request->password)]);
        }

        if ($request->has('roles')) {
            $user->roles()->sync($request->roles);
        }

        if ($request->has('branches')) {
            $user->branches()->sync($request->branches);
        }

        return new UserResource($user->load(['roles', 'branches']));
    }

    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Cannot delete your own account'], 403);
        }
        $user->delete();
        return response()->json(null, 204);
    }
}

