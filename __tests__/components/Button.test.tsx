import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/ui/Button';

describe('Button Component', () => {
  test('renders correctly with title', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={() => {}} />
    );
    
    expect(getByText('Test Button')).toBeTruthy();
  });

  test('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button title="Test Button" onPress={mockOnPress} />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  test('applies primary variant styles by default', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={() => {}} />
    );
    
    const button = getByText('Test Button').parent;
    expect(button?.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#0EA5E9' })
      ])
    );
  });

  test('applies secondary variant styles', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={() => {}} variant="secondary" />
    );
    
    const button = getByText('Test Button').parent;
    expect(button?.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#10B981' })
      ])
    );
  });

  test('applies danger variant styles', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={() => {}} variant="danger" />
    );
    
    const button = getByText('Test Button').parent;
    expect(button?.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#EF4444' })
      ])
    );
  });

  test('is disabled when disabled prop is true', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button title="Test Button" onPress={mockOnPress} disabled />
    );
    
    const button = getByText('Test Button').parent;
    fireEvent.press(button);
    
    expect(mockOnPress).not.toHaveBeenCalled();
    expect(button?.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#9CA3AF' })
      ])
    );
  });

  test('applies custom styles', () => {
    const customStyle = { marginTop: 20 };
    const { getByText } = render(
      <Button title="Test Button" onPress={() => {}} style={customStyle} />
    );
    
    const button = getByText('Test Button').parent;
    expect(button?.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining(customStyle)
      ])
    );
  });
});