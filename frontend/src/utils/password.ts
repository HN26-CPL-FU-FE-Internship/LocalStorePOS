export const toggleHidePassword = (
    inputType: string,
    setInputType: (val: string) => void,
    setIsHide: (val: boolean) => void,
) => {
    if (inputType === 'password') {
        setInputType('text');
        setIsHide(false);
    } else {
        setInputType('password');
        setIsHide(true);
    }
};
