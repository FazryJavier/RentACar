<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Default application settings. Never overwrites a value that already exists.
 */
class SettingsSeeder extends Seeder
{
    /**
     * @return array<string, mixed>
     */
    public static function defaults(): array
    {
        return [
            'booking.payment_window_minutes' => 120,
            'booking.prep_buffer_minutes' => 120,
            'booking.min_days' => 1,
            'booking.max_days' => 30,
            'booking.min_lead_minutes' => 120,
            'booking.max_advance_days' => 90,
            'booking.max_open_per_customer' => 2,
            'payment.bank_account' => [
                'bank' => 'Bank Demo',
                'number' => '1234567890',
                'holder' => 'RentACar Demo',
            ],
            'gps.offline_after_minutes' => 10,
            'gps.retention_days' => 90,
            'content.terms_markdown' => "# Syarat & Ketentuan (demo)\n\nIni adalah proyek demo. Semua transaksi adalah simulasi dan tidak ada pembayaran sungguhan.",
        ];
    }

    public function run(): void
    {
        $rows = [];

        foreach (self::defaults() as $key => $value) {
            $rows[] = [
                'key' => $key,
                'value' => json_encode($value, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
                'updated_at' => now(),
            ];
        }

        DB::table('settings')->insertOrIgnore($rows);
    }
}
