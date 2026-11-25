<?php

namespace App\Enums;

/**
 * Admin panel menu entries available in the current release, in display order.
 * The menu only drives the UI; every endpoint enforces its own authorization.
 */
enum AdminMenu: string
{
    case Dashboard = 'dashboard';
    case Bookings = 'bookings';
    case Payments = 'payments';
    case Cars = 'cars';
    case Brands = 'brands';
    case Categories = 'categories';
    case Branches = 'branches';
    case Customers = 'customers';
    case Admins = 'admins';
    case AuditLogs = 'audit_logs';

    public function superAdminOnly(): bool
    {
        return in_array($this, [self::Branches, self::Admins, self::AuditLogs], true);
    }

    /**
     * @return list<string>
     */
    public static function keysFor(AdminRole $role): array
    {
        $items = array_filter(
            self::cases(),
            static fn (self $menu): bool => $role === AdminRole::SuperAdmin || ! $menu->superAdminOnly(),
        );

        return array_values(array_map(static fn (self $menu): string => $menu->value, $items));
    }
}
