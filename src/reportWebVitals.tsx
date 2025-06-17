// reportWebVitals.tsx
import { Metric } from 'web-vitals';

export default function reportWebVitals(onPerfEntry: (metric: Metric) => void) {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getLCP }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getLCP(onPerfEntry);
    });
  }
}
