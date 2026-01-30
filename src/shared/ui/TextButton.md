# TextButton 컴포넌트

`TextButton`은 시각적으로는 일반 텍스트처럼 보이지만, 클릭 가능한 인터랙션을 제공하는 버튼 컴포넌트입니다. 주로 헤더의 액션 버튼이나 폼의 보조 액션 등에 사용됩니다.

## 특징
- 배경색과 테두리가 없는 플랫한 디자인
- `active` 상태에서의 색상 변화 제공
- `disabled` 상태 지원
- 다양한 색상 변형(`variant`) 지원

## Props

| Prop | 타입 | 기본값 | 설명 |
| :--- | :--- | :--- | :--- |
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'success' \| 'surface'` | `'primary'` | 버튼의 색상 테마 |
| `children` | `React.ReactNode` | - | 버튼 내부 콘텐츠 |
| `className` | `string` | - | 추가 스타일링을 위한 클래스명 |
| `...props` | `ButtonHTMLAttributes` | - | 기타 표준 HTML 버튼 속성 |

## 사용 예시

```tsx
import { TextButton } from '@/shared/ui/TextButton';

// 기본 사용
<TextButton onClick={handleSave}>저장</TextButton>

// 색상 변형
<TextButton variant="danger">삭제</TextButton>

// 비활성화
<TextButton disabled>저장 중...</TextButton>

// 헤더 우측 버튼으로 사용 시 (추천 스타일)
<TextButton className="text-base font-medium">완료</TextButton>
```

## 디자인 가이드라인
- **텍스트 크기**: 헤더 액션으로 사용할 경우 `text-base` 또는 `text-lg`를 권장합니다.
- **폰트 두께**: 강조가 필요한 경우 `font-medium`을 사용합니다.
- **여백**: 버튼 자체에 패딩이 없으므로 필요한 경우 `className`을 통해 여백을 조절합니다.
