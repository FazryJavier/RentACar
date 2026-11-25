<?php

namespace App\Notifications;

use App\Models\Admin;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Admin password reset email with a link to the admin panel reset page.
 */
class AdminResetPassword extends Notification
{
    public function __construct(public readonly string $token) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function url(Admin $admin): string
    {
        return rtrim((string) config('app.frontend_url'), '/').'/admin/atur-ulang-kata-sandi?'.http_build_query([
            'token' => $this->token,
            'email' => $admin->getEmailForPasswordReset(),
        ]);
    }

    public function toMail(Admin $notifiable): MailMessage
    {
        $minutes = (int) config('auth.passwords.admins.expire', 60);

        return (new MailMessage)
            ->subject('Atur ulang kata sandi admin RentACar')
            ->greeting('Halo '.$notifiable->name.',')
            ->line('Kami menerima permintaan untuk mengatur ulang kata sandi akun admin panel RentACar Anda.')
            ->action('Atur ulang kata sandi', $this->url($notifiable))
            ->line("Tautan ini berlaku {$minutes} menit dan hanya bisa dipakai sekali.")
            ->line('Jika Anda tidak meminta ini, abaikan email ini dan beri tahu Super Admin.')
            ->salutation('Salam, RentACar (proyek demo)');
    }
}
