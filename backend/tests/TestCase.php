<?php

namespace Tests;

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    /**
     * The guard runs as soon as the application exists — before setUpTraits(), so before
     * RefreshDatabase or any test can create, truncate or drop tables.
     */
    public function createApplication(): Application
    {
        $app = parent::createApplication();

        $config = $app['config'];
        $connection = (string) $config->get('database.default');
        $database = (string) $config->get("database.connections.{$connection}.database");

        if ($connection !== 'pgsql' || ! str_ends_with($database, '_test')) {
            throw new RuntimeException(sprintf(
                'Refusing to run tests against connection "%s" / database "%s". Use PostgreSQL with a database name ending in "_test".',
                $connection,
                $database,
            ));
        }

        return $app;
    }
}
