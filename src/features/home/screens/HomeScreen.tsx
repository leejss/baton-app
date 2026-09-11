import { useMainContext } from "@/features/stores/hooks/useMainContext";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import { HandoffCard } from "@/features/home/components/HandoffCard";
import { WeekScheduleCard } from "@/features/home/components/WeekScheduleCard";
import { getTodayInSeoul } from "@/features/home/lib/homeDate";
import { MainHeader } from "@/features/tabs/components/MainHeader";
import { Text } from "@/shared/ui";
import { spacing } from "@/theme";

type HomeScreenProps = {
  initialDate?: string;
};

export function HomeScreen({
  initialDate = getTodayInSeoul(),
}: HomeScreenProps) {
  const router = useRouter();

  const context = useMainContext();
  const handleHandoffDetailsPress = () =>
    router.navigate("/handoffs?scope=ALL");
  const handleScheduleDetailsPress = (selectedDate: string) =>
    router.navigate({ pathname: "/schedules", params: { selectedDate } });
  const handleCreateHandoff = (recipientId: number) =>
    router.push({
      pathname: "/handoffs/new",
      params: { recipientId: String(recipientId) },
    });

  return (
    <View style={styles.root}>
      <MainHeader />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <Text weight="semibold" style={styles.greeting}>
            {context.profile.displayName}님
          </Text>

          <View style={styles.cards}>
            <HandoffCard
              date={initialDate}
              storeId={context.membership.store.id}
              onDetailsPress={handleHandoffDetailsPress}
            />
            <WeekScheduleCard
              currentUserId={context.profile.id}

              initialDate={initialDate}
              storeId={context.membership.store.id}
              onCreateHandoff={handleCreateHandoff}
              onDetailsPress={handleScheduleDetailsPress}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // TODO(design-system): Figma node 732:17460의 홈 전용 배경과 393px 기준 폭은 공용 토큰에 없다.
  root: {
    flex: 1,
    backgroundColor: "#F1F6FF",
  },
  fullPageState: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    alignItems: "center",
    paddingTop: spacing.xs,
    paddingHorizontal: 18,
    paddingBottom: 52,
  },
  content: {
    width: "100%",
    maxWidth: 357,
    gap: 22,
  },
  greeting: {
    // TODO(design-system): Figma node 732:17465의 22px Bold는 토큰/폰트가 없어 Semibold로 대체한다.
    fontSize: 22,
    lineHeight: 32,
    color: "#000000",
  },
  cards: {
    gap: spacing.md,
  },
});
