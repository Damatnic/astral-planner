/**
 * JSON-LD Structured Data Component
 * Injects structured data for enhanced search engine understanding
 */

'use client';

import { useEffect } from 'react';

interface JsonLdProps {
  data: object | object[];
}

export function JsonLd({ data }: JsonLdProps) {
  useEffect(() => {
    // Ensure we're in the browser environment
    if (typeof window === 'undefined') return;

    // Convert data to array if it's a single object
    const dataArray = Array.isArray(data) ? data : [data];

    // Create and inject script tags for each structured data object
    dataArray.forEach((item, index) => {
      const scriptId = `jsonld-${index}-${Date.now()}`;
      
      // Remove existing script if it exists
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }

      // Create new script element
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(item);
      
      // Append to head
      document.head.appendChild(script);
    });

    // Cleanup function to remove scripts when component unmounts
    return () => {
      dataArray.forEach((_, index) => {
        const scriptId = `jsonld-${index}-${Date.now()}`;
        const script = document.getElementById(scriptId);
        if (script) {
          script.remove();
        }
      });
    };
  }, [data]);

  // This component doesn't render anything visible
  return null;
}

/**
 * Server-side JSON-LD component for Next.js App Router
 * Use this in server components for better SEO
 */
export function JsonLdScript({ data }: JsonLdProps) {
  const dataArray = Array.isArray(data) ? data : [data];

  return (
    <>
      {dataArray.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item, null, 0),
          }}
        />
      ))}
    </>
  );
}

export default JsonLd;