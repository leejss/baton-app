/**
 * 라이브러리가 제공하는 공식 목. 네이티브 모듈이 없는 Jest 환경에서
 * `react-native-keyboard-controller`를 import 하면 "doesn't seem to be linked"로 터진다.
 *
 * `shared/ui`의 `BottomActionBar`가 이 패키지를 쓰기 때문에 하단 바를 그리는
 * 모든 화면 테스트가 영향을 받는다. 테스트마다 `jest.mock`을 적는 대신
 * node_modules 옆 `__mocks__`에 두어 Jest가 자동으로 집어가게 한다.
 */
module.exports = jest.requireActual('react-native-keyboard-controller/jest');
