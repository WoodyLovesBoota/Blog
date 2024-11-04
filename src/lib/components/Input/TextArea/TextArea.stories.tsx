import type { Meta, StoryObj } from "@storybook/react";

import { TextArea } from "@/lib/components/Input/TextArea/TextArea";
import React, { useContext } from "react";
import { CommonTextInputItemProvider } from "@/lib/contexts/TextInput.context";

const meta: Meta<typeof TextArea> = {
  title: "Team WEing/Input/TextArea",
  component: TextArea,
  argTypes: {
    isFocused: {
      control: "boolean",
    },
    onChange: {
      action: "onChange",
    },
    value: {
      control: "text",
    },
    name: {
      control: "text",
    },
    themeType: {
      control: "select",
      options: ["outlined", "contained"],
    },
    onBlur: {
      action: "onBlur",
    },
    onFocus: {
      action: "onFocus",
    },
  },
  args: {
    isFocused: false,
    value: "value",
    name: "name",
    themeType: "outlined",
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

type Story = StoryObj<typeof TextArea>;

export const Base = (args: Story["args"]) => {
  return (
    <CommonTextInputItemProvider {...(args as any)}>
      <TextArea />
    </CommonTextInputItemProvider>
  );
};
