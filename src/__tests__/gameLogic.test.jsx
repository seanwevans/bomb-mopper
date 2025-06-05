import React from 'react';
import { render, fireEvent, cleanup } from '@testing-library/react';
import App from '../App.jsx';

afterEach(() => {
  cleanup();
});

// helper to patch Math.random
function withMockedRandom(values, fn) {
  const original = Math.random;
  let index = 0;
  Math.random = () => {
    const val = values[index] ?? values[values.length - 1];
    index += 1;
    return val;
  };
  try {
    return fn();
  } finally {
    Math.random = original;
  }
}

test('loses when clicking a mine', () => {
  const randomValues = [
    0.05, 0.166,
    0.05, 0.388,
    0.166, 0.166,
    0.166, 0.5,
    0.277, 0.388,
    0.611, 0.611,
    0.722, 0.722,
    0.95, 0.944,
    0.833, 0.833,
    0.95, 0.05,
  ];

  withMockedRandom(randomValues, () => {
    const { container, getByText, unmount } = render(<App />);
    const cells = container.querySelectorAll('[data-testid="cell"]');
    // first click to initialize mines at known locations
    fireEvent.click(cells[0]);
    // click a known mine cell (row 8 col 0 -> index 8*9)
    fireEvent.click(cells[8 * 9]);
    expect(getByText('😵')).toBeInTheDocument();
    unmount();
  });
});

test('wins when all safe cells are revealed', () => {
  const randomValues = [
    0.05, 0.166,
    0.05, 0.388,
    0.166, 0.166,
    0.166, 0.5,
    0.277, 0.388,
    0.611, 0.611,
    0.722, 0.722,
    0.95, 0.944,
    0.833, 0.833,
    0.95, 0.05,
  ];

  withMockedRandom(randomValues, () => {
    const { container, getByText, unmount } = render(<App />);
    const cells = container.querySelectorAll('[data-testid="cell"]');
    fireEvent.click(cells[0]); // first click

    // reveal all cells except known mines
    const mineIndices = [1, 3, 10, 13, 21, 50, 60, 80, 70, 72];
    cells.forEach((cell, index) => {
      if (!mineIndices.includes(index)) {
        fireEvent.click(cell);
      }
    });

    expect(getByText('😎')).toBeInTheDocument();
    unmount();
  });
});
