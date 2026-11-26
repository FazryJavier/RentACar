import { AdminProfile } from "@/components/admin/admin-profile";
import { RequireAdmin } from "@/components/admin/require-admin";

export default function AdminProfilePage() {
  return (
    <RequireAdmin>
      <AdminProfile />
    </RequireAdmin>
  );
}
