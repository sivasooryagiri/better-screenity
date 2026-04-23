import React, { useContext, useState, useEffect } from "react";
import Trimmer from "../../components/editor/Trimmer";
import ZoomTimeline from "../../components/editor/ZoomTimeline";
import styles from "../../styles/edit/_TrimUI.module.scss";

import { ReactSVG } from "react-svg";

const URL = "/assets/";

const TrimIcon = URL + "editor/icons/trim.svg";
const RemoveIcon = URL + "editor/icons/trash.svg";
const MuteIcon = URL + "editor/icons/mute.svg";
const UndoIcon = URL + "editor/icons/undo.svg";
const RedoIcon = URL + "editor/icons/redo.svg";
const TimeIcon = URL + "editor/icons/time.svg";

import { ContentStateContext } from "../../context/ContentState";

const TrimUI = (props) => {
  const [contentState, setContentState] = useContext(ContentStateContext);
  const [undoDisabled, setUndoDisabled] = useState(true);
  const [redoDisabled, setRedoDisabled] = useState(true);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [activeTab, setActiveTab] = useState("trim"); // "trim" | "zoom"

  useEffect(() => {
    setStartTime(contentState.start * contentState.duration);
    setEndTime(contentState.end * contentState.duration);
  }, [contentState.duration, contentState.start, contentState.end]);

  useEffect(() => {
    if (contentState.history.length > 2) {
      setUndoDisabled(false);
    } else {
      setUndoDisabled(true);
    }
  }, [contentState.history]);

  useEffect(() => {
    if (contentState.redoHistory.length > 0) {
      setRedoDisabled(false);
    } else {
      setRedoDisabled(true);
    }
  }, [contentState.redoHistory]);

  const toTimeStamp = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time - minutes * 60);

    if (seconds < 10) {
      return `${minutes}:0${seconds}`;
    } else {
      return `${minutes}:${seconds}`;
    }
  };

  return (
    <div className={styles.trimWrap}>
      <div className={styles.controls}>
        {activeTab === "trim" && (
          <div className={styles.actions}>
            <button
              className="button secondaryButton"
              onClick={() => contentState.handleTrim(false)}
              disabled={
                contentState.isFfmpegRunning ||
                (contentState.start === 0 && contentState.end === 1)
              }
            >
              <ReactSVG src={TrimIcon} />
              {contentState.trimming
                ? chrome.i18n.getMessage("sandboxEditorTrimProgressButton") +
                  (contentState.processingProgress > 0
                    ? ` ${contentState.processingProgress}%`
                    : "")
                : chrome.i18n.getMessage("sandboxEditorTrimButton")}
            </button>
            <button
              className="button secondaryButton"
              disabled={
                (contentState.start === 0 && contentState.end === 1) ||
                contentState.isFfmpegRunning
              }
              onClick={() => contentState.handleTrim(true)}
            >
              <ReactSVG src={RemoveIcon} />
              {contentState.cutting
                ? chrome.i18n.getMessage("sandboxEditorCutProgressButton") +
                  (contentState.processingProgress > 0
                    ? ` ${contentState.processingProgress}%`
                    : "")
                : chrome.i18n.getMessage("sandboxEditorCutButton")}
            </button>
            <button
              className="button secondaryButton"
              onClick={() => contentState.handleMute()}
              disabled={contentState.isFfmpegRunning}
            >
              <ReactSVG src={MuteIcon} />
              {contentState.muting
                ? chrome.i18n.getMessage("sandboxEditorMuteProgressButton") +
                  (contentState.processingProgress > 0
                    ? ` ${contentState.processingProgress}%`
                    : "")
                : chrome.i18n.getMessage("sandboxEditorMuteButton")}
            </button>
          </div>
        )}

        {activeTab === "zoom" && (
          <div className={styles.actions}>
            <button
              className="button secondaryButton"
              disabled={contentState.isFfmpegRunning}
              onClick={() =>
                setContentState((prev) => ({ ...prev, zoomKeyframes: [] }))
              }
            >
              <ReactSVG src={RemoveIcon} />
              Clear all zoom
            </button>
          </div>
        )}

        <div className={styles.tabToggle}>
          <button
            className={`${styles.tabBtn} ${activeTab === "trim" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("trim")}
          >
            Trim
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "zoom" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("zoom")}
          >
            🔎 Zoom
          </button>
        </div>

        <div className={styles.timeWrap}>
          <ReactSVG src={TimeIcon} />
          <span>{toTimeStamp(startTime) + " - " + toTimeStamp(endTime)}</span>
        </div>

        <div className={styles.controlsRight}>
          <button
            className="button simpleButton"
            onClick={() => contentState.undo()}
            disabled={undoDisabled || contentState.isFfmpegRunning}
          >
            <ReactSVG src={UndoIcon} />
            {chrome.i18n.getMessage("undoLabel")}
          </button>
          <button
            className="button simpleButton"
            onClick={() => contentState.redo()}
            disabled={redoDisabled || contentState.isFfmpegRunning}
          >
            <ReactSVG src={RedoIcon} />
            {chrome.i18n.getMessage("redoLabel")}
          </button>
        </div>
      </div>

      {activeTab === "trim" && (
        <>
          <Trimmer />
          {(!contentState.dragInteracted || contentState.duration > 3) && (
            <div className={styles.trimInfo}>
              <div className={styles.trimInfoLeft}>
                <ReactSVG src={URL + "editor/icons/alert.svg"} />
              </div>
              <div className={styles.trimInfoRight}>
                {chrome.i18n.getMessage("sandboxEditorTrimInfo")}
                <div
                  className={styles.trimInfoLink}
                  onClick={() => {
                    chrome.runtime.sendMessage({ type: "trim-info" });
                  }}
                >
                  {chrome.i18n.getMessage("learnMoreDot")}
                </div>
              </div>
            </div>
          )}
          {contentState.dragInteracted && contentState.duration <= 3 && (
            <div className={styles.trimInfo}>
              <div className={styles.trimInfoLeft}>
                <ReactSVG src={URL + "editor/icons/alert.svg"} />
              </div>
              <div className={styles.trimInfoRight}>
                {chrome.i18n.getMessage("sandboxEditorTooSmallInfo")}
                <div
                  className={styles.trimInfoLink}
                  onClick={() => {
                    chrome.runtime.sendMessage({ type: "trim-info" });
                  }}
                >
                  {chrome.i18n.getMessage("learnMoreDot")}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "zoom" && <ZoomTimeline />}
    </div>
  );
};

export default TrimUI;
