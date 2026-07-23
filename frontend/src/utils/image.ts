import foodImages from '@/assets/img/food';
import itemImages from '@/assets/img/items';

export function getFoodImage(index: number): string {
    const keys = Object.keys(foodImages) as (keyof typeof foodImages)[];
    return foodImages[keys[index % keys.length]];
}

export function getItemImage(index: number): string {
    const keys = Object.keys(itemImages) as (keyof typeof itemImages)[];
    return itemImages[keys[index % keys.length]];
}
