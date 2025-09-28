/**
 * Semantic Markup Components for Enhanced SEO and Accessibility
 * WCAG 2.1 AA compliant components with proper semantic structure
 */

import React from 'react';

// Skip Navigation Link
export function SkipNavigation() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50 
                 transition-all duration-200 focus:ring-2 focus:ring-ring focus:ring-offset-2"
      tabIndex={1}
    >
      Skip to main content
    </a>
  );
}

// Main Content Wrapper
interface MainContentProps {
  children: React.ReactNode;
  className?: string;
}

export function MainContent({ children, className = '' }: MainContentProps) {
  return (
    <main
      id="main-content"
      role="main"
      className={className}
      tabIndex={-1}
    >
      {children}
    </main>
  );
}

// Section with proper heading hierarchy
interface SectionProps {
  title?: string;
  titleLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  id?: string;
}

export function Section({
  title,
  titleLevel = 2,
  children,
  className = '',
  ariaLabel,
  id,
}: SectionProps) {
  const HeadingTag = `h${titleLevel}` as keyof JSX.IntrinsicElements;

  return (
    <section
      className={className}
      aria-label={ariaLabel}
      id={id}
    >
      {title && (
        <HeadingTag className="text-2xl font-bold mb-4">
          {title}
        </HeadingTag>
      )}
      {children}
    </section>
  );
}

// Article wrapper for content
interface ArticleProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
}

export function Article({
  title,
  children,
  className = '',
  publishedTime,
  modifiedTime,
  author,
}: ArticleProps) {
  return (
    <article
      className={className}
      itemScope
      itemType="http://schema.org/Article"
    >
      {title && (
        <header>
          <h1 className="text-3xl font-bold mb-4" itemProp="headline">
            {title}
          </h1>
          {(publishedTime || modifiedTime || author) && (
            <div className="text-sm text-muted-foreground mb-6">
              {author && (
                <span itemProp="author" itemScope itemType="http://schema.org/Person">
                  By <span itemProp="name">{author}</span>
                </span>
              )}
              {publishedTime && (
                <time
                  dateTime={publishedTime}
                  itemProp="datePublished"
                  className="ml-2"
                >
                  Published: {new Date(publishedTime).toLocaleDateString()}
                </time>
              )}
              {modifiedTime && (
                <time
                  dateTime={modifiedTime}
                  itemProp="dateModified"
                  className="ml-2"
                >
                  Updated: {new Date(modifiedTime).toLocaleDateString()}
                </time>
              )}
            </div>
          )}
        </header>
      )}
      <div itemProp="articleBody">
        {children}
      </div>
    </article>
  );
}

// Navigation with proper ARIA
interface NavigationProps {
  children: React.ReactNode;
  ariaLabel: string;
  className?: string;
  role?: 'navigation' | 'menu' | 'menubar';
}

export function Navigation({
  children,
  ariaLabel,
  className = '',
  role = 'navigation',
}: NavigationProps) {
  return (
    <nav
      role={role}
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </nav>
  );
}

// Accessible Button with proper semantics
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
}

export function AccessibleButton({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText = 'Loading...',
  disabled,
  className = '',
  ...props
}: AccessibleButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  };
  
  const sizeClasses = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 py-2',
    lg: 'h-11 px-8',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      aria-describedby={isLoading ? 'loading-state' : undefined}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          <span id="loading-state">{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

// Accessible Form Field
interface FormFieldProps {
  id: string;
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  description?: string;
  className?: string;
}

export function FormField({
  id,
  label,
  children,
  error,
  required = false,
  description,
  className = '',
}: FormFieldProps) {
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  return (
    <div className={`space-y-2 ${className}`}>
      <label
        htmlFor={id}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      <div>
        {React.cloneElement(children as React.ReactElement, {
          id,
          'aria-describedby': [
            description ? descriptionId : '',
            error ? errorId : '',
          ].filter(Boolean).join(' ') || undefined,
          'aria-invalid': error ? 'true' : undefined,
          'aria-required': required,
        })}
      </div>
      
      {error && (
        <p
          id={errorId}
          className="text-sm text-destructive"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// Accessible Link
interface AccessibleLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  download?: boolean;
  className?: string;
}

export function AccessibleLink({
  href,
  children,
  external = false,
  download = false,
  className = '',
  ...props
}: AccessibleLinkProps) {
  const isExternal = external || (href.startsWith('http') && !href.includes(window?.location?.hostname));

  return (
    <a
      href={href}
      className={`text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      aria-describedby={isExternal ? 'external-link-description' : undefined}
      download={download}
      {...props}
    >
      {children}
      {isExternal && (
        <>
          <span className="sr-only"> (opens in new window)</span>
          <span id="external-link-description" className="sr-only">
            This link opens in a new window
          </span>
        </>
      )}
    </a>
  );
}

// Landmark regions for better screen reader navigation
export function LandmarkRegions() {
  return (
    <div className="sr-only">
      <h2>Page Landmarks</h2>
      <ul>
        <li><a href="#main-content">Main Content</a></li>
        <li><a href="#primary-navigation">Primary Navigation</a></li>
        <li><a href="#footer">Footer</a></li>
      </ul>
    </div>
  );
}

export default {
  SkipNavigation,
  MainContent,
  Section,
  Article,
  Navigation,
  AccessibleButton,
  FormField,
  AccessibleLink,
  LandmarkRegions,
};