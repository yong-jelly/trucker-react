# 서류 & 보험 아이템 이미지 생성 프롬프트

80~90년대 일본 애니메이션 황금기 스타일의 셀 애니메이션 룩을 유지하면서,
물리적 존재감이 느껴지는 서류와 보험 아이템 이미지를 생성하기 위한 프롬프트입니다.

---

## 공통 설정 (FIXED)

### [PROMPT BASE]
```
A high-quality game item illustration in a late-80s to 90s Japanese anime & manga golden-era style,
hand-drawn cel animation look with bold clean outlines, flat-to-2step cel shading, slightly warm vintage palette, subtle film grain,
DESIGNED AS A PHYSICAL OBJECT: {SUBJECT}, {ITEM_TYPE},
visual style: masculine "industrial & bureaucratic" vibe, technical and functional look, readable silhouette, designed like a premium hobby model kit accessory,
details: {CORE_VISUAL}, thick paper texture, realistic paper weight, metal fasteners, rubber stamp ink bleed (no text),
geometric elements: intricate circular seals, square stamps, bold stripes, and abstract data blocks (strictly no letters or numbers),
colorway: {COLORWAY}, signature pattern: {SIGNATURE}, condition: {CONDITION}, add-ons: {EXTRA},
view: top-down slightly isometric perspective, centered, consistent scale,
background: clean off-white seamless studio backdrop, soft studio lighting, gentle shadow under the object,
no text, no logos, no watermark, no UI, high resolution, consistent style.
```

### [NEGATIVE]
```
blurry, lowres, noisy, jpeg artifacts, watermark, signature, text, letters, numbers, alphabet, logo, UI, 
frame, cropped, out of frame, photorealistic, 3d render, glossy modern digital art, 
cluttered background, hands, people, messy shapes, deformed geometry
```

---

## 📄 서류 (Documents) - 5종

### 1. 표준 이륜차 면허 (Standard Bicycle License)
**파일명**: `doc-standard-license.png`

```
# [ARGS]
SUBJECT = "표준 이륜차 면허 (국가 발행 기본 운송 자격증)"
ITEM_TYPE = "LICENSE (Official Government Document)"
CORE_VISUAL = "단단한 플라스틱 카드 + 금속 클립으로 고정된 얇은 규정 요약지 + 홀로그램 보안 스티커"
COLORWAY = "메인: 오프화이트(카드), 보조1: 네이비 블루(정부 직인 영역), 보조2: 실버(홀로그램)"
SIGNATURE = "좌측 상단 원형 국가 인장(기하학 독수리 실루엣), 우측 하단 바코드 패턴(수평선 집합), 중앙 가로선 2줄"
CONDITION = "brand new, pristine, official-looking"
EXTRA = "카드 모서리 라운딩 처리, 뒷면 자기 띠 살짝 보임, 미세한 엠보싱 질감"

# [FULL PROMPT]
A high-quality game item illustration in a late-80s to 90s Japanese anime & manga golden-era style,
hand-drawn cel animation look with bold clean outlines, flat-to-2step cel shading, slightly warm vintage palette, subtle film grain,
DESIGNED AS A PHYSICAL OBJECT: 표준 이륜차 면허 (국가 발행 기본 운송 자격증), LICENSE (Official Government Document),
visual style: masculine "industrial & bureaucratic" vibe, technical and functional look, readable silhouette, designed like a premium hobby model kit accessory,
details: 단단한 플라스틱 카드 + 금속 클립으로 고정된 얇은 규정 요약지 + 홀로그램 보안 스티커, thick paper texture, realistic paper weight, metal fasteners, rubber stamp ink bleed (no text),
geometric elements: intricate circular seals, square stamps, bold stripes, and abstract data blocks (strictly no letters or numbers),
colorway: 메인: 오프화이트(카드), 보조1: 네이비 블루(정부 직인 영역), 보조2: 실버(홀로그램), 
signature pattern: 좌측 상단 원형 국가 인장(기하학 독수리 실루엣), 우측 하단 바코드 패턴(수평선 집합), 중앙 가로선 2줄, 
condition: brand new, pristine, official-looking, 
add-ons: 카드 모서리 라운딩 처리, 뒷면 자기 띠 살짝 보임, 미세한 엠보싱 질감,
view: top-down slightly isometric perspective, centered, consistent scale,
background: clean off-white seamless studio backdrop, soft studio lighting, gentle shadow under the object,
no text, no logos, no watermark, no UI, high resolution, consistent style.
```

---

### 2. 위험물 취급 인가증 (Hazardous Materials Permit)
**파일명**: `doc-hazmat-permit.png`

