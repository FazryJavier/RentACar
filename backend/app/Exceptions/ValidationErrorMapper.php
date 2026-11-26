<?php

namespace App\Exceptions;

use App\Support\Http\ApiError;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Validator;

/**
 * Converts a ValidationException into API error items with stable, rule-based codes.
 */
final class ValidationErrorMapper
{
    private const REQUIRED = 'required';

    private const INVALID_FORMAT = 'invalid_format';

    private const TOO_SHORT = 'too_short';

    private const TOO_LONG = 'too_long';

    private const OUT_OF_RANGE = 'out_of_range';

    private const NOT_UNIQUE = 'not_unique';

    private const INVALID_FILE_TYPE = 'invalid_file_type';

    private const FILE_TOO_LARGE = 'file_too_large';

    private const MISMATCH = 'mismatch';

    private const INVALID = 'invalid';

    /** Rules whose failure means the value has the wrong format/type. */
    private const FORMAT_RULES = [
        'Email', 'Regex', 'NotRegex', 'Date', 'DateFormat', 'DateEquals', 'Uuid', 'Ulid', 'Url',
        'In', 'NotIn', 'String', 'Integer', 'Numeric', 'Decimal', 'Boolean', 'Array', 'List', 'Json',
        'Digits', 'DigitsBetween', 'Alpha', 'AlphaDash', 'AlphaNum', 'Ip', 'Ipv4', 'Ipv6', 'Timezone', 'Enum',
        'PlateNumberRule',
    ];

    private const FILE_TYPE_RULES = ['Mimes', 'Mimetypes', 'File', 'Image', 'Extensions'];

    private const SIZE_RULES = ['Min', 'Max', 'Size', 'Between'];

    /**
     * @return list<ApiError>
     */
    public function map(ValidationException $exception): array
    {
        $validator = $exception->validator;

        if (! $validator instanceof Validator) {
            return array_map(
                static fn (string $message): ApiError => new ApiError(null, self::INVALID, $message),
                array_values($validator->errors()->all()),
            );
        }

        $failed = $validator->failed();
        $messages = $validator->errors();
        $errors = [];

        foreach ($messages->messages() as $field => $fieldMessages) {
            $rules = array_keys($failed[$field] ?? []);

            foreach (array_values($fieldMessages) as $index => $message) {
                $rule = $rules[$index] ?? null;
                $parameters = $rule !== null ? ($failed[$field][$rule] ?? []) : [];

                $errors[] = new ApiError(
                    field: (string) $field,
                    code: $rule === null ? self::INVALID : $this->codeFor($validator, (string) $field, $rule, $parameters),
                    message: (string) $message,
                );
            }
        }

        return $errors;
    }

    /**
     * @param  array<int, mixed>  $parameters
     */
    private function codeFor(Validator $validator, string $field, string $rule, array $parameters): string
    {
        $rule = class_exists($rule) ? class_basename($rule) : Str::studly($rule);

        return match (true) {
            str_starts_with($rule, 'Required'), in_array($rule, ['Present', 'Filled'], true) => self::REQUIRED,
            in_array($rule, ['Unique', 'UniqueLowerName'], true) => self::NOT_UNIQUE,
            $rule === 'Confirmed' => self::MISMATCH,
            in_array($rule, self::FILE_TYPE_RULES, true) => self::INVALID_FILE_TYPE,
            in_array($rule, self::SIZE_RULES, true) => $this->sizeCode($validator, $field, $rule, $parameters),
            in_array($rule, self::FORMAT_RULES, true) => self::INVALID_FORMAT,
            default => self::INVALID,
        };
    }

    /**
     * @param  array<int, mixed>  $parameters
     */
    private function sizeCode(Validator $validator, string $field, string $rule, array $parameters): string
    {
        $fieldRules = $this->ruleNames($validator, $field);

        if (array_intersect($fieldRules, ['File', 'Image', 'Mimes', 'Mimetypes', 'Extensions']) !== []) {
            return $rule === 'Max' ? self::FILE_TOO_LARGE : self::INVALID;
        }

        if (array_intersect($fieldRules, ['Numeric', 'Integer', 'Decimal']) !== []) {
            return self::OUT_OF_RANGE;
        }

        if ($rule === 'Min') {
            return self::TOO_SHORT;
        }

        if ($rule === 'Max') {
            return self::TOO_LONG;
        }

        // Size / Between on strings or arrays: compare the actual length with the lower bound.
        $value = Arr::get($validator->getData(), $field);
        $length = is_array($value) ? count($value) : mb_strlen(is_scalar($value) ? (string) $value : '');
        $lower = (int) ($parameters[0] ?? 0);

        return $length < $lower ? self::TOO_SHORT : self::TOO_LONG;
    }

    /**
     * @return list<string>
     */
    private function ruleNames(Validator $validator, string $field): array
    {
        $rules = $validator->getRules()[$field] ?? [];

        return array_values(array_map(static function (mixed $rule): string {
            if (is_object($rule)) {
                return class_basename($rule);
            }

            return Str::studly(explode(':', (string) $rule, 2)[0]);
        }, is_array($rules) ? $rules : [$rules]));
    }
}
