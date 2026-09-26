/* A small, consistent icon set drawn on a 16px grid with a 1.5px stroke. */
type P = { size?: number; title?: string };
const S = ({ size = 16, title, children }: P & { children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}>
    {title && <title>{title}</title>}
    {children}
  </svg>
);
export const Check = (p: P) => <S {...p}><path d="M3 8.5l3 3 7-7" /></S>;
export const Cross = (p: P) => <S {...p}><path d="M4 4l8 8M12 4l-8 8" /></S>;
export const Edge = (p: P) => <S {...p}><path d="M8 2.5v11M3 8h3M10 8h3" /></S>;
export const Question = (p: P) => <S {...p}><path d="M6 6a2 2 0 1 1 3 1.7c-.6.4-1 .8-1 1.5M8 11.5v.01" /></S>;
export const Arrow = (p: P) => <S {...p}><path d="M4 12L12 4M6 4h6v6" /></S>;
export const Sun = (p: P) => <S {...p}><circle cx="8" cy="8" r="3" /><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M3 13l1-1M12 4l1-1" /></S>;
export const Moon = (p: P) => <S {...p}><path d="M13 9.5A5.5 5.5 0 0 1 6.5 3a5.5 5.5 0 1 0 6.5 6.5z" /></S>;
export const Search = (p: P) => <S {...p}><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></S>;
export const Gap = (p: P) => <S {...p}><path d="M8 2l6.5 11.5h-13z" /><path d="M8 6.5v3M8 11.5v.01" /></S>;
export const Download = (p: P) => <S {...p}><path d="M8 2v8M4.5 7L8 10.5 11.5 7M3 13.5h10" /></S>;
export const Upload = (p: P) => <S {...p}><path d="M8 11V3M4.5 6L8 2.5 11.5 6M3 13.5h10" /></S>;
export const Doc = (p: P) => <S {...p}><path d="M4 1.5h5.5L12.5 4.5V14.5h-8.5z" /><path d="M9.5 1.5v3h3" /></S>;
export const Dot = (p: P) => <S {...p}><circle cx="8" cy="8" r="2.5" fill="currentColor" /></S>;
