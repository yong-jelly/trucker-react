import type { Meta, StoryObj } from "@storybook/react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "./Sheet";
import { Button } from "./Button";
import { History, Package, CheckCircle2, Clock, AlertCircle, Wrench } from "lucide-react";

/**
 * `Sheet` 컴포넌트는 화면 하단에서 올라오는 바텀 시트 UI를 제공합니다.
 * 모바일 환경에 최적화되어 있으며, Radix UI의 Dialog를 기반으로 제작되었습니다.
 */
const meta: Meta<typeof Sheet> = {
  title: "Shared/Sheet",
  component: Sheet,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    // maxWidth는 SheetContent의 props이므로 meta에서 직접 제어하기 위해 render 함수에서 처리
  }
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof Sheet>;

/**
 * 너비 옵션(maxWidth)을 조정한 예시입니다.
 */
export const WidthOptions: Story = {
  render: () => (
    <div className="p-8 space-y-4 flex flex-col items-center">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Small (sm) 시트</Button>
        </SheetTrigger>
        <SheetContent maxWidth="sm">
          <SheetHeader>
            <SheetTitle>Small Sheet</SheetTitle>
            <SheetDescription>maxWidth="sm" (384px)</SheetDescription>
          </SheetHeader>
          <div className="p-6 text-sm">작은 너비의 시트입니다.</div>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Large (lg) 시트</Button>
        </SheetTrigger>
        <SheetContent maxWidth="lg">
          <SheetHeader>
            <SheetTitle>Large Sheet</SheetTitle>
            <SheetDescription>maxWidth="lg" (512px)</SheetDescription>
          </SheetHeader>
          <div className="p-6 text-sm">중간 너비의 시트입니다.</div>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">2XL (기본값) 시트</Button>
        </SheetTrigger>
        <SheetContent maxWidth="2xl">
          <SheetHeader>
            <SheetTitle>2XL Sheet</SheetTitle>
            <SheetDescription>maxWidth="2xl" (768px)</SheetDescription>
          </SheetHeader>
          <div className="p-6 text-sm">기본 너비의 시트입니다.</div>
        </SheetContent>
      </Sheet>
    </div>
  ),
};

/**
 * 가장 기본적인 형태의 바텀 시트입니다.
 */
export const Default: Story = {
  render: () => (
    <div className="p-8 flex justify-center">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">기본 시트 열기</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>기본 바텀 시트</SheetTitle>
            <SheetDescription>
              이것은 가장 기본적인 형태의 바텀 시트입니다. 하단에서 부드럽게 올라옵니다.
            </SheetDescription>
          </SheetHeader>
          <div className="p-6">
            <p className="text-sm text-surface-600">
              시트 내부에는 어떤 컨텐츠든 들어갈 수 있습니다.
            </p>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button className="w-full">확인</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  ),
};

/**
 * 컨텐츠가 많을 경우 자동으로 내부 스크롤이 생성됩니다.
 */
export const LongContent: Story = {
  render: () => (
    <div className="p-8 flex justify-center">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">긴 컨텐츠 시트 열기</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>스크롤 가능한 컨텐츠</SheetTitle>
            <SheetDescription>
              컨텐츠가 많아지면 시트 내부에서 스크롤이 가능해집니다.
            </SheetDescription>
          </SheetHeader>
          <div className="p-6 space-y-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="p-4 bg-surface-50 rounded-xl border border-surface-100">
                <p className="text-sm font-medium text-surface-900">리스트 항목 {i + 1}</p>
                <p className="text-xs text-surface-500 mt-1">상세 설명 텍스트가 들어갑니다.</p>
              </div>
            ))}
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button className="w-full">닫기</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  ),
};

/**
 * `EquipmentHistorySheet`와 유사한 리스트 형태의 예시입니다.
 */
export const HistoryList: Story = {
  render: () => (
    <div className="p-8 flex justify-center">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">운행 기록 보기</Button>
        </SheetTrigger>
        <SheetContent className="p-0">
          <SheetHeader className="px-6 pt-6 pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                <History className="h-6 w-6" />
              </div>
              <div className="text-left">
                <SheetTitle>운영 히스토리</SheetTitle>
                <SheetDescription>최근 완료한 운행 기록입니다.</SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <div className="px-6 py-4 space-y-3 max-h-[50vh] overflow-y-auto">
            {[
              { id: 1, title: "편의점 도시락 배송", reward: 1200, status: "COMPLETED", date: "2026. 01. 30. 14:20" },
              { id: 2, title: "마트 생필품 배달", reward: 1800, status: "COMPLETED", date: "2026. 01. 30. 13:15" },
              { id: 3, title: "공사장 소형 공구 배송", reward: 0, status: "FAILED", date: "2026. 01. 30. 11:05" },
            ].map((run) => (
              <div key={run.id} className="bg-white rounded-2xl p-4 border border-surface-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      run.status === 'COMPLETED' ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-accent-rose/10 text-accent-rose'
                    }`}>
                      {run.status === 'COMPLETED' ? '완료' : '실패'}
                    </span>
                    <span className="text-[10px] text-surface-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {run.date}
                    </span>
                  </div>
                  <div className={`flex items-center gap-1 font-bold text-sm ${
                    run.status === 'COMPLETED' ? 'text-accent-emerald' : 'text-surface-400'
                  }`}>
                    <span>{run.status === 'COMPLETED' ? '+' : ''}{run.reward.toLocaleString()}</span>
                  </div>
                </div>
                <h4 className="text-sm font-bold text-surface-900 mb-2">{run.title}</h4>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[11px] text-surface-500">
                    <Package className="h-3.5 w-3.5" />
                    <span>화물 정보</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-surface-500">
                    {run.status === 'COMPLETED' ? <CheckCircle2 className="h-3.5 w-3.5 text-accent-emerald" /> : <AlertCircle className="h-3.5 w-3.5 text-accent-rose" />}
                    <span>{run.status === 'COMPLETED' ? '안전 배송' : '배송 실패'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 pt-2">
            <SheetClose asChild>
              <Button variant="secondary" className="w-full">닫기</Button>
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  ),
};

/**
 * 시트 하단에 여러 액션 버튼을 배치할 수 있습니다.
 */
export const WithActions: Story = {
  render: () => (
    <div className="p-8 flex justify-center">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">액션 시트 열기</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>장비 구매 확인</SheetTitle>
            <SheetDescription>
              정말로 이 장비를 구매하시겠습니까? 구매 후에는 환불이 불가능합니다.
            </SheetDescription>
          </SheetHeader>
          <div className="p-10 flex flex-col items-center justify-center">
            <div className="h-24 w-24 rounded-3xl bg-primary-50 flex items-center justify-center mb-4">
              <Wrench className="h-12 w-12 text-primary-600" />
            </div>
            <p className="text-xl font-black text-surface-900">레일-프레임 카고 스쿠터</p>
            <p className="text-primary-600 font-bold mt-1">$ 12,500</p>
          </div>
          <SheetFooter className="gap-3 sm:flex-col">
            <Button className="w-full h-14 rounded-2xl text-base">구매하기</Button>
            <SheetClose asChild>
              <Button variant="ghost" className="w-full h-12 text-surface-400">취소</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  ),
};
