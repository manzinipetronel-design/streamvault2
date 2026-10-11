'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useKidsControls } from '@/contexts/KidsControlsContext';
import { useProfile } from '@/contexts/ProfileContext';
import { createClient } from '@/lib/supabase/client';

export default function KidsParentalControls() {
  const { user } = useAuth();
  const { activeProfile } = useProfile();
  const { hiddenTitles, unhideTitle, error: hiddenError } = useKidsControls();
  const [hasPin, setHasPin] = useState(false);
  const [loadingPin, setLoadingPin] = useState(true);
  const [pinLoadFailed, setPinLoadFailed] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [savingPin, setSavingPin] = useState(false);
  const [verifyingParent, setVerifyingParent] = useState(false);
  const [parentVerified, setParentVerified] = useState(false);
  const [message, setMessage] = useState('');
  const [pinError, setPinError] = useState('');
  const [busyTitle, setBusyTitle] = useState<string | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setLoadingPin(false);
      setPinError('Sign in to manage Kids parental controls.');
      return;
    }
    void createClient()
      .rpc('has_kids_pin')
      .then(({ data, error }: { data: boolean | null; error: Error | null }) => {
        if (cancelled) return;
        if (error) {
          setPinLoadFailed(true);
          setPinError('Could not load parental PIN settings.');
          return;
        }
        setHasPin(Boolean(data));
      })
      .catch(() => {
        if (!cancelled) {
          setPinLoadFailed(true);
          setPinError('Could not load parental PIN settings.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPin(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const needsParentVerification = activeProfile?.isKids && hasPin && !parentVerified;

  const verifyParent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPinError('');
    setVerifyingParent(true);
    try {
      const { data, error } = await createClient().rpc('verify_kids_pin', {
        p_pin: currentPin,
      });
      if (error) throw error;
      if (!data) {
        setPinError('That PIN is not correct.');
        return;
      }
      setParentVerified(true);
    } catch {
      setPinError('Could not verify the PIN. Please try again.');
    } finally {
      setVerifyingParent(false);
    }
  };

  const savePin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setPinError('');
    if (!/^\d{4,6}$/.test(newPin)) {
      setPinError('Choose a PIN with 4 to 6 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('The PIN entries do not match.');
      return;
    }
    if (hasPin && !/^\d{4,6}$/.test(currentPin)) {
      setPinError('Enter your current parental PIN to update it.');
      return;
    }

    setSavingPin(true);
    try {
      const { error } = hasPin
        ? await createClient().rpc('change_kids_pin', {
            p_current_pin: currentPin,
            p_new_pin: newPin,
          })
        : await createClient().rpc('set_kids_pin', { p_pin: newPin });
      if (error) throw error;
      setHasPin(true);
      setParentVerified(true);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setMessage(hasPin ? 'Parental PIN updated.' : 'Parental PIN saved to your account.');
    } catch {
      setPinError('Could not save the PIN. Please try again.');
    } finally {
      setSavingPin(false);
    }
  };

  const restoreTitle = async (mediaId: string, mediaType: 'movie' | 'tv') => {
    const key = `${mediaType}:${mediaId}`;
    setBusyTitle(key);
    await unhideTitle({ media_id: mediaId, media_type: mediaType });
    setBusyTitle(null);
  };

  return (
    <>
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl backdrop-blur-md md:p-8">
      <div className="mb-6 border-b border-zinc-800 pb-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400">
          Family safety
        </span>
        <h2 className="mt-0.5 text-xl font-extrabold text-white">Kids Parental Controls</h2>
        <p className="mt-1 text-xs text-zinc-400">
          Your PIN is securely hashed and saved with your account. Hidden titles are shared across devices.
        </p>
      </div>

      {loadingPin ? (
        <p className="text-sm text-zinc-400">Loading parental settings…</p>
      ) : pinLoadFailed ? (
        <p role="alert" className="text-sm text-rose-400">
          Could not load parental PIN settings. Refresh the page and try again.
        </p>
      ) : needsParentVerification ? (
        <p className="text-sm text-zinc-400">Verify the parent PIN to manage these settings.</p>
      ) : (
        <>
          <form onSubmit={savePin} className="max-w-xl space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {hasPin && (
                <label className="text-xs text-zinc-400">
                  Current parental PIN
                  <input
                    type="password"
                    inputMode="numeric"
                    autoComplete="current-password"
                    pattern="[0-9]{4,6}"
                    maxLength={6}
                    value={currentPin}
                    onChange={(event) => setCurrentPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm tracking-[0.35em] text-white outline-none focus:border-violet-500"
                  />
                </label>
              )}
              <label className="text-xs text-zinc-400">
                {hasPin ? 'New parental PIN' : 'Create a parental PIN'}
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  pattern="[0-9]{4,6}"
                  maxLength={6}
                  value={newPin}
                  onChange={(event) => setNewPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm tracking-[0.35em] text-white outline-none focus:border-violet-500"
                />
              </label>
              <label className="text-xs text-zinc-400">
                Confirm PIN
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  pattern="[0-9]{4,6}"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm tracking-[0.35em] text-white outline-none focus:border-violet-500"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={savingPin}
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
            >
              {savingPin ? 'Saving…' : hasPin ? 'Update parental PIN' : 'Set parental PIN'}
            </button>
          </form>

          <div className="mt-8 border-t border-zinc-800 pt-6">
            <h3 className="text-sm font-bold text-white">Hidden Kids titles</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Hidden titles no longer appear in Kids rows or catalogs. Restore one here any time.
            </p>
            {hiddenTitles.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500">No titles are hidden.</p>
            ) : (
              <ul className="mt-4 divide-y divide-zinc-800">
                {hiddenTitles.map((title) => {
                  const image = title.poster_path
                    ? `https://image.tmdb.org/t/p/w92${title.poster_path}`
                    : '/assets/images/no_image.png';
                  const key = `${title.media_type}:${title.media_id}`;
                  return (
                    <li key={key} className="flex items-center gap-3 py-3">
                      <Image
                        src={image}
                        alt=""
                        width={40}
                        height={56}
                        className="h-14 w-10 rounded object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{title.title}</p>
                        <p className="text-xs uppercase text-zinc-500">
                          {title.media_type === 'tv' ? 'Series' : 'Movie'}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={busyTitle === key}
                        onClick={() => void restoreTitle(title.media_id, title.media_type)}
                        className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-violet-500/50 hover:text-white disabled:opacity-50"
                      >
                        {busyTitle === key ? 'Restoring…' : 'Restore'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}

      {(pinError || hiddenError) && (
        <p role="alert" className="mt-4 text-sm text-rose-400">
          {pinError || hiddenError}
        </p>
      )}
      {message && <p role="status" className="mt-4 text-sm text-emerald-400">{message}</p>}
    </section>
    {portalReady && needsParentVerification && createPortal(
      <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/45 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-sm">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="parent-check-title"
          className="mt-4 w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950/95 p-5 shadow-2xl ring-1 ring-white/10 md:mt-8"
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400">
            Family safety
          </span>
          <h2 id="parent-check-title" className="mt-1 text-lg font-bold text-white">
            Parent verification
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Enter your PIN to manage Kids parental controls.
          </p>
          <form onSubmit={verifyParent} className="mt-5 space-y-3">
            <label htmlFor="parent-check-pin" className="block text-sm font-semibold text-white">
              Parental PIN
            </label>
            <input
              id="parent-check-pin"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              pattern="[0-9]{4,6}"
              maxLength={6}
              autoFocus
              value={currentPin}
              onChange={(event) => setCurrentPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-center text-lg tracking-[0.5em] text-white outline-none focus:border-violet-500"
            />
            {pinError && <p role="alert" className="text-sm text-rose-400">{pinError}</p>}
            <button
              type="submit"
              disabled={verifyingParent}
              className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-wait disabled:opacity-50"
            >
              {verifyingParent ? 'Verifying…' : 'Verify PIN'}
            </button>
          </form>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
