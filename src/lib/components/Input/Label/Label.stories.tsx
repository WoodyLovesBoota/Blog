import type { Meta, StoryObj } from "@storybook/react";

import { Label } from "@/lib/components/Input/Label/Label";
import React from "react";

const meta: Meta<typeof Label> = {
  title: "Team WEing/Input/Label",
  component: Label,
  argTypes: {
    label: {
      control: "text",
    },
    isFocused: {
      control: "boolean",
    },
    required: {
      control: "boolean",
    },
  },
  args: {
    label: "Label",
    isFocused: false,
    required: false,
  },
  decorators: [
    (Story) => {
      return (
        <React.Fragment>
          <Story />
        </React.Fragment>
      );
    },
  ],
};

export default meta;

type Story = StoryObj<typeof Label>;

export const Base: Story = {
  args: {},
};
