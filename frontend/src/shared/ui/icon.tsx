/** Íconos de trazo (24×24) con el mismo estilo de los diseños de Homy. */
const paths = {
  home: "M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.5H9v5.5H5.5A1.5 1.5 0 0 1 4 19v-8.5Z",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm9 2-4-4",
  briefcase: "M4 8h16v11H4zM9 8V5.5h6V8M4 13h16",
  calendar: "M5 5.5h14v14H5zM5 10h14M9 3.5v4M15 3.5v4",
  clock: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-12v4l2.5 2.5",
  file: "M7 3.5h7l4 4v13H7zM14 3.5v4h4M10 12h5M10 16h5",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8.5c0-3.6 3.1-6 7-6s7 2.4 7 6",
  bell: "M18 9.5a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 15.5 18 9.5ZM10.3 20a2 2 0 0 0 3.4 0",
  refresh: "M20 11.5A8 8 0 0 0 6.3 6.3L4 8.5M4 4v4.5h4.5M4 12.5a8 8 0 0 0 13.7 5.2L20 15.5M20 20v-4.5h-4.5",
  pin: "M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  check: "m5 12.5 4.5 4.5L19 7.5",
  checkCircle: "M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17Zm-3.5-8.5 2.5 2.5 4.5-5",
  x: "M6 6l12 12M18 6 6 18",
  plus: "M12 5v14M5 12h14",
  chevronRight: "m9 6 6 6-6 6",
  arrowLeft: "M19 12H5m0 0 6-6m-6 6 6 6",
  alert: "M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17ZM12 8v5m0 3h.01",
  bolt: "M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z",
  droplet: "M12 3.5s-6 6.6-6 11a6 6 0 0 0 12 0c0-4.4-6-11-6-11Z",
  washer: "M5.5 3.5h13v17h-13zM5.5 7.5h13M8.5 5.5h.01M12 18a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  brush: "M14.5 4.5 19.5 9.5 12 17l-5-5 7.5-7.5ZM7 12l-2.5 2.5A3 3 0 0 0 4 17.5V20h2.5a3 3 0 0 0 3-.5L12 17",
  leaf: "M5 19c0-8 5-14 15-14 0 10-6 15-14 15M5 19l8-8",
  sparkle: "M12 3.5 13.8 10.2 20.5 12 13.8 13.8 12 20.5 10.2 13.8 3.5 12 10.2 10.2 12 3.5Z",
  shieldClock: "M12 3.5 5 6v5.5c0 4.3 3 7.7 7 9 4-1.3 7-4.7 7-9V6l-7-2.5ZM12 8.5V12l2.2 1.5",
  shield: "M12 3.5 5 6v5.5c0 4.3 3 7.7 7 9 4-1.3 7-4.7 7-9V6l-7-2.5Zm-3 8.5 2 2 4-4",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M5.5 11h13v9.5h-13z",
  logout: "M10 12h10M16 8l4 4-4 4M14 4H5v16h9",
  menu: "M4 7h16M4 12h16M4 17h16",
  upload: "M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5M5 15v4.5h14V15",
  camera: "M4 8h3l2-2.5h6L17 8h3v11.5H4zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
  edit: "M4 20h4L19 9l-4-4L4 16v4Zm9.5-13.5 4 4",
  trash: "M5 7h14M10 7V4.5h4V7m-7 0 1 13h8l1-13",
  flag: "M5 21V4m0 0h11l-2 4 2 4H5",
  chat: "M4.5 19.5 5.6 16A7.8 7.8 0 1 1 8.4 18.6l-3.9.9Z",
  whatsapp: "M4.5 19.5 5.6 16A7.8 7.8 0 1 1 8.4 18.6l-3.9.9Z",
  eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Zm9.5 2.8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6Z",
  eyeOff: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Zm9.5 2.8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6ZM4 4l16 16",
  tool: "M14.5 6.5a4 4 0 0 0-5.3 5.3L4 17v3h3l5.2-5.2a4 4 0 0 0 5.3-5.3l-2.5 2.5-2.5-.5-.5-2.5 2.5-2.5Z",
  star: "M12 3.8l2.4 5 5.5.7-4 3.8 1 5.4L12 16.1l-4.9 2.6 1-5.4-4-3.8 5.5-.7 2.4-5Z",
  users: "M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 20c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18.5 14.8c1.8.8 3 2.6 3 5.2",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  filter: "M4 6h16M7 12h10M10 18h4",
  play: "M8 5.5v13l10-6.5-10-6.5Z",
  image: "M4 5h16v14H4zM4 15l4.5-4.5L13 15m-1-1 2.5-2.5L20 17M15.5 9.5h.01",
  tag: "M3.5 12.5V4h8.5l8.5 8.5-8.5 8.5-8.5-8.5Zm4.5-4.5h.01",
  heart: "M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z",
  pause: "M8.5 5v14M15.5 5v14",
  mail: "M3.5 5.5h17v13h-17zM3.5 7.5l8.5 6 8.5-6",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2",
  inbox: "M4 13.5 6.5 5h11l2.5 8.5V19H4zM4 13.5h5l1 2h4l1-2h5",
} as const;

export type IconName = keyof typeof paths;

type IconProps = {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  filled?: boolean;
  title?: string;
};

export default function Icon({ name, size = 20, strokeWidth = 1.8, className, filled, title }: IconProps) {
  return (
    <svg
      aria-hidden={title ? undefined : true}
      className={className}
      fill={filled ? "currentColor" : "none"}
      height={size}
      role={title ? "img" : undefined}
      viewBox="0 0 24 24"
      width={size}
    >
      {title && <title>{title}</title>}
      <path
        d={paths[name]}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}
