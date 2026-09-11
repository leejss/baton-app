import { Tabs, useRouter } from 'expo-router';

import { ROUTES } from '@/shared/lib/routes';
import { AppTabBar, isAppTabName, type AppTabName } from '@/shared/ui/AppTabBar';

export function AppTabs() {
  const router = useRouter();

  return (
    <Tabs
      backBehavior="history"
      initialRouteName="home"
      screenOptions={{ headerShown: false }}
      tabBar={({ navigation, state }) => {
        const activeRouteName = state.routes[state.index]?.name;
        const activeTab = isAppTabName(activeRouteName) ? activeRouteName : 'home';

        const handleTabPress = (tab: AppTabName) => {
          const route = state.routes.find(({ name }) => name === tab);
          if (route === undefined) return;

          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const handleTabLongPress = (tab: AppTabName) => {
          const route = state.routes.find(({ name }) => name === tab);
          if (route === undefined) return;

          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        const handleComposePress = () => router.push(ROUTES.handoffs.new.index);

        return (
          <AppTabBar
            activeTab={activeTab}
            onComposePress={handleComposePress}
            onTabLongPress={handleTabLongPress}
            onTabPress={handleTabPress}
          />
        );
      }}
    >
      <Tabs.Screen name="home" options={{ title: '홈' }} />
      <Tabs.Screen name="schedules" options={{ title: '근무표' }} />
      <Tabs.Screen name="handoffs" options={{ title: '인수인계' }} />
      <Tabs.Screen name="my" options={{ title: '마이페이지' }} />
    </Tabs>
  );
}
