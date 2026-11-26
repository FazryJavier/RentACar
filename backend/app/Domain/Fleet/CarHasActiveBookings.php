<?php

namespace App\Domain\Fleet;

use App\Enums\BookingStatus;
use App\Exceptions\ApiRenderable;
use App\Exceptions\ErrorCatalog;
use App\Models\Booking;
use App\Support\Http\ApiError;
use Illuminate\Support\Collection;
use RuntimeException;

/** The car still has bookings holding its schedule, so the change would break them (409). */
final class CarHasActiveBookings extends RuntimeException implements ApiRenderable
{
    /**
     * @param  Collection<int, Booking>  $bookings
     */
    public function __construct(private readonly Collection $bookings, string $message)
    {
        parent::__construct($message);
    }

    /**
     * @param  Collection<int, Booking>  $bookings
     */
    public static function forStatusChange(Collection $bookings): self
    {
        if ($bookings->contains(fn (Booking $booking): bool => $booking->status === BookingStatus::Ongoing)) {
            return new self($bookings, 'Mobil sedang disewa sehingga statusnya belum bisa diubah.');
        }

        return new self($bookings, "Mobil masih punya {$bookings->count()} pemesanan aktif. Batalkan pemesanan tersebut atau pilih \"Tetap ubah\".");
    }

    /**
     * @param  Collection<int, Booking>  $bookings
     */
    public static function forBranchMove(Collection $bookings): self
    {
        return new self($bookings, "Mobil masih punya {$bookings->count()} pemesanan aktif sehingga cabangnya belum bisa dipindah.");
    }

    /**
     * @param  Collection<int, Booking>  $bookings
     */
    public static function forDeletion(Collection $bookings): self
    {
        return new self($bookings, "Mobil masih punya {$bookings->count()} pemesanan aktif sehingga belum bisa dihapus.");
    }

    public function apiStatus(): int
    {
        return 409;
    }

    public function apiMessage(): string
    {
        return $this->getMessage();
    }

    public function apiErrors(): array
    {
        $bookings = $this->bookings->map(fn (Booking $booking): array => [
            'code' => $booking->code,
            'status' => $booking->status->value,
            'pickup_at' => $booking->pickup_at->utc()->toIso8601ZuluString(),
        ])->values()->all();

        return [new ApiError(null, ErrorCatalog::CAR_HAS_ACTIVE_BOOKINGS, $this->getMessage(), ['bookings' => $bookings])];
    }
}