```
# [ARGS]
SUBJECT = "위험물 취급 인가증 (화학물질 및 폭발성 화물 운송 허가)"
ITEM_TYPE = "PERMIT (Heavy-Duty Official Document)"
CORE_VISUAL = "두꺼운 마닐라지 폴더 + 금속 바인더 클립 + 노란색-검정색 사선 경고 스트라이프 테이프 + 봉인된 규정집"
COLORWAY = "메인: 빈티지 베이지(종이), 보조1: 세이프티 옐로(경고), 보조2: 인디고 블루(정부 직인)"
SIGNATURE = "우측 상단 원형 위험물 기하학 인장(삼각형 내 원), 하단 굵은 검정색 바코드 패턴, 좌측 중앙 붉은색 다이아몬드 스탬프"
CONDITION = "worn edges, slightly yellowed paper, official and weathered"
EXTRA = "폴더 사이로 삐져나온 여러 장의 서류 레이어, 스테이플러 심 노출, 보안용 홀로그램 스티커(삼각형 패턴)"

# [FULL PROMPT]
A high-quality game item illustration in a late-80s to 90s Japanese anime & manga golden-era style,
hand-drawn cel animation look with bold clean outlines, flat-to-2step cel shading, slightly warm vintage palette, subtle film grain,
DESIGNED AS A PHYSICAL OBJECT: 위험물 취급 인가증 (화학물질 및 폭발성 화물 운송 허가), PERMIT (Heavy-Duty Official Document),
visual style: masculine "industrial & bureaucratic" vibe, technical and functional look, readable silhouette, designed like a premium hobby model kit accessory,
details: 두꺼운 마닐라지 폴더 + 금속 바인더 클립 + 노란색-검정색 사선 경고 스트라이프 테이프 + 봉인된 규정집, thick paper texture, realistic paper weight, metal fasteners, rubber stamp ink bleed (no text),
geometric elements: intricate circular seals, square stamps, bold stripes, and abstract data blocks (strictly no letters or numbers),
colorway: 메인: 빈티지 베이지(종이), 보조1: 세이프티 옐로(경고), 보조2: 인디고 블루(정부 직인),
signature pattern: 우측 상단 원형 위험물 기하학 인장(삼각형 내 원), 하단 굵은 검정색 바코드 패턴, 좌측 중앙 붉은색 다이아몬드 스탬프,
condition: worn edges, slightly yellowed paper, official and weathered,
add-ons: 폴더 사이로 삐져나온 여러 장의 서류 레이어, 스테이플러 심 노출, 보안용 홀로그램 스티커(삼각형 패턴),
view: top-down slightly isometric perspective, centered, consistent scale,
background: clean off-white seamless studio backdrop, soft studio lighting, gentle shadow under the object,
no text, no logos, no watermark, no UI, high resolution, consistent style.
```

---

### 3. 위조된 통행증 (Forged Transit Pass)
**파일명**: `doc-forged-pass.png`

```
# [ARGS]
SUBJECT = "위조된 통행증 (암시장 출처의 조잡한 복제 서류)"
ITEM_TYPE = "ILLEGAL (Counterfeit Document)"
CORE_VISUAL = "조잡하게 복사된 종이 뭉치 + 보라색 잉크 번짐 + 커피 얼룩 + 구겨진 모서리 + 손으로 자른 듯한 가장자리"
COLORWAY = "메인: 탁한 회색(저질 복사), 보조1: 딥 퍼플(번진 잉크), 보조2: 다크 브라운(얼룩/오염)"
SIGNATURE = "중앙 번진 원형 스탬프(불완전), 무질서하게 찍힌 사각형 점들, 대각선으로 긁힌 자국"
CONDITION = "damaged, suspicious, clearly unofficial"
EXTRA = "종이 뭉치를 묶은 낡은 고무줄, 한쪽 모서리가 불에 그을린 자국, 접힌 자국 여러 개"

# [FULL PROMPT]
A high-quality game item illustration in a late-80s to 90s Japanese anime & manga golden-era style,
hand-drawn cel animation look with bold clean outlines, flat-to-2step cel shading, slightly warm vintage palette, subtle film grain,
DESIGNED AS A PHYSICAL OBJECT: 위조된 통행증 (암시장 출처의 조잡한 복제 서류), ILLEGAL (Counterfeit Document),
visual style: masculine "industrial & bureaucratic" vibe, technical and functional look, readable silhouette, designed like a premium hobby model kit accessory,
details: 조잡하게 복사된 종이 뭉치 + 보라색 잉크 번짐 + 커피 얼룩 + 구겨진 모서리 + 손으로 자른 듯한 가장자리, thick paper texture, realistic paper weight, metal fasteners, rubber stamp ink bleed (no text),
geometric elements: intricate circular seals, square stamps, bold stripes, and abstract data blocks (strictly no letters or numbers),
colorway: 메인: 탁한 회색(저질 복사), 보조1: 딥 퍼플(번진 잉크), 보조2: 다크 브라운(얼룩/오염),
signature pattern: 중앙 번진 원형 스탬프(불완전), 무질서하게 찍힌 사각형 점들, 대각선으로 긁힌 자국,
condition: damaged, suspicious, clearly unofficial,
add-ons: 종이 뭉치를 묶은 낡은 고무줄, 한쪽 모서리가 불에 그을린 자국, 접힌 자국 여러 개,
view: top-down slightly isometric perspective, centered, consistent scale,
background: clean off-white seamless studio backdrop, soft studio lighting, gentle shadow under the object,
no text, no logos, no watermark, no UI, high resolution, consistent style.
```

