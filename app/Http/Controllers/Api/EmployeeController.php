<?php

namespace App\Http\Controllers\Api;

use App\DTOs\EmployeeDTO;
use App\DTOs\EmployeeListDTO;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Http\Requests\EmployeeListRequest;
use App\Http\Requests\StoreEmployeeRequest;
use App\Http\Requests\UpdateEmployeeRequest;
use App\Http\Resources\EmployeeCollection;
use App\Http\Resources\EmployeeResource;
use App\Services\EmployeeService;
use App\Services\ResponseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class EmployeeController extends Controller
{
    public function __construct(
        private readonly EmployeeService $service,
        private readonly ResponseService $response
    ) {
    }

    /**
     * Display a listing of employees
     * 
     * @group Employee Management
     * @authenticated
     */
    public function index(EmployeeListRequest $request): JsonResponse
    {
        $dto = EmployeeListDTO::fromRequest($request->validated());
        $employees = $this->service->list($dto);

        return $this->response->success(new EmployeeCollection($employees));
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

        return $this->response->created(new EmployeeResource($employee));
    }

    /**
     * Display the specified employee
     * 
     * @group Employee Management
     * @authenticated
     */
    public function show(User $employee): JsonResponse
    {
        return $this->response->success(new EmployeeResource($employee));
    }

    /**
     * Update the specified employee
     * 
     * @group Employee Management
     * @authenticated
     */
    public function update(UpdateEmployeeRequest $request, User $employee): JsonResponse
    {
        $dto = EmployeeDTO::fromRequest($request->validated());
        $updatedEmployee = $this->service->update($dto, $employee->id);

        if (!$updatedEmployee) {
            return $this->response->notFound('Update failed');
        }

        return $this->response->success(new EmployeeResource($updatedEmployee));
    }

    /**
     * Deactivate (soft delete) the specified employee
     * 
     * @group Employee Management
     * @authenticated
     */
    public function deactivate(User $employee, \App\Http\Requests\DeactivateEmployeeRequest $request): JsonResponse
    {
        $success = $this->service->deactivate($employee->id);

        if (!$success) {
            return $this->response->notFound('Deactivation failed');
        }

        return $this->response->noContent();
    }

    /**
     * Reactivate (restore) the specified employee
     * 
     * @group Employee Management
     * @authenticated
     */
    public function reactivate(User $employee): JsonResponse
    {
        $success = $this->service->reactivate($employee->id);

        if (!$success) {
            return $this->response->notFound('Reactivation failed Employee not found');
        }

        return $this->response->success(new EmployeeResource($employee->fresh()));
    }
}
