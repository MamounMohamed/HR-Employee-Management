<?php

namespace App\Repositories;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class EmployeeRepository
{
    /**
     * Create a new employee record
     */
    public function create(array $data): User
    {
        return User::create($data);
    }

    /**
     * Find an employee by ID
     */
    public function findById(int $id): ?User
    {
        return User::find($id);
    }

    /**
     * Find an employee by ID including soft deleted
     */
    public function findByIdWithTrashed(int $id): ?User
    {
        return User::withTrashed()->find($id);
    }

    /**
     * Update an employee record
     */
    public function update(int $id, array $data): bool
    {
        $employee = $this->findById($id);

        if (!$employee) {
            return false;
        }

        return $employee->update($data);
    }

    /**
     * Soft delete (deactivate) an employee
     */
    public function deactivate(int $id): bool
    {
        $employee = $this->findById($id);

        if (!$employee) {
            return false;
        }

        // Update status to inactive before soft deleting
        $employee->update(['status' => 'inactive']);

        return $employee->delete();
    }

    /**
     * Paginate and search employees
     */
    public function paginateAndSearch(?string $search, int $perPage, bool $onlyTrashed = false): LengthAwarePaginator
    {
        $query = User::query();

        if ($onlyTrashed) {
            $query->onlyTrashed()->where('status', 'inactive');
        }

        return $query
            ->when($search, function (Builder $query, string $search) {
                $query->where(function (Builder $q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('department', 'like', "%{$search}%");
                });
            })
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get all active employees
     */
    public function getAllActive(): \Illuminate\Database\Eloquent\Collection
    {
        return User::where('status', 'active')->get();
    }

    /**
     * Check if email exists
     */
    public function emailExists(string $email, ?int $excludeId = null): bool
    {
        $query = User::where('email', $email);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }
}