---

### 4. 혈액 운송 긴급 칙령 (Emergency Blood Transit Decree)
**파일명**: `doc-emergency-decree.png`

```
# [ARGS]
SUBJECT = "혈액 운송 긴급 칙령 (국가 비상사태 시 발행되는 최고 권한 문서)"
ITEM_TYPE = "RELIC (Supreme Authority Document)"
CORE_VISUAL = "금박 테두리의 고급 양피지 + 붉은 왁스 봉인 + 금속 인장 메달 + 리본으로 묶인 두루마리 형태"
COLORWAY = "메인: 아이보리(양피지), 보조1: 딥 크림슨(왁스/리본), 보조2: 앤틱 골드(금박/메달)"
SIGNATURE = "중앙 상단 대형 원형 국새(독수리와 십자가 조합), 하단 좌우 대칭 기하학 문양, 금색 코너 장식"
CONDITION = "pristine, ceremonial, extremely rare"
EXTRA = "문서를 보관하는 가죽 튜브 케이스 일부 노출, 왁스 봉인에 찍힌 문장(기하학), 양피지 가장자리 금박 처리"

# [FULL PROMPT]
A high-quality game item illustration in a late-80s to 90s Japanese anime & manga golden-era style,
hand-drawn cel animation look with bold clean outlines, flat-to-2step cel shading, slightly warm vintage palette, subtle film grain,
DESIGNED AS A PHYSICAL OBJECT: 혈액 운송 긴급 칙령 (국가 비상사태 시 발행되는 최고 권한 문서), RELIC (Supreme Authority Document),
visual style: masculine "industrial & bureaucratic" vibe, technical and functional look, readable silhouette, designed like a premium hobby model kit accessory,
details: 금박 테두리의 고급 양피지 + 붉은 왁스 봉인 + 금속 인장 메달 + 리본으로 묶인 두루마리 형태, thick paper texture, realistic paper weight, metal fasteners, rubber stamp ink bleed (no text),
geometric elements: intricate circular seals, square stamps, bold stripes, and abstract data blocks (strictly no letters or numbers),
colorway: 메인: 아이보리(양피지), 보조1: 딥 크림슨(왁스/리본), 보조2: 앤틱 골드(금박/메달),
signature pattern: 중앙 상단 대형 원형 국새(독수리와 십자가 조합), 하단 좌우 대칭 기하학 문양, 금색 코너 장식,
condition: pristine, ceremonial, extremely rare,
add-ons: 문서를 보관하는 가죽 튜브 케이스 일부 노출, 왁스 봉인에 찍힌 문장(기하학), 양피지 가장자리 금박 처리,
view: top-down slightly isometric perspective, centered, consistent scale,
background: clean off-white seamless studio backdrop, soft studio lighting, gentle shadow under the object,
no text, no logos, no watermark, no UI, high resolution, consistent style.
```

---

### 5. 심야 통행 허가서 (Nighttime Transit Permit)
**파일명**: `doc-night-permit.png`

```
# [ARGS]
SUBJECT = "심야 통행 허가서 (22:00~06:00 도심 진입 특별 허가)"
ITEM_TYPE = "PERMIT (Time-Restricted Access Document)"
CORE_VISUAL = "어두운 색상의 카드형 허가증 + 야광 반사 스트라이프 + 시계 기하학 문양 + 체인으로 연결된 ID 홀더"
COLORWAY = "메인: 미드나잇 블루(카드), 보조1: 네온 옐로(야광 반사), 보조2: 실버(체인/메탈)"
SIGNATURE = "중앙 원형 시계 기어 문양(달과 별 실루엣), 상하단 반사 스트라이프 2줄, 좌측 육각형 인장"
CONDITION = "used but maintained, reflective elements visible"
EXTRA = "카드에 연결된 금속 체인과 클립, 뒷면에 부착된 야광 스티커, 홀더 플라스틱 케이스"

# [FULL PROMPT]
A high-quality game item illustration in a late-80s to 90s Japanese anime & manga golden-era style,
hand-drawn cel animation look with bold clean outlines, flat-to-2step cel shading, slightly warm vintage palette, subtle film grain,
DESIGNED AS A PHYSICAL OBJECT: 심야 통행 허가서 (22:00~06:00 도심 진입 특별 허가), PERMIT (Time-Restricted Access Document),
visual style: masculine "industrial & bureaucratic" vibe, technical and functional look, readable silhouette, designed like a premium hobby model kit accessory,
details: 어두운 색상의 카드형 허가증 + 야광 반사 스트라이프 + 시계 기하학 문양 + 체인으로 연결된 ID 홀더, thick paper texture, realistic paper weight, metal fasteners, rubber stamp ink bleed (no text),
geometric elements: intricate circular seals, square stamps, bold stripes, and abstract data blocks (strictly no letters or numbers),
colorway: 메인: 미드나잇 블루(카드), 보조1: 네온 옐로(야광 반사), 보조2: 실버(체인/메탈),
signature pattern: 중앙 원형 시계 기어 문양(달과 별 실루엣), 상하단 반사 스트라이프 2줄, 좌측 육각형 인장,
condition: used but maintained, reflective elements visible,
add-ons: 카드에 연결된 금속 체인과 클립, 뒷면에 부착된 야광 스티커, 홀더 플라스틱 케이스,
view: top-down slightly isometric perspective, centered, consistent scale,
background: clean off-white seamless studio backdrop, soft studio lighting, gentle shadow under the object,
no text, no logos, no watermark, no UI, high resolution, consistent style.
```

