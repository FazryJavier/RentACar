<?php

use App\Models\Branch;
use App\Models\Car;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Support\AdminBrowsers;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->branch = Branch::factory()->create();
    $this->car = Car::factory()->create(['branch_id' => $this->branch->id, 'odometer_km' => 40000, 'last_inspected_at' => null]);
    $this->browser = AdminBrowsers::staff($this, $this->admin, $this->branch);
    $this->url = "/api/v1/admin/cars/{$this->car->id}/inspections";
});

it('records an inspection and updates the car', function () {
    $this->travelTo(now()->setDate(2026, 11, 27));

    $this->browser->post($this->url, ['inspected_at' => '2026-11-26T09:00:00+07:00', 'odometer_km' => 45000, 'notes' => 'Ban depan diganti'])
        ->assertCreated()
        ->assertJsonPath('data.inspected_at', '2026-11-26T02:00:00Z')
        ->assertJsonPath('data.admin.id', $this->admin->id);

    $car = $this->car->fresh();
    expect($car->last_inspected_at->toIso8601ZuluString())->toBe('2026-11-26T02:00:00Z')
        ->and($car->odometer_km)->toBe(45000)
        ->and(DB::table('audit_logs')->where('action', 'admin.car.inspection_recorded')->count())->toBe(1);
    $this->browser->get("/api/v1/admin/cars/{$this->car->id}")->assertJsonPath('data.last_inspected_at', '2026-11-26T02:00:00Z');
});

it('keeps the latest date and highest odometer for older inspections', function () {
    $this->travelTo(now()->setDate(2026, 11, 27));
    $this->browser->post($this->url, ['inspected_at' => '2026-11-26T09:00:00+07:00', 'odometer_km' => 45000])->assertCreated();

    $this->browser->post($this->url, ['inspected_at' => '2026-11-01T09:00:00+07:00', 'odometer_km' => 41000])->assertCreated();

    $car = $this->car->fresh();
    expect($car->last_inspected_at->toIso8601ZuluString())->toBe('2026-11-26T02:00:00Z')->and($car->odometer_km)->toBe(45000);
    expect($this->browser->get($this->url)->json('data.*.odometer_km'))->toBe([45000, 41000]);
});

it('rejects future times and invalid values', function (array $payload, string $field) {
    $this->browser->post($this->url, [...['inspected_at' => now()->subHour()->toIso8601String(), 'odometer_km' => 1000], ...$payload])
        ->assertUnprocessable()->assertJsonPath('errors.0.field', $field);
})->with([
    'future' => [['inspected_at' => now()->addMinutes(5)->toIso8601String()], 'inspected_at'],
    'not a date' => [['inspected_at' => 'kemarin'], 'inspected_at'],
    'negative km' => [['odometer_km' => -1], 'odometer_km'],
    'too many km' => [['odometer_km' => 2000001], 'odometer_km'],
    'long notes' => [['notes' => str_repeat('a', 1001)], 'notes'],
]);

it('hides other branches', function () {
    $other = Car::factory()->create();

    $this->browser->post("/api/v1/admin/cars/{$other->id}/inspections", ['inspected_at' => now()->toIso8601String(), 'odometer_km' => 1])->assertNotFound();
});
