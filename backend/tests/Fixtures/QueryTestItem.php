<?php

namespace Tests\Fixtures;

use Illuminate\Database\Eloquent\Model;

/**
 * Test-only model on the temporary `query_test_items` table.
 *
 * @property int $id
 * @property string $name
 * @property string $status
 * @property int $price
 */
class QueryTestItem extends Model
{
    protected $table = 'query_test_items';

    protected $guarded = [];
}
