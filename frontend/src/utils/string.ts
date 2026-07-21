export const formatString = (value: string) => {
    return value.charAt(0).toUpperCase() + value.slice(1);
};

export function toTitleCase(value: string | undefined): string {
    if (!value) return '';
    return value
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}
