import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS, FONT_SCALE, SPACING, TYPOGRAPHY } from '../theme';
import Button from './Button';

type Props = { children: ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('Kerala Sellers render error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.wrap} accessibilityRole="alert">
        <Text style={styles.title} maxFontSizeMultiplier={FONT_SCALE.heading}>
          Kerala Sellers hit a snag
        </Text>
        <Text style={styles.body} maxFontSizeMultiplier={FONT_SCALE.body}>
          Close this screen and open the app again. Your shop data on the server is safe.
        </Text>
        <Button label="Try again" onPress={() => this.setState({ error: null })} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background,
    gap: SPACING.md,
  },
  title: { ...TYPOGRAPHY.title, color: COLORS.primary, textAlign: 'center' },
  body: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, textAlign: 'center' },
});
