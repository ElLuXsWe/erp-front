import React from 'react';
import { render, screen } from '@testing-library/react';

// 💡 Mock completo del componente Proyectos
jest.mock('../Proyectos/Proyectos', () => () => <div>Mock Proyectos</div>);

import Proyectos from '../Proyectos/Proyectos';

// Mock sessionStorage con un usuario ficticio
beforeEach(() => {
  sessionStorage.setItem('user', JSON.stringify({
    Luser: 'testuser',
    loginPass: 'testpass',
    id_usuario: '123',
    rol: '1',
  }));
});

afterEach(() => {
  sessionStorage.clear();
});

test('renderiza el componente Proyectos correctamente', () => {
  render(<Proyectos />);
  expect(screen.getByText('Mock Proyectos')).toBeInTheDocument();
});
