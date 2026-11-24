<?php

/*
| Inputs for seeders. Values come only from the environment (.env, never committed).
*/

return [

    'superadmin' => [
        'name' => env('SEED_SUPERADMIN_NAME', 'Super Admin'),
        'email' => env('SEED_SUPERADMIN_EMAIL'),
        'password' => env('SEED_SUPERADMIN_PASSWORD'),
    ],

    'demo_password' => env('SEED_DEMO_PASSWORD'),

];
