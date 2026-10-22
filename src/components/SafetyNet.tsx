import { Component, type ReactNode } from 'react';

/** If a screen fails while drawing, shows a plain message and a way out instead
 *  of a blank page (house style §5). Keyed by the screen in App, so moving
 *  elsewhere starts afresh. The work itself is saved by the store, outside
 *  this, so nothing is lost. Without `onLibrary` (on the Library itself, or the
 *  standalone Backtimer) the way out is reloading the page. */
export class SafetyNet extends Component<{ children: ReactNode; what: string; onLibrary?: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    const { what, onLibrary } = this.props;
    return (
      <div className="card safety-net" role="alert">
        <p>Sorry, this screen couldn’t be shown. Your {what} still saved in this browser.</p>
        {onLibrary
          ? <button className="btn btn-secondary" onClick={onLibrary}>Go to the Library</button>
          : <button className="btn btn-secondary" onClick={() => window.location.reload()}>Reload the page</button>}
      </div>
    );
  }
}
