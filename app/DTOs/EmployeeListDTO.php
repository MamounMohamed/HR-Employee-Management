<?php

namespace App\DTOs;

use App\Enums\PaginationEnum;

class EmployeeListDTO
{
    public function __construct(
        public readonly ?string $search,
        public readonly int $perPage,
        public readonly int $page,
        public readonly bool $onlyTrashed = false,
    ) {
    }

    /**
     * Create DTO from request data
     */
    public static function fromRequest(array $data): self
    {
        return new self(
            search: $data['search'] ?? null,
            perPage: PaginationEnum::validatePerPage($data['per_page'] ?? null),
            page: max(1, (int) ($data['page'] ?? 1)),
            onlyTrashed: (bool) ($data['only_inactive'] ?? false),
        );
    }
}