---

## 🛡️ 보험 (Insurances) - 5종

### 1. 혈소판 응고 촉진제 (Platelet Coagulant)
**파일명**: `ins-platelet-coagulant.png`

```
# [ARGS]
SUBJECT = "혈소판 응고 촉진제 (기초 사고 방어 보험 패키지)"
ITEM_TYPE = "BASIC INSURANCE (Medical-Industrial Hybrid)"
CORE_VISUAL = "의료용 알루미늄 케이스 + 내부 폼 패딩에 안착된 주사기 3개 + 붉은색 십자 마크(기하학) + 밀봉된 설명서"
COLORWAY = "메인: 클린 화이트(케이스), 보조1: 크림슨 레드(십자/라벨), 보조2: 메탈릭 실버(알루미늄)"
SIGNATURE = "케이스 상단 원형 의료 인장(십자가 내 심장 기하학), 측면 빨간 가로선 3줄, 모서리 경고 삼각형"
CONDITION = "sterile, factory-sealed, medical-grade"
EXTRA = "케이스 잠금 래치, 내부 온도 표시 스티커(기하학 온도계), 손잡이 부착"

# [FULL PROMPT]
A high-quality game item illustration in a late-80s to 90s Japanese anime & manga golden-era style,
hand-drawn cel animation look with bold clean outlines, flat-to-2step cel shading, slightly warm vintage palette, subtle film grain,
DESIGNED AS A PHYSICAL OBJECT: 혈소판 응고 촉진제 (기초 사고 방어 보험 패키지), BASIC INSURANCE (Medical-Industrial Hybrid),
visual style: masculine "industrial & bureaucratic" vibe, technical and functional look, readable silhouette, designed like a premium hobby model kit accessory,
details: 의료용 알루미늄 케이스 + 내부 폼 패딩에 안착된 주사기 3개 + 붉은색 십자 마크(기하학) + 밀봉된 설명서, thick paper texture, realistic paper weight, metal fasteners, rubber stamp ink bleed (no text),
geometric elements: intricate circular seals, square stamps, bold stripes, and abstract data blocks (strictly no letters or numbers),
colorway: 메인: 클린 화이트(케이스), 보조1: 크림슨 레드(십자/라벨), 보조2: 메탈릭 실버(알루미늄),
signature pattern: 케이스 상단 원형 의료 인장(십자가 내 심장 기하학), 측면 빨간 가로선 3줄, 모서리 경고 삼각형,
condition: sterile, factory-sealed, medical-grade,
add-ons: 케이스 잠금 래치, 내부 온도 표시 스티커(기하학 온도계), 손잡이 부착,
view: top-down slightly isometric perspective, centered, consistent scale,
background: clean off-white seamless studio backdrop, soft studio lighting, gentle shadow under the object,
no text, no logos, no watermark, no UI, high resolution, consistent style.
```

---

### 2. 인공 혈장 증량 팩 (Plasma Expander Pack)
**파일명**: `ins-plasma-expander.png`

