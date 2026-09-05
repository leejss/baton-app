/**
 * react-native-keyboard-controller는 네이티브 모듈이라 테스트 환경에서 import만 해도 던진다.
 * 패키지가 함께 배포하는 목(KeyboardAwareScrollView → ScrollView 등)으로 통째로 바꾼다.
 */
jest.mock('react-native-keyboard-controller', () =>
  require('react-native-keyboard-controller/jest'),
);
