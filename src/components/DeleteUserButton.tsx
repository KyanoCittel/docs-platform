'use client';

import { useState } from 'react';
import SubmitButton from '@/components/SubmitButton';
import { deleteUser } from '@/app/admin/users/actions';

export default function DeleteUserButton({ id }: { id: string }) {
  const [confirm, setConfirm] = useState(false);

  if (!confirm) {
    return (
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="text-sm px-3 py-1 rounded-md border text-red-600 hover:bg-red-50"
      >
        Verwijderen
      </button>
    );
  }

  return (
    <form action={deleteUser} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <button
        type="button"
        onClick={() => setConfirm(false)}
        className="text-sm text-gray-600 hover:text-black"
      >
        annuleer
      </button>
      <SubmitButton
        pendingLabel="..."
        className="text-sm px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
      >
        Ja, verwijder
      </SubmitButton>
    </form>
  );
}
