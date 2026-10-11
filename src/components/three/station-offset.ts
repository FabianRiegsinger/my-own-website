import { createContext, useContext } from "react";

/** Current scroll position on the station scale (0..1), written each frame by ScrollTracker. */
export const StationOffset = createContext<{ current: number }>({ current: 0 });
export const useStationOffset = () => useContext(StationOffset);
