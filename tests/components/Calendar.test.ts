import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Calendar from '../../src/lib/components/calendar/Calendar.svelte';

describe('Calendar component', () => {
  it('renders the calendar title', () => {
    const { getByText } = render(Calendar);
    expect(getByText(/Calendrier des événements/i)).toBeTruthy();
  });

  it('renders weekday headers', () => {
    const { container } = render(Calendar);
    const headers = container.querySelectorAll('.calendar-weekday-header');
    expect(headers.length).toBe(7);
  });
});
