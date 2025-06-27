import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input } from '@/components/ui/Input';

describe('Input Component', () => {
  test('renders correctly with label', () => {
    const { getByText, getByDisplayValue } = render(
      <Input label="Test Label" value="test value" onChangeText={() => {}} />
    );
    
    expect(getByText('Test Label')).toBeTruthy();
    expect(getByDisplayValue('test value')).toBeTruthy();
  });

  test('shows required indicator when required', () => {
    const { getByText } = render(
      <Input label="Test Label" value="" onChangeText={() => {}} required />
    );
    
    expect(getByText('*')).toBeTruthy();
  });

  test('displays error message', () => {
    const { getByText } = render(
      <Input 
        label="Test Label" 
        value="" 
        onChangeText={() => {}} 
        error="This field is required" 
      />
    );
    
    expect(getByText('This field is required')).toBeTruthy();
  });

  test('calls onChangeText when text changes', () => {
    const mockOnChangeText = jest.fn();
    const { getByDisplayValue } = render(
      <Input label="Test Label" value="initial" onChangeText={mockOnChangeText} />
    );
    
    const input = getByDisplayValue('initial');
    fireEvent.changeText(input, 'new value');
    
    expect(mockOnChangeText).toHaveBeenCalledWith('new value');
  });

  test('applies error styles when error is present', () => {
    const { getByDisplayValue } = render(
      <Input 
        label="Test Label" 
        value="test" 
        onChangeText={() => {}} 
        error="Error message" 
      />
    );
    
    const input = getByDisplayValue('test');
    expect(input.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ borderColor: '#EF4444' })
      ])
    );
  });

  test('handles secure text entry', () => {
    const { getByDisplayValue } = render(
      <Input 
        label="Password" 
        value="password123" 
        onChangeText={() => {}} 
        secureTextEntry 
      />
    );
    
    const input = getByDisplayValue('password123');
    expect(input.props.secureTextEntry).toBe(true);
  });
});