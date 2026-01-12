<?php

namespace App\Http\Controllers\Api;

use App\Enums\EmployeeRoleEnum;
use App\Http\Controllers\Controller;
use App\Http\Resources\EmployeeResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\User;
use App\Enums\EmployeeStatusEnum;
class AuthController extends Controller
{
    /**
     * Handle login request
     * 
     * @group Authentication
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Check if user is active
        if ($user->status->value !== EmployeeStatusEnum::ACTIVE->value) {
            throw ValidationException::withMessages([
                'email' => ['Your account has been deactivated. Please contact HR.'],
            ]);
        }

        // Create token
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => new EmployeeResource($user),
            'token' => $token,
            'role' => $user->role,
        ]);
    }

    /**
     * Handle logout request
     * 
     * @group Authentication
     * @authenticated
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Get authenticated user
     * 
     * @group Authentication
     * @authenticated
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => new EmployeeResource($request->user()),
        ]);
    }
}
