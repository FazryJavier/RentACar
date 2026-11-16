<?php

/*
| Indonesian validation messages for the rules used by RentACar.
| Rules not listed here fall back to the framework's English messages.
*/

return [
    'accepted' => ':Attribute harus disetujui.',
    'after' => ':Attribute harus tanggal setelah :date.',
    'after_or_equal' => ':Attribute harus tanggal yang sama dengan atau setelah :date.',
    'alpha_dash' => ':Attribute hanya boleh berisi huruf, angka, tanda hubung, dan garis bawah.',
    'alpha_num' => ':Attribute hanya boleh berisi huruf dan angka.',
    'array' => ':Attribute harus berupa daftar.',
    'before' => ':Attribute harus tanggal sebelum :date.',
    'before_or_equal' => ':Attribute harus tanggal yang sama dengan atau sebelum :date.',
    'between' => [
        'array' => ':Attribute harus memiliki :min sampai :max item.',
        'file' => ':Attribute harus berukuran :min sampai :max kilobyte.',
        'numeric' => ':Attribute harus bernilai :min sampai :max.',
        'string' => ':Attribute harus berisi :min sampai :max karakter.',
    ],
    'boolean' => ':Attribute harus bernilai benar atau salah.',
    'confirmed' => 'Konfirmasi :attribute tidak cocok.',
    'date' => ':Attribute bukan tanggal yang valid.',
    'date_format' => ':Attribute harus sesuai format :format.',
    'decimal' => ':Attribute harus memiliki :decimal angka desimal.',
    'different' => ':Attribute dan :other harus berbeda.',
    'digits' => ':Attribute harus terdiri dari :digits digit.',
    'digits_between' => ':Attribute harus terdiri dari :min sampai :max digit.',
    'email' => ':Attribute harus berupa alamat email yang valid.',
    'enum' => ':Attribute yang dipilih tidak valid.',
    'exists' => ':Attribute yang dipilih tidak valid.',
    'extensions' => ':Attribute harus berekstensi: :values.',
    'file' => ':Attribute harus berupa berkas.',
    'filled' => ':Attribute wajib diisi.',
    'gt' => [
        'numeric' => ':Attribute harus lebih besar dari :value.',
        'string' => ':Attribute harus lebih dari :value karakter.',
    ],
    'gte' => [
        'numeric' => ':Attribute harus lebih besar dari atau sama dengan :value.',
        'string' => ':Attribute minimal :value karakter.',
    ],
    'image' => ':Attribute harus berupa gambar.',
    'in' => ':Attribute yang dipilih tidak valid.',
    'integer' => ':Attribute harus berupa bilangan bulat.',
    'ip' => ':Attribute harus berupa alamat IP yang valid.',
    'json' => ':Attribute harus berupa JSON yang valid.',
    'list' => ':Attribute harus berupa daftar.',
    'lt' => [
        'numeric' => ':Attribute harus lebih kecil dari :value.',
        'string' => ':Attribute harus kurang dari :value karakter.',
    ],
    'lte' => [
        'numeric' => ':Attribute harus lebih kecil dari atau sama dengan :value.',
        'string' => ':Attribute maksimal :value karakter.',
    ],
    'max' => [
        'array' => ':Attribute maksimal berisi :max item.',
        'file' => ':Attribute maksimal berukuran :max kilobyte.',
        'numeric' => ':Attribute maksimal bernilai :max.',
        'string' => ':Attribute maksimal :max karakter.',
    ],
    'mimes' => ':Attribute harus berupa berkas bertipe: :values.',
    'mimetypes' => ':Attribute harus berupa berkas bertipe: :values.',
    'min' => [
        'array' => ':Attribute minimal berisi :min item.',
        'file' => ':Attribute minimal berukuran :min kilobyte.',
        'numeric' => ':Attribute minimal bernilai :min.',
        'string' => ':Attribute minimal :min karakter.',
    ],
    'not_in' => ':Attribute yang dipilih tidak valid.',
    'not_regex' => 'Format :attribute tidak valid.',
    'numeric' => ':Attribute harus berupa angka.',
    'present' => ':Attribute wajib ada.',
    'prohibited' => ':Attribute tidak boleh diisi.',
    'regex' => 'Format :attribute tidak valid.',
    'required' => ':Attribute wajib diisi.',
    'required_if' => ':Attribute wajib diisi jika :other bernilai :value.',
    'required_unless' => ':Attribute wajib diisi kecuali :other bernilai :values.',
    'required_with' => ':Attribute wajib diisi jika :values ada.',
    'required_with_all' => ':Attribute wajib diisi jika :values ada.',
    'required_without' => ':Attribute wajib diisi jika :values tidak ada.',
    'required_without_all' => ':Attribute wajib diisi jika :values tidak ada.',
    'same' => ':Attribute dan :other harus sama.',
    'size' => [
        'array' => ':Attribute harus berisi :size item.',
        'file' => ':Attribute harus berukuran :size kilobyte.',
        'numeric' => ':Attribute harus bernilai :size.',
        'string' => ':Attribute harus berisi :size karakter.',
    ],
    'string' => ':Attribute harus berupa teks.',
    'timezone' => ':Attribute harus berupa zona waktu yang valid.',
    'unique' => ':Attribute sudah digunakan.',
    'uploaded' => ':Attribute gagal diunggah.',
    'url' => ':Attribute harus berupa URL yang valid.',
    'uuid' => ':Attribute harus berupa UUID yang valid.',

    'custom' => [],

    /*
    | Human-friendly field names used in messages.
    */
    'attributes' => [
        'name' => 'nama',
        'email' => 'email',
        'password' => 'kata sandi',
        'phone' => 'nomor HP',
        'address' => 'alamat',
        'license_number' => 'nomor SIM',
        'q' => 'kata kunci pencarian',
    ],
];
