<?php

namespace App\Support\Health;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

/**
 * Checks the infrastructure the API depends on. Failures are logged with
 * their exception for operators; callers only receive "ok" / "fail" flags.
 */
class HealthChecker
{
    public const OK = 'ok';

    public const FAIL = 'fail';

    /**
     * @return array{database: string, cache: string}
     */
    public function check(): array
    {
        return [
            'database' => $this->run('database', fn () => DB::select('select 1')),
            'cache' => $this->run('cache', function (): void {
                $key = 'health:'.Str::uuid()->toString();
                Cache::put($key, '1', 10);
                $value = Cache::get($key);
                Cache::forget($key);

                if ($value !== '1') {
                    throw new \RuntimeException('Cache round-trip returned an unexpected value.');
                }
            }),
        ];
    }

    /**
     * @param  array<string, string>  $checks
     */
    public function isHealthy(array $checks): bool
    {
        return ! in_array(self::FAIL, $checks, true);
    }

    private function run(string $name, callable $probe): string
    {
        try {
            $probe();

            return self::OK;
        } catch (Throwable $e) {
            Log::error('Health check failed.', ['check' => $name, 'exception' => $e]);

            return self::FAIL;
        }
    }
}