```
# [ARGS]
SUBJECT = "인공 혈장 증량 팩 (지연 회복형 패널티 완충 보험)"
ITEM_TYPE = "RECOVERY INSURANCE (IV Drip Style Package)"
CORE_VISUAL = "투명 IV 백에 담긴 푸른색 액체 + 수액 튜브 + 플라스틱 클램프 + 휴대용 거치대 접이식"
COLORWAY = "메인: 투명(IV 백), 보조1: 스카이 블루(액체), 보조2: 화이트(클램프/거치대)"
SIGNATURE = "IV 백 상단 원형 의료 인장(파동 문양), 튜브에 파란색 눈금선 패턴, 거치대에 십자 마크"
CONDITION = "sterile, ready-to-use, hospital-grade"
EXTRA = "백에 연결된 주입 포트, 접이식 금속 스탠드, 보관용 지퍼백 일부 보임"

# [FULL PROMPT]
A high-quality game item illustration in a late-80s to 90s Japanese anime & manga golden-era style,
hand-drawn cel animation look with bold clean outlines, flat-to-2step cel shading, slightly warm vintage palette, subtle film grain,
DESIGNED AS A PHYSICAL OBJECT: 인공 혈장 증량 팩 (지연 회복형 패널티 완충 보험), RECOVERY INSURANCE (IV Drip Style Package),
visual style: masculine "industrial & bureaucratic" vibe, technical and functional look, readable silhouette, designed like a premium hobby model kit accessory,
details: 투명 IV 백에 담긴 푸른색 액체 + 수액 튜브 + 플라스틱 클램프 + 휴대용 거치대 접이식, thick paper texture, realistic paper weight, metal fasteners, rubber stamp ink bleed (no text),
geometric elements: intricate circular seals, square stamps, bold stripes, and abstract data blocks (strictly no letters or numbers),
colorway: 메인: 투명(IV 백), 보조1: 스카이 블루(액체), 보조2: 화이트(클램프/거치대),
signature pattern: IV 백 상단 원형 의료 인장(파동 문양), 튜브에 파란색 눈금선 패턴, 거치대에 십자 마크,
condition: sterile, ready-to-use, hospital-grade,
add-ons: 백에 연결된 주입 포트, 접이식 금속 스탠드, 보관용 지퍼백 일부 보임,
view: top-down slightly isometric perspective, centered, consistent scale,
background: clean off-white seamless studio backdrop, soft studio lighting, gentle shadow under the object,
no text, no logos, no watermark, no UI, high resolution, consistent style.
```

---

### 3. 항원 중화 항체 (Antigen Neutralizer)
**파일명**: `ins-antigen-neutralizer.png`

```
# [ARGS]
SUBJECT = "항원 중화 항체 (단속 벌금 대납 면역 보험)"
ITEM_TYPE = "IMMUNE INSURANCE (Vaccine-Style Package)"
CORE_VISUAL = "냉장 보관용 스티로폼 박스 + 내부 얼음팩 + 유리 바이알 5개 세트 + 주사 키트"
COLORWAY = "메인: 에메랄드 그린(바이알 액체), 보조1: 화이트(스티로폼), 보조2: 실버(바이알 캡)"
SIGNATURE = "박스 상단 육각형 분자 구조 문양, 바이알에 녹색 띠 라벨, 뚜껑에 생물학적 위험 기하학 마크"
CONDITION = "cold-chain maintained, laboratory-grade"
EXTRA = "온도 표시 스트립(색상 변화), 밀봉 테이프, 취급 주의 기하학 스티커"

# [FULL PROMPT]
A high-quality game item illustration in a late-80s to 90s Japanese anime & manga golden-era style,
hand-drawn cel animation look with bold clean outlines, flat-to-2step cel shading, slightly warm vintage palette, subtle film grain,
DESIGNED AS A PHYSICAL OBJECT: 항원 중화 항체 (단속 벌금 대납 면역 보험), IMMUNE INSURANCE (Vaccine-Style Package),
visual style: masculine "industrial & bureaucratic" vibe, technical and functional look, readable silhouette, designed like a premium hobby model kit accessory,
details: 냉장 보관용 스티로폼 박스 + 내부 얼음팩 + 유리 바이알 5개 세트 + 주사 키트, thick paper texture, realistic paper weight, metal fasteners, rubber stamp ink bleed (no text),
geometric elements: intricate circular seals, square stamps, bold stripes, and abstract data blocks (strictly no letters or numbers),
colorway: 메인: 에메랄드 그린(바이알 액체), 보조1: 화이트(스티로폼), 보조2: 실버(바이알 캡),
signature pattern: 박스 상단 육각형 분자 구조 문양, 바이알에 녹색 띠 라벨, 뚜껑에 생물학적 위험 기하학 마크,
condition: cold-chain maintained, laboratory-grade,
add-ons: 온도 표시 스트립(색상 변화), 밀봉 테이프, 취급 주의 기하학 스티커,
view: top-down slightly isometric perspective, centered, consistent scale,
background: clean off-white seamless studio backdrop, soft studio lighting, gentle shadow under the object,
no text, no logos, no watermark, no UI, high resolution, consistent style.
```

---

### 4. 측부 순환 보험 (Collateral Circulation Insurance)
**파일명**: `ins-collateral-circulation.png`

