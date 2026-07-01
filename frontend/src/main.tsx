import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';

import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App.tsx';
import GlobalStyles from '@/components/GlobalStyles';
import { queryClient } from '@/lib/queryClient.ts';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <ReactQueryDevtools initialIsOpen={false} />
            <GlobalStyles>
                <App />
            </GlobalStyles>
        </QueryClientProvider>
    </StrictMode>,
);
