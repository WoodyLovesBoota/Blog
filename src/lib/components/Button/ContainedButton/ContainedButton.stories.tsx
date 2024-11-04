import type { Meta, StoryObj } from "@storybook/react";
import ContainedButton from "./ContainedButton";
import React from "react";

const meta: Meta<typeof ContainedButton> = {
  title: "BootaButton",
  component: ContainedButton,
  argTypes: {
    size: {
      control: "select",
      option: ["small", "medium", "large"],
    },
    disabled: {
      control: "boolean",
    },
    colorType: {
      control: "select",
      option: ["blue", "gray", "lightgray"],
    },
  },
  args: {
    size: "small",
    disabled: false,
    children: "Button",
    colorType: "blue",
  },
  decorators: [
    (Story) => {
      return <Story />;
    },
  ],
};

export default meta;

type Story = StoryObj<typeof ContainedButton>;

export const Base: Story = {
  args: {
    size: "small",
    disabled: false,
    children: "Button",
  },
};