```
# [ARGS]
SUBJECT = "측부 순환 보험 (우회 경로 비용 절감 보험)"
ITEM_TYPE = "ROUTING INSURANCE (Map & Compass Style)"
CORE_VISUAL = "접힌 방수 지도 + 나침반 + 형광펜으로 표시된 우회 경로(기하학 선) + 가죽 파우치"
COLORWAY = "메인: 탄 브라운(가죽), 보조1: 형광 오렌지(경로 표시), 보조2: 앤틱 브래스(나침반)"
SIGNATURE = "지도 중앙 나침반 장미 문양, 우회 경로는 점선과 화살표로 표현, 파우치에 원형 인장"
CONDITION = "field-used, weatherproof, explorer-grade"
EXTRA = "지도에 접힌 자국, 나침반 유리 덮개, 파우치 버클과 스트랩"

# [FULL PROMPT]
A high-quality game item illustration in a late-80s to 90s Japanese anime & manga golden-era style,
hand-drawn cel animation look with bold clean outlines, flat-to-2step cel shading, slightly warm vintage palette, subtle film grain,
DESIGNED AS A PHYSICAL OBJECT: 측부 순환 보험 (우회 경로 비용 절감 보험), ROUTING INSURANCE (Map & Compass Style),
visual style: masculine "industrial & bureaucratic" vibe, technical and functional look, readable silhouette, designed like a premium hobby model kit accessory,
details: 접힌 방수 지도 + 나침반 + 형광펜으로 표시된 우회 경로(기하학 선) + 가죽 파우치, thick paper texture, realistic paper weight, metal fasteners, rubber stamp ink bleed (no text),
geometric elements: intricate circular seals, square stamps, bold stripes, and abstract data blocks (strictly no letters or numbers),
colorway: 메인: 탄 브라운(가죽), 보조1: 형광 오렌지(경로 표시), 보조2: 앤틱 브래스(나침반),
signature pattern: 지도 중앙 나침반 장미 문양, 우회 경로는 점선과 화살표로 표현, 파우치에 원형 인장,
condition: field-used, weatherproof, explorer-grade,
add-ons: 지도에 접힌 자국, 나침반 유리 덮개, 파우치 버클과 스트랩,
view: top-down slightly isometric perspective, centered, consistent scale,
background: clean off-white seamless studio backdrop, soft studio lighting, gentle shadow under the object,
no text, no logos, no watermark, no UI, high resolution, consistent style.
```

---

### 5. 혈관 확장 보험 (Vasodilator Insurance)
**파일명**: `ins-vasodilator.png`

```
# [ARGS]
SUBJECT = "혈관 확장 보험 (초기 시동 부스트 및 진입 장벽 완화 보험)"
ITEM_TYPE = "BOOST INSURANCE (Energy Drink & Pill Style)"
CORE_VISUAL = "에너지 드링크 캔 3개 팩 + 알약 블리스터 팩 + 번개 문양(기하학) + 플라스틱 래핑"
COLORWAY = "메인: 일렉트릭 옐로(캔), 보조1: 블랙(라벨 영역), 보조2: 실버(알루미늄)"
SIGNATURE = "캔 중앙 번개 볼트 문양, 블리스터 팩에 육각형 패턴, 래핑에 사선 스트라이프"
CONDITION = "retail-fresh, energy-packed, promotional"
EXTRA = "캔 풀탭 디테일, 블리스터 포일 광택, 프로모션 스티커(기하학 별)"

# [FULL PROMPT]
A high-quality game item illustration in a late-80s to 90s Japanese anime & manga golden-era style,
hand-drawn cel animation look with bold clean outlines, flat-to-2step cel shading, slightly warm vintage palette, subtle film grain,
DESIGNED AS A PHYSICAL OBJECT: 혈관 확장 보험 (초기 시동 부스트 및 진입 장벽 완화 보험), BOOST INSURANCE (Energy Drink & Pill Style),
visual style: masculine "industrial & bureaucratic" vibe, technical and functional look, readable silhouette, designed like a premium hobby model kit accessory,
details: 에너지 드링크 캔 3개 팩 + 알약 블리스터 팩 + 번개 문양(기하학) + 플라스틱 래핑, thick paper texture, realistic paper weight, metal fasteners, rubber stamp ink bleed (no text),
geometric elements: intricate circular seals, square stamps, bold stripes, and abstract data blocks (strictly no letters or numbers),
colorway: 메인: 일렉트릭 옐로(캔), 보조1: 블랙(라벨 영역), 보조2: 실버(알루미늄),
signature pattern: 캔 중앙 번개 볼트 문양, 블리스터 팩에 육각형 패턴, 래핑에 사선 스트라이프,
condition: retail-fresh, energy-packed, promotional,
add-ons: 캔 풀탭 디테일, 블리스터 포일 광택, 프로모션 스티커(기하학 별),
view: top-down slightly isometric perspective, centered, consistent scale,
background: clean off-white seamless studio backdrop, soft studio lighting, gentle shadow under the object,
no text, no logos, no watermark, no UI, high resolution, consistent style.
```

---

## 📊 데이터베이스 스키마 및 INSERT 문

### 테이블 생성: `tbl_documents`

