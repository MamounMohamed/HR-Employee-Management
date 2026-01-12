<?php

namespace App\Http\Controllers\Api;

use App\DTOs\EmployeeDTO;
use App\DTOs\EmployeeListDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\EmployeeListRequest;
use App\Http\Requests\StoreEmployeeRequest;
use App\Http\Requests\UpdateEmployeeRequest;
use App\Http\Resources\EmployeeCollection;
use App\Http\Resources\EmployeeResource;
use App\Services\EmployeeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class EmployeeController extends Controller
{
    public function __construct(
        private readonly EmployeeService $service
    ) {
    }

    /**
     * Display a listing of employees
     * 
     * @group Employee Management
     * @authenticated
     */
    public function index(EmployeeListRequest $request): EmployeeCollection
    {
        $dto = EmployeeListDTO::fromRequest($request->validated());
        $employees = $this->service->list($dto);

        return new EmployeeCollection($employees);
    }

    /**
     * Store a newly created employee
     * 
     * @group Employee Management
     * @authenticated
     */
    public function store(StoreEmployeeRequest $request): JsonResponse
    {
        $dto = EmployeeDTO::fromRequest($request->validated());
        $employee = $this->service->create($dto);

        return (new EmployeeResource($employee))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Display the specified employee
     * 
     * @group Employee Management
     * @authenticated
     */
    public function show(int $id): JsonResponse
    {
        $employee = $this->service->findById($id);

        if (!$employee) {
            return response()->json([
                'message' => 'Employee not found'
            ], Response::HTTP_NOT_FOUND);
        }

        return (new EmployeeResource($employee))->response();
    }

    /**
     * Update the specified employee
     * 
     * @group Employee Management
     * @authenticated
     */
    public function update(UpdateEmployeeRequest $request, int $id): JsonResponse
    {
        $dto = EmployeeDTO::fromRequest($request->validated());
        $employee = $this->service->update($dto, $id);

        if (!$employee) {
            return response()->json([
                'message' => 'Employee not found or update failed'
            ], Response::HTTP_NOT_FOUND);
        }

        return (new EmployeeResource($employee))->response();
    }

    /**
     * Deactivate (soft delete) the specified employee
     * 
     * @group Employee Management
     * @authenticated
     */
    public function deactivate(int $id, \App\Http\Requests\DeactivateEmployeeRequest $request): JsonResponse
    {
        $success = $this->service->deactivate($id);

        if (!$success) {
            return response()->json([
                'message' => 'Employee not found or deactivation failed'
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
