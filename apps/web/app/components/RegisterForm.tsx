'use client';

import { useState } from 'react';

export default function RegisterForm({ onRegister }: { onRegister: (data: any) => Promise<void> }) {
  const [loading, setLoading] = useState(false);

  async function submit(e: any) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.target);
    await onRegister({
      name: form.get('name'),
      email: form.get('email'),
      phone: form.get('phone')
    });
    setLoading(false);
  }

  return (
    <form onSubmit={submit}>
      <input className="input" name="name" placeholder="Full name" required />
      <input className="input" name="email" placeholder="Email" type="email" required />
      <input className="input" name="phone" placeholder="Phone" required />
      <button className="button" type="submit" disabled={loading}>{loading ? 'Working...' : 'Register'}</button>
    </form>
  );
}
