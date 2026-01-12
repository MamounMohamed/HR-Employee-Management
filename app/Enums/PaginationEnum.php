<?php

namespace App\Enums;

enum PaginationEnum: int
{
    case DEFAULT_PER_PAGE = 15;
    case MAX_PER_PAGE = 100;
    case MIN_PER_PAGE = 3;

    /**
     * Validate and return a safe per_page value
     */
    public static function validatePerPage(?int $perPage): int
    {
        if ($perPage === null) {
            return self::DEFAULT_PER_PAGE->value;
        }

        return max(
            self::MIN_PER_PAGE->value,
            min($perPage, self::MAX_PER_PAGE->value)
        );
    }
}
