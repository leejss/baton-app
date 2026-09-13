# 매장 온보딩 — 기획서·시안·계약이 서로 어긋나는 지점

> 대상: `02-store.md`(STORE-01~07) · `03-invitation.md`(INV-01~03) · Figma `초대코드` 섹션(`943:111629`) · wiki `openapi.yaml`·`api-spec.md`
> 작성 시점: 2026-09-11, 매장 온보딩 8개 화면 퍼블리싱 + API 연동 작업 중 확인한 것.
> 구현은 **계약(wiki) > 시안(Figma) > 기획서(md)** 순으로 따랐다. 그 순서를 벗어난 판단은 아래에 이유를 적었다.

---

## 1. 기획서 제안과 실제 계약이 다른 것 (계약을 따름)

| # | 기획서(`03-invitation.md` §4) | 실제 계약 | 영향 |
|---|---|---|---|
| 1 | `GET/POST /stores/{storeId}/invitation` | `.../invitation-code` | 경로 자체가 다름 |
| 2 | `{ replaceExisting: boolean }` | `{ replaceCurrent: true }` (`const: true`) | 필드명·타입 모두 다름. `false`를 보낼 수 없다 |
| 3 | `InvitationCode.status: 'active' \| 'revoked' \| 'expired'` | `ACTIVE \| EXPIRED \| REVOKED` | 대문자 |
| 4 | `code: string`(자리수 미정, §6-1 "확인 필요") | **숫자 4자리** `^[0-9]{4}$` | 확인 필요 항목이 이미 확정돼 있었다 |
| 5 | `storeId: string` | `number` | |
| 6 | §6-2 "1회용 vs 24시간 내 다회용 미정" | **다회용** (`requirements.md:108` "여러 직원이 사용할 수 있다") | 확정돼 있었다 |

`02-store.md` §4도 같다 — `GET /invitations/{code}`로 제안했지만 실제는 `POST /stores/join/preview`이고, `role`은 `'admin'|'staff'`가 아니라 `MANAGER|EMPLOYEE`다.

덧붙여 `02-store.md` §6-3("이미 소속된 사용자 처리 미정")도 이미 해소돼 있다 — 시안(`943:111954`)에 팝업이 있고 서버도 `STORE_ALREADY_JOINED`로 구분해 내려준다.

**정리 제안**: 두 md의 §4(API·데이터)는 "구현 제안"이라고 명시돼 있으니, 계약이 확정된 지금은 삭제하거나 wiki `api-spec.md` 링크로 대체하는 편이 안전하다. 지금 상태로는 나중에 보는 사람이 제안을 계약으로 오해한다.

---

## 2. 기획서에 없는데 계약에 있는 것 (화면 설계에 영향)

1. **매장 생성 시 최초 초대 코드가 자동 발급된다.**
   `POST /stores` 응답에 `initialInvitationCode` + `invitationCodeIssueStatus`(`ISSUED`|`ISSUE_FAILED`)가 실려 온다.
   → `03-invitation.md`는 "INV-02 초대코드 생성 버튼"을 기본 동작으로 보지만, 실제로는 생성 직후 이미 코드가 있는 상태가 정상이다.
2. **코드 발급만 실패해도 매장·관리자 멤버십은 만들어진다.**
   → 완료 화면은 **코드 없는 상태**를 반드시 그려야 한다. 구현에서 `invitationCode: string | null`로 받고 코드 영역을 통째로 숨긴다.
3. **`GET .../invitation-code`는 코드가 없어도 `200` + `data: null`이다.**
   `api-spec.md` §597이 프론트 함정으로 따로 적어둔 항목. 오류 경로로 빠뜨리면 "코드 없음"이 에러 화면이 된다.
4. **재발급 실패 시 기존 코드가 유지된다**(원자적 교체). 실패했다고 화면의 기존 코드를 지우면 안 된다.

---

## 3. 시안과 기획서가 어긋나는 것

### 3-1. 재발급 버튼의 위치 (설계 판단이 바뀐 지점)

`03-invitation.md`는 INV-01~03(조회·발급·복사)을 **한 화면**으로 묶는다. 그런데 시안 "02 매장 생성 완료"(`943:112076`)에는 **재발급 버튼이 없고**, 대신 이렇게 적혀 있다.

> 초대 코드는 발급 후 24시간 동안 유효해요
> **설정에서 언제든 새 코드를 발급할 수 있어요**

즉 시안은 역할을 나눠 뒀다 — **생성 완료 화면은 표시·복사만, 재발급은 설정 화면**. 구현도 그렇게 했다.
남은 문제: **설정의 직원 초대 화면(SET-07~09) 시안이 이 섹션에 없다.** 재발급 UI와 "기존 코드 폐기 확인" 다이얼로그가 어떻게 생겼는지 아직 모른다. → 디자인 확인 필요.