```sql
-- trucker.tbl_documents definition
CREATE TABLE trucker.tbl_documents (
    id TEXT NOT NULL,                                    -- 서류 고유 ID
    name TEXT NOT NULL,                                  -- 서류 이름
    description TEXT NULL,                               -- 서류 설명
    image_filename TEXT NOT NULL,                        -- 이미지 파일명 (확장자 제외)
    document_type TEXT NOT NULL,                         -- LICENSE, PERMIT, ILLEGAL, RELIC, VIOLATION
    price INT8 DEFAULT 0 NOT NULL,                       -- 구매 가격 (0이면 획득 불가/이벤트)
    slots INT4 DEFAULT 0 NOT NULL,                       -- 차지하는 인벤토리 슬롯 수
    effect TEXT NOT NULL,                                -- 적용 효과 설명
    side_effect TEXT NULL,                               -- 부작용 설명
    flavor_text TEXT NULL,                               -- 분위기 텍스트 (게임 톤)
    expiry_days INT4 NULL,                               -- 유효 기간 (일 단위, NULL이면 무제한)
    max_uses INT4 NULL,                                  -- 최대 사용 횟수 (NULL이면 무제한)
    allowed_categories TEXT[] DEFAULT ARRAY['ALL'] NOT NULL, -- 적용 가능 카테고리
    is_default BOOL DEFAULT FALSE NOT NULL,              -- 신규 유저 자동 지급 여부
    is_active BOOL DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT tbl_documents_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE trucker.tbl_documents IS '서류 마스터 테이블 - 모든 라이센스/허가증/위반딱지 정의';
COMMENT ON COLUMN trucker.tbl_documents.slots IS '인벤토리 슬롯 점유 수 (Cairn RPG 스타일)';
COMMENT ON COLUMN trucker.tbl_documents.expiry_days IS '구매/획득 후 유효 기간 (일), NULL=무제한';
COMMENT ON COLUMN trucker.tbl_documents.max_uses IS '사용 가능 횟수, NULL=무제한';
```

### 테이블 생성: `tbl_insurances`

```sql
-- trucker.tbl_insurances definition
CREATE TABLE trucker.tbl_insurances (
    id TEXT NOT NULL,                                    -- 보험 고유 ID
    name TEXT NOT NULL,                                  -- 보험 이름
    description TEXT NULL,                               -- 보험 설명
    image_filename TEXT NOT NULL,                        -- 이미지 파일명 (확장자 제외)
    insurance_type TEXT NOT NULL,                        -- BASIC, RECOVERY, IMMUNE, ROUTING, BOOST
    price INT8 DEFAULT 0 NOT NULL,                       -- 구매 가격
    effect TEXT NOT NULL,                                -- 보장 효과 설명
    side_effect TEXT NOT NULL,                           -- 부작용 (트레이드오프)
    flavor_text TEXT NULL,                               -- 분위기 텍스트 (게임 톤)
    effect_value FLOAT8 DEFAULT 0 NOT NULL,              -- 효과 수치 (예: 70% 방어 → 0.7)
    side_effect_value FLOAT8 DEFAULT 0 NOT NULL,         -- 부작용 수치 (예: 속도 -5% → 0.05)
    expiry_days INT4 NOT NULL,                           -- 유효 기간 (일 단위)
    is_active BOOL DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT tbl_insurances_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE trucker.tbl_insurances IS '보험 마스터 테이블 - 혈관계 생리학 기반 항상성 유지 아이템';
COMMENT ON COLUMN trucker.tbl_insurances.effect_value IS '효과 수치 (0.0~1.0 비율)';
COMMENT ON COLUMN trucker.tbl_insurances.side_effect_value IS '부작용 수치 (0.0~1.0 비율)';
```

---

### INSERT 문: 서류 5종

```sql
INSERT INTO trucker.tbl_documents (id, name, description, image_filename, document_type, price, slots, effect, side_effect, flavor_text, expiry_days, max_uses, allowed_categories, is_default) VALUES
('doc-standard-license', 
 '표준 이륜차 면허', 
 '가장 기본적인 자전거 운송 면허입니다. 무게가 거의 나가지 않아 슬롯을 차지하지 않습니다.',
 'doc-standard-license',
 'LICENSE',
 0,
 0,
 '일반 화물 운송 가능',
 NULL,
 '"이것만 있으면 어디든 갈 수 있을 줄 알았다."',
 NULL,
 NULL,
 ARRAY['CONVENIENCE', 'GENERAL'],
 TRUE),

('doc-hazmat-permit',
 '위험물 취급 인가증',
 '화학물질 및 폭발성 화물을 다룰 수 있는 허가증입니다. 두꺼운 규정집을 항상 휴대해야 합니다.',
 'doc-hazmat-permit',
 'PERMIT',
 5000,
 1,
 '위험물 운송 가능',
 NULL,
 '"불꽃 근처에는 가지 마세요. 제발요."',
 30,
 NULL,
 ARRAY['HAZMAT', 'CHEMICAL'],
 FALSE),

('doc-forged-pass',
 '위조된 통행증',
 '암시장에서 구한 조잡한 위조 서류입니다. 특정 검문소를 무사히 통과할 수 있게 해주지만, 걸리면 파산입니다.',
 'doc-forged-pass',
 'ILLEGAL',
 2000,
 1,
 '검문소 자동 통과 (70% 확률)',
 '발각 시 전 재산 50% 몰수',
 '"뒷골목의 잉크 냄새가 아직 가시지 않았습니다."',
 7,
 3,
 ARRAY['ALL'],
 FALSE),

('doc-emergency-decree',
 '혈액 운송 긴급 칙령',
 '국가 비상사태 시 발행되는 강력한 권한의 문서입니다. 모든 신호를 무시할 수 있지만, 인벤토리의 핵심 슬롯을 2칸이나 점유합니다.',
 'doc-emergency-decree',
 'RELIC',
 15000,
 2,
 '신호 위반 무효화',
 NULL,
 '"생명보다 소중한 종이는 없습니다."',
 1,
 1,
 ARRAY['MEDICAL', 'EMERGENCY'],
 FALSE),

('doc-night-permit',
 '심야 통행 허가서',
 '야간(22:00 ~ 06:00) 도심 진입을 위한 특별 허가서입니다.',
 'doc-night-permit',
 'PERMIT',
 3000,
 1,
 '야간 배달 할증 +20%',
 NULL,
 '"밤의 도시는 낮과 다른 규칙으로 움직인다."',
 14,
 NULL,
 ARRAY['ALL'],
 FALSE);
```

