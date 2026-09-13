import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { SearchField } from "./components/state-components";
import { ExpandableSearchField } from "./components/expandable-search-field";
import { Icon } from "./components/icon";
import "./search-bridge.css";

// Adapt static prototype data handlers to the same React components as the sample.
const forward = (input: HTMLInputElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
};
for (const kind of ['task', 'workflow']) {
  const control = document.querySelector<HTMLElement>(`[data-section-id=${kind}-search-control]`);
  if (!control) continue;
  const input = control.querySelector('input')!;
  const action = control.querySelector<HTMLButtonElement>(`[data-section-id=${kind}-search-action]`)!;
  const close = control.querySelector<HTMLButtonElement>(`[data-section-id=${kind}-search-clear]`)!;
  // Existing handlers keep their references; React owns the visible controls.
  control.replaceChildren();
  control.classList.add('wsr-search-bridge-sidebar');
  function SidebarAdapter() {
    const [open, setOpen] = useState(control!.dataset.open === 'true');
    useEffect(() => {
      const observer = new MutationObserver(() => setOpen(control!.dataset.open === 'true'));
      observer.observe(control!, {attributes:true,attributeFilter:['data-open']});
      return () => observer.disconnect();
    }, []);
    return <ExpandableSearchField label={action.getAttribute('aria-label') || input.placeholder} placeholder={input.placeholder}
      leading={<Icon name="search" />} cancelIcon={<Icon name="x" />} cancelLabel={close.getAttribute('aria-label') || '关闭搜索'}
      data-section-id={`${kind}-search-input`}
      triggerProps={{'data-section-id': `${kind}-search-action`} as React.ButtonHTMLAttributes<HTMLButtonElement>}
      cancelProps={{'data-section-id': `${kind}-search-clear`} as React.ButtonHTMLAttributes<HTMLButtonElement>}
      expanded={open} onValueChange={value => forward(input,value)} onExpandedChange={value => {
        if (value !== (control!.dataset.open === 'true')) (value ? action : close).click();
        setOpen(value);
      }} />;
  }
  createRoot(control).render(<SidebarAdapter />);
}
for (const selector of ['#browser-search', '[data-section-id=plan-dag-search] input']) {
  const input = document.querySelector<HTMLInputElement>(selector);
  if (!input) continue;
  const label = input.parentElement!;
  const seat = document.createElement('div');
  seat.className = 'wsr-search-bridge-seat';
  label.replaceWith(seat);
  const dag = selector.includes('dag');
  if (dag) seat.dataset.sectionId = 'plan-dag-search';
  createRoot(seat).render(<SearchField label={input.getAttribute('aria-label') || '搜索节点'} hideLabel size="compact"
    id={input.id || undefined} data-section-id={input.dataset.sectionId}
    leading={dag ? label.querySelector('span')?.textContent : <Icon name="search" />} placeholder={input.placeholder}
    onChange={event => forward(input,event.target.value)} />);
}
