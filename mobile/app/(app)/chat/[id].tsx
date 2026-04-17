import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { api } from "../../../services/api";
import { useLanguage } from "../../../hooks/useLanguage";
import { colors } from "../../../theme/colors";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

function FormattedText({ children, style }: { children: string; style?: any }) {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(children)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <Text key={key++} style={style}>
          {children.slice(lastIndex, match.index)}
        </Text>
      );
    }

    if (match[2]) {
      parts.push(
        <Text key={key++} style={[style, { fontWeight: "700" }]}>
          {match[2]}
        </Text>
      );
    } else if (match[3]) {
      parts.push(
        <Text key={key++} style={[style, { fontStyle: "italic" }]}>
          {match[3]}
        </Text>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < children.length) {
    parts.push(
      <Text key={key++} style={style}>
        {children.slice(lastIndex)}
      </Text>
    );
  }

  return <Text style={style}>{parts}</Text>;
}

function parseMessageParts(content: string): { body: string; refs: string | null } {
  // Split on the references separator the AI outputs
  const sepIndex = content.search(/\n---\n📚|\n📚 \*\*References|📚 \*\*References/);
  if (sepIndex !== -1) {
    return {
      body: content.slice(0, sepIndex).trim(),
      refs: content.slice(sepIndex).replace(/^\n---\n/, "").trim(),
    };
  }
  return { body: content, refs: null };
}

function RefsCard({ content }: { content: string }) {
  const lines = content
    .split("\n")
    .filter((l) => l.trim().length > 0 && !l.startsWith("📚") && !l.startsWith("**References"));

  return (
    <View style={refStyles.card}>
      <View style={refStyles.header}>
        <Ionicons name="book-outline" size={14} color={colors.primary} />
        <Text style={refStyles.headerText}>References & Sources</Text>
      </View>
      {lines.map((line, i) => {
        const urlMatch = line.match(/https?:\/\/[^\s)>\]]+/);
        const url = urlMatch ? urlMatch[0].replace(/[.,;]+$/, "") : null;
        const displayText = line
          .replace(/\*\*/g, "")
          .replace(/https?:\/\/[^\s)>\]]+/, "")
          .replace(/\|\s*$/, "")
          .trim();

        if (url) {
          return (
            <TouchableOpacity
              key={i}
              style={refStyles.refRowTappable}
              onPress={() => Linking.openURL(url)}
              activeOpacity={0.6}
            >
              <View style={refStyles.refRowInner}>
                <Text style={refStyles.refLine}>{displayText}</Text>
                <View style={refStyles.openBadge}>
                  <Ionicons name="open-outline" size={12} color={colors.white} />
                  <Text style={refStyles.openBadgeText}>Open</Text>
                </View>
              </View>
              <Text style={refStyles.urlText} numberOfLines={1}>
                {url.replace(/^https?:\/\/(www\.)?/, "")}
              </Text>
            </TouchableOpacity>
          );
        }

        return (
          <View key={i} style={refStyles.refRow}>
            <Text style={refStyles.refLine}>{displayText}</Text>
          </View>
        );
      })}
    </View>
  );
}

