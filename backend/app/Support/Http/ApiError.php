<?php

namespace App\Support\Http;

/**
 * One item of the `errors` array in the API envelope.
 */
final readonly class ApiError
{
    /**
     * @param  array<string, mixed>|null  $details  Machine-readable supporting data (optional).
     */
    public function __construct(
        public ?string $field,
        public string $code,
        public string $message,
        public ?array $details = null,
    ) {}

    /**
     * @return array{field: string|null, code: string, message: string, details?: array<string, mixed>}
     */
    public function toArray(): array
    {
        $error = [
            'field' => $this->field,
            'code' => $this->code,
            'message' => $this->message,
        ];

        if ($this->details !== null) {
            $error['details'] = $this->details;
        }

        return $error;
    }
}
