import React, { useEffect, useRef, useState } from 'react';
import { uploadProjectImage, validateImage } from '../../lib/adminData';

/**
 * Image field for the admin editors. Shows a preview of whatever path is
 * currently stored — so an existing image loads in place — and otherwise a
 * drop zone that takes a new file. Uploading writes to Firebase Storage and
 * lifts the resulting public URL via `onChange`, so the stored value is still
 * just a path string and nothing downstream had to change.
 *
 * The underlying path stays editable behind a toggle: some images are local
 * (/assets/…) and typed by hand, and pasting a URL must keep working.
 */
const ImageUpload = ({ value, onChange, slug, label = 'Featured image', hint }) => {
  const [state, setState] = useState('idle'); // idle | uploading | error
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [showPath, setShowPath] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const inputRef = useRef(null);

  // a changed path is a different image — let it try to load again
  useEffect(() => {
    setLoadFailed(false);
  }, [value]);

  const upload = async (file) => {
    const invalid = validateImage(file);
    if (invalid) {
      setError(invalid);
      setState('error');
      return;
    }
    setState('uploading');
    setError(null);
    setProgress(0);
    try {
      const { url } = await uploadProjectImage(file, slug, setProgress);
      onChange(url);
      setState('idle');
    } catch (e) {
      setError(e.message || 'Upload failed.');
      setState('error');
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  const onPick = (e) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = ''; // let the same file be re-picked after a failure
  };

  const hasImage = Boolean(value) && !loadFailed;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1.5">
        <label className="block text-[11px] font-medium tracking-wide text-dark-400">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowPath((s) => !s)}
          className="ml-auto text-[11px] text-dark-500 hover:text-dark-300 transition-colors"
        >
          {showPath ? 'Hide path' : 'Edit path'}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[11px] text-dark-500 hover:text-red-400 transition-colors"
          >
            Remove
          </button>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => state !== 'uploading' && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={`relative overflow-hidden rounded-lg border border-dashed transition-colors cursor-pointer ${
          dragging
            ? 'border-primary-500 bg-primary-500/[0.06]'
            : 'border-white/15 bg-dark-950 hover:border-white/25'
        } ${hasImage ? 'aspect-video' : 'py-8'}`}
      >
        {hasImage ? (
          <>
            <img
              src={value}
              alt=""
              onError={() => setLoadFailed(true)}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* hover affordance over an existing image */}
            <div className="absolute inset-0 bg-dark-950/70 opacity-0 hover:opacity-100 transition-opacity grid place-items-center">
              <span className="text-[12px] font-medium text-dark-100">
                Click or drop to replace
              </span>
            </div>
          </>
        ) : (
          <div className="text-center px-4">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-6 h-6 mx-auto mb-2 text-dark-500"
              aria-hidden="true"
            >
              <path
                d="M4 16.5V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1.5Zm0 0 4.5-4.5 3 3M14 14l2-2 4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="14.5" cy="8.5" r="1.5" fill="currentColor" />
            </svg>
            <p className="text-[12px] text-dark-300">
              {value && loadFailed ? 'Image didn’t load' : 'Drop an image, or click to choose'}
            </p>
            <p className="text-[11px] text-dark-500 mt-0.5">
              {value && loadFailed
                ? 'The stored path may be wrong — upload a new one or edit it below.'
                : 'PNG, JPEG, WebP, GIF or SVG · up to 8MB'}
            </p>
          </div>
        )}

        {state === 'uploading' && (
          <div className="absolute inset-0 bg-dark-950/85 grid place-items-center px-6">
            <div className="w-full max-w-[220px]">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-[12px] text-dark-200">Uploading…</span>
                <span className="font-mono text-[11px] text-dark-400 tabular-nums">
                  {progress}%
                </span>
              </div>
              <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary-500 transition-[width] duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
        onChange={onPick}
        className="hidden"
      />

      {error && <p className="mt-1.5 text-[11px] text-red-400">{error}</p>}

      {showPath && (
        <input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/assets/images/… or a full URL"
          className="mt-2 w-full bg-dark-900 border border-white/10 rounded-lg px-3 py-2 text-dark-50 text-[12px] font-mono placeholder:text-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
        />
      )}

      {hint && !showPath && <p className="mt-1.5 text-[11px] text-dark-500">{hint}</p>}
    </div>
  );
};

export default ImageUpload;
