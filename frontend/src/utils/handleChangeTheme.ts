import type { ThemeType } from '@/types';

const handleChangeTheme = (toggleTheme: () => void, setIconName: React.Dispatch<React.SetStateAction<ThemeType>>) => {
    toggleTheme();
    setIconName((prev) => (prev === 'moon' ? 'sun' : 'moon'));
};

export default handleChangeTheme;
