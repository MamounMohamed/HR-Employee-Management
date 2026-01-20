<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\WorkLog;
use Carbon\Carbon;

class WorkLogSeeder extends Seeder
{
    public function run(): void
    {
        $logs = [
            // User 2
            ['user_id' => 2, 'status' => 'start', 'created_at' => '2026-01-18 08:15:00'],
            ['user_id' => 2, 'status' => 'end',   'created_at' => '2026-01-18 10:00:00'],
            ['user_id' => 2, 'status' => 'start', 'created_at' => '2026-01-18 10:30:00'],
            ['user_id' => 2, 'status' => 'end',   'created_at' => '2026-01-18 16:00:00'],
            ['user_id' => 2, 'status' => 'start', 'created_at' => '2026-01-18 16:00:00'],
            ['user_id' => 2, 'status' => 'end',   'created_at' => '2026-01-18 17:00:00'],

            // User 4
            ['user_id' => 4, 'status' => 'start', 'created_at' => '2026-01-18 09:00:00'],
            ['user_id' => 4, 'status' => 'end',   'created_at' => '2026-01-18 12:00:00'],
            ['user_id' => 4, 'status' => 'start', 'created_at' => '2026-01-18 13:00:00'],
            ['user_id' => 4, 'status' => 'end',   'created_at' => '2026-01-18 17:00:00'],
        ];

        foreach ($logs as $log) {
            WorkLog::create([
                'user_id' => $log['user_id'],
                'status' => $log['status'],
                'created_at' => Carbon::parse($log['created_at']),
                'updated_at' => Carbon::parse($log['created_at']),
            ]);
        }
    }
}
