<?php

use App\Enums\ActorType;
use App\Enums\AdminRole;
use App\Enums\BookingStatus;
use App\Enums\CarStatus;
use App\Enums\ConditionArea;
use App\Enums\ConditionSeverity;
use App\Enums\FuelType;
use App\Enums\PaymentStatus;
use App\Enums\Transmission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

it('creates every v1.0 table', function (string $table) {
    expect(Schema::hasTable($table))->toBeTrue();
})->with([
    'branches', 'brands', 'categories', 'admins', 'admin_password_reset_tokens', 'customers',
    'customer_password_reset_tokens', 'cars', 'car_photos', 'car_models_3d', 'car_conditions',
    'car_condition_photos', 'car_inspections', 'bookings', 'booking_status_histories', 'payments',
    'idempotency_keys', 'settings', 'audit_logs', 'events', 'testimonials',
    'sessions', 'cache', 'jobs', 'failed_jobs',
]);

it('enables btree_gist', function () {
    expect(DB::selectOne("select count(*) as c from pg_extension where extname = 'btree_gist'")->c)->toBe(1);
});

it('uses bigint money, timestamptz times and varchar status on bookings', function () {
    $types = collect(DB::select(
        "select column_name, data_type from information_schema.columns where table_name = 'bookings'",
    ))->pluck('data_type', 'column_name');

    expect($types['daily_price'])->toBe('bigint')
        ->and($types['total_amount'])->toBe('bigint')
        ->and($types['pickup_at'])->toBe('timestamp with time zone')
        ->and($types['blocked_until'])->toBe('timestamp with time zone')
        ->and($types['status'])->toBe('character varying');
});

it('creates the partial expiry index on bookings', function () {
    $index = DB::selectOne("select indexdef from pg_indexes where tablename = 'bookings' and indexname = 'bookings_pending_deadline_idx'");

    expect($index)->not->toBeNull()
        ->and($index->indexdef)->toContain('(status, payment_deadline)')
        ->and($index->indexdef)->toContain("WHERE ((status)::text = 'pending_payment'::text)");
});

it('creates the query-supporting indexes', function (string $table, string $index) {
    expect(DB::selectOne('select 1 as ok from pg_indexes where tablename = ? and indexname = ?', [$table, $index]))->not->toBeNull();
})->with([
    ['cars', 'cars_branch_id_status_index'],
    ['cars', 'cars_plate_number_unique'],
    ['bookings', 'bookings_customer_created_idx'],
    ['bookings', 'bookings_branch_id_status_pickup_at_index'],
    ['payments', 'payments_status_created_at_index'],
    ['payments', 'payments_one_pending_per_booking'],
    ['audit_logs', 'audit_logs_subject_type_subject_id_index'],
    ['customers', 'customers_email_lower_unique'],
    ['admins', 'admins_email_lower_unique'],
]);

/**
 * Values allowed by a CHECK constraint of the form `col IN ('a', 'b')` / `= ANY (ARRAY[...])`.
 *
 * @return list<string>
 */
function checkConstraintValues(string $constraint): array
{
    $definition = DB::selectOne('select pg_get_constraintdef(oid) as def from pg_constraint where conname = ?', [$constraint])->def;
    preg_match_all("/'([^']+)'::/", $definition, $matches);

    return array_values(array_unique($matches[1]));
}

it('keeps PHP enums identical to the database CHECK lists', function (string $constraint, array $values) {
    expect(checkConstraintValues($constraint))->toEqualCanonicalizing($values);
})->with([
    'booking status' => ['bookings_status_check', BookingStatus::values()],
    'car status' => ['cars_status_check', CarStatus::values()],
    'transmission' => ['cars_transmission_check', Transmission::values()],
    'fuel type' => ['cars_fuel_type_check', FuelType::values()],
    'admin role' => ['admins_role_check', AdminRole::values()],
    'payment status' => ['payments_status_check', PaymentStatus::values()],
    'condition area' => ['car_conditions_area_check', ConditionArea::values()],
    'condition severity' => ['car_conditions_severity_check', ConditionSeverity::values()],
    'actor type' => ['audit_logs_actor_check', ActorType::values()],
]);

it('limits the exclusion constraint to schedule-holding statuses', function () {
    $definition = DB::selectOne("select pg_get_constraintdef(oid) as def from pg_constraint where conname = 'bookings_no_overlap'")->def;
    preg_match_all("/'([a-z_]+)'::/", $definition, $matches);

    expect($definition)->toContain('EXCLUDE USING gist')
        ->and(array_values(array_unique($matches[1])))->toEqualCanonicalizing(
            array_map(fn (BookingStatus $s) => $s->value, BookingStatus::HOLDING),
        );
});
