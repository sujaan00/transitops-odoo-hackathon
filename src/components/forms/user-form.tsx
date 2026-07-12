"use client";

import { Role, labelize, roles, type Role as RoleValue } from "@/lib/domain";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/client";

export function UserForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await postJson("/api/users", body);
      toast.success("User created.");
      router.refresh();
      event.currentTarget.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "User could not be created.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-lg border bg-card p-5 md:grid-cols-2">
      <input name="name" placeholder="Name" required />
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Temporary password" required />
      <select name="role" defaultValue={Role.DISPATCHER}>
        {roles.map((role) => (
          <option key={role} value={role}>
            {labelize(role)}
          </option>
        ))}
      </select>
      <div className="flex justify-end md:col-span-2">
        <Button disabled={loading}>{loading ? "Creating..." : "Create user"}</Button>
      </div>
    </form>
  );
}

export function RoleSelect({ userId, role }: { userId: string; role: RoleValue }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateRole(nextRole: RoleValue) {
    setLoading(true);
    try {
      await postJson(`/api/users/${userId}/role`, { role: nextRole }, "PATCH");
      toast.success("Role updated.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Role could not be updated.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <select disabled={loading} value={role} onChange={(event) => void updateRole(event.target.value as RoleValue)}>
      {roles.map((item) => (
        <option key={item} value={item}>
          {labelize(item)}
        </option>
      ))}
    </select>
  );
}
