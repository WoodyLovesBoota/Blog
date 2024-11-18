"use client";

import ContainedButton from "@/lib/components/Button/ContainedButton/ContainedButton";
import styles from "./Lab.view.module.scss";
import cn from "classnames/bind";
import { usePopup } from "@/components/hooks/popup/usePopup";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";
import MarkDownConverter from "@/components/MarkdownConverter/MarkdownConverter";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseClient";

const cx = cn.bind(styles);

const LabView = ({ data }: { data: any }) => {
  const [text, setText] = useState("# Hello, Markdown!\n# asdfasd");
  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [subTitle, setSubTitle] = useState("");
  const [type, setType] = useState("tech");
  const [date, setDate] = useState("");

  const { centerPopup } = usePopup();

  const updateFirestoreDoc = async (newData: any) => {
    try {
      const docRef = doc(db, "posts", "FEDmMYX81FLLQnF1ri4L");
      await updateDoc(docRef, newData);
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const handleRegister = () => {
    centerPopup({
      positiveText: "등록",
      negativeText: "취소",
      onPositiveClick: () => {
        updateFirestoreDoc({
          tech: {
            lastIndex: data[0].tech.lastIndex + 1,
            list: [
              {
                title: title,
                desc: subTitle,
                image: image,
                date: date,
                id: data[0].tech.lastIndex + 1,
                content: text,
                type: type,
              },
              ...data[0].tech.list,
            ],
          },
        });
      },
    });
  };

  return (
    <div className={cx("Wrapper")}>
      <button onClick={() => handleRegister()} className={cx("RegisterButton")}>
        등록
      </button>
      <div className={cx("Container")}>
        <div className={cx("InputWrapper")}>
          <input
            type="text"
            placeholder="제목"
            onChange={(e) => setTitle(e.target.value)}
            className={cx("Input")}
          />
          <input
            type="text"
            placeholder="부제목"
            onChange={(e) => setSubTitle(e.target.value)}
            className={cx("Input")}
          />
          <input
            type="text"
            placeholder="이미지"
            onChange={(e) => setImage(e.target.value)}
            className={cx("Input")}
          />
          <input
            type="text"
            placeholder="타입"
            onChange={(e) => setType(e.target.value)}
            className={cx("Input")}
          />
          <input
            type="text"
            placeholder="날짜"
            onChange={(e) => setDate(e.target.value)}
            className={cx("Input")}
          />
        </div>
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
