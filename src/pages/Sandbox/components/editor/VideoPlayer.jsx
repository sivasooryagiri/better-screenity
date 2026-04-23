import React, { useContext, useEffect, useState, useRef, useMemo } from "react";
import { default as Plyr } from "plyr-react";
import "plyr-react/plyr.css";
import { ContentStateContext } from "../../context/ContentState";

// Smooth ease-in-out interpolation between keyframes
const easeInOut = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

const interpolateZoom = (keyframes, time) => {
  if (!keyframes || keyframes.length === 0) return { zoom: 1, x: 0.5, y: 0.5 };
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);
  if (time <= sorted[0].time) return sorted[0];
  if (time >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1];
  let i = 0;
  while (i < sorted.length - 1 && sorted[i + 1].time <= time) i++;
  const k1 = sorted[i];
  const k2 = sorted[i + 1];
  const rawT = (time - k1.time) / (k2.time - k1.time);
  const t = easeInOut(rawT);
  return {
    zoom: k1.zoom + (k2.zoom - k1.zoom) * t,
    x: k1.x + (k2.x - k1.x) * t,
    y: k1.y + (k2.y - k1.y) * t,
  };
};

const VideoPlayer = (props) => {
  const [contentState, setContentState] = useContext(ContentStateContext);
  const playerRef = useRef(null);
  const zoomWrapRef = useRef(null);
  const zoomKeyframesRef = useRef(contentState.zoomKeyframes);
  const rafRef = useRef(null);
  const [url, setUrl] = useState(null);
  const [source, setSource] = useState(null);
  const [isSet, setIsSet] = useState(false);

  // Keep keyframes ref in sync so RAF loop always sees latest without re-running
  useEffect(() => {
    zoomKeyframesRef.current = contentState.zoomKeyframes;
  }, [contentState.zoomKeyframes]);

  // 60fps RAF loop — reads video time directly, applies zoom without React rerenders
  useEffect(() => {
    const applyZoom = () => {
      if (zoomWrapRef.current && playerRef.current?.plyr) {
        const t = playerRef.current.plyr.currentTime || 0;
        const { zoom, x, y } = interpolateZoom(zoomKeyframesRef.current, t);
        const el = zoomWrapRef.current;
        if (zoom <= 1.001) {
          el.style.transform = "none";
        } else {
          el.style.transformOrigin = `${x * 100}% ${y * 100}%`;
          el.style.transform = `scale(${zoom})`;
        }
      }
      rafRef.current = requestAnimationFrame(applyZoom);
    };
    rafRef.current = requestAnimationFrame(applyZoom);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    if (
      playerRef.current &&
      playerRef.current.plyr &&
      contentState.updatePlayerTime
    ) {
      playerRef.current.plyr.currentTime = contentState.time;
    }
  }, [contentState.time]);

  const options = useMemo(
    () => ({
      controls: ["play", "mute", "captions", "settings", "pip", "fullscreen"],
      ratio: "16:9",
      blankVideo:
        "chrome-extension://" +
        chrome.i18n.getMessage("@@extension_id") +
        "/assets/blank.mp4",
      keyboard: { global: true },
    }),
    []
  );

  useEffect(() => {
    if (contentState.blob) {
      const objectURL = URL.createObjectURL(contentState.blob);
      setSource({
        type: "video",
        sources: [{ src: objectURL, type: "video/mp4" }],
      });
      setUrl(objectURL);
      return () => URL.revokeObjectURL(objectURL);
    }
  }, [contentState.blob, playerRef]);

  useEffect(() => {
    if (playerRef.current && playerRef.current.plyr) {
      playerRef.current.plyr.on("timeupdate", () => {
        setContentState((prev) => ({
          ...prev,
          time: playerRef.current.plyr.currentTime,
          updatePlayerTime: false,
        }));
      });
    }
    return () => {
      if (playerRef.current && playerRef.current.plyr) {
        playerRef.current.plyr.off("timeupdate");
      }
    };
  }, [playerRef]);

  const handleClick = () => {
    if (isSet) return;
    if (playerRef.current && playerRef.current.plyr) {
      setIsSet(true);
      playerRef.current.plyr.on("timeupdate", () => {
        setContentState((prev) => ({
          ...prev,
          time: playerRef.current.plyr.currentTime,
          updatePlayerTime: false,
        }));
      });
    }
  };

  useEffect(() => {
    if (isSet) return;
    const handleKeyPress = () => {
      if (playerRef.current && playerRef.current.plyr) {
        setIsSet(true);
        playerRef.current.plyr.on("timeupdate", () => {
          setContentState((prev) => ({
            ...prev,
            time: playerRef.current.plyr.currentTime,
            updatePlayerTime: false,
          }));
        });
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isSet]);

  return (
    <div className="videoPlayer">
      <div className="playerWrap" onClick={handleClick}>
        <div ref={zoomWrapRef} style={{ width: "100%", height: "100%" }}>
          {url && (
            <Plyr
              ref={playerRef}
              id="plyr-player"
              source={source}
              options={options}
            />
          )}
        </div>
      </div>
      <style>{`
        .plyr { height: 90%!important; }
        @media (max-width: 900px) {
          .videoPlayer { height: 100%!important; top: 40px!important; }
          .playerWrap { height: calc(100% - 300px)!important; }
        }
      `}</style>
    </div>
  );
};

export default VideoPlayer;
