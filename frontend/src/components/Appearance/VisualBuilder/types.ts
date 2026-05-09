import type { Slot } from "@puckeditor/core";

export type CommonStyles = {
  padding?: { top: number; bottom: number; left: number; right: number };
  margin?: { top: number; bottom: number };
  textAlign?: 'left' | 'center' | 'right';
  textColor?: string;
  backgroundColor?: string;
  borderRadius?: number;
};

export type PuckConfigProps = {
  Container: {
    layoutType: 'flex' | 'grid';
    gridColumns: number;
    gap: number;
    justifyContent?: 'start' | 'center' | 'end' | 'between';
    styles?: CommonStyles;
    content: Slot;
  };
  Hero: {
    title: string;
    subtitle: string;
    ctaText: string;
    bgType: 'color' | 'image' | 'luxury';
    styles?: CommonStyles;
  };
  ProductGrid: {
    title: string;
    columns: number;
    styles?: CommonStyles;
  };
  Footer: {
    text: string;
    styles?: CommonStyles;
  };
  Text: {
    text: string;
    size: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
    styles?: CommonStyles;
  };
  Heading: {
    text: string;
    level: 1 | 2 | 3 | 4;
    styles?: CommonStyles;
  };
  Spacer: {
    height: number;
  };
};

export type RootProps = {
  storeName: string;
  primaryColor: string;
  fontFamily: string;
  logoUrl: string;
};
