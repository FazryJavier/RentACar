<?php

use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

it('runs the database session in UTC', function () {
    expect(DB::selectOne('show timezone')->TimeZone)->toBe('UTC');
});

it('stores Eloquent timestamps as the same instant', function () {
    $this->travelTo(now()->setTime(7, 30));
    $customer = Customer::factory()->create();

    $stored = DB::selectOne("select to_char(created_at at time zone 'UTC', 'HH24:MI') as t from customers where id = ?", [$customer->id]);

    expect($stored->t)->toBe('07:30');
});
