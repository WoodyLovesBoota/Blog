import type { Meta, StoryObj } from "@storybook/react";
import { TextInput } from "@/lib/components/Input/TextInput/TextInput";
import React, { useContext } from "react";
import { CommonTextInputItemProvider } from "@/lib/contexts/TextInput.context";

const meta: Meta<typeof TextInput> = {
  title: "Team WEing/Input/TextInput",
  component: TextInput,
  argTypes: {
    children: {
      control: "text",
    },
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
    type: {
      control: "select",
      options: ["text", "password", "email", "number", "tel", "search"],
    },
    themeType: {
      control: "select",
      options: ["outlined", "contained"],
      themeType: "outlined",
      isFocused: false,
    },
    onBlur: {
      action: "onBlur",
    },
    onFocus: {
      action: "onFocus",
    },
  },
  args: {
    children: "TextInput",
    isFocused: false,
    value: "value",
    name: "name",
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

type Story = StoryObj<typeof TextInput>;

export const Base = (args: Story["args"]) => {
  return (
    <CommonTextInputItemProvider {...(args as any)}>
      <TextInput />
    </CommonTextInputItemProvider>
  );
};

export const Search = (args: Story["args"]) => {
  return (
    <CommonTextInputItemProvider {...(args as any)} type={args?.type || "search"}>
      <TextInput />
    </CommonTextInputItemProvider>
  );
};

export const LargeSearch = (args: Story["args"]) => {
  return (
    <CommonTextInputItemProvider {...(args as any)} type={args?.type || "search"} size="large">
      <TextInput />
    </CommonTextInputItemProvider>
  );
};
