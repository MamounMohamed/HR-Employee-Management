<?php

namespace Database\Seeders;

use App\Enums\EmployeeRoleEnum;
use App\Enums\EmployeeStatusEnum;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class EmployeeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create HR user
        User::create([
            'name' => 'HR Manager',
            'email' => 'hr@example.com',
            'password' => Hash::make('password123', ['rounds' => 6]),
            'role' => EmployeeRoleEnum::HR->value,
            'department' => 'Human Resources',
            'status' => EmployeeStatusEnum::ACTIVE->value,
            'email_verified_at' => now(),
        ]);

        // Create regular employees
        User::create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => Hash::make('password123', ['rounds' => 6]),
            'role' => EmployeeRoleEnum::EMPLOYEE->value,
            'department' => 'Engineering',
            'status' => EmployeeStatusEnum::ACTIVE->value,
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
            'password' => Hash::make('password123', ['rounds' => 6]),
            'role' => EmployeeRoleEnum::EMPLOYEE->value,
            'department' => 'Marketing',
            'status' => EmployeeStatusEnum::ACTIVE->value,
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Bob Johnson',
            'email' => 'bob@example.com',
            'password' => Hash::make('password123', ['rounds' => 6]),
            'role' => EmployeeRoleEnum::EMPLOYEE->value,
            'department' => 'Sales',
            'status' => EmployeeStatusEnum::ACTIVE->value,
            'email_verified_at' => now(),
        ]);

        // Create an inactive employee
        User::create([
            'name' => 'Inactive User',
            'email' => 'inactive@example.com',
            'password' => Hash::make('password123', ['rounds' => 6]),
            'role' => EmployeeRoleEnum::EMPLOYEE->value,
            'department' => 'Engineering',
            'status' => EmployeeStatusEnum::INACTIVE->value,
            'deleted_at' => now(),
            'email_verified_at' => now(),
        ]);

        // Create 100 random employees for pagination testing
        User::factory(100)->create([
            'role' => EmployeeRoleEnum::EMPLOYEE->value,
            'status' => EmployeeStatusEnum::ACTIVE->value,
            'department' => 'General',
            'password' => Hash::make('password123', ['rounds' => 6]),
        ]);
    }
}
