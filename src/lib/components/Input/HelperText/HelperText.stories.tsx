import type { Meta, StoryObj } from "@storybook/react";

import { HelperText } from "@/lib/components/Input/HelperText/HelperText";
import React from "react";

const meta: Meta<typeof HelperText> = {
  title: "Team WEing/Input/HelperText",
  component: HelperText,
  argTypes: {
    children: {
      control: "text",
    },
    status: {
      control: "select",
      options: ["error", "success", "warning", "none"],
    },
  },
  args: {
    children: "HelperText",
    status: "error",
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

type Story = StoryObj<typeof HelperText>;

export const Base: Story = {
  args: {},
};
