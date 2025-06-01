const multer = require('multer');
const path = require('path');

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
    limits: { fileSize: 5 * 1024 * 1024 }
});