const refStyles = StyleSheet.create({
  card: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#0F503A30",
    paddingTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  headerText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  refRow: {
    marginBottom: 6,
    paddingLeft: 4,
  },
  refRowTappable: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: "#EBF2EE",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#0F503A20",
  },
  refRowInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  refLine: {
    fontSize: 12,
    color: "#333",
    lineHeight: 17,
    flex: 1,
  },
  openBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  openBadgeText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: "600",
  },
  urlText: {
    fontSize: 10,
    color: colors.primary,
    marginTop: 3,
    textDecorationLine: "underline",
  },
});

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [title, setTitle] = useState("Chat");
  const flatListRef = useRef<FlatList>(null);
  const t = useLanguage((s) => s.t);
  const isRTL = useLanguage((s) => s.isRTL);

  useEffect(() => {
    loadMessages();
  }, [id]);

  const loadMessages = async () => {
    try {
      const session = await api.getSession(id);
      setMessages(session.messages || []);
      setTitle(session.title || "Chat");
    } catch (error) {
      console.error("Load messages error:", error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput("");
    setSending(true);
    setStreamingText("");

    // Optimistically add user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    scrollToBottom();

    try {
      const token = await SecureStore.getItemAsync("token");
      const url = api.sendMessageUrl(id);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);

        let fullText = "";
        let lastIndex = 0;

        xhr.onprogress = () => {
          const newData = xhr.responseText.substring(lastIndex);
          lastIndex = xhr.responseText.length;

          const lines = newData.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.text) {
                  fullText += data.text;
                  setStreamingText(fullText);
                  scrollToBottom();
                }
                if (data.done) {
                  const assistantMsg: ChatMessage = {
                    id: `assistant-${Date.now()}`,
                    role: "assistant",
                    content: fullText,
                    createdAt: new Date().toISOString(),
                  };
                  setMessages((prev) => [...prev, assistantMsg]);
                  setStreamingText("");
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error("Failed to send message"));
          }
        };

        xhr.onerror = () => reject(new Error("Network error"));

        xhr.send(JSON.stringify({ content: userMessage }));
      });
    } catch (error) {
      console.error("Send message error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
      setStreamingText("");
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";
    const { body, refs } = isUser
      ? { body: item.content, refs: null }
      : parseMessageParts(item.content);

    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        {!isUser && (
          <View style={styles.assistantLabel}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <Text style={styles.assistantLabelText}>DeenyAI</Text>
          </View>
        )}
        <FormattedText
          style={[
            styles.messageText,
            isUser ? styles.userText : styles.assistantText,
          ]}
        >
          {body}
        </FormattedText>
        {refs && <RefsCard content={refs} />}
      </View>
    );
  };

  const renderFooter = () => {
    if (streamingText) {
      const { body, refs } = parseMessageParts(streamingText);
      return (
        <View style={[styles.messageBubble, styles.assistantBubble]}>
          <View style={styles.assistantLabel}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <Text style={styles.assistantLabelText}>DeenyAI</Text>
          </View>
          <FormattedText style={[styles.messageText, styles.assistantText]}>
            {body}
          </FormattedText>
          {refs && <RefsCard content={refs} />}
        </View>
      );
    }

    if (sending) {
      return (
        <View style={[styles.messageBubble, styles.assistantBubble]}>
          <View style={styles.assistantLabel}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <Text style={styles.assistantLabelText}>DeenyAI</Text>
          </View>
          <View style={styles.thinkingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.thinkingText}>{t.thinking}</Text>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: title.length > 25 ? title.slice(0, 22) + "..." : title,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.white,
        }}
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={scrollToBottom}
        ListEmptyComponent={
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>{t.bismillah}</Text>
            <Text style={[styles.welcomeText, isRTL && styles.rtlText]}>
              {t.welcomeText}
            </Text>
          </View>
        }
        ListFooterComponent={renderFooter}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={t.askQuestion}
          placeholderTextColor={colors.textLight}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={2000}
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || sending) && styles.sendDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="send" size={20} color={colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  messageList: { padding: 16, paddingBottom: 8 },
  welcomeContainer: {
    alignItems: "center",
    padding: 32,
    marginTop: 60,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  rtlText: { textAlign: "right" },
  messageBubble: {
    maxWidth: "85%",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  userBubble: {
    backgroundColor: colors.userBubble,
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: colors.assistantBubble,
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  assistantLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 4,
  },
  assistantLabelText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  messageText: { fontSize: 15, lineHeight: 22 },
  userText: { color: colors.white },
  assistantText: { color: colors.text },
  thinkingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  thinkingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    paddingBottom: Platform.OS === "ios" ? 28 : 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    maxHeight: 120,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendDisabled: { opacity: 0.4 },
});
