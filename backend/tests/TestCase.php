<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->guardAgainstNonTestDatabase();
    }

    /**
     * Tests may create, truncate and drop tables. Refuse to run unless the
     * configured database is a dedicated PostgreSQL test database (`*_test`).
     */
    private function guardAgainstNonTestDatabase(): void
    {
        $connection = config('database.default');
        $database = (string) config("database.connections.{$connection}.database");

        if ($connection !== 'pgsql' || ! str_ends_with($database, '_test')) {
            throw new RuntimeException(sprintf(
                'Refusing to run tests against connection "%s" / database "%s". Use PostgreSQL with a database name ending in "_test".',
                $connection,
                $database,
            ));
        }
    }
}
