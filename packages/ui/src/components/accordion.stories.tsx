import { type Meta, type StoryObj } from '@storybook/react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './accordion';

const meta: Meta<typeof Accordion> = {
  component: Accordion,
  args: {
    type: 'single',
    collapsible: true,
  },
  argTypes: {
    type: {
      options: ['single', 'multiple'],
      control: {
        type: 'select',
      },
    },
  },
  render: (args) => (
    <Accordion {...args}>
      {items.map((item) => (
        <AccordionItem key={item.value} value={item.value}>
          <AccordionTrigger>{item.trigger}</AccordionTrigger>
          <AccordionContent>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  ),
};

export default meta;

type Story = StoryObj<typeof Accordion>;

const items = [
  {
    trigger: 'Is it accessible?',
    content: 'Yes. It adheres to the WAI-ARIA design pattern.',
    value: 'item-1',
  },
  {
    trigger: 'Is it styled?',
    content:
      "Yes. It comes with default styles that matches the other components' aesthetic.",
    value: 'item-2',
  },
  {
    trigger: 'Is it animated?',
    content:
      "Yes. It's animated by default, but you can disable it if you prefer.",
    value: 'item-3',
  },
];

export const Single: Story = {};

export const Multiple: Story = {
  args: {
    type: 'multiple',
  },
};
