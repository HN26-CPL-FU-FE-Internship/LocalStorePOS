import classNames from 'classnames';

type ClassDictionary = Record<string, boolean | undefined | null>;
type ClassArray = ClassValue[];
type ClassValue = string | number | ClassDictionary | ClassArray | null | undefined | boolean;

export default function bindCx(styles: Record<string, string>) {
    return (...args: ClassValue[]): string => {
        const mapped: ClassValue[] = args.map((arg) => {
            if (typeof arg === 'string') {
                return arg
                    .split(' ')
                    .filter(Boolean)
                    .map((cls) => styles[cls] || cls)
                    .join(' ');
            }
            return arg;
        });
        return classNames(...mapped);
    };
}
