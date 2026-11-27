<?php

namespace App\Console\Commands;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Branch;
use App\Models\Car;
use App\Models\Customer;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Local performance check for the public availability search: creates sample cars and bookings
 * inside a transaction, times `GET /api/v1/public/cars` with dates, then rolls everything back.
 */
final class MeasureCatalog extends Command
{
    protected $signature = 'rentacar:measure-catalog {--cars=60} {--bookings=600} {--runs=50}';

    protected $description = 'Measure p50/p95 of the public availability search on temporary data (local only).';

    public function handle(Kernel $kernel): int
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->error('Only available in the local or testing environment.');

            return self::FAILURE;
        }

        $cars = max(1, (int) $this->option('cars'));
        $bookings = max(0, (int) $this->option('bookings'));
        $runs = max(5, (int) $this->option('runs'));
        $timings = [];
        $statuses = [];

        DB::beginTransaction();
        try {
            $branch = Branch::factory()->create(['opening_time' => '07:00', 'closing_time' => '21:00']);
            $fleet = Car::factory()->count($cars)->create(['branch_id' => $branch->id]);
            $this->createBookings($fleet->all(), $bookings);

            $pickup = CarbonImmutable::now('Asia/Jakarta')->addDays(10)->setTime(9, 0);
            $query = http_build_query([
                'branch' => $branch->slug,
                'pickup_at' => $pickup->toIso8601String(),
                'return_at' => $pickup->addDays(3)->toIso8601String(),
                'per_page' => 24,
            ]);

            for ($run = 0; $run < $runs; $run++) {
                // A different client IP per run so the public rate limiter does not interfere.
                $request = Request::create("/api/v1/public/cars?{$query}", 'GET', server: [
                    'HTTP_ACCEPT' => 'application/json',
                    'REMOTE_ADDR' => '198.51.100.'.($run % 250 + 1),
                ]);
                $start = hrtime(true);
                $response = $kernel->handle($request);
                $timings[] = (hrtime(true) - $start) / 1_000_000;
                $statuses[$response->getStatusCode()] = ($statuses[$response->getStatusCode()] ?? 0) + 1;
                $kernel->terminate($request, $response);
            }
        } finally {
            DB::rollBack();
        }

        sort($timings);
        $percentile = fn (float $p): float => $timings[(int) min(count($timings) - 1, ceil($p * count($timings)) - 1)];
        $this->info(sprintf(
            'cars=%d bookings=%d runs=%d status=%s p50=%.1f ms p95=%.1f ms max=%.1f ms',
            $cars, $bookings, $runs, json_encode($statuses), $percentile(0.5), $percentile(0.95), end($timings),
        ));

        return self::SUCCESS;
    }

    /**
     * Non-overlapping bookings spread over the next 60 days.
     *
     * @param  list<Car>  $cars
     */
    private function createBookings(array $cars, int $count): void
    {
        $holding = [BookingStatus::Confirmed, BookingStatus::PendingVerification, BookingStatus::Completed, BookingStatus::Cancelled];
        // A few shared customers: creating one per booking would spend most of the time hashing passwords.
        $customers = Customer::factory()->count(10)->create()->modelKeys();
        $next = [];
        for ($i = 0; $i < $count; $i++) {
            $car = $cars[$i % count($cars)];
            $start = $next[$car->id] ?? CarbonImmutable::now('UTC')->addDays(1)->setTime(2, 0);
            $days = 1 + $i % 3;
            Booking::factory()->forCar($car, $start, $days)->status($holding[$i % count($holding)])
                ->create(['customer_id' => $customers[$i % count($customers)]]);
            $next[$car->id] = $start->addDays($days + 1);
        }
    }
}
