<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Car categories and common brands. Idempotent: matches by slug and never changes edited rows.
 */
class ReferenceSeeder extends Seeder
{
    /** @var list<array{name: string, description: string}> */
    public const CATEGORIES = [
        ['name' => 'Ekonomi', 'description' => 'Mobil hemat untuk perjalanan harian.'],
        ['name' => 'MPV', 'description' => 'Mobil keluarga 7 kursi.'],
        ['name' => 'SUV', 'description' => 'Mobil tangguh untuk berbagai medan.'],
        ['name' => 'Mewah', 'description' => 'Mobil premium untuk acara khusus.'],
        ['name' => 'City Car', 'description' => 'Mobil kecil yang lincah di kota.'],
    ];

    /** @var list<string> */
    public const BRANDS = [
        'Toyota', 'Honda', 'Daihatsu', 'Suzuki', 'Mitsubishi', 'Hyundai',
        'Wuling', 'Nissan', 'Mazda', 'BMW', 'Mercedes-Benz',
    ];

    public function run(): void
    {
        foreach (self::CATEGORIES as $order => $category) {
            Category::query()->firstOrCreate(
                ['slug' => Str::slug($category['name'])],
                ['name' => $category['name'], 'description' => $category['description'], 'sort_order' => $order + 1],
            );
        }

        foreach (self::BRANDS as $name) {
            Brand::query()->firstOrCreate(['slug' => Str::slug($name)], ['name' => $name]);
        }
    }
}
