"use client";

import ContainedButton from "@/lib/components/Button/ContainedButton/ContainedButton";
import styles from "./Lab.view.module.scss";
import cn from "classnames/bind";
import { usePopup } from "@/components/hooks/popup/usePopup";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";
import MarkDownConverter from "@/components/MarkdownConverter/MarkdownConverter";

const cx = cn.bind(styles);

const LabView = () => {
  const [text, setText] = useState("# Hello, Markdown!");

  return (
    <div className={cx("Wrapper")}>
      <div className={cx("Container")}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="여기에 마크다운을 작성하세요."
        />
        <div className={cx("MarkDownWrapper")}>
          <MarkDownConverter text={text} />
        </div>
      </div>
    </div>
  );
};

export default LabView;
