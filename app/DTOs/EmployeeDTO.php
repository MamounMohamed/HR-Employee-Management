<?php

namespace App\DTOs;

use App\Enums\EmployeeRoleEnum;
use App\Enums\EmployeeStatusEnum;

class EmployeeDTO
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly ?string $password,
        public readonly EmployeeRoleEnum $role,
        public readonly ?string $department,
        public readonly EmployeeStatusEnum $status,
    ) {
    }

    /**
     * Create DTO from request data
     */
    public static function fromRequest(array $data): self
    {
        return new self(
            name: $data['name'],
            email: $data['email'],
            password: $data['password'] ?? null,
            role: EmployeeRoleEnum::from($data['role'] ?? EmployeeRoleEnum::EMPLOYEE->value),
            department: $data['department'] ?? null,
            status: EmployeeStatusEnum::from($data['status'] ?? EmployeeStatusEnum::ACTIVE->value),
        );
    }

    /**
     * Convert DTO to array for repository
     */
    public function toArray(): array
    {
        $data = [
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role->value,
            'department' => $this->department,
            'status' => $this->status->value,
        ];

        if ($this->password !== null) {
            $data['password'] = $this->password;
        }

        return $data;
    }

    /**
     * Convert DTO to array for updates (excludes password if null)
     */
    public function toUpdateArray(): array
    {
        return array_filter($this->toArray(), fn($value) => $value !== null);
    }
}