### 3-2. 매장 참여 확인 화면에 관리자 이름을 채울 수 없다

시안 "02 초대 매장 확인"(`943:111783`)은 매장 카드에 **주소 / 관리자 / 연락처** 3행을 그린다.
그런데 `POST /stores/join/preview` 응답(`StoreInvitationPreview`)에는 **관리자 이름이 없다** —
`storeId, storeName, branchName, address, detailAddress, storeContact, invitationCode, expiresAt`이 전부다.

구현에서는 관리자 행을 **생략**했다(값 없이 빈 행을 그리면 정보가 비어 보인다).
→ 서버에 `managerName` 추가를 요청하거나, 디자인에서 이 행을 빼야 한다. **둘 중 하나를 정해야 한다.**

### 3-3. 시안의 아이콘이 의미와 맞지 않는다

`943:112087` 매장 카드의 세 행 아이콘이 **주소=캘린더, 관리자=시계, 연락처=시계**다(에셋 SVG를 직접 받아 확인했다).
컴포넌트 이름도 `Calendar Icon`/`Clock Icon`으로 남아 있다. 다른 화면에서 복사해 온 흔적으로 보인다.
구현은 `MapPinArea`/`User`/`Phone`으로 바꿨다. → 시안 수정 필요.

### 3-4. 시안 오타

- `943:111980` 진입 선택 화면: "매장을 만들고 **관라자**로 시작해요" → `관리자`. 구현은 고쳐서 넣었다.

### 3-5. 진입 선택 화면에 기능 ID가 없다

`02-store.md` §2의 화면 표에는 있지만(`매장 참여·생성 선택`), 자기 기능 ID 없이 "STORE-01 출력"으로만 달려 있다.
시안에서는 `(추가) 진입 선택 화면`이라는 독립 프레임이다. ID를 붙일지 정해야 한다.

---

## 4. 디자인 시스템 토큰과 어긋나는 것

| 시안 값 | 우리 토큰 | 처리 |
|---|---|---|
| `border/default` #D1D5DB (gray300) | `borderDefault` = gray300 #D1D5DB | Figma semantic `borderDefault`로 정렬 완료 |
| `foreground/subtle` #9CA3AF (gray400) | `foregroundSubtle` = gray400 #9CA3AF | Figma semantic `foregroundSubtle`로 정렬 완료 |
| `foreground/strong` #1F2937 (gray800) | `foregroundStrong` = gray800 #1F2937 | Figma semantic `foregroundStrong`로 정렬 완료 |
| `radius/xl` 24 (Banner Button) | radius 스케일에 24가 없음 (8·12·20) | 컴포넌트 로컬 상수로 둠 |
| spacing `xs` 6, `xl` 20 | 우리 스케일은 4의 배수 | 컴포넌트 로컬 상수로 둠 |

컬러는 Figma local variable을 SoT로 삼아 `src/theme/colors.ts`의 Figma 경로 기반 토큰으로
정렬했다. Figma에 바인딩되지 않은 화면 특화 raw color는 공통 테마에 넣지 않고 해당 화면에
예외로 유지한다(CLAUDE.md §4.3).

---

## 5. 아직 못 채운 것

- **일러스트 2종**: 매장 생성 완료(160×138), 매장 참여 완료(266×249)가 아직 회색 사각형이다.
  진입 선택 배너 2개는 Figma MCP에서 SVG를 받아 적용했다(`features/stores/components/illustrations`).
  관리자 쪽 원본이 13조각으로 나뉘어 있어 좌표대로 합쳤고, 한 조각의 `mix-blend-multiply`는
  react-native-svg가 지원하지 않아 빠졌다 — 겹치는 부분이 시안보다 아주 조금 밝다.
- **설정 → 직원 초대 화면**(SET-07~09): 시안 없음. 3-1 참고.
- **예외 케이스 정의**: 두 md 모두 `STORE-0x-Exx`, `INV-0x-Exx`의 실제 정의가 비어 있다. 구현은 계약의 HTTP 상태·errorCode로 분기했다.
  - `404 STORE_INVITATION_INVALID` → 코드 입력 오류 표시
  - `409 STORE_ALREADY_JOINED` → "이미 소속된 매장이 있어요" 모달 (문구는 시안 `943:111954`에 있다)
- **사용자에게 보이는 오류 문구 중 계약·시안 어디에도 없는 것 2개**: 확인 화면에서 코드가 만료된 경우, 매장 생성 실패. 임시 문구로 채워 뒀으니 기획 확정이 필요하다.
