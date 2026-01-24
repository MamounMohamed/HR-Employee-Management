<?php

namespace App\Enums;

enum EmployeeRoleEnum: string
{
    case HR = 'hr';
    case EMPLOYEE = 'employee';

    /**
     * Get all possible values
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get the label for display
     */
    public function label(): string
    {
        return match ($this) {
            self::HR => 'HR',
            self::EMPLOYEE => 'Employee',
        };
    }

    public function isHr(): bool
    {
        return $this === EmployeeRoleEnum::HR;
    }
}
