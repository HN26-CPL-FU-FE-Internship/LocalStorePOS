// 1. Import tất cả các file SVG trong thư mục tables (lưu ý số bị nhảy cóc)
import tables01 from './tables-01.svg';
import tables02 from './tables-02.svg';
import tables04 from './tables-04.svg';
import tables05 from './tables-05.svg';
import tables06 from './tables-06.svg';
import tables14 from './tables-14.svg';
import tables17 from './tables-17.svg';
import tables18 from './tables-18.svg';
import tables19 from './tables-19.svg';

// 2. Export gom chung thành một Object tổng
const tableImages = {
    'tables-01': tables01,
    'tables-02': tables02,
    'tables-04': tables04,
    'tables-05': tables05,
    'tables-06': tables06,
    'tables-14': tables14,
    'tables-17': tables17,
    'tables-18': tables18,
    'tables-19': tables19,
};

export default tableImages;
