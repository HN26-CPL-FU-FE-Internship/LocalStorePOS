import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { publicRoutes } from './routes';
import useContextData from './hooks/useContextData';
import type { ThemeContextType } from './provider/ThemeProvider/ThemeContext';
import ThemeContext from './provider/ThemeProvider/ThemeContext';
import AuthGuard from './components/common/AuthGuard';
import { PUBLIC_ROUTES } from './types/permission';
import { useEffect } from 'react';
import { connectWebSocket } from './websocket';

function App() {
    const { theme } = useContextData<ThemeContextType>(ThemeContext);

    useEffect(() => {
        document.documentElement.setAttribute('data-bs-theme', theme);
        document.documentElement.setAttribute('data-sidebar', theme);
    }, [theme]);

    useEffect(() => {
        connectWebSocket();
    }, []);
    return (
        <BrowserRouter basename="/restaurant-pos">
            <div className="app">
                <Routes>
                    <Route path="/" element={<Navigate to={`/login`} />} />

                    {publicRoutes.map((route, index) => {
                        let Layout = route.layout;

                        if (route.layout) {
                            Layout = route.layout;
                        } else if (route.layout === null) {
                            Layout = ({ children }: { children: React.ReactNode }) => <>{children}</>;
                        }

                        const Page = route.component;
                        const isPublic = PUBLIC_ROUTES.includes(route.path);
                        return (
                            <Route
                                key={index}
                                path={route.path}
                                element={
                                    <AuthGuard publicRoute={isPublic}>
                                        <Layout>
                                            <Page />
                                        </Layout>
                                    </AuthGuard>
                                }
                            />
                        );
                    })}
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
