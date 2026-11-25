<?php

namespace Tests\Support;

use Illuminate\Cookie\CookieValuePrefix;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * A minimal cookie-keeping "browser" for feature tests: each instance has its own cookie jar,
 * so several sessions (e.g. two devices of one customer) can be exercised in one test.
 * Requests look like the Next.js frontend (stateful Sanctum origin, same-origin fetch).
 */
final class Browser
{
    public const ORIGIN = 'http://localhost:3000';

    /** @var array<string, string> Decrypted cookie values. */
    private array $cookies = [];

    public function __construct(private readonly TestCase $test) {}

    /**
     * @param  array<string, mixed>  $data
     * @param  array<string, string>  $headers
     */
    public function json(string $method, string $uri, array $data = [], array $headers = []): TestResponse
    {
        // Never let the in-memory guard of a previous request leak into this one.
        app('auth')->forgetGuards();

        $server = ['CONTENT_TYPE' => 'application/json', 'REMOTE_ADDR' => '203.0.113.10'];
        foreach ([
            'Accept' => 'application/json',
            'Origin' => self::ORIGIN,
            'Referer' => self::ORIGIN.'/',
            'Sec-Fetch-Site' => 'same-origin',
            ...$headers,
        ] as $name => $value) {
            $server['HTTP_'.strtoupper(str_replace('-', '_', $name))] = $value;
        }

        $response = $this->test->call(
            $method,
            $uri,
            [],
            $this->encryptedCookies(),
            [],
            $server,
            $data === [] ? null : json_encode($data, JSON_THROW_ON_ERROR),
        );

        foreach ($response->headers->getCookies() as $cookie) {
            if ($cookie->getName() === 'XSRF-TOKEN') {
                continue; // Not needed: requests are same-origin (Sec-Fetch-Site).
            }

            if ($cookie->isCleared()) {
                unset($this->cookies[$cookie->getName()]);

                continue;
            }

            $value = $response->getCookie($cookie->getName())?->getValue();
            if (is_string($value)) {
                $this->cookies[$cookie->getName()] = $value;
            }
        }

        return $response;
    }

    public function get(string $uri): TestResponse
    {
        return $this->json('GET', $uri);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function post(string $uri, array $data = []): TestResponse
    {
        return $this->json('POST', $uri, $data);
    }

    public function hasCookie(string $name): bool
    {
        return isset($this->cookies[$name]);
    }

    /** Drops one cookie (e.g. to simulate a browser that only kept the remember-me cookie). */
    public function forget(string $name): void
    {
        unset($this->cookies[$name]);
    }

    /**
     * @return array<string, string>
     */
    private function encryptedCookies(): array
    {
        $encrypter = app('encrypter');
        $cookies = [];

        foreach ($this->cookies as $name => $value) {
            $cookies[$name] = $encrypter->encrypt(CookieValuePrefix::create($name, $encrypter->getKey()).$value, false);
        }

        return $cookies;
    }
}
