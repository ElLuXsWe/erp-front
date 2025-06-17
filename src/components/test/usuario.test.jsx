import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import Usuario from '../Usuarios/Usuario';  // Ajusta la ruta y el nombre según tu estructura

describe('Usuario - componentes básicos', () => {
  test('campo nombre editable y botón guardado', () => {
    render(<Usuario />);

    // Abrimos el modal clickeando el botón "+"
    const btnAgregar = screen.getByRole('button', { name: /➕/i });
    fireEvent.click(btnAgregar);

    // Localizamos el modal usando el título "Agregar Usuario"
    const modal = screen.getByText('Agregar Usuario').closest('.modal-content');
    expect(modal).toBeInTheDocument();

    // Ahora buscamos el input "Nombre" SOLO dentro del modal para evitar confusión
    const nombreInput = within(modal).getByPlaceholderText(/^Nombre$/i);  // Exacto "Nombre"
    expect(nombreInput).toBeInTheDocument();

    // Cambiamos el valor del input nombre
    fireEvent.change(nombreInput, { target: { value: 'Juan' } });
    expect(nombreInput.value).toBe('Juan');

    // Buscamos y clickeamos el botón Guardar dentro del modal
    const btnGuardar = within(modal).getByRole('button', { name: /guardar/i });
    expect(btnGuardar).toBeInTheDocument();
    fireEvent.click(btnGuardar);

    // Puedes agregar aquí más asserts según comportamiento esperado (modal cierra, usuario creado, etc)
  });
});
