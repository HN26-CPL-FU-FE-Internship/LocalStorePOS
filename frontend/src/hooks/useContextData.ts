import { useContext, type Context } from 'react';

const useContextData = <T>(context: Context<T | undefined>) => {
    const data = useContext(context);

    if (!data) throw new Error('Data is not valid');

    return data;
};

export default useContextData;
