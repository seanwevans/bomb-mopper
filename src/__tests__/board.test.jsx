import React from 'react';
import { render, cleanup } from '@testing-library/react';
import App from '../App.jsx';

afterEach(() => {
  cleanup();
});

test('initializes board with correct number of cells', () => {
  const { container, unmount } = render(<App />);
  const cells = container.querySelectorAll('.cell');
  // beginner difficulty is 9x9
  expect(cells).toHaveLength(81);
  unmount();
});
