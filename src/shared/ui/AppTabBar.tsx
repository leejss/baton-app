import type { ComponentType } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/shared/ui/Text';
import {
  NavCalendarFill,
  NavCalendarLine,
  NavHomeFill,
  NavHomeLine,
  NavMessageFill,
  NavMessageLine,
  NavUserFill,
  NavUserLine,
  Plus,
  type IconProps,
} from '@/shared/ui/icons';

export const APP_TAB_NAMES = ['home', 'schedules', 'handoffs', 'my'] as const;

export type AppTabName = (typeof APP_TAB_NAMES)[number];

type AppTabBarProps = {
  activeTab: AppTabName | null;
  onComposePress: () => void;
  onTabLongPress: (tab: AppTabName) => void;
  onTabPress: (tab: AppTabName) => void;
};

type TabButtonProps = {
  isSelected: boolean;
  name: AppTabName;
  onLongPress: (tab: AppTabName) => void;
  onPress: (tab: AppTabName) => void;
};

type TabItem = {
  ActiveIcon: ComponentType<IconProps>;
  InactiveIcon: ComponentType<IconProps>;
  label: string;
};

const TAB_ITEMS: Record<AppTabName, TabItem> = {
  home: { ActiveIcon: NavHomeFill, InactiveIcon: NavHomeLine, label: '홈' },
  schedules: {
    ActiveIcon: NavCalendarFill,
    InactiveIcon: NavCalendarLine,
    label: '근무표',
  },
  handoffs: {
    ActiveIcon: NavMessageFill,
    InactiveIcon: NavMessageLine,
    label: '인수인계',
  },
  my: { ActiveIcon: NavUserFill, InactiveIcon: NavUserLine, label: '마이페이지' },
};

const FIGMA_BOTTOM_PADDING = 40;

export function isAppTabName(value: string | undefined): value is AppTabName {
  return APP_TAB_NAMES.some((tabName) => tabName === value);
}

export function AppTabBar({
  activeTab,
  onComposePress,
  onTabLongPress,
  onTabPress,
}: AppTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, FIGMA_BOTTOM_PADDING);

  return (
    <View style={[styles.root, { paddingBottom: bottomPadding }]}>
      <View style={styles.row}>
        <TabButton
          name="home"
          isSelected={activeTab === 'home'}
          onPress={onTabPress}
          onLongPress={onTabLongPress}
        />
        <TabButton
          name="schedules"
          isSelected={activeTab === 'schedules'}
          onPress={onTabPress}
          onLongPress={onTabLongPress}
        />
        <Pressable
          accessibilityLabel="새 인수인계 작성"
          accessibilityRole="button"
          onPress={onComposePress}
          style={styles.composeButton}
        >
          <View style={styles.composeInner}>
            <Plus color="accentOn" />
          </View>
        </Pressable>
        <TabButton
          name="handoffs"
          isSelected={activeTab === 'handoffs'}
          onPress={onTabPress}
          onLongPress={onTabLongPress}
        />
        <TabButton
          name="my"
          isSelected={activeTab === 'my'}
          onPress={onTabPress}
          onLongPress={onTabLongPress}
        />
      </View>
    </View>
  );
}

function TabButton({ isSelected, name, onLongPress, onPress }: TabButtonProps) {
  const { ActiveIcon, InactiveIcon, label } = TAB_ITEMS[name];
  const Icon = isSelected ? ActiveIcon : InactiveIcon;
  const foregroundColor = isSelected ? 'accent' : 'navigationForeground';

  const handlePress = () => onPress(name);
  const handleLongPress = () => onLongPress(name);

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="tab"
      accessibilityState={{ selected: isSelected }}
      onLongPress={handleLongPress}
      onPress={handlePress}
      style={styles.tabButton}
    >
      <Icon color={foregroundColor} />
      <Text
        numberOfLines={1}
        variant="caption"
        weight="medium"
        color={foregroundColor}
        style={styles.tabLabel}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // TODO(design-system): 아래 값은 Figma node 13:1916이 현재 프로젝트 토큰과 달라 원본을 우선했다. 토큰 동기화가 필요하다.
  root: {
    minHeight: 102,
    paddingHorizontal: 18,
    paddingTop: 4,
    backgroundColor: '#FFFFFF',
    boxShadow: '0px -2px 3.5px 0px rgba(0, 0, 0, 0.04)',
  },
  row: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabButton: {
    width: 45,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    lineHeight: 13,
  },
  composeButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: '#F3F4F6',
  },
  composeInner: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    backgroundColor: '#2563EB',
  },
});
