<?php

namespace App\Enums;

enum WorkLogStatusEnum: string
{
    case RUNNING = 'running';
    case STOPPED = 'stopped';

    public function isRunning(): bool
    {
        return $this === self::RUNNING;
    }

    public function isStopped(): bool
    {
        return $this === self::STOPPED;
    }
}
