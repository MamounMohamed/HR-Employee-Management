<?php

namespace App\Services;

use App\DTOs\EmployeeDTO;
use App\DTOs\EmployeeListDTO;
use App\Enums\EmployeeStatusEnum;
use App\Models\User;
use App\Repositories\EmployeeRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;

class EmployeeService
{
    public function __construct(
        private readonly EmployeeRepository $repository
    ) {
    }

    /**
     * Create a new employee
     */
    public function create(EmployeeDTO $dto): User
    {
        $data = $dto->toArray();

        // Hash password if provided
        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        // Ensure status is ACTIVE for new employees
        $data['status'] = EmployeeStatusEnum::ACTIVE->value;

        return $this->repository->create($data);
    }

    /**
     * Update an existing employee
     */
    public function update(EmployeeDTO $dto, int $employeeId): ?User
    {
        $data = $dto->toUpdateArray();

        // Hash password if provided
        if (isset($data['password']) && !empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            // Remove password from update if not provided
            unset($data['password']);
        }

        // Prevent modification of immutable fields
        unset($data['id'], $data['created_at']);

        $updated = $this->repository->update($employeeId, $data);

        return $updated ? $this->repository->findById($employeeId) : null;
    }

    /**
     * Deactivate (soft delete) an employee
     */
    public function deactivate(int $employeeId): bool
    {
        return $this->repository->deactivate($employeeId);
    }

    /**
     * Get paginated list of employees with optional search
     */
    public function list(EmployeeListDTO $dto): LengthAwarePaginator
    {
        return $this->repository->paginateAndSearch(
            $dto->search,
            $dto->perPage,
            $dto->onlyTrashed
        );
    }

    /**
     * Find an employee by ID
     */
    public function findById(int $id): ?User
    {
        return $this->repository->findById($id);
    }

    /**
     * Get all active employees
     */
    public function getAllActive(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->repository->getAllActive();
    }
}
