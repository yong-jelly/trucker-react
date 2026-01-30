import type { Meta, StoryObj } from '@storybook/react';
import { SettlementReceipt, SettlementDetails } from './SettlementComponents';

const meta: Meta<typeof SettlementReceipt> = {
  title: 'Features/Settlement/SettlementReceipt',
  component: SettlementReceipt,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SettlementReceipt>;

export const Default: Story = {
  args: {
    finalReward: 1250.50,
    baseReward: 1300.00,
    penalty: 49.50,
    lpReward: 10,
    orderId: '550e8400-e29b-41d4-a716-446655440000',
  },
};

export const WithPenalty: Story = {
  args: {
    finalReward: 850.00,
    baseReward: 1300.00,
    penalty: 450.00,
    lpReward: 5,
    orderId: '550e8400-e29b-41d4-a716-446655440000',
  },
};

export const DetailsDefault: StoryObj<typeof SettlementDetails> = {
  render: (args) => <SettlementDetails {...args} />,
  args: {
    orderTitle: '신선 식품 긴급 배송',
    duration: '15분 30초',
    limitTimeMinutes: 20,
    distance: 12.5,
    category: 'FOOD',
    startAt: 1738221000000,
    completedAt: 1738221930000,
  },
};
