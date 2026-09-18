# 프로필 이미지

프로필 이미지 원본은 이 폴더에서 관리한다.

| 원본 | 서버 프로필 키 | 용도 |
| --- | --- | --- |
| `manager.png` | `DEFAULT_MANAGER` | 관리자 |
| `employee.png` | `DEFAULT_EMPLOYEE` | 직원 |
| `default.png` | `DEFAULT_01` | 기본 프로필·수신자 미선택 |

코드에서 이미지 경로와 키를 연결하는 단일 기준은
`src/shared/ui/profileImageAssets.ts`다. 화면에서 원본 경로를 직접 `require`하거나
별도의 매핑을 만들지 않고 `getProfileImageSource`를 사용한다.
프로필 키가 없고 역할만 있는 화면 모델은 `getRoleProfileImageSource`를 사용한다.

이미지를 교체할 때는 이 폴더의 원본을 교체한다. 경로나 서버 키가 변경될 때만
`profileImageAssets.ts`의 매핑을 수정한다.
`assets/images/illustrations`의 역할 SVG는 별도의 일러스트이며 프로필에 사용하지 않는다.
