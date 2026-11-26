<?php

namespace App\Domain\Admin\MasterData;

use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;
use Throwable;

/**
 * Refuses to delete rows that are still referenced, naming how many rows use them.
 */
final class UsageGuard
{
    /** PostgreSQL: foreign key violation / restrict violation. */
    private const FK_VIOLATIONS = ['23503', '23001'];

    /**
     * @param  array<string, array{label: string, count: Closure(): int}>  $usages  key => label + counter
     *
     * @throws ResourceInUse
     */
    public function deleteUnlessUsed(Model $model, string $entityLabel, array $usages): void
    {
        $this->assertUnused($entityLabel, $usages);

        try {
            $model->delete();
        } catch (Throwable $exception) {
            // Eloquent does not declare it, but the database can reject the delete (FK RESTRICT).
            if (! $exception instanceof QueryException || ! in_array((string) $exception->getCode(), self::FK_VIOLATIONS, true)) {
                throw $exception;
            }

            // A reference was added between the check and the delete: count again for the message.
            $this->assertUnused($entityLabel, $usages);

            throw $exception;
        }
    }

    /**
     * @param  array<string, array{label: string, count: Closure(): int}>  $usages
     *
     * @throws ResourceInUse
     */
    public function assertUnused(string $entityLabel, array $usages): void
    {
        $counts = [];
        $parts = [];

        foreach ($usages as $key => $usage) {
            $count = ($usage['count'])();
            $counts[$key] = $count;
            if ($count > 0) {
                $parts[] = "{$count} {$usage['label']}";
            }
        }

        if ($parts !== []) {
            throw new ResourceInUse("{$entityLabel} masih dipakai ".implode(', ', $parts).'.', $counts);
        }
    }
}
