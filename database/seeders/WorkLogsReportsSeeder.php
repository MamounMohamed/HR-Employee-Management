<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\WorkLogsReport;
use Carbon\Carbon;

class WorkLogsReportsSeeder extends Seeder
{
    public function run(): void
    {
        $userIds = [2, 4];

        $startDate = Carbon::create(2026, 1, 1);
        $endDate   = Carbon::create(2026, 1, 26);

        $notesSamples = [
            'Worked on monthly report',
            'Handled urgent HR requests',
            'System maintenance tasks',
            'Meeting with management',
            'Resolved employee issues',
        ];

        foreach ($userIds as $userId) {
            $currentDate = $startDate->copy();

            while ($currentDate->lte($endDate)) {

                // simulate weekends off
                if ($currentDate->isWeekend()) {
                    $currentDate->addDay();
                    continue;
                }

                WorkLogsReport::updateOrCreate(
                    [
                        'user_id'   => $userId,
                        'work_date' => $currentDate->toDateString(),
                    ],
                    [
                        'time_worked_minutes' => rand(360, 540),
                        'notes' =>  $notesSamples[array_rand($notesSamples)]
                    ]
                );

                $currentDate->addDay();
            }
        }
    }
}
