import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { ExpandableSearchField } from './expandable-search-field';
it('accepts caller content and restores focus after cancellation', async () => {
 const user=userEvent.setup(); const change=vi.fn();
 render(<ExpandableSearchField label="Find resources" placeholder="Caller placeholder" leading={<span>Prefix</span>} cancelIcon={<span>Dismiss</span>} cancelLabel="Cancel lookup" onValueChange={change} />);
 const trigger=screen.getByRole('button',{name:'Find resources'});
 await user.click(trigger);
 const input=screen.getByRole('searchbox',{name:'Find resources'});
 expect(input).toHaveFocus();
 expect(input).toHaveAttribute('placeholder','Caller placeholder');
 await user.type(input,'abc');
 expect(change).toHaveBeenLastCalledWith('abc');
 await user.click(screen.getByRole('button',{name:'Cancel lookup'}));
 expect(change).toHaveBeenLastCalledWith('');
 expect(trigger).toHaveFocus();
 expect(trigger).toHaveAttribute('aria-expanded','false');
});
it('does not open when disabled',async()=>{
 const user=userEvent.setup();render(<ExpandableSearchField label="Disabled lookup" disabled />);
 await user.click(screen.getByRole('button',{name:'Disabled lookup'}));
 expect(screen.getByRole('button')).toHaveAttribute('aria-expanded','false');
});
