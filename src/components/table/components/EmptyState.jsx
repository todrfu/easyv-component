import React from "react";
import css from "../styles/index.module.css";

/**
 * 空数据状态组件
 */
function EmptyState({ text, showHeader, headerHeight }) {
  return (
    <div
      className={css.tableBody}
      style={{
        height: showHeader ? `calc(100% - ${headerHeight}px)` : "100%",
      }}
    >
      <div className={css.emptyRow}>
        <span className={css.emptyText}>{text}</span>
      </div>
    </div>
  );
}

export default EmptyState;
