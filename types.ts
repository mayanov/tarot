import { ReactNode } from 'react';

export interface SectionProps {
  id?: string;
  className?: string;
}

export interface FadeInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export interface ServiceCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  link: string;
  ctaText: string;
  isPopular?: boolean;
  isPremium?: boolean;
  onBook: () => void;
}
