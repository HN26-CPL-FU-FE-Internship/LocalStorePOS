import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { publicRoutes } from './routes';

function App() {
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

                        return (
                            <Route
                                key={index}
                                path={route.path}
                                element={
                                    <Layout>
                                        <Page />
                                    </Layout>
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
