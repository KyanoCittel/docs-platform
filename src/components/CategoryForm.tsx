'use client';

import { useActionState, useEffect, useRef } from 'react';
import SubmitButton from '@/components/SubmitButton';
import { createCategory, type ActionState } from '@/app/admin/actions';

export default function CategoryForm() {
  const [state, action] = useActionState<ActionState, FormData>(createCategory, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="p-4 border-t space-y-2">
      <form ref={formRef} action={action} className="flex gap-2">
        <input
          name="name"
          required
          placeholder="Nieuwe categorie"
          className="flex-1 border rounded-md px-3 py-2"
        />
        <SubmitButton pendingLabel="Toevoegen...">Toevoegen</SubmitButton>
      </form>
      {state && (
        <p className={`text-sm ${state.ok ? 'text-green-600' : 'text-red-600'}`} role="status" aria-live="polite">
          {state.ok ? '✓ ' : '✗ '}{state.message}
        </p>
      )}
    </div>
  );
}
