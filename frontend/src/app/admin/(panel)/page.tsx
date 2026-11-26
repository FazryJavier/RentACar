import { RequireAdmin } from "@/components/admin/require-admin";
import { AdminWelcome } from "@/components/admin/welcome";

export default function AdminDashboardPage() {
  return (
    <RequireAdmin>
      <AdminWelcome />
    </RequireAdmin>
  );
}
