import { mount } from 'svelte';
import { describe, it, expect } from 'vitest';
import Calendar from '../../src/lib/components/calendar/Calendar.svelte';


describe('Calendar Component', () => {
  it('should render without crashing', () => {
    const { container } = mount(Calendar, {
      target: document.body,
    }) as any;
    expect(container).toBeDefined();
  });
});