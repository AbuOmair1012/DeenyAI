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
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { api } from "../../../services/api";
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
      // **bold**
      parts.push(
        <Text key={key++} style={[style, { fontWeight: "700" }]}>
          {match[2]}
        </Text>
      );
    } else if (match[3]) {
      // *italic*
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

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [title, setTitle] = useState("Chat");
  const flatListRef = useRef<FlatList>(null);

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
          {item.content}
        </FormattedText>
      </View>
    );
  };

  const renderFooter = () => {
    if (streamingText) {
      return (
        <View style={[styles.messageBubble, styles.assistantBubble]}>
          <View style={styles.assistantLabel}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <Text style={styles.assistantLabelText}>DeenyAI</Text>
          </View>
          <FormattedText style={[styles.messageText, styles.assistantText]}>
            {streamingText}
          </FormattedText>
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
            <Text style={styles.thinkingText}>Thinking...</Text>
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
            <Text style={styles.welcomeTitle}>Bismillah</Text>
            <Text style={styles.welcomeText}>
              Ask any Islamic question and I'll provide answers with authentic references based on your madhab.
            </Text>
          </View>
        }
        ListFooterComponent={renderFooter}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask a question..."
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
