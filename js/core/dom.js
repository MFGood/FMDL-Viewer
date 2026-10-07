// dom.js — small DOM helpers shared by the UI modules.

/** The element with this id. */
export const $ = (id) => document.getElementById(id);

/** The current value of a CSS custom property on the page (theme colours). */
export const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** Create an element: el('div', { class: 'x', title: 'y' }, child, 'text', ...). null children are skipped. */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') node.className = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) if (child != null) node.append(child);
  return node;
}

let checkboxCount = 0;
/** A labelled checkbox. Returns { input, label }; onChange(checked) runs when it's toggled. */
export function checkbox(text, checked, onChange) {
  const id = `checkbox-${checkboxCount++}`;
  const input = el('input', { type: 'checkbox', id });
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));
  return { input, label: el('label', { class: 'chk', for: id }, input, text) };
}

/** A row of toggle buttons (kits, skin colours): items are { label, title?, on, onClick }. */
export function buttonRow(container, items) {
  container.textContent = '';
  for (const item of items) {
    const button = el('button', { type: 'button', class: item.on ? 'kit on' : 'kit', 'aria-pressed': String(item.on) }, item.label);
    if (item.title) button.title = item.title;
    button.addEventListener('click', item.onClick);
    container.append(button);
  }
}

/** True if a key press is going into a text field rather than to the viewer. */
export const isTyping = (target) => !!target?.closest?.('textarea, select, input:not([type=checkbox]):not([type=radio])');

/** Load a classic script (for libraries that aren't ES modules) once. */
const scripts = new Map();
export function loadScript(src) {
  if (!scripts.has(src)) {
    scripts.set(src, new Promise((resolve, reject) => {
      const script = el('script', { src });
      script.onload = resolve;
      script.onerror = () => { scripts.delete(src); reject(new Error(`couldn't load ${src}`)); };
      document.head.append(script);
    }));
  }
  return scripts.get(src);
}
