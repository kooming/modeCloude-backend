const multer = require('multer');
const path = require('path');


// const storage = multer.diskStorage({
//   destination(req, file, cb) {
//     cb(null, 'public/upload'); 
//   },
//   filename(req, file, cb) {
//     const ext = path.extname(file.originalname); 
//     const filename = `img_${Date.now()}${ext}`;
//     cb(null, filename);
//   }
// });

// const fileFilter = (req, file, cb) => {
//   const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg'];
//   if (allowedTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only .png, .jpg, .jpeg files are allowed'), false);
//   }
// };

// exports.upload = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: 10 * 1024 * 1024 }
// });


// const multer = require('multer');
// const path = require('path');

exports.upload = multer({
    storage: multer.diskStorage({
        destination(req, res, cb) {
            cb(null, 'public/upload');
        },
        filename(req, file, cb) {
            const ext = path.extname(file.originalname);
            let filename = Buffer.from(path.basename(file.originalname, ext), 'latin1').toString('utf8');
            filename = filename + "_" + Date.now() + ext;    
            cb(null, filename);
        }
    }),
    limits: { fileSize: 10 * 1024 * 1024 }
});