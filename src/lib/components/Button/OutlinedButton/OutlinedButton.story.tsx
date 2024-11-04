import type { Meta, StoryObj } from "@storybook/react";
import OutlinedButton from "./OutlinedButton";
import React from "react";

const meta: Meta<typeof OutlinedButton> = {
  title: "Team WEing/Button/OutlinedButton",
  component: OutlinedButton,
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
      option: ["primary", "secondary", "cancel"],
    },
  },
  args: {
    size: "small",
    disabled: false,
    children: "Button",
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

type Story = StoryObj<typeof OutlinedButton>;

export const Base: Story = {
  args: {
    size: "small",
    disabled: false,
    children: "Button",
  },
};

export const Cancel: Story = {
  args: {
    size: "small",
    disabled: false,
    children: "Button",
  },
};

export const Secondary: Story = {
  args: {
    size: "small",
    disabled: false,
    children: "Button",
  },
};
