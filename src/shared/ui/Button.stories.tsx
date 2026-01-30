import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";
import { Bot } from "lucide-react";

const meta: Meta<typeof Button> = {
  title: "Shared/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
      description: "버튼의 스타일 변형",
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
      description: "버튼의 크기",
    },
    children: {
      control: "text",
      description: "버튼 내부 텍스트 또는 요소",
    },
    onClick: { action: "clicked" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Button",
    variant: "default",
    size: "default",
  },
};

export const WithIcon: Story = {
  render: (args) => (
    <Button {...args}>
      <Bot className="mr-2 h-4 w-4" />
      봇 설정
    </Button>
  ),
  args: {
    variant: "default",
  },
};

export const AdminTabActive: Story = {
  render: (args) => (
    <Button {...args} className="bg-primary-600 text-white rounded-xl border-none">
      <Bot className="mr-2 h-4 w-4" />
      봇 설정
    </Button>
  ),
  args: {
    size: "default",
  },
};

export const AdminTabInactive: Story = {
  render: (args) => (
    <Button {...args} className="bg-white text-surface-600 hover:bg-surface-50 border border-surface-200 rounded-xl">
      <Bot className="mr-2 h-4 w-4" />
      봇 설정
    </Button>
  ),
  args: {
    variant: "outline",
    size: "default",
  },
};

export const Secondary: Story = {
  args: {
    children: "Secondary Button",
    variant: "secondary",
  },
};

export const Outline: Story = {
  args: {
    children: "Outline Button",
    variant: "outline",
  },
};

export const Destructive: Story = {
  args: {
    children: "Destructive Button",
    variant: "destructive",
  },
};

export const Ghost: Story = {
  args: {
    children: "Ghost Button",
    variant: "ghost",
  },
};

export const Link: Story = {
  args: {
    children: "Link Button",
    variant: "link",
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    children: "Small Button",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    children: "Large Button",
  },
};

export const Icon: Story = {
  args: {
    size: "icon",
    children: "🚀",
  },
};
