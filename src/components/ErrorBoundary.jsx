import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './ErrorBoundary.css';

const RELOAD_FLAG = 'ik-chunk-reload';

// A code-split file that no longer exists (the site was updated while the tab was open)
const isStaleChunk = (error) =>
  /dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
    error?.message ?? '',
  );

function Fallback({ inline }) {
  const { dict } = useLanguage();
  if (inline) {
    return (
      <div className="error-fallback error-fallback--inline" role="status">
        <span className="error-fallback-code">{dict.errors.galleryUnavailable}</span>
      </div>
    );
  }
  return (
    <main className="error-fallback" role="alert">
      <span className="error-fallback-code">{dict.errors.title}</span>
      <p className="error-fallback-body">{dict.errors.body}</p>
      <button type="button" className="error-fallback-btn" onClick={() => window.location.reload()}>
        {dict.errors.reload}
      </button>
    </main>
  );
}

/**
 * Keeps one broken part from blanking the whole site. `resetKey` (e.g. the route) clears the
 * error on navigation; `inline` renders a small placeholder instead of a full-page message.
 */
export default class ErrorBoundary extends React.Component {
  state = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error) {
    return { error };
  }

  static getDerivedStateFromProps(props, state) {
    return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey } : null;
  }

  componentDidCatch(error) {
    if (isStaleChunk(error)) {
      // Load the new version once; if that fails too, show the message instead of looping
      try {
        if (!sessionStorage.getItem(RELOAD_FLAG)) {
          sessionStorage.setItem(RELOAD_FLAG, '1');
          window.location.reload();
          return;
        }
      } catch {
        /* storage blocked: fall through to the message */
      }
    }
    console.error(error);
  }

  render() {
    if (this.state.error) return <Fallback inline={this.props.inline} />;
    return this.props.children;
  }
}
