// 1. Import tất cả các file ảnh JPG trong thư mục users
import user01 from './user-01.jpg';
import user02 from './user-02.jpg';
import user03 from './user-03.jpg';
import user04 from './user-04.jpg';
import user05 from './user-05.jpg';
import user06 from './user-06.jpg';
import user07 from './user-07.jpg';
import user08 from './user-08.jpg';
import user09 from './user-09.jpg';
import user10 from './user-10.jpg';

// 2. Export gom chung thành một Object tổng
const userImages = {
    'user-01': user01,
    'user-02': user02,
    'user-03': user03,
    'user-04': user04,
    'user-05': user05,
    'user-06': user06,
    'user-07': user07,
    'user-08': user08,
    'user-09': user09,
    'user-10': user10,
};

export default userImages;
