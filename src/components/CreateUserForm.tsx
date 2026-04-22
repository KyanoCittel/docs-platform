'use client';

import { useActionState, useEffect, useRef } from 'react';
import SubmitButton from '@/components/SubmitButton';
import { createUser } from '@/app/admin/users/actions';
import type { ActionState } from '@/app/admin/actions';
import { useToastOnAction } from '@/components/Toast';

export default function CreateUserForm({ isAdmin }: { isAdmin: boolean }) {
  const [state, action] = useActionState<ActionState, FormData>(createUser, null);
  const formRef = useRef<HTMLFormElement>(null);
  useToastOnAction(state);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="space-y-3">
      <form ref={formRef} action={action} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">E-mail</label>
          <input name="email" type="email" required className="w-full border rounded-md px-3 py-2" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Wachtwoord (min. 8)</label>
          <input
            name="password"
            type="text"
            required
            minLength={8}
            className="w-full border rounded-md px-3 py-2 font-mono"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Rol</label>
          <select name="role" defaultValue="viewer" className="w-full border rounded-md px-3 py-2 bg-white">
            <option value="viewer">Viewer (alleen lezen)</option>
            <option value="editor">Editor (mag bewerken)</option>
            {isAdmin && <option value="admin">Admin</option>}
          </select>
        </div>
        <SubmitButton pendingLabel="Aanmaken...">Aanmaken</SubmitButton>
      </form>

      {state && (
        <p
          className={`text-sm ${state.ok ? 'text-green-600' : 'text-red-600'}`}
          role="status"
          aria-live="polite"
        >
          {state.ok ? '✓ ' : '✗ '}{state.message}
        </p>
      )}
    </div>
  );
}
