'use client';

import { useActionState } from 'react';
import SubmitButton from '@/components/SubmitButton';
import { updateUserRole } from '@/app/admin/users/actions';
import type { ActionState } from '@/app/admin/actions';
import { useToastOnAction } from '@/components/Toast';

type Role = 'admin' | 'editor' | 'viewer';

export default function UserRoleForm({ id, role }: { id: string; role: Role }) {
  const [state, action] = useActionState<ActionState, FormData>(updateUserRole, null);
  useToastOnAction(state);

  return (
    <div className="flex items-center gap-2">
      <form action={action} className="flex items-center gap-2">
        <input type="hidden" name="id" value={id} />
        <select
          name="role"
          defaultValue={role}
          className="border rounded-md px-2 py-1 text-sm bg-white"
        >
          <option value="viewer">viewer</option>
          <option value="editor">editor</option>
          <option value="admin">admin</option>
        </select>
        <SubmitButton
          pendingLabel="..."
          className="text-sm px-3 py-1 rounded-md border hover:bg-gray-50 disabled:opacity-60"
        >
          Opslaan
        </SubmitButton>
      </form>
      {state && (
        <span className={`text-xs ${state.ok ? 'text-green-600' : 'text-red-600'}`}>
          {state.ok ? '✓' : '✗'} {state.message}
        </span>
      )}
    </div>
  );
}
