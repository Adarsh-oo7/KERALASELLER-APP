import React, { useMemo, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, FONT_SCALE, MIN_TOUCH_TARGET, RADIUS, SPACING, TYPOGRAPHY } from '../theme';
import { toEditorHtml } from '../lib/htmlDescription';

type Props = {
  value: string;
  onChange: (html: string) => void;
};

type Tool = {
  id: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  command: string;
  arg?: string;
};

const TOOLS: Tool[] = [
  { id: 'bold', label: 'Bold', icon: 'bold', command: 'bold' },
  { id: 'italic', label: 'Italic', icon: 'italic', command: 'italic' },
  { id: 'underline', label: 'Underline', icon: 'underline', command: 'underline' },
  { id: 'ul', label: 'List', icon: 'list-outline', command: 'insertUnorderedList' },
  { id: 'ol', label: 'Numbers', icon: 'list', command: 'insertOrderedList' },
  { id: 'h2', label: 'Heading', command: 'formatBlock', arg: 'h2' },
  { id: 'small', label: 'A-', command: 'fontSize', arg: '2' },
  { id: 'normal', label: 'A', command: 'fontSize', arg: '3' },
  { id: 'large', label: 'A+', command: 'fontSize', arg: '5' },
];

function editorSource(initial: string): string {
  const html = toEditorHtml(initial);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<style>
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #14241f;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 16px;
    line-height: 1.5;
  }
  #editor {
    min-height: 180px;
    padding: 12px;
    outline: none;
  }
  #editor:empty:before {
    content: "Write what the product is, who it is for, fabric or ingredients, size, and how to use it.";
    color: #9aa39e;
  }
  h2 { font-size: 20px; margin: 0 0 8px; }
  h3 { font-size: 17px; margin: 0 0 8px; }
  p { margin: 0 0 8px; }
  ul, ol { margin: 0 0 8px; padding-left: 20px; }
</style>
</head>
<body>
  <div id="editor" contenteditable="true">${html}</div>
  <script>
    const editor = document.getElementById('editor');
    function send() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'html', html: editor.innerHTML }));
      }
    }
    editor.addEventListener('input', send);
    editor.addEventListener('keyup', send);
    editor.addEventListener('blur', send);
  </script>
</body>
</html>`;
}

export default function DescriptionEditor({ value, onChange }: Props) {
  const webRef = useRef<WebView>(null);
  const source = useMemo(() => ({ html: editorSource(value) }), []);

  const run = (command: string, arg?: string) => {
    const argument = arg == null ? 'null' : JSON.stringify(arg);
    webRef.current?.injectJavaScript(
      `document.execCommand(${JSON.stringify(command)}, false, ${argument}); document.getElementById('editor').dispatchEvent(new Event('input')); true;`,
    );
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label} maxFontSizeMultiplier={FONT_SCALE.body}>
        Description *
      </Text>
      <Text style={styles.helper}>
        Required. Tell buyers everything about this product. Use bold, lists, and font size so it is easy to read.
      </Text>
      <View style={styles.toolbar}>
        {TOOLS.map((tool) => (
          <TouchableOpacity
            key={tool.id}
            onPress={() => run(tool.command, tool.arg)}
            style={styles.tool}
            accessibilityRole="button"
            accessibilityLabel={tool.label}
          >
            {tool.icon ? (
              <Ionicons name={tool.icon} size={16} color={COLORS.primary} />
            ) : (
              <Text style={styles.toolText}>{tool.label}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.editor}>
        <WebView
          ref={webRef}
          originWhitelist={['*']}
          source={source}
          hideKeyboardAccessoryView
          keyboardDisplayRequiresUserAction={false}
          nestedScrollEnabled
          scrollEnabled
          style={styles.web}
          onMessage={(event) => {
            try {
              const payload = JSON.parse(event.nativeEvent.data) as { html?: string };
              if (typeof payload.html === 'string') onChange(payload.html);
            } catch {
              onChange(event.nativeEvent.data);
            }
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: SPACING.sm },
  label: {
    ...TYPOGRAPHY.label,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  helper: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  tool: {
    minWidth: MIN_TOUCH_TARGET - 4,
    minHeight: MIN_TOUCH_TARGET - 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  toolText: {
    ...TYPOGRAPHY.label,
    color: COLORS.primary,
  },
  editor: {
    minHeight: 220,
    height: 220,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  web: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
});