---

### INSERT 문: 보험 5종

```sql
INSERT INTO trucker.tbl_insurances (id, name, description, image_filename, insurance_type, price, effect, side_effect, flavor_text, effect_value, side_effect_value, expiry_days) VALUES
('ins-platelet-coagulant',
 '혈소판 응고 촉진제',
 '가장 기본적인 사고 방어 체계입니다. 미세한 출혈(소액 사고)을 즉시 차단합니다.',
 'ins-platelet-coagulant',
 'BASIC',
 3000,
 '사고 손실 70% 방어',
 '운행 속도 -5%',
 '"상처는 금방 아물 것입니다. 조금 느려지겠지만요."',
 0.70,
 0.05,
 15),

('ins-plasma-expander',
 '인공 혈장 증량 팩',
 '지각으로 인한 대량 출혈(패널티) 발생 시, 시스템 쇼크를 방지하기 위해 다음 운행에서 손실액을 서서히 보충합니다.',
 'ins-plasma-expander',
 'RECOVERY',
 8000,
 '패널티 50% 지연 회복',
 '내구도 소모 +10%',
 '"당장의 고통은 잊으세요. 미래의 당신이 갚을 테니까요."',
 0.50,
 0.10,
 30),

('ins-antigen-neutralizer',
 '항원 중화 항체',
 '외부 항원(단속)의 공격을 무력화합니다. 벌금 발생 시 이를 대납하고 평판 하락을 막습니다.',
 'ins-antigen-neutralizer',
 'IMMUNE',
 12000,
 '단속 벌금 80% 대납',
 '사고 발생 확률 +5%',
 '"법이라는 바이러스에 대한 가장 확실한 백신입니다."',
 0.80,
 0.05,
 7),

('ins-collateral-circulation',
 '측부 순환 보험',
 '메인 경로가 막혀도 우회 경로로 목적지에 도달할 수 있게 해주는 보험입니다. 우회 비용을 절감합니다.',
 'ins-collateral-circulation',
 'ROUTING',
 6000,
 '우회 경로 비용 -40%',
 'ETA 예측 정확도 -10%',
 '"길이 막히면 새 길을 뚫으면 됩니다. 비용은 우리가."',
 0.40,
 0.10,
 21),

('ins-vasodilator',
 '혈관 확장 보험',
 '진입 장벽을 낮추고 초기 시동을 도와주는 보험입니다. 첫 3회 운행에 보너스를 제공합니다.',
 'ins-vasodilator',
 'BOOST',
 5000,
 '첫 3회 운행 수익 +25%',
 '이후 운행 수익 -5% (3회)',
 '"시작이 반이라면, 우리가 그 반을 채워드립니다."',
 0.25,
 0.05,
 7);
```

---

## 📁 이미지 파일 목록

| 카테고리 | ID | 파일명 |
|---------|-----|--------|
| 서류 | doc-standard-license | `doc-standard-license.png` |
| 서류 | doc-hazmat-permit | `doc-hazmat-permit.png` |
| 서류 | doc-forged-pass | `doc-forged-pass.png` |
| 서류 | doc-emergency-decree | `doc-emergency-decree.png` |
| 서류 | doc-night-permit | `doc-night-permit.png` |
| 보험 | ins-platelet-coagulant | `ins-platelet-coagulant.png` |
| 보험 | ins-plasma-expander | `ins-plasma-expander.png` |
| 보험 | ins-antigen-neutralizer | `ins-antigen-neutralizer.png` |
| 보험 | ins-collateral-circulation | `ins-collateral-circulation.png` |
| 보험 | ins-vasodilator | `ins-vasodilator.png` |
