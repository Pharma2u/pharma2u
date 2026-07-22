export const vendorStyles = {
  shell: "min-h-screen bg-slate-50 text-slate-900",
  header:
    "sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur",
  headerInner:
    "mx-auto flex min-h-[72px] w-[min(100%-32px,1540px)] items-center justify-between gap-5 max-[560px]:min-h-[62px] max-[560px]:gap-2.5",
  brand: "flex min-w-0 items-center gap-4",
  logo: "h-[38px] w-[118px] object-contain max-[560px]:w-[100px]",
  brandCopy: "border-l border-slate-200 pl-4 max-[920px]:hidden",
  kicker:
    "m-0 text-[11px] font-extrabold uppercase tracking-[0.16em] text-teal-700",
  account: "flex items-center gap-2.5",
  accountName:
    "rounded-xl bg-slate-100 px-3.5 py-2.5 text-[13px] font-bold max-[560px]:hidden",
  secondaryButton:
    "rounded-[10px] border border-slate-300 bg-white px-3.5 py-2 text-[13px] font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-600/30",
  layout:
    "mx-auto grid w-[min(100%-32px,1540px)] grid-cols-[256px_minmax(0,1fr)] gap-[22px] py-[22px] pb-10 max-[1080px]:grid-cols-[220px_minmax(0,1fr)] max-[1080px]:gap-4 max-[920px]:w-[min(100%-22px,1540px)] max-[920px]:grid-cols-1",
  sidebar: "sticky top-[94px] max-h-[calc(100vh-116px)] self-start overflow-y-auto rounded-[20px] border border-slate-200 bg-white p-3 shadow-[0_10px_32px_rgba(15,38,50,0.05)] max-[1080px]:static max-[1080px]:max-h-none max-[920px]:fixed max-[920px]:inset-y-0 max-[920px]:left-0 max-[920px]:z-50 max-[920px]:w-[min(86vw,320px)] max-[920px]:max-h-none max-[920px]:rounded-none max-[920px]:p-3 max-[920px]:transition-transform max-[920px]:duration-200",
  navSection: "[&+&]:mt-[15px] [&+&]:border-t [&+&]:border-slate-100 [&+&]:pt-[13px]",
  navHeading: "mx-2.5 mb-[7px] text-[9px] font-extrabold tracking-[0.16em] text-slate-400",
  navItem:
    "group grid w-full grid-cols-[34px_minmax(0,1fr)] items-center gap-2 rounded-xl p-2.5 text-left text-slate-600 transition hover:bg-teal-50 hover:text-teal-800 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-600/30 max-[920px]:min-h-[54px] max-[920px]:grid-cols-[30px_minmax(0,1fr)] max-[920px]:gap-[7px] max-[920px]:p-2",
  navItemActive: "border border-teal-200 bg-teal-100 text-teal-950 shadow-sm hover:bg-teal-100 hover:text-teal-950",
  navIcon:
    "grid h-8 w-8 place-items-center rounded-[9px] bg-teal-50 text-sm font-extrabold text-teal-700 max-[920px]:h-[30px] max-[920px]:w-[30px]",
  navCopy: "min-w-0",
  navLabel: "block text-xs font-bold leading-[1.3] max-[560px]:text-[11px]",
  navDetail: "mt-0.5 block truncate text-[10px] leading-[1.35] text-slate-400 group-hover:text-teal-800",
  sidebarOpen: "max-[920px]:translate-x-0",
  sidebarClosed: "max-[920px]:-translate-x-full",
  mobileMenu: "hidden h-10 w-10 place-items-center rounded-lg border border-slate-300 text-xl text-slate-700 max-[920px]:grid",
  mobileClose: "mb-3 ml-auto grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-lg text-slate-700 min-[921px]:hidden",
  content: "min-w-0",
  hero: "relative min-h-[145px] overflow-hidden rounded-[24px] bg-gradient-to-br from-teal-950 via-teal-700 to-teal-600 px-8 py-7 text-white shadow-[0_16px_40px_rgba(6,78,69,0.17)] max-[920px]:p-6 max-[560px]:min-h-[130px] max-[560px]:p-[22px]",
  heroTitle:
    "relative z-10 my-2 text-[clamp(24px,3vw,32px)] font-bold leading-[1.15] tracking-[-0.035em] max-[560px]:text-2xl",
  heroDescription:
    "relative z-10 m-0 max-w-[760px] text-[13px] leading-relaxed text-teal-100 max-[560px]:text-xs",
  section: "mt-5",
  card: "rounded-[20px] border border-slate-200 bg-white p-[22px] shadow-[0_8px_24px_rgba(15,38,50,0.035)] max-[560px]:p-[18px]",
  cardHeader: "flex items-start justify-between gap-4 max-[560px]:flex-col",
  cardTitle: "mt-1 text-[19px] font-bold leading-[1.3] tracking-[-0.02em]",
  muted: "mt-1 text-xs leading-relaxed text-slate-500",
  eyebrow:
    "m-0 text-[10px] font-extrabold uppercase tracking-[0.15em] text-teal-700",
  metrics:
    "grid grid-cols-4 gap-3.5 max-[1080px]:grid-cols-2 max-[560px]:grid-cols-1",
  metric:
    "min-w-0 rounded-[17px] border border-t-[3px] border-slate-200 border-t-teal-600 bg-white px-[18px] py-[17px] shadow-sm",
  metricLabel: "m-0 text-[11px] font-bold text-slate-500",
  metricValue: "my-2 block truncate text-2xl font-bold tracking-[-0.04em]",
  metricDetail: "text-[10px] text-slate-400",
  dashboardGrid:
    "mt-[18px] grid grid-cols-[minmax(0,1.55fr)_minmax(290px,0.85fr)] gap-[18px] max-[1080px]:grid-cols-1",
  orderList: "mt-4",
  orderRow:
    "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3.5 border-t border-slate-100 py-3.5",
  orderCode: "m-0 text-[13px] font-extrabold",
  orderMeta: "mt-0.5 text-[11px] text-slate-500",
  orderAmount: "text-right text-[13px] font-extrabold",
  status: "mt-0.5 block text-[10px] font-extrabold capitalize text-teal-700",
  darkCard:
    "rounded-[20px] bg-gradient-to-br from-slate-900 to-slate-950 p-6 text-white shadow-lg",
  darkValue: "my-5 block text-[34px] font-bold tracking-[-0.04em]",
  darkMuted: "m-0 text-xs text-slate-300",
  rows: "mt-7 grid gap-3.5",
  row: "flex justify-between gap-4 text-xs text-slate-500 [&_strong]:text-slate-900",
  darkRow: "text-slate-300 [&_strong]:!text-white",
  filters: "mt-[18px] flex flex-wrap gap-2",
  filter:
    "rounded-full border border-slate-300 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 focus-visible:outline focus-visible:outline-3 focus-visible:outline-teal-600/30",
  filterActive: "border-teal-600 bg-teal-50 text-teal-700",
  badge:
    "self-start rounded-full bg-blue-50 px-2.5 py-[7px] text-[10px] font-bold text-blue-700",
  table: "mt-4 overflow-hidden rounded-[14px] border border-slate-200",
  tableHead:
    "grid grid-cols-[minmax(240px,1.5fr)_minmax(130px,0.7fr)_100px] items-center gap-4 bg-slate-50 px-3.5 py-3 text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-500 max-[560px]:hidden",
  tableRow:
    "grid grid-cols-[minmax(240px,1.5fr)_minmax(130px,0.7fr)_100px] items-center gap-4 border-t border-slate-100 p-3.5 text-xs max-[560px]:grid-cols-[minmax(0,1fr)_auto] max-[560px]:items-start max-[560px]:gap-2.5 max-[560px]:px-3",
  alignRight: "text-right",
  empty: "p-9 text-center text-xs text-slate-500",
  twoColumns:
    "grid grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)] gap-[18px] max-[1080px]:grid-cols-1",
  equalColumns: "grid grid-cols-2 gap-[18px] max-[920px]:grid-cols-1",
  formGrid: "mt-[18px] grid grid-cols-2 gap-3.5 max-[560px]:grid-cols-1",
  field:
    "grid gap-1.5 text-[11px] font-bold text-slate-600 [&_input]:w-full [&_input]:rounded-[10px] [&_input]:border [&_input]:border-slate-300 [&_input]:p-2.5 [&_select]:w-full [&_select]:rounded-[10px] [&_select]:border [&_select]:border-slate-300 [&_select]:p-2.5",
  primaryButton:
    "rounded-[10px] bg-teal-700 px-[15px] py-2.5 text-xs font-extrabold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-600/30",
  formActions:
    "mt-[18px] flex justify-end max-[560px]:justify-stretch [&_.primaryButton]:max-[560px]:w-full",
  totalBox:
    "mt-[18px] flex items-center justify-between rounded-[13px] bg-teal-50 p-3.5 text-teal-800 [&_strong]:text-[23px]",
  notice: "mt-3.5 rounded-[10px] bg-teal-50 p-2.5 text-[11px] text-teal-700",
  error: "mt-3.5 rounded-[10px] bg-red-50 p-2.5 text-[11px] text-red-700",
  toggleRow:
    "mt-4 flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-3 text-[11px] font-bold text-slate-600",
  checkbox: "m-0 h-[17px] w-[17px] accent-teal-700",
  segmented: "flex rounded-[10px] border border-slate-300 bg-slate-50 p-[3px]",
  segment:
    "rounded-[7px] px-3 py-[7px] text-[10px] font-extrabold capitalize text-slate-500",
  segmentActive: "bg-teal-800 text-white shadow",
  summaryStrip:
    "mt-[18px] grid grid-cols-3 gap-5 rounded-[14px] bg-slate-50 p-[17px] max-[560px]:grid-cols-1",
  fundingCard:
    "rounded-[20px] bg-gradient-to-br from-teal-800 to-teal-950 p-6 text-white",
  fundingItem:
    "mt-5 text-xs leading-relaxed text-teal-100 [&_strong]:block [&_strong]:text-white",
  reportTotal: "border-t border-slate-200 pt-3.5",
  privacyNote:
    "mt-4 flex items-start gap-2.5 rounded-xl bg-blue-50 p-3 text-[11px] leading-relaxed text-blue-900",
} as const;
