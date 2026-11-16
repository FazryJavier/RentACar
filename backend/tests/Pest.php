<?php

use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| Feature and Unit tests run on the Laravel TestCase so the framework and the
| `_test` database guard are always active.
|
*/

pest()->extend(TestCase::class)->in('Feature', 'Unit');
