<?php

namespace App\Notifications;

use App\Models\Customer;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Password reset email with a link to the frontend reset page.
 */
class CustomerResetPassword extends Notification
{
    public function __construct(public readonly string $token) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function url(Customer $customer): string
    {
        return rtrim((string) config('app.frontend_url'), '/').'/atur-ulang-kata-sandi?'.http_build_query([
            'token' => $this->token,
            'email' => $customer->getEmailForPasswordReset(),
        ]);
    }

    public function toMail(Customer $notifiable): MailMessage
    {
        $minutes = (int) config('auth.passwords.customers.expire', 60);

        return (new MailMessage)
            ->subject('Atur ulang kata sandi RentACar')
            ->greeting('Halo '.$notifiable->name.',')
            ->line('Kami menerima permintaan untuk mengatur ulang kata sandi akun RentACar Anda.')
            ->action('Atur ulang kata sandi', $this->url($notifiable))
            ->line("Tautan ini berlaku {$minutes} menit dan hanya bisa dipakai sekali.")
            ->line('Jika Anda tidak meminta ini, abaikan email ini. Kata sandi Anda tidak berubah.')
            ->salutation('Salam, RentACar (proyek demo)');
    }
}
