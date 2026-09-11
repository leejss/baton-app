import { useMainContext } from "@/features/stores/hooks/useMainContext";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { notificationQueries } from "@/features/notifications/api/notification.queries";
import { Pressable } from "@/shared/ui/Pressable";
import { Text } from "@/shared/ui/Text";
import { ArrowLeftS, NavNotification } from "@/shared/ui/icons";
import { radius, SCREEN_PADDING_X, spacing, useTheme } from "@/theme";

type MainHeaderProps = {
  title?: string;
  onBack?: () => void;
};

/** 제목이 없는 홈만 워드마크를 표시하며, 모든 메인 화면이 같은 조회를 사용한다. */
export function MainHeader({ title, onBack }: MainHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const context = useMainContext();
  const notifications = useQuery(
    notificationQueries.list({
      storeId: context.storeId,
      userId: context.userId,
    }),
  );
  const membership = context.membership;
  const storeLabel =
    membership &&
    `${membership.store.storeName} ${membership.store.branchName}`;
  const roleLabel = membership?.role === "MANAGER" ? "관리자" : "직원";
  const count = notifications.data?.unreadCount ?? 0;
  const badgeText = notifications.data?.badgeText ?? "";

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top },
        title !== undefined && { backgroundColor: theme.colors.background },
        onBack !== undefined && { backgroundColor: theme.colors.surface },
      ]}
    >
      <View style={styles.inner}>
        {title === undefined ? (
          <Image
            source={require("@/assets/images/home/baton-wordmark.svg")}
            contentFit="fill"
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no"
            style={styles.wordmark}
          />
        ) : (
          <View style={styles.titleGroup}>
            {onBack && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="뒤로 가기"
                onPress={onBack}
                hitSlop={10}
                style={styles.backButton}
              >
                <ArrowLeftS />
              </Pressable>
            )}
            <Text variant="subheading" weight="bold" style={styles.title}>
              {title}
            </Text>
          </View>
        )}
        <View style={styles.trailing}>
          {membership ? (
            <View
              accessibilityLabel={`${storeLabel}, ${roleLabel}`}
              style={[
                styles.storeTag,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.surfaceSunken,
                },
              ]}
            >
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                variant="caption"
                weight="medium"
                style={styles.storeName}
              >
                {storeLabel}
              </Text>
              <Text variant="caption" weight="medium">
                {" / "}
                {roleLabel}
              </Text>
            </View>
          ) : null}
          {notifications.isError && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="알림 다시 조회"
              onPress={() => void notifications.refetch()}
              style={styles.retry}
            >
              <Text variant="caption">알림 재조회</Text>
            </Pressable>
          )}
          <Pressable
            accessibilityLabel={
              count > 0 ? `알림, 읽지 않은 알림 ${badgeText}개` : "알림"
            }
            accessibilityRole="button"
            onPress={() => router.navigate("/notifications")}
            style={({ pressed }) => [
              styles.notificationButton,
              pressed && styles.pressed,
            ]}
          >
            <NavNotification color="navigationForeground" />
            {count > 0 && (
              <View
                style={[styles.badge, { backgroundColor: theme.colors.accent }]}
              >
                <Text
                  color="accentOn"
                  variant="caption"
                  weight="semibold"
                  style={styles.badgeText}
                >
                  {badgeText}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // TODO(design-system): Figma node 732:17460의 홈 배경, 62px 헤더와 10px 간격을 토큰으로 동기화한다.
  root: {
    minHeight: 62,
    backgroundColor: "#F1F6FF",
  },
  inner: {
    width: "100%",
    maxWidth: 393,
    minHeight: 62,
    paddingHorizontal: SCREEN_PADDING_X,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    paddingTop: 14,
    paddingBottom: 20,
  },
  wordmark: {
    width: 73,
    height: 20,
    flexShrink: 0,
  },
  title: { flexShrink: 0 },
  titleGroup: { flexDirection: "row", alignItems: "center", gap: 10 },
  backButton: {
    width: 24,
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  trailing: {
    minWidth: 0,
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  storeTag: {
    maxWidth: 200,
    minWidth: 0,
    flexShrink: 1,
    minHeight: 24,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  storeName: {
    flexShrink: 1,
    minWidth: 0,
  },
  notificationButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: -8,
  },
  badge: {
    position: "absolute",
    top: 3,
    right: 0,
    minWidth: 18,
    height: 18,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontVariant: ["tabular-nums"],
  },
  retry: { minHeight: 44, justifyContent: "center" },
  pressed: { opacity: 0.6 },
});
