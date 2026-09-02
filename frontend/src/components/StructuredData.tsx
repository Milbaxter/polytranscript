import React from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface StructuredDataProps {
  title: string;
  description: string;
  url: string;
  faqs?: FAQItem[];
}

export const StructuredData: React.FC<StructuredDataProps> = ({ title, description, url, faqs = [] }) => {
  const schema: any = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        'name': 'PolyTranscript',
        'applicationCategory': 'MultimediaApplication',
        'operatingSystem': 'Web, macOS, Windows, Linux',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD',
        },
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': '4.9',
          'ratingCount': '1240',
        },
        'description': description,
        'url': url,
      },
      {
        '@type': 'WebSite',
        'name': 'PolyTranscript',
        'url': 'https://polytranscript.com',
      }
    ]
  };

  if (faqs.length > 0) {
    schema['@graph'].push({
      '@type': 'FAQPage',
      'mainEntity': faqs.map((faq) => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.answer,
        },
      })),
    });
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};
