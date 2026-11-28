<?php

namespace App\Domain\Catalog;

use App\Enums\BookingStatus;
use App\Enums\CarStatus;
use App\Models\Booking;
use App\Models\Branch;
use App\Models\Car;
use App\Models\Category;

/** Aggregate counts for the public website, always computed from the current data. */
final class PublicStats
{
    /** @return array{cars: int, branches: int, categories: int, completed_bookings: int} */
    public function counts(): array
    {
        return [
            'cars' => Car::query()->where('status', CarStatus::Active->value)->count(),
            'branches' => Branch::query()->where('is_active', true)->count(),
            'categories' => Category::query()->count(),
            'completed_bookings' => Booking::query()->where('status', BookingStatus::Completed->value)->count(),
        ];
    }
}
