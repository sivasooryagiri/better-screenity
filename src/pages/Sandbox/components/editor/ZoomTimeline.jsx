import React, { useRef, useEffect, useState, useContext, useCallback } from "react";
import { ContentStateContext } from "../../context/ContentState";
import styles from "../../styles/edit/_ZoomTimeline.module.scss";

const ZoomTimeline = () => {
  const [contentState, setContentState] = useContext(ContentStateContext);
  const trackRef = useRef(null);
  const [selectedId, setSelectedId] = useState(null);
  const draggingRef = useRef(null);

  const duration = contentState.duration || 1;
  const keyframes = contentState.zoomKeyframes || [];
  const currentTime = contentState.time || 0;
  const playheadPct = Math.min(100, (currentTime / duration) * 100);

  const selectedKf = keyframes.find((k) => k.id === selectedId);

  const addKeyframe = useCallback(
    (e) => {
      if (!trackRef.current) return;
      if (e.target !== trackRef.current && !e.target.dataset.track) return;
      const rect = trackRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const time = pct * duration;
      const newKf = { id: `kf-${Date.now()}`, time, zoom: 2, x: 0.5, y: 0.5 };
      setContentState((prev) => ({
        ...prev,
        zoomKeyframes: [...(prev.zoomKeyframes || []), newKf].sort((a, b) => a.time - b.time),
      }));
      setSelectedId(newKf.id);
    },
    [duration]
  );

  const removeKeyframe = useCallback((id) => {
    setContentState((prev) => ({
      ...prev,
      zoomKeyframes: (prev.zoomKeyframes || []).filter((k) => k.id !== id),
    }));
    setSelectedId(null);
  }, []);

  const updateKeyframe = useCallback((id, updates) => {
    setContentState((prev) => ({
      ...prev,
      zoomKeyframes: (prev.zoomKeyframes || [])
        .map((k) => (k.id === id ? { ...k, ...updates } : k))
        .sort((a, b) => a.time - b.time),
    }));
  }, []);

  const handleMarkerMouseDown = (e, kf) => {
    e.stopPropagation();
    setSelectedId(kf.id);
    const rect = trackRef.current.getBoundingClientRect();
    draggingRef.current = { id: kf.id, startX: e.clientX, startTime: kf.time, trackWidth: rect.width };
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!draggingRef.current) return;
      const { id, startX, startTime, trackWidth } = draggingRef.current;
      const delta = ((e.clientX - startX) / trackWidth) * duration;
      const newTime = Math.max(0, Math.min(duration, startTime + delta));
      setContentState((prev) => ({
        ...prev,
        zoomKeyframes: (prev.zoomKeyframes || [])
          .map((k) => (k.id === id ? { ...k, time: newTime } : k))
          .sort((a, b) => a.time - b.time),
      }));
    };
    const onMouseUp = () => { draggingRef.current = null; };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [duration]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        removeKeyframe(selectedId);
      }
      if (e.key === "Escape") setSelectedId(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedId, removeKeyframe]);

  const toTimestamp = (t) => {
    const m = Math.floor(t / 60);
    const s = (t % 60).toFixed(1).padStart(4, "0");
    return `${m}:${s}`;
  };

  return (
    <div className={styles.wrap}>
      {/* Header row */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.icon}>⌖</span>
          <span className={styles.title}>Zoom Keyframes</span>
          {keyframes.length > 0 && (
            <span className={styles.badge}>{keyframes.length}</span>
          )}
        </div>
        {keyframes.length > 0 && (
          <button
            className={styles.clearBtn}
            onClick={() => {
              setContentState((prev) => ({ ...prev, zoomKeyframes: [] }));
              setSelectedId(null);
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Timeline track */}
      <div className={styles.trackWrap}>
        {/* Time ruler ticks */}
        <div className={styles.ruler}>
          {Array.from({ length: 9 }).map((_, i) => {
            const pct = (i / 8) * 100;
            const t = (pct / 100) * duration;
            return (
              <div key={i} className={styles.tick} style={{ left: `${pct}%` }}>
                <span className={styles.tickLabel}>{toTimestamp(t)}</span>
              </div>
            );
          })}
        </div>

        {/* Main track */}
        <div
          className={styles.track}
          ref={trackRef}
          onClick={addKeyframe}
          data-track="true"
        >
          {/* Zoom level gradient fill between keyframes */}
          {keyframes.length >= 2 &&
            keyframes.slice(0, -1).map((kf, i) => {
              const next = keyframes[i + 1];
              const left = (kf.time / duration) * 100;
              const width = ((next.time - kf.time) / duration) * 100;
              const intensity = Math.max(kf.zoom, next.zoom);
              const opacity = Math.min(0.35, (intensity - 1) * 0.18);
              return (
                <div
                  key={kf.id}
                  className={styles.fillSegment}
                  style={{ left: `${left}%`, width: `${width}%`, opacity }}
                />
              );
            })}

          {/* Playhead */}
          <div className={styles.playhead} style={{ left: `${playheadPct}%` }}>
            <div className={styles.playheadHead} />
          </div>

          {/* Keyframe markers */}
          {keyframes.map((kf) => {
            const isSelected = kf.id === selectedId;
            const pct = (kf.time / duration) * 100;
            return (
              <div
                key={kf.id}
                className={`${styles.marker} ${isSelected ? styles.markerActive : ""}`}
                style={{ left: `${pct}%` }}
                onMouseDown={(e) => handleMarkerMouseDown(e, kf)}
              >
                <div className={styles.markerDiamond} />
                <div className={styles.markerLabel}>{kf.zoom.toFixed(1)}×</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected keyframe controls */}
      {selectedKf ? (
        <div className={styles.controls}>
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Zoom</span>
            <div className={styles.sliderWrap}>
              <span className={styles.sliderMin}>1×</span>
              <input
                type="range"
                min="1"
                max="4"
                step="0.05"
                value={selectedKf.zoom}
                onChange={(e) =>
                  updateKeyframe(selectedKf.id, { zoom: parseFloat(e.target.value) })
                }
                className={styles.slider}
              />
              <span className={styles.sliderMax}>4×</span>
            </div>
            <span className={styles.sliderValue}>{selectedKf.zoom.toFixed(2)}×</span>
          </div>
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Origin X</span>
            <div className={styles.sliderWrap}>
              <span className={styles.sliderMin}>←</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={selectedKf.x}
                onChange={(e) =>
                  updateKeyframe(selectedKf.id, { x: parseFloat(e.target.value) })
                }
                className={styles.slider}
              />
              <span className={styles.sliderMax}>→</span>
            </div>
          </div>
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Origin Y</span>
            <div className={styles.sliderWrap}>
              <span className={styles.sliderMin}>↑</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={selectedKf.y}
                onChange={(e) =>
                  updateKeyframe(selectedKf.id, { y: parseFloat(e.target.value) })
                }
                className={styles.slider}
              />
              <span className={styles.sliderMax}>↓</span>
            </div>
          </div>
          <button
            className={styles.deleteBtn}
            onClick={() => removeKeyframe(selectedKf.id)}
            title="Delete keyframe (Del)"
          >
            Delete
          </button>
        </div>
      ) : (
        <div className={styles.hint}>
          {keyframes.length === 0
            ? "Click on the track to place a zoom keyframe"
            : "Click a keyframe to edit · Drag to reposition · Delete key to remove"}
        </div>
      )}
    </div>
  );
};

export default ZoomTimeline;
