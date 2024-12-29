"use client";

import cn from "classnames/bind";
import styles from "./Home.view.module.scss";
import { useRouter } from "next/navigation";

const cx = cn.bind(styles);

const HomeView = () => {
    const router = useRouter();

    const handleMoreClick = () => {
        router.push("/tech");
    };

    return (
        <div className={cx("Wrapper")}>
            <div className={cx("Container")}>
                <section className={cx("TechSection")}>
                    <header className={cx("SectionHeader")}>
                        <div className={cx("SectionTitleWrapper")}>
                            <p className={cx("SectionTitle")}>{"Tech :"}</p>
                            <button
                                className={cx("SectionButton")}
                                onClick={handleMoreClick}
                            >
                                {"More"}
                            </button>
                        </div>
                        <div className={cx("SectionSubtitleWrapper")}>
                            technical insights
                        </div>
                    </header>
                    <main className={cx("SectionContent")}></main>
                </section>
                <section className={cx("TechSection")}>
                    <header className={cx("SectionHeader")}>
                        <div className={cx("SectionTitleWrapper")}>
                            <p className={cx("SectionTitle")}>{"Tech :"}</p>
                            <button className={cx("SectionButton")}>
                                {"More"}
                            </button>
                        </div>
                        <div className={cx("SectionSubtitleWrapper")}>
                            technical insights
                        </div>
                    </header>
                    <main className={cx("SectionContent")}></main>
                </section>
                <section className={cx("TechSection")}>
                    <header className={cx("SectionHeader")}>
                        <div className={cx("SectionTitleWrapper")}>
                            <p className={cx("SectionTitle")}>{"Tech :"}</p>
                            <button className={cx("SectionButton")}>
                                {"More"}
                            </button>
                        </div>
                        <div className={cx("SectionSubtitleWrapper")}>
                            technical insights
                        </div>
                    </header>
                    <main className={cx("SectionContent")}></main>
                </section>
            </div>
        </div>
    );
};

export default HomeView;
