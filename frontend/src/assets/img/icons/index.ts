// 1. Import tất cả các file SVG và PNG trong thư mục
import checkedImg from './checked-img.svg';
import creditCard from './credit-card.svg';
import dollarSign from './dollar-sign.svg';
import fb from './fb.svg';
import google from './google.svg';
import gupshup from './gupshup.svg';
import hide from './hide.svg';
import landmark from './landmark.svg';
import mailIcon from './mail-icon.svg';
import mobilePhone from './mobile-phone.svg';
import pauseIcon from './pause-icon.svg';
import printNode from './print-node.svg';
import qrCode from './qr-code.svg';
import qrImg from './qr-img.svg';
import receiptText from './receipt-text.svg';
import russianRuble from './russian-ruble.svg';
import search from './search.svg';
import spark from './spark.png'; // Lưu ý file này là PNG
import startIcon from './start-icon.svg';
import trashIcon from './trash-icon.svg';
import wallet from './wallet.svg';

// 2. Export gom chung thành một Object tổng để dễ truy cập động qua tên key
const icons = {
    'checked-img': checkedImg,
    'credit-card': creditCard,
    'dollar-sign': dollarSign,
    fb,
    google,
    gupshup,
    hide,
    landmark,
    'mail-icon': mailIcon,
    'mobile-phone': mobilePhone,
    'pause-icon': pauseIcon,
    'print-node': printNode,
    'qr-code': qrCode,
    'qr-img': qrImg,
    'receipt-text': receiptText,
    'russian-ruble': russianRuble,
    search,
    spark,
    'start-icon': startIcon,
    'trash-icon': trashIcon,
    wallet,
};

export default icons;
