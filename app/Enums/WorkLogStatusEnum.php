<?php

namespace App\Enums;

enum WorkLogStatusEnum: string
{
    case START = 'start';
    case END   = 'end';

    public function isStart(): bool
    {
        return $this === self::START;
    }

    public function isEnd(): bool
    {
        return $this === self::END;
    }
}
