import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700.css';
import '@fontsource/cormorant-garamond/600-italic.css';
import '@fontsource/eb-garamond/400.css';
import '@fontsource/eb-garamond/500.css';
import '@fontsource/eb-garamond/700.css';
import '@fontsource/eb-garamond/400-italic.css';
import '@fontsource/tiro-gurmukhi/400.css';
import '@fontsource/noto-serif-gurmukhi/500.css';
import '@fontsource/rozha-one/400.css';
import '@fontsource/langar/400.css';
import './ui/styles.css';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { paperDataUrl } from './art/paper';
import { goldBorder } from './art/phulkari';
import { installOrnament } from './art/ornament';
import { useStore } from './store';

const root = document.documentElement;
root.style.setProperty('--paper-tex', `url(${paperDataUrl()})`);
root.style.setProperty('--gold-border', goldBorder());
installOrnament(root);

createRoot(document.getElementById('root')!).render(<App />);

// Development hook for automated screenshots and debugging.
if (import.meta.env.DEV) (window as unknown as { __store: typeof useStore }).__store = useStore;
