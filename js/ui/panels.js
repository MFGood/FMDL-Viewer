// panels.js — the panels laid over the details pane (settings, capture, export check), each opened and closed
// by a header button. One is open at a time; Esc or its close button closes it. The settings also close on a
// click outside; the others stay open so the view can be moved and players picked while they're open.

const panels = [];

/**
 * Add a panel: { panel, button, close (its close button), outsideCloses, onOpen }. Returns { open, close, isOpen, toggle }.
 */
export function addPanel({ panel, button, close, outsideCloses = false, onOpen = () => {} }) {
  const isOpen = () => !panel.hidden;
  const setOpen = (open) => {
    if (open) for (const other of panels) if (other.panel !== panel && other.isOpen()) other.setOpen(false);
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    if (open) onOpen();
  };
  const entry = { panel, isOpen, setOpen };
  panels.push(entry);
  button.addEventListener('click', () => setOpen(!isOpen()));
  close.addEventListener('click', () => { setOpen(false); button.focus(); });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) { setOpen(false); button.focus(); }
  });
  if (outsideCloses) addEventListener('pointerdown', (e) => {
    if (isOpen() && !panel.contains(e.target) && !button.contains(e.target)) setOpen(false);
  });
  return { open: () => setOpen(true), close: () => setOpen(false), isOpen, toggle: () => setOpen(!isOpen()) };
}
