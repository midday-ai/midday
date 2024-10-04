/* eslint-disable max-lines-per-function */
import React from 'react';
import { Text } from 'react-native';

import { cleanup, fireEvent, render, screen } from '@/core/test-utils';

import { Button } from './button';

afterEach(cleanup);

describe('Button component ', () => {
  it('should render correctly ', () => {
    render(<Button testID="button" />);
    expect(screen.getByTestId('button')).toBeOnTheScreen();
  });
  it('should render correctly if we add explicit child ', () => {
    render(
      <Button testID="button">
        <Text> Custom child </Text>
      </Button>
    );
    expect(screen.getByText('Custom child')).toBeOnTheScreen();
  });
  it('should render the label correctly', () => {
    render(<Button testID="button" label="Submit" />);
    expect(screen.getByTestId('button')).toBeOnTheScreen();
    expect(screen.getByText('Submit')).toBeOnTheScreen();
  });
  it('should render the loading indicator correctly', () => {
    render(<Button testID="button" loading={true} />);
    expect(screen.getByTestId('button')).toBeOnTheScreen();
    expect(screen.getByTestId('button-activity-indicator')).toBeOnTheScreen();
  });
  it('should call onClick handler when clicked', () => {
    const onClick = jest.fn();
    render(
      <Button testID="button" label="Click the button" onPress={onClick} />
    );
    expect(screen.getByTestId('button')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
  it('should be disabled when loading', () => {
    const onClick = jest.fn();
    render(
      <Button
        testID="button"
        loading={true}
        label="Click the button"
        onPress={onClick}
      />
    );
    expect(screen.getByTestId('button')).toBeOnTheScreen();
    expect(screen.getByTestId('button-activity-indicator')).toBeOnTheScreen();
    expect(screen.getByTestId('button')).toBeDisabled();
    fireEvent.press(screen.getByTestId('button'));
    expect(onClick).toHaveBeenCalledTimes(0);
  });
  it('should be disabled when disabled prop is true', () => {
    render(<Button testID="button" disabled={true} />);
    expect(screen.getByTestId('button')).toBeDisabled();
  });
  it("shouldn't call onClick when disabled", () => {
    const onClick = jest.fn();
    render(
      <Button
        testID="button"
        label="Click the button"
        disabled={true}
        onPress={onClick}
        variant="secondary"
      />
    );
    expect(screen.getByTestId('button')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('button'));

    expect(screen.getByTestId('button')).toBeDisabled();

    expect(onClick).toHaveBeenCalledTimes(0);
  });
  it('should apply correct styles based on size prop', () => {
    render(<Button testID="button" size="lg" />);
    const button = screen.getByTestId('button');
    // TODO: should be fixed to use haveStyle instead of comparing the class name
    const expectedStyle =
      'font-inter font-semibold text-white dark:text-black text-xl';
    const receivedStyle =
      button.props.children[0].props.children.props.className;
    expect(receivedStyle).toContain(expectedStyle);
  });
  it('should apply correct styles for label when variant is secondary', () => {
    render(<Button testID="button" variant="secondary" label="Submit" />);
    const button = screen.getByTestId('button');

    const expectedStyle =
      'font-inter font-semibold text-secondary-600 text-base';
    const receivedStyle =
      button.props.children[0].props.children.props.className;
    expect(receivedStyle).toContain(expectedStyle);
  });
  it('should apply correct styles for label when is disabled', () => {
    render(<Button testID="button" label="Submit" disabled />);
    const button = screen.getByTestId('button');

    const expectedStyle =
      'font-inter font-semibold text-base text-neutral-600 dark:text-neutral-600';
    const receivedStyle =
      button.props.children[0].props.children.props.className;
    expect(receivedStyle).toContain(expectedStyle);
  });
});
