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
use App\Services\ResponseService;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    public function __construct(
        private readonly ResponseService $response
    ) {}

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
            ])->status(Response::HTTP_UNAUTHORIZED);
        }

        // Check if user is active
        if ($user->status->value !== EmployeeStatusEnum::ACTIVE->value) {
            throw ValidationException::withMessages([
                'email' => ['Your account has been deactivated. Please contact HR.'],
            ])->status(Response::HTTP_FORBIDDEN);
        }
        // Create token
        $token = $user->createToken('auth-token')->plainTextToken;

        // Uses specialized structure
        return $this->response->json([
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

        return $this->response->success(null, 'Logged out successfully');
    }

    /**
     * Get authenticated user
     * 
     * @group Authentication
     * @authenticated
     */
    public function me(Request $request): JsonResponse
    {
        return $this->response->json([
            'user' => new EmployeeResource($request->user()),
        ]);
    }
}
