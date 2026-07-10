import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'simplebar-react/dist/simplebar.min.css';
import App from './App.tsx';
import { queryClient } from '@/lib/queryClient.ts';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import GlobalStyles from './components/GlobalStyles/index.tsx';
import ThemeProvider from './provider/ThemeProvider/index.tsx';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <ReactQueryDevtools initialIsOpen={false} />
            <GlobalStyles>
                <ThemeProvider>
                    <App />
                </ThemeProvider>
            </GlobalStyles>
        </QueryClientProvider>
    </StrictMode>,
);
