'use client';

import { useState } from 'react';
import SubmitButton from '@/components/SubmitButton';

export default function DeleteDocButton({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [confirm, setConfirm] = useState(false);

  if (!confirm) {
    return (
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="px-4 py-2 rounded-md border text-red-600 hover:bg-red-50"
      >
        Verwijderen
      </button>
    );
  }

  return (
    <form action={action} className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Zeker weten?</span>
      <button
        type="button"
        onClick={() => setConfirm(false)}
        className="px-3 py-1.5 rounded-md border hover:bg-gray-50 text-sm"
      >
        Annuleren
      </button>
      <SubmitButton
        pendingLabel="Verwijderen..."
        className="px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 text-sm"
      >
        Ja, verwijder
      </SubmitButton>
    </form>
  );
}
