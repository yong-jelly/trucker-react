import type { Meta, StoryObj } from "@storybook/react";
import { TextButton } from "./TextButton";

const meta: Meta<typeof TextButton> = {
  title: "Shared/TextButton",
  component: TextButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "danger", "success", "surface"],
      description: "텍스트 버튼의 색상 변형",
    },
    children: {
      control: "text",
      description: "버튼 내부 텍스트",
    },
    disabled: {
      control: "boolean",
      description: "비활성화 여부",
    },
    onClick: { action: "clicked" },
  },
} satisfies Meta<typeof TextButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: "저장",
    variant: "primary",
  },
};

export const Secondary: Story = {
  args: {
    children: "취소",
    variant: "secondary",
  },
};

export const Danger: Story = {
  args: {
    children: "삭제",
    variant: "danger",
  },
};

export const Success: Story = {
  args: {
    children: "완료",
    variant: "success",
  },
};

export const Surface: Story = {
  args: {
    children: "더보기",
    variant: "surface",
  },
};

export const Disabled: Story = {
  args: {
    children: "저장",
    variant: "primary",
    disabled: true,
  },
};
