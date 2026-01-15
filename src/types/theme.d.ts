import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    custom: {
      gradient: {
        primary: string;
        primaryHover: string;
      };
      glassmorphism: {
        light: string;
        medium: string;
        heavy: string;
      };
      subtle: {
        background: string;
        hover: string;
      };
    };
  }

  interface ThemeOptions {
    custom?: {
      gradient?: {
        primary?: string;
        primaryHover?: string;
      };
      glassmorphism?: {
        light?: string;
        medium?: string;
        heavy?: string;
      };
      subtle?: {
        background?: string;
        hover?: string;
      };
    };
  }
}
