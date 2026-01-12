<?php

namespace App\Enums;

enum EmployeeStatusEnum: string
{
    case ACTIVE = 'active';
    case INACTIVE = 'inactive';

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
            self::ACTIVE => 'Active',
            self::INACTIVE => 'Inactive',
        };
    }
}
